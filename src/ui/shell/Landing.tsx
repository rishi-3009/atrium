import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFrame } from '@react-three/fiber'
import { glbModels } from '../../models/glb'
import { ExplodableModel, Stage } from '../../scene'
import { useSceneStore } from '../../shared/stores'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { startDemo } from '../demo'
import { useNavStore } from '../nav'
import { color, font, spring } from '../tokens'
import { Loader } from './Loader'
import { StageBoundary } from './StageBoundary'
import { useBuilt } from './useBuilt'

/** Slowly pulls the hero model apart and puts it back together. */
function AutoExplode() {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const v = 0.5 - 0.5 * Math.cos(t * 0.45)
    useSceneStore.getState().setExplode(Math.min(1, v * 1.15))
  })
  return null
}

export function Landing() {
  const go = useNavStore((s) => s.go)
  const openModel = useNavStore((s) => s.openModel)
  const heart = glbModels.heart!
  const object = useBuilt(heart)

  useEffect(() => {
    const s = useSceneStore.getState()
    s.setSelected(null)
    s.setHovered(null)
    s.setExplode(0)
    s.setRotation(0.1, -0.5)
    return () => useSceneStore.getState().setExplode(0)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, left: '28%' }}>
        <StageBoundary>
          {object && (
            <Stage distance={11}>
              <AutoExplode />
              <ExplodableModel definition={heart.content.definition} object={object} spread={0.7} />
            </Stage>
          )}
        </StageBoundary>
        <AnimatePresence>{!object && <Loader key="load" label="Building the heart" />}</AnimatePresence>
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
          style={{ fontFamily: font.display, fontSize: 'clamp(2.6rem, 5vw, 4.25rem)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.03em', margin: 0 }}
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
          <Button onClick={() => openModel('heart')}>Open the heart</Button>
          <Button variant="ghost" onClick={() => go('library')}>
            Browse chapters
          </Button>
          <Button variant="ghost" onClick={startDemo}>
            Watch the demo
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
