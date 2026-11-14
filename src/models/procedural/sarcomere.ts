import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type Mesh,
  type MeshPhysicalMaterialParameters,
} from 'three'
import { holdSqueezeToExplode } from '@/interaction'
import { useSceneStore } from '@/shared/stores'
import { meshOf, named } from '../glb/geometry'
import { hideable, onFrame } from './frame'

/** Mesh names. The content file points at these. */
export const SARCOMERE_MESH = {
  zLine: 'sarco_z_line',
  actin: 'sarco_actin',
  myosin: 'sarco_myosin',
  heads: 'sarco_myosin_heads',
  mLine: 'sarco_m_line',
  aBand: 'sarco_a_band',
  iBand: 'sarco_i_band',
  hZone: 'sarco_h_zone',
} as const

/** Lengths along the filament axis, before the model is scaled up. */
const THICK = 1.5
const THIN = 1.0
const RELAXED = 2.7
const CONTRACTED = 2.0
/** Spacing of the thick filament lattice. */
const LATTICE = 0.4
const SCALE = 1.55

const BAR_Y = 0.98
const BAR_GAP = 0.012

const UP = new Vector3(0, 1, 0)
const X = new Vector3(1, 0, 0)

function glossy(color: string, extra: MeshPhysicalMaterialParameters = {}) {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    ...extra,
  })
}

/** Centre plus six around it: where the thick filaments sit, seen end-on (y, z). */
function thickLattice(): [number, number][] {
  const pts: [number, number][] = [[0, 0]]
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3
    pts.push([Math.cos(a) * LATTICE, Math.sin(a) * LATTICE])
  }
  return pts
}

/** Thin filaments sit between the thick ones, six around each. */
function thinLattice(thick: [number, number][]): [number, number][] {
  const seen = new Map<string, [number, number]>()
  const r = LATTICE / Math.sqrt(3)
  for (const [y, z] of thick) {
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + (k * Math.PI) / 3
      const p: [number, number] = [y + Math.cos(a) * r, z + Math.sin(a) * r]
      seen.set(`${p[0].toFixed(3)},${p[1].toFixed(3)}`, p)
    }
  }
  return [...seen.values()]
}

/** All thin filaments of one half as beads of G-actin wound in two strands. */
function thinFilaments(points: [number, number][], dir: 1 | -1, mat: MeshPhysicalMaterial) {
  const step = 0.042
  const beads = Math.round(THIN / step)
  const mesh = new InstancedMesh(
    new SphereGeometry(0.03, 8, 6),
    mat,
    points.length * 2 * (beads + 1),
  )
  const m = new Matrix4()
  const p = new Vector3()
  let i = 0
  points.forEach(([y, z], f) => {
    for (let s = 0; s < 2; s++) {
      for (let j = 0; j <= beads; j++) {
        const turn = j * 0.45 + s * Math.PI + f
        p.set(dir * j * step, y + Math.cos(turn) * 0.02, z + Math.sin(turn) * 0.02)
        mesh.setMatrixAt(i++, m.makeTranslation(p.x, p.y, p.z))
      }
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  mesh.frustumCulled = false
  return mesh
}

interface Head {
  x: number
  y: number
  z: number
  /** Angle around the filament. */
  phi: number
  /** Which Z line it leans towards. */
  side: 1 | -1
  crown: number
}

function headList(thick: [number, number][]): Head[] {
  const heads: Head[] = []
  const bare = 0.12
  const step = 0.075
  thick.forEach(([y, z], f) => {
    for (const side of [1, -1] as const) {
      let crown = 0
      for (let x = bare; x <= THICK / 2 - 0.03; x += step, crown++) {
        for (let k = 0; k < 3; k++) {
          heads.push({
            x: side * x,
            y,
            z,
            phi: crown * 0.7 + (k * 2 * Math.PI) / 3 + f,
            side,
            crown,
          })
        }
      }
    }
  })
  return heads
}

/**
 * One sarcomere, Z line to Z line: thick myosin filaments in the middle,
 * thin actin filaments fixed to the Z lines, and bars on top that mark the
 * A band, I band and H zone.
 *
 * The scene's `explode` is the contraction. As it rises the Z lines move in
 * and the thin filaments slide over the thick ones: the I band and H zone
 * shrink while the A band keeps its length. With hands, bringing two
 * pinched hands together contracts it.
 */
export function buildSarcomere(): Group {
  const root = new Group()
  root.name = 'sarcomere'
  root.scale.setScalar(SCALE)
  root.rotation.set(0.16, -0.42, 0)
  root.position.y = -0.2

  const part = (name: string) => {
    const g = named(new Group(), name)
    g.userData.fixed = true
    root.add(g)
    return g
  }
  const zLine = part(SARCOMERE_MESH.zLine)
  const actin = part(SARCOMERE_MESH.actin)
  const myosin = part(SARCOMERE_MESH.myosin)
  const headPart = part(SARCOMERE_MESH.heads)
  const mLine = part(SARCOMERE_MESH.mLine)
  const aBand = part(SARCOMERE_MESH.aBand)
  const iBand = part(SARCOMERE_MESH.iBand)
  const hZone = part(SARCOMERE_MESH.hZone)

  const thick = thickLattice()
  const thin = thinLattice(thick)

  // Z lines: discs seen edge-on, so they read as lines
  const zGeo = new CylinderGeometry(0.8, 0.8, 0.05, 48)
  zGeo.rotateZ(Math.PI / 2)
  const zMat = glossy('#33415f', { roughness: 0.5 })
  const zL = meshOf(zGeo, zMat)
  const zR = meshOf(zGeo, zMat)
  zLine.add(zL, zR)

  // thin filaments, fixed to their Z line
  const actinMat = glossy('#4fb7ff')
  const thinL = thinFilaments(thin, 1, actinMat)
  const thinR = thinFilaments(thin, -1, actinMat)
  actin.add(thinL, thinR)

  // thick filaments stay in the middle
  const rodGeo = new CapsuleGeometry(0.04, THICK - 0.08, 6, 14)
  rodGeo.rotateZ(Math.PI / 2)
  const rodMat = glossy('#c2475b')
  const rods: Mesh[] = thick.map(([y, z]) => {
    const rod = meshOf(rodGeo, rodMat)
    rod.position.set(0, y, z)
    myosin.add(rod)
    return rod
  })

  // myosin heads: short arms that reach for the thin filaments
  const heads = headList(thick)
  const headMesh = new InstancedMesh(
    new CapsuleGeometry(0.02, 0.06, 3, 8),
    glossy('#ff9f7a'),
    heads.length,
  )
  headMesh.frustumCulled = false
  headPart.add(headMesh)

  const m = new Matrix4()
  const q = new Quaternion()
  const one = new Vector3(1, 1, 1)
  const radial = new Vector3()
  const dir = new Vector3()
  const pos = new Vector3()
  const setHeads = (phase: number, activity: number) => {
    heads.forEach((h, i) => {
      // the lean is the power stroke: heads rock while the filaments slide
      const lean = 0.5 + 0.5 * activity * Math.sin(phase + h.crown * 0.9)
      radial.set(0, Math.cos(h.phi), Math.sin(h.phi))
      dir
        .copy(radial)
        .multiplyScalar(Math.cos(lean))
        .addScaledVector(X, Math.sin(lean) * h.side)
      pos.set(h.x, h.y, h.z).addScaledVector(radial, 0.045).addScaledVector(dir, 0.045)
      headMesh.setMatrixAt(i, m.compose(pos, q.setFromUnitVectors(UP, dir), one))
    })
    headMesh.instanceMatrix.needsUpdate = true
  }
  setHeads(0, 0)
  headMesh.computeBoundingSphere()

  // M line: holds the thick filaments together at their middle
  const mGeo = new CylinderGeometry(0.62, 0.62, 0.03, 40)
  mGeo.rotateZ(Math.PI / 2)
  mLine.add(meshOf(mGeo, glossy('#e0b24f', { transparent: true, opacity: 0.8 })))

  // band bars above the filaments, like the brackets in the textbook figure
  const barGeo = new BoxGeometry(1, 0.06, 0.26)
  const bar = (color: string, group: Group, y: number) => {
    const b = meshOf(
      barGeo,
      glossy(color, { emissive: color, emissiveIntensity: 0.18, roughness: 0.25 }),
    )
    b.position.y = y
    group.add(b)
    return b
  }
  const aBar = bar('#5a6fb0', aBand, BAR_Y)
  aBar.scale.x = THICK - BAR_GAP
  const iL = bar('#d6e6ff', iBand, BAR_Y)
  const iR = bar('#d6e6ff', iBand, BAR_Y)
  const hBar = hideable(bar('#9fe8d8', hZone, BAR_Y + 0.13))

  let c = 0
  let activity = 0
  const update = (dt: number) => {
    // on this model, squeezing two hands together is the contraction
    holdSqueezeToExplode()
    const target = useSceneStore.getState().explode
    const before = c
    c += (target - c) * (1 - Math.exp(-8 * dt))
    if (Math.abs(target - c) < 1e-4) c = target

    const length = RELAXED + (CONTRACTED - RELAXED) * c
    const half = length / 2
    zL.position.x = thinL.position.x = -half
    zR.position.x = thinR.position.x = half

    // I band: from the Z line to the end of the thick filaments
    const i = Math.max(0.02, half - THICK / 2)
    iL.scale.x = iR.scale.x = Math.max(0.01, i - BAR_GAP)
    iL.position.x = -(THICK / 2 + i / 2)
    iR.position.x = THICK / 2 + i / 2

    // H zone: the part of the thick filaments the thin ones have not reached
    const h = length - 2 * THIN
    hBar.visible = h > 0.015
    hBar.scale.x = Math.max(0.015, h)

    const speed = dt > 0 ? Math.abs(c - before) / dt : 0
    activity += (Math.min(1, speed * 4) - activity) * (1 - Math.exp(-6 * dt))
    if (activity > 0.005) setHeads(c * 45, activity)
  }

  onFrame(rods[0]!, update)
  update(0)
  return root
}
