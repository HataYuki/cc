import './style.scss'

/**
 * Import
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import wobbleVertexShader from './shaders/wobble/vertex.glsl'
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'
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
const envMap = await hdrLoader.loadAsync('environmentmap/urban_alley/urban_alley_01_1k.hdr')

/**
 * Scene
 */
const sceneTweakObj = { background: '#000000' }
const scene = new THREE.Scene()

// envmap
envMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = envMap
scene.environment = envMap


/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(8.78, 0.11, -1.60)
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
 * Model
 */
const color = {
  colorB: '#ff0000',
  colorA: '#0000ff'
}
const uniforms = {
  uTime: new THREE.Uniform(0),

  uPositionFrequency: new THREE.Uniform(0.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(0.3),

  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),

  uColorA:new THREE.Uniform(new THREE.Color(color.colorA)),
  uColorB:new THREE.Uniform(new THREE.Color(color.colorB))
}

// Material
const sphereMaterial:THREE.MeshPhysicalMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms: uniforms,
  // MeshPhysicalMaterial
  metalness: 0,
  roughness: 0.5,
  color: '#ffffff',
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false
}) as unknown as THREE.MeshPhysicalMaterial

const depthSphereMaterial:THREE.MeshDepthMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  // fragmentShader: wobbleFragmentShader,
  uniforms:uniforms,

  // MeshDepthMaterial
  depthPacking: THREE.RGBADepthPacking
}) as unknown as THREE.MeshDepthMaterial

// Tweak
pane.addBinding(uniforms.uPositionFrequency,'value', {min:0, max:2, step:0.001, label:'uPositionFrequency'})
pane.addBinding(uniforms.uTimeFrequency, 'value', {min:0, max:2, step:0.001, label:'uTimeFrequency'})
pane.addBinding(uniforms.uStrength, 'value', { min: 0, max: 2, step: 0.001, label: 'uStrength' })

pane.addBinding(uniforms.uWarpPositionFrequency,'value', {min:0, max:2, step:0.001, label:'uWarpPositionFrequency'})
pane.addBinding(uniforms.uWarpTimeFrequency, 'value', {min:0, max:2, step:0.001, label:'uWarpTimeFrequency'})
pane.addBinding(uniforms.uWarpStrength, 'value', { min: 0, max: 2, step: 0.001, label: 'uWarpStrength' })

pane.addBinding(color, 'colorA', { view: 'hex' })
pane.addBinding(color, 'colorB', { view: 'hex' })
pane.on('change', () => {
  uniforms.uColorA.value.set(color.colorA)
  uniforms.uColorB.value.set(color.colorB)
})

// Geometry
let sphereGeometry = new THREE.IcosahedronGeometry(2.5, 50)
sphereGeometry = mergeVertices(sphereGeometry) as THREE.IcosahedronGeometry
sphereGeometry.computeTangents()

// Mesh
const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
mesh.customDepthMaterial = depthSphereMaterial
mesh.castShadow = true
mesh.receiveShadow = true
scene.add(mesh)

// gltfLoader.load('models/monkey/suzanne.glb', gltf =>
// {
//   const wobble = gltf.scene.children[0]
//   if (wobble instanceof THREE.Mesh)
//   {
//     wobble.scale.set(0.5, 0.5, 0.5)
//     wobble.receiveShadow = true
//     wobble.castShadow = true
//     wobble.material = sphereMaterial
//     wobble.customDepthMaterial = depthSphereMaterial
//   }
//   scene.add(wobble)
// })
   
pane.addBinding(sphereMaterial, 'metalness', { min: 0, max:1, step:0.01})
pane.addBinding(sphereMaterial, 'roughness', { min: 0, max: 1, step: 0.01 })
pane.addBinding(sphereMaterial, 'transmission', { min: 0, max: 1, step: 0.01 })
pane.addBinding(sphereMaterial, 'ior', { min: 0, max: 2.333, step: 0.01 })
pane.addBinding(sphereMaterial, 'thickness', { min: 0, max: 2.333, step: 0.01 })


const planeMaterial = new THREE.MeshPhysicalMaterial()
const planeGeometry = new THREE.PlaneGeometry(6,6)
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
planeMesh.receiveShadow = true
planeMesh.position.set(0, -0.5, 4)
planeMesh.rotation.y = Math.PI
scene.add(planeMesh)


/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.position.set(0, 2, -3)
// Shadows
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0.01
directionalLight.shadow.camera.far = 10
directionalLight.shadow.camera.left = -6
directionalLight.shadow.camera.right = 6
directionalLight.shadow.camera.top = -6
directionalLight.shadow.camera.bottom = 6

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

  // Materials
  uniforms.uTime.value = elapsedTime
  
  // Update controls
  controls.update()

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
