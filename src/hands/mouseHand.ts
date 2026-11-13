import { useHandStore } from '@/shared/stores'
import type { HandState } from '@/shared/types'

/** Fake hand: the mouse writes the same store the camera will. Hold the button to pinch. */
export function startMouseHand(): () => void {
  const { setHand, setSource } = useHandStore.getState()
  let down = false
  let x = 0.5
  let y = 0.5

  const push = () => {
    const pinch = down ? 1 : 0
    const hand: HandState = {
      handedness: 'right',
      landmarks: Array.from({ length: 21 }, () => ({ x, y, z: 0 })),
      pinch,
      pinchPoint: { x, y },
      gesture: down ? 'pinch' : 'point',
    }
    setHand(hand, 'right')
  }
  const move = (e: PointerEvent) => {
    x = e.clientX / window.innerWidth
    y = e.clientY / window.innerHeight
    push()
  }
  const press = () => ((down = true), push())
  const release = () => ((down = false), push())

  setSource('mouse')
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerdown', press)
  window.addEventListener('pointerup', release)
  return () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerdown', press)
    window.removeEventListener('pointerup', release)
    setHand(null, 'right')
    setSource('none')
  }
}
