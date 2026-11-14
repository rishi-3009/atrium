import { useEffect, useMemo } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Box3, MathUtils, Mesh, MeshStandardMaterial, PointLight, Vector3, type Object3D } from 'three'
import { useSceneStore } from '../shared/stores'
import type { ModelDefinition } from '../shared/types'
import { anchors, focus } from './focus'
import { PartLabel } from './PartLabel'
import { makePartUniforms, patchMaterial, type PartUniforms } from './partMaterial'

interface Props {
  definition: ModelDefinition
  /** The loaded model, e.g. `gltf.scene`. Parts are found by `meshName`. */
  object: Object3D
  /** How far parts travel at full explode, as a share of the model size. */
  spread?: number
}

interface PartState {
  id: string
  label: string
  node: Object3D
  base: Vector3
  /** Local-space offset at full explode. */
  offset: Vector3
  uniforms: PartUniforms
  /** Spring state for explode progress 0-1. */
  t: number
  v: number
  rim: number
  dim: number
}

const STAGGER = 0.35
const STIFFNESS = 150
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.7

/** Seconds per beat. Slow, about 46 a minute, so it reads as calm. */
const BEAT_PERIOD = 1.3

/** Lub-dub: a strong pulse, then a softer one. 0-1. */
function beatAt(t: number): number {
  const p = (t % BEAT_PERIOD) / BEAT_PERIOD
  const lub = Math.exp(-(((p - 0.1) / 0.06) ** 2))
  const dub = 0.55 * Math.exp(-(((p - 0.3) / 0.07) ** 2))
  return Math.min(1, lub + dub)
}

interface Beat {
  base: number
  /** Groups that swell about their own centre. */
  pulses: Object3D[]
  mats: MeshStandardMaterial[]
  light: PointLight | null
}

function applyBeat(beat: Beat, time: number): void {
  const b = beatAt(time)
  for (const g of beat.pulses) g.scale.setScalar(1 + 0.045 * b)
  for (const m of beat.mats) m.emissiveIntensity = beat.base + 0.5 * b
  if (beat.light) beat.light.intensity = (beat.light.userData.beatLight as number) * (0.35 + b)
}

const box = new Box3()
const center = new Vector3()
const size = new Vector3()

function buildParts(definition: ModelDefinition, object: Object3D, spread: number): PartState[] {
  object.updateWorldMatrix(true, true)
  box.setFromObject(object)
  const modelCenter = box.getCenter(new Vector3())
  const radius = box.getSize(size).length() / 2

  const parts: PartState[] = []
  for (const def of definition.parts) {
    const node = object.getObjectByName(def.meshName)
    if (!node || !node.parent) {
      console.warn(`[scene] part "${def.id}": no mesh named "${def.meshName}"`)
      continue
    }
    const uniforms = makePartUniforms()
    node.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.material = Array.isArray(child.material)
        ? child.material.map((m) => patchMaterial(m, uniforms))
        : patchMaterial(child.material, uniforms)
    })

    box.setFromObject(node).getCenter(center)
    const away = center.clone().sub(modelCenter)
    const len = away.length()
    if (len < 1e-6) away.set(0, 1, 0)
    // central parts move less than outer ones; `userData.fixed` parts stay put
    away.normalize().multiplyScalar(node.userData.fixed ? 0 : radius * spread * 0.4 + len * spread * 0.8)

    const p0 = node.parent.worldToLocal(center.clone())
    const p1 = node.parent.worldToLocal(center.clone().add(away))
    parts.push({
      id: def.id,
      label: def.label,
      node,
      base: node.position.clone(),
      offset: p1.sub(p0),
      uniforms,
      t: 0,
      v: 0,
      rim: 0,
      dim: 0,
    })
  }
  return parts
}

/**
 * Shows a model with hover rim glow, name labels, a staggered spring
 * explode driven by `explode`, and a dimmed background when a part is
 * selected. Mouse hover and click write the scene store; the hand
 * interaction writes the same store.
 */
export function ExplodableModel({ definition, object, spread = 0.9 }: Props) {
  const parts = useMemo(() => buildParts(definition, object, spread), [definition, object, spread])
  const hovered = useSceneStore((s) => s.hoveredPart)
  const selected = useSceneStore((s) => s.selectedPart)

  useEffect(
    () => () => {
      for (const p of parts) {
        p.node.position.copy(p.base)
        p.node.traverse((c) => {
          if (!(c instanceof Mesh)) return
          const mats = Array.isArray(c.material) ? c.material : [c.material]
          mats.forEach((m) => m.dispose())
        })
      }
      focus.point = null
      anchors.clear()
    },
    [parts],
  )

  // models can ask for a heartbeat: `userData.beat = { base }` on the root
  const beating = useMemo(() => {
    const cfg = object.userData.beat as { base: number; pulses: Object3D[] } | undefined
    if (!cfg) return null
    const mats: MeshStandardMaterial[] = []
    let light: PointLight | null = null
    object.traverse((c) => {
      if (c instanceof PointLight && c.userData.beatLight) light = c
    })
    // glow only what beats: the materials inside the pulsing groups
    for (const g of cfg.pulses) {
      g.traverse((c) => {
        if (!(c instanceof Mesh)) return
        const list = Array.isArray(c.material) ? c.material : [c.material]
        list.forEach((m) => m instanceof MeshStandardMaterial && m.emissiveIntensity > 0 && mats.push(m))
      })
    }
    return { base: cfg.base, pulses: cfg.pulses, mats, light: light as PointLight | null }
  }, [object])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (beating) applyBeat(beating, clock.elapsedTime)
    const { explode, hoveredPart, selectedPart, pull } = useSceneStore.getState()
    const n = parts.length

    parts.forEach((p, i) => {
      const delay = n > 1 ? (i / (n - 1)) * STAGGER : 0
      let target = MathUtils.clamp((explode - delay) / (1 - STAGGER), 0, 1)
      // a part held by the hand moves out on its own; release springs it back
      if (pull && pull.partId === p.id) target = Math.max(target, pull.amount)
      p.v += (STIFFNESS * (target - p.t) - DAMPING * p.v) * dt
      p.t += p.v * dt
      p.node.position.copy(p.base).addScaledVector(p.offset, p.t)

      const isHover = hoveredPart === p.id
      const isSelected = selectedPart === p.id
      const rimTarget = isHover ? 1 : isSelected ? 0.55 : 0
      const dimTarget = selectedPart && !isSelected && !isHover ? 1 : 0
      p.rim = MathUtils.damp(p.rim, rimTarget, 12, dt)
      p.dim = MathUtils.damp(p.dim, dimTarget, 6, dt)
      p.uniforms.uRim.value = p.rim
      p.uniforms.uDim.value = p.dim
    })

    const sel = parts.find((p) => p.id === selectedPart)
    if (sel) {
      box.setFromObject(sel.node).getCenter(center)
      focus.point = [center.x, center.y, center.z]
    } else {
      focus.point = null
    }
  })

  const partOf = (obj: Object3D): PartState | undefined => {
    let cur: Object3D | null = obj
    while (cur) {
      const hit = parts.find((p) => p.node === cur)
      if (hit) return hit
      cur = cur.parent
    }
    return undefined
  }

  const remember = (p: PartState, e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) => {
    const local = p.node.worldToLocal(e.point.clone())
    anchors.set(p.id, local)
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const p = partOf(e.object)
    if (!p) return
    e.stopPropagation()
    remember(p, e)
    // moving straight from one part onto another must switch the hover
    if (useSceneStore.getState().hoveredPart !== p.id) useSceneStore.getState().setHovered(p.id)
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    const p = partOf(e.object)
    if (!p) return
    e.stopPropagation()
    remember(p, e)
    useSceneStore.getState().setHovered(p.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    const p = partOf(e.object)
    const s = useSceneStore.getState()
    if (p && s.hoveredPart === p.id) s.setHovered(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const p = partOf(e.object)
    if (!p) return
    e.stopPropagation()
    remember(p, e)
    const s = useSceneStore.getState()
    s.setSelected(s.selectedPart === p.id ? null : p.id)
  }

  const hoverPart = parts.find((p) => p.id === hovered)
  const selectPart = parts.find((p) => p.id === selected)

  return (
    <group>
      <primitive object={object} onPointerOver={onOver} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
      {hoverPart && <PartLabel key={`h-${hoverPart.id}`} label={hoverPart.label} target={hoverPart.node} side="right" anchor={() => anchors.get(hoverPart.id)} />}
      {selectPart && selectPart.id !== hovered && (
        <PartLabel key={`s-${selectPart.id}`} label={selectPart.label} target={selectPart.node} side="left" anchor={() => anchors.get(selectPart.id)} />
      )}
    </group>
  )
}
