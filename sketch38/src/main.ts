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
import particleVertexShader from './shaders/particle/vertex.glsl'
import particleFragmentShader from './shaders/particle/Fragment.glsl'

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
camera.position.set(0, 0, 0.8)
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

// Tone mapping
// renderer.toneMapping = THREE.ReinhardToneMapping
// renderer.toneMappingExposure = 3

// Shadows
// renderer.shadowMap.enabled = true
// renderer.shadowMap.type = THREE.PCFShadowMap

/**
 * LoadTexture
 */
const texture = await textureLoader.loadAsync('textures/picture-1.png')

/**
 * Displacement
 */
// 2D canvas
const displacement: any = {}
displacement.canvas = document.createElement('canvas')
displacement.canvas.width = 128
displacement.canvas.height = 128
displacement.canvas.style.position = 'fixed'
displacement.canvas.style.width = '256px'
displacement.canvas.style.height = '256px'
displacement.canvas.style.top = 0
displacement.canvas.style.left = 0
displacement.canvas.style.zIndex = 10
document.body.append(displacement.canvas)

// Context
displacement.context = displacement.canvas.getContext('2d')
displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

// Grow image
displacement.glowImage = new Image()
displacement.glowImage.src = 'textures/glow.png'

// Interactive plane
displacement.interactivePlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1,1),
  new THREE.MeshBasicMaterial({color:'red', side: THREE.DoubleSide})
)
displacement.interactivePlane.visible = false
scene.add(displacement.interactivePlane)

// Raycaster
displacement.raycaster = new THREE.Raycaster()

// Coordinate
displacement.screenCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999)
window.addEventListener('pointermove', event =>
{
  displacement.screenCursor.x = (event.clientX / size.x) * 2 - 1
  displacement.screenCursor.y = - (event.clientY / size.y) * 2 + 1
})

// Texture
displacement.texture = new THREE.CanvasTexture(displacement.canvas)

/**
 * Grid
 */
const particleGeometry = new THREE.PlaneGeometry(1, 1, 128, 128)
particleGeometry.setIndex(null)
particleGeometry.deleteAttribute('normal')
const intensicesBuffer = new Float32Array(particleGeometry.attributes.position.count)
const anglesBuffer = new Float32Array(particleGeometry.attributes.position.count)
for (let i = 0; i < particleGeometry.attributes.position.count; i++)
{
  intensicesBuffer[i] = Math.random()
  anglesBuffer[i] = Math.random() * Math.PI * 2
}
particleGeometry.setAttribute('aIntencity', new THREE.Float32BufferAttribute(intensicesBuffer, 1))
particleGeometry.setAttribute('aAngle', new THREE.Float32BufferAttribute(anglesBuffer, 1))

const particleMaterial = new THREE.ShaderMaterial(
  {
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    uniforms: {
      uDisplacementTexture: new THREE.Uniform(displacement.texture),
      uPixtureTexture: new THREE.Uniform(texture),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(
          size.x * renderer.getPixelRatio(),
          size.y * renderer.getPixelRatio()
        )
      )
    },
  })
const points = new THREE.Points(particleGeometry, particleMaterial)
scene.add(points)

/**
 * Directional light
 */
// const directionalLight = new THREE.DirectionalLight('#ff.', 6)
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

  // Update uniform
  particleMaterial
    .uniforms
    .uResolution
    .value
    .set(
      size.x * pixelRatio,
      size.y * pixelRatio
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

  // Time
  const time = clock.getElapsedTime()
  
  // Update controls
  controls.update()

  /**
   * Raycaster
   */
  displacement.raycaster.setFromCamera(displacement.screenCursor, camera)
  const intersections = displacement.raycaster.intersectObject(displacement.interactivePlane)
  if (intersections.length)
  {
    const uv = intersections[0].uv
    
    displacement.canvasCursor.x = uv.x * displacement.canvas.width
    displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height
  }

  /**
   * Displacement
   */
  displacement.context.globalCompositeOperation = 'source-over'
  displacement.context.globalAlpha = 0.02
  displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)
  
  // Speed alpha
  const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor)
  displacement.canvasCursorPrevious.copy(displacement.canvasCursor)
  const alpha = Math.min(cursorDistance * 0.1, 1)

  // DrawGlow
  const glowSize = displacement.canvas.width * 0.25
  displacement.context.globalCompositeOperation = 'lighten'
  displacement.context.globalAlpha = alpha
  displacement.context.drawImage(
    displacement.glowImage,
    displacement.canvasCursor.x - glowSize * 0.5,
    displacement.canvasCursor.y - glowSize * 0.5,
    glowSize,
    glowSize
  )

  // Texture
  displacement.texture.needsUpdate = true

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
