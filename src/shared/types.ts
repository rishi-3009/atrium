export type Lang = 'en' | 'hi' | 'mr'
export type Level = 10 | 11 | 'neet'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type Handedness = 'left' | 'right'
export type Gesture = 'none' | 'point' | 'pinch' | 'spread' | 'palm'

/** 21 MediaPipe landmarks, normalised 0-1 in the camera frame (x mirrored). */
export interface HandState {
  handedness: Handedness
  landmarks: Vec3[]
  /** 0 = open, 1 = fully pinched. */
  pinch: number
  /** Pinch point in normalised screen space, 0-1. */
  pinchPoint: { x: number; y: number }
  gesture: Gesture
}

export interface PartDef {
  id: string
  label: string
  meshName: string
  noteKey: string
}

export interface TaskDef {
  id: string
  partId: string
  kind: 'select' | 'pull' | 'rotate' | 'explode'
  prompt: string
}

export interface ModelDefinition {
  id: string
  title: string
  chapters: string[]
  parts: PartDef[]
  tasks: TaskDef[]
}
