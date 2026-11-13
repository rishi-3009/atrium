import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  ShaderMaterial,
} from 'three'
import { useHandStore } from '@/shared/stores'
import type { Gesture, Handedness, Vec3 } from '@/shared/types'
import { color } from '@/ui/tokens'
import { BONES, FINGERTIPS } from '../pose'
import { FastSegments } from './lines'
import { live } from './live'
import { jointFragment, jointVertex, ringFragment, ringVertex } from './shaders'

const JOINTS = 21
const FOLLOW = 28
const TRAILS = [
  { tip: 8, width: 3, strength: 1 },
  { tip: 4, width: 2, strength: 0.55 },
]
const TRAIL_LEN = 26
const RIPPLE_S = 0.7

const ACCENT = new Color(color.accent.base)
const HOT = new Color(color.text.primary)

function jointSize(i: number) {
  if (i === 0) return 1.35
  if (i === 4 || i === 8) return 1.4
  if (FINGERTIPS.includes(i)) return 1.2
  if (i === 5 || i === 9 || i === 13 || i === 17) return 1.0
  return 0.85
}

function ringMaterial() {
  return new ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    uniforms: {
      uColor: { value: ACCENT },
      uHot: { value: HOT },
      uFill: { value: 0 },
      uEngaged: { value: 0 },
      uPulse: { value: 0 },
      uOpacity: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
}

interface Trail {
  seg: FastSegments
  tip: number
  strength: number
}

interface TrailState {
  ring: Float32Array
  head: number
  filled: boolean
}

function build(dpr: number) {
  const group = new Group()

  const jointGeom = new BufferGeometry()
  const pos = new Float32Array(JOINTS * 3)
  const sizes = new Float32Array(JOINTS).map((_, i) => jointSize(i))
  const hot = new Float32Array(JOINTS)
  jointGeom.setAttribute('position', new BufferAttribute(pos, 3))
  jointGeom.setAttribute('aSize', new BufferAttribute(sizes, 1))
  jointGeom.setAttribute('aHot', new BufferAttribute(hot, 1))
  const jointMat = new ShaderMaterial({
    vertexShader: jointVertex,
    fragmentShader: jointFragment,
    uniforms: {
      uColor: { value: ACCENT },
      uHot: { value: HOT },
      uScale: { value: 9 },
      uPixelRatio: { value: dpr },
      uOpacity: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
  const joints = new Points(jointGeom, jointMat)
  joints.frustumCulled = false

  const bones = new FastSegments(BONES.length, {
    width: 2.4,
    color: color.accent.soft,
    opacity: 0.85,
  })
  const halo = new FastSegments(BONES.length, {
    width: 10,
    color: color.accent.base,
    opacity: 0.14,
  })

  const trails: Trail[] = TRAILS.map((t) => ({
    seg: new FastSegments(TRAIL_LEN - 1, {
      width: t.width,
      color: color.accent.base,
      opacity: 1,
      vertexColors: true,
    }),
    tip: t.tip,
    strength: t.strength,
  }))

  const web = new BufferGeometry()
  web.setAttribute('position', new BufferAttribute(new Float32Array(9 * 3), 3))
  const webMat = new MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  })
  const palm = new Mesh(web, webMat)
  palm.frustumCulled = false

  const plane = new PlaneGeometry(1, 1)
  const ringMat = ringMaterial()
  const ring = new Mesh(plane, ringMat)
  ring.frustumCulled = false
  const rippleMat = ringMaterial()
  rippleMat.uniforms.uFill!.value = 1
  const ripple = new Mesh(plane, rippleMat)
  ripple.frustumCulled = false
  ripple.visible = false

  group.add(
    halo.object,
    bones.object,
    palm,
    ...trails.map((t) => t.seg.object),
    joints,
    ring,
    ripple,
  )
  group.visible = false

  return {
    group,
    joints,
    jointGeom,
    jointMat,
    hot,
    pos,
    bones,
    halo,
    trails,
    palm,
    web,
    webMat,
    plane,
    ring,
    ringMat,
    ripple,
    rippleMat,
  }
}

type Built = ReturnType<typeof build>

function dispose(b: Built) {
  b.jointGeom.dispose()
  b.jointMat.dispose()
  b.bones.dispose()
  b.halo.dispose()
  b.trails.forEach((t) => t.seg.dispose())
  b.web.dispose()
  b.webMat.dispose()
  b.plane.dispose()
  b.ringMat.dispose()
  b.rippleMat.dispose()
}

interface State {
  cur: Float32Array
  shown: boolean
  opacity: number
  fill: number
  engaged: number
  pulse: number
  ringAlpha: number
  lastGesture: Gesture
  rippleT: number
  trails: TrailState[]
}

/** Maps a normalised landmark to overlay world space, keeping its screen position exact at any depth. */
function toWorld(lm: Vec3, w: number, h: number, dist: number, out: Float32Array, i: number) {
  const z = MathUtils.clamp(-lm.z * w * 1.1, -2, 2)
  const k = (dist - z) / dist
  out[i * 3] = (lm.x - 0.5) * w * k
  out[i * 3 + 1] = (0.5 - lm.y) * h * k
  out[i * 3 + 2] = z
}

/**
 * One hand as a glowing skeleton: soft joints, fat bones with a halo, a
 * faint palm web, fingertip trails, a pinch ring that fills as the fingers
 * close, and a ripple on an open palm. Reads the hand store every frame and
 * glides towards it, so 30 fps tracking looks like 60.
 */
export function HandSkeleton({ side }: { side: Handedness }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const root = useRef<Group>(null)
  const builtRef = useRef<Built | null>(null)
  const stateRef = useRef<State>({
    cur: new Float32Array(JOINTS * 3),
    shown: false,
    opacity: 0,
    fill: 0,
    engaged: 0,
    pulse: 0,
    ringAlpha: 0,
    lastGesture: 'none',
    rippleT: RIPPLE_S,
    trails: TRAILS.map(() => ({ ring: new Float32Array(TRAIL_LEN * 3), head: 0, filled: false })),
  })

  // GPU objects live outside React state; rebuilt only if the pixel ratio changes
  useEffect(() => {
    const b = build(dpr)
    const g = root.current
    builtRef.current = b
    g?.add(b.group)
    return () => {
      g?.remove(b.group)
      dispose(b)
      builtRef.current = null
    }
  }, [dpr])

  useFrame(({ viewport, size }, delta) => {
    const b = builtRef.current
    if (!b) return
    const dt = Math.min(delta, 1 / 20)
    const hand = useHandStore.getState().hands[side]
    const s = stateRef.current
    const { cur } = s
    for (const l of [b.bones, b.halo, ...b.trails.map((t) => t.seg)])
      l.setResolution(size.width, size.height)

    // fade and follow
    const target = hand ? 1 : 0
    s.opacity = MathUtils.damp(s.opacity, target, 10, dt)
    if (hand) {
      const snap = !s.shown
      const k = snap ? 1 : 1 - Math.exp(-FOLLOW * dt)
      for (let i = 0; i < JOINTS; i++) {
        const lm = hand.landmarks[i]
        if (!lm) continue
        toWorld(lm, viewport.width, viewport.height, viewport.distance, b.pos, i)
        for (let c = 0; c < 3; c++) {
          const j = i * 3 + c
          cur[j] = cur[j]! + (b.pos[j]! - cur[j]!) * k
        }
      }
      if (snap) s.trails.forEach((t) => (t.filled = false))
      s.shown = true
    } else if (s.opacity < 0.01) {
      s.shown = false
      b.group.visible = false
      live[side].opacity = 0
      live[side].engaged = 0
      live[side].spread = false
      return
    }
    b.group.visible = true

    // joints
    b.pos.set(cur)
    const gesture = hand?.gesture ?? s.lastGesture
    const pinch = hand?.pinch ?? 0
    const held = gesture === 'pinch' || gesture === 'spread'
    b.hot.fill(0)
    b.hot[4] = b.hot[8] = Math.max(pinch, held ? 1 : 0)
    ;(b.jointGeom.getAttribute('position') as BufferAttribute).needsUpdate = true
    ;(b.jointGeom.getAttribute('aHot') as BufferAttribute).needsUpdate = true
    b.jointMat.uniforms.uOpacity!.value = s.opacity

    // bones and halo
    BONES.forEach(([a, c], i) => {
      const o = i * 6
      b.bones.positions[o] = b.halo.positions[o] = cur[a * 3]!
      b.bones.positions[o + 1] = b.halo.positions[o + 1] = cur[a * 3 + 1]!
      b.bones.positions[o + 2] = b.halo.positions[o + 2] = cur[a * 3 + 2]!
      b.bones.positions[o + 3] = b.halo.positions[o + 3] = cur[c * 3]!
      b.bones.positions[o + 4] = b.halo.positions[o + 4] = cur[c * 3 + 1]!
      b.bones.positions[o + 5] = b.halo.positions[o + 5] = cur[c * 3 + 2]!
    })
    b.bones.material.opacity = 0.85 * s.opacity
    b.halo.material.opacity = (0.14 + 0.1 * s.engaged) * s.opacity
    b.bones.commit()
    b.halo.commit()

    // palm web: a fan from the wrist over the knuckles
    const webPos = b.web.getAttribute('position') as BufferAttribute
    const fan = [0, 5, 9, 0, 9, 13, 0, 13, 17]
    fan.forEach((j, i) => webPos.setXYZ(i, cur[j * 3]!, cur[j * 3 + 1]!, cur[j * 3 + 2]!))
    webPos.needsUpdate = true
    b.webMat.opacity = 0.06 * s.opacity

    // trails
    b.trails.forEach((t, ti) => {
      const ts = s.trails[ti]!
      const x = cur[t.tip * 3]!
      const y = cur[t.tip * 3 + 1]!
      const z = cur[t.tip * 3 + 2]!
      if (!ts.filled) {
        for (let i = 0; i < TRAIL_LEN; i++) ts.ring.set([x, y, z], i * 3)
        ts.filled = true
      }
      ts.head = (ts.head + 1) % TRAIL_LEN
      ts.ring.set([x, y, z], ts.head * 3)
      const col = t.seg.colors!
      for (let i = 0; i < TRAIL_LEN - 1; i++) {
        // oldest first; segment i runs from sample i to i+1
        const a = ((ts.head + 1 + i) % TRAIL_LEN) * 3
        const c = ((ts.head + 2 + i) % TRAIL_LEN) * 3
        const o = i * 6
        t.seg.positions[o] = ts.ring[a]!
        t.seg.positions[o + 1] = ts.ring[a + 1]!
        t.seg.positions[o + 2] = ts.ring[a + 2]!
        t.seg.positions[o + 3] = ts.ring[c]!
        t.seg.positions[o + 4] = ts.ring[c + 1]!
        t.seg.positions[o + 5] = ts.ring[c + 2]!
        const f0 = Math.pow(i / (TRAIL_LEN - 1), 2)
        const f1 = Math.pow((i + 1) / (TRAIL_LEN - 1), 2)
        col[o] = ACCENT.r * f0
        col[o + 1] = ACCENT.g * f0
        col[o + 2] = ACCENT.b * f0
        col[o + 3] = ACCENT.r * f1
        col[o + 4] = ACCENT.g * f1
        col[o + 5] = ACCENT.b * f1
      }
      t.seg.material.opacity = t.strength * s.opacity * (0.75 + 0.25 * s.engaged)
      t.seg.commit()
    })

    // pinch ring between thumb and index tips
    if (gesture !== s.lastGesture) {
      if (held && s.lastGesture !== 'pinch' && s.lastGesture !== 'spread') s.pulse = 1
      if (gesture === 'palm') s.rippleT = 0
      s.lastGesture = gesture
    }
    s.pulse *= Math.exp(-5 * dt)
    s.fill = MathUtils.damp(s.fill, held ? 1 : pinch, 18, dt)
    s.engaged = MathUtils.damp(s.engaged, held ? 1 : 0, 14, dt)
    const wantRing =
      gesture === 'point' || gesture === 'palm' ? 0 : MathUtils.clamp((pinch - 0.1) / 0.25, 0, 1)
    s.ringAlpha = MathUtils.damp(s.ringAlpha, Math.max(wantRing, held ? 1 : 0), 12, dt)

    const tx = cur[4 * 3]!
    const ty = cur[4 * 3 + 1]!
    const tz = cur[4 * 3 + 2]!
    const ix = cur[8 * 3]!
    const iy = cur[8 * 3 + 1]!
    const iz = cur[8 * 3 + 2]!
    const gap = Math.hypot(ix - tx, iy - ty)
    const radius = Math.max(0.2, gap * 0.5 + 0.12)
    b.ring.position.set((tx + ix) / 2, (ty + iy) / 2, (tz + iz) / 2)
    b.ring.scale.setScalar((2 * radius) / 0.78)
    b.ringMat.uniforms.uFill!.value = s.fill
    b.ringMat.uniforms.uEngaged!.value = s.engaged
    b.ringMat.uniforms.uPulse!.value = s.pulse
    b.ringMat.uniforms.uOpacity!.value = s.ringAlpha * s.opacity

    // open-palm ripple
    s.rippleT += dt
    if (s.rippleT < RIPPLE_S) {
      const u = s.rippleT / RIPPLE_S
      const e = 1 - Math.pow(1 - u, 3)
      let px = 0
      let py = 0
      let pz = 0
      for (const j of [0, 5, 9, 13, 17]) {
        px += cur[j * 3]! / 5
        py += cur[j * 3 + 1]! / 5
        pz += cur[j * 3 + 2]! / 5
      }
      b.ripple.visible = true
      b.ripple.position.set(px, py, pz)
      b.ripple.scale.setScalar((0.8 + e * 2.6) / 0.78)
      b.rippleMat.uniforms.uOpacity!.value = (1 - u) * 0.9 * s.opacity
    } else {
      b.ripple.visible = false
    }

    const l = live[side]
    l.x = b.ring.position.x
    l.y = b.ring.position.y
    l.z = b.ring.position.z
    l.opacity = s.opacity
    l.engaged = s.engaged
    l.spread = gesture === 'spread'
  })

  return <group ref={root} />
}
