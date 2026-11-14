import { CatmullRomCurve3, Color, DoubleSide, Group, MeshPhysicalMaterial, PointLight, Vector3 } from 'three'
import { bodyGeometry, bodyPoint, meshOf, named, snapToSurface, taperedTube, type BodySpec } from './geometry'
import { rng, veinedTissue } from './noise'

/** Mesh names. The content file points at these. */
export const HEART_MESH = {
  rightAtrium: 'heart_right_atrium',
  leftAtrium: 'heart_left_atrium',
  rightVentricle: 'heart_right_ventricle',
  leftVentricle: 'heart_left_ventricle',
  aorta: 'heart_aorta',
  pulmonaryArtery: 'heart_pulmonary_artery',
  superiorVenaCava: 'heart_superior_vena_cava',
  inferiorVenaCava: 'heart_inferior_vena_cava',
  pulmonaryVeins: 'heart_pulmonary_veins',
  coronaryArteries: 'heart_coronary_arteries',
} as const

const LV: BodySpec = { c: [0.3, -0.4, -0.05], r: [0.94, 1.36, 0.9], rotZ: 0.46, taper: 0.5 }
const RV: BodySpec = { c: [-0.4, -0.28, 0.4], r: [0.78, 1.1, 0.64], rotZ: 0.2, taper: 0.4 }
const RA: BodySpec = { c: [-0.94, 0.52, -0.1], r: [0.54, 0.68, 0.56], rotZ: 0, taper: 0.12 }
const LA: BodySpec = { c: [0.5, 0.62, -0.55], r: [0.68, 0.48, 0.52], rotZ: -0.2, taper: 0 }

/** Resting glow of the muscle; the heartbeat adds to this. */
const BEAT_BASE = 0.16
const BLOOD_RED = '#d8352f'
const BLOOD_BLUE = '#2b6cb0'

function curve(points: [number, number, number][]): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    'catmullrom',
    0.5,
  )
}

interface MuscleOptions {
  base: string
  mottle: string
  seed: number
  roughness?: number
  sheen?: string
  /** How much of the surface the vein network covers, 0-1. */
  density?: number
  vein?: string
  fine?: string
}

/**
 * Wet muscle skin: broad colour patches, fine grain, and a dense web of
 * blue veins and red capillaries that is also raised in the bump map.
 * The glow value is what the heartbeat pulses.
 */
function tissue({ base, mottle, seed, roughness = 0.34, sheen = '#ff8f8f', density = 0.75, vein = '#3a4fa0', fine = '#7a1020' }: MuscleOptions): MeshPhysicalMaterial {
  const { map, bump } = veinedTissue({ base, mottle, vein, fine, seed, density })
  return new MeshPhysicalMaterial({
    map,
    bumpMap: bump,
    bumpScale: 2.2,
    roughness: roughness + 0.08,
    clearcoat: 0.6,
    clearcoatRoughness: 0.32,
    sheen: 0.8,
    sheenRoughness: 0.5,
    sheenColor: new Color(sheen),
    emissive: new Color(base),
    emissiveIntensity: BEAT_BASE,
  })
}

/** Smooth glossy vessel, open at the ends so the hollow inside shows. */
function vessel(color: string): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 0.3,
    sheenColor: new Color('#ffffff'),
    emissive: new Color(color),
    emissiveIntensity: 0.28,
    side: DoubleSide,
  })
}

interface Twig {
  guide: Vector3[]
  depth: number
}

/**
 * A branching vessel tree grown over a body surface. Guides are walked in
 * (longitude, latitude); each branch can split off at an angle and thins.
 */
function twigs(spec: BodySpec, start: [number, number], heading: number, rand: () => number, maxDepth: number, length: number): Twig[] {
  const out: Twig[] = []
  const grow = (lon: number, lat: number, h: number, depth: number, len: number) => {
    const pts: Vector3[] = []
    let a = lon
    let b = lat
    let hh = h
    const steps = Math.max(5, Math.round(len * 11))
    for (let k = 0; k <= steps; k++) {
      pts.push(bodyPoint(spec, a, b))
      hh += (rand() - 0.5) * 0.16
      a += Math.cos(hh) * 0.07
      b = Math.max(-1.3, Math.min(1.3, b + Math.sin(hh) * 0.07))
      if (depth < maxDepth && k > 2 && k < steps - 1 && rand() < 0.16) {
        const side = rand() < 0.5 ? 1 : -1
        grow(a, b, hh + side * (0.6 + rand() * 0.4), depth + 1, len * (0.45 + rand() * 0.2))
      }
    }
    out.push({ guide: pts, depth })
  }
  grow(start[0], start[1], heading, 0, length)
  return out
}

/** Human heart, front view. Every part is a named group so it can be pulled out. */
export function buildHeart(): Group {
  const root = new Group()
  root.name = 'heart'
  const rand = rng(77)

  // Muscle is a clear red; the atria are a darker mauve, as in teaching models.
  const lvMat = tissue({ base: '#b81f27', mottle: '#e0483e', seed: 11 })
  const rvMat = tissue({ base: '#c32a2e', mottle: '#e8574a', seed: 12 })
  const raMat = tissue({ base: '#7d3d52', mottle: '#a8667a', seed: 13, roughness: 0.4, sheen: '#e9a6c0' })
  const laMat = tissue({ base: '#843a4a', mottle: '#b0606e', seed: 14, roughness: 0.4, sheen: '#e9a6c0' })

  // Chambers
  // Ventricles get an inner group that pivots on the chamber's centre, so only they can beat.
  const pulses: Group[] = []
  const ventricle = (name: string, spec: BodySpec): { part: Group; body: Group } => {
    const part = named(new Group(), name)
    const pulse = new Group()
    pulse.position.set(...spec.c)
    const body = new Group()
    body.position.set(-spec.c[0], -spec.c[1], -spec.c[2])
    pulse.add(body)
    part.add(pulse)
    pulses.push(pulse)
    return { part, body }
  }

  const { part: lv, body: lvBody } = ventricle(HEART_MESH.leftVentricle, LV)
  lvBody.add(meshOf(bodyGeometry(LV, { amp: 0.018, seed: 1 }), lvMat))

  const { part: rv, body: rvBody } = ventricle(HEART_MESH.rightVentricle, RV)
  rvBody.add(meshOf(bodyGeometry(RV, { amp: 0.016, seed: 2 }), rvMat))

  const ra = named(new Group(), HEART_MESH.rightAtrium)
  ra.add(meshOf(bodyGeometry(RA, { nu: 56, nv: 44, amp: 0.04, seed: 3 }), raMat))
  // right auricle: the flap on the front of the atrium
  const rAur: BodySpec = { c: [-0.46, 0.98, 0.3], r: [0.38, 0.24, 0.2], rotZ: -0.55, taper: 0.35 }
  ra.add(meshOf(bodyGeometry(rAur, { nu: 40, nv: 30, amp: 0.05, freq: 5, seed: 4 }), raMat))

  const la = named(new Group(), HEART_MESH.leftAtrium)
  la.add(meshOf(bodyGeometry(LA, { nu: 56, nv: 44, amp: 0.035, seed: 5 }), laMat))
  const lAur: BodySpec = { c: [0.98, 0.78, -0.02], r: [0.34, 0.2, 0.17], rotZ: 0.5, taper: 0.35 }
  la.add(meshOf(bodyGeometry(lAur, { nu: 40, nv: 30, amp: 0.05, freq: 5, seed: 6 }), laMat))

  root.add(lv, rv, ra, la)

  // Great vessels. Teaching models colour them by the blood they carry.
  const redMat = vessel(BLOOD_RED)
  const blueMat = vessel(BLOOD_BLUE)
  const pvMat = vessel('#c9413c')

  const aorta = named(new Group(), HEART_MESH.aorta)
  const aortaPath = curve([
    [0.12, 0.7, 0.02],
    [0.15, 1.35, -0.1],
    [0.38, 1.82, -0.2],
    [0.85, 1.72, -0.36],
    [1.08, 1.15, -0.46],
    [1.12, 0.2, -0.56],
  ])
  aorta.add(meshOf(taperedTube(aortaPath, { tubular: 96, radial: 32, radius: (t) => 0.25 - 0.06 * t, roughness: 0.01, seed: 1 }), redMat))
  // three branches off the arch, open at the tips
  const branches: [number, number, number][][] = [
    [[0.18, 1.78, -0.16], [0.1, 2.05, -0.15], [0.02, 2.3, -0.16]],
    [[0.4, 1.86, -0.2], [0.44, 2.1, -0.18], [0.46, 2.34, -0.17]],
    [[0.62, 1.84, -0.28], [0.74, 2.05, -0.26], [0.86, 2.26, -0.25]],
  ]
  branches.forEach((b, i) =>
    aorta.add(meshOf(taperedTube(curve(b), { tubular: 32, radial: 18, radius: (t) => 0.115 - 0.02 * t, seed: i }), redMat)),
  )
  root.add(aorta)

  const pa = named(new Group(), HEART_MESH.pulmonaryArtery)
  const trunk = curve([
    [-0.25, 0.65, 0.42],
    [-0.2, 1.1, 0.46],
    [-0.02, 1.45, 0.28],
    [0.1, 1.58, 0.12],
  ])
  pa.add(meshOf(taperedTube(trunk, { tubular: 48, radial: 28, radius: (t) => 0.22 - 0.03 * t, roughness: 0.01, seed: 2 }), blueMat))
  const rightPA = curve([
    [0.08, 1.56, 0.1],
    [-0.4, 1.58, -0.12],
    [-0.9, 1.48, -0.3],
    [-1.4, 1.32, -0.36],
  ])
  const leftPA = curve([
    [0.08, 1.54, 0.1],
    [0.5, 1.4, -0.05],
    [0.95, 1.18, -0.16],
    [1.35, 0.98, -0.22],
  ])
  pa.add(meshOf(taperedTube(rightPA, { tubular: 48, radial: 22, radius: (t) => 0.16 - 0.04 * t, seed: 3 }), blueMat))
  pa.add(meshOf(taperedTube(leftPA, { tubular: 48, radial: 22, radius: (t) => 0.16 - 0.04 * t, seed: 4 }), blueMat))
  // small lobar branches at the lung end of the left branch
  const lobar: [number, number, number][][] = [
    [[1.12, 1.08, -0.18], [1.38, 1.3, -0.2], [1.58, 1.46, -0.2]],
    [[1.3, 0.99, -0.2], [1.58, 0.98, -0.22], [1.8, 0.92, -0.22]],
  ]
  lobar.forEach((b, i) =>
    pa.add(meshOf(taperedTube(curve(b), { tubular: 24, radial: 14, radius: (t) => 0.07 - 0.025 * t, seed: 20 + i }), blueMat)),
  )
  root.add(pa)

  const svc = named(new Group(), HEART_MESH.superiorVenaCava)
  svc.add(
    meshOf(
      taperedTube(
        curve([
          [-0.95, 0.95, -0.1],
          [-0.96, 1.5, -0.12],
          [-0.94, 2.05, -0.14],
        ]),
        { tubular: 40, radial: 26, radius: () => 0.18, roughness: 0.01, seed: 5 },
      ),
      blueMat,
    ),
  )
  // two short branches at the top, like the head and arm veins
  const svcBranches: [number, number, number][][] = [
    [[-0.96, 1.9, -0.14], [-1.12, 2.15, -0.14], [-1.2, 2.4, -0.14]],
    [[-0.94, 1.9, -0.14], [-0.74, 2.15, -0.14], [-0.66, 2.38, -0.14]],
  ]
  svcBranches.forEach((b, i) =>
    svc.add(meshOf(taperedTube(curve(b), { tubular: 24, radial: 16, radius: () => 0.1, seed: 30 + i }), blueMat)),
  )
  root.add(svc)

  const ivc = named(new Group(), HEART_MESH.inferiorVenaCava)
  ivc.add(
    meshOf(
      taperedTube(
        curve([
          [-0.8, 0.2, -0.22],
          [-0.8, -0.35, -0.26],
          [-0.78, -0.95, -0.28],
        ]),
        { tubular: 40, radial: 26, radius: (t) => 0.2 - 0.03 * t, roughness: 0.01, seed: 6 },
      ),
      blueMat,
    ),
  )
  root.add(ivc)

  const pv = named(new Group(), HEART_MESH.pulmonaryVeins)
  const veinPaths: [number, number, number][][] = [
    [[1.55, 1.0, -0.62], [1.25, 0.88, -0.6], [0.95, 0.74, -0.58]],
    [[1.55, 0.42, -0.66], [1.25, 0.5, -0.62], [0.95, 0.56, -0.58]],
    [[-0.62, 0.98, -0.85], [-0.3, 0.88, -0.78], [0.0, 0.76, -0.66]],
    [[-0.58, 0.42, -0.9], [-0.28, 0.5, -0.8], [0.0, 0.56, -0.66]],
  ]
  veinPaths.forEach((v, i) =>
    pv.add(meshOf(taperedTube(curve(v), { tubular: 32, radial: 20, radius: () => 0.12, seed: 10 + i }), pvMat)),
  )
  root.add(pv)

  // Surface vessels: guide points are snapped onto the chamber skin.
  const targets = [lv, rv, ra, la]
  const inside = new Vector3(-0.05, 0.1, -0.2)
  const lay = (parent: Group, list: Twig[], mat: MeshPhysicalMaterial, width: number, lift: number, seed: number) =>
    list.forEach((tw, i) => {
      const snapped = snapToSurface(tw.guide, targets, inside, lift)
      const c = new CatmullRomCurve3(snapped, false, 'catmullrom', 0.5)
      const w = width * (1 - tw.depth * 0.32)
      parent.add(
        meshOf(
          taperedTube(c, {
            tubular: Math.max(24, snapped.length * 8),
            radial: 10,
            radius: (t) => w * (1 - 0.55 * t),
            seed: seed + i,
            rounded: 0.06,
          }),
          mat,
        ),
      )
    })

  // Coronary arteries (red): left and right trunks with side branches.
  const coronary = named(new Group(), HEART_MESH.coronaryArteries)
  const arteryMat = vessel('#e0463d')
  lay(coronary, twigs(LV, [Math.PI / 2 + 0.85, 0.7], -1.45, rand, 2, 1.5), arteryMat, 0.05, 0.03, 100)
  const rca = [
    [0.0, 0.9, 0.55],
    [-0.45, 0.85, 0.7],
    [-0.85, 0.6, 0.62],
    [-1.1, 0.2, 0.45],
    [-1.02, -0.35, 0.45],
    [-0.78, -0.8, 0.5],
  ].map((p) => new Vector3(...(p as [number, number, number])))
  lay(coronary, [{ guide: rca, depth: 0 }], arteryMat, 0.055, 0.03, 140)
  root.add(coronary)

  // Cardiac veins (blue) follow the chamber they drain, so they move with it.
  const veinMat = vessel('#2f74b8')
  lay(lvBody, twigs(LV, [Math.PI / 2 + 0.45, 0.8], -1.55, rand, 2, 1.5), veinMat, 0.04, 0.022, 200)
  lay(rvBody, twigs(RV, [Math.PI / 2 - 0.2, 0.7], -1.5, rand, 2, 1.2), veinMat, 0.032, 0.022, 260)

  // A soft red light inside the heart. The scene pulses it with the heartbeat.
  const glow = new PointLight('#ff3b3b', 0, 7, 2)
  glow.name = 'heart_glow'
  glow.position.set(0, 0.2, 0.6)
  glow.userData.beatLight = 3.2
  root.add(glow)
  // Only the ventricles beat: they swell and glow together with the light.
  root.userData.beat = { base: BEAT_BASE, pulses }
  root.scale.setScalar(1.3)
  return root
}
