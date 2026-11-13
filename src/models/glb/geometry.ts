import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector3,
  type Curve,
} from 'three'
import { fbm3 } from './noise'

export interface SurfaceOptions {
  /** True when u wraps all the way round (spheres, tubes). Joins the seam normals. */
  closedU?: boolean
  /** Reverse triangle winding. */
  flip?: boolean
}

/**
 * Builds a mesh from a function f(u, v) with u and v in 0-1.
 * Natural winding has cross(df/du, df/dv) pointing out of the surface.
 */
export function parametricSurface(
  fn: (u: number, v: number, out: Vector3) => void,
  nu: number,
  nv: number,
  { closedU = false, flip = false }: SurfaceOptions = {},
): BufferGeometry {
  const cols = nu + 1
  const rows = nv + 1
  const pos = new Float32Array(cols * rows * 3)
  const uv = new Float32Array(cols * rows * 2)
  const p = new Vector3()
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = i / nu
      const v = j / nv
      fn(u, v, p)
      const k = j * cols + i
      pos.set([p.x, p.y, p.z], k * 3)
      uv.set([u, v], k * 2)
    }
  }
  const index: number[] = []
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * cols + i
      const b = a + 1
      const c = a + cols
      const d = c + 1
      if (flip) index.push(a, c, b, b, c, d)
      else index.push(a, b, c, b, d, c)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()

  if (closedU) {
    const n = g.getAttribute('normal')
    const t = new Vector3()
    for (let j = 0; j < rows; j++) {
      const a = j * cols
      const b = a + nu
      t.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize()
      n.setXYZ(a, t.x, t.y, t.z)
      n.setXYZ(b, t.x, t.y, t.z)
    }
    n.needsUpdate = true
  }
  return g
}

/** Spherical surface where a pole collapses to one point; averages pole normals. */
export function fixPoles(g: BufferGeometry, nu: number, nv: number): void {
  const n = g.getAttribute('normal')
  const cols = nu + 1
  for (const row of [0, nv]) {
    const t = new Vector3()
    for (let i = 0; i < cols; i++) t.add(new Vector3(n.getX(row * cols + i), n.getY(row * cols + i), n.getZ(row * cols + i)))
    t.normalize()
    for (let i = 0; i < cols; i++) n.setXYZ(row * cols + i, t.x, t.y, t.z)
  }
  n.needsUpdate = true
}

export interface TubeOptions {
  tubular?: number
  radial?: number
  /** Radius along the tube, t from 0 to 1. */
  radius: (t: number) => number
  /** Wobble of the wall, in the same units as the radius. */
  roughness?: number
  seed?: number
  /** Round off both ends over this share of the length (0 = leave open). */
  rounded?: number
}

/** A tube along a curve whose radius changes along its length. */
export function taperedTube(curve: Curve<Vector3>, o: TubeOptions): BufferGeometry {
  const tubular = o.tubular ?? 64
  const radial = o.radial ?? 20
  const frames = curve.computeFrenetFrames(tubular, false)
  const P = new Vector3()
  const geo = parametricSurface(
    (u, v, out) => {
      const idx = Math.min(tubular, Math.round(v * tubular))
      curve.getPointAt(v, P)
      const N = frames.normals[idx]!
      const B = frames.binormals[idx]!
      const th = u * Math.PI * 2
      let r = o.radius(v)
      const e = o.rounded ?? 0
      if (e > 0) {
        const edge = Math.min(v, 1 - v)
        if (edge < e) r *= Math.sqrt(Math.max(0, 1 - (1 - edge / e) ** 2))
      }
      if (o.roughness) {
        r += fbm3(P.x * 5 + (o.seed ?? 0), P.y * 5, P.z * 5 + th) * o.roughness
      }
      out.set(
        P.x + r * (Math.cos(th) * N.x + Math.sin(th) * B.x),
        P.y + r * (Math.cos(th) * N.y + Math.sin(th) * B.y),
        P.z + r * (Math.cos(th) * N.z + Math.sin(th) * B.z),
      )
    },
    radial,
    tubular,
    { closedU: true },
  )
  return geo
}

export interface BodySpec {
  c: [number, number, number]
  r: [number, number, number]
  rotZ: number
  /** 0 = round, 1 = comes to a point at the bottom. */
  taper: number
}

/** Point on a tapered, tilted ellipsoid. lon 0-2PI, lat -PI/2 to PI/2. */
export function bodyPoint(s: BodySpec, lon: number, lat: number, out = new Vector3()): Vector3 {
  const cl = Math.cos(lat)
  let x = cl * Math.cos(lon)
  const y = Math.sin(lat)
  let z = cl * Math.sin(lon)
  const k = 1 - s.taper * Math.pow((1 - y) / 2, 1.6)
  x *= k * s.r[0]
  z *= k * s.r[2]
  const yy = y * s.r[1]
  const c = Math.cos(s.rotZ)
  const sn = Math.sin(s.rotZ)
  return out.set(x * c - yy * sn + s.c[0], x * sn + yy * c + s.c[1], z + s.c[2])
}

export interface BodyOptions {
  nu?: number
  nv?: number
  /** Surface bumpiness in world units. */
  amp?: number
  freq?: number
  seed?: number
}

/** Closed, slightly irregular tapered ellipsoid. Normals point outward. */
export function bodyGeometry(s: BodySpec, { nu = 72, nv = 56, amp = 0.03, freq = 2.2, seed = 0 }: BodyOptions = {}): BufferGeometry {
  const centre = new Vector3(...s.c)
  const dir = new Vector3()
  const geo = parametricSurface(
    (u, v, out) => {
      bodyPoint(s, u * Math.PI * 2, (v - 0.5) * Math.PI, out)
      dir.copy(out).sub(centre).normalize()
      const d = fbm3(out.x * freq + seed, out.y * freq, out.z * freq) * amp
      out.addScaledVector(dir, d)
    },
    nu,
    nv,
    { closedU: true, flip: true },
  )
  fixPoles(geo, nu, nv)
  return geo
}

/** A bag of small spheres drawn as one mesh. Ignores the pointer unless `pickable`. */
export function dots(
  points: Vector3[],
  radius: number,
  material: Material,
  detail = 8,
  pickable = false,
): InstancedMesh {
  const mesh = new InstancedMesh(new SphereGeometry(1, detail, Math.max(4, detail - 2)), material, points.length)
  const m = new Matrix4()
  const q = new Quaternion()
  const s = new Vector3()
  points.forEach((p, i) => {
    const k = radius
    m.compose(p, q, s.set(k, k, k))
    mesh.setMatrixAt(i, m)
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  if (!pickable) mesh.raycast = () => {}
  return mesh
}

const ray = new Raycaster()

/**
 * Moves each point onto the nearest outside surface of `targets`, looking
 * toward `inside`. Points that miss are kept as they are. Needs world
 * matrices, so call it after the targets are placed.
 */
export function snapToSurface(points: Vector3[], targets: Object3D[], inside: Vector3, lift = 0.02): Vector3[] {
  targets.forEach((t) => t.updateWorldMatrix(true, true))
  return points.map((p) => {
    const away = p.clone().sub(inside)
    if (away.lengthSq() < 1e-6) return p.clone()
    away.normalize()
    const from = p.clone().addScaledVector(away, 2.5)
    ray.set(from, away.clone().negate())
    ray.far = 6
    const hit = ray.intersectObjects(targets, true)[0]
    if (!hit) return p.clone()
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : away
    return hit.point.clone().addScaledVector(n, lift)
  })
}

/** Names a node and returns it, for building parts in one expression. */
export function named<T extends Object3D>(node: T, name: string): T {
  node.name = name
  return node
}

export function meshOf(geometry: BufferGeometry, material: Material, name?: string): Mesh {
  const m = new Mesh(geometry, material)
  if (name) m.name = name
  return m
}
