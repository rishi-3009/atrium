import type { Group } from 'three'
import { cell } from '../../content/cell'
import { flower } from '../../content/flower'
import { heart } from '../../content/heart'
import type { ModelContent } from '../../content/types'
import { buildCell } from './cell'
import { buildFlower } from './flower'
import { buildHeart } from './heart'

export interface GlbModel {
  id: string
  /** Builds a fresh model each call. Parts are named groups matching `content.definition`. */
  build: () => Group
  content: ModelContent
}

/** Heart, cell and flower. Built in code, so there are no model files to ship. */
export const glbModels: Record<string, GlbModel> = {
  heart: { id: 'heart', build: buildHeart, content: heart },
  cell: { id: 'cell', build: buildCell, content: cell },
  flower: { id: 'flower', build: buildFlower, content: flower },
}
