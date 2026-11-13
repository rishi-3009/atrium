import { motion, type HTMLMotionProps } from 'framer-motion'
import { color, font, glow, radius, spring, type as t } from '../tokens'

type Variant = 'primary' | 'ghost'

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant
}

export function Button({ variant = 'primary', style, children, ...rest }: Props) {
  const primary = variant === 'primary'
  return (
    <motion.button
      whileHover={{ scale: 1.03, boxShadow: primary ? glow.accent : glow.lift }}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      style={{
        fontFamily: font.display,
        fontSize: t.body.size,
        fontWeight: 600,
        padding: '0.7rem 1.4rem',
        borderRadius: radius.pill,
        cursor: 'pointer',
        border: primary ? 'none' : `1px solid ${color.line.strong}`,
        background: primary
          ? `linear-gradient(135deg, ${color.accent.soft}, ${color.accent.base})`
          : 'transparent',
        color: primary ? color.text.onAccent : color.text.primary,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
