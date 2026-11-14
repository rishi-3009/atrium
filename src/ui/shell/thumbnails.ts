import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Mesh,
  MathUtils,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { GlbModel } from '../../models/glb'
import { color } from '../tokens'

const W = 480
const H = 340
const FOV = 32

let renderer: WebGLRenderer | null = null
let env: Scene['environment'] = null

function setup() {
  if (renderer) return renderer
  renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(W, H, false)
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setClearColor(0x000000, 0)
  const pmrem = new PMREMGenerator(renderer)
  env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  return renderer
}

function dispose(root: Object3D) {
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    o.geometry.dispose()
    const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material]
    mats.forEach((m) => m.dispose())
  })
}

function render(model: GlbModel): string {
  const gl = setup()
  const object = model.build()
  const scene = new Scene()
  scene.environment = env
  scene.add(object)

  const key = new DirectionalLight('#ffe8e8', 1.4)
  key.position.set(-3, 4, 5)
  const rim = new DirectionalLight(color.accent.base, 2.2)
  rim.position.set(3, 2, -5)
  scene.add(key, rim)

  const box = new Box3().setFromObject(object)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const aspect = W / H
  const t = Math.tan(MathUtils.degToRad(FOV / 2))
  const dist = Math.max(size.y / 2 / t, size.x / 2 / (t * aspect)) * 1.18 + size.z / 2

  const cam = new PerspectiveCamera(FOV, aspect, 0.1, 100)
  cam.position.copy(center).add(new Vector3(0.28, 0.2, 1).normalize().multiplyScalar(dist))
  cam.lookAt(center)

  gl.render(scene, cam)
  const url = gl.domElement.toDataURL('image/png')
  dispose(object)
  return url
}

const cache = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

/**
 * A small picture of a model, drawn once with a shared off-screen renderer
 * and cached. Pictures are made one at a time so the page stays smooth.
 */
export function thumbnail(model: GlbModel): Promise<string> {
  let p = cache.get(model.id)
  if (!p) {
    p = new Promise<string>((resolve, reject) => {
      queue = queue.then(
        () =>
          new Promise<void>((done) => {
            setTimeout(() => {
              try {
                resolve(render(model))
              } catch (e) {
                reject(e)
              }
              done()
            }, 30)
          }),
      )
    })
    cache.set(model.id, p)
  }
  return p
}
