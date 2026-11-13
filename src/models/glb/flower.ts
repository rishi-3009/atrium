import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  MeshPhysicalMaterial,
  SphereGeometry,
  Vector3,
  type MeshPhysicalMaterialParameters,
} from 'three'
import { dots, fixPoles, meshOf, named, parametricSurface, taperedTube } from './geometry'
import { fbm3, fbmField, grayTexture, leafTextures, mottleTexture, rng } from './noise'

export const FLOWER_MESH = {
  pedicel: 'flower_pedicel',
  thalamus: 'flower_thalamus',
  sepals: 'flower_sepals',
  petals: 'flower_petals',
  stamens: 'flower_stamens',
  stigma: 'flower_stigma',
  style: 'flower_style',
  ovary: 'flower_ovary',
  ovules: 'flower_ovules',
} as const

const PETALS = 5
const THALAMUS_Y = -0.62
const OVARY_Y = -0.12

function curve(points: [number, number, number][]): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    'catmullrom',
    0.5,
  )
}

function plant(color: string, extra: MeshPhysicalMaterialParameters = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    sheen: 0.6,
    sheenColor: new Color('#e8ffd0'),
    ...extra,
  })
}

/**
 * A leaf-like sheet: width follows `outline(v)`, it curls along its length
 * (`curl`) and across its width (`cup`), and its edge ruffles a little.
 * v runs from base (0) to tip (1), u across (0 to 1).
 */
function sheet(
  length: number,
  width: number,
  outline: (v: number) => number,
  curl: number,
  cup: number,
  ruffle: number,
  seed: number,
) {
  const nu = 40
  const nv = 48
  const g = parametricSurface(
    (u, v, out) => {
      const w = outline(v) * width
      const x = (u - 0.5) * 2 * w
      const edge = Math.abs(u - 0.5) * 2
      let y = v * length
      // curl backwards along the length
      let z = -curl * v * v * length
      // cup across the width
      z += cup * (x * x) / Math.max(0.2, width)
      // wavy edge
      z += fbm3(u * 6 + seed, v * 7, seed) * ruffle * Math.pow(edge, 2) * (0.3 + v)
      y += Math.sin(u * 14 + seed) * ruffle * 0.1 * edge * v
      out.set(x, y, z)
    },
    nu,
    nv,
  )
  return g
}

export function buildFlower(): Group {
  const root = new Group()
  root.name = 'flower'
  const rand = rng(77)

  const bump = grayTexture(fbmField({ size: 256, fx: 16, fy: 16, octaves: 3, seed: 4 }), 256, 2)
  bump.repeat.set(2, 2)

  // ---- Pedicel (stalk)
  const pedicel = named(new Group(), FLOWER_MESH.pedicel)
  const stalkMap = mottleTexture(fbmField({ size: 256, fx: 3, fy: 12, octaves: 4, seed: 12 }), 256, '#4d8a3a', '#7fb552', 1.4)
  pedicel.add(
    meshOf(
      taperedTube(
        curve([
          [0.05, -2.35, 0],
          [-0.08, -1.7, 0.03],
          [0.02, -1.1, 0],
          [0, THALAMUS_Y - 0.12, 0],
        ]),
        { tubular: 60, radial: 20, radius: (t) => 0.085 - 0.025 * t, roughness: 0.008, seed: 3, rounded: 0.04 },
      ),
      plant('#ffffff', { map: stalkMap, bumpMap: bump, bumpScale: 1.2 }),
    ),
  )
  // fine hairs along the stalk
  const hairs: Vector3[] = []
  for (let i = 0; i < 90; i++) {
    const y = -2.25 + rand() * 1.5
    const a = rand() * Math.PI * 2
    hairs.push(new Vector3(Math.cos(a) * 0.09, y, Math.sin(a) * 0.09))
  }
  pedicel.add(dots(hairs, 0.014, plant('#cfe8a8', { roughness: 0.6 }), 6))
  root.add(pedicel)

  // ---- Thalamus (receptacle): where all four whorls attach
  const thalamus = named(new Group(), FLOWER_MESH.thalamus)
  const thalGeo = new SphereGeometry(0.3, 40, 30)
  thalGeo.scale(1, 0.62, 1)
  thalamus.add(meshOf(thalGeo, plant('#ffffff', { map: mottleTexture(fbmField({ size: 128, fx: 6, fy: 6, seed: 6 }), 128, '#5f9c42', '#a4c764', 1.3), roughness: 0.42 })))
  thalamus.position.y = THALAMUS_Y
  root.add(thalamus)

  // ---- Sepals: five green leaves under the petals (the calyx)
  const sepals = named(new Group(), FLOWER_MESH.sepals)
  const sepalTex = leafTextures({ base: '#3f7a35', tip: '#8cbb5c', vein: '#d6efb0', veins: 7, seed: 21 })
  const sepalMat = plant('#ffffff', { map: sepalTex.map, bumpMap: sepalTex.bump, bumpScale: 2.2, side: DoubleSide, roughness: 0.55 })
  for (let i = 0; i < PETALS; i++) {
    const a = (i / PETALS) * Math.PI * 2 + 0.3
    const g = meshOf(sheet(0.95, 0.24, (v) => Math.sin(Math.PI * Math.pow(v, 0.6)) * (1 - 0.2 * v) + 0.08, 0.32, 0.35, 0.05, i), sepalMat)
    const holder = new Group()
    holder.position.set(0, THALAMUS_Y + 0.02, 0)
    holder.rotation.y = a
    g.rotation.x = -1.1 // lean outward and downward
    g.position.z = -0.27
    holder.add(g)
    sepals.add(holder)
  }
  root.add(sepals)

  // ---- Petals: five pink petals (the corolla)
  const petals = named(new Group(), FLOWER_MESH.petals)
  const petalTex = leafTextures({ base: '#e46a95', tip: '#fbd0e0', vein: '#b0285f', veins: 13, seed: 31, size: 384 })
  const petalMat = new MeshPhysicalMaterial({
    map: petalTex.map,
    bumpMap: petalTex.bump,
    bumpScale: 1.8,
    roughness: 0.42,
    side: DoubleSide,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: new Color('#ffd5e5'),
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
  })
  for (let i = 0; i < PETALS; i++) {
    const a = (i / PETALS) * Math.PI * 2
    const geo = sheet(
      1.75,
      0.78,
      (v) => Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 0.85) * (1 - 0.1 * v) + 0.06 * (1 - v),
      0.5,
      0.32,
      0.16,
      i * 3 + 1,
    )
    const m = meshOf(geo, petalMat)
    const holder = new Group()
    holder.position.set(0, THALAMUS_Y + 0.08, 0)
    holder.rotation.y = a
    m.rotation.x = -0.85
    m.position.z = -0.3
    holder.add(m)
    petals.add(holder)
  }
  root.add(petals)

  // ---- Stamens: filament and anther, with pollen
  const stamens = named(new Group(), FLOWER_MESH.stamens)
  const filMat = plant('#f4ecc2', { roughness: 0.4 })
  const antherMat = plant('#f2b51c', { roughness: 0.35, clearcoat: 0.5 })
  const pollenMat = plant('#ffe45e', { roughness: 0.55 })
  const STAMENS = 10
  for (let i = 0; i < STAMENS; i++) {
    const a = (i / STAMENS) * Math.PI * 2 + 0.15
    const reach = 0.5 + (i % 2) * 0.1
    const tall = 0.62 + (i % 3) * 0.1
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const fil = curve([
      [cos * 0.31, THALAMUS_Y + 0.1, sin * 0.31],
      [cos * 0.38, THALAMUS_Y + 0.55, sin * 0.38],
      [cos * reach * 0.9, THALAMUS_Y + tall * 0.9 + 0.2, sin * reach * 0.9],
      [cos * reach, THALAMUS_Y + tall + 0.45, sin * reach],
    ])
    stamens.add(meshOf(taperedTube(fil, { tubular: 40, radial: 10, radius: (t) => 0.022 - 0.007 * t, seed: i, rounded: 0.04 }), filMat))
    const tip = fil.getPointAt(1)
    const tan = fil.getTangentAt(1)
    // anther: two lobes along the end of the filament
    for (const side of [-1, 1]) {
      const lobe = new SphereGeometry(0.052, 20, 16)
      lobe.scale(0.75, 2.2, 0.75)
      const mesh = meshOf(lobe, antherMat)
      const off = new Vector3(-sin, 0, cos).multiplyScalar(0.034 * side)
      mesh.position.copy(tip).addScaledVector(tan, 0.05).add(off)
      mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tan)
      stamens.add(mesh)
    }
    const grains: Vector3[] = []
    for (let k = 0; k < 14; k++) {
      grains.push(
        tip.clone().addScaledVector(tan, 0.02 + rand() * 0.2).add(new Vector3((rand() - 0.5) * 0.13, (rand() - 0.5) * 0.04, (rand() - 0.5) * 0.13)),
      )
    }
    stamens.add(dots(grains, 0.014, pollenMat, 6))
  }
  root.add(stamens)

  // ---- Ovary: swollen base of the carpel, see-through so the ovules show
  const ovary = named(new Group(), FLOWER_MESH.ovary)
  const ovGeo = parametricSurface(
    (u, v, out) => {
      const th = u * Math.PI * 2
      const lat = (v - 0.5) * Math.PI
      const bulge = 1 + 0.05 * Math.sin(th * 3) // faint ridges along the locules
      out.set(Math.cos(lat) * Math.cos(th) * 0.27 * bulge, Math.sin(lat) * 0.33, Math.cos(lat) * Math.sin(th) * 0.27 * bulge)
    },
    56,
    40,
    { closedU: true, flip: true },
  )
  fixPoles(ovGeo, 56, 40)
  ovary.add(
    meshOf(
      ovGeo,
      new MeshPhysicalMaterial({
        color: '#9fd27e',
        transparent: true,
        opacity: 0.42,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        sheen: 0.8,
        sheenColor: new Color('#eaffd0'),
        side: DoubleSide,
        depthWrite: false,
        bumpMap: bump,
        bumpScale: 0.6,
      }),
    ),
  )
  ovary.position.y = OVARY_Y
  root.add(ovary)

  // ---- Ovules inside the ovary, on the placenta
  const ovules = named(new Group(), FLOWER_MESH.ovules)
  const ovuleMat = plant('#f6e8b8', { roughness: 0.3, clearcoat: 0.8 })
  const funMat = plant('#d9c88a', { roughness: 0.45 })
  const OV = 8
  for (let i = 0; i < OV; i++) {
    const a = (i / OV) * Math.PI * 2
    const row = i % 2 === 0 ? 0.08 : -0.1
    const g = new Group()
    g.position.set(Math.cos(a) * 0.13, OVARY_Y + row, Math.sin(a) * 0.13)
    const geo = new SphereGeometry(0.058, 22, 18)
    geo.scale(1, 1.25, 1)
    g.add(meshOf(geo, ovuleMat))
    // stalk joining the ovule to the placenta (the funicle)
    const f = meshOf(taperedTube(curve([[0, 0, 0], [-Math.cos(a) * 0.04, -0.02, -Math.sin(a) * 0.04], [-Math.cos(a) * 0.08, -0.03, -Math.sin(a) * 0.08]]), { tubular: 12, radial: 8, radius: () => 0.01 }), funMat)
    g.add(f)
    ovules.add(g)
  }
  root.add(ovules)

  // ---- Style: the stalk that lifts the stigma
  const style = named(new Group(), FLOWER_MESH.style)
  style.add(
    meshOf(
      taperedTube(
        curve([
          [0, OVARY_Y + 0.28, 0],
          [0.02, OVARY_Y + 0.7, 0.01],
          [-0.01, OVARY_Y + 1.15, 0],
          [0, OVARY_Y + 1.55, 0],
        ]),
        { tubular: 50, radial: 14, radius: (t) => 0.034 - 0.01 * t, roughness: 0.004, seed: 9, rounded: 0.03 },
      ),
      plant('#c9e49a', { roughness: 0.38, clearcoat: 0.4 }),
    ),
  )
  root.add(style)

  // ---- Stigma: sticky, lobed top that catches pollen
  const stigma = named(new Group(), FLOWER_MESH.stigma)
  const stigmaMat = plant('#e0457a', { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })
  const top = OVARY_Y + 1.58
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const lobe = new SphereGeometry(0.075, 26, 20)
    lobe.scale(0.85, 1.1, 0.85)
    const m = meshOf(lobe, stigmaMat)
    m.position.set(Math.cos(a) * 0.055, top + 0.05, Math.sin(a) * 0.055)
    stigma.add(m)
  }
  const papillae: Vector3[] = []
  for (let k = 0; k < 140; k++) {
    const a = rand() * Math.PI * 2
    const r = 0.055 + rand() * 0.06
    papillae.push(new Vector3(Math.cos(a) * r, top + 0.05 + (rand() - 0.2) * 0.17, Math.sin(a) * r))
  }
  stigma.add(dots(papillae, 0.011, plant('#ff8ab0', { roughness: 0.3 }), 6))
  root.add(stigma)

  return root
}
