import { AnimatePresence, motion } from 'framer-motion'
import type { ModelContent } from '../../content'
import { focusPart, highlight } from '../../scene'
import { useSceneStore } from '../../shared/stores'
import { Chip } from '../components/Chip'
import { GlassPanel } from '../components/GlassPanel'
import { color, font, spring, type as t } from '../tokens'

/**
 * Right-hand panel. For now it shows the NCERT note for the selected part
 * and the part list. Streaming tutor text and MCQ cards come in step 6.
 */
export function TutorPanel({ content }: { content: ModelContent }) {
  const selected = useSceneStore((s) => s.selectedPart)
  const hovered = useSceneStore((s) => s.hoveredPart)
  const { definition, notes, overview } = content
  const part = definition.parts.find((p) => p.id === selected)
  const text = part ? notes[part.noteKey] : overview

  return (
    <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 22, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {definition.chapters.map((c) => (
          <Chip key={c}>{c.split(' · ')[0]}</Chip>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={part?.id ?? 'overview'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.smooth}
          >
            <div style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, textTransform: 'uppercase', color: color.accent.soft }}>
              {part ? 'Selected part' : definition.title}
            </div>
            <h2 style={{ fontFamily: font.display, fontSize: t.h2.size, fontWeight: 600, letterSpacing: t.h2.tracking, lineHeight: t.h2.line, margin: '6px 0 10px' }}>
              {part ? part.label : 'Take it apart'}
            </h2>
            <p style={{ color: color.text.secondary, fontSize: t.body.size, lineHeight: t.body.line, margin: 0 }}>{text}</p>
            {!part && (
              <p style={{ color: color.text.muted, fontSize: t.small.size, lineHeight: t.small.line, marginTop: 14 }}>
                Point at a part to see its name. Pinch or click it to read about it.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ borderTop: `1px solid ${color.line.subtle}`, paddingTop: 14, marginTop: 14 }}>
        <div style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, textTransform: 'uppercase', color: color.text.muted, marginBottom: 10 }}>
          Parts
        </div>
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
