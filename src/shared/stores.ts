import { create } from 'zustand'
import type { Gesture, HandState, Handedness } from './types'

interface HandStore {
  hands: Partial<Record<Handedness, HandState>>
  source: 'none' | 'mouse' | 'camera'
  setHand: (hand: HandState | null, side: Handedness) => void
  setSource: (source: HandStore['source']) => void
}

export const useHandStore = create<HandStore>((set) => ({
  hands: {},
  source: 'none',
  setHand: (hand, side) =>
    set((s) => {
      const hands = { ...s.hands }
      if (hand) hands[side] = hand
      else delete hands[side]
      return { hands }
    }),
  setSource: (source) => set({ source }),
}))

interface SceneStore {
  hoveredPart: string | null
  selectedPart: string | null
  /** 0 = assembled, 1 = fully exploded. */
  explode: number
  rotation: { x: number; y: number }
  setHovered: (id: string | null) => void
  setSelected: (id: string | null) => void
  setExplode: (v: number) => void
  setRotation: (x: number, y: number) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  hoveredPart: null,
  selectedPart: null,
  explode: 0,
  rotation: { x: 0, y: 0 },
  setHovered: (hoveredPart) => set({ hoveredPart }),
  setSelected: (selectedPart) => set({ selectedPart }),
  setExplode: (v) => set({ explode: Math.min(1, Math.max(0, v)) }),
  setRotation: (x, y) => set({ rotation: { x, y } }),
}))

export type { Gesture }
