import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  CapsuleGeometry,
  type MeshPhysicalMaterialParameters,
  type Texture,
} from 'three'
import { dots, meshOf, named, parametricSurface, taperedTube, fixPoles } from './geometry'
import { fbm3, fbmField, grayTexture, rng } from './noise'

export const CELL_MESH = {
  membrane: 'cell_membrane',
  nucleus: 'cell_nucleus',
  nucleolus: 'cell_nucleolus',
  mitochondria: 'cell_mitochondria',
  roughER: 'cell_rough_er',
  smoothER: 'cell_smooth_er',
  golgi: 'cell_golgi',
  lysosomes: 'cell_lysosomes',
  centrosome: 'cell_centrosome',
  ribosomes: 'cell_ribosomes',
} as const

const CELL_R = 2.2
const NUC_C = new Vector3(0.25, 0.1, -0.1)
const NUC_R = 0.78
const GOLGI_POS = new Vector3(-0.45, -1.22, 0.75)

function curve(points: Vector3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(points, false, 'catmullrom', 0.5)
}

/** Random point on a sphere shell. */
function onSphere(rand: () => number, r: number): Vector3 {
  const z = rand() * 2 - 1
  const a = rand() * Math.PI * 2
  const s = Math.sqrt(1 - z * z)
  return new Vector3(s * Math.cos(a) * r, z * r, s * Math.sin(a) * r)
}

/** Pearly, see-through shell with a thin colour shift. */
function pearl(color: string, opacity: number, bump?: Texture): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessMinimum: 180,
    iridescenceThicknessMaximum: 520,
    sheen: 0.8,
    sheenColor: new Color('#cfe8ff'),
    side: DoubleSide,
    depthWrite: false,
    ...(bump ? { bumpMap: bump, bumpScale: 0.8 } : {}),
  })
}

function solid(color: string, extra: MeshPhysicalMaterialParameters = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    sheen: 0.5,
    sheenColor: new Color('#ffffff'),
    ...extra,
  })
}

/** Animal cell, cut open in front so the inside can be seen. */
export function buildCell(): Group {
  const root = new Group()
  root.name = 'cell'
  const rand = rng(42)

  const grain = grayTexture(fbmField({ size: 256, fx: 18, fy: 18, octaves: 3, seed: 5 }), 256, 2)
  grain.repeat.set(3, 3)

  // ---- Cell membrane: a bilayer shell with a cut-away wedge, lipid heads on the surface
  const membrane = named(new Group(), CELL_MESH.membrane)
  membrane.userData.fixed = true
  const shellGeo = (r: number) => {
    const nu = 96
    const nv = 64
    const g = parametricSurface(
      (u, v, out) => {
        const phi = Math.PI + u * Math.PI * 1.5
        const theta = v * Math.PI
        const bumpy = 1 + fbm3(Math.cos(phi) * 1.6, Math.cos(theta) * 1.6, Math.sin(phi) * 1.6) * 0.025
        out.set(
          -r * bumpy * Math.cos(phi) * Math.sin(theta),
          r * bumpy * Math.cos(theta),
          r * bumpy * Math.sin(phi) * Math.sin(theta),
        )
      },
      nu,
      nv,
      { flip: false },
    )
    fixPoles(g, nu, nv)
    return g
  }
  membrane.add(meshOf(shellGeo(CELL_R), pearl('#9fd8e8', 0.2, grain)))
  membrane.add(meshOf(shellGeo(CELL_R - 0.07), pearl('#ffc9dd', 0.14)))
  // phospholipid heads on the outer surface
  const heads: Vector3[] = []
  while (heads.length < 1400) {
    const p = onSphere(rand, CELL_R + 0.02)
    // skip the cut-away wedge: x > 0 and z > 0
    if (p.x > 0 && p.z > 0) continue
    heads.push(p)
  }
  membrane.add(dots(heads, 0.034, solid('#f4efe6', { roughness: 0.25, iridescence: 0.8, iridescenceIOR: 1.4 }), 8))
  // membrane proteins: a few larger bumps
  const proteins = heads.filter((_, i) => i % 38 === 0).map((p) => p.clone().multiplyScalar(1.012))
  membrane.add(dots(proteins, 0.085, solid('#e07a8c', { roughness: 0.3 }), 10))
  root.add(membrane)

  // ---- Nucleus: envelope with pores, chromatin and a nucleolus
  const nucleus = named(new Group(), CELL_MESH.nucleus)
  nucleus.position.copy(NUC_C)
  const envBump = grayTexture(fbmField({ size: 256, fx: 22, fy: 22, octaves: 2, seed: 8 }), 256, 3.2)
  envBump.repeat.set(3, 2)
  const envelope = meshOf(new SphereGeometry(NUC_R, 72, 56), pearl('#9c8cf0', 0.42, envBump))
  nucleus.add(envelope)
  const pores: Vector3[] = []
  for (let i = 0; i < 90; i++) pores.push(onSphere(rand, NUC_R + 0.005))
  nucleus.add(dots(pores, 0.04, solid('#241a4f', { roughness: 0.6 }), 8))
  // chromatin: a tangle of thin fibres
  const chromatin = new Group()
  const chroMat = solid('#6b4fd6', { roughness: 0.5 })
  for (let k = 0; k < 9; k++) {
    const pts: Vector3[] = []
    let p = onSphere(rand, NUC_R * 0.55 * rand())
    for (let s = 0; s < 14; s++) {
      pts.push(p.clone())
      p = p.clone().add(new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.34))
      if (p.length() > NUC_R * 0.78) p.multiplyScalar((NUC_R * 0.78) / p.length())
    }
    chromatin.add(meshOf(taperedTube(curve(pts), { tubular: 70, radial: 8, radius: () => 0.026, rounded: 0.05 }), chroMat))
  }
  nucleus.add(chromatin)
  root.add(nucleus)

  // nucleolus is its own part: dense ball inside the nucleus
  const nucleolus = named(new Group(), CELL_MESH.nucleolus)
  nucleolus.position.copy(NUC_C).add(new Vector3(-0.12, 0.06, 0.1))
  nucleolus.add(
    meshOf(
      new SphereGeometry(0.22, 40, 32),
      solid('#3b2a8f', {
        roughness: 0.55,
        bumpMap: grayTexture(fbmField({ size: 128, fx: 10, fy: 10, octaves: 3, seed: 9 }), 128, 3),
        bumpScale: 1.6,
      }),
    ),
  )
  root.add(nucleolus)

  // ---- Mitochondria: outer membrane, folded cristae inside
  const mitochondria = named(new Group(), CELL_MESH.mitochondria)
  const mitoPlaces: [number[], number[]][] = [
    [[1.15, -1.0, 0.45], [0.8, 0.3, 0.5]],
    [[1.45, 0.8, -0.55], [0.3, 0.9, 0.3]],
    [[0.0, -1.5, -0.45], [1, 0.2, 0.2]],
    [[1.3, 0.95, 0.75], [0.2, -0.5, 0.9]],
  ]
  const cristaeMat = solid('#e0692f', { roughness: 0.45 })
  const outerMat = pearl('#ffb06a', 0.36)
  const innerMat = pearl('#ff8c42', 0.5)
  const up = new Vector3(0, 1, 0)
  mitoPlaces.forEach(([pos, dir], mi) => {
    const m = new Group()
    m.position.set(pos[0]!, pos[1]!, pos[2]!)
    m.quaternion.copy(new Quaternion().setFromUnitVectors(up, new Vector3(dir[0]!, dir[1]!, dir[2]!).normalize()))
    const len = 0.62
    const rad = 0.19
    const outer = new CapsuleGeometry(rad, len, 10, 24)
    m.add(meshOf(outer, outerMat))
    m.add(meshOf(new CapsuleGeometry(rad * 0.82, len * 0.92, 8, 20), innerMat))
    // cristae: plates that stick out from alternate sides
    for (let k = 0; k < 8; k++) {
      const y = -len / 2 + (k + 0.5) * (len / 8)
      const plate = meshOf(new CylinderGeometry(rad * 0.78, rad * 0.78, 0.022, 20, 1, false, 0, Math.PI * 1.25), cristaeMat)
      plate.position.y = y
      plate.rotation.y = k % 2 === 0 ? 0 : Math.PI + mi * 0.3
      m.add(plate)
    }
    mitochondria.add(m)
  })
  root.add(mitochondria)

  // ---- Rough ER: folded sheets wrapped around the nucleus, ribosomes on them
  const roughER = named(new Group(), CELL_MESH.roughER)
  const erMat = solid('#f2b6a0', { roughness: 0.42, side: DoubleSide })
  const riboMat = solid('#2c5f9e', { roughness: 0.4 })
  const riboPts: Vector3[] = []
  for (let s = 0; s < 5; s++) {
    const r = NUC_R + 0.14 + s * 0.085
    const wave = 0.035 + s * 0.006
    const nu = 72
    const nv = 40
    const sheet = parametricSurface(
      (u, v, out) => {
        const phi = -0.35 + u * 1.75
        const theta = 0.5 + v * 1.7
        const rr = r + Math.sin(u * 28 + s) * wave * Math.sin(v * Math.PI) + Math.sin(v * 17 + s * 2) * wave * 0.5
        out.set(
          -rr * Math.cos(phi) * Math.sin(theta),
          rr * Math.cos(theta),
          rr * Math.sin(phi) * Math.sin(theta),
        ).add(NUC_C)
      },
      nu,
      nv,
    )
    roughER.add(meshOf(sheet, erMat))
    const pos = sheet.getAttribute('position')
    for (let i = 0; i < pos.count; i += 9) {
      riboPts.push(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)))
    }
  }
  roughER.add(dots(riboPts, 0.026, riboMat, 6))
  root.add(roughER)

  // ---- Smooth ER: branching tubes, no ribosomes
  const smoothER = named(new Group(), CELL_MESH.smoothER)
  const serMat = solid('#e8d77a', { roughness: 0.4 })
  const serStarts = [new Vector3(-0.3, -0.5, -1.35), new Vector3(0.9, -0.2, -1.3), new Vector3(-1.45, 0.35, -0.95)]
  const blocked = (p: Vector3) =>
    p.distanceTo(NUC_C) < 1.45 || p.distanceTo(GOLGI_POS) < 0.95 || p.length() > CELL_R - 0.35
  serStarts.forEach((s, i) => {
    for (let b = 0; b < 4; b++) {
      const pts: Vector3[] = [s.clone()]
      let p = s.clone()
      const heading = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize()
      for (let k = 0; k < 6; k++) {
        let next = p
        for (let tries = 0; tries < 12; tries++) {
          heading.add(new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.9)).normalize()
          const cand = p.clone().addScaledVector(heading, 0.22)
          if (!blocked(cand)) {
            next = cand
            break
          }
        }
        p = next
        pts.push(p.clone())
      }
      smoothER.add(
        meshOf(
          taperedTube(curve(pts), { tubular: 60, radial: 12, radius: (t) => 0.05 - 0.012 * t, roughness: 0.01, seed: i * 5 + b, rounded: 0.05 }),
          serMat,
        ),
      )
    }
  })
  root.add(smoothER)

  // ---- Golgi: curved stacked cisternae with vesicles budding off
  const golgi = named(new Group(), CELL_MESH.golgi)
  golgi.position.copy(GOLGI_POS)
  golgi.scale.setScalar(0.82)
  golgi.rotation.set(0.3, 0.8, 0.4)
  for (let s = 0; s < 6; s++) {
    const w = 0.62 - Math.abs(s - 2.5) * 0.04
    const nu = 48
    const nv = 24
    const cis = parametricSurface(
      (u, v, out) => {
        const x = (u - 0.5) * 2 * w
        const z = (v - 0.5) * 0.7
        const bow = -x * x * 0.7
        const edge = 1 + 0.08 * Math.sin(u * 40 + s * 1.7) * Math.pow(Math.abs(u - 0.5) * 2, 3)
        out.set(x * edge, s * 0.115 + bow + Math.sin(z * 9 + s) * 0.012, z)
      },
      nu,
      nv,
    )
    golgi.add(meshOf(cis, solid('#f0a24c', { roughness: 0.4, side: DoubleSide })))
    // thickened rim so it reads as a flattened sac, not a sheet
    const rim = meshOf(new CylinderGeometry(0.02, 0.02, 0.7, 8), solid('#e8892a'))
    rim.rotation.x = Math.PI / 2
    rim.position.set(-w * 0.99, s * 0.115 - w * w * 0.7 * 0.97, 0)
    golgi.add(rim)
  }
  const ves: Vector3[] = []
  for (let i = 0; i < 9; i++) {
    const side = i % 2 === 0 ? 1 : -1
    ves.push(new Vector3(side * (0.7 + rand() * 0.25), rand() * 0.6, (rand() - 0.5) * 0.6))
  }
  golgi.add(dots(ves, 0.06, solid('#ffd08a', { roughness: 0.25, clearcoat: 1 }), 12))
  root.add(golgi)

  // ---- Lysosomes
  const lysosomes = named(new Group(), CELL_MESH.lysosomes)
  const lyMat = pearl('#8ee08a', 0.55)
  const granMat = solid('#2f7a36', { roughness: 0.5 })
  ;[
    [0.75, -0.25, 1.15],
    [1.65, 0.1, 0.15],
    [0.45, -1.35, 1.0],
    [0.2, 1.45, -0.7],
    [-1.6, 0.9, 0.3],
    [0.9, -1.4, -0.9],
  ].forEach(([x, y, z], i) => {
    const g = new Group()
    g.position.set(x!, y!, z!)
    const s = 0.14 + (i % 3) * 0.02
    g.add(meshOf(new SphereGeometry(s, 24, 18), lyMat))
    const grains: Vector3[] = []
    for (let k = 0; k < 7; k++) grains.push(onSphere(rand, s * 0.5 * rand()))
    g.add(dots(grains, 0.032, granMat, 6))
    lysosomes.add(g)
  })
  root.add(lysosomes)

  // ---- Centrosome: two centrioles at right angles, nine triplets each
  const centrosome = named(new Group(), CELL_MESH.centrosome)
  centrosome.position.set(0.45, 1.5, 0.75)
  const triMat = solid('#e0527a', { roughness: 0.35 })
  const cloud = meshOf(new SphereGeometry(0.34, 24, 18), pearl('#ffd6e4', 0.18))
  centrosome.add(cloud)
  for (let c = 0; c < 2; c++) {
    const cen = new Group()
    cen.rotation.set(c ? Math.PI / 2 : 0, c ? 0.4 : 0, 0)
    cen.position.set(c ? 0.05 : -0.05, 0, c ? 0.12 : -0.05)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2
      const t = meshOf(new CylinderGeometry(0.028, 0.028, 0.36, 10), triMat)
      t.position.set(Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085)
      // triplets are tilted a little, like the blades of a turbine
      t.rotation.y = -a
      cen.add(t)
      const t2 = meshOf(new CylinderGeometry(0.012, 0.012, 0.36, 8), triMat)
      t2.position.set(Math.cos(a) * 0.085 + Math.cos(a + 1.57) * 0.032, 0, Math.sin(a) * 0.085 + Math.sin(a + 1.57) * 0.032)
      cen.add(t2)
    }
    const hub = meshOf(new CylinderGeometry(0.02, 0.02, 0.36, 8), solid('#f6a6bf'))
    cen.add(hub)
    centrosome.add(cen)
  }
  root.add(centrosome)

  // ---- Free ribosomes in the cytoplasm
  const ribosomes = named(new Group(), CELL_MESH.ribosomes)
  const free: Vector3[] = []
  let guard = 0
  while (free.length < 170 && guard++ < 4000) {
    const p = onSphere(rand, 0.4 + rand() * (CELL_R - 0.65))
    if (p.x > 0 && p.z > 0 && p.length() > CELL_R - 0.5) continue
    if (p.distanceTo(NUC_C) < NUC_R + 0.4) continue
    free.push(p)
  }
  const s40 = solid('#3f7ac4', { roughness: 0.4 })
  ribosomes.add(dots(free, 0.04, s40, 8, true))
  ribosomes.add(
    dots(
      free.map((p) => p.clone().add(new Vector3(0.03, 0.04, 0.01))),
      0.028,
      solid('#7fb0e8', { roughness: 0.4 }),
      8,
      true,
    ),
  )
  root.add(ribosomes)

  return root
}
