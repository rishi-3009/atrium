import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHandStore } from '@/shared/stores'
import { Button, GlassPanel } from '@/ui'
import { color, font, glow, radius, spring, z } from '@/ui/tokens'
import { GestureIcon, type LessonGesture } from './GestureIcon'

const STORAGE_KEY = 'atrium-hands-lesson'
/** Each step waits this long before moving on by itself. */
const STEP_MS = 2400
/** After the gesture is seen, the tick shows for this long. */
const DONE_MS = 650

interface Step {
  gesture: LessonGesture
  title: string
  hint: string
}

const STEPS: Step[] = [
  { gesture: 'point', title: 'Point', hint: 'Point one finger at a part to light it up.' },
  { gesture: 'pinch', title: 'Pinch', hint: 'Touch thumb and finger to grab. Move to turn.' },
  { gesture: 'spread', title: 'Spread', hint: 'Pinch with both hands and pull apart to open it.' },
  { gesture: 'palm', title: 'Open palm', hint: 'Show your palm to put everything back.' },
]

const seen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
const remember = () => {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode */
  }
}

/**
 * A ten-second lesson in the four gestures, shown the first time the camera
 * takes over. Each step moves on when the gesture is seen or after a short
 * wait. `?lesson` in the URL shows it again.
 */
export function HandLesson() {
  const camera = useHandStore((s) => s.source === 'camera')
  const force = new URLSearchParams(window.location.search).has('lesson')
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  // open when the camera takes over for the first time
  useEffect(() => {
    if (!camera || (seen() && !force)) return
    const t = window.setTimeout(() => {
      setStep(0)
      setDone(false)
      setOpen(true)
    }, 400)
    return () => window.clearTimeout(t)
  }, [camera, force])

  // close if the camera goes away
  useEffect(() => {
    if (camera) return
    const t = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(t)
  }, [camera])

  const finish = () => {
    remember()
    setOpen(false)
  }

  // watch for the gesture; otherwise move on after the wait
  useEffect(() => {
    if (!open || done) return
    const want = STEPS[step]?.gesture
    if (!want) return
    let gone = false
    const advance = () => {
      if (gone) return
      gone = true
      setDone(true)
    }
    const unsub = useHandStore.subscribe((s) => {
      const hit = Object.values(s.hands).some((h) => h?.gesture === want)
      if (hit) advance()
    })
    const t = window.setTimeout(advance, STEP_MS)
    return () => {
      unsub()
      window.clearTimeout(t)
    }
  }, [open, done, step])

  // after the tick, next step or finish
  useEffect(() => {
    if (!open || !done) return
    const t = window.setTimeout(() => {
      if (step >= STEPS.length - 1) finish()
      else {
        setStep(step + 1)
        setDone(false)
      }
    }, DONE_MS)
    return () => window.clearTimeout(t)
  }, [open, done, step])

  const current = STEPS[step]!
  const total = STEPS.length * (STEP_MS + DONE_MS)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lesson"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={spring.smooth}
          style={{
            position: 'fixed',
            top: 84,
            left: '50%',
            x: '-50%',
            zIndex: z.panel + 6,
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <GlassPanel style={{ padding: 18, overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '96px minmax(0, 1fr)',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: radius.md,
                  background: color.accent.wash,
                  border: `1px solid ${color.line.default}`,
                  boxShadow: done ? glow.accentSoft : 'none',
                  transition: 'box-shadow 0.3s',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.gesture}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                  >
                    <GestureIcon gesture={current.gesture} size={84} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: font.display,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: color.accent.soft,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Hands · {step + 1} of {STEPS.length}
                  <span style={{ display: 'flex', gap: 4 }}>
                    {STEPS.map((s, k) => (
                      <motion.span
                        key={s.gesture}
                        animate={{
                          width: k === step ? 16 : 5,
                          background:
                            k < step || (k === step && done)
                              ? color.accent.base
                              : k === step
                                ? color.accent.soft
                                : color.line.strong,
                        }}
                        transition={spring.snappy}
                        style={{ height: 5, borderRadius: radius.pill, display: 'block' }}
                      />
                    ))}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.gesture}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <div
                        style={{
                          fontFamily: font.display,
                          fontSize: 20,
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          color: color.text.primary,
                        }}
                      >
                        {current.title}
                      </div>
                      <AnimatePresence>
                        {done && (
                          <motion.svg
                            key="tick"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                            transition={spring.bouncy}
                          >
                            <circle cx="10" cy="10" r="9" fill={color.accent.base} />
                            <path
                              d="M6 10.2l2.6 2.6L14.2 7"
                              fill="none"
                              stroke={color.text.onAccent}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>
                    <div
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: color.text.secondary,
                        marginTop: 2,
                      }}
                    >
                      {current.hint}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                variant="ghost"
                onClick={finish}
                style={{ padding: '0.35rem 0.9rem', fontSize: 12 }}
              >
                Skip
              </Button>
            </div>

            <motion.div
              key="bar"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: total / 1000, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                transformOrigin: 'left',
                background: `linear-gradient(90deg, ${color.accent.deep}, ${color.accent.base})`,
              }}
            />
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
