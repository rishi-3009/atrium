import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { highlight } from '../../scene'
import type { TaskDef } from '../../shared/types'
import { useSceneStore } from '../../shared/stores'
import { Button } from '../components/Button'
import { blur, color, font, glow, radius, spring } from '../tokens'

const kindLabel: Record<TaskDef['kind'], string> = {
  select: 'Find',
  pull: 'Pull out',
  rotate: 'Turn',
  explode: 'Pull apart',
}

/** Bottom bar: the current task, hint and the mouse explode control. */
export function TaskBar({ tasks, partLabel, compact = false }: { tasks: TaskDef[]; partLabel: (id: string) => string; compact?: boolean }) {
  const [i, setI] = useState(0)
  const explode = useSceneStore((s) => s.explode)
  const setExplode = useSceneStore((s) => s.setExplode)
  const task = tasks[i]
  if (!task) return null

  const hint = () => {
    highlight(task.partId)
    window.setTimeout(() => highlight(null), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
      style={{
        position: 'absolute',
        left: compact ? 16 : 28,
        right: 0,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: compact ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto',
        gap: compact ? 12 : 28,
        alignItems: 'center',
        padding: compact ? '12px 16px' : '14px 20px',
        borderRadius: radius.xl,
        background: color.bg.panel,
        border: `1px solid ${color.line.default}`,
        backdropFilter: `blur(${blur.glass})`,
        WebkitBackdropFilter: `blur(${blur.glass})`,
        boxShadow: glow.lift,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 5, flex: 'none' }}>
          {tasks.map((t, k) => (
            <motion.span
              key={t.id}
              animate={{ width: k === i ? 22 : 7, background: k === i ? color.accent.base : color.line.strong }}
              transition={spring.snappy}
              style={{ height: 7, borderRadius: radius.pill }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ minWidth: 0 }}
          >
            <div style={{ fontFamily: font.display, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: color.accent.soft }}>
              Task {i + 1} of {tasks.length} · {kindLabel[task.kind]} {partLabel(task.partId).toLowerCase()}
            </div>
            <div style={{ fontSize: 15, color: color.text.primary, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.prompt}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: font.display, fontSize: 12, color: color.text.secondary }}>
          Explode
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
            style={{ width: compact ? 90 : 120, accentColor: color.accent.base }}
          />
        </label>
        <Button variant="ghost" onClick={hint} style={{ padding: '0.45rem 1rem', fontSize: 13 }}>
          Show me
        </Button>
        <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)} style={{ padding: '0.45rem 0.9rem', fontSize: 13, opacity: i === 0 ? 0.4 : 1 }}>
          Back
        </Button>
        <Button onClick={() => setI((i + 1) % tasks.length)} style={{ padding: '0.45rem 1.1rem', fontSize: 13 }}>
          {i === tasks.length - 1 ? 'Restart' : 'Next task'}
        </Button>
      </div>
    </motion.div>
  )
}
