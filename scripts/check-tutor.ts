import assert from 'node:assert/strict'
import { POST } from '../api/tutor'
import { buildDailyRound } from '../src/tutor/round'
import { nextMemory, INTERVALS, type MemoryMap } from '../src/tutor/memory'
import { verifyTask } from '../src/tutor/engine'

const t0 = 1_000_000_000_000
let m = nextMemory(undefined, 'correct', t0)
assert.equal(m.box, 1)
assert.equal(m.due, t0 + INTERVALS[1])
m = nextMemory(m, 'wrong', t0)
assert.equal(m.box, 0)
assert.ok(m.score < 0.6)

const fresh = buildDailyRound({}, t0)
assert.equal(fresh.length, 5)
const parts: MemoryMap = { dna: { adenine: { ...m, due: t0 - 1 } } }
const r = buildDailyRound(parts, t0)
assert.equal(r[0]?.mcq.partId === 'adenine' || r[0]?.modelId !== 'dna', true)
assert.equal(new Set(r.map((q) => q.modelId + q.mcq.partId)).size, r.length)

const scene = { selectedPart: 'adenine', explode: 0, pull: null, rotation: { x: 0, y: 0 } }
const sel = { id: 't', partId: 'adenine', kind: 'select', prompt: '' } as const
assert.ok(verifyTask(sel, scene, { x: 0, y: 0 }))
assert.ok(!verifyTask({ ...sel, kind: 'explode' }, scene, { x: 0, y: 0 }))
assert.ok(
  verifyTask({ ...sel, kind: 'rotate' }, { ...scene, rotation: { x: 0, y: 1 } }, { x: 0, y: 0 }),
)

delete process.env.LLM_API_KEY
const post = (b: unknown) =>
  POST(new Request('http://x/api/tutor', { method: 'POST', body: JSON.stringify(b) }))
assert.equal((await post({})).status, 503)
process.env.LLM_API_KEY = 'x'
assert.equal((await post({})).status, 400)
assert.equal(
  (
    await post({
      modelId: 'dna',
      partId: 'a',
      partLabel: 'A',
      note: 'n',
      level: 9,
      lang: 'en',
      history: [],
    })
  ).status,
  400,
)
console.log('tutor checks pass')

// Streaming: a mocked Gemini reply, split mid-line, with a hidden thought part.
const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
const wire =
  sse({ candidates: [{ content: { parts: [{ text: 'secret', thought: true }] } }] }) +
  sse({ candidates: [{ content: { parts: [{ text: 'Adenine pairs ' }] } }] }) +
  sse({ candidates: [{ content: { parts: [{ text: 'with thymine.' }] } }] })
const realFetch = globalThis.fetch
let seen: { url: string; key: string | null; body: string } | null = null
globalThis.fetch = (async (url: string, init: RequestInit) => {
  seen = { url, key: new Headers(init.headers).get('x-goog-api-key'), body: String(init.body) }
  const cut = Math.floor(wire.length / 2)
  const enc = new TextEncoder()
  return new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(wire.slice(0, cut)))
        c.enqueue(enc.encode(wire.slice(cut)))
        c.close()
      },
    }),
  )
}) as typeof fetch
const good = {
  modelId: 'dna',
  partId: 'adenine',
  partLabel: 'Adenine',
  note: 'A pairs with T.',
  level: 'neet',
  lang: 'en',
  history: [],
}
const res = await post(good)
assert.equal(res.status, 200)
assert.equal(await res.text(), 'Adenine pairs with thymine.')
assert.equal(seen!.key, 'x')
assert.ok(!seen!.url.includes('key='))
assert.ok(seen!.body.includes('A pairs with T.'))

// Upstream failure becomes a 502 so the panel shows the stored note.
globalThis.fetch = (async () => new Response('no', { status: 500 })) as typeof fetch
assert.equal((await post(good)).status, 502)

// The per-visitor limit kicks in.
globalThis.fetch = realFetch
let last = 0
for (let i = 0; i < 14; i++) last = (await post({ ...good, level: 'x' })).status
assert.equal(last, 400) // bad bodies never count against the limit
globalThis.fetch = (async () => new Response('no', { status: 500 })) as typeof fetch
let limit = 0
for (let i = 0; i < 20; i++) limit = (await post(good)).status
assert.equal(limit, 429)
console.log('tutor stream checks pass')
