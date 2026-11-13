import type { Handedness } from '@/shared/types'

export interface LiveHand {
  /** Interpolated pinch point in overlay world space. */
  x: number
  y: number
  z: number
  /** Fade of the whole hand, 0 to 1. */
  opacity: number
  /** 1 while the pinch is held. */
  engaged: number
  spread: boolean
}

/**
 * What each skeleton drew this frame, for parts of the overlay that need
 * both hands (the spread link). A plain object, so no re-renders.
 */
export const live: Record<Handedness, LiveHand> = {
  left: { x: 0, y: 0, z: 0, opacity: 0, engaged: 0, spread: false },
  right: { x: 0, y: 0, z: 0, opacity: 0, engaged: 0, spread: false },
}
