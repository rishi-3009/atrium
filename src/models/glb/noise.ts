import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

/** Small seeded random generator, so every load builds the same model. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t)

function hash3(ix: number, iy: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Smooth 3D value noise in 0-1. Used to bend surfaces a little. */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const tx = smooth(x - xi)
  const ty = smooth(y - yi)
  const tz = smooth(z - zi)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), tx), l(c(0, 1, 0), c(1, 1, 0), tx), ty),
    l(l(c(0, 0, 1), c(1, 0, 1), tx), l(c(0, 1, 1), c(1, 1, 1), tx), ty),
    tz,
  )
}

/** Three octaves of 3D noise, centred on 0 (range about -1 to 1). */
export function fbm3(x: number, y: number, z: number): number {
  return (
    (noise3(x, y, z) - 0.5) * 1.0 +
    (noise3(x * 2.1, y * 2.1, z * 2.1) - 0.5) * 0.5 +
    (noise3(x * 4.3, y * 4.3, z * 4.3) - 0.5) * 0.25
  )
}

function periodicNoise(w: number, h: number, rand: () => number) {
  const g = new Float32Array(w * h)
  for (let i = 0; i < g.length; i++) g[i] = rand()
  return (x: number, y: number): number => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const tx = smooth(x - xi)
    const ty = smooth(y - yi)
    const x0 = ((xi % w) + w) % w
    const x1 = (x0 + 1) % w
    const y0 = ((yi % h) + h) % h
    const y1 = (y0 + 1) % h
    const a = g[y0 * w + x0]!
    const b = g[y0 * w + x1]!
    const c = g[y1 * w + x0]!
    const d = g[y1 * w + x1]!
    const top = a + (b - a) * tx
    const bot = c + (d - c) * tx
    return top + (bot - top) * ty
  }
}

export interface FieldOptions {
  size?: number
  /** Cells across in u and v for the first octave. Whole numbers tile cleanly. */
  fx: number
  fy: number
  octaves?: number
  gain?: number
  seed?: number
}

/** Tileable noise field with values in 0-1. */
export function fbmField({ size = 256, fx, fy, octaves = 4, gain = 0.5, seed = 1 }: FieldOptions): Float32Array {
  const rand = rng(seed)
  const out = new Float32Array(size * size)
  let amp = 1
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const w = Math.max(1, Math.round(fx * 2 ** o))
    const h = Math.max(1, Math.round(fy * 2 ** o))
    const n = periodicNoise(w, h, rand)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        out[y * size + x]! += n((x / size) * w, (y / size) * h) * amp
      }
    }
    total += amp
    amp *= gain
  }
  for (let i = 0; i < out.length; i++) out[i]! /= total
  return out
}

function finish(data: Uint8Array, size: number, srgb: boolean, repeat: boolean): DataTexture {
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  if (repeat) {
    tex.wrapS = RepeatWrapping
    tex.wrapT = RepeatWrapping
  }
  tex.magFilter = LinearFilter
  tex.minFilter = LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
  tex.needsUpdate = true
  return tex
}

/** Greyscale texture for bump maps. `contrast` stretches around the middle. */
export function grayTexture(field: Float32Array, size: number, contrast = 1): DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < field.length; i++) {
    const v = Math.min(1, Math.max(0, (field[i]! - 0.5) * contrast + 0.5))
    const b = Math.round(v * 255)
    data[i * 4] = b
    data[i * 4 + 1] = b
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  }
  return finish(data, size, false, true)
}

/** Colour texture that blends two colours by a noise field. */
export function mottleTexture(field: Float32Array, size: number, a: string, b: string, contrast = 1): DataTexture {
  const ca = new Color(a)
  const cb = new Color(b)
  const data = new Uint8Array(size * size * 4)
  const c = new Color()
  for (let i = 0; i < field.length; i++) {
    const t = Math.min(1, Math.max(0, (field[i]! - 0.5) * contrast + 0.5))
    c.copy(ca).lerp(cb, t)
    // DataTexture sRGB expects display-encoded bytes
    const s = c.clone().convertLinearToSRGB()
    data[i * 4] = Math.round(s.r * 255)
    data[i * 4 + 1] = Math.round(s.g * 255)
    data[i * 4 + 2] = Math.round(s.b * 255)
    data[i * 4 + 3] = 255
  }
  return finish(data, size, true, true)
}

export interface LeafTextureOptions {
  size?: number
  /** Colour at the base of the petal or leaf, and at its tip. */
  base: string
  tip: string
  vein: string
  veins?: number
  seed?: number
}

/**
 * Colour and bump maps for petals and sepals. u runs across, v runs from
 * the base to the tip. Veins fan out from the base and fork near the edge.
 */
export function leafTextures(o: LeafTextureOptions): { map: DataTexture; bump: DataTexture } {
  const size = o.size ?? 256
  const veins = o.veins ?? 9
  const rand = rng(o.seed ?? 7)
  const warp = fbmField({ size: 64, fx: 3, fy: 3, octaves: 3, seed: (o.seed ?? 7) + 1 })
  const mottle = fbmField({ size, fx: 6, fy: 6, octaves: 4, seed: (o.seed ?? 7) + 2 })
  const phase = Array.from({ length: veins }, () => (rand() - 0.5) * 0.02)

  const cBase = new Color(o.base)
  const cTip = new Color(o.tip)
  const cVein = new Color(o.vein)
  const col = new Color()
  const map = new Uint8Array(size * size * 4)
  const bump = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    const v = y / (size - 1)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1)
      const w = warp[(y % 64) * 64 + (x % 64)]! - 0.5
      let line = 0
      for (let k = 0; k < veins; k++) {
        const t = veins === 1 ? 0.5 : k / (veins - 1)
        const centre = 0.5 + (t - 0.5) * (0.12 + 0.88 * v) + phase[k]! + w * 0.03 * v
        const d = (u - centre) / 0.011
        line = Math.max(line, Math.exp(-d * d))
        // forks: thinner side veins in the outer half
        if (v > 0.45) {
          const d2 = (u - (centre + (t - 0.5) * 0.05 * (v - 0.45) * 4)) / 0.006
          line = Math.max(line, 0.55 * Math.exp(-d2 * d2))
        }
      }
      const m = mottle[y * size + x]!
      col.copy(cBase).lerp(cTip, Math.pow(v, 1.3))
      col.lerp(cVein, line * 0.45)
      col.multiplyScalar(0.9 + m * 0.2)
      const s = col.convertLinearToSRGB()
      const i = (y * size + x) * 4
      map[i] = Math.round(Math.min(1, s.r) * 255)
      map[i + 1] = Math.round(Math.min(1, s.g) * 255)
      map[i + 2] = Math.round(Math.min(1, s.b) * 255)
      map[i + 3] = 255
      const h = Math.round(Math.min(1, 0.45 + line * 0.4 + (m - 0.5) * 0.25) * 255)
      bump[i] = h
      bump[i + 1] = h
      bump[i + 2] = h
      bump[i + 3] = 255
    }
  }
  const a = finish(map, size, true, false)
  const b = finish(bump, size, false, false)
  return { map: a, bump: b }
}

export interface VeinedOptions {
  size?: number
  base: string
  mottle: string
  /** Colour of the larger veins. */
  vein: string
  /** Colour of the fine capillary network. */
  fine: string
  seed: number
  /** 0-1: how much of the surface the network covers. */
  density?: number
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * Muscle skin with a dense network of veins: broad colour patches, fine
 * muscle grain, and three layers of thin branching lines (the zero
 * contours of smooth noise form connected, vein-like webs). Returns a
 * colour map and a bump map that raises the veins.
 */
export function veinedTissue(o: VeinedOptions): { map: DataTexture; bump: DataTexture } {
  const size = o.size ?? 512
  const k = 0.6 + (o.density ?? 0.6) * 0.8
  const broad = fbmField({ size, fx: 5, fy: 5, octaves: 3, seed: o.seed })
  const grain = fbmField({ size, fx: 34, fy: 7, octaves: 3, seed: o.seed + 1 })
  const netA = fbmField({ size, fx: 5, fy: 5, octaves: 3, seed: o.seed + 2 })
  const netB = fbmField({ size, fx: 11, fy: 11, octaves: 3, seed: o.seed + 3 })
  const netC = fbmField({ size, fx: 24, fy: 24, octaves: 2, seed: o.seed + 4 })
  const netD = fbmField({ size, fx: 48, fy: 48, octaves: 2, seed: o.seed + 5 })

  const cBase = new Color(o.base)
  const cMottle = new Color(o.mottle)
  const cVein = new Color(o.vein)
  const cFine = new Color(o.fine)
  const c = new Color()
  const col = new Uint8Array(size * size * 4)
  const bmp = new Uint8Array(size * size * 4)

  for (let i = 0; i < size * size; i++) {
    const line = (f: number, w: number) => 1 - smoothstep(w * 0.4, w, Math.abs(f - 0.5))
    const a = line(netA[i]!, 0.016 * k)
    const b = line(netB[i]!, 0.014 * k)
    const cc = line(netC[i]!, 0.012 * k)
    const d = line(netD[i]!, 0.01 * k)

    c.copy(cBase).lerp(cMottle, clamp01((broad[i]! - 0.5) * 2.2 + 0.5))
    // muscle grain darkens and lightens the colour in thin strips
    c.multiplyScalar(0.9 + (grain[i]! - 0.5) * 0.45)
    c.lerp(cFine, Math.max(cc, d) * 0.7)
    c.lerp(cFine, b * 0.8)
    c.lerp(cVein, a * 0.95)
    const s = c.clone().convertLinearToSRGB()
    col[i * 4] = Math.round(clamp01(s.r) * 255)
    col[i * 4 + 1] = Math.round(clamp01(s.g) * 255)
    col[i * 4 + 2] = Math.round(clamp01(s.b) * 255)
    col[i * 4 + 3] = 255

    const h = clamp01(0.42 + (grain[i]! - 0.5) * 0.35 + a * 0.5 + b * 0.32 + cc * 0.2 + d * 0.12)
    const v = Math.round(h * 255)
    bmp[i * 4] = v
    bmp[i * 4 + 1] = v
    bmp[i * 4 + 2] = v
    bmp[i * 4 + 3] = 255
  }
  return { map: finish(col, size, true, true), bump: finish(bmp, size, false, true) }
}
