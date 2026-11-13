import type { Gesture } from '@/shared/types'
import type { HandSignals } from './signals'

const PINCH_ON = 0.78
const PINCH_OFF = 0.5
/** Keep a held pinch alive through brief tracking dropouts. */
const PINCH_GRACE_MS = 180
const PALM_HOLD_MS = 350
const POINT_HOLD_MS = 80

/** Per-hand state machine. Hysteresis on pinch; palm and point need a short hold. */
export class GestureMachine {
  private pinching = false
  private lastPinchSeen = 0
  private palmSince = 0
  private pointSince = 0

  update(s: HandSignals, now: number): Gesture {
    if (this.pinching) {
      if (s.pinch > PINCH_OFF) this.lastPinchSeen = now
      else if (now - this.lastPinchSeen > PINCH_GRACE_MS) this.pinching = false
    } else if (s.pinch > PINCH_ON) {
      this.pinching = true
      this.lastPinchSeen = now
    }

    const [index, middle, ring, pinky] = s.extended
    const open = index && middle && ring && pinky && s.pinch < 0.3
    const pointing = index && !middle && !ring && !pinky && s.pinch < PINCH_OFF

    this.palmSince = open ? this.palmSince || now : 0
    this.pointSince = pointing ? this.pointSince || now : 0

    let next: Gesture = 'none'
    if (this.pinching) next = 'pinch'
    else if (this.palmSince && now - this.palmSince > PALM_HOLD_MS) next = 'palm'
    else if (this.pointSince && now - this.pointSince > POINT_HOLD_MS) next = 'point'

    return next
  }

  /** Called when the hand leaves the frame. A held pinch survives the grace window. */
  lost(now: number): Gesture {
    if (this.pinching && now - this.lastPinchSeen <= PINCH_GRACE_MS) return 'pinch'
    this.reset()
    return 'none'
  }

  reset() {
    this.pinching = false
    this.palmSince = 0
    this.pointSince = 0
  }
}
