/**
 * A posed hand as 21 MediaPipe landmarks, built from curl values with simple
 * forward kinematics. Used by the gesture lesson icons and the fake hand.
 *
 * Hand space: wrist at the origin, palm about one unit wide, fingers pointing
 * up (negative y). z is negative towards the viewer. Right hand as seen in a
 * mirror, so the thumb is on the left.
 */

export interface Pt3 {
  x: number
  y: number
  z: number
}

export interface HandPose {
  /** Curl of index, middle, ring, pinky. 0 straight, 1 fully folded. */
  curl: [number, number, number, number]
  /** 0 thumb out to the side, 1 tucked across the palm. */
  thumb: number
  /** 0 to 1 pulls the thumb tip onto the index tip. */
  pinch: number
}

export const POSE_PALM: HandPose = { curl: [0, 0, 0, 0], thumb: 0, pinch: 0 }
export const POSE_POINT: HandPose = { curl: [0, 1, 1, 1], thumb: 0.7, pinch: 0 }
export const POSE_PINCH: HandPose = { curl: [0.7, 0.85, 0.9, 0.95], thumb: 0.2, pinch: 1 }
export const POSE_RELAXED: HandPose = { curl: [0.2, 0.25, 0.3, 0.35], thumb: 0.2, pinch: 0 }

/** MediaPipe bone list: pairs of landmark ids. */
export const BONES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
]

export const FINGERTIPS = [4, 8, 12, 16, 20]

const UP = -Math.PI / 2

interface FingerDef {
  base: [number, number]
  dir: number
  len: [number, number, number]
}

const FINGERS: FingerDef[] = [
  { base: [-0.28, -0.95], dir: UP - 0.08, len: [0.42, 0.26, 0.2] },
  { base: [-0.08, -1.0], dir: UP - 0.02, len: [0.46, 0.3, 0.22] },
  { base: [0.12, -0.97], dir: UP + 0.05, len: [0.42, 0.28, 0.2] },
  { base: [0.32, -0.88], dir: UP + 0.14, len: [0.33, 0.22, 0.18] },
]

const THUMB_BASE: [number, number] = [-0.3, -0.3]
const THUMB_LEN: [number, number, number] = [0.36, 0.3, 0.26]
const THUMB_OPEN = [UP - 1.15, UP - 0.9, UP - 0.75]
const THUMB_TUCK = [UP - 0.35, UP + 0.35, UP + 0.6]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Fold a finger towards the viewer: each segment foreshortens and comes closer. */
function finger(def: FingerDef, curl: number, out: Pt3[]) {
  const bends = [curl * 0.9, curl * 2.2, curl * 3.0]
  let x = def.base[0]
  let y = def.base[1]
  let z = 0
  out.push({ x, y, z })
  const dx = Math.cos(def.dir)
  const dy = Math.sin(def.dir)
  for (let i = 0; i < 3; i++) {
    const l = def.len[i]!
    const b = bends[i]!
    x += dx * l * Math.cos(b)
    y += dy * l * Math.cos(b)
    z -= l * Math.sin(b) * 0.9
    out.push({ x, y, z })
  }
}

/** Two-bone IK in the plane: angles of bone a (from base) and bone b so the tip lands on target. */
function reach(base: [number, number], a: number, b: number, target: Pt3): [number, number] {
  const tx = target.x - base[0]
  const ty = target.y - base[1]
  const d = Math.min(Math.hypot(tx, ty), a + b - 1e-3)
  const toTarget = Math.atan2(ty, tx)
  const cosA = (a * a + d * d - b * b) / (2 * a * d)
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)))
  const cosB = (a * a + b * b - d * d) / (2 * a * b)
  const beta = Math.acos(Math.max(-1, Math.min(1, cosB)))
  // bend to the right of the target line, which folds the thumb across the palm
  const a1 = toTarget - alpha
  const a2 = a1 + (Math.PI - beta)
  return [a1, a2]
}

export function poseHand(p: HandPose): Pt3[] {
  const pts: Pt3[] = [{ x: 0, y: 0, z: 0 }]
  const fingers: Pt3[][] = []
  for (let i = 0; i < 4; i++) {
    const f: Pt3[] = []
    finger(FINGERS[i]!, p.curl[i]!, f)
    fingers.push(f)
  }

  // thumb: open or tucked angles, blended towards an IK pose that meets the index tip
  const indexTip = fingers[0]![3]!
  let angles = THUMB_OPEN.map((o, i) => lerp(o, THUMB_TUCK[i]!, p.thumb))
  if (p.pinch > 0) {
    const [a1, a2] = reach(THUMB_BASE, THUMB_LEN[0], THUMB_LEN[1] + THUMB_LEN[2], indexTip)
    const ik = [a1, a2, a2]
    angles = angles.map((a, i) => lerp(a, ik[i]!, p.pinch))
  }
  let x = THUMB_BASE[0]
  let y = THUMB_BASE[1]
  let z = -0.04
  pts.push({ x, y, z })
  for (let i = 0; i < 3; i++) {
    x += Math.cos(angles[i]!) * THUMB_LEN[i]!
    y += Math.sin(angles[i]!) * THUMB_LEN[i]!
    z -= 0.03 * p.pinch
    pts.push({ x, y, z })
  }

  for (const f of fingers) pts.push(...f)
  return pts
}

export function lerpPose(a: HandPose, b: HandPose, t: number): HandPose {
  return {
    curl: [0, 1, 2, 3].map((i) => lerp(a.curl[i]!, b.curl[i]!, t)) as HandPose['curl'],
    thumb: lerp(a.thumb, b.thumb, t),
    pinch: lerp(a.pinch, b.pinch, t),
  }
}
