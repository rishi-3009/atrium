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
let captions = true

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
      const k = Math.min(1, Math.max(0, (now - t0) / ms))
      apply(from + (to - from) * ease(k))
      if (k < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

const say = (caption: string | null) => useDemo.setState({ caption: captions ? caption : null })
const scene = () => useSceneStore.getState()

/** Opens a model, unless it is already on the stage, and waits for it to build. */
async function open(id: string, signal: AbortSignal) {
  const nav = useNavStore.getState()
  if (nav.view === 'stage' && nav.modelId === id) return
  nav.openModel(id)
  await wait(2400, signal)
}

/** Turns the model to `y` (and tilts it to `x`) from where it is now. */
function turnTo(y: number, ms: number, signal: AbortSignal, x = 0) {
  const from = scene().rotation
  return tween(0, 1, ms, (k) => scene().setRotation(from.x + (x - from.x) * k, from.y + (y - from.y) * k), signal)
}

function explodeTo(v: number, ms: number, signal: AbortSignal) {
  return tween(scene().explode, v, ms, (e) => scene().setExplode(e), signal)
}

/** Points at each part in turn, the way a hovering hand or mouse does. */
async function pointAt(parts: string[], signal: AbortSignal, each = 1600) {
  for (const p of parts) {
    if (signal.aborted) return
    highlight(p)
    await wait(each, signal)
  }
  highlight(null)
}

/** Opens one model and turns it once. */
function model(id: string, note: string): Chapter {
  return async (signal) => {
    say(note)
    await open(id, signal)
    await turnTo(0.8, 2000, signal, 0.08)
    await turnTo(-0.5, 2600, signal, -0.05)
    await turnTo(0, 1600, signal)
  }
}

type Chapter = (signal: AbortSignal) => Promise<void>

/**
 * One feature per chapter, so each can be recorded as its own take.
 * `?demo=<name>` plays one chapter. `?demo=1` plays the tour below.
 */
const chapters: Record<string, Chapter> = {
  home: async (signal) => {
    useNavStore.getState().go('home')
    say('Atrium turns an NCERT diagram into a 3D model you can take apart.')
    await wait(6000, signal)
  },

  library: async (signal) => {
    useNavStore.getState().go('library')
    say('Six models from NCERT Class 10 to 12.')
    await wait(6000, signal)
  },

  heart: model('heart', 'Open the heart. Turn it with your hand or the mouse.'),
  cell: model('cell', 'The animal cell, with its organelles.'),
  flower: model('flower', 'The flower, whorl by whorl.'),
  dna: model('dna', 'The DNA double helix.'),
  sarcomere: model('sarcomere', 'The sarcomere, the unit of muscle contraction.'),
  neuron: model('neuron', 'The neuron and the reflex arc.'),

  explode: async (signal) => {
    await open('heart', signal)
    say('Open your hands wide to pull it apart.')
    await explodeTo(1, 2600, signal)
    await wait(600, signal)
    await turnTo(0.7, 2400, signal, 0.1)
    await turnTo(-0.4, 2800, signal, -0.04)
    await turnTo(0, 1400, signal)
    await explodeTo(0, 2000, signal)
    await wait(900, signal)
  },

  hover: async (signal) => {
    await open('heart', signal)
    if (scene().explode < 1) await explodeTo(1, 2200, signal)
    await wait(500, signal)
    say('Point at a part to see its name.')
    await pointAt(['aorta', 'pulmonary_artery', 'right_atrium', 'left_ventricle'], signal)
    await wait(400, signal)
  },

  select: async (signal) => {
    await open('heart', signal)
    if (scene().explode < 1) await explodeTo(1, 2200, signal)
    say('Pinch a part. The tutor explains it from the NCERT notes.')
    highlight('left_ventricle')
    await wait(900, signal)
    focusPart('left_ventricle')
    highlight(null)
    await wait(7000, signal)
    focusPart(null)
    await wait(1600, signal)
    await explodeTo(0, 2000, signal)
  },

  progress: async (signal) => {
    useNavStore.getState().go('progress')
    say('Quiz answers show up here, with the parts you should revisit.')
    await wait(6000, signal)
  },
}

const TOUR = ['home', 'library', 'heart', 'explode', 'hover', 'select', 'cell', 'flower', 'dna', 'sarcomere', 'neuron', 'progress']

function reset() {
  const s = scene()
  s.setExplode(0)
  s.setSelected(null)
  s.setHovered(null)
  s.setRotation(0, 0)
  useDemo.setState({ running: false, caption: null })
}

interface DemoOptions {
  /** Show the caption bar. Off for video takes that add their own captions. */
  captions?: boolean
}

/**
 * Plays the scripted tour used for the demo video, or one chapter of it by
 * name. Esc stops it.
 */
export function startDemo(chapter?: string, options: DemoOptions = {}): void {
  if (controller) return
  const ctrl = new AbortController()
  controller = ctrl
  captions = options.captions ?? true
  const one = chapter ? chapters[chapter] : undefined
  const list = one ? [one] : TOUR.map((name) => chapters[name]!)
  useDemo.setState({ running: true, caption: null })
  ;(async () => {
    for (const play of list) {
      if (ctrl.signal.aborted) return
      await play(ctrl.signal)
    }
    if (!one && !ctrl.signal.aborted) useNavStore.getState().go('home')
  })()
    .catch((e) => console.error('[demo]', e))
    .finally(() => {
      if (controller === ctrl) controller = null
      reset()
    })
}

export function stopDemo(): void {
  controller?.abort()
}
