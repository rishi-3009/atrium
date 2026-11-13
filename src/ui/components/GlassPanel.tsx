import { motion, type HTMLMotionProps } from 'framer-motion'
import { blur, color, glow, radius, spring } from '../tokens'

export function GlassPanel({ style, children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
      style={{
        background: color.bg.panel,
        backdropFilter: `blur(${blur.glass}) saturate(140%)`,
        WebkitBackdropFilter: `blur(${blur.glass}) saturate(140%)`,
        border: `1px solid ${color.line.default}`,
        borderRadius: radius.lg,
        boxShadow: glow.lift,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
