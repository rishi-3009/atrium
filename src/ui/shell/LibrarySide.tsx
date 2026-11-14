import { motion } from 'framer-motion'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProgressRing } from '../components/ProgressRing'
import { useNavStore } from '../nav'
import { catalog, catalogById, modelMastery, weakParts, type LearnerProgress } from '../progress'
import { color, font, radius, spring, type as t } from '../tokens'
import { ModelThumb } from './ModelThumb'
import { TOP_BAR_HEIGHT } from './TopBar'

const SHOWN = 3

const label = {
  fontFamily: font.display,
  fontSize: t.label.size,
  fontWeight: 600,
  letterSpacing: t.label.tracking,
  textTransform: 'uppercase',
  color: color.accent.soft,
} as const

/** Right column of the library: where to resume, overall progress and the parts to revisit. */
export function LibrarySide({ progress, sticky }: { progress: LearnerProgress; sticky: boolean }) {
  const openModel = useNavStore((s) => s.openModel)
  const lastId = useNavStore((s) => s.lastModelId)
  const resume = catalogById[lastId ?? 'heart'] ?? catalog[0]
  const allWeak = weakParts(progress)
  const weak = allWeak.slice(0, SHOWN)
  const overall = catalog.length ? catalog.reduce((sum, m) => sum + modelMastery(progress, m.id), 0) / catalog.length : 0
  const resumeWeak = resume ? allWeak.find((w) => w.modelId === resume.id) : undefined

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring.smooth, delay: 0.1 }}
      style={{
        flex: sticky ? '0 0 clamp(340px, 30vw, 520px)' : 'none',
        width: sticky ? 'clamp(340px, 30vw, 520px)' : '100%',
        display: 'grid',
        gap: 16,
        position: sticky ? 'sticky' : 'static',
        top: sticky ? TOP_BAR_HEIGHT + 8 : undefined,
      }}
    >
      {resume && (
        <Card style={{ display: 'grid', gap: 14, padding: 16 }}>
          <span style={label}>{lastId ? 'Continue learning' : 'Start here'}</span>
          <ModelThumb id={resume.id} width="100%" height={170} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontFamily: font.display, fontSize: t.h3.size, fontWeight: 700, margin: 0, letterSpacing: t.h3.tracking }}>
                {resume.content.definition.title}
              </h3>
              <p style={{ color: color.text.muted, fontSize: t.small.size, margin: '4px 0 0' }}>
                {resumeWeak ? `Next: ${resumeWeak.label}` : 'Pick up where you left off'}
              </p>
            </div>
            <ProgressRing value={overall} size={56} stroke={5} />
          </div>
          <Button onClick={() => openModel(resume.id, resumeWeak?.partId ?? null)}>{lastId ? 'Resume' : 'Open'}</Button>
          <p style={{ color: color.text.muted, fontSize: t.small.size, margin: 0 }}>The ring shows your progress across all models.</p>
        </Card>
      )}

      <Card style={{ display: 'grid', gap: 12, padding: 16 }}>
        <span style={label}>Weak parts</span>
        {weak.length === 0 ? (
          <p style={{ color: color.text.secondary, fontSize: t.small.size, margin: 0, lineHeight: 1.5 }}>
            Nothing to revisit yet. Open a model and answer a question, and the parts you miss will show here.
          </p>
        ) : (
          weak.map((w) => (
            <button
              key={w.modelId + w.partId}
              onClick={() => openModel(w.modelId, w.partId)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: color.bg.raised,
                border: `1px solid ${color.line.default}`,
                borderRadius: radius.md,
                color: color.text.primary,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
              }}
            >
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{w.label}</span>
                <span style={{ color: color.text.muted, fontSize: t.small.size }}>{catalogById[w.modelId]?.content.definition.title}</span>
              </span>
              <span style={{ color: color.state.wrong, fontFamily: font.display, fontWeight: 700 }}>{Math.round(w.score * 100)}%</span>
            </button>
          ))
        )}
      </Card>
    </motion.aside>
  )
}
