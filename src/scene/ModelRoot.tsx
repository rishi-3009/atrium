import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { useSceneStore } from '../shared/stores'

/**
 * Wraps a model. Smoothly follows `rotation` from the scene store, so hand
 * or mouse rotation glides instead of snapping, and adds a slow float.
 */
export function ModelRoot({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const { rotation } = useSceneStore.getState()
    g.rotation.x = MathUtils.damp(g.rotation.x, rotation.x, 8, dt)
    g.rotation.y = MathUtils.damp(g.rotation.y, rotation.y, 8, dt)
    g.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.04
  })

  return <group ref={ref}>{children}</group>
}
