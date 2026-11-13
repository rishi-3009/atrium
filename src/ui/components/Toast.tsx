import { AnimatePresence, motion } from 'framer-motion'
import { color, font, glow, radius, spring, z } from '../tokens'

export type ToastKind = 'info' | 'correct' | 'wrong'

interface Props {
  message: string | null
  kind?: ToastKind
}

const edge: Record<ToastKind, string> = {
  info: color.accent.base,
  correct: color.state.correct,
  wrong: color.state.wrong,
}

const shadow: Record<ToastKind, string> = {
  info: glow.accentSoft,
  correct: glow.correct,
  wrong: glow.wrong,
}

export function Toast({ message, kind = 'info' }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={spring.bouncy}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 32,
            x: '-50%',
            zIndex: z.toast,
            fontFamily: font.display,
            fontWeight: 500,
            padding: '0.8rem 1.25rem',
            borderRadius: radius.pill,
            background: color.bg.panelSolid,
            color: color.text.primary,
            border: `1px solid ${edge[kind]}`,
            boxShadow: shadow[kind],
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
