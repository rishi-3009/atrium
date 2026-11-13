import { motion } from 'framer-motion'
import { glbModels } from '../../models/glb'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProgressRing } from '../components/ProgressRing'
import { useNavStore } from '../nav'
import { modelMastery, weakParts, type LearnerProgress } from '../progress'
import { color, font, glow, radius, spring, type as t } from '../tokens'
import { TOP_BAR_HEIGHT } from './TopBar'

const ROUND_SIZE = 5

/** Progress per model, the weak parts, and a short daily revision round. */
export function ProgressView({ progress }: { progress: LearnerProgress }) {
  const openModel = useNavStore((s) => s.openModel)
  const go = useNavStore((s) => s.go)
  const weak = weakParts(progress)
  const round = weak.slice(0, ROUND_SIZE)
  const next = round[0]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: `${TOP_BAR_HEIGHT + 24}px clamp(28px, 6vw, 96px) 48px` }}>
      <h1 style={{ fontFamily: font.display, fontSize: t.h1.size, fontWeight: 600, letterSpacing: t.h1.tracking, margin: 0 }}>Progress</h1>
      <p style={{ color: color.text.secondary, margin: '8px 0 28px', maxWidth: 520 }}>
        See which parts you know and which ones need another look.
      </p>

      {/* daily revision */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth}>
        <Card
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            padding: 26,
            marginBottom: 24,
            background: `linear-gradient(120deg, ${color.accent.wash}, ${color.bg.panelSolid} 60%)`,
            border: `1px solid ${color.accent.deep}`,
            boxShadow: glow.accentSoft,
          }}
        >
          <div>
            <div style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, textTransform: 'uppercase', color: color.accent.soft }}>
              Daily round · about 5 minutes
            </div>
            <h2 style={{ fontFamily: font.display, fontSize: t.h2.size, fontWeight: 600, margin: '8px 0 6px', letterSpacing: t.h2.tracking }}>
              {next ? `${round.length} part${round.length === 1 ? '' : 's'} to revise` : 'Nothing to revise yet'}
            </h2>
            <p style={{ color: color.text.secondary, margin: 0, maxWidth: 520, fontSize: t.body.size }}>
              {next
                ? `Start with ${next.label.toLowerCase()}. ${round
                    .slice(1)
                    .map((p) => p.label.toLowerCase())
                    .join(', ')}`.replace(/\.\s*$/, '.')
                : 'Open a model and answer a few questions. The parts you find hard will show up here.'}
            </p>
          </div>
          <Button onClick={() => (next ? openModel(next.modelId, next.partId) : go('library'))}>{next ? 'Start the round' : 'Open the library'}</Button>
        </Card>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
        {Object.values(glbModels).map((m, i) => {
          const mastery = modelMastery(progress, m.id)
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.smooth, delay: 0.05 + i * 0.05 }}>
              <Card interactive onClick={() => openModel(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <ProgressRing value={mastery} size={68} />
                <div>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: t.h3.size }}>{m.content.definition.title}</div>
                  <div style={{ color: color.text.muted, fontSize: t.small.size, marginTop: 4 }}>
                    {Math.round(mastery * m.content.definition.parts.length)} of {m.content.definition.parts.length} parts known
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <h3 style={{ fontFamily: font.display, fontSize: t.h3.size, fontWeight: 600, margin: '0 0 14px' }}>Weak parts</h3>
      {weak.length === 0 ? (
        <p style={{ color: color.text.muted, fontSize: t.body.size, margin: 0 }}>No weak parts yet. Parts you get wrong will be listed here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
          {weak.map((w) => (
            <button
              key={w.modelId + w.partId}
              onClick={() => openModel(w.modelId, w.partId)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px',
                alignItems: 'center',
                gap: 16,
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: radius.md,
                background: color.bg.panelSolid,
                border: `1px solid ${color.line.default}`,
                color: color.text.primary,
                cursor: 'pointer',
              }}
            >
              <span>
                <span style={{ fontFamily: font.display, fontWeight: 600 }}>{w.label}</span>
                <span style={{ color: color.text.muted, fontSize: t.small.size, marginLeft: 10 }}>{glbModels[w.modelId]?.content.definition.title}</span>
              </span>
              <span style={{ height: 6, borderRadius: radius.pill, background: color.line.default, overflow: 'hidden' }}>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, w.score * 100)}%` }}
                  transition={spring.gentle}
                  style={{ display: 'block', height: '100%', background: color.state.warn }}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
