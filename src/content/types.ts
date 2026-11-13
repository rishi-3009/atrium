import type { ModelDefinition } from '../shared/types'

/** A NEET-style question. Written for Atrium, not copied from any paper. */
export interface Mcq {
  id: string
  partId: string
  question: string
  options: [string, string, string, string]
  /** Index of the right option, 0 to 3. */
  answer: 0 | 1 | 2 | 3
  /** One or two sentences shown after the student answers. */
  explanation: string
}

/** Everything the tutor needs about one model. Facts come only from `notes`. */
export interface ModelContent {
  definition: ModelDefinition
  /** Short NCERT-based notes, keyed by `PartDef.noteKey`. */
  notes: Record<string, string>
  /** Notes about the whole model, used for the intro. */
  overview: string
  mcqs: Mcq[]
}
