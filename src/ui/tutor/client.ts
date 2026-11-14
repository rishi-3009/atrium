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

/** 'busy' means the tutor refused for now (too many requests), so the note is shown instead. */
export type ExplainSource = 'tutor' | 'notes' | 'busy'

/** Finished tutor replies, so going back to a part or language costs no new request. */
const cache = new Map<string, string>()
const keyOf = (r: ExplainRequest) => `${r.modelId}:${r.partId}:${r.lang}:${r.level}`

/** Wait before asking, so a quick run of clicks sends only the last one. */
const DEBOUNCE_MS = 350

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (window.clearTimeout(t), resolve()), { once: true })
  })

/** Streams the stored NCERT note word by word. Used when the API is missing or offline. */
async function streamNotes(
  note: string,
  onChunk: (s: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const words = note.split(/(\s+)/)
  for (let i = 0; i < words.length && !signal.aborted; i += 2) {
    onChunk(words.slice(i, i + 2).join(''))
    await sleep(22, signal)
  }
}

type TutorResult = 'ok' | 'busy' | 'fail'

async function streamTutor(
  req: ExplainRequest,
  onChunk: (s: string) => void,
  signal: AbortSignal,
): Promise<TutorResult> {
  const res = await fetch('/api/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })
  if (res.status === 429) return 'busy'
  const type = res.headers.get('content-type') ?? ''
  // the dev server answers unknown paths with index.html, which is not a tutor reply
  if (!res.ok || !res.body || type.includes('text/html')) return 'fail'
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
  return got ? 'ok' : 'fail'
}

/**
 * Explains a part. Tries the tutor API first and falls back to the stored
 * note, so the panel always has something to show.
 */
export async function explain(
  req: ExplainRequest,
  onChunk: (s: string) => void,
  signal: AbortSignal,
): Promise<ExplainSource> {
  const k = keyOf(req)
  const saved = cache.get(k)
  if (saved) {
    onChunk(saved)
    return 'tutor'
  }

  await sleep(DEBOUNCE_MS, signal)
  if (signal.aborted) return 'notes'

  let text = ''
  let result: TutorResult = 'fail'
  try {
    result = await streamTutor(req, (s) => ((text += s), onChunk(s)), signal)
  } catch {
    if (signal.aborted) return 'notes'
  }
  if (result === 'ok') {
    if (!signal.aborted) cache.set(k, text)
    return 'tutor'
  }
  // a stream that broke half way keeps what it already sent
  if (text) return 'tutor'
  await streamNotes(req.note, onChunk, signal)
  return result === 'busy' ? 'busy' : 'notes'
}
