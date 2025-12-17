import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { Sky } from 'three/addons/objects/Sky.js'

/**
 * Shader
 */
import FireworksVertexShader from './shaders/fireworks/vertex.glsl'
import FireworksFragmentShader from './shaders/fireworks/fragment.glsl'

/**
 * Canvas
 */
const canvas = document.createElement('canvas')
canvas.setAttribute('id', 'webgl')
document.getElementById('app')?.append(canvas)

/**
 * Init
 */
const sizes = new THREE.Vector2(window.innerWidth, window.innerHeight)
let pixelRatio = Math.min(devicePixelRatio, 2)
const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
  .multiplyScalar(pixelRatio)
let aspect = sizes.x / sizes.y

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
const scene = new THREE.Scene()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 100)
camera.position.set(1, 0, 2)
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
renderer.setSize(sizes.x, sizes.y, false)
renderer.setPixelRatio(pixelRatio)

// Tone mapping
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3

// Shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

/**
 * Resize
 */
window.addEventListener('resize', () => {
  pixelRatio = Math.min(devicePixelRatio, 2)
  sizes.set(window.innerWidth, window.innerHeight)
  resolution.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio)
  aspect = sizes.x / sizes.y

  // Update camera
  camera.aspect = aspect
  camera.updateProjectionMatrix()

  // Update Renderer
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(sizes.x, sizes.y)
})

/**
 * LoadTexture
 */
const textures = await Promise.all([
  textureLoader.loadAsync('textures/particles/0.png'),
  textureLoader.loadAsync('textures/particles/1.png'),
  textureLoader.loadAsync('textures/particles/2.png'),
  textureLoader.loadAsync('textures/particles/3.png'),
  textureLoader.loadAsync('textures/particles/4.png'),
  textureLoader.loadAsync('textures/particles/5.png'),
  textureLoader.loadAsync('textures/particles/6.png'),
  textureLoader.loadAsync('textures/particles/7.png'),
  textureLoader.loadAsync('textures/particles/8.png'),
])

/**
 * Fireworks
 */
const createFireworks = (
  count: number,
  position: THREE.Vector3,
  size: number,
  texture: THREE.Texture<HTMLImageElement>, 
  radius: number,
  color: THREE.Color
) =>
{
  // Geometry
  const positionsBuffer = new Float32Array(count * 3)
  const sizesBuffer = new Float32Array(count * 1)
  const timeMultiplierBuffer = new Float32Array(count * 1)

  for (let i = 0; i < count; i++)
  {
    const i3 = i * 3

    const spherical = new THREE.Spherical(
      radius * (0.75 + Math.random() * 0.25),
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2
    )
    const position = new THREE.Vector3()
    position.setFromSpherical(spherical)

    positionsBuffer[i3 + 0] = position.x
    positionsBuffer[i3 + 1] = position.y
    positionsBuffer[i3 + 2] = position.z

    sizesBuffer[i] = Math.random()

    timeMultiplierBuffer[i] = 1 + Math.random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsBuffer, 3))
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesBuffer, 1))
  geometry.setAttribute('aTimeMultiplier', new THREE.Float32BufferAttribute(timeMultiplierBuffer, 1))

  // Material
  texture.flipY = false
  const material = new THREE.ShaderMaterial({
    vertexShader:FireworksVertexShader,
    fragmentShader: FireworksFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(size),
      uResolution: new THREE.Uniform(resolution),
      uTexture: new THREE.Uniform(texture),
      uColor: new THREE.Uniform(color),
      uProgress: new THREE.Uniform(0)
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  // Points
  const points = new THREE.Points(geometry, material)
  points.position.copy(position)
  scene.add(points)

  // destroy
  const destroy = () =>
  {
    scene.remove(points)
    geometry.dispose()
    material.dispose()
  }

  // Animate
  gsap.to(
    material.uniforms.uProgress,
    { value: 1 , duration: 3, ease: 'linear', onComplete: destroy }
  )
}

const createRandomFireworks = () =>
{
  const count = Math.round(400 + Math.random() * 1000);
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    Math.random(),
    (Math.random() - 0.5) * 2
  );
  const size = 0.1 + Math.random() * 0.1
  const texture = textures[Math.floor(Math.random() * textures.length)]
  const radius = 0.5 + Math.random()
  const color = new THREE.Color()
  color.setHSL(Math.random(), 1, 0.7)

  createFireworks(
    count,
    position,
    size,
    texture,
    radius,
    color
  )
}

createRandomFireworks()

window.addEventListener('click', createRandomFireworks)

/**
 * Sky
 */
// Add Sky
const sky = new Sky();
sky.scale.setScalar( 450000 );
scene.add( sky );

const sun = new THREE.Vector3();

/// GUI
const skyParameters = {
	turbidity: 10,
	rayleigh: 3,
	mieCoefficient: 0.005,
	mieDirectionalG: 0.95,
	elevation: -2.2,
	azimuth: 180,
	exposure: renderer.toneMappingExposure
};

function updateSky() {

	const uniforms = sky.material.uniforms;
	uniforms[ 'turbidity' ].value = skyParameters.turbidity;
	uniforms[ 'rayleigh' ].value = skyParameters.rayleigh;
	uniforms[ 'mieCoefficient' ].value = skyParameters.mieCoefficient;
	uniforms[ 'mieDirectionalG' ].value = skyParameters.mieDirectionalG;

	const phi = THREE.MathUtils.degToRad( 90 - skyParameters.elevation );
	const theta = THREE.MathUtils.degToRad( skyParameters.azimuth );

	sun.setFromSphericalCoords( 1, phi, theta );

	uniforms[ 'sunPosition' ].value.copy( sun );

	renderer.toneMappingExposure = skyParameters.exposure;
	renderer.render( scene, camera );
}

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
const tweakParameters = {
}
pane.addBinding(renderer.info.memory,'geometries', { readonly : true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })
pane.addBinding(camera.position, 'x', { label:'cam x', readonly: true })
pane.addBinding(camera.position, 'y', { label:'cam y', readonly: true })
pane.addBinding(camera.position, 'z', { label: 'cam z', readonly: true })

pane.addBinding( skyParameters, 'turbidity', {min: 0.0, max: 20.0, step: 0.1 } )
pane.addBinding( skyParameters, 'rayleigh', {min: 0.0, max: 4, step: 0.001 } )
pane.addBinding( skyParameters, 'mieCoefficient', { min: 0.0, max: 0.1, step: 0.001 } )
pane.addBinding( skyParameters, 'mieDirectionalG', { min: 0.0, max: 1, step: 0.001 } )
pane.addBinding( skyParameters, 'elevation', { min: -3, max: 90, step: 0.01 } )
pane.addBinding( skyParameters, 'azimuth', { min: - 180, max: 180, step: 0.1 } )
pane.addBinding( skyParameters, 'exposure', { min: 0, max: 1, step: 0.0001 } )
pane.on('change', updateSky )

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
