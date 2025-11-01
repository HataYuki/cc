/**
 * Styles
 */
import './styles/destyle.css'
import './styles/tailwind.css'
import './styles/style.scss'

/**
 * Tweak pane
 */
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'

/**
 * Three
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/**
 * Loader
 */
const hdrLoader = new HDRLoader()
const gltfLoader = new GLTFLoader()

/**
 * Canvas
 */
const canvas = document.getElementById('webgl')
const size = new THREE.Vector2(window.innerWidth, window.innerHeight)
const pr = Math.min(devicePixelRatio, 2)
let aspect = size.x / size.y

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
camera.position.set(4, 5, 4)
scene.add(camera)

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.target.y = 3.5
controls.enableDamping = true

/**
 * Resize
 */
window.addEventListener('resize', () => {
  // Update window size
  size.set(window.innerWidth, window.innerHeight)
  // Update aspect
  aspect = size.x / size.y
  // Update camera
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  // Update renderer
  renderer.setSize(size.x, size.y)
  renderer.setPixelRatio(pr)
})

/**
 * environment
 */
hdrLoader.load('textures/environmentMaps/blender-2k.hdr', envMap => {
  envMap.mapping = THREE.EquirectangularReflectionMapping
  scene.background = envMap
  // scene.environment = envMap
})

/**
 * Model
 */
gltfLoader.load('models/FlightHelmet/glTF/FlightHelmet.gltf', gltf => {
  gltf.scene.scale.set(10, 10, 10)
  scene.add(gltf.scene)
})

/**
 * Mesh
 */
const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 64, 64),
  new THREE.MeshStandardMaterial({
    roughness: 0.1,
    metalness: 1,
    color: new THREE.Color(1, 1, 1),
  })
)
torusKnot.position.x = -4
torusKnot.position.y = 4
scene.add(torusKnot)

/**
 * Holy donut
 */
const donut = new THREE.Mesh(
  new THREE.TorusGeometry(8, 0.5, 128, 128),
  new THREE.MeshBasicMaterial({ color: new THREE.Color('rgb(255,255,255)') })
)
donut.position.set(0, 3.5, 0)
donut.layers.enable(1)
scene.add(donut)

/**
 * Cube render target
 */
const cubuRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
  type: THREE.HalfFloatType,
})
scene.environment = cubuRenderTarget.texture

/**
 * Cube camera
 */
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubuRenderTarget)
cubeCamera.layers.set(1)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
})
renderer.setSize(size.x, size.y, false)
renderer.setPixelRatio(pr)

/**
 * Tweak pane
 */
const tweak = new Pane({ title: 'Parameters', expanded: true })
const tweakWidth = 250
tweak.registerPlugin(EssentialsPlugin)
document.documentElement.style.setProperty(
  '--tweakpane-width',
  `${tweakWidth}px`
)
// Fps
const fpsGraph = tweak.addBlade({
  view: 'fpsgraph',
  label: 'fps',
  rows: 2,
})

tweak.addBinding(scene, 'environmentIntensity', {
  min: 1,
  max: 10,
  step: 0.001,
})
tweak.addBinding(scene.backgroundRotation, 'y', {
  min: 0,
  max: Math.PI * 2,
  step: 0.001,
})

const clock = new THREE.Clock()
const tick = () => {
  // begin Fps
  fpsGraph.begin()

  // Time
  const time = clock.getElapsedTime()

  // Real-time environment map
  donut.rotation.x = Math.sin(time) * 2
  cubeCamera.update(renderer, scene)

  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fpsGraph.end()
  // Tick
  requestAnimationFrame(tick)
}
tick()
