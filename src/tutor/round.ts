import { content, type Mcq } from '../content'
import { dayKey, type MemoryMap } from './memory'

/** A daily round is five questions, about one minute each. */
export const ROUND_SIZE = 5

export interface RoundQuestion {
  modelId: string
  mcq: Mcq
}

/** Smaller sorts first: overdue parts, then weak ones, then parts never asked. */
function priority(m: MemoryMap, modelId: string, partId: string, now: number): number | null {
  const mem = m[modelId]?.[partId]
  if (!mem) return 2.5 // never asked: after review work
  if (mem.due <= now) return -1 + mem.score // overdue; the weakest comes first
  if (mem.score < 0.6) return 1 + mem.score
  return null // known and not due yet
}

/**
 * Picks today's questions. Due and weak parts come first; new parts fill the
 * rest. Each part is asked at most once, and one model never takes over.
 */
export function buildDailyRound(
  parts: MemoryMap,
  now: number = Date.now(),
  size: number = ROUND_SIZE,
): RoundQuestion[] {
  const pool: { q: RoundQuestion; p: number }[] = []
  for (const c of Object.values(content)) {
    const modelId = c.definition.id
    const seen = new Set<string>()
    for (const mcq of c.mcqs) {
      if (seen.has(mcq.partId)) continue
      const p = priority(parts, modelId, mcq.partId, now)
      if (p === null) continue
      seen.add(mcq.partId)
      pool.push({ q: { modelId, mcq }, p })
    }
  }
  pool.sort((a, b) => a.p - b.p)

  const out: RoundQuestion[] = []
  const perModel: Record<string, number> = {}
  const cap = Math.max(2, Math.ceil(size / 2))
  for (const { q } of pool) {
    if (out.length >= size) break
    if ((perModel[q.modelId] ?? 0) >= cap) continue
    perModel[q.modelId] = (perModel[q.modelId] ?? 0) + 1
    out.push(q)
  }
  // if the cap left gaps, fill from what remains
  for (const { q } of pool) {
    if (out.length >= size) break
    if (!out.includes(q)) out.push(q)
  }
  return out
}

/** How many parts are due for revisiting right now. */
export function dueCount(parts: MemoryMap, now: number = Date.now()): number {
  let n = 0
  for (const rows of Object.values(parts))
    for (const m of Object.values(rows)) if (m.due <= now) n++
  return n
}

export const roundDoneToday = (lastRoundDay: string | null, now: number = Date.now()): boolean =>
  lastRoundDay === dayKey(now)
