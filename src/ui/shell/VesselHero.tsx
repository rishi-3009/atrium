import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  InstancedMesh,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Object3D,
  type PerspectiveCamera,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three'
import { color } from '../tokens'

/** Tiny seeded random so the clot looks the same on every load. */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Red blood cell: a biconcave disc (Evans-Fung profile), radius 1. */
function discGeometry() {
  const pts: Vector2[] = []
  const N = 14
  const h = (r: number) => 0.5 * 0.55 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.2072 + 2.0026 * r * r - 1.1228 * r ** 4)
  for (let i = 0; i <= N; i++) pts.push(new Vector2(i / N, -h(i / N)))
  for (let i = N; i >= 0; i--) pts.push(new Vector2(i / N, h(i / N)))
  const g = new LatheGeometry(pts, 28)
  g.computeVertexNormals()
  return g
}

/** Soft ridges that wrap the vessel wall, like the lining seen from inside. */
function wallTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 1024
  const g = c.getContext('2d')!
  g.fillStyle = color.cell.wall
  g.fillRect(0, 0, c.width, c.height)
  const r = rng(7)
  for (let i = 0; i < 70; i++) {
    const y = r() * c.height
    const dark = r() > 0.5
    g.strokeStyle = dark ? 'rgba(40,0,6,0.35)' : 'rgba(255,120,130,0.16)'
    g.lineWidth = 6 + r() * 26
    g.beginPath()
    const ph = r() * 6
    for (let x = 0; x <= c.width; x += 16) g.lineTo(x, y + Math.sin(x / 70 + ph) * (6 + r() * 5))
    g.stroke()
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(3, 10)
  t.colorSpace = SRGBColorSpace
  return t
}

const tmpObj = new Object3D()
const tmpColor = new Color()

function Tunnel() {
  const tex = useMemo(() => wallTexture(), [])
  const geo = useMemo(() => new CylinderGeometry(3.4, 3.4, 60, 48, 1, true), [])
  useEffect(
    () => () => {
      tex.dispose()
      geo.dispose()
    },
    [tex, geo],
  )
  return (
    <mesh geometry={geo} rotation-x={Math.PI / 2} position={[0, 0, -18]}>
      <meshStandardMaterial map={tex} side={BackSide} roughness={0.55} metalness={0} color="#ff9a9a" />
    </mesh>
  )
}

interface Blob {
  p: Vector3
  q: Quaternion
  s: number
}

/** The clot: packed red cells, a few platelets and white cells, and fibrin threads. */
function Clot() {
  const group = useRef<Object3D>(null)
  const redRef = useRef<InstancedMesh>(null)
  const plateRef = useRef<InstancedMesh>(null)
  const whiteRef = useRef<InstancedMesh>(null)
  const disc = useMemo(() => discGeometry(), [])
  const ball = useMemo(() => new SphereGeometry(1, 20, 14), [])

  const data = useMemo(() => {
    const r = rng(42)
    const inEllipsoid = () => {
      for (;;) {
        const v = new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1)
        if (v.lengthSq() <= 1) return v.multiply(new Vector3(1.75, 2.0, 1.75))
      }
    }
    const spin = () => new Quaternion().setFromEuler(new Euler(r() * 6.3, r() * 6.3, r() * 6.3))
    const make = (n: number, scale: () => number): Blob[] =>
      Array.from({ length: n }, () => ({ p: inEllipsoid(), q: spin(), s: scale() }))
    const cells = make(300, () => 0.3 + r() * 0.08)
    const plates = make(34, () => 0.1 + r() * 0.04)
    const whites = make(6, () => 0.22 + r() * 0.05)
    whites.forEach((w) => w.p.multiplyScalar(0.8))

    // fibrin: thin threads between nearby points
    const pos: number[] = []
    for (let i = 0; i < 520; i++) {
      const a = inEllipsoid().multiplyScalar(1.05)
      const b = a.clone().add(new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.2))
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
    const fibrin = new BufferGeometry()
    fibrin.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return { cells, plates, whites, fibrin }
  }, [])

  const fibrinMesh = useMemo(
    () =>
      new LineSegments(
        data.fibrin,
        new LineBasicMaterial({ color: color.cell.fibrin, transparent: true, opacity: 0.45, blending: AdditiveBlending, depthWrite: false }),
      ),
    [data.fibrin],
  )

  useLayoutEffect(() => {
    const fill = (mesh: InstancedMesh | null, list: Blob[], tint: string, vary: number) => {
      if (!mesh) return
      const r = rng(list.length)
      list.forEach((c, i) => {
        tmpObj.position.copy(c.p)
        tmpObj.quaternion.copy(c.q)
        tmpObj.scale.setScalar(c.s)
        tmpObj.updateMatrix()
        mesh.setMatrixAt(i, tmpObj.matrix)
        mesh.setColorAt(i, tmpColor.set(tint).offsetHSL(0, 0, (r() - 0.5) * vary))
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    fill(redRef.current, data.cells, color.cell.red, 0.14)
    fill(plateRef.current, data.plates, color.cell.platelet, 0.06)
    fill(whiteRef.current, data.whites, color.cell.white, 0.04)
  }, [data])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.35
  })

  return (
    <group ref={group}>
      <instancedMesh ref={redRef} args={[disc, undefined, data.cells.length]}>
        <meshPhysicalMaterial roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.3} sheen={0.6} sheenColor="#ff8a96" side={DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={plateRef} args={[disc, undefined, data.plates.length]}>
        <meshStandardMaterial roughness={0.35} side={DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={whiteRef} args={[ball, undefined, data.whites.length]}>
        <meshStandardMaterial roughness={0.75} emissive="#ffffff" emissiveIntensity={0.08} />
      </instancedMesh>
      <primitive object={fibrinMesh} />
    </group>
  )
}

const FLOW_COUNT = 46
const FAR = -30

/** Cells that keep drifting toward the camera and tumbling, like the blood stream. */
function Stream() {
  const ref = useRef<InstancedMesh>(null)
  const disc = useMemo(() => discGeometry(), [])
  const cells = useMemo(() => {
    const r = rng(99)
    return Array.from({ length: FLOW_COUNT }, () => {
      const ang = r() * Math.PI * 2
      const rad = 2.3 + r() * 0.8
      return {
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        z: FAR + r() * (-FAR + 4),
        speed: 1 + r() * 1.3,
        spin: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.6),
        rot: new Vector3(r() * 6, r() * 6, r() * 6),
        s: 0.34 + r() * 0.2,
      }
    })
  }, [])

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const r = rng(5)
    cells.forEach((_, i) => m.setColorAt(i, tmpColor.set(color.cell.red).offsetHSL(0, 0, (r() - 0.5) * 0.14)))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [cells])

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 1 / 20)
    cells.forEach((c, i) => {
      c.z += c.speed * dt
      if (c.z > 5) c.z = FAR
      c.rot.addScaledVector(c.spin, dt)
      tmpObj.position.set(c.x, c.y, c.z)
      tmpObj.rotation.set(c.rot.x, c.rot.y, c.rot.z)
      tmpObj.scale.setScalar(c.s)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[disc, undefined, FLOW_COUNT]} frustumCulled={false}>
      <meshPhysicalMaterial roughness={0.45} clearcoat={0.5} sheen={0.5} sheenColor="#ff8a96" side={DoubleSide} />
    </instancedMesh>
  )
}

/** Slow push-in and out, a touch of mouse parallax, and the view shifted right to leave room for text. */
function Camera({ shift }: { shift: number }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    const c = camera as PerspectiveCamera
    c.setViewOffset(size.width, size.height, -size.width * shift, 0, size.width, size.height)
    return () => c.clearViewOffset()
  }, [camera, size, shift])
  useFrame(({ clock, camera: cam, pointer }, dt) => {
    const t = clock.elapsedTime
    const z = 8.6 - 1.5 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 16))
    cam.position.x = MathUtils.damp(cam.position.x, pointer.x * 0.35, 3, dt)
    cam.position.y = MathUtils.damp(cam.position.y, pointer.y * 0.25, 3, dt)
    cam.position.z = MathUtils.damp(cam.position.z, z, 3, dt)
    cam.lookAt(0, 0, 0)
  })
  return null
}

/**
 * Homepage hero: the inside of a blood vessel with a clot ahead and red
 * cells streaming past the camera. Everything is built in code.
 */
export function VesselHero() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8.6], fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[color.bg.base]} />
      <fog attach="fog" args={['#2a0509', 6, 26]} />
      <ambientLight intensity={0.55} color="#ff9aa6" />
      <pointLight position={[0, 0, 5]} intensity={55} color="#ff6a7a" distance={22} decay={2} />
      <pointLight position={[0, 0, -3]} intensity={30} color="#ff3b50" distance={12} decay={2} />
      <directionalLight position={[-3, 4, 4]} intensity={1.1} color="#ffd6d6" />
      <Tunnel />
      <Clot />
      <Stream />
      <Camera shift={0.16} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={0.35} luminanceThreshold={0.8} luminanceSmoothing={0.3} mipmapBlur />
        <DepthOfField worldFocusDistance={8} worldFocusRange={2.6} bokehScale={3.2} height={480} />
        <Vignette eskil={false} offset={0.2} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  )
}
