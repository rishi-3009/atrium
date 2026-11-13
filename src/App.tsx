import { useEffect } from 'react'
import { startMouseHand } from '@/hands/mouseHand'
import { useHandStore } from '@/shared/stores'

export function App() {
  useEffect(() => startMouseHand(), [])
  const pinch = useHandStore((s) => s.hands.right?.pinch ?? 0)
  return (
    <main className="grid h-full place-items-center">
      <p>Atrium scaffold. Mouse hand pinch: {pinch}</p>
    </main>
  )
}
