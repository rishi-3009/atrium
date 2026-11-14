import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Object3D,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  CapsuleGeometry,
  TorusGeometry,
  type MeshPhysicalMaterialParameters,
  type Texture,
} from 'three'
import { dots, meshOf, named, parametricSurface, taperedTube, fixPoles } from './geometry'
import { fbm3, fbmField, grayTexture, mottleTexture, rng } from './noise'

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
/** The cell is taller than it is wide, like the teaching diagram. */
const CELL_SCALE = new Vector3(1.05, 1.22, 0.62)
/** Where the front is sliced off, so the inside faces the viewer like a textbook section. */
const CUT_Z = 0.42
const NUC_C = new Vector3(0.25, 0.1, -0.1)
const NUC_R = 0.9
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
    emissive: new Color(color),
    emissiveIntensity: 0.1,
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
    emissive: new Color(color),
    emissiveIntensity: 0.14,
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

  // ---- Cell membrane: a sliced cell like the textbook picture. A deep blue back
  // wall, a glowing gel face where it is cut, a bright rim, and gold filaments.
  const membrane = named(new Group(), CELL_MESH.membrane)
  membrane.userData.fixed = true
  const noPick = <T extends Object3D>(o: T): T => {
    o.raycast = () => {}
    return o
  }
  const Rx = CELL_R * CELL_SCALE.x
  const Ry = CELL_R * CELL_SCALE.y
  const Rz = CELL_R * CELL_SCALE.z
  /** Polar angle from the back pole at which the cut plane meets the shell. */
  const alphaMax = Math.acos(-CUT_Z / Rz)
  const rimX = Rx * Math.sin(alphaMax)
  const rimY = Ry * Math.sin(alphaMax)

  const wallGeo = (r: number) => {
    const nu = 96
    const nv = 56
    const g = parametricSurface(
      (u, v, out) => {
        const beta = u * Math.PI * 2
        const alpha = v * alphaMax
        const bumpy = 1 + fbm3(Math.cos(beta) * 1.6, Math.cos(alpha) * 1.6, Math.sin(beta) * 1.6) * 0.02
        const k = r / CELL_R
        out.set(
          Rx * k * bumpy * Math.sin(alpha) * Math.cos(beta),
          Ry * k * bumpy * Math.sin(alpha) * Math.sin(beta),
          -Rz * k * bumpy * Math.cos(alpha),
        )
      },
      nu,
      nv,
      { closedU: true, flip: true },
    )
    fixPoles(g, nu, nv)
    return g
  }
  const wallMap = mottleTexture(fbmField({ size: 256, fx: 6, fy: 4, octaves: 4, seed: 21 }), 256, '#123a8a', '#2e7ae0', 1.8)
  const wall = pearl('#ffffff', 0.62)
  wall.map = wallMap
  wall.emissive = new Color('#1d56c0')
  wall.emissiveIntensity = 0.3
  wall.iridescence = 0
  wall.clearcoat = 0.3
  const wallMesh = noPick(meshOf(wallGeo(CELL_R), wall))
  wallMesh.renderOrder = -10
  membrane.add(wallMesh)
  const glass = pearl('#9fd4ff', 0.1)
  glass.sheen = 1
  const glassMesh = noPick(meshOf(wallGeo(CELL_R + 0.05), glass))
  glassMesh.renderOrder = -9
  membrane.add(glassMesh)

  // the cut face: a thin veil of glowing gel in front of the organelles
  const faceGeo = (() => {
    const nu = 96
    const nv = 24
    const g = parametricSurface(
      (u, v, out) => {
        const r = u
        const beta = v * Math.PI * 2
        out.set(rimX * r * Math.cos(beta), rimY * r * Math.sin(beta), CUT_Z)
      },
      nv,
      nu / 4,
    )
    const pos = g.getAttribute('position')
    const uv = g.getAttribute('uv')
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * rimX) + 0.5, pos.getY(i) / (2 * rimY) + 0.5)
    return g
  })()
  const gel = new MeshPhysicalMaterial({
    map: mottleTexture(fbmField({ size: 256, fx: 7, fy: 7, octaves: 4, seed: 33 }), 256, '#1b57b8', '#5fb0ff', 1.9),
    transparent: true,
    opacity: 0.34,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    emissive: new Color('#2a74d8'),
    emissiveIntensity: 0.22,
    side: DoubleSide,
    depthWrite: false,
  })
  const faceMesh = noPick(meshOf(faceGeo, gel))
  faceMesh.renderOrder = 10
  membrane.add(faceMesh)

  // bright cut edge: the membrane seen in section
  const rimMat = solid('#8fe8ff', { roughness: 0.2, emissiveIntensity: 0.7, clearcoat: 1 })
  const rim = meshOf(new TorusGeometry(1, 0.045, 18, 128), rimMat)
  rim.scale.set(rimX, rimY, 1)
  rim.position.z = CUT_Z
  membrane.add(rim)

  // phospholipid heads along the rim and across the back wall
  const heads: Vector3[] = []
  let guardH = 0
  while (heads.length < 420 && guardH++ < 8000) {
    const p = onSphere(rand, CELL_R + 0.02).multiply(CELL_SCALE)
    if (p.z > CUT_Z - 0.03) continue
    heads.push(p)
  }
  membrane.add(dots(heads, 0.034, solid('#f4efe6', { roughness: 0.25 }), 8))
  const proteins = heads.filter((_, i) => i % 18 === 0).map((p) => p.clone().multiplyScalar(1.012))
  membrane.add(dots(proteins, 0.085, solid('#37c6c0', { roughness: 0.3 }), 10))

  // cytoskeleton: thin gold filaments wandering through the cytoplasm
  const filMat = solid('#f2c14e', { roughness: 0.35, emissiveIntensity: 0.5 })
  for (let f = 0; f < 34; f++) {
    const pts: Vector3[] = []
    const ang = rand() * Math.PI * 2
    const rad = 0.35 + rand() * 0.6
    let p = new Vector3(Math.cos(ang) * rimX * rad, Math.sin(ang) * rimY * rad, CUT_Z - 0.06 - rand() * 0.5)
    let h = rand() * Math.PI * 2
    for (let k = 0; k < 7; k++) {
      pts.push(p.clone())
      h += (rand() - 0.5) * 0.9
      p = p.clone().add(new Vector3(Math.cos(h) * 0.42, Math.sin(h) * 0.42, (rand() - 0.5) * 0.12))
      const e = (p.x / (rimX * 0.95)) ** 2 + (p.y / (rimY * 0.95)) ** 2
      if (e > 1) {
        p.x /= Math.sqrt(e)
        p.y /= Math.sqrt(e)
      }
    }
    membrane.add(noPick(meshOf(taperedTube(curve(pts), { tubular: 48, radial: 6, radius: () => 0.011, rounded: 0.1 }), filMat)))
  }
  root.add(membrane)

  // ---- Nucleus: envelope with pores, chromatin and a nucleolus
  const nucleus = named(new Group(), CELL_MESH.nucleus)
  nucleus.position.copy(NUC_C)
  const envBump = grayTexture(fbmField({ size: 256, fx: 22, fy: 22, octaves: 2, seed: 8 }), 256, 3.2)
  envBump.repeat.set(3, 2)
  const envelope = meshOf(new SphereGeometry(NUC_R, 72, 56), pearl('#8a63f0', 0.22, envBump))
  nucleus.add(envelope)
  // nucleoplasm: the gel inside the envelope
  nucleus.add(meshOf(new SphereGeometry(NUC_R * 0.9, 48, 36), pearl('#5b3fd0', 0.16)))
  const pores: Vector3[] = []
  for (let i = 0; i < 90; i++) pores.push(onSphere(rand, NUC_R + 0.005))
  nucleus.add(dots(pores, 0.04, solid('#241a4f', { roughness: 0.6 }), 8))
  // chromatin: a tangle of thin fibres
  const chromatin = new Group()
  const chroMat = solid('#b79bff', { roughness: 0.5 })
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
      new SphereGeometry(0.26, 40, 32),
      solid('#4aa8ff', {
        roughness: 0.4,
        emissiveIntensity: 0.7,
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
  const cristaeMat = solid('#ff7a2e', { roughness: 0.45, emissiveIntensity: 0.3 })
  const outerMat = pearl('#ff9a4a', 0.2)
  const innerMat = pearl('#ff7a2e', 0.3)
  const up = new Vector3(0, 1, 0)
  mitoPlaces.forEach(([pos, dir], mi) => {
    const m = new Group()
    m.position.set(pos[0]!, pos[1]!, pos[2]!)
    m.quaternion.copy(new Quaternion().setFromUnitVectors(up, new Vector3(dir[0]!, dir[1]!, dir[2]!).normalize()))
    const len = 0.8
    const rad = 0.25
    const outer = new CapsuleGeometry(rad, len, 10, 24)
    m.add(meshOf(outer, outerMat))
    m.add(meshOf(new CapsuleGeometry(rad * 0.82, len * 0.92, 8, 20), innerMat))
    // cristae: plates that stick out from alternate sides
    for (let k = 0; k < 10; k++) {
      const y = -len / 2 + (k + 0.5) * (len / 10)
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
  const erMat = solid('#7a6cf0', { roughness: 0.42, side: DoubleSide, emissiveIntensity: 0.2 })
  const riboMat = solid('#e8584c', { roughness: 0.4 })
  const riboPts: Vector3[] = []
  for (let s = 0; s < 7; s++) {
    const r = NUC_R + 0.14 + s * 0.078
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
  const serMat = solid('#9fb0ff', { roughness: 0.4 })
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
  for (let s = 0; s < 7; s++) {
    const w = 0.66 - Math.abs(s - 3) * 0.04
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
    golgi.add(meshOf(cis, solid('#56c46a', { roughness: 0.4, side: DoubleSide, emissiveIntensity: 0.22 })))
    // thickened rim so it reads as a flattened sac, not a sheet
    const rim = meshOf(new CylinderGeometry(0.02, 0.02, 0.7, 8), solid('#3aa655'))
    rim.rotation.x = Math.PI / 2
    rim.position.set(-w * 0.99, s * 0.115 - w * w * 0.7 * 0.97, 0)
    golgi.add(rim)
  }
  const ves: Vector3[] = []
  for (let i = 0; i < 9; i++) {
    const side = i % 2 === 0 ? 1 : -1
    ves.push(new Vector3(side * (0.7 + rand() * 0.25), rand() * 0.6, (rand() - 0.5) * 0.6))
  }
  golgi.add(dots(ves, 0.06, solid('#9be8a6', { roughness: 0.25, clearcoat: 1 }), 12))
  root.add(golgi)

  // ---- Lysosomes
  const lysosomes = named(new Group(), CELL_MESH.lysosomes)
  const lyMat = pearl('#a070e0', 0.85)
  const granMat = solid('#4a2a8a', { roughness: 0.5 })
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
  const triMat = solid('#f08a30', { roughness: 0.35 })
  const cloud = meshOf(new SphereGeometry(0.34, 24, 18), pearl('#ffd0a0', 0.16))
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
    const hub = meshOf(new CylinderGeometry(0.02, 0.02, 0.36, 8), solid('#ffc890'))
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
    if (p.z > 0.6) continue
    if (p.distanceTo(NUC_C) < NUC_R + 0.4) continue
    free.push(p.multiply(new Vector3(1, 1.15, 1)))
  }
  const s40 = solid('#f4f6ff', { roughness: 0.4 })
  ribosomes.add(dots(free, 0.04, s40, 8, true))
  ribosomes.add(
    dots(
      free.map((p) => p.clone().add(new Vector3(0.03, 0.04, 0.01))),
      0.028,
      solid('#c9d4ff', { roughness: 0.4 }),
      8,
      true,
    ),
  )
  root.add(ribosomes)

  const inner = new Group()
  inner.name = 'cell_organelles'
  inner.scale.z = CELL_SCALE.z
  for (const child of root.children.slice()) {
    if (child !== membrane) inner.add(child)
  }
  root.add(inner)

  return root
}
