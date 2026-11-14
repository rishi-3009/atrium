import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { useNavStore } from '../nav'
import { catalog, modelMastery, parseChapter, type LearnerProgress } from '../progress'
import { ProgressRing } from '../components/ProgressRing'
import { color, font, spring, type as t } from '../tokens'
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
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: `${TOP_BAR_HEIGHT + 24}px clamp(28px, 6vw, 96px) 48px` }}>
      <h1 style={{ fontFamily: font.display, fontSize: t.h1.size, fontWeight: 700, letterSpacing: t.h1.tracking, margin: 0 }}>Library</h1>
      <p style={{ color: color.text.secondary, margin: '8px 0 24px', maxWidth: 520 }}>
        Pick a diagram from your NCERT chapters and open it in 3D.
      </p>

      <PhotoScan />

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button key={String(f.id)} onClick={() => setFilter(f.id)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <Chip active={filter === f.id}>{f.label}</Chip>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexDirection: wide ? 'row' : 'column-reverse' }}>
      <div style={{ display: 'grid', gap: 16, flex: 1, minWidth: 0, width: '100%' }}>
        {cards.map(({ model, shown }, i) => {
          const d = model.content.definition
          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: i * 0.06 }}
            >
              <Card interactive onClick={() => openModel(model.id)} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 16 }}>
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
  )
}
