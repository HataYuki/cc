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
import * as waterNode from './tsl/water/node'

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
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
camera.position.set(0.95, 1.1, 1.4)
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
const segment = Math.pow(2,9)
const material = new THREE.NodeMaterial()
material.transparent = true
material.vertexNode = waterNode.vertexNode()
material.colorNode = waterNode.fragmentNode()

const geometry = new THREE.PlaneGeometry(2, 2, segment, segment)

const plane = new THREE.Mesh(geometry, material)
plane.rotation.x = - Math.PI / 2
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
pane.addBinding(renderer.info.memory,'geometries', { readonly : true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })
pane.addBinding(camera.position, 'x', { label:'cam x', readonly: true })
pane.addBinding(camera.position, 'y', { label:'cam y', readonly: true })
pane.addBinding(camera.position, 'z', { label: 'cam z', readonly: true })

const tweakWater = pane.addFolder({ title: 'water' })
const colors = {
  depthColor:`#${waterNode.uDepthColor.value.getHexString()}`,
  surfaceColor:`#${waterNode.uSurfaceColor.value.getHexString()}`
}

tweakWater.addBinding(waterNode.uSmallWavesElavation, 'value', { label:'Smallwave Elavation', min:0, max:1, step:0.001 } )
tweakWater.addBinding(waterNode.uSmallWavesFrequency, 'value', { label:'Smallwave frequency', min:0, max:10, step:0.001 } )
tweakWater.addBinding(waterNode.uSmallWavesSpeed, 'value', { label:'Smallwave speed', min:0, max:10, step:0.001 } )
tweakWater.addBinding(waterNode.uSmallWavesIterations, 'value', { label:'Smallwave Iterations', min:0, max:5, step:1 } )

tweakWater.addBinding(waterNode.uBigWavesElavation, 'value', { label:'Wave elavation', min:0, max:10, step:0.001 } )
tweakWater.addBinding(waterNode.uBigWavesFrequency, 'value', { label:'Wave frequency', min:0, max:10, step:0.001 } )
tweakWater.addBinding(waterNode.uBigWavesSpeed, 'value', { label: 'Wave speed', min: 0, max: 10, step: 0.001 })

tweakWater.addBinding(colors, 'depthColor', { label:'Depth color', view: 'hex'} )
tweakWater.addBinding(colors, 'surfaceColor', { label: 'Surface color',view: 'hex' })
tweakWater.addBinding(waterNode.uColorOffset, 'value', { label: 'Color offset', min: 0, max: 1, step: 0.001 })
tweakWater.addBinding(waterNode.uColorMultiplier, 'value', { label: 'Color Multiplie', min: 0, max: 10, step: 0.001 })
tweakWater.on('change', () => {
  waterNode.uDepthColor.value.set(colors.depthColor)
  waterNode.uSurfaceColor.value.set(colors.surfaceColor)
})

console.log(waterNode.uSurfaceColor.value.getHexString(THREE.SRGBColorSpace))
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
