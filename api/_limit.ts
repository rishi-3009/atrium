/** Per-visitor request cap. Memory is per server instance, so this is a best-effort guard, not a guarantee. */
export function makeLimiter(perMinute: number, perDay: number) {
  const hits = new Map<string, number[]>()
  return function limited(request: Request, now = Date.now()): boolean {
    const who = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const recent = (hits.get(who) ?? []).filter((t) => now - t < 86_400_000)
    const lastMinute = recent.filter((t) => now - t < 60_000).length
    if (lastMinute >= perMinute || recent.length >= perDay) {
      hits.set(who, recent)
      return true
    }
    recent.push(now)
    hits.set(who, recent)
    if (hits.size > 5000) hits.clear()
    return false
  }
}
