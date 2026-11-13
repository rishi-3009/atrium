import { useSceneStore } from '../shared/stores'

/** Highlights a part (rim glow and label). Pass null to clear. */
export function highlight(partId: string | null): void {
  useSceneStore.getState().setHovered(partId)
}

/** Focuses a part: camera close-up, the rest dimmed. Pass null to clear. */
export function focusPart(partId: string | null): void {
  useSceneStore.getState().setSelected(partId)
}
