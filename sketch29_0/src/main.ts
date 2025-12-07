import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three/webgpu'

/**
 * Shader
 */
import vertexShader from './shaders/test/vertex.glsl'
import fragmentShader from './shaders/test/fragment.glsl'
import * as particleNode from './tsl/particle.node'
import { float, instancedArray, instanceIndex, vec3,Fn, hash, uint, rand, uniform } from 'three/tsl'

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
const renderer = new THREE.WebGPURenderer({
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
const MAX_COUNT = Math.pow(2, 21)
const count = uniform(MAX_COUNT)
const scale = uniform(0.01)
const parameters = {
  count: MAX_COUNT,
  size: 0.0015,
  radius: 1.8,
  branches: 5,
  spin: 1,
  randomness: 0.1,
  randomnessPower: 2
}
const positionsBuffer = instancedArray(MAX_COUNT, 'vec3')
const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
const material = new THREE.SpriteNodeMaterial({
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
})

const initPosition = Fn(() =>
  {
    const position = positionsBuffer.element(instanceIndex)
    position.assign(
      vec3(
        rand(instanceIndex),
        rand(instanceIndex.add(1)),
        rand(instanceIndex.add(2)),
      )
    )
})().compute(MAX_COUNT)
renderer.compute(initPosition)

material.positionNode = positionsBuffer.toAttribute()
material.scaleNode = scale.mul(0.1)

const mesh = new THREE.InstancedMesh(geometry, material, MAX_COUNT)
scene.add(mesh)


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
tweakGalaxy.addBinding(count, 'value', { label:'count', min: 1024, max: MAX_COUNT, step: 2048 })
tweakGalaxy.addBinding(scale, 'value', { label:'scale', min: 0, max: 1, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'radius', { min:0, max: 3, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'branches', { min:0, max: 10, step: 1 })
tweakGalaxy.addBinding(parameters, 'spin', { min:0, max: 10, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'randomness', { min:0, max: 1, step: 0.001 })
tweakGalaxy.addBinding(parameters, 'randomnessPower', { min: 0, max: 10, step: 0.001 })
tweakGalaxy.on('change', () =>
{
  mesh.count = count.value
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
  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
