import { motion } from 'framer-motion'
import { color, font, radius, spring } from '../tokens'

interface Props<T extends string | number> {
  value: T
  options: { value: T; label: string; title?: string }[]
  onChange: (v: T) => void
  /** Unique per control, so two controls do not share one sliding pill. */
  id: string
}

/** Pill-shaped switch with a highlight that slides between options. */
export function Segmented<T extends string | number>({ value, options, onChange, id }: Props<T>) {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'inline-flex',
        padding: 3,
        borderRadius: radius.pill,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color.line.default}`,
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            style={{
              position: 'relative',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              padding: '0.3rem 0.8rem',
              borderRadius: radius.pill,
              fontFamily: font.display,
              fontSize: 12,
              fontWeight: 600,
              color: on ? color.text.onAccent : color.text.secondary,
              transition: 'color 0.2s',
            }}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring.snappy}
                style={{ position: 'absolute', inset: 0, borderRadius: radius.pill, background: color.accent.base }}
              />
            )}
            <span style={{ position: 'relative' }}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
