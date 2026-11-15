import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/** 0 = lowest (no post), 1 = bloom + vignette, 2 = full. */
export type Quality = 0 | 1 | 2

/**
 * Restrained post-processing. Effects drop away with quality so the frame
 * rate never drops first: grain goes first, then bloom. No depth of field: it blurred the model.
 */
/** `glow` 1 = default. Above 1 lowers the bloom threshold and lifts its strength. */
export function Effects({ quality, glow = 1 }: { quality: Quality; glow?: number }) {
  if (quality === 0) return null
  return (
    <EffectComposer multisampling={quality === 2 ? 4 : 0} enableNormalPass={false}>
      <Bloom
        intensity={0.45 * glow}
        luminanceThreshold={0.85 - (glow - 1) * 0.4}
        luminanceSmoothing={0.25}
        radius={0.7 + (glow - 1) * 0.15}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
      {/* overlay, not soft light: soft light breaks into coloured speckles on highlights brighter than white */}
      {quality === 2 ? <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.35} /> : <></>}
    </EffectComposer>
  )
}
