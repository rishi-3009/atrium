import { useEffect, useState, type ReactNode } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { color, ease, font, spring, type as t } from '../tokens'

/** Italic serif with a rose gradient, for one or two words in a big heading. */
export const accentText = {
  fontFamily: font.serif,
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: '-0.01em',
  background: `linear-gradient(100deg, ${color.accent.soft} 10%, ${color.accent.base} 55%, ${color.accent.deep} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingRight: '0.08em',
} as const

/** One word that rises out of a mask. */
export function RevealWord({ children, delay, accent }: { children: ReactNode; delay: number; accent?: boolean }) {
  const still = useReducedMotion()
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
      <motion.span
        initial={still ? false : { y: '110%', rotate: 4 }}
        animate={{ y: '0%', rotate: 0 }}
        transition={{ duration: 1.05, ease: ease.out, delay }}
        style={{ display: 'inline-block', transformOrigin: '0 100%', ...(accent ? accentText : null) }}
      >
        {accent ? <span style={{ fontSize: '1.12em', lineHeight: 0.9 }}>{children}</span> : children}
      </motion.span>
    </span>
  )
}

export type HeadWord = { text: string; accent?: boolean }

/** Small mono line above a heading, with a pulsing rose dot. */
export function Eyebrow({ children, delay = 0.05 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring.smooth, delay }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: font.mono, fontSize: t.label.size, letterSpacing: t.label.tracking, textTransform: 'uppercase', color: color.text.secondary }}
    >
      <motion.span
        animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: color.accent.base, boxShadow: `0 0 12px ${color.accent.glow}`, flex: 'none' }}
      />
      {children}
    </motion.div>
  )
}

/** Eyebrow, a big word-by-word heading and a short intro with a drawn rose rule. */
export function PageHeader({ eyebrow, words, intro, aside }: { eyebrow: ReactNode; words: HeadWord[]; intro: ReactNode; aside?: ReactNode }) {
  const introDelay = 0.2 + words.length * 0.07
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
      <div style={{ display: 'grid', gap: 18 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: 'clamp(2.6rem, min(5.4vw, 9vh), 5rem)', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em', color: color.text.primary }}>
          {words.map((w, i) => (
            <span key={i}>
              <RevealWord delay={0.12 + i * 0.07} accent={w.accent}>
                {w.text}
              </RevealWord>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: introDelay }}
          style={{ display: 'flex', gap: 16, maxWidth: 520 }}
        >
          <motion.span
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.9, ease: ease.out, delay: introDelay + 0.05 }}
            style={{ width: 2, flex: 'none', borderRadius: 2, transformOrigin: 'top', background: `linear-gradient(${color.accent.base}, transparent)` }}
          />
          <p style={{ margin: 0, fontFamily: font.body, color: color.text.secondary, fontSize: t.body.size, lineHeight: 1.6 }}>{intro}</p>
        </motion.div>
      </div>
      {aside}
    </header>
  )
}

/** Counts up from 0 to `value` with an easing curve. */
export function CountUp({ value, delay = 0, suffix = '' }: { value: number; delay?: number; suffix?: string }) {
  const still = useReducedMotion()
  const [shown, setShown] = useState(still ? value : 0)
  useEffect(() => {
    if (still) return
    const c = animate(0, value, { duration: 1.4, ease: ease.out, delay, onUpdate: (v) => setShown(Math.round(v)) })
    return () => c.stop()
  }, [value, delay, still])
  return (
    <>
      {still ? value : shown}
      {suffix}
    </>
  )
}

/** Two slow drifting rose glows behind a page. Pure CSS gradients, cheap to draw. */
export function AmbientGlow() {
  const still = useReducedMotion()
  const blob = (x: string, y: string, size: string, tint: string) => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${tint} 0%, transparent 65%)`,
    filter: 'blur(20px)',
  })
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={still ? undefined : { x: [0, 80, -40, 0], y: [0, 50, 90, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        style={blob('58%', '-18%', '58vw', color.accent.wash)}
      />
      <motion.div
        animate={still ? undefined : { x: [0, -60, 30, 0], y: [0, -40, -80, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        style={blob('-14%', '48%', '46vw', color.accent.ember)}
      />
    </div>
  )
}
