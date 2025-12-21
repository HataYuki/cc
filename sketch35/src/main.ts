import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'

/**
 * Shader
 */
import seaVertexShader from './shaders/sea/vertex.glsl'
import seaFragmentShader from './shaders/sea/fragment.glsl'

// console.log(seaVertexShader)

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
camera.position.set(0.8, 0.6, 0.8)
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
renderer.toneMapping = THREE.ACESFilmicToneMapping
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
const material = new THREE.ShaderMaterial(
  {
    uniforms: {
      uTime: new THREE.Uniform(0),

      uDepthColor: new THREE.Uniform(new THREE.Color('#ff4000')),
      uSurfaceColor: new THREE.Uniform(new THREE.Color('#151c37')),
      
      uBigWavesElevation: new THREE.Uniform(0.2),
      uBigWavesFrequency: new THREE.Uniform(new THREE.Vector2(4, 1.5)),
      uBigWavesSpeed: new THREE.Uniform(0.75),

      uSmallWavesElevation: new THREE.Uniform(0.15),
      uSmallWavesFrequency: new THREE.Uniform(3),
      uSmallWavesSpeed: new THREE.Uniform(0.2),
      uSmallWavesIterations: new THREE.Uniform(4),

      uColorOffset: new THREE.Uniform(0.925),
      uColorMultiplier: new THREE.Uniform(1),
    },
    vertexShader: seaVertexShader,
    fragmentShader: seaFragmentShader,
  }
)

const geometry = new THREE.PlaneGeometry(2, 2, segment, segment)
geometry.deleteAttribute('normal')
geometry.deleteAttribute('uv')

const plane = new THREE.Mesh(geometry, material)
plane.rotation.x = - Math.PI / 2
scene.add(plane)

// Axes helper
// const axesHelper = new THREE.AxesHelper()
// axesHelper.position.y += 0.25
// scene.add(axesHelper)


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
const tweakParameter = {
  uDepthColor: `#${material.uniforms.uDepthColor.value.getHexString(THREE.SRGBColorSpace)}`,
  uSurfaceColor: `#${material.uniforms.uSurfaceColor.value.getHexString(THREE.SRGBColorSpace)}`
}
tweakWater.addBinding(tweakParameter, 'uDepthColor', { label:'Depth color', view: 'hex'} )
tweakWater.addBinding(tweakParameter, 'uSurfaceColor', { label: 'Surface color',view: 'hex' })

tweakWater.addBinding(material.uniforms.uBigWavesElevation, 'value', { label:'bigWaveElevation', min:0, max:10, step:0.001 } )
tweakWater.addBinding(material.uniforms.uBigWavesFrequency, 'value', { label:'bigWavefrequency', min:0, max:10, step:0.001 } )
tweakWater.addBinding(material.uniforms.uBigWavesSpeed, 'value', { label: 'bigWavespeed', min: 0, max: 10, step: 0.001 })

tweakWater.addBinding(material.uniforms.uSmallWavesElevation, 'value', { label:'Smallwave Elevation', min:0, max:1, step:0.001 } )
tweakWater.addBinding(material.uniforms.uSmallWavesFrequency, 'value', { label:'Smallwave frequency', min:0, max:10, step:0.001 } )
tweakWater.addBinding(material.uniforms.uSmallWavesSpeed, 'value', { label:'Smallwave speed', min:0, max:10, step:0.001 } )
tweakWater.addBinding(material.uniforms.uSmallWavesIterations, 'value', { label:'Smallwave Iterations', min:0, max:5, step:1 } )

tweakWater.addBinding(material.uniforms.uColorOffset, 'value', { label: 'Color offset', min: 0, max: 1, step: 0.001 })
tweakWater.addBinding(material.uniforms.uColorMultiplier, 'value', { label: 'Color Multiplie', min: 0, max: 10, step: 0.001 })
tweakWater.on('change', () => {
  material.uniforms.uDepthColor.value.set(tweakParameter.uDepthColor)
  material.uniforms.uSurfaceColor.value.set(tweakParameter.uSurfaceColor)
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
