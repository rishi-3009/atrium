import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useSceneStore } from '../shared/stores'

export type Vec3Tuple = [number, number, number]

interface Props {
  /** World position of the selected part, for the close-up. */
  focusPoint?: Vec3Tuple
  overviewDistance?: number
  closeupDistance?: number
}

const OVERVIEW_HEIGHT = 0.5
const tmp = new Vector3()

/**
 * Moves the camera between an overview and a part close-up with damped
 * easing. Reads `selectedPart` from the scene store, never from hands/.
 */
export function CameraRig({ focusPoint, overviewDistance = 6.5, closeupDistance = 3 }: Props) {
  const look = useRef(new Vector3(0, 0, 0))
  const selected = useSceneStore((s) => s.selectedPart)

  useFrame(({ camera, clock }, dt) => {
    const closeup = selected !== null && focusPoint !== undefined
    const target = closeup ? tmp.set(...focusPoint) : tmp.set(0, 0, 0)
    const dist = closeup ? closeupDistance : overviewDistance
    // gentle idle drift so the scene is never frozen
    const t = clock.elapsedTime
    const driftX = Math.sin(t * 0.25) * 0.25
    const driftY = Math.cos(t * 0.2) * 0.1

    const lambda = 3.2
    look.current.x = MathUtils.damp(look.current.x, target.x, lambda, dt)
    look.current.y = MathUtils.damp(look.current.y, target.y, lambda, dt)
    look.current.z = MathUtils.damp(look.current.z, target.z, lambda, dt)

    camera.position.x = MathUtils.damp(camera.position.x, look.current.x + driftX, lambda, dt)
    camera.position.y = MathUtils.damp(
      camera.position.y,
      look.current.y + OVERVIEW_HEIGHT * (closeup ? 0.4 : 1) + driftY,
      lambda,
      dt,
    )
    camera.position.z = MathUtils.damp(camera.position.z, look.current.z + dist, lambda, dt)
    camera.lookAt(look.current)
  })

  return null
}
