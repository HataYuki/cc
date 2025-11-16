import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three/webgpu'

/**
 * Shader
 */
// import testVertexShader from './shaders/test/vertex.glsl'
// import testFragmentShader from './shaders/test/fragment.glsl'
import {
  uFrequency,uColor,uTexture,
  vertexNode, fragmentNode
} from './tsl/node'

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
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const fragTexture = textureLoader.load('textures/flag-french.jpg')
fragTexture.colorSpace = THREE.SRGBColorSpace

uTexture.value = fragTexture

/**
 * Scene
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('black')

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
camera.position.set(0, 0, 1)
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
const renderer = new THREE.WebGPURenderer({
  canvas,
  antialias: true,
})
renderer.setSize(size.x, size.y, false)
renderer.setPixelRatio(pixelRatio)
renderer.outputColorSpace = THREE.SRGBColorSpace

// Tone mapping
// renderer.toneMapping = THREE.ReinhardToneMapping
// renderer.toneMappingExposure = 3

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
 * Mesh
 */
const segment = Math.pow(2,5)
const geometry = new THREE.PlaneGeometry(1, 1, segment, segment)

const count = geometry.attributes.position.count
const randoms = new Float32Array(count)
console.log(count)
for (let i = 0; i < count; i++)
{
  randoms[i] = Math.random()
}
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

const material = new THREE.NodeMaterial()
material.transparent = true
material.vertexNode = vertexNode()
material.fragmentNode = fragmentNode()

const plane = new THREE.Mesh(geometry, material)
plane.scale.y = 2 / 3
scene.add(plane)


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
pane.addBinding(renderer.info.memory,'geometries',{readonly:true})
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })

const shader = pane.addFolder( { title: 'Shader' } )
shader.addBinding(uFrequency, 'value', {label:'Frequency', min: 0, max: 20, step: 0.001 })
shader.addBinding(uColor, 'value', { label: 'Color' ,view:'color',color:{type:'float'}})

/**
 * Animation
 */
const clock = new THREE.Clock()
const tick = () => {
  // Fps begin
  fps.begin()
  // Time
  const time = clock.getElapsedTime()
  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
