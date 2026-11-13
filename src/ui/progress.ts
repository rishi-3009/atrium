import { content, type ModelContent } from '../content'

/** Every model's content, without loading any 3D code. */
export const catalog: { id: string; content: ModelContent }[] = Object.values(content).map((c) => ({ id: c.definition.id, content: c }))
export const catalogById: Record<string, { id: string; content: ModelContent } | undefined> = Object.fromEntries(catalog.map((m) => [m.id, m]))

/** How well the learner knows one part. `score` runs from 0 to 1. */
export interface PartProgress {
  score: number
  attempts: number
}

/** modelId -> partId -> progress. The tutor's learner memory fills this in. */
export type LearnerProgress = Record<string, Record<string, PartProgress>>

export interface WeakPart {
  modelId: string
  partId: string
  label: string
  score: number
}

export const WEAK_BELOW = 0.6

/** Parts the learner has tried and not yet mastered, weakest first. */
export function weakParts(progress: LearnerProgress): WeakPart[] {
  const out: WeakPart[] = []
  for (const model of catalog) {
    const rows = progress[model.id] ?? {}
    for (const part of model.content.definition.parts) {
      const p = rows[part.id]
      if (p && p.attempts > 0 && p.score < WEAK_BELOW) {
        out.push({ modelId: model.id, partId: part.id, label: part.label, score: p.score })
      }
    }
  }
  return out.sort((a, b) => a.score - b.score)
}

/** Share of a model's parts the learner has mastered, 0 to 1. */
export function modelMastery(progress: LearnerProgress, modelId: string): number {
  const model = catalogById[modelId]
  if (!model) return 0
  const parts = model.content.definition.parts
  const rows = progress[modelId] ?? {}
  const done = parts.filter((p) => (rows[p.id]?.score ?? 0) >= WEAK_BELOW && (rows[p.id]?.attempts ?? 0) > 0).length
  return parts.length ? done / parts.length : 0
}

/** Splits "Class 11 · Cell: The Unit of Life" into its class and unit. */
export function parseChapter(chapter: string): { cls: 10 | 11 | 12; unit: string } {
  const [head = '', unit = chapter] = chapter.split(' · ')
  const n = Number(head.replace(/\D/g, ''))
  return { cls: n === 10 || n === 11 || n === 12 ? n : 11, unit }
}
