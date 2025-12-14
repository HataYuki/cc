import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

/**
 * Shader
 */
import holographicVertexShader from './shaders/holographic/vertex.glsl'
import holographicFragmentShader from './shaders/holographic/Fragment.glsl'

/**
 * Canvas
 */
const canvas = document.createElement('canvas')
canvas.setAttribute('id', 'webgl')
document.getElementById('app')?.append(canvas)

/**
 * Init
 */
const size = new THREE.Vector2(window.innerWidth, window.innerHeight)
let aspect = size.x / size.y
let pixelRatio = Math.min(devicePixelRatio, 2)

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(0, 0, 5)
scene.add(camera)


/**
 * Controls
 */
const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
const controls = new OrbitControls(camera, canvas)
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
 * LoadTexture
 */

/**
 * Material
 */
const uniforms = {
  uTime: new THREE.Uniform(0),
  uColor: new THREE.Uniform(new THREE.Color('#1c8de1'))
}
const material = new THREE.ShaderMaterial({
  vertexShader:holographicVertexShader,
  fragmentShader:holographicFragmentShader,
  uniforms: {
    uTime: uniforms.uTime,
    uColor: uniforms.uColor
  },
  side: THREE.DoubleSide,
  depthWrite: false,
  transparent: true,
  blending: THREE.AdditiveBlending
})

/**
 * Load model
 */
// monkey
const monkey = await gltfLoader.loadAsync('models/monkey/monkey.glb')
monkey.scene.traverse(obj =>
{ 
  if (obj instanceof THREE.Mesh)
  {
    obj.material = material
  }
})
scene.add(monkey.scene)

/**
 * Mesh
 */
// Sphere
const sphererGeometry = new THREE.SphereGeometry(1, 16, 16)
const sphereMesh = new THREE.Mesh(sphererGeometry, material)
sphereMesh.position.x = -3
scene.add(sphereMesh)

// Tourusnot
const tourusknotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 128)
const tourusknotMesh = new THREE.Mesh(tourusknotGeometry, material)
tourusknotMesh.position.x = 3
tourusknotMesh.scale.set(0.8, 0.8, 0.8)
scene.add(tourusknotMesh)



/**
 * Directional light
 */
// const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
// directionalLight.position.set(1, 0, 0)
// scene.add(directionalLight)

// Shadows
// directionalLight.castShadow = true
// directionalLight.shadow.camera.near = 0.01
// directionalLight.shadow.camera.far = 4
// directionalLight.shadow.camera.left = -3
// directionalLight.shadow.camera.right = 3
// directionalLight.shadow.camera.top = -3
// directionalLight.shadow.camera.bottom = 3
// const shadowMapSize = Math.pow(2,12)
// directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
// directionalLight.shadow.normalBias = 0.032
// directionalLight.shadow.bias = 0.001

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
const tweakParameters = {
  backgroundColor: '#000000',
  color: `#${uniforms.uColor.value.getHexString(THREE.SRGBColorSpace)}`
}
pane.addBinding(renderer.info.memory,'geometries', { readonly : true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })
pane.addBinding(camera.position, 'x', { label:'cam x', readonly: true })
pane.addBinding(camera.position, 'y', { label:'cam y', readonly: true })
pane.addBinding(camera.position, 'z', { label: 'cam z', readonly: true })
pane.addBinding(tweakParameters, 'backgroundColor', { view: 'color' })
pane.addBinding(tweakParameters, 'color', { view: 'color' })
pane.on('change', () =>
{
  scene.background = new THREE.Color(tweakParameters.backgroundColor)
  uniforms.uColor.value.set(tweakParameters.color)
})



/**
 * Animation
 */
const clock = new THREE.Clock()

const tick = () => {
  // Fps begin
  fps.begin()

  // Time
  const time = clock.getElapsedTime()

  // Time
  uniforms.uTime.value = time;

  // Animation
  monkey.scene.rotation.x = time * 0.2
  monkey.scene.rotation.z = time * 0.2

  sphereMesh.rotation.x = time * 0.2
  sphereMesh.rotation.z = time * 0.2

  tourusknotMesh.rotation.x = time * 0.2
  tourusknotMesh.rotation.z = time * 0.2
  
  // Update controls
  controls.update()

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
