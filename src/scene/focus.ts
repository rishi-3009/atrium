import type { Vector3 } from 'three'
import type { Vec3Tuple } from './CameraRig'

/**
 * World position of the selected part. The model writes it every frame
 * and the camera reads it. A plain object, so no re-renders.
 */
export const focus: { point: Vec3Tuple | null } = { point: null }

/** Where the pointer last touched each part, in that part's own space. Labels pin here. */
export const anchors = new Map<string, Vector3>()
