/**
 * Design tokens. The only place colours, fonts, spacing, radii, glows and
 * motion timings are defined. Components and the scene read from here.
 * Dark, cinematic, one accent (teal-cyan "bio" glow).
 */

export const color = {
  bg: {
    base: '#07090d',
    raised: '#0d1117',
    panel: 'rgba(16, 21, 29, 0.62)',
    panelSolid: '#10151d',
    overlay: 'rgba(4, 6, 9, 0.72)',
  },
  line: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.18)',
  },
  text: {
    primary: '#eef2f7',
    secondary: '#a4afbf',
    muted: '#6b7687',
    onAccent: '#031314',
  },
  accent: {
    base: '#3de0c8',
    soft: '#7aefdc',
    deep: '#16a898',
    glow: 'rgba(61, 224, 200, 0.45)',
    wash: 'rgba(61, 224, 200, 0.10)',
  },
  state: {
    correct: '#5ee59a',
    wrong: '#ff6b81',
    warn: '#ffc766',
  },
} as const

export const font = {
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const

/** Type scale: size / line height / weight / tracking. */
export const type = {
  hero: { size: '3.5rem', line: '1.05', weight: 600, tracking: '-0.03em' },
  h1: { size: '2.25rem', line: '1.15', weight: 600, tracking: '-0.02em' },
  h2: { size: '1.5rem', line: '1.25', weight: 600, tracking: '-0.015em' },
  h3: { size: '1.125rem', line: '1.35', weight: 600, tracking: '-0.01em' },
  body: { size: '0.9375rem', line: '1.6', weight: 400, tracking: '0' },
  small: { size: '0.8125rem', line: '1.5', weight: 400, tracking: '0' },
  label: { size: '0.6875rem', line: '1.2', weight: 600, tracking: '0.12em' },
} as const

/** 4px base grid. */
export const space = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.5rem',
  6: '2rem',
  7: '3rem',
  8: '4rem',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '28px',
  pill: '999px',
} as const

export const glow = {
  accent: '0 0 24px rgba(61, 224, 200, 0.35), 0 0 64px rgba(61, 224, 200, 0.15)',
  accentSoft: '0 0 16px rgba(61, 224, 200, 0.25)',
  correct: '0 0 24px rgba(94, 229, 154, 0.35)',
  wrong: '0 0 24px rgba(255, 107, 129, 0.35)',
  lift: '0 12px 40px rgba(0, 0, 0, 0.45)',
} as const

export const blur = {
  glass: '18px',
} as const

/** Durations in seconds (Framer Motion units). */
export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  cinematic: 1.1,
} as const

export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  soft: [0.4, 0, 0.2, 1],
} as const

/** Spring presets for Framer Motion and the scene. */
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 },
  smooth: { type: 'spring', stiffness: 240, damping: 30, mass: 1 },
  gentle: { type: 'spring', stiffness: 120, damping: 22, mass: 1 },
  bouncy: { type: 'spring', stiffness: 380, damping: 18, mass: 0.9 },
} as const

export const z = {
  stage: 0,
  hud: 10,
  panel: 20,
  toast: 40,
  modal: 50,
} as const

export const tokens = { color, font, type, space, radius, glow, blur, duration, ease, spring, z }
export type Tokens = typeof tokens
