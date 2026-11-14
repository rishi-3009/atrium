import { create } from 'zustand'
import { content, type Mcq } from '../content'
import { useSceneStore } from '../shared/stores'
import type { TaskDef } from '../shared/types'
import { useLearnerMemory, type AnswerResult } from './memory'

/**
 * teach: the tutor explains the part.
 * task: the student does the hands-on task; the engine watches the scene.
 * mcq: the task is verified and a question is asked.
 * done: every task is finished.
 */
export type Phase = 'idle' | 'teach' | 'task' | 'mcq' | 'done'

/** How far a hand has to go before a task counts as done. */
export const THRESHOLD = { pull: 0.5, explode: 0.6, rotate: 0.9 } as const

interface SceneSnapshot {
  selectedPart: string | null
  explode: number
  pull: { partId: string; amount: number } | null
  rotation: { x: number; y: number }
}

/** Has the student done what the task asked? Pure, so it can be tested without a scene. */
export function verifyTask(
  task: TaskDef,
  now: SceneSnapshot,
  start: { x: number; y: number },
): boolean {
  switch (task.kind) {
    case 'select':
      return now.selectedPart === task.partId
    case 'pull':
      return now.pull?.partId === task.partId && now.pull.amount >= THRESHOLD.pull
    case 'explode':
      return now.explode >= THRESHOLD.explode
    case 'rotate':
      return Math.hypot(now.rotation.x - start.x, now.rotation.y - start.y) >= THRESHOLD.rotate
  }
}

/** The question for a part, or the first one for the model if that part has none. */
export function questionFor(modelId: string, partId: string): Mcq | undefined {
  const mcqs = content[modelId]?.mcqs ?? []
  return mcqs.find((m) => m.partId === partId) ?? mcqs[0]
}

interface Engine {
  modelId: string | null
  tasks: TaskDef[]
  index: number
  phase: Phase
  /** Rotation when the task began, so "turn it" measures from there. */
  startRotation: { x: number; y: number }
  /** Hints used on the current question. A hinted answer scores lower. */
  hinted: boolean
  /** Explanations already given in this session, sent back as `history`. */
  history: string[]
  start: (modelId: string) => void
  /** Teach -> task. Call when the student is ready to try. */
  begin: () => void
  /** Called by the verifier. Also usable by a "skip" button. */
  complete: () => void
  useHint: () => void
  /** Ends the question: updates memory and moves to the next task. */
  answer: (correct: boolean) => void
  remember: (explanation: string) => void
  reset: () => void
}

const HISTORY_KEEP = 4

export const useTutorEngine = create<Engine>((set, get) => ({
  modelId: null,
  tasks: [],
  index: 0,
  phase: 'idle',
  startRotation: { x: 0, y: 0 },
  hinted: false,
  history: [],
  start: (modelId) => {
    const tasks = content[modelId]?.definition.tasks ?? []
    set({
      modelId,
      tasks,
      index: 0,
      phase: tasks.length ? 'teach' : 'idle',
      hinted: false,
      history: [],
    })
  },
  begin: () => {
    if (get().phase !== 'teach') return
    set({ phase: 'task', startRotation: { ...useSceneStore.getState().rotation } })
  },
  complete: () => {
    if (get().phase === 'task') set({ phase: 'mcq', hinted: false })
  },
  useHint: () => set({ hinted: true }),
  answer: (correct) => {
    const { modelId, tasks, index, hinted } = get()
    const task = tasks[index]
    if (!modelId || !task) return
    const result: AnswerResult = !correct ? 'wrong' : hinted ? 'hinted' : 'correct'
    useLearnerMemory.getState().record(modelId, task.partId, result)
    const next = index + 1
    set({ index: next, phase: next < tasks.length ? 'teach' : 'done', hinted: false })
  },
  remember: (explanation) =>
    set((s) => ({ history: [...s.history, explanation].slice(-HISTORY_KEEP) })),
  reset: () =>
    set({ modelId: null, tasks: [], index: 0, phase: 'idle', hinted: false, history: [] }),
}))

/**
 * Watches the scene while a task is active and completes it when the student
 * does it, by hand or by mouse. Returns the function that stops watching.
 */
export function watchTasks(): () => void {
  const check = () => {
    const e = useTutorEngine.getState()
    if (e.phase !== 'task') return
    const task = e.tasks[e.index]
    if (task && verifyTask(task, useSceneStore.getState(), e.startRotation)) e.complete()
  }
  const offScene = useSceneStore.subscribe(check)
  const offEngine = useTutorEngine.subscribe((s, p) => {
    if (s.phase === 'task' && p.phase !== 'task') check()
  })
  return () => {
    offScene()
    offEngine()
  }
}

/** The current task, or undefined between tasks. */
export const currentTask = (e: Pick<Engine, 'tasks' | 'index'>): TaskDef | undefined =>
  e.tasks[e.index]
