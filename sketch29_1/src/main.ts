import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'

/**
 * Shader
 */
import vertexShader from './shaders/galaxy/vertex.glsl'
import fragmentShader from './shaders/galaxy/fragment.glsl'

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

/**
 * Scene
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('black')

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(0, 1.1, 1.4)
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
const MAX_COUNT = Math.pow(2, 19)
const parameters = {
  count: MAX_COUNT,
  size: 0.0015,
  radius: 1.2,
  branches: 3,
  randomness: 0.4,
  randomnessPower: 2,
  insideColor: '#e61818',
  outsideColor: '#0ca900'
}

let geometry:THREE.BufferGeometry | null  = null
let material = new THREE.ShaderMaterial({
  uniforms: {
    uSize: { value: 8 * renderer.getPixelRatio() },
    uTime: { value: 0 }
  },
  // size: parameters.size,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
})
let points: THREE.Points | null = null

const createGalaxy = () =>
{ 
  if (geometry !== null) geometry.dispose()
  if (material !== null) material.dispose()
  if (points !== null) scene.remove(points)

  const positionsBuffer = new Float32Array(parameters.count * 3)
  const colorsBuffer = new Float32Array(parameters.count * 3)
  const scaleBuffer = new Float32Array(parameters.count * 1)
  const randomnessBuffer = new Float32Array(parameters.count * 3)

  const colorInside = new THREE.Color(parameters.insideColor)
  const colorOutside = new THREE.Color(parameters.outsideColor)

  for (let i = 0; i < parameters.count; i++)
  {
    const i3 = i * 3

    /**
     * Position
     */
    const radius = parameters.radius * Math.random()
    const angle = (i % parameters.branches) / parameters.branches * Math.PI * 2

    positionsBuffer[i3 + 0] = Math.sin(angle) * radius
    positionsBuffer[i3 + 1] = 0
    positionsBuffer[i3 + 2] = Math.cos(angle) * radius

    /**
     * randomness
     */
    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
    randomnessBuffer[i3 + 0] = randomX
    randomnessBuffer[i3 + 1] = randomY
    randomnessBuffer[i3 + 2] = randomZ
    
    /**
     * Color
     */
    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, radius / parameters.radius)
    colorsBuffer[i3 + 0] = mixedColor.r
    colorsBuffer[i3 + 1] = mixedColor.g
    colorsBuffer[i3 + 2] = mixedColor.b

    /**
     * Scale
     */
    scaleBuffer[i] = Math.random()
  }

  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positionsBuffer, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colorsBuffer, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scaleBuffer, 1))
  geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessBuffer, 3))

  // material.size = parameters.size

  points = new THREE.Points(geometry, material)
  scene.add(points)
}
createGalaxy()

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
pane.addBinding(renderer.info.memory,'geometries', { readonly : true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })
pane.addBinding(camera.position, 'x', { label:'cam x', readonly: true })
pane.addBinding(camera.position, 'y', { label:'cam y', readonly: true })
pane.addBinding(camera.position, 'z', { label: 'cam z', readonly: true })

// Points
const tweakGalaxy = pane.addFolder({ title: 'Galaxy' })
tweakGalaxy.addBinding(parameters, 'count', { label:'count', min: 1024, max: MAX_COUNT, step: 2048 })
tweakGalaxy.addBinding(material.uniforms.uSize, 'value', { label:'size', min: 0, max: 100, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'radius', { min:0, max: 3, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'branches', { min:0, max: 10, step: 1 })
tweakGalaxy.addBinding(parameters, 'randomness', { min:0, max: 1, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'randomnessPower', { min: 0, max: 10, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'insideColor', {label:'inside', view: 'color'})
tweakGalaxy.addBinding(parameters, 'outsideColor', {label: 'outside', view: 'color'})
tweakGalaxy.on('change', () =>
{
  createGalaxy()
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
  // Update material
  material.uniforms.uTime.value = time
  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
