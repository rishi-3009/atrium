import { useCameraStore } from './cameraStore'

/** Ask for the webcam. Sets status; returns the stream or null. Video never leaves the device. */
export async function openCamera(): Promise<MediaStream | null> {
  const { set } = useCameraStore.getState()
  if (!navigator.mediaDevices?.getUserMedia) {
    set({ status: 'unavailable' })
    return null
  }
  set({ status: 'requesting' })
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    })
    set({ stream })
    return stream
  } catch (e) {
    const name = (e as DOMException).name
    set({
      status: name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable',
    })
    return null
  }
}

export function closeCamera() {
  const { stream, set } = useCameraStore.getState()
  stream?.getTracks().forEach((t) => t.stop())
  set({ stream: null, status: 'idle', fps: 0 })
}
