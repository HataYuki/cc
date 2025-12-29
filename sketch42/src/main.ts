import './style.scss'

/**
 * Import
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import slicedVertexShader from './shaders/sliced/vertex.glsl'
import slicedFragmentShader from './shaders/sliced/fragment.glsl'
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
const scene = new THREE.Scene()

// envmap
envMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = envMap
scene.environment = envMap
scene.backgroundBlurriness = 0.3


/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(1.15,2.86,5.24)
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
// Uniforms
const uniforms = {
  uSliceStart: new THREE.Uniform(1.75),
  uSliceArc: new THREE.Uniform(1.25)
} 

pane.addBinding(uniforms.uSliceStart, 'value', { min: -Math.PI, max: Math.PI, step: 0.001, label: 'uSliceStart'})
pane.addBinding(uniforms.uSliceArc, 'value', { min: 0, max: Math.PI * 2, step: 0.001, label: 'uSliceArc' })

const pathMap =
{
  csm_Slice:
  {
    '#include <colorspace_fragment>':
      `
      #include <colorspace_fragment>

      if(!gl_FrontFacing)
        gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
      `
  }
}

// Material
const material = new THREE.MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color:'#858080'
})

const slicedMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  patchMap: pathMap,

  // MeshStandardMaterial
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: '#858080',
  side: THREE.DoubleSide
})

const depthSlicedMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  patchMap: pathMap,

  // MeshStandardMaterial
  depthPacking: THREE.RGBADepthPacking
})

let model:null | THREE.Object3D = null
gltfLoader.load('models/gears/gears.glb',(gltf) => {
  model = gltf.scene
  model.traverse((child) => {
    if (child instanceof THREE.Mesh)
    {
      if (child.name === 'outerHull')
      {
        child.material = slicedMaterial
        child.customDepthMaterial = depthSlicedMaterial
      }
      else {
        child.material = material
      }
      child.receiveShadow = true
      child.castShadow = true
    }
  })
  scene.add(model)
})


const planeMaterial = new THREE.MeshStandardMaterial()
const planeGeometry = new THREE.PlaneGeometry(6,6)
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
planeMesh.receiveShadow = true
planeMesh.position.set(-4, 0, 0)
planeMesh.quaternion.setFromEuler(
  new THREE.Euler(
    - Math.PI / 8,
    Math.PI / 2,
    0,
    'YZX'
  )
)

scene.add(planeMesh)


/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.position.set(3, 0.5, 0)
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

  if (model)
    model.rotation.y = elapsedTime * 0.1;
  
  // Update controls
  controls.update()

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
