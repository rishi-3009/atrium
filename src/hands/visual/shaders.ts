/** GLSL for the hand overlay. Everything is additive, so draw order does not matter. */

export const jointVertex = /* glsl */ `
attribute float aSize;
attribute float aHot;
uniform float uScale;
uniform float uPixelRatio;
varying float vHot;

void main() {
  vHot = aHot;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // size attenuates with distance, so joints nearer the camera look bigger
  gl_PointSize = aSize * uScale * uPixelRatio * (10.0 / -mv.z);
}
`

export const jointFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uOpacity;
varying float vHot;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0) discard;
  float core = smoothstep(0.42, 0.0, d);
  float halo = exp(-d * d * 3.5) * 0.55 * (1.0 - core);
  vec3 col = mix(uColor, uHot, clamp(core * 0.75 + vHot * 0.3, 0.0, 1.0));
  float a = (core + halo) * uOpacity;
  gl_FragColor = vec4(col, a);
}
`

export const ringVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * A thin track ring, an arc that fills clockwise from the top with `uFill`,
 * a soft inner disc when the pinch is engaged, and an expanding pulse ring.
 */
export const ringFragment = /* glsl */ `
#define PI 3.14159265
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uFill;
uniform float uEngaged;
uniform float uPulse;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float R = 0.78;
  // 0 at the top, increasing clockwise
  float t = fract(atan(p.x, p.y) / (2.0 * PI));
  float ring = smoothstep(0.07, 0.0, abs(r - R));
  float track = ring * 0.22;
  float arc = ring * (1.0 - smoothstep(uFill - 0.01, uFill + 0.01, t));
  float glow = exp(-pow((r - R) * 6.0, 2.0)) * (0.18 * uFill + 0.28 * uEngaged);
  float disc = uEngaged * smoothstep(0.62, 0.0, r) * 0.32;
  float pulseR = R + (1.0 - uPulse) * 0.22;
  float pulse = uPulse * smoothstep(0.1, 0.0, abs(r - pulseR)) * 0.7;
  vec3 col = mix(uColor, uHot, clamp(uEngaged * 0.75 + arc * 0.15, 0.0, 1.0));
  float a = (track + arc * 0.95 + glow + disc + pulse) * uOpacity;
  gl_FragColor = vec4(col, a);
}
`
