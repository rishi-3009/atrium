import { Color, MeshStandardMaterial, type Material } from 'three'
import { color } from '../ui/tokens'

/** Per-part values the shader reads. Change `.value` each frame. */
export interface PartUniforms {
  uRim: { value: number }
  uDim: { value: number }
  uRimColor: { value: Color }
}

export function makePartUniforms(): PartUniforms {
  return {
    uRim: { value: 0 },
    uDim: { value: 0 },
    uRimColor: { value: new Color(color.accent.base) },
  }
}

/**
 * Clones a material and adds a fresnel rim glow (`uRim`) and a darken
 * factor (`uDim`) to the standard PBR shader. Other material types are
 * returned as plain clones.
 */
export function patchMaterial(source: Material, u: PartUniforms): Material {
  const mat = source.clone()
  if (!(mat instanceof MeshStandardMaterial)) return mat

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = u.uRim
    shader.uniforms.uDim = u.uDim
    shader.uniforms.uRimColor = u.uRimColor

    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform float uRim;\nuniform float uDim;\nuniform vec3 uRimColor;\nvoid main() {',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        #ifndef FLAT_SHADED
        float rimF = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.2);
        totalEmissiveRadiance += uRimColor * (rimF * 1.6 + 0.08) * uRim;
        #endif`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        gl_FragColor.rgb *= mix(1.0, 0.16, uDim);`,
      )
  }
  mat.customProgramCacheKey = () => 'atrium-part'
  return mat
}
