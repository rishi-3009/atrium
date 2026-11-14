import type { Lang } from '../shared/types'

/** The reply of `POST /api/identify`. `modelId` is null when we have no 3D model for the diagram. */
export interface IdentifyResult {
  modelId: string | null
  title: string
  /** Only set when modelId is null. A short reading of the labels in the photo. */
  explanation: string
}

export type IdentifyOutcome =
  { ok: true; result: IdentifyResult } | { ok: false; reason: 'busy' | 'offline' | 'unreadable' }

/** Longest side sent to the server. Keeps the body well under the 4.5 MB limit. */
const MAX_SIDE = 1024

/** Shrinks a photo to a JPEG and returns it as base64 without the data: prefix. */
export async function shrinkPhoto(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const url = canvas.toDataURL('image/jpeg', 0.82)
  return url.slice(url.indexOf(',') + 1)
}

/** Sends a photo of a textbook diagram. The photo goes to the server once and is not stored. */
export async function identifyDiagram(
  photo: Blob,
  lang: Lang,
  signal?: AbortSignal,
): Promise<IdentifyOutcome> {
  let image: string
  try {
    image = await shrinkPhoto(photo)
  } catch {
    return { ok: false, reason: 'unreadable' }
  }
  try {
    const res = await fetch('/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mime: 'image/jpeg', lang }),
      signal,
    })
    if (res.status === 429 || res.status === 502) return { ok: false, reason: 'busy' }
    if (!res.ok) return { ok: false, reason: 'offline' }
    return { ok: true, result: (await res.json()) as IdentifyResult }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}
