import { useHandStore } from '@/shared/stores'
import type { HandState, Handedness } from '@/shared/types'
import { GestureMachine } from './gestures'
import {
  lerpPose,
  poseHand,
  POSE_PALM,
  POSE_PINCH,
  POSE_POINT,
  POSE_RELAXED,
  type HandPose,
} from './pose'
import { computeSignals } from './signals'

/**
 * A scripted hand for testing without a webcam (`?hand=fake`). Loops through
 * palm, point, pinch-drag and a two-hand spread, writing the store exactly as
 * the camera tracker does. Not used in production.
 */

const RATE_MS = 33
const LOOP_S = 16
const SCALE = 0.17

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => t * t * (3 - 2 * t)

interface Frame {
  pose: HandPose
  /** Centre of the wrist in frame coordinates, 0 to 1. */
  at: { x: number; y: number }
  /** Second hand for the spread, or null. */
  other: { pose: HandPose; at: { x: number; y: number } } | null
}

function script(t: number): Frame {
  const s = t % LOOP_S
  const drift = { x: 0.55 + Math.sin(t * 0.7) * 0.06, y: 0.62 + Math.cos(t * 0.5) * 0.04 }

  // 0-3 s: open palm, settling in
  if (s < 3) {
    const k = ease(clamp01(s / 0.8))
    return { pose: lerpPose(POSE_RELAXED, POSE_PALM, k), at: drift, other: null }
  }
  // 3-6 s: point and circle
  if (s < 6) {
    const k = ease(clamp01((s - 3) / 0.5))
    const a = (s - 3) * 2.2
    return {
      pose: lerpPose(POSE_PALM, POSE_POINT, k),
      at: { x: 0.52 + Math.cos(a) * 0.12, y: 0.58 + Math.sin(a) * 0.1 },
      other: null,
    }
  }
  // 6-10 s: pinch, drag, release, twice
  if (s < 10) {
    const u = (s - 6) % 2
    const grab = u < 0.35 ? ease(u / 0.35) : u < 1.5 ? 1 : ease(clamp01(1 - (u - 1.5) / 0.4))
    const dragX = u > 0.35 && u < 1.5 ? Math.sin(((u - 0.35) / 1.15) * Math.PI) * 0.14 : 0
    return {
      pose: lerpPose(POSE_RELAXED, POSE_PINCH, grab),
      at: { x: 0.5 + dragX, y: 0.6 + Math.sin(s * 1.3) * 0.02 },
      other: null,
    }
  }
  // 10-14 s: both hands pinch and pull apart
  if (s < 14) {
    const u = s - 10
    const grab = ease(clamp01(u / 0.5))
    const spread = u > 0.5 ? Math.sin(((u - 0.5) / 3.5) * Math.PI) : 0
    const gap = 0.08 + spread * 0.22
    const pose = lerpPose(POSE_RELAXED, POSE_PINCH, grab)
    return {
      pose,
      at: { x: 0.5 + gap, y: 0.6 },
      other: { pose, at: { x: 0.5 - gap, y: 0.6 } },
    }
  }
  // 14-16 s: palm to reset
  const k = ease(clamp01((s - 14) / 0.5))
  return { pose: lerpPose(POSE_RELAXED, POSE_PALM, k), at: drift, other: null }
}

function landmarks(pose: HandPose, at: { x: number; y: number }, side: Handedness, t: number) {
  const pts = poseHand(pose)
  const flip = side === 'left' ? -1 : 1
  const wobble = Math.sin(t * 9) * 0.002
  return pts.map((p) => ({
    x: at.x + flip * p.x * SCALE * 0.75 + wobble,
    y: at.y + p.y * SCALE + Math.cos(t * 7 + p.x) * 0.0015,
    z: p.z * SCALE,
  }))
}

export function startFakeHand(): () => void {
  const store = useHandStore.getState()
  const machines: Record<Handedness, GestureMachine> = {
    left: new GestureMachine(),
    right: new GestureMachine(),
  }
  const t0 = performance.now()
  store.setSource('camera')

  const tick = () => {
    const now = performance.now()
    const t = (now - t0) / 1000
    const frame = script(t)
    const next: Partial<Record<Handedness, HandState>> = {}

    const make = (side: Handedness, pose: HandPose, at: { x: number; y: number }) => {
      const lm = landmarks(pose, at, side, t)
      const sig = computeSignals(lm)
      next[side] = {
        handedness: side,
        landmarks: lm,
        pinch: sig.pinch,
        pinchPoint: sig.pinchPoint,
        gesture: machines[side].update(sig, now),
      }
    }
    make('right', frame.pose, frame.at)
    if (frame.other) make('left', frame.other.pose, frame.other.at)
    else machines.left.reset()

    if (next.left?.gesture === 'pinch' && next.right?.gesture === 'pinch') {
      next.left.gesture = 'spread'
      next.right.gesture = 'spread'
    }
    useHandStore.getState().setHand(next.right ?? null, 'right')
    useHandStore.getState().setHand(next.left ?? null, 'left')
  }

  const id = window.setInterval(tick, RATE_MS)
  return () => {
    window.clearInterval(id)
    const s = useHandStore.getState()
    s.setHand(null, 'left')
    s.setHand(null, 'right')
    s.setSource('none')
  }
}
