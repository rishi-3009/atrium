import { create } from 'zustand'

export type View = 'home' | 'library' | 'stage' | 'progress'

interface NavStore {
  view: View
  modelId: string
  /** Part to select when the stage opens, e.g. from the daily round. */
  startPart: string | null
  /** The last model the learner opened this visit. Null until they open one. */
  lastModelId: string | null
  go: (view: View) => void
  openModel: (modelId: string, startPart?: string | null) => void
}

export const useNavStore = create<NavStore>((set) => ({
  view: 'home',
  modelId: 'heart',
  startPart: null,
  lastModelId: null,
  go: (view) => set({ view }),
  openModel: (modelId, startPart = null) => set({ view: 'stage', modelId, startPart, lastModelId: modelId }),
}))
