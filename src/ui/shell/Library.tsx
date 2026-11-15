import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { AmbientGlow, PageHeader } from '../components/Reveal'
import { useNavStore } from '../nav'
import { catalog, modelMastery, parseChapter, type LearnerProgress } from '../progress'
import { ProgressRing } from '../components/ProgressRing'
import { color, font, radius, spring, type as t } from '../tokens'
import { LibrarySide } from './LibrarySide'
import { ModelThumb } from './ModelThumb'
import { PhotoScan } from './PhotoScan'
import { TOP_BAR_HEIGHT } from './TopBar'
import { useViewport } from './useViewport'

type Filter = 'all' | 10 | 11 | 12

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All classes' },
  { id: 10, label: 'Class 10' },
  { id: 11, label: 'Class 11' },
  { id: 12, label: 'Class 12' },
]

export function Library({ progress }: { progress: LearnerProgress }) {
  const [filter, setFilter] = useState<Filter>('all')
  const openModel = useNavStore((s) => s.openModel)
  const { width } = useViewport()
  const wide = width >= 1180

  const cards = useMemo(
    () =>
      catalog
        .map((m) => {
          const chapters = m.content.definition.chapters.map(parseChapter)
          return { model: m, chapters, shown: chapters.filter((c) => filter === 'all' || c.cls === filter) }
        })
        .filter((c) => c.shown.length > 0),
    [filter],
  )

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: `${TOP_BAR_HEIGHT + 32}px clamp(28px, 6vw, 96px) 48px` }}>
      <AmbientGlow />
      <div style={{ position: 'relative' }}>
      <PageHeader
        eyebrow={`${catalog.length} models · NCERT Class 10 to 12`}
        words={[{ text: 'Open' }, { text: 'a' }, { text: 'diagram', accent: true }, { text: 'in' }, { text: '3D.' }]}
        intro="Pick a model from your NCERT chapters, or take a photo of a diagram in your book."
      />

      <PhotoScan />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.smooth, delay: 0.75 }}
        role="tablist"
        style={{ display: 'inline-flex', gap: 4, padding: 4, marginBottom: 28, borderRadius: radius.pill, border: `1px solid ${color.line.default}`, background: color.bg.raised }}
      >
        {filters.map((f) => {
          const on = filter === f.id
          return (
            <button
              key={String(f.id)}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              style={{ position: 'relative', background: 'none', border: 0, cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: radius.pill, fontFamily: font.display, fontSize: t.small.size, fontWeight: 600, color: on ? color.text.onAccent : color.text.secondary, transition: 'color 0.25s' }}
            >
              {on ? (
                <motion.span
                  layoutId="library-filter"
                  transition={spring.snappy}
                  style={{ position: 'absolute', inset: 0, borderRadius: radius.pill, background: `linear-gradient(135deg, ${color.accent.soft}, ${color.accent.base})` }}
                />
              ) : null}
              <span style={{ position: 'relative' }}>{f.label}</span>
            </button>
          )
        })}
      </motion.div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexDirection: wide ? 'row' : 'column-reverse' }}>
      <div style={{ display: 'grid', gap: 16, flex: 1, minWidth: 0, width: '100%' }}>
        {cards.map(({ model, shown }, i) => {
          const d = model.content.definition
          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: 0.5 + i * 0.07 }}
            >
              <Card interactive onClick={() => openModel(model.id)} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 16 }}>
                <span style={{ flex: 'none', width: 44, alignSelf: 'flex-start', paddingTop: 6, paddingLeft: 6, fontFamily: font.serif, fontStyle: 'italic', fontSize: '2.2rem', lineHeight: 1, color: color.accent.soft, opacity: 0.85 }}>
                  {String(catalog.indexOf(model) + 1).padStart(2, '0')}
                </span>
                <ModelThumb id={model.id} />
                <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 12 }}>
                  <div>
                    <h2 style={{ fontFamily: font.display, fontSize: t.h2.size, fontWeight: 700, margin: 0, letterSpacing: t.h2.tracking }}>{d.title}</h2>
                    <p style={{ color: color.text.muted, fontSize: t.small.size, margin: '6px 0 0' }}>
                      {d.parts.length} parts · {d.tasks.length} tasks · {model.content.mcqs.length} questions
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {shown.map((c) => (
                      <div key={c.cls + c.unit} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, color: color.accent.soft, textTransform: 'uppercase', flex: 'none' }}>
                          Class {c.cls}
                        </span>
                        <span style={{ color: color.text.secondary, fontSize: t.small.size }}>{c.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 'none', paddingRight: 12 }}>
                  <ProgressRing value={modelMastery(progress, model.id)} size={64} stroke={5} />
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
      <LibrarySide progress={progress} sticky={wide} />
      </div>
      </div>
    </div>
  )
}
