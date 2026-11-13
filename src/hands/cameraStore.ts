import { create } from 'zustand'

export type CameraStatus =
  'idle' | 'requesting' | 'loading-model' | 'ready' | 'denied' | 'unavailable' | 'error'

interface CameraStore {
  status: CameraStatus
  /** Tracking frames per second, measured over the last second. */
  fps: number
  stream: MediaStream | null
  set: (p: Partial<Omit<CameraStore, 'set'>>) => void
}

export const useCameraStore = create<CameraStore>((set) => ({
  status: 'idle',
  fps: 0,
  stream: null,
  set: (p) => set(p),
}))
