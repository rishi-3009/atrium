import { motion } from 'framer-motion'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProgressRing } from '../components/ProgressRing'
import { AmbientGlow, CountUp, PageHeader, accentText } from '../components/Reveal'
import { useNavStore } from '../nav'
import { catalog, catalogById, modelMastery, weakParts, type LearnerProgress } from '../progress'
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
  const overall = catalog.length ? catalog.reduce((sum, m) => sum + modelMastery(progress, m.id), 0) / catalog.length : 0
  const partsKnown = catalog.reduce((sum, m) => sum + Math.round(modelMastery(progress, m.id) * m.content.definition.parts.length), 0)
  const partsAll = catalog.reduce((sum, m) => sum + m.content.definition.parts.length, 0)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: `${TOP_BAR_HEIGHT + 32}px clamp(28px, 6vw, 96px) 48px` }}>
      <AmbientGlow />
      <div style={{ position: 'relative' }}>
      <PageHeader
        eyebrow="Your progress"
        words={[{ text: 'See' }, { text: 'what' }, { text: 'you' }, { text: 'know.', accent: true }]}
        intro="See which parts you know and which ones need another look."
        aside={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.5 }}
            style={{ display: 'grid', justifyItems: 'end', gap: 6, paddingBottom: 4 }}
          >
            <span style={{ ...accentText, fontSize: 'clamp(4rem, 9vw, 7rem)', lineHeight: 0.9 }}>
              <CountUp value={Math.round(overall * 100)} delay={0.6} suffix="%" />
            </span>
            <span style={{ fontFamily: font.mono, fontSize: t.label.size, letterSpacing: t.label.tracking, textTransform: 'uppercase', color: color.text.muted }}>
              <CountUp value={partsKnown} delay={0.6} /> of {partsAll} parts known
            </span>
          </motion.div>
        }
      />

      {/* daily revision */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.smooth, delay: 0.7 }}>
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
        {catalog.map((m, i) => {
          const mastery = modelMastery(progress, m.id)
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...spring.smooth, delay: 0.8 + i * 0.06 }}
            >
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

      <h3 style={{ fontFamily: font.display, fontSize: t.h2.size, fontWeight: 600, letterSpacing: t.h2.tracking, margin: '0 0 16px' }}>
        Weak <span style={accentText}>parts</span>
      </h3>
      {weak.length === 0 ? (
        <p style={{ color: color.text.muted, fontSize: t.body.size, margin: 0 }}>No weak parts yet. Parts you get wrong will be listed here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
          {weak.map((w, i) => (
            <motion.button
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...spring.smooth, delay: i * 0.05 }}
              whileHover={{ x: 4, borderColor: color.line.strong }}
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
                <span style={{ color: color.text.muted, fontSize: t.small.size, marginLeft: 10 }}>{catalogById[w.modelId]?.content.definition.title}</span>
              </span>
              <span style={{ height: 6, borderRadius: radius.pill, background: color.line.default, overflow: 'hidden' }}>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, w.score * 100)}%` }}
                  transition={spring.gentle}
                  style={{ display: 'block', height: '100%', background: color.state.warn }}
                />
              </span>
            </motion.button>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
