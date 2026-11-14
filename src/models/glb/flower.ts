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
import { dots, meshOf, named, parametricSurface, taperedTube } from './geometry'
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

/** A lily-like flower: six petals, six sepals, six stamens. */
const WHORL = 6
const THALAMUS_Y = -0.95
/** The ovary sits on the thalamus. */
const OVARY_BASE = THALAMUS_Y + 0.02
const OVARY_H = 0.95
const OVARY_TOP = OVARY_BASE + OVARY_H
const STYLE_TOP = OVARY_TOP + 1.0
/**
 * The flower is cut lengthwise, like the textbook section: the front
 * petals are left out and the ovary is sliced open so the ovules show.
 * Half-width of the opening, in radians, centred on the camera side (+z).
 */
const CUT = 0.62

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
    roughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    sheen: 0.6,
    sheenColor: new Color('#f0ffd8'),
    ...extra,
  })
}

/** Plant tissue that glows faintly in its own colour, so it reads in the dark scene. */
function lit(color: string, glow = 0.12, extra: MeshPhysicalMaterialParameters = {}): MeshPhysicalMaterial {
  return plant(color, { emissive: new Color(color), emissiveIntensity: glow, ...extra })
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
  return parametricSurface(
    (u, v, out) => {
      const w = outline(v) * width
      const x = (u - 0.5) * 2 * w
      const edge = Math.abs(u - 0.5) * 2
      let y = v * length
      // curl backwards along the length; strongest near the tip, like a lily
      let z = -curl * Math.pow(v, 2.4) * length
      // cup across the width
      z += (cup * (x * x)) / Math.max(0.2, width)
      // a raised midrib groove down the centre
      z -= 0.03 * Math.exp(-((u - 0.5) ** 2) / 0.004) * (1 - v)
      // wavy edge
      z += fbm3(u * 6 + seed, v * 7, seed) * ruffle * Math.pow(edge, 2) * (0.3 + v)
      y += Math.sin(u * 14 + seed) * ruffle * 0.1 * edge * v
      out.set(x, y, z)
    },
    40,
    56,
  )
}

/** Is a whorl member at holder angle `a` on the cut-away (camera) side? */
function inFront(a: number): boolean {
  // a member placed with rotation.y = a points along (-sin a, 0, -cos a)
  return -Math.cos(a) > Math.cos(CUT + 0.35)
}

/** Ovary radius from base (v = 0) to the neck (v = 1): an urn. */
function ovaryR(v: number): number {
  return 0.06 + 0.32 * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.75)), 0.9) + 0.08 * (1 - v)
}

export function buildFlower(): Group {
  const root = new Group()
  root.name = 'flower'
  const rand = rng(77)

  const bump = grayTexture(fbmField({ size: 256, fx: 16, fy: 16, octaves: 3, seed: 4 }), 256, 2)
  bump.repeat.set(2, 2)

  // ---- Pedicel (stalk)
  const pedicel = named(new Group(), FLOWER_MESH.pedicel)
  const stalkMap = mottleTexture(fbmField({ size: 256, fx: 3, fy: 12, octaves: 4, seed: 12 }), 256, '#3f8a2e', '#7cc04a', 1.4)
  pedicel.add(
    meshOf(
      taperedTube(
        curve([
          [0.04, -2.75, 0],
          [-0.08, -2.1, 0.03],
          [0.02, -1.5, 0],
          [0, THALAMUS_Y - 0.12, 0],
        ]),
        { tubular: 60, radial: 20, radius: (t) => 0.09 - 0.02 * t, roughness: 0.008, seed: 3, rounded: 0.04 },
      ),
      plant('#ffffff', { map: stalkMap, bumpMap: bump, bumpScale: 1.2, emissive: new Color('#3f8a2e'), emissiveIntensity: 0.1 }),
    ),
  )
  root.add(pedicel)

  // ---- Thalamus (receptacle): the swollen tip of the stalk where every whorl attaches
  const thalamus = named(new Group(), FLOWER_MESH.thalamus)
  const thalGeo = new SphereGeometry(0.36, 48, 32)
  thalGeo.scale(1, 0.58, 1)
  thalamus.add(
    meshOf(
      thalGeo,
      plant('#ffffff', {
        map: mottleTexture(fbmField({ size: 128, fx: 6, fy: 6, seed: 6 }), 128, '#3f8a2e', '#8cc955', 1.3),
        roughness: 0.4,
        emissive: new Color('#3f8a2e'),
        emissiveIntensity: 0.1,
      }),
    ),
  )
  thalamus.position.y = THALAMUS_Y
  root.add(thalamus)

  // ---- Sepals: green, leaf-like, curling down under the petals (the calyx)
  const sepals = named(new Group(), FLOWER_MESH.sepals)
  const sepalTex = leafTextures({ base: '#2f7a2a', tip: '#7cc04a', vein: '#c8f0a0', veins: 7, seed: 21 })
  const sepalMat = plant('#ffffff', {
    map: sepalTex.map,
    bumpMap: sepalTex.bump,
    bumpScale: 2.2,
    side: DoubleSide,
    roughness: 0.45,
    emissive: new Color('#2f7a2a'),
    emissiveIntensity: 0.12,
  })
  for (let i = 0; i < WHORL; i++) {
    const a = (i / WHORL) * Math.PI * 2
    if (inFront(a)) continue
    const g = meshOf(sheet(1.05, 0.26, (v) => Math.sin(Math.PI * Math.pow(v, 0.6)) * (1 - 0.25 * v) + 0.06, 0.7, 0.35, 0.04, i), sepalMat)
    const holder = new Group()
    holder.position.set(0, THALAMUS_Y + 0.02, 0)
    holder.rotation.y = a
    g.rotation.x = -1.3 // out, then curling down
    g.position.z = -0.3
    holder.add(g)
    sepals.add(holder)
  }
  root.add(sepals)

  // ---- Petals: six deep red petals that flare and curl back at the tips (the corolla)
  const petals = named(new Group(), FLOWER_MESH.petals)
  const petalTex = leafTextures({ base: '#8e0a26', tip: '#f0587a', vein: '#5c0216', veins: 17, seed: 31, size: 512 })
  const petalMat = new MeshPhysicalMaterial({
    map: petalTex.map,
    bumpMap: petalTex.bump,
    bumpScale: 2,
    roughness: 0.38,
    side: DoubleSide,
    sheen: 1,
    sheenRoughness: 0.3,
    sheenColor: new Color('#ffc2d2'),
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    emissive: new Color('#7a0a22'),
    emissiveIntensity: 0.22,
  })
  for (let i = 0; i < WHORL; i++) {
    const a = (i / WHORL) * Math.PI * 2 + Math.PI / WHORL
    if (inFront(a)) continue
    const geo = sheet(
      2.0,
      0.82,
      (v) => Math.pow(Math.sin(Math.PI * Math.pow(v, 0.62)), 0.8) * (1 - 0.15 * v) + 0.05 * (1 - v),
      0.85,
      0.38,
      0.14,
      i * 3 + 1,
    )
    const m = meshOf(geo, petalMat)
    const holder = new Group()
    holder.position.set(0, THALAMUS_Y + 0.1, 0)
    holder.rotation.y = a
    m.rotation.x = -0.62
    m.position.z = -0.3
    holder.add(m)
    petals.add(holder)
  }
  root.add(petals)

  // ---- Stamens: green filament, orange anther dusted with yellow pollen
  const stamens = named(new Group(), FLOWER_MESH.stamens)
  const filMat = lit('#6cbf3a', 0.14, { roughness: 0.35 })
  const antherMat = lit('#f07a12', 0.25, { roughness: 0.4, clearcoat: 0.5 })
  const pollenMat = lit('#ffd83a', 0.4, { roughness: 0.55 })
  const looseMat = lit('#ffcf5a', 0.35, { roughness: 0.6 })
  for (let i = 0; i < WHORL; i++) {
    const a = (i / WHORL) * Math.PI * 2 + Math.PI / 6
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    // skip only the one stamen straight in front of the cut ovary
    if (sin > 0.9) continue
    const reach = 0.72 + (i % 2) * 0.08
    const tall = OVARY_TOP + 0.62 + (i % 3) * 0.08
    const fil = curve([
      [cos * 0.26, THALAMUS_Y + 0.12, sin * 0.26],
      [cos * 0.36, THALAMUS_Y + 0.75, sin * 0.36],
      [cos * reach * 0.88, tall - 0.25, sin * reach * 0.88],
      [cos * reach, tall, sin * reach],
    ])
    stamens.add(meshOf(taperedTube(fil, { tubular: 48, radial: 10, radius: (t) => 0.026 - 0.01 * t, seed: i, rounded: 0.03 }), filMat))
    const tip = fil.getPointAt(1)
    const tan = fil.getTangentAt(1)
    // anther: a fat two-lobed head sitting across the filament tip
    const across = new Vector3(-sin, 0, cos)
    const head = new Group()
    head.position.copy(tip).addScaledVector(tan, 0.04)
    head.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3().copy(tan).lerp(new Vector3(cos, 0.2, sin), 0.6).normalize())
    for (const side of [-1, 1]) {
      const lobe = new SphereGeometry(0.06, 24, 18)
      lobe.scale(0.85, 2.0, 0.85)
      const mesh = meshOf(lobe, antherMat)
      mesh.position.set(side * 0.045, 0, 0)
      head.add(mesh)
    }
    // pollen grains sitting on the anther surface
    const grains: Vector3[] = []
    for (let k = 0; k < 40; k++) {
      const side = k % 2 === 0 ? -1 : 1
      const th = rand() * Math.PI * 2
      const ph = (rand() - 0.5) * Math.PI * 0.9
      grains.push(new Vector3(side * 0.045 + Math.cos(ph) * Math.cos(th) * 0.053, Math.sin(ph) * 0.12, Math.cos(ph) * Math.sin(th) * 0.053))
    }
    head.add(dots(grains, 0.013, pollenMat, 6))
    stamens.add(head)
    // a few grains drifting off the anther
    const loose: Vector3[] = []
    for (let k = 0; k < 6; k++) {
      loose.push(tip.clone().addScaledVector(across, (rand() - 0.5) * 0.3).add(new Vector3(0, 0.08 + rand() * 0.3, 0)).addScaledVector(new Vector3(cos, 0, sin), 0.1 + rand() * 0.2))
    }
    stamens.add(dots(loose, 0.012, looseMat, 6))
  }
  root.add(stamens)

  // ---- Ovary: an urn sliced open at the front. Green outside, a pale
  // yellow wall where it is cut, and a dark green chamber inside.
  const ovary = named(new Group(), FLOWER_MESH.ovary)
  const th0 = Math.PI / 2 + CUT
  const span = Math.PI * 2 - 2 * CUT
  const wall = (scale: number, v0: number) =>
    parametricSurface(
      (u, v, out) => {
        const th = th0 + u * span
        const vv = v0 + v * (1 - v0 - 0.04)
        const bulge = 1 + 0.04 * Math.sin(th * 3)
        const r = ovaryR(vv) * scale * bulge
        out.set(Math.cos(th) * r, OVARY_BASE + vv * OVARY_H, Math.sin(th) * r)
      },
      64,
      40,
      { flip: true },
    )
  const ovaryMap = mottleTexture(fbmField({ size: 256, fx: 6, fy: 10, octaves: 4, seed: 41 }), 256, '#3f9a32', '#8fd25a', 1.4)
  ovary.add(meshOf(wall(1, 0), plant('#ffffff', { map: ovaryMap, bumpMap: bump, bumpScale: 0.6, side: DoubleSide, emissive: new Color('#3f9a32'), emissiveIntensity: 0.12 })))
  // inner lining of the chamber
  ovary.add(meshOf(wall(0.8, 0.06), lit('#1f5a22', 0.18, { side: DoubleSide, roughness: 0.55 })))
  // the two cut faces show the thickness of the wall
  const cutMat = lit('#e2ec8e', 0.22, { side: DoubleSide, roughness: 0.5 })
  for (const th of [th0, th0 + span]) {
    const face = parametricSurface(
      (u, v, out) => {
        const r = ovaryR(v * 0.96) * (0.8 + 0.2 * u)
        out.set(Math.cos(th) * r, OVARY_BASE + v * 0.96 * OVARY_H, Math.sin(th) * r)
      },
      6,
      40,
    )
    ovary.add(meshOf(face, cutMat))
  }
  // placenta: the central column the ovules hang from
  ovary.add(
    meshOf(
      taperedTube(
        curve([
          [0, OVARY_BASE + 0.1, -0.03],
          [0, OVARY_BASE + 0.45, -0.02],
          [0, OVARY_TOP - 0.16, -0.03],
        ]),
        { tubular: 24, radial: 14, radius: () => 0.04, rounded: 0.15 },
      ),
      lit('#cfe07a', 0.2),
    ),
  )
  root.add(ovary)

  // ---- Ovules: two columns of cream ovules on stalks from the placenta
  const ovules = named(new Group(), FLOWER_MESH.ovules)
  const ovuleMat = lit('#f6eaa8', 0.25, { roughness: 0.3, clearcoat: 0.8 })
  const funMat = lit('#d9e08a', 0.15, { roughness: 0.45 })
  const ROWS = 5
  for (let row = 0; row < ROWS; row++) {
    for (const side of [-1, 1]) {
      const v = 0.2 + (row / (ROWS - 1)) * 0.5
      const y = OVARY_BASE + v * OVARY_H
      const g = new Group()
      g.position.set(side * 0.11, y, 0.02)
      const geo = new SphereGeometry(0.055, 22, 18)
      geo.scale(1.15, 1.3, 1)
      g.add(meshOf(geo, ovuleMat))
      // funicle: the stalk joining the ovule to the placenta
      g.add(
        meshOf(
          taperedTube(
            curve([
              [0, 0, 0],
              [-side * 0.04, -0.01, -0.02],
              [-side * 0.08, -0.02, -0.05],
            ]),
            { tubular: 12, radial: 8, radius: () => 0.012 },
          ),
          funMat,
        ),
      )
      ovules.add(g)
    }
  }
  root.add(ovules)

  // ---- Style: the long stalk that lifts the stigma
  const style = named(new Group(), FLOWER_MESH.style)
  style.add(
    meshOf(
      taperedTube(
        curve([
          [0, OVARY_TOP - 0.06, 0],
          [0.02, OVARY_TOP + 0.35, 0.01],
          [-0.01, OVARY_TOP + 0.7, 0],
          [0, STYLE_TOP, 0],
        ]),
        { tubular: 50, radial: 16, radius: (t) => 0.06 - 0.022 * t, roughness: 0.004, seed: 9, rounded: 0.03 },
      ),
      lit('#7cc04a', 0.14, { roughness: 0.35, clearcoat: 0.5 }),
    ),
  )
  root.add(style)

  // ---- Stigma: sticky three-lobed tip that catches pollen
  const stigma = named(new Group(), FLOWER_MESH.stigma)
  const stigmaMat = lit('#b8dc5a', 0.22, { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 })
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const lobe = new SphereGeometry(0.08, 26, 20)
    lobe.scale(0.85, 1.1, 0.85)
    const m = meshOf(lobe, stigmaMat)
    m.position.set(Math.cos(a) * 0.06, STYLE_TOP + 0.06, Math.sin(a) * 0.06)
    stigma.add(m)
  }
  const papillae: Vector3[] = []
  for (let k = 0; k < 160; k++) {
    const a = rand() * Math.PI * 2
    const r = 0.05 + rand() * 0.07
    papillae.push(new Vector3(Math.cos(a) * r, STYLE_TOP + 0.06 + (rand() - 0.2) * 0.17, Math.sin(a) * r))
  }
  stigma.add(dots(papillae, 0.011, lit('#f2f7a0', 0.3, { roughness: 0.3 }), 6))
  root.add(stigma)

  // centre the flower on the stage
  root.position.y = 0.5
  return root
}
