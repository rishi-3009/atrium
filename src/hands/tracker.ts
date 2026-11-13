import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { useHandStore } from '@/shared/stores'
import type { HandState, Handedness } from '@/shared/types'
import { openCamera, closeCamera } from './camera'
import { useCameraStore } from './cameraStore'
import { GestureMachine } from './gestures'
import { LandmarkSmoother } from './oneEuro'
import { computeSignals } from './signals'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

interface Slot {
  smoother: LandmarkSmoother
  machine: GestureMachine
}

const newSlot = (): Slot => ({ smoother: new LandmarkSmoother(), machine: new GestureMachine() })

/** Start camera hand tracking. Returns a stop function. */
export async function startCameraHands(video: HTMLVideoElement): Promise<() => void> {
  const camStore = useCameraStore.getState()
  const stream = await openCamera()
  if (!stream) return () => {}

  camStore.set({ status: 'loading-model' })
  let landmarker: HandLandmarker
  try {
    const fileset = await FilesetResolver.forVisionTasks(WASM)
    const make = (delegate: 'GPU' | 'CPU') =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    landmarker = await make('GPU').catch(() => make('CPU'))
  } catch {
    closeCamera()
    useCameraStore.getState().set({ status: 'error' })
    return () => {}
  }

  video.srcObject = stream
  await video.play().catch(() => {})
  useHandStore.getState().setSource('camera')
  useCameraStore.getState().set({ status: 'ready' })

  const slots: Record<Handedness, Slot> = { left: newSlot(), right: newSlot() }
  let raf = 0
  let lastVideoTime = -1
  let frames = 0
  let fpsT = performance.now()
  let stopped = false

  const loop = () => {
    if (stopped) return
    raf = requestAnimationFrame(loop)
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return
    lastVideoTime = video.currentTime

    const now = performance.now()
    const result = landmarker.detectForVideo(video, now)
    const store = useHandStore.getState()
    const seen = new Set<Handedness>()
    const next: Partial<Record<Handedness, HandState>> = {}

    result.landmarks.forEach((raw, i) => {
      // The frame is not mirrored, so MediaPipe's label is the opposite of the user's hand.
      const label = result.handedness[i]?.[0]?.categoryName
      const side: Handedness = label === 'Left' ? 'right' : 'left'
      if (seen.has(side)) return
      seen.add(side)
      const slot = slots[side]
      const mirrored = raw.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }))
      const lm = slot.smoother.apply(mirrored, now / 1000)
      const sig = computeSignals(lm)
      next[side] = {
        handedness: side,
        landmarks: lm,
        pinch: sig.pinch,
        pinchPoint: sig.pinchPoint,
        gesture: slot.machine.update(sig, now),
      }
    })

    for (const side of ['left', 'right'] as const) {
      if (seen.has(side)) continue
      const prev = store.hands[side]
      if (!prev) continue
      const g = slots[side].machine.lost(now)
      if (g === 'none') slots[side].smoother.reset()
      else next[side] = { ...prev, gesture: g }
    }

    // Two pinching hands together mean "spread".
    const l = next.left
    const r = next.right
    if (l?.gesture === 'pinch' && r?.gesture === 'pinch') {
      l.gesture = 'spread'
      r.gesture = 'spread'
    }

    for (const side of ['left', 'right'] as const) store.setHand(next[side] ?? null, side)

    frames++
    if (now - fpsT >= 1000) {
      useCameraStore.getState().set({ fps: Math.round((frames * 1000) / (now - fpsT)) })
      frames = 0
      fpsT = now
    }
  }
  raf = requestAnimationFrame(loop)

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    landmarker.close()
    video.srcObject = null
    closeCamera()
    const s = useHandStore.getState()
    s.setHand(null, 'left')
    s.setHand(null, 'right')
    s.setSource('none')
  }
}
