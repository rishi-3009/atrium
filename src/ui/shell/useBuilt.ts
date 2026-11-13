import { useEffect, useState } from 'react'
import type { Group } from 'three'
import type { GlbModel } from '../../models/glb'

interface Built {
  model: GlbModel
  object: Group
}

/**
 * Builds a model after the first paint, so the page and its loader show up
 * before the (few hundred ms) geometry work starts. Returns null until ready.
 */
export function useBuilt(model: GlbModel): Group | null {
  const [built, setBuilt] = useState<Built | null>(null)

  useEffect(() => {
    let outer = 0
    const inner = requestAnimationFrame(() => {
      outer = requestAnimationFrame(() => setBuilt({ model, object: model.build() }))
    })
    return () => {
      cancelAnimationFrame(inner)
      cancelAnimationFrame(outer)
    }
  }, [model])

  return built && built.model === model ? built.object : null
}
