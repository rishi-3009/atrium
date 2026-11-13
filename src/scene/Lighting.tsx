import { Environment, Lightformer } from '@react-three/drei'

/**
 * Studio lighting with no downloads: a procedural HDRI built from light
 * panels (soft key, cool fill, accent rim) plus a few direct lights for
 * crisp highlights and a teal rim from behind.
 */
export function Lighting() {
  return (
    <>
      <color attach="background" args={['#07090d']} />
      <fog attach="fog" args={['#07090d', 9, 22]} />

      <Environment resolution={512} environmentIntensity={0.9}>
        {/* big soft key from above-left */}
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-4, 5, 3]} scale={[8, 5, 1]} target={[0, 0, 0]} />
        {/* cool fill from the right */}
        <Lightformer form="rect" intensity={0.9} color="#9fb8ff" position={[6, 1, 2]} scale={[4, 6, 1]} target={[0, 0, 0]} />
        {/* teal rim strips behind */}
        <Lightformer form="rect" intensity={3.2} color="#3de0c8" position={[-5, 1, -5]} scale={[1.2, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.4} color="#3de0c8" position={[5, 2, -5]} scale={[1.2, 9, 1]} target={[0, 0, 0]} />
        {/* faint floor bounce */}
        <Lightformer form="ring" intensity={0.5} color="#2a3a4a" position={[0, -5, 0]} scale={10} rotation-x={Math.PI / 2} />
      </Environment>

      <directionalLight position={[-3, 4, 4]} intensity={1.1} color="#fff4e8" />
      {/* rim light: from behind, teal, makes silhouettes glow */}
      <directionalLight position={[3, 2, -5]} intensity={2.4} color="#3de0c8" />
      <pointLight position={[0, -2, 3]} intensity={6} color="#6a7cff" distance={10} decay={2} />
    </>
  )
}
