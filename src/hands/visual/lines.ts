import {
  AdditiveBlending,
  Color,
  type InstancedInterleavedBuffer,
  type InterleavedBufferAttribute,
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'

/**
 * Fat line segments whose buffers are written in place every frame.
 * `setPositions` on the stock geometry allocates a new GPU buffer each call,
 * so we create the buffers once and poke their arrays.
 */
export class FastSegments {
  readonly object: LineSegments2
  readonly material: LineMaterial
  readonly positions: Float32Array
  readonly colors: Float32Array | null
  readonly distances: Float32Array | null
  private posBuf: InstancedInterleavedBuffer
  private colBuf: InstancedInterleavedBuffer | null = null
  private distBuf: InstancedInterleavedBuffer | null = null

  constructor(
    public readonly count: number,
    opts: {
      width: number
      color: string
      opacity: number
      vertexColors?: boolean
      dashed?: boolean
    },
  ) {
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(new Float32Array(count * 6))
    this.material = new LineMaterial({
      color: new Color(opts.color).getHex(),
      linewidth: opts.width,
      transparent: true,
      opacity: opts.opacity,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      vertexColors: opts.vertexColors ?? false,
      dashed: opts.dashed ?? false,
      dashSize: 0.16,
      gapSize: 0.1,
    })
    this.object = new LineSegments2(geometry, this.material)
    this.object.frustumCulled = false

    this.posBuf = (geometry.getAttribute('instanceStart') as InterleavedBufferAttribute)
      .data as InstancedInterleavedBuffer
    this.positions = this.posBuf.array as Float32Array
    this.colors = null
    this.distances = null
    if (opts.vertexColors) {
      geometry.setColors(new Float32Array(count * 6))
      this.colBuf = (geometry.getAttribute('instanceColorStart') as InterleavedBufferAttribute)
        .data as InstancedInterleavedBuffer
      this.colors = this.colBuf.array as Float32Array
    }
    if (opts.dashed) {
      this.object.computeLineDistances()
      this.distBuf = (geometry.getAttribute('instanceDistanceStart') as InterleavedBufferAttribute)
        .data as InstancedInterleavedBuffer
      this.distances = this.distBuf.array as Float32Array
    }
  }

  /** Call after writing `positions` (and `colors`, `distances`). */
  commit() {
    this.posBuf.needsUpdate = true
    if (this.colBuf) this.colBuf.needsUpdate = true
    if (this.distBuf) this.distBuf.needsUpdate = true
  }

  setResolution(w: number, h: number) {
    this.material.resolution.set(w, h)
  }

  dispose() {
    this.object.geometry.dispose()
    this.material.dispose()
  }
}
