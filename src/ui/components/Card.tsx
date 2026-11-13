import { motion, type HTMLMotionProps } from 'framer-motion'
import { color, glow, radius, spring } from '../tokens'

interface Props extends HTMLMotionProps<'div'> {
  interactive?: boolean
}

export function Card({ interactive = false, style, children, ...rest }: Props) {
  return (
    <motion.div
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
