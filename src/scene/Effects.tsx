import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/** 0 = lowest (no post), 1 = bloom + vignette, 2 = full. */
export type Quality = 0 | 1 | 2

/**
 * Restrained post-processing. Effects drop away with quality so the frame
 * rate never drops first: depth of field goes first, then bloom and grain.
 */
export function Effects({ quality }: { quality: Quality }) {
  if (quality === 0) return null
  return (
    <EffectComposer multisampling={quality === 2 ? 4 : 0} enableNormalPass={false}>
      <Bloom intensity={0.45} luminanceThreshold={0.85} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
      {quality === 2 ? (
        <DepthOfField focusDistance={0.025} focalLength={0.06} bokehScale={2.2} height={480} />
      ) : (
        <></>
      )}
      {quality === 2 ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} /> : <></>}
    </EffectComposer>
  )
}
