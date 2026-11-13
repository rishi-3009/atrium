import { motion } from 'framer-motion'
import { color, font } from '../tokens'

/** Centred spinner with a short message. Fills its parent. */
export function Loader({ label = 'Loading' }: { label?: string }) {
  const size = 64
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div
      role="status"
      style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{ display: 'grid', gap: 18, justifyItems: 'center' }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 10px ${color.accent.glow})` }}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.line.default} strokeWidth={4} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color.accent.base}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${c * 0.28} ${c}`}
          />
        </motion.svg>
        <span style={{ fontFamily: font.display, fontSize: 13, letterSpacing: '0.04em', color: color.text.secondary }}>{label}</span>
      </motion.div>
    </div>
  )
}
