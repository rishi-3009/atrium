import { useState } from 'react'
import { useAnimationFrame } from 'framer-motion'
import type { Gesture } from '@/shared/types'
import { color } from '@/ui/tokens'
import {
  BONES,
  FINGERTIPS,
  lerpPose,
  poseHand,
  POSE_PALM,
  POSE_PINCH,
  POSE_POINT,
  POSE_RELAXED,
  type HandPose,
  type Pt3,
} from '../pose'

export type LessonGesture = Exclude<Gesture, 'none'>

/** 0 to 1 to 0, held for a while at the top. */
function pulse(t: number, period: number) {
  const u = (t % period) / period
  if (u < 0.25) return smooth(u / 0.25)
  if (u < 0.65) return 1
  if (u < 0.85) return 1 - smooth((u - 0.65) / 0.2)
  return 0
}
const smooth = (t: number) => t * t * (3 - 2 * t)

function poseFor(g: LessonGesture, t: number): { pose: HandPose; k: number } {
  switch (g) {
    case 'point': {
      const k = 0.5 + 0.5 * Math.sin(t * 2.6)
      return { pose: lerpPose(POSE_POINT, { ...POSE_POINT, curl: [0.18, 1, 1, 1] }, k), k: 1 }
    }
    case 'pinch':
    case 'spread': {
      const k = pulse(t, 2.2)
      return { pose: lerpPose(POSE_RELAXED, POSE_PINCH, k), k }
    }
    case 'palm': {
      const k = pulse(t, 2.4)
      return { pose: lerpPose(POSE_RELAXED, POSE_PALM, k), k }
    }
  }
}

function Skeleton({
  pts,
  hot,
  flip = 1,
  dx = 0,
}: {
  pts: Pt3[]
  hot: number
  flip?: number
  dx?: number
}) {
  const X = (p: Pt3) => (p.x * flip + dx).toFixed(3)
  const Y = (p: Pt3) => p.y.toFixed(3)
  return (
    <g>
      <g
        stroke={color.accent.base}
        strokeWidth={0.2}
        strokeLinecap="round"
        opacity={0.25}
        filter="url(#hand-blur)"
      >
        {BONES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={X(pts[a]!)} y1={Y(pts[a]!)} x2={X(pts[b]!)} y2={Y(pts[b]!)} />
        ))}
      </g>
      <g stroke={color.accent.soft} strokeWidth={0.06} strokeLinecap="round" opacity={0.9}>
        {BONES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={X(pts[a]!)} y1={Y(pts[a]!)} x2={X(pts[b]!)} y2={Y(pts[b]!)} />
        ))}
      </g>
      {pts.map((p, i) => {
        const tip = FINGERTIPS.includes(i)
        const pinchTip = (i === 4 || i === 8) && hot > 0
        return (
          <circle
            key={i}
            cx={X(p)}
            cy={Y(p)}
            r={i === 0 ? 0.1 : tip ? 0.085 : 0.06}
            fill={pinchTip ? color.text.primary : color.accent.base}
            opacity={pinchTip ? 0.6 + 0.4 * hot : 0.95}
          />
        )
      })}
    </g>
  )
}

/** A small animated skeleton that performs one gesture on a loop. */
export function GestureIcon({ gesture, size = 88 }: { gesture: LessonGesture; size?: number }) {
  const [t, setT] = useState(0)
  useAnimationFrame((time) => setT(time / 1000))
  const { pose, k } = poseFor(gesture, t)
  const pts = poseHand(pose)

  if (gesture === 'spread') {
    const gap = 0.9 + k * 0.9
    const tipL = pts[8]!
    return (
      <svg
        width={size}
        height={size}
        viewBox="-2.4 -2.4 4.8 3.2"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <filter id="hand-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.12" />
          </filter>
        </defs>
        <g transform="scale(0.78) translate(0, 0.3)">
          <line
            x1={(-tipL.x - gap).toFixed(3)}
            y1={tipL.y.toFixed(3)}
            x2={(tipL.x + gap).toFixed(3)}
            y2={tipL.y.toFixed(3)}
            stroke={color.accent.soft}
            strokeWidth={0.05}
            strokeDasharray="0.16 0.12"
            opacity={0.35 + 0.5 * k}
          />
          <Skeleton pts={pts} hot={k} flip={-1} dx={-gap} />
          <Skeleton pts={pts} hot={k} dx={gap} />
        </g>
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="-1.7 -2.5 3.4 3.4"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <filter id="hand-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.12" />
        </filter>
      </defs>
      {gesture === 'palm' && (
        <circle
          cx="0"
          cy="-0.9"
          r={(0.9 + k * 1.1).toFixed(3)}
          fill="none"
          stroke={color.accent.base}
          strokeWidth={0.05}
          opacity={Math.max(0, 0.6 - k * 0.6)}
        />
      )}
      {gesture === 'pinch' && (
        <circle
          cx={((pts[4]!.x + pts[8]!.x) / 2).toFixed(3)}
          cy={((pts[4]!.y + pts[8]!.y) / 2).toFixed(3)}
          r={(0.22 + (1 - k) * 0.25).toFixed(3)}
          fill="none"
          stroke={k > 0.95 ? color.text.primary : color.accent.base}
          strokeWidth={0.05}
          strokeDasharray={`${(Math.PI * 2 * (0.22 + (1 - k) * 0.25) * k).toFixed(3)} 100`}
          opacity={0.2 + 0.7 * k}
        />
      )}
      <Skeleton pts={pts} hot={gesture === 'pinch' ? k : 0} />
    </svg>
  )
}
