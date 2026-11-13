import type { ReactNode } from 'react'
import { color, font, radius, type as t } from '../tokens'

interface Props {
  children: ReactNode
  active?: boolean
}

export function Chip({ children, active = false }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: font.display,
        fontSize: t.label.size,
        fontWeight: t.label.weight,
        letterSpacing: t.label.tracking,
        textTransform: 'uppercase',
        padding: '0.35rem 0.75rem',
        borderRadius: radius.pill,
        color: active ? color.accent.soft : color.text.secondary,
        background: active ? color.accent.wash : 'transparent',
        border: `1px solid ${active ? color.accent.deep : color.line.default}`,
      }}
    >
      {children}
    </span>
  )
}
