import { cell } from './cell'
import { dna } from './dna'
import { flower } from './flower'
import { heart } from './heart'
import { neuron } from './neuron'
import { sarcomere } from './sarcomere'
import type { ModelContent } from './types'

export type { Mcq, ModelContent } from './types'
export { cell, dna, flower, heart, neuron, sarcomere }

/** Content for every model. Order here is the order in the library. */
export const content: Record<string, ModelContent> = {
  heart,
  cell,
  flower,
  dna,
  sarcomere,
  neuron,
}
