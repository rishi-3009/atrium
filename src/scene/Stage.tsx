import { Suspense, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { CameraRig, type Vec3Tuple } from './CameraRig'
import { Effects, type Quality } from './Effects'
import { Lighting } from './Lighting'
import { ModelRoot } from './ModelRoot'

interface Props {
  /** The model to show. Parts should be named meshes. */
  children: ReactNode
  /** World position the camera flies to when a part is selected. */
  focusPoint?: Vec3Tuple
  /** How far the camera sits from the model in the overview. */
  distance?: number
}

/**
 * The 3D canvas: lighting, post-processing, camera rig and adaptive
 * resolution. Quality steps down when the frame rate drops.
 */
export function Stage({ children, focusPoint, distance = 6.5 }: Props) {
  const [quality, setQuality] = useState<Quality>(2)
  const [dpr, setDpr] = useState(1.5)

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0.5, distance], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.outputColorSpace = SRGBColorSpace
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          setQuality((q) => (q > 0 ? ((q - 1) as Quality) : q))
          setDpr((d) => Math.max(1, d - 0.25))
        }}
        onIncline={() => {
          setQuality((q) => (q < 2 ? ((q + 1) as Quality) : q))
          setDpr((d) => Math.min(1.5, d + 0.25))
        }}
        onFallback={() => {
          setQuality(0)
          setDpr(1)
        }}
      />
      <Lighting />
      <Suspense fallback={null}>
        <ModelRoot>{children}</ModelRoot>
      </Suspense>
      <CameraRig focusPoint={focusPoint} overviewDistance={distance} />
      <Effects quality={quality} />
    </Canvas>
  )
}
