import { useEffect, useRef, useState } from 'react'
import {
  HandLesson,
  HandOverlay,
  startCameraHands,
  startFakeHand,
  startMouseHand,
  useCameraStore,
} from '@/hands'
import { AppShell } from '@/ui'

// `?hand=fake` runs a scripted hand, for working on the visuals without a webcam.
const FAKE = new URLSearchParams(window.location.search).get('hand') === 'fake'

/**
 * Root wiring. The UI never imports from `hands/`, so this file starts the
 * mouse or camera hand, passes the camera status down, and mounts the hand
 * overlay and the gesture lesson above the shell.
 */
export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [useCamera, setUseCamera] = useState(false)
  const status = useCameraStore((s) => s.status)
  const fps = useCameraStore((s) => s.fps)

  useEffect(() => {
    if (!useCamera) return FAKE ? startFakeHand() : startMouseHand()
    const ctrl = new AbortController()
    let stop = () => {}
    startCameraHands(videoRef.current!, ctrl.signal).then((s) => {
      if (ctrl.signal.aborted) s()
      else stop = s
    })
    return () => {
      ctrl.abort()
      stop()
    }
  }, [useCamera])

  return (
    <>
      <AppShell
        camera={{
          videoRef,
          enabled: useCamera,
          status,
          fps,
          onToggle: () => setUseCamera((v) => !v),
        }}
      />
      <HandOverlay />
      <HandLesson />
    </>
  )
}
