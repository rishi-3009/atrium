import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { Vector3, type Group, type Object3D } from 'three'
import { blur, color, font, glow, radius, spring, z } from '../ui/tokens'

interface Props {
  label: string
  /** The part's node; the label follows its world centre. */
  target: Object3D
  /** Which way the label sits, so two labels never overlap. */
  side: 'right' | 'left'
}

const world = new Vector3()

/** Floating name tag with a leader line, pinned to a part. */
export function PartLabel({ label, target, side }: Props) {
  const anchor = useRef<Group>(null)

  useFrame(() => {
    const a = anchor.current
    if (!a?.parent) return
    target.getWorldPosition(world)
    a.position.copy(a.parent.worldToLocal(world))
  })

  const dir = side === 'right' ? 1 : -1
  const lineLen = 56

  return (
    <group ref={anchor}>
      <Html zIndexRange={[z.hud, 0]} style={{ pointerEvents: 'none' }}>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -8 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={spring.smooth}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              flexDirection: side === 'right' ? 'row' : 'row-reverse',
              transform: side === 'right' ? 'translate(0, -50%)' : 'translate(-100%, -50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color.accent.base,
                boxShadow: glow.accent,
                flex: 'none',
              }}
            />
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={spring.smooth}
              style={{
                width: lineLen,
                height: 1,
                background: `linear-gradient(${side === 'right' ? 90 : 270}deg, ${color.accent.base}, ${color.line.strong})`,
                transformOrigin: side === 'right' ? 'left' : 'right',
                flex: 'none',
              }}
            />
            <span
              style={{
                fontFamily: font.display,
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
                color: color.text.primary,
                padding: '0.4rem 0.85rem',
                borderRadius: radius.pill,
                background: color.bg.panel,
                border: `1px solid ${color.line.strong}`,
                backdropFilter: `blur(${blur.glass})`,
                WebkitBackdropFilter: `blur(${blur.glass})`,
              }}
            >
              {label}
            </span>
          </motion.div>
        </AnimatePresence>
      </Html>
    </group>
  )
}
