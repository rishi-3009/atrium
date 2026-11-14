import type { Mesh } from 'three'

/** Makes a mesh ignore the pointer while it is hidden. Returns the mesh. */
export function hideable<T extends Mesh>(m: T): T {
  const raycast = m.raycast.bind(m)
  m.raycast = (r, hits) => {
    if (m.visible) raycast(r, hits)
  }
  return m
}

/**
 * Runs `fn` once per rendered frame while `driver` is on screen. The models
 * here move by themselves (a helix unzips, filaments slide, an impulse
 * travels), and this lets them do it without any hook in the scene.
 *
 * `dt` is seconds since the last frame, capped so a paused tab does not jump.
 * `time` is seconds this model has been running.
 */
export function onFrame(driver: Mesh, fn: (dt: number, time: number) => void): void {
  let last = performance.now()
  let time = 0
  driver.frustumCulled = false
  driver.onBeforeRender = () => {
    const now = performance.now()
    // post-processing can draw the scene more than once per frame
    if (now - last < 2) return
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    time += dt
    fn(dt, time)
  }
}
