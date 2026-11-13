import { useHandStore, useSceneStore } from '@/shared/stores'
import type { HandState, Handedness } from '@/shared/types'

/**
 * Turns tracked hands into scene actions. Runs its own frame loop and talks
 * to the scene two ways:
 *
 * - Hover and select go through the stage canvas as synthetic pointer
 *   events, so the hand uses exactly the same code path as the mouse.
 * - Rotation, explode, pull and dwell are written straight to the scene store.
 *
 * Gestures: point to hover, hold still on a part to select, pinch on empty
 * space and move to turn (with inertia), pinch a part and move to pull it
 * out (release lets it spring back), pinch with both hands and move them
 * apart to explode, open palm to reset.
 */

const DWELL_S = 0.8
const ROTATE_GAIN_Y = 4.6
const ROTATE_GAIN_X = 3.0
const TILT_LIMIT = 1.0
const FRICTION = 3.5
const SPREAD_GAIN = 2.6
/** Share of the window height that pulls a part all the way out. */
const PULL_REACH = 0.22
const INDEX_TIP = 8

type Mode = 'idle' | 'rotate' | 'pull' | 'spread'

interface Pt {
  x: number
  y: number
}

/** The stage canvas: the one that still takes pointer events. The hand overlay does not. */
function stageCanvas(): HTMLCanvasElement | null {
  for (const c of Array.from(document.querySelectorAll('canvas'))) {
    if (getComputedStyle(c).pointerEvents !== 'none') return c
  }
  return null
}

function send(canvas: HTMLCanvasElement, type: string, p: Pt, down: boolean) {
  const init: PointerEventInit = {
    clientX: p.x,
    clientY: p.y,
    bubbles: true,
    cancelable: true,
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: down ? 1 : 0,
  }
  canvas.dispatchEvent(
    type === 'click' ? new MouseEvent('click', init) : new PointerEvent(type, init),
  )
}

function primary(hands: Partial<Record<Handedness, HandState>>): HandState | undefined {
  return hands.right ?? hands.left
}

/** Normalised camera point to window pixels, the same mapping the mouse hand uses. */
const toClient = (p: Pt): Pt => ({ x: p.x * window.innerWidth, y: p.y * window.innerHeight })

/** Distance in a square space so x and y spread count equally. */
function gap(a: Pt, b: Pt) {
  const aspect = window.innerWidth / window.innerHeight
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y)
}

export function startHandInteraction(): () => void {
  let raf = 0
  let last = performance.now()
  let mode: Mode = 'idle'
  let active = false

  let pointer: Pt | null = null
  let dwellPart: string | null = null
  let dwellT = 0
  let dwellDone: string | null = null

  let grabStart: Pt = { x: 0, y: 0 }
  let rot = { x: 0, y: 0 }
  let vel = { x: 0, y: 0 }
  let lastPinch: Pt | null = null
  let pullPart = ''

  let spreadBase = 0
  let spreadD0 = 0
  let palmSeen = false

  const scene = () => useSceneStore.getState()

  const leave = (canvas: HTMLCanvasElement | null) => {
    if (canvas && pointer) send(canvas, 'pointermove', { x: -9999, y: -9999 }, false)
    pointer = null
    dwellPart = null
    dwellT = 0
    if (scene().dwell !== 0) scene().setDwell(0)
    document.body.style.cursor = ''
  }

  const endMode = () => {
    if (mode === 'pull') scene().setPull(null)
    mode = 'idle'
    lastPinch = null
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 1 / 20)
    last = now

    const hs = useHandStore.getState()
    const canvas = stageCanvas()
    if (hs.source !== 'camera' || !canvas) {
      if (active) {
        leave(canvas)
        endMode()
        active = false
      }
      return
    }
    active = true

    const hand = primary(hs.hands)
    const { left, right } = hs.hands
    const s = scene()

    // inertia after a turn
    if (mode !== 'rotate' && (Math.abs(vel.x) > 1e-3 || Math.abs(vel.y) > 1e-3)) {
      const k = Math.exp(-FRICTION * dt)
      vel = { x: vel.x * k, y: vel.y * k }
      rot = { x: clampTilt(rot.x + vel.x * dt), y: rot.y + vel.y * dt }
      s.setRotation(rot.x, rot.y)
    }

    if (!hand) {
      leave(canvas)
      endMode()
      return
    }

    // open palm: put everything back
    const palm = left?.gesture === 'palm' || right?.gesture === 'palm'
    if (palm && !palmSeen) {
      palmSeen = true
      endMode()
      s.setExplode(0)
      s.setSelected(null)
      s.setPull(null)
      rot = { x: 0, y: 0 }
      vel = { x: 0, y: 0 }
      s.setRotation(0, 0)
    } else if (!palm) palmSeen = false

    // two hands pinched: spread drives explode
    const spreading = left?.gesture === 'spread' && right?.gesture === 'spread'
    if (spreading && left && right) {
      const d = gap(left.pinchPoint, right.pinchPoint)
      if (mode !== 'spread') {
        endMode()
        mode = 'spread'
        spreadBase = s.explode
        spreadD0 = d
      }
      s.setExplode(spreadBase + (d - spreadD0) * SPREAD_GAIN)
      leave(canvas)
      return
    }
    if (mode === 'spread') endMode()

    // where the hand points: the index tip when pointing, the pinch point otherwise
    const aim =
      hand.gesture === 'point' ? (hand.landmarks[INDEX_TIP] ?? hand.pinchPoint) : hand.pinchPoint
    const client = toClient(aim)
    const pinching = hand.gesture === 'pinch'

    // hover runs through the stage's own pointer handlers
    if (!pointer || pointer.x !== client.x || pointer.y !== client.y) {
      send(canvas, 'pointermove', client, pinching)
      pointer = client
    }

    if (pinching) {
      if (mode === 'idle') {
        grabStart = { ...hand.pinchPoint }
        lastPinch = grabStart
        const part = s.hoveredPart
        if (part) {
          mode = 'pull'
          pullPart = part
          s.setSelected(part)
          s.setPull({ partId: part, amount: 0 })
        } else {
          mode = 'rotate'
          rot = { ...s.rotation }
          vel = { x: 0, y: 0 }
        }
        dwellT = 0
        s.setDwell(0)
      }
      if (mode === 'pull') {
        const reach = gap(hand.pinchPoint, grabStart) / PULL_REACH
        s.setPull({ partId: pullPart, amount: reach })
      } else if (mode === 'rotate' && lastPinch) {
        const dx = hand.pinchPoint.x - lastPinch.x
        const dy = hand.pinchPoint.y - lastPinch.y
        rot = { x: clampTilt(rot.x + dy * ROTATE_GAIN_X), y: rot.y + dx * ROTATE_GAIN_Y }
        if (dt > 0) {
          const k = 0.35
          vel = {
            x: vel.x + ((dy * ROTATE_GAIN_X) / dt - vel.x) * k,
            y: vel.y + ((dx * ROTATE_GAIN_Y) / dt - vel.y) * k,
          }
        }
        s.setRotation(rot.x, rot.y)
        lastPinch = { ...hand.pinchPoint }
      }
      return
    }
    if (mode === 'pull' || mode === 'rotate') endMode()

    // dwell to select: hold a point on the same part
    const target = hand.gesture === 'point' ? s.hoveredPart : null
    if (target && target !== s.selectedPart && target !== dwellDone) {
      if (target !== dwellPart) {
        dwellPart = target
        dwellT = 0
      }
      dwellT += dt
      const d = Math.min(1, dwellT / DWELL_S)
      s.setDwell(d)
      if (d >= 1) {
        send(canvas, 'pointerdown', client, true)
        send(canvas, 'pointerup', client, false)
        send(canvas, 'click', client, false)
        dwellDone = target
        dwellPart = null
        dwellT = 0
        s.setDwell(0)
      }
    } else {
      if (target !== dwellDone) dwellDone = null
      dwellPart = null
      dwellT = 0
      if (s.dwell !== 0) s.setDwell(0)
    }
  }

  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    if (active) {
      leave(stageCanvas())
      endMode()
    }
  }
}

const clampTilt = (v: number) => Math.min(TILT_LIMIT, Math.max(-TILT_LIMIT, v))
