import { dna } from '../../content/dna'
import { neuron } from '../../content/neuron'
import { sarcomere } from '../../content/sarcomere'
import type { GlbModel } from '../glb'
import { buildDna } from './dna'
import { buildNeuron } from './neuron'
import { buildSarcomere } from './sarcomere'

/** Models built in code that move by themselves: DNA, the sarcomere and the neuron. */
export const proceduralModels: Record<string, GlbModel> = {
  dna: { id: 'dna', build: buildDna, content: dna },
  sarcomere: { id: 'sarcomere', build: buildSarcomere, content: sarcomere },
  neuron: { id: 'neuron', build: buildNeuron, content: neuron },
}
