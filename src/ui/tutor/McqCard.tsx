import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Mcq } from '../../content'
import { Button } from '../components/Button'
import { color, font, glow, radius, spring, type as t } from '../tokens'
import type { AnswerResult } from './store'

interface Props {
  mcq: Mcq
  index: number
  total: number
  onAnswer: (result: AnswerResult) => void
  onNext: () => void
  /** Called when the student asks for a hint, so the part can be shown in 3D. */
  onHint?: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']

/** One question: pick an answer, use the 50-50 hint, see the result and why. */
export function McqCard({ mcq, index, total, onAnswer, onNext, onHint }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const [hinted, setHinted] = useState(false)

  // The hint removes two wrong answers. Which two is fixed per question.
  const removed = useMemo(() => {
    const wrong = [0, 1, 2, 3].filter((i) => i !== mcq.answer)
    const start = mcq.id.length % 3
    return [wrong[start]!, wrong[(start + 1) % 3]!]
  }, [mcq])

  const revealed = picked !== null
  const right = picked === mcq.answer

  const pick = (i: number) => {
    if (revealed || (hinted && removed.includes(i))) return
    setPicked(i)
    onAnswer(i === mcq.answer ? (hinted ? 'hinted' : 'correct') : 'wrong')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: font.display,
            fontSize: t.label.size,
            fontWeight: 600,
            letterSpacing: t.label.tracking,
            textTransform: 'uppercase',
            color: color.accent.soft,
          }}
        >
          Question {index + 1} of {total}
        </span>
        {!revealed && (
          <button
            disabled={hinted}
            onClick={() => {
              setHinted(true)
              onHint?.()
            }}
            style={{
              background: 'none',
              border: `1px solid ${color.line.strong}`,
              color: hinted ? color.text.muted : color.text.primary,
              fontFamily: font.display,
              fontSize: 12,
              padding: '0.25rem 0.8rem',
              borderRadius: radius.pill,
              cursor: hinted ? 'default' : 'pointer',
            }}
          >
            {hinted ? 'Two removed' : '50-50 hint'}
          </button>
        )}
      </div>

      <p style={{ fontFamily: font.display, fontSize: 16, fontWeight: 500, lineHeight: 1.45, margin: 0, color: color.text.primary }}>
        {mcq.question}
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        {mcq.options.map((opt, i) => {
          const gone = hinted && removed.includes(i) && !revealed
          const isPicked = picked === i
          const isAnswer = mcq.answer === i
          const state = !revealed ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim'
          const edge = state === 'right' ? color.state.correct : state === 'wrong' ? color.state.wrong : color.line.default
          return (
            <motion.button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed || gone}
              animate={
                gone
                  ? { opacity: 0.18, scale: 0.97 }
                  : state === 'wrong'
                    ? { x: [0, -9, 9, -6, 6, 0], opacity: 1 }
                    : { opacity: state === 'dim' ? 0.45 : 1, scale: 1, x: 0 }
              }
              whileHover={!revealed && !gone ? { x: 3 } : undefined}
              transition={state === 'wrong' ? { duration: 0.4 } : spring.smooth}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                padding: '11px 14px',
                borderRadius: radius.md,
                background:
                  state === 'right' ? 'rgba(94,229,154,0.10)' : state === 'wrong' ? 'rgba(255,107,129,0.10)' : color.bg.panelSolid,
                border: `1px solid ${edge}`,
                boxShadow: state === 'right' ? glow.correct : state === 'wrong' ? glow.wrong : 'none',
                color: color.text.primary,
                fontFamily: font.body,
                fontSize: t.body.size,
                lineHeight: 1.4,
                cursor: revealed || gone ? 'default' : 'pointer',
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: font.display,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    state === 'right' ? color.state.correct : state === 'wrong' ? color.state.wrong : 'rgba(255,255,255,0.06)',
                  color: state === 'right' || state === 'wrong' ? color.text.onAccent : color.text.secondary,
                }}
              >
                {state === 'right' ? '✓' : state === 'wrong' ? '✕' : LETTERS[i]}
              </span>
              {opt}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            transition={spring.smooth}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gap: 12, paddingTop: 2 }}>
              <div style={{ fontFamily: font.display, fontWeight: 600, color: right ? color.state.correct : color.state.wrong }}>
                {right ? (hinted ? 'Correct, with a hint' : 'Correct') : 'Not quite'}
              </div>
              <p style={{ margin: 0, color: color.text.secondary, fontSize: t.small.size, lineHeight: 1.55 }}>{mcq.explanation}</p>
              <Button onClick={onNext} style={{ justifySelf: 'start', padding: '0.5rem 1.2rem', fontSize: 13 }}>
                {index + 1 < total ? 'Next question' : 'Back to the notes'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
