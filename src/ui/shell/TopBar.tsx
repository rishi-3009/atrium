import { motion } from 'framer-motion'
import { useNavStore, type View } from '../nav'
import { color, font, radius, spring, z } from '../tokens'

const items: { view: View; label: string }[] = [
  { view: 'home', label: 'Home' },
  { view: 'library', label: 'Library' },
  { view: 'progress', label: 'Progress' },
]

export const TOP_BAR_HEIGHT = 64

export function TopBar() {
  const view = useNavStore((s) => s.view)
  const go = useNavStore((s) => s.go)
  // the stage is opened from the library, so keep that tab lit
  const active: View = view === 'stage' ? 'library' : view

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: TOP_BAR_HEIGHT,
        zIndex: z.panel,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        background: `linear-gradient(${color.bg.base}, transparent)`,
      }}
    >
      <button
        onClick={() => go('home')}
        style={{
          background: 'none',
          border: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: color.text.primary,
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: '-0.02em',
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: color.accent.base,
            boxShadow: `0 0 16px ${color.accent.glow}`,
          }}
        />
        Atrium
      </button>

      <nav style={{ display: 'flex', gap: 4 }}>
        {items.map((it) => {
          const on = it.view === active
          return (
            <button
              key={it.view}
              onClick={() => go(it.view)}
              style={{
                position: 'relative',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                padding: '0.5rem 1.1rem',
                borderRadius: radius.pill,
                fontFamily: font.display,
                fontSize: 14,
                fontWeight: 500,
                color: on ? color.text.primary : color.text.secondary,
              }}
            >
              {on && (
                <motion.span
                  layoutId="nav-pill"
                  transition={spring.snappy}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: radius.pill,
                    background: color.accent.wash,
                    border: `1px solid ${color.accent.deep}`,
                  }}
                />
              )}
              <span style={{ position: 'relative' }}>{it.label}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
