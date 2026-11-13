import { cell } from './cell'
import { flower } from './flower'
import { heart } from './heart'
import type { ModelContent } from './types'

export type { Mcq, ModelContent } from './types'
export { cell, flower, heart }

/** Content for the heart, cell and flower. */
export const content: Record<string, ModelContent> = { heart, cell, flower }
