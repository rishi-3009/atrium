import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSceneStore } from '../../shared/stores'
import { Button } from '../components/Button'
import { Eyebrow, RevealWord } from '../components/Reveal'
import { startDemo } from '../demo'
import { useNavStore } from '../nav'
import { color, ease, font, spring, type as t } from '../tokens'
import { StageBoundary } from './StageBoundary'
import { useViewport } from './useViewport'
import { VesselHero } from './VesselHero'

/** Headline, one array per line. `accent` words are set in the italic serif. */
const HEADLINE: { text: string; accent?: boolean }[][] = [
  [{ text: 'Take' }, { text: 'biology' }],
  [{ text: 'apart', accent: true }, { text: 'with' }, { text: 'your' }],
  [{ text: 'bare' }, { text: 'hands.', accent: true }],
]

const STEPS = [
  { n: '01', title: 'Pick a diagram', body: 'From the library, or a photo of your book.' },
  { n: '02', title: 'Take it apart', body: 'Pinch, turn and pull with your webcam or mouse.' },
  { n: '03', title: 'Learn and check', body: 'A task, a NEET-style question, and a daily round.' },
]

const MODELS = ['Human heart', 'Animal cell', 'Flower', 'DNA double helix', 'Sarcomere', 'Neuron']

/** Slow strip of model names along the bottom edge. */
function Marquee() {
  const still = useReducedMotion()
  const row = [...MODELS, ...MODELS]
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderTop: `1px solid ${color.line.subtle}`,
        maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <motion.div
        animate={still ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 48, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', width: 'max-content', padding: '14px 0' }}
      >
        {row.map((m, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 28, paddingRight: 28, fontFamily: font.serif, fontStyle: 'italic', fontSize: 'clamp(1.4rem, 2.2vw, 2rem)', color: color.text.muted, whiteSpace: 'nowrap' }}>
            {m}
            <span style={{ fontFamily: font.display, fontStyle: 'normal', fontSize: '0.7rem', color: color.accent.base }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export function Landing() {
  const go = useNavStore((s) => s.go)
  const { width, height } = useViewport()
  const showSteps = width >= 1100 && height >= 640

  useEffect(() => {
    const s = useSceneStore.getState()
    s.setSelected(null)
    s.setHovered(null)
    s.setExplode(0)
  }, [])

  let order = 0
  const wordDelay = () => 0.15 + order++ * 0.07

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <StageBoundary>
          <VesselHero />
        </StageBoundary>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            `radial-gradient(ellipse at 18% 50%, ${color.bg.base} 22%, transparent 68%)`,
            `radial-gradient(ellipse 34% 46% at 94% 78%, ${color.bg.overlay} 30%, transparent 100%)`,
            `linear-gradient(transparent 82%, ${color.bg.overlay})`,
          ].join(', '),
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 'clamp(28px, 6vw, 104px)',
          top: '47%',
          transform: 'translateY(-50%)',
          maxWidth: 'min(820px, 62vw)',
          display: 'grid',
          gap: 'clamp(18px, 2.6vh, 28px)',
        }}
      >
        <Eyebrow>
          NCERT Class 10 to 12
          <span style={{ width: 28, height: 1, background: color.line.strong }} />
          NEET biology
        </Eyebrow>

        <h1
          style={{
            margin: 0,
            fontFamily: font.display,
            fontSize: 'clamp(3rem, min(7.2vw, 11vh), 7.25rem)',
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: '-0.045em',
            color: color.text.primary,
            textShadow: '0 2px 30px rgba(20, 6, 10, 0.55)',
          }}
        >
          {HEADLINE.map((line, li) => (
            <span key={li} style={{ display: 'block', whiteSpace: 'nowrap', paddingLeft: li === 1 ? '0.9em' : 0 }}>
              {line.map((w, wi) => (
                <span key={wi}>
                  <RevealWord delay={wordDelay()} accent={w.accent}>
                    {w.text}
                  </RevealWord>
                  {wi < line.length - 1 ? ' ' : null}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.85 }}
          style={{ display: 'flex', gap: 18, maxWidth: 500, marginLeft: '0.2em' }}
        >
          <motion.span
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.9, ease: ease.out, delay: 0.9 }}
            style={{ width: 2, flex: 'none', borderRadius: 2, transformOrigin: 'top', background: `linear-gradient(${color.accent.base}, transparent)` }}
          />
          <p style={{ margin: 0, fontFamily: font.body, color: color.text.secondary, fontSize: t.body.size, lineHeight: 1.65 }}>
            Open an NCERT diagram as a 3D model and pull it apart. A tutor explains each part, sets a small task and asks you a NEET-style question.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.0 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', pointerEvents: 'auto', marginLeft: '0.2em' }}
        >
          <Button onClick={() => go('library')}>Start exploring →</Button>
          <Button variant="ghost" onClick={startDemo}>
            Watch the demo
          </Button>
        </motion.div>
      </div>

      {showSteps ? (
        <div
          style={{
            position: 'absolute',
            right: 'clamp(28px, 4vw, 64px)',
            bottom: 'clamp(84px, 12vh, 120px)',
            display: 'grid',
            gap: 18,
            width: 260,
            pointerEvents: 'none',
          }}
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.gentle, delay: 1.1 + i * 0.12 }}
              style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, paddingTop: 14, borderTop: `1px solid ${color.line.default}` }}
            >
              <span style={{ fontFamily: font.mono, fontSize: t.label.size, color: color.accent.soft, paddingTop: 3 }}>{s.n}</span>
              <span>
                <span style={{ display: 'block', fontFamily: font.display, fontWeight: 600, fontSize: t.small.size, color: color.text.primary }}>{s.title}</span>
                <span style={{ display: 'block', fontFamily: font.body, fontSize: '0.85rem', lineHeight: 1.45, color: color.text.muted, marginTop: 2 }}>{s.body}</span>
              </span>
            </motion.div>
          ))}
        </div>
      ) : null}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 1.3 }}>
        <Marquee />
      </motion.div>
    </div>
  )
}
