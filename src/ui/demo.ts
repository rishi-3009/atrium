import { create } from 'zustand'
import { focusPart, highlight } from '../scene/api'
import { useSceneStore } from '../shared/stores'
import { useNavStore } from './nav'

interface DemoStore {
  running: boolean
  caption: string | null
}

export const useDemo = create<DemoStore>(() => ({ running: false, caption: null }))

let controller: AbortController | null = null

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (window.clearTimeout(t), resolve()), { once: true })
  })

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Animates a value from `from` to `to`, calling `apply` each frame. */
function tween(from: number, to: number, ms: number, apply: (v: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const step = (now: number) => {
      if (signal.aborted) return resolve()
      const k = Math.min(1, (now - t0) / ms)
      apply(from + (to - from) * ease(k))
      if (k < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

const say = (caption: string | null) => useDemo.setState({ caption })

async function showModel(id: string, parts: string[], signal: AbortSignal, firstNote: string) {
  const scene = useSceneStore.getState()
  useNavStore.getState().openModel(id)
  say(firstNote)
  await wait(2200, signal)
  await tween(0, 1, 2600, (v) => scene.setExplode(v), signal)
  for (const p of parts) {
    if (signal.aborted) return
    highlight(p)
    await wait(1500, signal)
  }
  highlight(null)
  await tween(1, 0, 1800, (v) => scene.setExplode(v), signal)
}

async function script(signal: AbortSignal) {
  const scene = useSceneStore.getState()
  const nav = useNavStore.getState()

  nav.go('home')
  say('Atrium turns an NCERT diagram into a 3D model you can take apart.')
  await wait(3500, signal)

  // 1. the heart: turn, explode, point, read
  nav.openModel('heart')
  say('Open the heart. Turn it with your hand or the mouse.')
  await wait(2200, signal)
  await tween(0, 1.3, 1800, (v) => scene.setRotation(0, v), signal)
  await tween(1.3, -0.9, 2400, (v) => scene.setRotation(0, v), signal)
  await tween(-0.9, 0, 1400, (v) => scene.setRotation(0, v), signal)

  say('Open your hands wide to pull it apart.')
  await tween(0, 1, 2600, (v) => scene.setExplode(v), signal)
  await wait(900, signal)

  say('Point at a part to see its name.')
  for (const p of ['aorta', 'pulmonary_artery', 'left_ventricle']) {
    if (signal.aborted) return
    highlight(p)
    await wait(1500, signal)
  }
  highlight(null)

  say('Pinch a part. The tutor explains it from the NCERT notes.')
  focusPart('left_ventricle')
  await wait(6500, signal)
  focusPart(null)
  await tween(1, 0, 1800, (v) => scene.setExplode(v), signal)

  // 2. the cell and the flower
  if (signal.aborted) return
  await showModel('cell', ['nucleus', 'mitochondria', 'golgi'], signal, 'The animal cell, with its organelles.')
  if (signal.aborted) return
  await showModel('flower', ['petals', 'stamens', 'ovary'], signal, 'The flower, whorl by whorl.')

  if (signal.aborted) return
  nav.go('progress')
  say('Quiz answers show up here, with the parts you should revisit.')
  await wait(3500, signal)
  nav.go('home')
}

function reset() {
  const s = useSceneStore.getState()
  s.setExplode(0)
  s.setSelected(null)
  s.setHovered(null)
  s.setRotation(0, 0)
  useDemo.setState({ running: false, caption: null })
}

/** Plays the scripted tour used for the demo video. Esc stops it. */
export function startDemo(): void {
  if (controller) return
  const ctrl = new AbortController()
  controller = ctrl
  useDemo.setState({ running: true, caption: null })
  script(ctrl.signal)
    .catch((e) => console.error('[demo]', e))
    .finally(() => {
      if (controller === ctrl) controller = null
      reset()
    })
}

export function stopDemo(): void {
  controller?.abort()
}
