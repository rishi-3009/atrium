import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang, Level } from '../../shared/types'
import type { LearnerProgress } from '../progress'

export type AnswerResult = 'correct' | 'hinted' | 'wrong'

const SCORE: Record<AnswerResult, number> = { correct: 1, hinted: 0.7, wrong: 0 }

interface TutorUiStore {
  lang: Lang
  level: Level
  /**
   * Score per part from the questions answered here. Shown in the progress
   * view until the tutor's learner memory takes over.
   */
  progress: LearnerProgress
  setLang: (lang: Lang) => void
  setLevel: (level: Level) => void
  record: (modelId: string, partId: string, result: AnswerResult) => void
}

export const useTutorUi = create<TutorUiStore>()(
  persist(
    (set) => ({
      lang: 'en',
      level: 'neet',
      progress: {},
      setLang: (lang) => set({ lang }),
      setLevel: (level) => set({ level }),
      record: (modelId, partId, result) =>
        set((s) => {
          const prev = s.progress[modelId]?.[partId]
          const next = SCORE[result]
          const score = prev && prev.attempts > 0 ? 0.55 * prev.score + 0.45 * next : next
          return {
            progress: {
              ...s.progress,
              [modelId]: { ...s.progress[modelId], [partId]: { score, attempts: (prev?.attempts ?? 0) + 1 } },
            },
          }
        }),
    }),
    { name: 'atrium-ui' },
  ),
)
