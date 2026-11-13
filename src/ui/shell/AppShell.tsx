import { AnimatePresence, motion } from 'framer-motion'
import { useNavStore } from '../nav'
import type { LearnerProgress } from '../progress'
import { color } from '../tokens'
import { CameraTile, type CameraInfo } from './CameraTile'
import { Landing } from './Landing'
import { Library } from './Library'
import { ModelStage } from './ModelStage'
import { ProgressView } from './ProgressView'
import { TopBar } from './TopBar'

interface Props {
  /** Hand camera status and controls, supplied by the app root. */
  camera: CameraInfo
  /** Learner memory from the tutor. Empty until the tutor writes it. */
  progress?: LearnerProgress
}

const EMPTY: LearnerProgress = {}

/** The whole app below the root: top bar, pages, and the camera tile. */
export function AppShell({ camera, progress = EMPTY }: Props) {
  const view = useNavStore((s) => s.view)
  const { videoRef, ...info } = camera

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 70% 0%, ${color.accent.wash}, transparent 55%), ${color.bg.base}`,
      }}
    >
      <TopBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {view === 'home' && <Landing />}
          {view === 'library' && <Library progress={progress} />}
          {view === 'stage' && <ModelStage />}
          {view === 'progress' && <ProgressView progress={progress} />}
        </motion.div>
      </AnimatePresence>
      <CameraTile videoRef={videoRef} info={info} visible={view === 'stage'} />
    </div>
  )
}
