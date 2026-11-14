import {
  AdditiveBlending,
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type MeshPhysicalMaterialParameters,
} from 'three'
import { useSceneStore } from '@/shared/stores'
import { meshOf, named, taperedTube } from '../glb/geometry'
import { onFrame } from './frame'

/** Mesh names. The content file points at these. */
export const NEURON_MESH = {
  receptor: 'neuron_receptor',
  sensory: 'neuron_sensory',
  spinalCord: 'neuron_spinal_cord',
  relay: 'neuron_relay',
  cellBody: 'neuron_cell_body',
  dendrites: 'neuron_dendrites',
  axon: 'neuron_axon',
  myelin: 'neuron_myelin',
  nodes: 'neuron_nodes',
  terminals: 'neuron_terminals',
  effector: 'neuron_effector',
} as const

const v = (x: number, y: number, z = 0) => new Vector3(x, y, z)
const path = (pts: Vector3[]) => new CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const ease = (t: number) => t * t * (3 - 2 * t)

function glossy(color: string, extra: MeshPhysicalMaterialParameters = {}) {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.4,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    ...extra,
  })
}

function ball(
  r: number,
  at: Vector3,
  mat: MeshPhysicalMaterial,
  squash?: [number, number, number],
) {
  const m = meshOf(new SphereGeometry(r, 28, 20), mat)
  m.position.copy(at)
  if (squash) m.scale.set(...squash)
  return m
}

function tube(
  curve: CatmullRomCurve3,
  r0: number,
  r1: number,
  mat: MeshPhysicalMaterial,
  rounded = 0,
) {
  return meshOf(
    taperedTube(curve, { tubular: 48, radial: 10, radius: (t) => lerp(r0, r1, t), rounded }),
    mat,
  )
}

// Layout, front view. Skin is top left, the muscle bottom left, the spinal cord on the right.
const SENSORY = path([
  v(-2.05, 1.18),
  v(-1.2, 1.26),
  v(-0.2, 1.06),
  v(0.7, 0.9),
  v(1.3, 0.72),
  v(1.62, 0.5),
])
const RELAY = path([v(1.66, 0.46), v(1.82, 0.36), v(1.9, 0.2), v(1.84, -0.06), v(1.72, -0.28)])
const SOMA = v(1.62, -0.52)
const AXON = path([
  v(1.44, -0.58),
  v(0.9, -0.72),
  v(0, -0.95),
  v(-0.9, -1.12),
  v(-1.55, -1.2),
  v(-1.8, -1.22),
])
const KNOBS = [v(-2.14, -1.0), v(-2.12, -1.25), v(-2.14, -1.5)]
const MUSCLE = v(-2.48, -1.25)

// Myelin: six sheaths along the axon with a bare gap, a node of Ranvier, between each pair.
const SHEATHS = 6
const MY_START = 0.07
const MY_END = 0.93
const GAP = 0.02
const SHEATH = (MY_END - MY_START - (SHEATHS - 1) * GAP) / SHEATHS
/** Where the impulse lands as it jumps: the axon hillock, each node, then the axon end. */
const STATIONS = [
  0.02,
  ...Array.from({ length: SHEATHS - 1 }, (_, k) => MY_START + (k + 1) * SHEATH + k * GAP + GAP / 2),
  0.98,
]
const HOPS = STATIONS.length - 1

const HOP_S = 0.12
/** With the myelin pulled off, the impulse has to crawl the whole axon. */
const CRAWL_S = 2.2

const STAGES = [
  'stimulus',
  'sensory',
  'synapse1',
  'relay',
  'synapse2',
  'motor',
  'terminal',
  'twitch',
  'rest',
] as const
type Stage = (typeof STAGES)[number]

/**
 * A reflex arc: a receptor in the skin, a sensory neuron into the spinal
 * cord, a relay neuron, and a motor neuron out to a muscle. The motor neuron
 * is drawn in full, with dendrites, cell body, axon, myelin sheath, nodes
 * of Ranvier and axon terminals.
 *
 * An impulse runs the arc on a loop. On the myelinated axon it jumps from
 * node to node. Pull the model apart and the myelin comes off: the impulse
 * then crawls along the bare axon, which shows why myelin makes it fast.
 */
export function buildNeuron(): Group {
  const root = new Group()
  root.name = 'neuron'
  root.position.y = 0.3

  const part = (name: string, fixed = true) => {
    const g = named(new Group(), name)
    g.userData.fixed = fixed
    root.add(g)
    return g
  }

  // ---- Receptor: a patch of skin with nerve endings under it
  const receptor = part(NEURON_MESH.receptor, false)
  const skin = meshOf(
    new BoxGeometry(0.85, 0.16, 0.55, 4, 1, 2),
    glossy('#e7b99a', { roughness: 0.7, clearcoat: 0.1 }),
  )
  skin.position.set(-2.2, 1.36, 0)
  skin.rotation.z = 0.12
  receptor.add(skin)
  const endingMat = glossy('#ffd166', { emissive: '#ffb300', emissiveIntensity: 0.25 })
  const endings = [v(-2.22, 1.22), v(-2.05, 1.2), v(-2.36, 1.24)].map((p) => {
    const e = ball(0.05, p, endingMat)
    receptor.add(e)
    return e
  })

  // ---- Sensory neuron: carries the impulse towards the spinal cord
  const sensory = part(NEURON_MESH.sensory)
  const sensoryMat = glossy('#7fb2ff')
  sensory.add(tube(SENSORY, 0.035, 0.035, sensoryMat))
  // its cell body sits to one side of the fibre, just outside the cord
  sensory.add(ball(0.13, SENSORY.getPointAt(0.68).add(v(0.02, 0.13)), sensoryMat))
  sensory.add(ball(0.055, SENSORY.getPointAt(1), sensoryMat))

  // ---- Spinal cord: a see-through slice with grey matter inside
  const cord = part(NEURON_MESH.spinalCord)
  const white = ball(
    1,
    v(1.8, 0.05),
    glossy('#e9edf5', {
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      roughness: 0.25,
      clearcoat: 1,
    }),
    [0.95, 1.2, 0.34],
  )
  const grey = ball(
    1,
    v(1.8, 0.02),
    glossy('#a9b3c9', { transparent: true, opacity: 0.28, depthWrite: false }),
    [0.55, 0.85, 0.2],
  )
  cord.add(white, grey)

  // ---- Relay neuron: links the sensory and motor neurons inside the cord
  const relay = part(NEURON_MESH.relay)
  const relayMat = glossy('#c59bff')
  relay.add(tube(RELAY, 0.03, 0.03, relayMat))
  relay.add(ball(0.1, RELAY.getPointAt(0.5), relayMat))
  relay.add(ball(0.05, RELAY.getPointAt(1), relayMat))

  // ---- Motor neuron
  const motorMat = glossy('#f2c879')
  const cellBody = part(NEURON_MESH.cellBody)
  cellBody.add(ball(0.2, SOMA, motorMat, [1.1, 0.95, 0.9]))
  // axon hillock: the cone where the axon leaves the cell body
  cellBody.add(
    tube(path([SOMA.clone(), v(1.5, -0.56), AXON.getPointAt(0.02)]), 0.13, 0.035, motorMat),
  )

  const dendrites = part(NEURON_MESH.dendrites)
  ;[100, 50, 5, -45, -100, 145].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180
    const d = v(Math.cos(a), Math.sin(a))
    const side = v(-d.y, d.x)
    const len = 0.42 + (i % 3) * 0.07
    const start = SOMA.clone().addScaledVector(d, 0.14)
    const mid = start
      .clone()
      .addScaledVector(d, len * 0.5)
      .addScaledVector(side, 0.05 * (i % 2 ? 1 : -1))
    const tip = start
      .clone()
      .addScaledVector(d, len)
      .add(v(0, 0, (i % 2 ? 1 : -1) * 0.08))
    dendrites.add(tube(path([start, mid, tip]), 0.05, 0.012, motorMat, 0.08))
    // one fork each, so they look like a tree
    const forkTip = mid
      .clone()
      .addScaledVector(d, len * 0.35)
      .addScaledVector(side, 0.2 * (i % 2 ? -1 : 1))
    dendrites.add(
      tube(
        path([mid, mid.clone().lerp(forkTip, 0.5).addScaledVector(d, 0.03), forkTip]),
        0.028,
        0.01,
        motorMat,
        0.1,
      ),
    )
  })

  const axon = part(NEURON_MESH.axon)
  const axonMesh = tube(AXON, 0.032, 0.032, glossy('#e0b060'))
  axon.add(axonMesh)

  const myelin = part(NEURON_MESH.myelin, false)
  const myelinMat = glossy('#f6efd9', { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 })
  for (let k = 0; k < SHEATHS; k++) {
    const a = MY_START + k * (SHEATH + GAP)
    const pts = Array.from({ length: 9 }, (_, i) => AXON.getPointAt(lerp(a, a + SHEATH, i / 8)))
    myelin.add(
      meshOf(
        taperedTube(path(pts), { tubular: 28, radial: 14, radius: () => 0.085, rounded: 0.22 }),
        myelinMat,
      ),
    )
  }

  const nodes = part(NEURON_MESH.nodes)
  const ringGeo = new TorusGeometry(0.055, 0.016, 8, 24)
  const Z = v(0, 0, 1)
  const q = new Quaternion()
  const rings = STATIONS.slice(1, -1).map((t) => {
    // one material each, so each node can flash on its own
    const ring = meshOf(
      ringGeo,
      glossy('#ffd166', { emissive: '#ffb300', emissiveIntensity: 0.25 }),
    )
    ring.position.copy(AXON.getPointAt(t))
    ring.quaternion.copy(q.setFromUnitVectors(Z, AXON.getTangentAt(t)))
    nodes.add(ring)
    return ring
  })

  const terminals = part(NEURON_MESH.terminals)
  const axonEnd = AXON.getPointAt(1)
  KNOBS.forEach((k) => {
    const mid = axonEnd
      .clone()
      .lerp(k, 0.5)
      .add(v(-0.02, 0, 0))
    terminals.add(tube(path([axonEnd, mid, k]), 0.022, 0.018, motorMat))
    terminals.add(ball(0.045, k, motorMat))
  })

  // ---- Effector: the muscle that answers
  const effector = part(NEURON_MESH.effector, false)
  const muscle = ball(
    1,
    MUSCLE,
    glossy('#b8404e', { roughness: 0.45, sheen: 0.6, sheenColor: '#ff9fb0' }),
    [0.32, 0.8, 0.3],
  )
  effector.add(muscle)

  // ---- The impulse: a bright bead with a soft halo, drawn over everything
  const spark = new Group()
  const core = new Mesh(
    new SphereGeometry(0.055, 16, 12),
    new MeshBasicMaterial({
      color: '#fff1a8',
      toneMapped: false,
      depthTest: false,
      transparent: true,
    }),
  )
  const halo = new Mesh(
    new SphereGeometry(0.15, 16, 12),
    new MeshBasicMaterial({
      color: '#ffd166',
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    }),
  )
  core.renderOrder = halo.renderOrder = 10
  core.raycast = halo.raycast = () => {}
  spark.add(halo, core)
  root.add(spark)

  // The scene swaps in its own copy of each material, so read it from the mesh every time.
  const glow = (m: Mesh, value: number) => {
    const mat = m.material
    if (mat instanceof MeshStandardMaterial) mat.emissiveIntensity = value
  }

  let stage = 0
  let u = 0
  let landed = -1
  const flash = rings.map(() => 0)
  const from = new Vector3()
  const to = new Vector3()

  const duration = (s: Stage, bare: boolean): number => {
    switch (s) {
      case 'stimulus':
        return 0.4
      case 'sensory':
        return 1.0
      case 'synapse1':
      case 'synapse2':
        return 0.14
      case 'relay':
        return 0.35
      case 'motor':
        return bare ? CRAWL_S : HOPS * HOP_S
      case 'terminal':
        return 0.14
      case 'twitch':
        return 0.6
      case 'rest':
        return 0.9
    }
  }

  const update = (dt: number) => {
    // past this the myelin has clearly come off the axon
    const bare = useSceneStore.getState().explode > 0.35
    u += dt / duration(STAGES[stage]!, bare)
    while (u >= 1) {
      u = 0
      stage = (stage + 1) % STAGES.length
      landed = -1
    }
    const s = STAGES[stage]!

    let size = 1
    let stimulus = 0
    let twitch = 0
    spark.visible = s !== 'rest'

    switch (s) {
      case 'stimulus':
        SENSORY.getPointAt(0, spark.position)
        size = ease(u)
        stimulus = Math.sin(Math.PI * u)
        break
      case 'sensory':
        SENSORY.getPointAt(u, spark.position)
        break
      case 'synapse1':
        spark.position.lerpVectors(SENSORY.getPointAt(1, from), RELAY.getPointAt(0, to), u)
        size = 1 + 0.6 * Math.sin(Math.PI * u)
        break
      case 'relay':
        RELAY.getPointAt(u, spark.position)
        break
      case 'synapse2':
        spark.position.lerpVectors(
          RELAY.getPointAt(1, from),
          AXON.getPointAt(STATIONS[0]!, to),
          ease(u),
        )
        size = 1 + 0.6 * Math.sin(Math.PI * u)
        break
      case 'motor':
        if (bare) {
          AXON.getPointAt(lerp(STATIONS[0]!, STATIONS[HOPS]!, u), spark.position)
        } else {
          // saltatory conduction: leap over each sheath, land on the next node
          const k = Math.min(HOPS - 1, Math.floor(u * HOPS))
          const h = clamp01((u * HOPS - k) / 0.6)
          AXON.getPointAt(lerp(STATIONS[k]!, STATIONS[k + 1]!, ease(h)), spark.position)
          const lift = Math.sin(Math.PI * h) * 0.15
          spark.position.y += lift
          spark.position.z += lift
          if (h >= 1 && landed !== k) {
            landed = k
            if (k < rings.length) flash[k] = 1
          }
        }
        break
      case 'terminal':
        spark.position.lerpVectors(AXON.getPointAt(1, from), KNOBS[1]!, u)
        break
      case 'twitch':
        spark.position.copy(KNOBS[1]!)
        size = 1 - ease(clamp01(u * 2.5))
        twitch = Math.sin(Math.PI * clamp01(u * 1.3))
        break
      case 'rest':
        break
    }

    spark.scale.setScalar(Math.max(0.001, size))
    endings.forEach((e) => glow(e, 0.25 + 2.2 * stimulus))
    const decay = Math.exp(-7 * dt)
    rings.forEach((r, i) => {
      flash[i] = flash[i]! * decay
      glow(r, 0.25 + 2.6 * flash[i]!)
      r.scale.setScalar(1 + 0.35 * flash[i]!)
    })
    // the muscle shortens and thickens when the impulse arrives
    muscle.scale.set(
      0.32 * (1 + 0.22 * twitch),
      0.8 * (1 - 0.1 * twitch),
      0.3 * (1 + 0.22 * twitch),
    )
  }

  onFrame(axonMesh, update)
  update(0)
  return root
}
