export type FlashKind = 'good' | 'bad'

interface Flash {
  kind: FlashKind
  t0: number
}

const GOOD_MS = 1500
const BAD_MS = 1000

const active = new Map<string, Flash>()

/** Pulses a part: one soft bloom for a right answer, a quick flicker for a wrong one. */
export function flashPart(partId: string, kind: FlashKind): void {
  active.set(partId, { kind, t0: performance.now() })
}

/** Strength 0 to 1 of the pulse on a part right now, or null when none is running. */
export function flashLevel(partId: string, now: number): { amount: number; kind: FlashKind } | null {
  const f = active.get(partId)
  if (!f) return null
  const e = (now - f.t0) / (f.kind === 'good' ? GOOD_MS : BAD_MS)
  if (e >= 1) {
    active.delete(partId)
    return null
  }
  const amount = f.kind === 'good' ? Math.sin(Math.PI * e) : Math.abs(Math.sin(3 * Math.PI * e)) * (1 - e * 0.5)
  return { amount, kind: f.kind }
}
