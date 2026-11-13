import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { stopDemo, useDemo } from '../demo'
import { blur, color, font, glow, radius, spring, z } from '../tokens'

/** Caption bar shown while the scripted demo plays. Esc stops the demo. */
export function DemoCaption() {
  const running = useDemo((s) => s.running)
  const caption = useDemo((s) => s.caption)

  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stopDemo()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running])

  return (
    <AnimatePresence>
      {running && caption && (
        <motion.div
          key={caption}
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={spring.smooth}
          style={{
            position: 'fixed',
            top: 76,
            left: '50%',
            x: '-50%',
            zIndex: z.toast,
            maxWidth: 'min(720px, 86vw)',
            padding: '0.75rem 1.5rem',
            borderRadius: radius.pill,
            fontFamily: font.display,
            fontSize: 17,
            fontWeight: 500,
            textAlign: 'center',
            color: color.text.primary,
            background: color.bg.panel,
            border: `1px solid ${color.accent.deep}`,
            backdropFilter: `blur(${blur.glass})`,
            WebkitBackdropFilter: `blur(${blur.glass})`,
            boxShadow: glow.accentSoft,
            pointerEvents: 'none',
          }}
        >
          {caption}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
