import type { KeyboardEvent } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { color, glow, radius, spring } from '../tokens'

interface Props extends HTMLMotionProps<'div'> {
  interactive?: boolean
}

/**
 * A panel. When `interactive`, it acts as a button: it can be reached by
 * keyboard, announced as a button, and opens with Enter or Space.
 */
export function Card({ interactive = false, style, children, onClick, onKeyDown, ...rest }: Props) {
  const keyActivate = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      ;(onClick as unknown as (ev: unknown) => void)(e)
    }
  }
  return (
    <motion.div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={keyActivate}
      whileHover={interactive ? { y: -4, boxShadow: glow.accentSoft } : undefined}
      transition={spring.smooth}
      style={{
        background: color.bg.panelSolid,
        border: `1px solid ${color.line.default}`,
        borderRadius: radius.lg,
        padding: '1.25rem',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
