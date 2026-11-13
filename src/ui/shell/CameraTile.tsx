import type { RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../components/Button'
import { blur, color, font, glow, radius, spring, z } from '../tokens'

export type CameraStatus = 'idle' | 'requesting' | 'loading-model' | 'ready' | 'denied' | 'unavailable' | 'error'

/** What the shell needs from the hand info. The app root supplies it. */
export interface CameraInfo {
  videoRef: RefObject<HTMLVideoElement | null>
  /** True when the camera, not the mouse, is driving the hands. */
  enabled: boolean
  status: CameraStatus
  fps: number
  onToggle: () => void
}

const message: Record<CameraStatus, string> = {
  idle: 'Using the mouse. Turn the camera on to use your hands.',
  requesting: 'Asking for camera access…',
  'loading-model': 'Loading hand tracking…',
  ready: '',
  denied: 'Camera access was blocked. The mouse still works.',
  unavailable: 'No camera found. The mouse still works.',
  error: 'Hand tracking could not start. The mouse still works.',
}

const W = 232
const H = 174

/**
 * Framed mirror of the info. The video element stays mounted even when
 * hidden, because the hand tracker holds a reference to it.
 */
export function CameraTile({
  videoRef,
  info,
  visible,
}: {
  videoRef: CameraInfo['videoRef']
  info: Omit<CameraInfo, 'videoRef'>
  visible: boolean
}) {
  const live = info.enabled && info.status === 'ready'
  const busy = info.enabled && (info.status === 'requesting' || info.status === 'loading-model')
  const text = info.enabled ? message[info.status] : message.idle

  return (
    <motion.div
      initial={false}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
      transition={spring.smooth}
      style={{
        position: 'fixed',
        left: 28,
        top: 84,
        width: W,
        height: H,
        zIndex: z.hud,
        pointerEvents: visible ? 'auto' : 'none',
        overflow: 'hidden',
        borderRadius: radius.lg,
        background: color.bg.panelSolid,
        border: `1px solid ${live ? color.accent.deep : color.line.default}`,
        boxShadow: live ? glow.accent : glow.lift,
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          opacity: live ? 1 : 0,
          transition: 'opacity 0.35s',
        }}
      />

      <AnimatePresence>
        {!live && (
          <motion.div
            key="note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
              textAlign: 'center',
              fontFamily: font.display,
              fontSize: 13,
              lineHeight: 1.5,
              color: color.text.secondary,
              background: color.bg.panel,
              backdropFilter: `blur(${blur.glass})`,
              WebkitBackdropFilter: `blur(${blur.glass})`,
            }}
          >
            <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
              <span>{text}</span>
              {!busy && (
                <Button
                  variant={info.enabled ? 'ghost' : 'primary'}
                  onClick={info.onToggle}
                  style={{ padding: '0.45rem 1.1rem', fontSize: 13 }}
                >
                  {info.enabled ? 'Use the mouse' : 'Use my hands'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {live && (
        <>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: font.display,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: color.accent.soft,
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.accent.base, boxShadow: glow.accentSoft }} />
            Hands · {info.fps} fps
          </span>
          <button
            onClick={info.onToggle}
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              border: `1px solid ${color.line.strong}`,
              background: color.bg.panel,
              color: color.text.primary,
              fontFamily: font.display,
              fontSize: 11,
              padding: '0.25rem 0.7rem',
              borderRadius: radius.pill,
              cursor: 'pointer',
            }}
          >
            Use mouse
          </button>
        </>
      )}
    </motion.div>
  )
}
