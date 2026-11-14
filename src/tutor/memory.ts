import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AnswerResult = 'correct' | 'hinted' | 'wrong'

/** What the learner's memory holds for one part. Times are epoch milliseconds. */
export interface PartMemory {
  /** 0 to 1. Recent answers count more. */
  score: number
  attempts: number
  /** Leitner box, 0 (new or just missed) to 4 (well known). */
  box: number
  last: number
  /** When the part should be asked again. */
  due: number
}

/** modelId -> partId -> memory. */
export type MemoryMap = Record<string, Record<string, PartMemory>>

const MIN = 60_000
const DAY = 24 * 60 * MIN
/** How long to wait before asking again, by box. */
export const INTERVALS = [10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY] as const

const POINTS: Record<AnswerResult, number> = { correct: 1, hinted: 0.7, wrong: 0 }

/** Pure update for one answer. Exported so it can be checked without the store. */
export function nextMemory(
  prev: PartMemory | undefined,
  result: AnswerResult,
  now: number,
): PartMemory {
  const points = POINTS[result]
  const score = prev && prev.attempts > 0 ? 0.55 * prev.score + 0.45 * points : points
  const top = INTERVALS.length - 1
  const from = prev?.box ?? 0
  const box = result === 'correct' ? Math.min(top, from + 1) : result === 'hinted' ? from : 0
  return { score, attempts: (prev?.attempts ?? 0) + 1, box, last: now, due: now + INTERVALS[box]! }
}

/** Local date as YYYY-MM-DD. The daily round resets at local midnight. */
export const dayKey = (t: number): string => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface MemoryStore {
  parts: MemoryMap
  /** Day of the last finished daily round, and how many days in a row. */
  lastRoundDay: string | null
  streak: number
  record: (modelId: string, partId: string, result: AnswerResult) => void
  finishRound: (now?: number) => void
}

export const useLearnerMemory = create<MemoryStore>()(
  persist(
    (set) => ({
      parts: {},
      lastRoundDay: null,
      streak: 0,
      record: (modelId, partId, result) =>
        set((s) => ({
          parts: {
            ...s.parts,
            [modelId]: {
              ...s.parts[modelId],
              [partId]: nextMemory(s.parts[modelId]?.[partId], result, Date.now()),
            },
          },
        })),
      finishRound: (now = Date.now()) =>
        set((s) => {
          const today = dayKey(now)
          if (s.lastRoundDay === today) return s
          const yesterday = s.lastRoundDay === dayKey(now - DAY)
          return { lastRoundDay: today, streak: yesterday ? s.streak + 1 : 1 }
        }),
    }),
    { name: 'atrium-memory', version: 1 },
  ),
)

/** The score view the progress screen reads. Same shape as its `LearnerProgress`. */
export function toProgress(
  parts: MemoryMap,
): Record<string, Record<string, { score: number; attempts: number }>> {
  const out: Record<string, Record<string, { score: number; attempts: number }>> = {}
  for (const [m, rows] of Object.entries(parts)) {
    out[m] = {}
    for (const [p, v] of Object.entries(rows)) out[m]![p] = { score: v.score, attempts: v.attempts }
  }
  return out
}
