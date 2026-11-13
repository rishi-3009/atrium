import type { Lang, Level } from '../../shared/types'

/**
 * What the panel sends to `POST /api/tutor`. The reply is a plain-text
 * stream. The server may only rephrase and translate `note`; it adds no facts.
 */
export interface ExplainRequest {
  modelId: string
  /** Empty for the whole-model overview. */
  partId: string
  partLabel: string
  note: string
  level: Level
  lang: Lang
  /** Earlier explanations in this session, oldest first. */
  history: string[]
}

export type ExplainSource = 'tutor' | 'notes'

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (window.clearTimeout(t), resolve()), { once: true })
  })

/** Streams the stored NCERT note word by word. Used when the API is missing or offline. */
async function streamNotes(note: string, onChunk: (s: string) => void, signal: AbortSignal): Promise<void> {
  const words = note.split(/(\s+)/)
  for (let i = 0; i < words.length && !signal.aborted; i += 2) {
    onChunk(words.slice(i, i + 2).join(''))
    await sleep(22, signal)
  }
}

async function streamTutor(req: ExplainRequest, onChunk: (s: string) => void, signal: AbortSignal): Promise<boolean> {
  const res = await fetch('/api/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })
  const type = res.headers.get('content-type') ?? ''
  // the dev server answers unknown paths with index.html, which is not a tutor reply
  if (!res.ok || !res.body || type.includes('text/html')) return false
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let got = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (text) {
      got = true
      onChunk(text)
    }
  }
  return got
}

/**
 * Explains a part. Tries the tutor API first and falls back to the stored
 * note, so the panel always has something to show.
 */
export async function explain(req: ExplainRequest, onChunk: (s: string) => void, signal: AbortSignal): Promise<ExplainSource> {
  try {
    let got = false
    const ok = await streamTutor(req, (s) => ((got = true), onChunk(s)), signal)
    if (ok) return 'tutor'
    // a stream that broke half way keeps what it already sent
    if (got) return 'tutor'
  } catch {
    if (signal.aborted) return 'notes'
  }
  await streamNotes(req.note, onChunk, signal)
  return 'notes'
}
