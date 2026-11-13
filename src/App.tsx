import { useEffect, useRef, useState } from 'react'
import { startMouseHand } from '@/hands/mouseHand'
import { startCameraHands } from '@/hands/tracker'
import { useCameraStore } from '@/hands/cameraStore'
import { AppShell } from '@/ui'
import { startHandInteraction } from '@/interaction'

/**
 * Root wiring. The UI never imports from `hands/`, so this file starts the
 * mouse or camera hand and passes the camera status down.
 */
export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [useCamera, setUseCamera] = useState(false)
  const status = useCameraStore((s) => s.status)
  const fps = useCameraStore((s) => s.fps)

  useEffect(() => {
    if (!useCamera) return startMouseHand()
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

  // hands drive the scene; it idles while the mouse is in charge
  useEffect(() => startHandInteraction(), [])

  return (
    <AppShell
      camera={{
        videoRef,
        enabled: useCamera,
        status,
        fps,
        onToggle: () => setUseCamera((v) => !v),
      }}
    />
  )
}
