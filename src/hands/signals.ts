import type { Vec3 } from '@/shared/types'

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.5)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// MediaPipe landmark ids
const WRIST = 0
const THUMB_TIP = 4
const INDEX_TIP = 8
const MIDDLE_MCP = 9
const FINGERS = [
  { tip: 8, pip: 6 },
  { tip: 12, pip: 10 },
  { tip: 16, pip: 14 },
  { tip: 20, pip: 18 },
] as const

export interface HandSignals {
  /** 0 open, 1 pinched. Scale-free: thumb-index gap divided by palm size. */
  pinch: number
  pinchPoint: { x: number; y: number }
  /** Unit vector the palm faces, camera space. */
  palmDirection: Vec3
  /** Extended flags for index, middle, ring, pinky. */
  extended: [boolean, boolean, boolean, boolean]
}

export function computeSignals(lm: Vec3[]): HandSignals {
  const palm = Math.max(dist(lm[WRIST]!, lm[MIDDLE_MCP]!), 1e-3)
  const gap = dist(lm[THUMB_TIP]!, lm[INDEX_TIP]!) / palm
  // gap ~0.15 is touching, ~0.9 is clearly open
  const pinch = clamp01(1 - (gap - 0.15) / 0.75)

  const a = lm[THUMB_TIP]!
  const b = lm[INDEX_TIP]!
  const pinchPoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

  // Palm normal from wrist, index base and pinky base
  const w = lm[WRIST]!
  const i = lm[5]!
  const p = lm[17]!
  const u = { x: i.x - w.x, y: i.y - w.y, z: i.z - w.z }
  const v = { x: p.x - w.x, y: p.y - w.y, z: p.z - w.z }
  const n = {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  }
  const len = Math.hypot(n.x, n.y, n.z) || 1
  const palmDirection = { x: n.x / len, y: n.y / len, z: n.z / len }

  const extended = FINGERS.map(
    ({ tip, pip }) => dist(lm[tip]!, lm[WRIST]!) > dist(lm[pip]!, lm[WRIST]!) * 1.08,
  ) as HandSignals['extended']

  return { pinch, pinchPoint, palmDirection, extended }
}

/** Speed of the pinch point in screen-widths per second. */
export function speed(
  prev: { x: number; y: number } | null,
  cur: { x: number; y: number },
  dt: number,
) {
  if (!prev || dt <= 0) return 0
  return Math.hypot(cur.x - prev.x, cur.y - prev.y) / dt
}
