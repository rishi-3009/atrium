import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Mcq, ModelContent } from '../../content'
import { focusPart, highlight } from '../../scene'
import { useSceneStore } from '../../shared/stores'
import type { Lang, Level } from '../../shared/types'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { GlassPanel } from '../components/GlassPanel'
import { color, font, spring, type as t } from '../tokens'
import type { ExplainRequest } from '../tutor/client'
import { McqCard } from '../tutor/McqCard'
import { Segmented } from '../tutor/Segmented'
import { useTutorUi } from '../tutor/store'
import { useExplanation } from '../tutor/useExplanation'

const LANGS: { value: Lang; label: string; title: string }[] = [
  { value: 'en', label: 'EN', title: 'English' },
  { value: 'hi', label: 'हिं', title: 'Hindi' },
  { value: 'mr', label: 'मर', title: 'Marathi' },
]

const LEVELS: { value: Level; label: string }[] = [
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 'neet', label: 'NEET' },
]

const eyebrow = {
  fontFamily: font.display,
  fontSize: t.label.size,
  fontWeight: t.label.weight,
  letterSpacing: t.label.tracking,
  textTransform: 'uppercase' as const,
}

function Cursor() {
  return (
    <motion.span
      aria-hidden
      animate={{ opacity: [1, 0.15, 1] }}
      transition={{ duration: 0.9, repeat: Infinity }}
      style={{ display: 'inline-block', width: 7, height: '1em', marginLeft: 3, verticalAlign: '-0.12em', background: color.accent.base, borderRadius: 2 }}
    />
  )
}

interface BodyProps {
  content: ModelContent
  partId: string | null
}

/** The explanation for one part (or the whole model), and the quiz for it. */
function Body({ content, partId }: BodyProps) {
  const { definition, notes, overview, mcqs } = content
  const lang = useTutorUi((s) => s.lang)
  const level = useTutorUi((s) => s.level)
  const record = useTutorUi((s) => s.record)
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn')
  const [q, setQ] = useState(0)

  const part = definition.parts.find((p) => p.id === partId)
  const req: ExplainRequest = {
    modelId: definition.id,
    partId: part?.id ?? '',
    partLabel: part?.label ?? definition.title,
    note: part ? (notes[part.noteKey] ?? '') : overview,
    level,
    lang,
    history: [],
  }
  const ex = useExplanation(req, `${definition.id}:${partId ?? 'all'}:${lang}:${level}`)

  const questions: Mcq[] = useMemo(() => {
    const own = partId ? mcqs.filter((m) => m.partId === partId) : []
    return own.length ? own : mcqs
  }, [mcqs, partId])
  const mcq = questions[q]

  const needsOnline = lang !== 'en' && !ex.streaming && ex.source === 'notes'

  if (mode === 'quiz' && mcq) {
    return (
      <McqCard
        key={mcq.id}
        mcq={mcq}
        index={q}
        total={questions.length}
        onAnswer={(r) => record(definition.id, mcq.partId, r)}
        onHint={() => {
          highlight(mcq.partId)
          window.setTimeout(() => highlight(null), 1800)
        }}
        onNext={() => {
          if (q + 1 < questions.length) setQ(q + 1)
          else {
            setMode('learn')
            setQ(0)
          }
        }}
      />
    )
  }

  return (
    <div>
      <div style={{ ...eyebrow, color: color.accent.soft }}>{part ? 'Selected part' : definition.title}</div>
      <h2 style={{ fontFamily: font.display, fontSize: t.h2.size, fontWeight: 600, letterSpacing: t.h2.tracking, lineHeight: t.h2.line, margin: '6px 0 10px' }}>
        {part ? part.label : 'Take it apart'}
      </h2>
      <p style={{ color: color.text.secondary, fontSize: t.body.size, lineHeight: t.body.line, margin: 0, minHeight: 72 }}>
        {ex.text}
        {ex.streaming && <Cursor />}
      </p>

      <AnimatePresence>
        {needsOnline && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ margin: '12px 0 0', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,199,102,0.08)', border: '1px solid rgba(255,199,102,0.25)', color: color.state.warn, fontSize: t.small.size, lineHeight: 1.5 }}
          >
            Hindi and Marathi need the online tutor. This is the English note.
          </motion.p>
        )}
      </AnimatePresence>

      {!part && !ex.streaming && (
        <p style={{ color: color.text.muted, fontSize: t.small.size, lineHeight: t.small.line, marginTop: 14 }}>
          Point at a part to see its name. Pinch or click it to read about it.
        </p>
      )}

      {mcq && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: ex.streaming ? 0.5 : 1 }} style={{ marginTop: 18 }}>
          <Button
            disabled={ex.streaming}
            onClick={() => {
              setQ(0)
              setMode('quiz')
            }}
            style={{ padding: '0.55rem 1.3rem', fontSize: 14 }}
          >
            {part ? `Quiz me on this part` : 'Quiz me on the model'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}

/** Right-hand panel: language and level, the streamed explanation, the quiz, and the part list. */
export function TutorPanel({ content }: { content: ModelContent }) {
  const selected = useSceneStore((s) => s.selectedPart)
  const hovered = useSceneStore((s) => s.hoveredPart)
  const lang = useTutorUi((s) => s.lang)
  const level = useTutorUi((s) => s.level)
  const setLang = useTutorUi((s) => s.setLang)
  const setLevel = useTutorUi((s) => s.setLevel)
  const { definition } = content

  return (
    <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 22, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Segmented id="lang" value={lang} options={LANGS} onChange={setLang} />
        <Segmented id="level" value={level} options={LEVELS} onChange={setLevel} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${definition.id}:${selected ?? 'all'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.smooth}
          >
            <Body content={content} partId={selected} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ borderTop: `1px solid ${color.line.subtle}`, paddingTop: 14, marginTop: 14 }}>
        <div style={{ ...eyebrow, color: color.text.muted, marginBottom: 10 }}>Parts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflow: 'auto' }}>
          {definition.parts.map((p) => (
            <button
              key={p.id}
              onClick={() => focusPart(selected === p.id ? null : p.id)}
              onMouseEnter={() => highlight(p.id)}
              onMouseLeave={() => highlight(null)}
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            >
              <Chip active={selected === p.id || hovered === p.id}>{p.label}</Chip>
            </button>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}
