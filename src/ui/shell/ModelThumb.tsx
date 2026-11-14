import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { glbModels } from '../../models/glb'
import { color, radius, spring } from '../tokens'
import { thumbnail } from './thumbnails'

/** The model's picture, drawn on first view and cached. */
export function ModelThumb({ id, width = 220, height = 156 }: { id: string; width?: number | string; height?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const model = glbModels[id]
    if (!model) return
    thumbnail(model)
      .then((u) => live && setSrc(u))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [id])
  return (
    <div
      style={{
        flex: 'none',
        width,
        height,
        borderRadius: radius.md,
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 45%, ${color.accent.wash}, transparent 72%), ${color.bg.raised}`,
        border: `1px solid ${color.line.subtle}`,
      }}
    >
      {src && (
        <motion.img
          src={src}
          alt=""
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring.smooth}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      )}
    </div>
  )
}
