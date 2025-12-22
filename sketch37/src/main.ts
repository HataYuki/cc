import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'

/**
 * Shader
 */
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/Fragment.glsl'
import atomsphereVertexShader from './shaders/atomsphere/vertex.glsl'
import atomsphereFragmentShader from './shaders/atomsphere/Fragment.glsl'

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
const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Scene
 */
const sceneTweakObj = {
  background: '#000000'
}
const scene = new THREE.Scene()
scene.background = new THREE.Color(sceneTweakObj.background)
pane.addBinding(sceneTweakObj, 'background', { view: 'color' })
pane.on('change', () =>
{
  scene.background = new THREE.Color(sceneTweakObj.background)
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(0.8, 0.8, 0.8)
scene.add(camera)
pane.addBinding(camera.position, 'x', { readonly: true })
pane.addBinding(camera.position, 'y', { readonly: true })
pane.addBinding(camera.position, 'z', { readonly: true })


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
pane.addBinding(renderer.info.memory, 'geometries', { readonly: true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })

console.log(renderer.capabilities.getMaxAnisotropy())

// Tone mapping
// renderer.toneMapping = THREE.ReinhardToneMapping
// renderer.toneMappingExposure = 3

// Shadows
// renderer.shadowMap.enabled = true
// renderer.shadowMap.type = THREE.PCFShadowMap




/**
 * LoadTexture
 */
const earthDayTextuer = await textureLoader.loadAsync('./textures/earth/earth_daymap.jpg')
earthDayTextuer.colorSpace = THREE.SRGBColorSpace
earthDayTextuer.anisotropy = 3

const earthNightTextuer = await textureLoader.loadAsync('./textures/earth/earth_nightmap.jpg')
earthNightTextuer.colorSpace = THREE.SRGBColorSpace
earthNightTextuer.anisotropy = 3

const earthSpecularCloundsTextuer = await textureLoader.loadAsync('./textures/earth/specular_Cloudsmap.jpg')
earthSpecularCloundsTextuer.anisotropy = 3

/**
 * Earth
 */
const earthParameters = {
  atmosphereDayColor: '#00aaff',
  atmosphereTwilightColor: '#ff6688'
}
// Material
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader:earthVertexShader,
  fragmentShader:earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(earthDayTextuer),
    uNightTexture: new THREE.Uniform(earthNightTextuer),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloundsTextuer),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0.0, 0.0, 1.0)),
    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
  },
})

pane.addBinding(earthParameters, 'atmosphereDayColor', {view: 'color'})
pane.addBinding(earthParameters, 'atmosphereTwilightColor', { view: 'color' })


// Geometry
const earthGeometry = new THREE.SphereGeometry(1, 128, 128)
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// Atomsphere
const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atomsphereVertexShader,
  fragmentShader:atomsphereFragmentShader, 
  side: THREE.BackSide,
  transparent: true,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0.0, 0.0, 1.0)),
    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
  }
})
const atmosphereMesh = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphereMesh.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphereMesh)

pane.on('change', () =>
{
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
  earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
})


/**
 * Sun
 */
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()

const debugSun = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.2, 2),
  new THREE.MeshBasicMaterial()
)
scene.add(debugSun)

// Update 
const updateSun = () => 
{
  // Sun direction
  sunDirection
    .setFromSpherical(sunSpherical)
  
  debugSun.position
    .copy(sunDirection)
    .multiplyScalar(2)
  
  earthMaterial.uniforms.uSunDirection.value
    .copy(sunDirection)
  atmosphereMaterial.uniforms.uSunDirection.value
    .copy(sunDirection)
  
}
updateSun()

pane.addBinding(sunSpherical, 'phi', { min: 0, max: Math.PI, step: 0.01 })
pane.addBinding(sunSpherical, 'theta', { min: -Math.PI, max: Math.PI, step: 0.01 })
pane.on('change', () =>
{
  updateSun()
})




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
 * Tweaks
 */
// const tweakParameters = {
//   background: `#${scene.background.getHexString(THREE.SRGBColorSpace)}`,
// }
// pane.addBinding(renderer.info.memory,'geometries', { readonly : true } )
// pane.addBinding(renderer.info.memory, 'textures', { readonly: true })
// pane.addBinding(camera.position, 'x', { label:'cam x', readonly: true })
// pane.addBinding(camera.position, 'y', { label:'cam y', readonly: true })
// pane.addBinding(camera.position, 'z', { label: 'cam z', readonly: true })

// pane.addBinding(tweakParameters, 'background', { view: 'Hex' })
// pane.on('change', () =>
// {
//   scene.background = new THREE.Color(tweakParameters.background)
// })



/**
 * Animation
 */
const clock = new THREE.Clock()

const tick = () => {
  // Fps begin
  fps.begin()

  // Time
  const time = clock.getElapsedTime()

  // Animation
  earth.rotation.y += 0.001
  
  // Update controls
  controls.update()

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
