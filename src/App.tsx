import { useEffect, useRef, useState } from 'react'
import { startMouseHand } from '@/hands/mouseHand'
import { startCameraHands } from '@/hands/tracker'
import { useCameraStore } from '@/hands/cameraStore'
import { useHandStore } from '@/shared/stores'

/** Temporary test page for the hand engine. The real UI comes from Harshavi. */
export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [useCamera, setUseCamera] = useState(false)
  const status = useCameraStore((s) => s.status)
  const fps = useCameraStore((s) => s.fps)
  const hands = useHandStore((s) => s.hands)

  useEffect(() => {
    if (!useCamera) return startMouseHand()
    let stop = () => {}
    let cancelled = false
    startCameraHands(videoRef.current!).then((s) => {
      if (cancelled) s()
      else stop = s
    })
    return () => {
      cancelled = true
      stop()
    }
  }, [useCamera])

  return (
    <main className="grid h-full place-items-center">
      <div className="space-y-3 text-center">
        <video ref={videoRef} muted playsInline className="mx-auto h-40 -scale-x-100 rounded-lg" />
        <button className="rounded border px-3 py-1" onClick={() => setUseCamera((v) => !v)}>
          {useCamera ? 'Use mouse' : 'Use camera'}
        </button>
        <p>
          camera: {status} | tracking fps: {fps}
        </p>
        {(['left', 'right'] as const).map((side) => (
          <p key={side}>
            {side}:{' '}
            {hands[side] ? `${hands[side].gesture}, pinch ${hands[side].pinch.toFixed(2)}` : '-'}
          </p>
        ))}
      </div>
    </main>
  )
}
