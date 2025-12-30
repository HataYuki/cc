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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
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
const textureLoader = new THREE.TextureLoader()
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


/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(1.30, 0.66, 2.38)
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
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(size.x, size.y, false)
renderer.setPixelRatio(pixelRatio)

// Tweak 
pane.addBinding(renderer.info.memory, 'geometries', { readonly: true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })

/**
 * Post processing
 */
const renderTarget = new THREE.WebGLRenderTarget(
  800,
  600,
  {
    samples: renderer.getPixelRatio() === 1 ? 2 : 0
  }
)
const effectComposer = new EffectComposer(renderer,renderTarget)
effectComposer.setPixelRatio(renderer.getPixelRatio())
effectComposer.setSize(size.x, size.y)

// Render pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// dotscreen pass
const dotScreenPass = new DotScreenPass()
dotScreenPass.enabled = false
effectComposer.addPass(dotScreenPass)

// Glitch pass
const glitchPass = new GlitchPass()
glitchPass.goWild = false
glitchPass.enabled = false
effectComposer.addPass(glitchPass)

// RGB Shift pass
const rgbShiftPass = new ShaderPass(RGBShiftShader)
rgbShiftPass.enabled = false
effectComposer.addPass(rgbShiftPass)

// Gamma Correction pass
const gammacorectionPass = new ShaderPass(GammaCorrectionShader)
effectComposer.addPass(gammacorectionPass)

// Unreal Bloom pass
const unrealBloomPass = new UnrealBloomPass(
  size,
  0.3,
  1,
  0.6
)
effectComposer.addPass(unrealBloomPass)
pane.addBinding(unrealBloomPass, 'enabled')
pane.addBinding(unrealBloomPass, 'strength', { min: 0, max: 2, step:0.001})
pane.addBinding(unrealBloomPass, 'radius', { min: 0, max: 2, step:0.001})
pane.addBinding(unrealBloomPass, 'threshold', { min: 0, max: 1, step: 0.001 })

// Tint pass
const color = {
  tint:'#000000',
}
const TintShader = 
{
  uniforms: {
    tDiffuse: new THREE.Uniform(null),
    uTint: new THREE.Uniform(new THREE.Color(color.tint))
  },
  vertexShader: `
  varying vec2 vUv;

  void main()
  {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // Varying
    vUv = uv;
  }
  `,
  fragmentShader: `
  uniform sampler2D tDiffuse;
  uniform vec3 uTint;

  varying vec2 vUv;

  void main()
  {
    vec4 color = texture(tDiffuse, vUv);
    color.rgb += uTint;
    gl_FragColor = color;
  }
  `
}
const tintPass = new ShaderPass(TintShader)
effectComposer.addPass(tintPass)
pane.addBinding(color, 'tint', { view: 'hex' })
pane.on('change', () =>
{
  tintPass.material.uniforms.uTint.value.set(color.tint)
})

// Displacement pass
const Displacement = 
{
  uniforms: {
    tDiffuse: new THREE.Uniform(null),
    uNormalMap: new THREE.Uniform(null)
  },
  vertexShader: `
  varying vec2 vUv;

  void main()
  {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // Varying
    vUv = uv;
  }
  `,
  fragmentShader: `
  uniform sampler2D tDiffuse;
  uniform sampler2D uNormalMap;

  varying vec2 vUv;

  void main()
  {
    vec3 normalColor = texture(uNormalMap, vUv).xyz * 2.0 - 1.0;
    vec2 newUv = vUv + normalColor.xy * 0.1;
    newUv.x -= 0.1;
    vec4 color = texture(tDiffuse, newUv);

    vec3 lightDirection = normalize(vec3(-1.0, 1.0, 0.0));
    float lightNess = clamp(dot(normalColor, lightDirection), 0.0, 1.0);

    color.rgb += lightNess * 2.0;

    gl_FragColor = color;
  }
  `
}
const displacementPass = new ShaderPass(Displacement)
displacementPass.material.uniforms.uNormalMap.value = textureLoader.load('textures/interfaceNormalMap.png')
effectComposer.addPass(displacementPass)

// SMAA
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2)
{
  const smaaPass = new SMAAPass()
  effectComposer.addPass(smaaPass)
}

/**
 * Load model
 */
const gltf = await gltfLoader.loadAsync('models/DamagedHelmet/DamagedHelmet.gltf')
scene.add(gltf.scene)

/**
 * Directional light
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 4)
directionalLight.position.set(1, 5, 3)
// Shadows
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0.01
directionalLight.shadow.camera.far = 20
directionalLight.shadow.camera.left = -12
directionalLight.shadow.camera.right = 12
directionalLight.shadow.camera.top = -12
directionalLight.shadow.camera.bottom = 12

const shadowMapSize = Math.pow(2,12)
directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
directionalLight.shadow.normalBias = 0.032
directionalLight.shadow.bias = 0.001

scene.add(directionalLight)

// Helper
const directionalLightHelper = new THREE.CameraHelper(
  directionalLight.shadow.camera
)

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

  // Update effect composer
  effectComposer.setPixelRatio(pixelRatio)
  effectComposer.setSize(size.x, size.y)
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
  
  // Update controls
  controls.update()

  // Rendering
  // renderer.render(scene, camera)
  effectComposer.render(deltaTime)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
