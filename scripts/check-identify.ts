import assert from 'node:assert/strict'
import { POST, toResult } from '../api/identify'

// Reply parsing: a known id passes, anything else becomes "no model".
assert.equal(toResult('{"modelId":"heart","title":"Heart","explanation":"x"}')?.modelId, 'heart')
assert.equal(toResult('{"modelId":"heart","title":"Heart","explanation":"x"}')?.explanation, '')
assert.equal(
  toResult('{"modelId":"none","title":"Kidney","explanation":"Labels: cortex."}')?.modelId,
  null,
)
assert.equal(toResult('{"modelId":"liver","title":"","explanation":"y"}')?.modelId, null)
assert.equal(toResult('not json'), null)

const post = (body: unknown, ip = '1.1.1.1') =>
  POST(
    new Request('http://x/api/identify', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  )
const good = { image: 'QUJD', mime: 'image/jpeg', lang: 'en' }

delete process.env.LLM_API_KEY
assert.equal((await post(good)).status, 503)

process.env.LLM_API_KEY = 'x'
const realFetch = globalThis.fetch
let sent = ''
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  sent = String(init?.body)
  assert.ok(!String(url).includes('key='))
  return Response.json({
    candidates: [
      {
        content: {
          parts: [{ text: '{"modelId":"dna","title":"DNA","explanation":""}' }],
        },
      },
    ],
  })
}) as typeof fetch

const ok = await post(good)
assert.equal(ok.status, 200)
assert.deepEqual(await ok.json(), { modelId: 'dna', title: 'DNA', explanation: '' })
assert.ok(sent.includes('QUJD'))

// Bad bodies never reach the model and never count against the limit.
assert.equal((await post({ ...good, mime: 'text/html' }, '2.2.2.2')).status, 400)
assert.equal((await post({ ...good, image: 'a'.repeat(3_000_001) }, '2.2.2.2')).status, 400)
assert.equal((await post({ ...good, image: 'not base64!' }, '2.2.2.2')).status, 400)
assert.equal((await post({ ...good, lang: 'fr' }, '2.2.2.2')).status, 400)

globalThis.fetch = (async () => new Response('no', { status: 500 })) as typeof fetch
assert.equal((await post(good, '3.3.3.3')).status, 502)

// The per-visitor limit kicks in.
let last = 0
for (let i = 0; i < 6; i++) last = (await post(good, '4.4.4.4')).status
assert.equal(last, 429)

globalThis.fetch = realFetch
console.log('identify checks pass')
