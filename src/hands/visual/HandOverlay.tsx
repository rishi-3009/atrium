import { Component, useEffect, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useHandStore } from '@/shared/stores'
import { z } from '@/ui/tokens'
import { HandSkeleton } from './HandSkeleton'
import { SpreadLink } from './SpreadLink'

/** True while `on`, and for `ms` after it goes false, so fades can finish. */
function useLinger(on: boolean, ms: number) {
  const [v, setV] = useState(on)
  useEffect(() => {
    const t = window.setTimeout(() => setV(on), on ? 0 : ms)
    return () => window.clearTimeout(t)
  }, [on, ms])
  return v || on
}

/** If WebGL is unavailable the overlay just disappears; the app must never blank because of it. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e: unknown) {
    console.warn('[hands] overlay disabled:', e)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Full-screen transparent canvas that draws the tracked hands over the app.
 * Mounted only while the camera drives the hands, and it stops rendering a
 * moment after the last hand leaves the frame.
 */
export function HandOverlay() {
  const camera = useHandStore((s) => s.source === 'camera')
  const present = useHandStore((s) => s.hands.left !== undefined || s.hands.right !== undefined)
  const active = useLinger(present, 900)
  if (!camera) return null

  return (
    <Quiet>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: z.panel + 5, pointerEvents: 'none' }}
        aria-hidden
      >
        <Canvas
          flat
          dpr={[1, 1.5]}
          frameloop={active ? 'always' : 'never'}
          camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 50 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: false,
          }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          style={{ background: 'transparent' }}
        >
          <HandSkeleton side="left" />
          <HandSkeleton side="right" />
          <SpreadLink />
        </Canvas>
      </div>
    </Quiet>
  )
}
