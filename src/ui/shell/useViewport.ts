import { useEffect, useState } from 'react'

export interface Viewport {
  width: number
  height: number
  /** Laptop widths, 1366 px and below 1440. Panels get tighter. */
  compact: boolean
}

/** Current window size, updated on resize. */
export function useViewport(): Viewport {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return { ...size, compact: size.width < 1440 }
}
