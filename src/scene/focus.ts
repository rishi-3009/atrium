import type { Vec3Tuple } from './CameraRig'

/**
 * World position of the selected part. The model writes it every frame
 * and the camera reads it. A plain object, so no re-renders.
 */
export const focus: { point: Vec3Tuple | null } = { point: null }
