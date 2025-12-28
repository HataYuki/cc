import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

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
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * LoadTexture
 */
const envmap = await textureLoader.loadAsync('environmentmap/german_town_street_2k/german_town_street_2k.jpg')
envmap.mapping = THREE.EquirectangularReflectionMapping
envmap.colorSpace = THREE.SRGBColorSpace

const diffuseMap = await textureLoader.loadAsync('models/LeePerrySmith/Map-COL.jpg')
diffuseMap.colorSpace = THREE.SRGBColorSpace

const normalMap = await textureLoader.loadAsync('models/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg')

/**
 * Load gltf
 */
const gltf = await gltfLoader.loadAsync('models/LeePerrySmith/LeePerrySmith.glb')

/**
 * Scene
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('black')
scene.background = envmap
scene.environment = envmap

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(1, 0.5, 1.5)
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
 * LeePerry
 */
const material = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  normalMap: normalMap
})
const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking
})
const customUniforms = {
  uTime: { value: 0 }
}

material.onBeforeCompile = shader =>
{
  shader.uniforms.uTime = customUniforms.uTime
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
    `
    #include <common>
    uniform float uTime;

    mat2 get2dRotateMatrix(float _angle)
    {
        return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
    }
    `
  )
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <beginnormal_vertex>',
    `
    #include <beginnormal_vertex>
    float angle = sin(position.y + uTime * 2.0)* 0.9;
    mat2 rotateMatrix = get2dRotateMatrix(angle);

    objectNormal.xz *= rotateMatrix;
    `
  )
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <begin_vertex>',
    `
    #include <begin_vertex>

    transformed.xz *= rotateMatrix;
    `
  )
}

depthMaterial.onBeforeCompile = shader =>
{
  shader.uniforms.uTime = customUniforms.uTime
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;

      mat2 get2dRotateMatrix(float _angle)
      {
          return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
      }
      `
  )
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <begin_vertex>',
    `
    #include <begin_vertex>

    float angle = sin(position.y + uTime * 2.0)* 0.9;
    mat2 rotateMatrix = get2dRotateMatrix(angle);

    transformed.xz *= rotateMatrix;
    `
  )
}

gltf.scene.traverse(obj =>
{
  if (obj instanceof THREE.Mesh)
  {
    obj.material = material
    obj.receiveShadow = true
    obj.customDepthMaterial = depthMaterial
    obj.castShadow = true
  }
})
gltf.scene.scale.set(0.2, 0.2, 0.2)
scene.add(gltf.scene)

/**
 * Plane
 */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2, 1, 1),
  new THREE.MeshStandardMaterial()
)
plane.rotation.y = Math.PI / 2
plane.position.x = -1
plane.receiveShadow = true
scene.add(plane)


/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.position.set(1, 0, 0)
scene.add(directionalLight)

// Shadows
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0.01
directionalLight.shadow.camera.far = 4
directionalLight.shadow.camera.left = -3
directionalLight.shadow.camera.right = 3
directionalLight.shadow.camera.top = -3
directionalLight.shadow.camera.bottom = 3
const shadowMapSize = Math.pow(2,12)
directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
directionalLight.shadow.normalBias = 0.032
directionalLight.shadow.bias = 0.001

// Helper
const directionalLightHelper = new THREE.CameraHelper(
  directionalLight.shadow.camera
)
scene.add(directionalLightHelper)


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
const tweak = pane.addFolder({ title: 'LeePerry' })
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
  customUniforms.uTime.value = time
  // Update controls
  controls.update()
  // Rendering
  renderer.render(scene, camera)
  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
