import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'

/**
 * Canvas
 */
const canvas = document.createElement('canvas')
canvas.setAttribute('id', 'webgl')
document.getElementById('app')?.append(canvas)

/**
 * Loader
 */
const { TextureLoader } = THREE
const textureLoader = new TextureLoader()

/**
 * Init
 */
const size = new THREE.Vector2(window.innerWidth, window.innerHeight)
let aspect = size.x / size.y
let pixelRatio = Math.min(devicePixelRatio, 2)

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
camera.position.set(5, 6, 5)
scene.add(camera)

/**
 * Controls
 */
const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 3.5, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})
renderer.setSize(size.x, size.y, false)
renderer.setPixelRatio(pixelRatio)

// Tone mapping
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3

// Shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

/**
 * Resize
 */
window.addEventListener('resize', () => {
  size.set(window.innerWidth, window.innerHeight)
  aspect = size.x / size.y
  pixelRatio = Math.min(devicePixelRatio, 2)

  // Update camera
  camera.aspect = aspect
  camera.updateProjectionMatrix()

  // Update Renderer
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(size.x, size.y)
})

/**
 * Environment
 */
const { HDRLoader } = await import('three/addons/loaders/HDRLoader.js')
const hdrLoader = new HDRLoader()
const environmentMap = await hdrLoader.loadAsync('environmentMaps/0/2k.hdr')
environmentMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = scene.environment = environmentMap

/**
 * Model
 */
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js')
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Fright helmet
// const gltf = await gltfLoader.loadAsync(
//   'models/FlightHelmet/glTF/FlightHelmet.gltf'
// )
// gltf.scene.traverse(object => {
//   if (
//     (object as THREE.Mesh).isMesh &&
//     ((object as THREE.Mesh).material as THREE.MeshStandardMaterial)
//       .isMeshStandardMaterial
//   ) {
//     object.castShadow = object.receiveShadow = true
//   }
// })
// gltf.scene.scale.set(10, 10, 10)
// scene.add(gltf.scene)

// Humburger

const gltf = await gltfLoader.loadAsync('models/humburger/humburger.glb')
gltf.scene.traverse(object => {
  if (
    (object as THREE.Mesh).isMesh &&
    ((object as THREE.Mesh).material as THREE.MeshStandardMaterial)
      .isMeshStandardMaterial
  ) {
    // object.material.wireframe = true
    object.castShadow = object.receiveShadow = true
  }
})
gltf.scene.scale.set(0.4, 0.4, 0.4)
scene.add(gltf.scene)

/**
 * Floor
 */
const floorColorTexture = await textureLoader.loadAsync(
  'textures/wood_cabinet_worn_long_1k/wood_cabinet_worn_long_diff_1k.jpg'
)
const floorNormalTexture = await textureLoader.loadAsync(
  'textures/wood_cabinet_worn_long_1k/wood_cabinet_worn_long_nor_gl_1k.png'
)
const floorARMTexture = await textureLoader.loadAsync(
  'textures/wood_cabinet_worn_long_1k/wood_cabinet_worn_long_arm_1k.jpg'
)
floorColorTexture.colorSpace = THREE.SRGBColorSpace
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshStandardMaterial({
    map: floorColorTexture,
    normalMap: floorNormalTexture,
    roughnessMap: floorARMTexture,
    metalnessMap: floorARMTexture,
    aoMap: floorARMTexture,
  })
)
floor.receiveShadow = true
floor.scale.set(10, 10, 10)
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

/**
 * Wall
 */
const wallColorTexture = await textureLoader.loadAsync(
  'textures/castle_brick_07_1k/castle_brick_07_diff_1k.jpg'
)
const wallNormalTexture = await textureLoader.loadAsync(
  'textures/castle_brick_07_1k/castle_brick_07_nor_gl_1k.png'
)
const wallARMTexture = await textureLoader.loadAsync(
  'textures/castle_brick_07_1k/castle_brick_07_arm_1k.jpg'
)
wallColorTexture.colorSpace = THREE.SRGBColorSpace
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    normalMap: wallNormalTexture,
    roughnessMap: wallARMTexture,
    metalnessMap: wallARMTexture,
    aoMap: wallARMTexture,
  })
)
wall.receiveShadow = true
wall.scale.set(10, 10, 10)
wall.position.set(0, 5, -5)
// wall.rotation.x = -Math.PI * 0.5
scene.add(wall)

/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.position.set(-5, 10, 0.2)
scene.add(directionalLight)

// Shadows
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 20
directionalLight.shadow.mapSize.set(Math.pow(2, 9), Math.pow(2, 9))
directionalLight.shadow.normalBias = 0.032
directionalLight.shadow.bias = 0.001

// Target
directionalLight.target.position.set(0, 4, 0)
directionalLight.target.updateWorldMatrix(false, false)

// Helper
// const directionalLightHelper = new THREE.CameraHelper(
//   directionalLight.shadow.camera
// )
// scene.add(directionalLightHelper)

/**
 * Tweak Pane
 */
const { Pane } = await import('tweakpane')
const EssentialsPlugin = await import('@tweakpane/plugin-essentials')
const pane = new Pane()
pane.registerPlugin(EssentialsPlugin)

/**
 * Fps
 */
const fps: any = pane.addBlade({
  view: 'fpsgraph',
  label: 'fps',
})

/**
 * Tweaks
 */
pane.addBinding(scene, 'environmentIntensity', { min: 0, max: 10, step: 0.001 })
pane.addBinding(renderer, 'toneMapping', {
  options: {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  },
})
pane.addBinding(renderer, 'toneMappingExposure', { min: 0, max: 10, step: 0.1 })
pane.addBinding(directionalLight, 'intensity', { min: 1, max: 20, step: 0.01 })
pane.addBinding(directionalLight, 'position', {
  label: 'light position',
  x: { min: -10, max: 10, step: 0.1 },
  y: { min: -10, max: 10, step: 0.1 },
  z: { min: -10, max: 10, step: 0.1 },
})
pane.addBinding(directionalLight, 'castShadow')
pane.addBinding(directionalLight.shadow, 'normalBias', {
  min: -0.05,
  max: 0.05,
  step: 0.001,
})
pane.addBinding(directionalLight.shadow, 'bias', {
  min: -0.05,
  max: 0.05,
  step: 0.001,
})

/**
 * Animation
 */
// const clock = new THREE.Clock()
const tick = () => {
  // Fps begin
  fps.begin()
  // Time
  //   const time = clock.getElapsedTime()

  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fps.end()
  requestAnimationFrame(tick)
}
tick()
