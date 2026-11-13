import { CatmullRomCurve3, Color, Group, MeshPhysicalMaterial, Vector3, type Texture } from 'three'
import { bodyGeometry, bodyPoint, meshOf, named, snapToSurface, taperedTube, type BodySpec } from './geometry'
import { fbmField, grayTexture, mottleTexture } from './noise'

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

const LV: BodySpec = { c: [0.3, -0.42, -0.05], r: [0.8, 1.3, 0.78], rotZ: 0.42, taper: 0.55 }
const RV: BodySpec = { c: [-0.38, -0.3, 0.38], r: [0.68, 1.05, 0.55], rotZ: 0.22, taper: 0.5 }
const RA: BodySpec = { c: [-0.92, 0.52, -0.1], r: [0.48, 0.62, 0.5], rotZ: 0, taper: 0.15 }
const LA: BodySpec = { c: [0.5, 0.62, -0.55], r: [0.62, 0.42, 0.46], rotZ: -0.2, taper: 0 }

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
  bump: Texture
  roughness?: number
}

function tissue({ base, mottle, seed, bump, roughness = 0.46 }: MuscleOptions): MeshPhysicalMaterial {
  const map = mottleTexture(fbmField({ size: 256, fx: 5, fy: 5, octaves: 4, seed }), 256, base, mottle, 1.5)
  return new MeshPhysicalMaterial({
    map,
    bumpMap: bump,
    bumpScale: 1.4,
    roughness,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    sheen: 0.7,
    sheenRoughness: 0.5,
    sheenColor: new Color('#ff9fb0'),
  })
}

/** Human heart, front view. Every part is a named group so it can be pulled out. */
export function buildHeart(): Group {
  const root = new Group()
  root.name = 'heart'

  const bump = grayTexture(fbmField({ size: 256, fx: 24, fy: 6, octaves: 3, seed: 3 }), 256, 2.2)
  bump.repeat.set(2, 2)

  const lvMat = tissue({ base: '#9d2a35', mottle: '#c45a52', seed: 11, bump })
  const rvMat = tissue({ base: '#a8404c', mottle: '#cf7468', seed: 12, bump })
  const raMat = tissue({ base: '#8a3d5c', mottle: '#b0607a', seed: 13, bump })
  const laMat = tissue({ base: '#923648', mottle: '#b95a66', seed: 14, bump })

  // Chambers
  const lv = named(new Group(), HEART_MESH.leftVentricle)
  lv.add(meshOf(bodyGeometry(LV, { amp: 0.035, seed: 1 }), lvMat))

  const rv = named(new Group(), HEART_MESH.rightVentricle)
  rv.add(meshOf(bodyGeometry(RV, { amp: 0.03, seed: 2 }), rvMat))

  const ra = named(new Group(), HEART_MESH.rightAtrium)
  ra.add(meshOf(bodyGeometry(RA, { nu: 56, nv: 44, amp: 0.04, seed: 3 }), raMat))
  // right auricle: the flap on the front of the atrium
  const rAur: BodySpec = { c: [-0.42, 0.98, 0.3], r: [0.3, 0.2, 0.17], rotZ: -0.5, taper: 0.3 }
  ra.add(meshOf(bodyGeometry(rAur, { nu: 40, nv: 30, amp: 0.05, freq: 5, seed: 4 }), raMat))

  const la = named(new Group(), HEART_MESH.leftAtrium)
  la.add(meshOf(bodyGeometry(LA, { nu: 56, nv: 44, amp: 0.035, seed: 5 }), laMat))
  const lAur: BodySpec = { c: [0.98, 0.78, -0.02], r: [0.26, 0.17, 0.15], rotZ: 0.5, taper: 0.3 }
  la.add(meshOf(bodyGeometry(lAur, { nu: 40, nv: 30, amp: 0.05, freq: 5, seed: 6 }), laMat))

  root.add(lv, rv, ra, la)

  // Great vessels. Arteries carry the colour of their blood in teaching diagrams.
  const arteryMat = tissue({ base: '#a93a3a', mottle: '#cf6a5c', seed: 21, bump, roughness: 0.38 })
  const pulmArteryMat = tissue({ base: '#4a5f9e', mottle: '#7087bd', seed: 22, bump, roughness: 0.38 })
  const venaMat = tissue({ base: '#44579a', mottle: '#6a7fb6', seed: 23, bump, roughness: 0.4 })
  const pvMat = tissue({ base: '#a8404f', mottle: '#cc6b70', seed: 24, bump, roughness: 0.4 })

  const aorta = named(new Group(), HEART_MESH.aorta)
  const aortaPath = curve([
    [0.12, 0.7, 0.02],
    [0.15, 1.35, -0.1],
    [0.38, 1.82, -0.2],
    [0.85, 1.72, -0.36],
    [1.08, 1.15, -0.46],
    [1.12, 0.2, -0.56],
  ])
  aorta.add(
    meshOf(
      taperedTube(aortaPath, { tubular: 96, radial: 28, radius: (t) => 0.27 - 0.07 * t, roughness: 0.012, seed: 1, rounded: 0.03 }),
      arteryMat,
    ),
  )
  const branches: [number, number, number][][] = [
    [[0.18, 1.78, -0.16], [0.1, 2.05, -0.15], [0.02, 2.3, -0.16]],
    [[0.4, 1.86, -0.2], [0.44, 2.1, -0.18], [0.46, 2.34, -0.17]],
    [[0.62, 1.84, -0.28], [0.74, 2.05, -0.26], [0.86, 2.26, -0.25]],
  ]
  branches.forEach((b, i) =>
    aorta.add(
      meshOf(
        taperedTube(curve(b), { tubular: 32, radial: 16, radius: (t) => 0.085 - 0.02 * t, seed: i, rounded: 0.08 }),
        arteryMat,
      ),
    ),
  )
  root.add(aorta)

  const pa = named(new Group(), HEART_MESH.pulmonaryArtery)
  const trunk = curve([
    [-0.25, 0.65, 0.42],
    [-0.2, 1.1, 0.46],
    [-0.02, 1.45, 0.28],
    [0.1, 1.58, 0.12],
  ])
  pa.add(meshOf(taperedTube(trunk, { tubular: 48, radial: 24, radius: (t) => 0.22 - 0.03 * t, roughness: 0.01, seed: 2 }), pulmArteryMat))
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
  pa.add(meshOf(taperedTube(rightPA, { tubular: 48, radial: 20, radius: (t) => 0.16 - 0.05 * t, seed: 3, rounded: 0.06 }), pulmArteryMat))
  pa.add(meshOf(taperedTube(leftPA, { tubular: 48, radial: 20, radius: (t) => 0.16 - 0.05 * t, seed: 4, rounded: 0.06 }), pulmArteryMat))
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
        { tubular: 40, radial: 22, radius: () => 0.17, roughness: 0.01, seed: 5, rounded: 0.05 },
      ),
      venaMat,
    ),
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
        { tubular: 40, radial: 22, radius: (t) => 0.2 - 0.03 * t, roughness: 0.01, seed: 6, rounded: 0.05 },
      ),
      venaMat,
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
    pv.add(meshOf(taperedTube(curve(v), { tubular: 32, radial: 18, radius: () => 0.1, seed: 10 + i, rounded: 0.07 }), pvMat)),
  )
  root.add(pv)

  // Coronary arteries: guide points snapped onto the chamber surfaces.
  const coronary = named(new Group(), HEART_MESH.coronaryArteries)
  const coronaryMat = new MeshPhysicalMaterial({
    color: '#c8423b',
    roughness: 0.32,
    clearcoat: 0.9,
    clearcoatRoughness: 0.2,
    sheen: 0.4,
    sheenColor: new Color('#ff8a80'),
  })
  const targets = [lv, rv, ra, la]
  const inside = new Vector3(-0.05, 0.1, -0.2)
  const lad: Vector3[] = []
  for (let k = 0; k <= 8; k++) lad.push(bodyPoint(LV, Math.PI / 2 + 0.85, 0.7 - k * 0.24))
  const rca = [
    [0.0, 0.9, 0.55],
    [-0.45, 0.85, 0.7],
    [-0.85, 0.6, 0.62],
    [-1.1, 0.2, 0.45],
    [-1.02, -0.35, 0.45],
    [-0.78, -0.8, 0.5],
  ].map((p) => new Vector3(...(p as [number, number, number])))
  const paths = [lad, rca]
  // diagonal branches off the left anterior descending artery
  for (let b = 0; b < 3; b++) {
    const pts: Vector3[] = []
    for (let k = 0; k < 5; k++) pts.push(bodyPoint(LV, Math.PI / 2 + 0.85 - k * 0.22, 0.42 - b * 0.4 - k * 0.1))
    paths.push(pts)
  }
  paths.forEach((guide, i) => {
    const snapped = snapToSurface(guide, targets, inside, 0.025)
    const c = new CatmullRomCurve3(snapped, false, 'catmullrom', 0.5)
    const main = i < 2
    coronary.add(
      meshOf(
        taperedTube(c, {
          tubular: 80,
          radial: 12,
          radius: (t) => (main ? 0.048 - 0.026 * t : 0.03 - 0.014 * t),
          roughness: 0.004,
          seed: i,
          rounded: 0.05,
        }),
        coronaryMat,
      ),
    )
  })
  root.add(coronary)

  return root
}
