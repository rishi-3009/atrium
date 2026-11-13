import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toast } from '../components/Toast'
import { startDemo } from '../demo'
import { useNavStore } from '../nav'
import type { LearnerProgress } from '../progress'
import { color } from '../tokens'
import { useTutorUi } from '../tutor/store'
import { CameraTile, type CameraInfo, type CameraStatus } from './CameraTile'
import { DemoCaption } from './DemoCaption'
import { Library } from './Library'
import { Loader } from './Loader'
import { ProgressView } from './ProgressView'
import { TopBar } from './TopBar'

// The 3D pages pull in three.js, so they load on demand.
const Landing = lazy(() => import('./Landing').then((m) => ({ default: m.Landing })))
const ModelStage = lazy(() => import('./ModelStage').then((m) => ({ default: m.ModelStage })))

interface Props {
  /** Hand camera status and controls, supplied by the app root. */
  camera: CameraInfo
  /** Learner memory from the tutor. Defaults to the scores kept by the quiz in this panel. */
  progress?: LearnerProgress
}

const CAMERA_NOTICE: Partial<Record<CameraStatus, string>> = {
  denied: 'Camera access was blocked. You can still use the mouse.',
  unavailable: 'No camera found. You can still use the mouse.',
  error: 'Hand tracking could not start. You can still use the mouse.',
}

/** The whole app below the root: top bar, pages, camera tile, toasts and the demo caption. */
export function AppShell({ camera, progress: external }: Props) {
  const view = useNavStore((s) => s.view)
  const modelId = useNavStore((s) => s.modelId)
  const local = useTutorUi((s) => s.progress)
  const progress = external ?? local
  const { videoRef, ...info } = camera

  // Tell the student once per problem, then let it go.
  const [seen, setSeen] = useState<CameraStatus | null>(null)
  const notice = camera.enabled ? CAMERA_NOTICE[camera.status] : undefined
  const showNotice = notice !== undefined && seen !== camera.status
  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setSeen(camera.status), 4500)
    return () => window.clearTimeout(t)
  }, [notice, camera.status])

  // ?demo=1 starts the scripted tour, for recording the video.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('demo')) startDemo()
  }, [])

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
          <Suspense fallback={<Loader label="Loading" />}>
            {view === 'home' && <Landing />}
            {view === 'stage' && <ModelStage key={modelId} />}
          </Suspense>
          {view === 'library' && <Library progress={progress} />}
          {view === 'progress' && <ProgressView progress={progress} />}
        </motion.div>
      </AnimatePresence>
      <CameraTile videoRef={videoRef} info={info} visible={view === 'stage'} />
      <DemoCaption />
      <Toast message={showNotice ? notice : null} />
    </div>
  )
}
