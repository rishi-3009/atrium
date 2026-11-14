import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSceneStore } from '../../shared/stores'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { startDemo } from '../demo'
import { useNavStore } from '../nav'
import { color, font, spring } from '../tokens'
import { StageBoundary } from './StageBoundary'
import { VesselHero } from './VesselHero'

export function Landing() {
  const go = useNavStore((s) => s.go)

  useEffect(() => {
    const s = useSceneStore.getState()
    s.setSelected(null)
    s.setHovered(null)
    s.setExplode(0)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <StageBoundary>
          <VesselHero />
        </StageBoundary>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 15% 55%, ${color.bg.base} 25%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 'clamp(28px, 6vw, 96px)',
          top: '50%',
          transform: 'translateY(-50%)',
          maxWidth: 560,
          display: 'grid',
          gap: 22,
        }}
      >
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip active>NCERT Class 10 to 12</Chip>
          <Chip>NEET biology</Chip>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.06 }}
          style={{ fontFamily: font.display, fontSize: 'clamp(2.6rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.03em', margin: 0, color: color.text.primary, textShadow: '0 2px 24px rgba(20, 6, 10, 0.6)' }}
        >
          Take biology apart with your hands.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.12 }}
          style={{ color: color.text.secondary, fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 480 }}
        >
          Open an NCERT diagram as a 3D model. Pull it apart with a webcam or a mouse. A tutor explains each part, sets a small task and asks you a NEET-style question.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.18 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', pointerEvents: 'auto' }}
        >
          <Button onClick={() => go('library')}>Start exploring</Button>
          <Button variant="ghost" onClick={startDemo}>
            Watch the demo
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
