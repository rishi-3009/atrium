/* Headless check of the built models and their content. Run: npm run check:models */
import { Box3, Mesh, Vector3, type Object3D, type BufferGeometry } from 'three'
import { glbModels } from '../src/models/glb'
import { buildFlower } from '../src/models/glb/flower'

type Build = { id: string; build: () => Object3D; parts: string[] }

function stats(g: BufferGeometry) {
  const p = g.getAttribute('position')
  let bad = 0
  for (let i = 0; i < p.count * 3; i++) if (!Number.isFinite((p.array as Float32Array)[i]!)) bad++
  return { verts: p.count, tris: (g.index?.count ?? 0) / 3, bad }
}

/** Mean of dot(normal, position - centroid). Positive = normals face outward on closed bodies. */
function outward(g: BufferGeometry): number {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  const c = new Vector3()
  for (let i = 0; i < p.count; i++) c.add(new Vector3().fromBufferAttribute(p, i))
  c.divideScalar(p.count)
  let s = 0
  for (let i = 0; i < p.count; i++) {
    s += new Vector3().fromBufferAttribute(n, i).dot(new Vector3().fromBufferAttribute(p, i).sub(c).normalize())
  }
  return s / p.count
}

const models: Build[] = Object.values(glbModels).map((m) => ({
  id: m.id,
  build: m.build,
  parts: m.content.definition.parts.map((p) => p.meshName),
}))

/** Content checks: note keys, MCQ shape, task targets. */
function checkContent() {
  let bad = false
  const fail = (msg: string) => { console.log('  FAIL ' + msg); bad = true }
  for (const m of Object.values(glbModels)) {
    const { definition: d, notes, mcqs, overview } = m.content
    const ids = new Set(d.parts.map((p) => p.id))
    if (!overview) fail(`${d.id}: empty overview`)
    for (const p of d.parts) {
      if (!notes[p.noteKey]) fail(`${d.id}: no note for ${p.noteKey}`)
      if (!p.label) fail(`${d.id}: part ${p.id} has no label`)
    }
    for (const k of Object.keys(notes)) if (!d.parts.some((p) => p.noteKey === k)) fail(`${d.id}: unused note ${k}`)
    for (const t of d.tasks) if (!ids.has(t.partId)) fail(`${d.id}: task ${t.id} targets unknown part ${t.partId}`)
    const seen = new Set<string>()
    for (const q of mcqs) {
      if (seen.has(q.id)) fail(`${d.id}: duplicate MCQ id ${q.id}`)
      seen.add(q.id)
      if (!ids.has(q.partId)) fail(`${q.id}: unknown part ${q.partId}`)
      if (new Set(q.options).size !== 4) fail(`${q.id}: options are not 4 different answers`)
      if (q.answer < 0 || q.answer > 3) fail(`${q.id}: answer out of range`)
      if (!q.explanation) fail(`${q.id}: no explanation`)
    }
    const covered = new Set(mcqs.map((q) => q.partId))
    const missing = d.parts.filter((p) => !covered.has(p.id)).map((p) => p.id)
    console.log(`content ${d.id}: ${d.parts.length} parts, ${d.tasks.length} tasks, ${mcqs.length} MCQs` + (missing.length ? `; no MCQ for: ${missing.join(', ')}` : ''))
  }
  return bad
}

let failed = checkContent()
for (const m of models) {
  const t0 = performance.now()
  const root = m.build()
  const ms = Math.round(performance.now() - t0)
  let verts = 0, tris = 0, meshes = 0
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    meshes++
    const s = stats(o.geometry)
    verts += s.verts; tris += s.tris
    if (s.bad) { console.log(`  FAIL NaN in ${o.parent?.name}/${o.name}`); failed = true }
  })
  console.log(`${m.id}: ${meshes} meshes, ${verts} verts, ${tris} tris, built in ${ms} ms`)
  const box = new Box3().setFromObject(root)
  console.log('  size', box.getSize(new Vector3()).toArray().map((v) => v.toFixed(2)).join(' x '))
  for (const name of m.parts) {
    const node = root.getObjectByName(name)
    if (!node) { console.log(`  FAIL missing part ${name}`); failed = true; continue }
    let n = 0
    node.traverse((o) => o instanceof Mesh && n++)
    if (!n) { console.log(`  FAIL part ${name} has no mesh`); failed = true }
    const first = node.children.find((c) => c instanceof Mesh) as Mesh | undefined
    if (first && /ventricle|atrium/.test(name)) {
      const o = outward(first.geometry)
      console.log(`  ${name}: outward ${o.toFixed(2)}`)
      if (o <= 0) { console.log('  FAIL normals face inward'); failed = true }
    }
  }
}

/** Flags parts whose vertices come within `gap` of another part's vertices (likely clipping). */
function clipping(root: Object3D, skip: string[][], gap = 0.05) {
  const groups = root.children.filter((c) => c.name)
  const pts = new Map<string, Vector3[]>()
  root.updateWorldMatrix(true, true)
  for (const g of groups) {
    const arr: Vector3[] = []
    g.traverse((o) => {
      if (!(o instanceof Mesh) || (o as { isInstancedMesh?: boolean }).isInstancedMesh) return
      const p = o.geometry.getAttribute('position')
      for (let i = 0; i < p.count; i += 3) arr.push(new Vector3().fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld))
    })
    pts.set(g.name, arr)
  }
  const names = [...pts.keys()]
  for (let a = 0; a < names.length; a++) {
    for (let b = a + 1; b < names.length; b++) {
      const A = names[a]!, B = names[b]!
      if (skip.some(([x, y]) => (x === A && y === B) || (x === B && y === A))) continue
      let hits = 0
      for (const p of pts.get(A)!) {
        for (const q of pts.get(B)!) if (p.distanceToSquared(q) < gap * gap) { hits++; break }
      }
      if (hits > 8) console.log(`  CLIP ${A} x ${B}: ${hits} vertices`)
    }
  }
}
for (const m of models) {
  if (m.id !== 'cell') continue
  console.log('clipping check', m.id)
  clipping(m.build(), [['cell_membrane', 'cell_nucleus'], ['cell_nucleus', 'cell_nucleolus'], ['cell_rough_er', 'cell_nucleus']])
}
{
  console.log('clipping check flower')
  const j = (a: string, b: string): [string, string] => [`flower_${a}`, `flower_${b}`]
  clipping(buildFlower(), [
    j('pedicel', 'thalamus'), j('thalamus', 'sepals'), j('thalamus', 'petals'), j('thalamus', 'stamens'),
    j('thalamus', 'ovary'), j('ovary', 'ovules'), j('ovary', 'style'), j('style', 'stigma'), j('sepals', 'petals'),
    j('petals', 'stamens'), // both attach at the thalamus rim
  ])
}
console.log(failed ? 'CHECK FAILED' : 'ALL OK')
process.exit(failed ? 1 : 0)
