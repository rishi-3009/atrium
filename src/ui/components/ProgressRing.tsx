import { motion } from 'framer-motion'
import { color, font, spring } from '../tokens'

interface Props {
  /** 0 to 1 */
  value: number
  size?: number
  stroke?: number
  label?: string
}

export function ProgressRing({ value, size = 72, stroke = 6, label }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(1, Math.max(0, value))
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color.line.default}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color.state.correct}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={spring.gentle}
          style={{ filter: `drop-shadow(0 0 6px ${color.state.correctGlow})` }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: size * 0.24,
          color: color.text.primary,
        }}
      >
        {label ?? `${Math.round(v * 100)}%`}
      </span>
    </div>
  )
}
