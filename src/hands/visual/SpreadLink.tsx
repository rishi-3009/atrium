import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { color } from '@/ui/tokens'
import { FastSegments } from './lines'
import { live } from './live'

/** A flowing dashed line between the two pinch points while both hands spread. */
export function SpreadLink() {
  const root = useRef<Group>(null)
  const segRef = useRef<FastSegments | null>(null)
  const alpha = useRef(0)

  useEffect(() => {
    const seg = new FastSegments(1, {
      width: 2,
      color: color.accent.soft,
      opacity: 0,
      dashed: true,
    })
    const g = root.current
    segRef.current = seg
    g?.add(seg.object)
    return () => {
      g?.remove(seg.object)
      seg.dispose()
      segRef.current = null
    }
  }, [])

  useFrame(({ size }, delta) => {
    const seg = segRef.current
    if (!seg) return
    const dt = Math.min(delta, 1 / 20)
    const l = live.left
    const r = live.right
    const on = l.spread && r.spread && l.opacity > 0.5 && r.opacity > 0.5
    alpha.current = MathUtils.damp(alpha.current, on ? 1 : 0, 10, dt)
    seg.object.visible = alpha.current > 0.01
    if (!seg.object.visible) return

    seg.setResolution(size.width, size.height)
    const p = seg.positions
    p[0] = l.x
    p[1] = l.y
    p[2] = l.z
    p[3] = r.x
    p[4] = r.y
    p[5] = r.z
    const d = seg.distances!
    d[0] = 0
    d[1] = Math.hypot(r.x - l.x, r.y - l.y, r.z - l.z)
    seg.material.opacity = 0.7 * alpha.current
    seg.material.dashOffset -= dt * 0.5
    seg.commit()
  })

  return <group ref={root} />
}
