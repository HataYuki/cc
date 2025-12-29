import './style.scss'

/**
 * Import
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
// import gsap from 'gsap'

/**
 * Shader
 */
/**
 * Tweak Pane
 */
const pane = new Pane()
pane.registerPlugin(EssentialsPlugin)

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
const hdrLoader = new HDRLoader()
const gltfLoader = new GLTFLoader()
// const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * LoadTexture
 */
const envMap = await hdrLoader.loadAsync('environmentmap/spruit_sunrise/spruit_sunrise.hdr')

/**
 * Scene
 */
const scene = new THREE.Scene()

// envmap
envMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = envMap
scene.environment = envMap
scene.backgroundBlurriness = 0.3


/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(-6.52, 4.82, -1.48)
scene.add(camera)
pane.addBinding(camera.position, 'x', { readonly: true, label: 'cam X'})
pane.addBinding(camera.position, 'y', { readonly: true, label: 'cam Y'})
pane.addBinding(camera.position, 'z', { readonly: true, label: 'cam Z'})


/**
 * Controls
 */
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
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Tweak 
pane.addBinding(renderer.info.memory, 'geometries', { readonly: true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })



/**
 * Terrain
 */
// Color 
const color =
{
  colorWaterDeep:'#002b3d',
  colorWaterSurface:'#66a8ff',
  colorSand:'#ffe894',
  colorGrass:'#85d534',
  colorSnow:'#ffffff',
  colorRock:'#bfbd8d',
}

// Uniforms
const uniforms = 
{
  uTime: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(0.2),
  uStrength: new THREE.Uniform(2.0),
  uWarpFrequency: new THREE.Uniform(5),
  uWarpStrength: new THREE.Uniform(0.5),
  // Color
  uColorWaterDeep:new THREE.Uniform(new THREE.Color(color.colorWaterDeep)),
  uColorWaterSurface:new THREE.Uniform(new THREE.Color(color.colorWaterSurface)),
  uColorSand:new THREE.Uniform(new THREE.Color(color.colorSand)),
  uColorGrass:new THREE.Uniform(new THREE.Color(color.colorGrass)),
  uColorSnow:new THREE.Uniform(new THREE.Color(color.colorSnow)),
  uColorRock:new THREE.Uniform(new THREE.Color(color.colorRock)),
}

pane.addBinding(uniforms.uPositionFrequency, 'value', {label:'uPositionFrequency',min:0,max:1, step:0.001})
pane.addBinding(uniforms.uStrength, 'value', {label:'uStrength',min:0,max:10, step:0.001})
pane.addBinding(uniforms.uWarpFrequency, 'value', {label:'uWarpFrequency',min:0,max:10, step:0.001})
pane.addBinding(uniforms.uWarpStrength, 'value', {label:'uWarpStrength', min: 0, max: 1, step: 0.001 })

pane.addBinding(color, 'colorWaterDeep', {view:'hex'})
pane.addBinding(color, 'colorWaterSurface', {view:'hex'})
pane.addBinding(color, 'colorSand', {view:'hex'})
pane.addBinding(color, 'colorGrass', {view:'hex'})
pane.addBinding(color, 'colorSnow', {view:'hex'})
pane.addBinding(color, 'colorRock', { view: 'hex' })
pane.on('change', () =>
{
  uniforms.uColorWaterDeep.value.set(color.colorWaterDeep)
  uniforms.uColorWaterSurface.value.set(color.colorWaterSurface)
  uniforms.uColorSand.value.set(color.colorSand)
  uniforms.uColorGrass.value.set(color.colorGrass)
  uniforms.uColorSnow.value.set(color.colorSnow)
  uniforms.uColorRock.value.set(color.colorRock)
})

// Geometry
const geometry = new THREE.PlaneGeometry(10, 10, 500, 500)
geometry.deleteAttribute('uv')
geometry.deleteAttribute('normal')
geometry.rotateX(-Math.PI / 2)

// Material
const material = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader:terrainVertexShader,
  fragmentShader: terrainFragmentShader,
  uniforms: uniforms,
  // MeshStandardMaterial
  metalness: 0,
  roughness: 0.5,
  color:'#85d534'
})

const depthMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader:terrainVertexShader,
  // fragmentShader: terrainFragmentShader,
  uniforms: uniforms,
  // MeshStandardMaterial
  depthPacking: THREE.RGBADepthPacking
})

// Mesh
const terrain = new THREE.Mesh(geometry, material)
terrain.customDepthMaterial = depthMaterial
terrain.receiveShadow = true
terrain.castShadow = true
scene.add(terrain)

/**
 * Water
 */
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(10,10,1,1),
  new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    roughness: 0.3
  })
)
water.position.y = -0.1
water.rotation.x = -Math.PI / 2;
scene.add(water)

/**
 * Board
 */
// Brushes
const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11))
const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10))

// Evaluate
const evaluator = new Evaluator()
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION)
board.geometry.clearGroups()
board.material = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.0, roughness: 0.3 })
board.castShadow = true
board.receiveShadow = true
scene.add(board)

/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 4)
directionalLight.position.set(1, 5, 3)
// Shadows
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0.01
directionalLight.shadow.camera.far = 20
directionalLight.shadow.camera.left = -12
directionalLight.shadow.camera.right = 12
directionalLight.shadow.camera.top = -12
directionalLight.shadow.camera.bottom = 12

const shadowMapSize = Math.pow(2,12)
directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
directionalLight.shadow.normalBias = 0.032
directionalLight.shadow.bias = 0.001

scene.add(directionalLight)

// Helper
const directionalLightHelper = new THREE.CameraHelper(
  directionalLight.shadow.camera
)

scene.add(directionalLightHelper)


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
 * Fps
 */
const fps: any = pane.addBlade({
  view: 'fpsgraph',
  label: 'fps',
})

/**
 * Animation
 */
const clock = new THREE.Clock()
const tick = () => {
  // Fps begin
  fps.begin()

  directionalLightHelper.update()

  // Time
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  // Update uniform
  uniforms.uTime.value = elapsedTime;
  
  // Update controls
  controls.update()

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
