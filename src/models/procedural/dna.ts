import {
  CylinderGeometry,
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type MeshPhysicalMaterialParameters,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useSceneStore } from '@/shared/stores'
import { meshOf, named } from '../glb/geometry'
import { hideable, onFrame } from './frame'

/** Mesh names. The content file points at these. */
export const DNA_MESH = {
  backbone1: 'dna_backbone_1',
  backbone2: 'dna_backbone_2',
  adenine: 'dna_adenine',
  thymine: 'dna_thymine',
  guanine: 'dna_guanine',
  cytosine: 'dna_cytosine',
  hydrogenBonds: 'dna_hydrogen_bonds',
  newStrand: 'dna_new_strand',
} as const

type Base = 'A' | 'T' | 'G' | 'C'
const PAIR: Record<Base, Base> = { A: 'T', T: 'A', G: 'C', C: 'G' }
/** Purines (A, G) are the longer two-ring bases; pyrimidines (T, C) are shorter. */
const BASE_LEN: Record<Base, number> = { A: 0.82, G: 0.82, T: 0.58, C: 0.58 }
const BASE_COLOR: Record<Base, string> = { A: '#4f8dff', T: '#ffb84d', G: '#45d483', C: '#ff6b81' }
const BONDS: Record<Base, number> = { A: 2, T: 2, G: 3, C: 3 }

const N = 22
const RISE = 0.17
const TWIST = (36 * Math.PI) / 180
const R = 0.8
const SUGAR_R = 0.09
const BOND_R = 0.022
const BOND_LEN = 0.12
/** How far each strand moves sideways when fully unzipped. */
const SEP = 1.15
/** Base pairs over which the fork opens. */
const FORK = 4
/** Base pairs of lag before the copy starts, and over which one nucleotide grows in. */
const COPY_LAG = 2
const COPY = 3

const SEQ = 'ATGCGTACCGATTAGCGCATAG'.split('') as Base[]

const UP = new Vector3(0, 1, 0)
const tmpDir = new Vector3()
const tmpMid = new Vector3()
const tmpQ = new Quaternion()

const unitCyl = new CylinderGeometry(1, 1, 1, 10, 1)
const sugarGeo = new SphereGeometry(SUGAR_R, 20, 14)
const roundedBase = (len: number) => new RoundedBoxGeometry(len, 0.1, 0.15, 4, 0.035)
const baseGeo: Record<Base, RoundedBoxGeometry> = {
  A: roundedBase(BASE_LEN.A),
  G: roundedBase(BASE_LEN.G),
  T: roundedBase(BASE_LEN.T),
  C: roundedBase(BASE_LEN.C),
}

function glossy(color: string, extra: MeshPhysicalMaterialParameters = {}) {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.4,
    ...extra,
  })
}

/** A cylinder mesh stretched between two points. */
function placeSegment(m: Mesh, a: Vector3, b: Vector3, radius: number, along = 1) {
  tmpDir.subVectors(b, a)
  const len = tmpDir.length()
  tmpMid.addVectors(a, b).multiplyScalar(0.5)
  m.position.copy(tmpMid)
  m.scale.set(radius, Math.max(1e-3, len * along), radius)
  m.quaternion.copy(tmpQ.setFromUnitVectors(UP, tmpDir.normalize()))
}

/** Sets the group's origin to the centre of its children, so labels pin to the right place. */
function anchor(g: Group) {
  const c = new Vector3()
  g.children.forEach((ch) => c.add(ch.position))
  if (g.children.length) c.divideScalar(g.children.length)
  g.position.copy(c)
  g.children.forEach((ch) => ch.position.sub(c))
}

const ease = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

interface Nucleotide {
  sugar: Mesh
  base: Mesh
  /** Rest positions in model space. */
  sugarHome: Vector3
  baseHome: Vector3
  side: 1 | -1
}

interface Pair {
  i: number
  a: Nucleotide
  b: Nucleotide
  bonds: Mesh[]
  /** The copy made on each template once it is exposed. */
  copyOnA: Nucleotide
  copyOnB: Nucleotide
  copyBondsA: Mesh[]
  copyBondsB: Mesh[]
}

/**
 * B-DNA double helix: two sugar-phosphate backbones, colour-coded bases
 * (purines long, pyrimidines short) and hydrogen bonds between them, two
 * for A-T and three for G-C. The scene's `explode` unzips it from the top
 * and each exposed strand grows a new complementary strand, so the model
 * shows semi-conservative replication by hand.
 */
export function buildDna(): Group {
  const root = new Group()
  root.name = 'dna'

  const backbone1 = named(new Group(), DNA_MESH.backbone1)
  const backbone2 = named(new Group(), DNA_MESH.backbone2)
  const baseGroups: Record<Base, Group> = {
    A: named(new Group(), DNA_MESH.adenine),
    T: named(new Group(), DNA_MESH.thymine),
    G: named(new Group(), DNA_MESH.guanine),
    C: named(new Group(), DNA_MESH.cytosine),
  }
  const hbonds = named(new Group(), DNA_MESH.hydrogenBonds)
  const copies = named(new Group(), DNA_MESH.newStrand)
  ;[backbone1, backbone2, hbonds, copies, ...Object.values(baseGroups)].forEach(
    (g) => (g.userData.fixed = true),
  )

  const bb1Mat = glossy('#dfe4ee', { emissive: '#7fa6ff', emissiveIntensity: 0.35, sheen: 1, sheenColor: new Color('#9fe8ff') })
  const bb2Mat = glossy('#b4bfd2', { emissive: '#5fd6c4', emissiveIntensity: 0.35, sheen: 1, sheenColor: new Color('#9fe8ff') })
  const newMat = glossy('#7aefdc', { emissive: '#2fd6bd', emissiveIntensity: 0.7 })
  const bondMat = glossy('#f4f6fa', { roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.3 })
  const baseMat: Record<Base, MeshPhysicalMaterial> = {
    A: glossy(BASE_COLOR.A, { emissive: BASE_COLOR.A, emissiveIntensity: 0.6 }),
    T: glossy(BASE_COLOR.T, { emissive: BASE_COLOR.T, emissiveIntensity: 0.6 }),
    G: glossy(BASE_COLOR.G, { emissive: BASE_COLOR.G, emissiveIntensity: 0.6 }),
    C: glossy(BASE_COLOR.C, { emissive: BASE_COLOR.C, emissiveIntensity: 0.6 }),
  }

  const y0 = ((N - 1) * RISE) / 2

  const nucleotide = (
    i: number,
    side: 1 | -1,
    base: Base,
    mat: MeshPhysicalMaterial,
    group: Group,
    baseGroup: Group,
  ): Nucleotide => {
    const theta = i * TWIST + (side === 1 ? 0 : Math.PI)
    const y = y0 - i * RISE
    const u = new Vector3(Math.cos(theta), 0, Math.sin(theta))
    const sugarHome = u.clone().multiplyScalar(R).setY(y)
    const baseHome = u
      .clone()
      .multiplyScalar(R - 0.04 - BASE_LEN[base] / 2)
      .setY(y)
    const sugar = meshOf(sugarGeo, mat)
    sugar.position.copy(sugarHome)
    group.add(sugar)
    const b = meshOf(baseGeo[base], baseMat[base])
    b.position.copy(baseHome)
    b.rotation.y = -theta
    baseGroup.add(b)
    return { sugar, base: b, sugarHome, baseHome, side }
  }

  const bondSet = (count: number, mat: MeshPhysicalMaterial, group: Group): Mesh[] =>
    Array.from({ length: count }, () => {
      const m = hideable(meshOf(unitCyl, mat))
      group.add(m)
      return m
    })

  const pairs: Pair[] = []
  for (let i = 0; i < N; i++) {
    const ba = SEQ[i % SEQ.length]!
    const bb = PAIR[ba]
    const a = nucleotide(i, 1, ba, bb1Mat, backbone1, baseGroups[ba])
    const b = nucleotide(i, -1, bb, bb2Mat, backbone2, baseGroups[bb])
    const bonds = bondSet(BONDS[ba], bondMat, hbonds)
    // copies: the new partner of each template, same base as the original partner
    const copyOnA = nucleotide(i, -1, bb, newMat, copies, copies)
    const copyOnB = nucleotide(i, 1, ba, newMat, copies, copies)
    ;[copyOnA, copyOnB].forEach((n) => {
      hideable(n.sugar)
      hideable(n.base)
      n.sugar.visible = n.base.visible = false
    })
    pairs.push({
      i,
      a,
      b,
      bonds,
      copyOnA,
      copyOnB,
      copyBondsA: bondSet(BONDS[ba], bondMat, copies),
      copyBondsB: bondSet(BONDS[ba], bondMat, copies),
    })
  }

  // backbone links between neighbouring sugars, and the same for the new strands
  const link = (mat: MeshPhysicalMaterial, group: Group, hide = false) =>
    Array.from({ length: N - 1 }, () => {
      const m = meshOf(unitCyl, mat)
      if (hide) hideable(m).visible = false
      group.add(m)
      return m
    })
  const seg1 = link(bb1Mat, backbone1)
  const seg2 = link(bb2Mat, backbone2)
  const newSeg1 = link(newMat, copies, true)
  const newSeg2 = link(newMat, copies, true)

  root.add(backbone1, backbone2, hbonds, copies, ...Object.values(baseGroups))
  const groups = [backbone1, backbone2, hbonds, copies, ...Object.values(baseGroups)]
  groups.forEach(anchor)
  // children were shifted by the anchor; keep world-space homes by reading back
  const local = (g: Group, v: Vector3) => v.clone().sub(g.position)

  const sa = new Vector3()
  const sb = new Vector3()
  let progress = 0

  const update = (dt: number) => {
    const target = useSceneStore.getState().explode * (N + FORK + COPY_LAG + COPY)
    progress += (target - progress) * (1 - Math.exp(-6 * dt))
    if (Math.abs(target - progress) < 1e-3) progress = target

    for (const p of pairs) {
      const open = ease(clamp01((progress - p.i) / FORK))
      const copy = ease(clamp01((progress - p.i - FORK - COPY_LAG) / COPY))

      const dx = open * SEP
      const place = (n: Nucleotide, group: Group, baseGroup: Group, shift: number) => {
        n.sugar.position.copy(local(group, n.sugarHome)).x += shift
        n.base.position.copy(local(baseGroup, n.baseHome)).x += shift
      }
      place(p.a, backbone1, p.a.base.parent as Group, dx)
      place(p.b, backbone2, p.b.base.parent as Group, -dx)

      // hydrogen bonds stretch a little, then break
      const bondScale = clamp01(1 - open * 1.6)
      p.bonds.forEach((m, k) => {
        m.visible = bondScale > 0.01
        if (!m.visible) return
        bondEnds(p.a, p.b, k, p.bonds.length, sa, sb)
        sa.x += dx
        sb.x -= dx
        placeSegment(m, local(hbonds, sa), local(hbonds, sb), BOND_R, 1)
        m.scale.y *= Math.max(0.02, Math.min(1, 1 - open * 0.8))
        m.scale.x = m.scale.z = BOND_R * bondScale
      })

      // new strands grow on each exposed template
      const grow = (n: Nucleotide, shift: number, bonds: Mesh[], template: Nucleotide) => {
        const on = copy > 0.001
        n.sugar.visible = n.base.visible = on
        bonds.forEach((m) => (m.visible = on))
        if (!on) return
        n.sugar.position.copy(local(copies, n.sugarHome)).x += shift
        n.base.position.copy(local(copies, n.baseHome)).x += shift
        n.sugar.scale.setScalar(copy)
        n.base.scale.setScalar(copy)
        bonds.forEach((m, k) => {
          bondEnds(template, n, k, bonds.length, sa, sb)
          sa.x += shift
          sb.x += shift
          placeSegment(m, local(copies, sa), local(copies, sb), BOND_R * copy, 1)
        })
      }
      grow(p.copyOnA, dx, p.copyBondsA, p.a)
      grow(p.copyOnB, -dx, p.copyBondsB, p.b)
    }

    for (let i = 0; i < N - 1; i++) {
      const p = pairs[i]!
      const q = pairs[i + 1]!
      placeSegment(seg1[i]!, p.a.sugar.position, q.a.sugar.position, 0.045)
      placeSegment(seg2[i]!, p.b.sugar.position, q.b.sugar.position, 0.045)
      const on1 = p.copyOnA.sugar.visible && q.copyOnA.sugar.visible
      newSeg1[i]!.visible = on1
      if (on1) {
        placeSegment(newSeg1[i]!, p.copyOnA.sugar.position, q.copyOnA.sugar.position, 0.045)
        newSeg1[i]!.scale.y *= Math.min(p.copyOnA.sugar.scale.x, q.copyOnA.sugar.scale.x)
      }
      const on2 = p.copyOnB.sugar.visible && q.copyOnB.sugar.visible
      newSeg2[i]!.visible = on2
      if (on2) {
        placeSegment(newSeg2[i]!, p.copyOnB.sugar.position, q.copyOnB.sugar.position, 0.045)
        newSeg2[i]!.scale.y *= Math.min(p.copyOnB.sugar.scale.x, q.copyOnB.sugar.scale.x)
      }
    }
  }

  onFrame(pairs[0]!.a.sugar, update)
  update(0)
  return root
}

/** Ends of hydrogen bond `k` of `count` between two paired nucleotides, in model space. */
function bondEnds(
  a: Nucleotide,
  b: Nucleotide,
  k: number,
  count: number,
  outA: Vector3,
  outB: Vector3,
) {
  // direction from a's base tip to b's base tip
  const tipA = innerTip(a)
  const tipB = innerTip(b)
  tmpDir.subVectors(tipB, tipA)
  const len = tmpDir.length()
  tmpDir.normalize()
  // spread bonds sideways, across the width of the base
  const side = new Vector3(-tmpDir.z, 0, tmpDir.x)
  const offset = (k - (count - 1) / 2) * 0.045
  const mid = tmpMid.addVectors(tipA, tipB).multiplyScalar(0.5)
  const half = Math.max(BOND_LEN, len) / 2
  outA.copy(mid).addScaledVector(tmpDir, -half).addScaledVector(side, offset)
  outB.copy(mid).addScaledVector(tmpDir, half).addScaledVector(side, offset)
}

const tipTmp = new Vector3()
/** The inner end of a base, where it meets its partner. */
function innerTip(n: Nucleotide): Vector3 {
  const dir = tipTmp.copy(n.baseHome).setY(0)
  const r = dir.length()
  dir.normalize()
  const len = n.base.geometry.boundingBox
    ? n.base.geometry.boundingBox.max.x - n.base.geometry.boundingBox.min.x
    : 0.6
  return new Vector3()
    .copy(dir)
    .multiplyScalar(r - len / 2)
    .setY(n.baseHome.y)
}

Object.values(baseGeo).forEach((g) => g.computeBoundingBox())
