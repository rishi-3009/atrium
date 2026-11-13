/** One Euro filter (Casiez et al. 2012): smooth at rest, responsive in motion. */
export class OneEuroFilter {
  private x: number | null = null
  private dx = 0
  private t = 0

  constructor(
    private minCutoff = 1.2,
    private beta = 8,
    private dCutoff = 1,
  ) {}

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  /** `t` in seconds. */
  filter(value: number, t: number): number {
    if (this.x === null) {
      this.x = value
      this.t = t
      return value
    }
    const dt = Math.max(t - this.t, 1e-3)
    this.t = t
    const rawD = (value - this.x) / dt
    this.dx += OneEuroFilter.alpha(this.dCutoff, dt) * (rawD - this.dx)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += OneEuroFilter.alpha(cutoff, dt) * (value - this.x)
    return this.x
  }

  reset() {
    this.x = null
    this.dx = 0
  }
}

/** One filter per landmark axis. */
export class LandmarkSmoother {
  private f: OneEuroFilter[]

  constructor(count = 21) {
    this.f = Array.from({ length: count * 3 }, () => new OneEuroFilter())
  }

  apply(pts: { x: number; y: number; z: number }[], t: number) {
    return pts.map((p, i) => ({
      x: this.f[i * 3]!.filter(p.x, t),
      y: this.f[i * 3 + 1]!.filter(p.y, t),
      z: this.f[i * 3 + 2]!.filter(p.z, t),
    }))
  }

  reset() {
    this.f.forEach((f) => f.reset())
  }
}
