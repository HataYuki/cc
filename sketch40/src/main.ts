import './style.scss'

/**
 * Import
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
// import gsap from 'gsap'

/**
 * Shader
 */
import particleVertexShader from './shaders/particle/vertex.glsl'
import particleFragmentShader from './shaders/particle/Fragment.glsl'
import gpgpuParticleShader from './shaders/gpgpu/particles.glsl'

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
const gltfLoader = new GLTFLoader()
// const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Scene
 */
const sceneTweakObj = { background: '#000000' }
const scene = new THREE.Scene()
scene.background = new THREE.Color(sceneTweakObj.background)

// Tweak
pane.addBinding(sceneTweakObj, 'background', { view: 'color' })
pane.on('change', () =>
{
  scene.background = new THREE.Color(sceneTweakObj.background)
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(6.49, 3.76, 9.60)
scene.add(camera)
pane.addBinding(camera.position, 'x', { readonly: true })
pane.addBinding(camera.position, 'y', { readonly: true })
pane.addBinding(camera.position, 'z', { readonly: true })


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

// Tweak 
pane.addBinding(renderer.info.memory, 'geometries', { readonly: true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })

/**
 * LoadTexture
 */

/**
 * Load gltf
 */
const gltf = await gltfLoader.loadAsync('models/ship/model.glb')

/**
 * Base geometry
 */
const baseGeometry: any = {}
baseGeometry.instance = (gltf.scene.children[0] as THREE.Mesh).geometry
baseGeometry.count = baseGeometry.instance.attributes.position.count

/**
 * GPU Compute
 */
const gpgpu:any = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

// Base particles
const baseParticlesTexture = gpgpu.computation.createTexture()

for (let i = 0; i < baseGeometry.count; i++)
{
  const i3 = i * 3
  const i4 = i * 4

  baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
  baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
  baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
  baseParticlesTexture.image.data[i4 + 3] = Math.random()
}

// Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticleShader, baseParticlesTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable])

// Uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.5)
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(2)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(2)

pane.addBinding(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value', {min:0, max:1, label:'uFlowFieldInfluence'})
pane.addBinding(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, 'value', { min: 0, max: 10, label: 'uFlowFieldStrength'})
pane.addBinding(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value', { min: 0, max: 1, step:0.01, label: 'uFlowFieldFrequency'})

// Init
gpgpu.computation.init()
gpgpu.computation.compute()

// Debug
gpgpu.debug = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map:gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
  })
)
gpgpu.debug.visible = false
gpgpu.debug.position.x = 1
scene.add(gpgpu.debug)

/**
 * Particles
 */
const particles: any = {}

// Geometry
const particlesUvBuffer = new Float32Array(baseGeometry.count * 2)
const particlesSizeBuffer = new Float32Array(baseGeometry.count * 1)
for (let y = 0; y < gpgpu.size; y++)
{
  for (let x = 0; x < gpgpu.size; x++)
  {
    const i = (y * gpgpu.size) + x
    const i2 = i * 2

    const uvX = (x + 0.5) / gpgpu.size
    const uvY = (y + 0.5) / gpgpu.size

    particlesUvBuffer[i2 + 0] = uvX
    particlesUvBuffer[i2 + 1] = uvY

    particlesSizeBuffer[i] = Math.random()
  }
}
particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.Float32BufferAttribute(particlesUvBuffer, 2))
particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color)
particles.geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(particlesSizeBuffer, 1))

// Material
particles.material = new THREE.ShaderMaterial({
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    uSize: new THREE.Uniform(0.05),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        size.x * renderer.getPixelRatio(),
        size.y * renderer.getPixelRatio()
      )
    ),
    uParticlesTexture: new THREE.Uniform(
      gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
    )
  }
})

// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

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

  // Update uniform
  particles.material.uniforms.uResolution.value.set(
    size.x * renderer.getPixelRatio(),
    size.y * renderer.getPixelRatio()
  )

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

  // // Time
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()
  
  // Update controls
  controls.update()

  // GPGPU update
  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime
  gpgpu.computation.compute()
  particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
