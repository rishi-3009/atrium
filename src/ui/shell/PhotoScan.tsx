import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { identifyDiagram, type IdentifyResult } from '../../tutor/identify'
import { Button } from '../components/Button'
import { GlassPanel } from '../components/GlassPanel'
import { useNavStore } from '../nav'
import { catalog } from '../progress'
import { color, font, spring, type as t } from '../tokens'
import { useTutorUi } from '../tutor/store'

type State =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'found'; modelId: string; title: string }
  | { kind: 'flat'; result: IdentifyResult }
  | { kind: 'error'; message: string }

const ERRORS = {
  busy: 'The photo reader is busy. Try again in a minute.',
  offline: 'Photo reading is not available right now.',
  unreadable: 'We could not open that photo. Try another one.',
} as const

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

/** Take or pick a photo of an NCERT diagram. Opens the matching 3D model, or explains it flat. */
export function PhotoScan() {
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ kind: 'idle' })
  const lang = useTutorUi((s) => s.lang)
  const openModel = useNavStore((s) => s.openModel)

  async function onFile(file: File | undefined) {
    if (!file) return
    setState({ kind: 'reading' })
    const out = await identifyDiagram(file, lang)
    if (!out.ok) return setState({ kind: 'error', message: ERRORS[out.reason] })
    const { modelId, title } = out.result
    if (modelId && catalog.some((m) => m.id === modelId)) return setState({ kind: 'found', modelId, title })
    setState({ kind: 'flat', result: out.result })
  }

  const reading = state.kind === 'reading'

  return (
    <div style={{ marginBottom: 24 }}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button variant="ghost" disabled={reading} onClick={() => input.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, opacity: reading ? 0.6 : 1 }}>
          <CameraIcon />
          {reading ? 'Reading the diagram' : 'Scan a diagram'}
        </Button>
        <span style={{ color: color.text.muted, fontSize: t.small.size }}>
          Take a photo of a diagram in your book. We open it in 3D if we have it.
        </span>
      </div>

      <AnimatePresence mode="wait">
        {(state.kind === 'found' || state.kind === 'flat' || state.kind === 'error') && (
          <GlassPanel
            key={state.kind}
            exit={{ opacity: 0, y: -8 }}
            transition={spring.smooth}
            role="status"
            style={{ marginTop: 16, padding: 20, maxWidth: 560, display: 'grid', gap: 12, borderColor: state.kind === 'found' ? color.accent.base : color.line.default }}
          >
            {state.kind === 'found' && (
              <>
                <span style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, color: color.accent.soft, textTransform: 'uppercase' }}>
                  Found it
                </span>
                <h2 style={{ fontFamily: font.display, fontSize: t.h3.size, fontWeight: 600, margin: 0 }}>{state.title}</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button onClick={() => openModel(state.modelId)}>Open in 3D</Button>
                  <Button variant="ghost" onClick={() => setState({ kind: 'idle' })}>Not this one</Button>
                </div>
              </>
            )}
            {state.kind === 'flat' && (
              <>
                <span style={{ fontFamily: font.display, fontSize: t.label.size, fontWeight: 600, letterSpacing: t.label.tracking, color: color.text.muted, textTransform: 'uppercase' }}>
                  No 3D model for this yet
                </span>
                {state.result.title && (
                  <h2 style={{ fontFamily: font.display, fontSize: t.h3.size, fontWeight: 600, margin: 0 }}>{state.result.title}</h2>
                )}
                <p style={{ color: color.text.secondary, margin: 0, lineHeight: t.body.line }}>
                  {state.result.explanation || 'We could not read enough from this photo.'}
                </p>
                <div>
                  <Button variant="ghost" onClick={() => setState({ kind: 'idle' })}>Close</Button>
                </div>
              </>
            )}
            {state.kind === 'error' && (
              <>
                <p style={{ color: color.state.warn, margin: 0 }}>{state.message}</p>
                <div>
                  <Button variant="ghost" onClick={() => setState({ kind: 'idle' })}>Close</Button>
                </div>
              </>
            )}
          </GlassPanel>
        )}
        {reading && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 16, height: 3, maxWidth: 560, borderRadius: 3, overflow: 'hidden', background: color.line.subtle }}
          >
            <motion.div
              animate={{ x: ['-100%', '250%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '40%', height: '100%', background: `linear-gradient(90deg, transparent, ${color.accent.base}, transparent)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
