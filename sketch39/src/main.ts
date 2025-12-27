import './style.scss'

/**
 * Import Three
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'

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
camera.position.set(0, 0, 2)
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
pane.addBinding(renderer.info.memory, 'geometries', { readonly: true } )
pane.addBinding(renderer.info.memory, 'textures', { readonly: true })

/**
 * LoadTexture
 */
const texture = await textureLoader.loadAsync('textures/picture-1.png')

/**
 * Load gltf
 */
const gltf = await gltfLoader.loadAsync('models/particleObjects/particleObjects.glb')

/**
 * Particles
 */
const particles: any = {}
particles.index = 0

// Positions
const positions = gltf.scene.children.map(child => {
  if (child instanceof THREE.Mesh)
  {
    return child.geometry.attributes.position
  }
})

particles.maxCount = positions
  .reduce((maxCount, position) => (position.count > maxCount)
    ? position.count
    : maxCount,
    0)
  
particles.positions = []
for (const position of positions)
{
  const originalArray = position.array
  const newArray = new Float32Array(particles.maxCount * 3)

  for (let i = 0; i < particles.maxCount; i++)
  {
    const i3 = i * 3

    if (i3 < originalArray.length)
    {
      newArray[i3 + 0] = originalArray[i3 + 0]
      newArray[i3 + 1] = originalArray[i3 + 1]
      newArray[i3 + 2] = originalArray[i3 + 2]
    }
    else
    {
      const randomIndex = Math.floor(position.count * Math.random()) * 3
      newArray[i3 + 0] = originalArray[randomIndex + 0]
      newArray[i3 + 1] = originalArray[randomIndex + 1]
      newArray[i3 + 2] = originalArray[randomIndex + 2]
    }
  }
  particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3))
}

// Geometry
const sizesBuffer = new Float32Array(particles.maxCount)
for (let i = 0; i < particles.maxCount; i++)
{
  sizesBuffer[i] = Math.random()
}

particles.geometry = new THREE.BufferGeometry()
particles.geometry.setAttribute('position', particles.positions[particles.index])
particles.geometry.setAttribute('aPositionTarget', particles.positions[3])
particles.geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesBuffer, 1))

// Material
particles.colorA = '#ff7300'
particles.colorB = '#0091ff'
particles.material = new THREE.ShaderMaterial({
  vertexShader:particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    uProgress:new THREE.Uniform(0),
    uSize: new THREE.Uniform(0.05),
    uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
    uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        size.x * renderer.getPixelRatio(),
        size.y * renderer.getPixelRatio(),
      )
    )
  },
  blending: THREE.AdditiveBlending,
  depthWrite: false
})

// Tweak color
pane.addBinding(particles,'colorA', {view: 'hex'})
pane.addBinding(particles, 'colorB', { view: 'hex' })
pane.on('change', ()=>
{  
  particles.material.uniforms.uColorA.value.set(particles.colorA)
  particles.material.uniforms.uColorB.value.set(particles.colorB)
})
  
// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
particles.points.frustumCulled = false
scene.add(particles.points)

// Methods
particles.morph = (index:number) =>
{
  // Update attribute
  particles.geometry.attributes.position = particles.positions[particles.index]
  particles.geometry.attributes.aPositionTarget = particles.positions[index]

  // Aimate uProgress
  // console.log(particles.material.un)
  gsap.fromTo(
    particles.material.uniforms.uProgress,
    { value: 0 },
    { value: 1 ,duration: 3, ease: 'linear'}
  )

  // Save index
  particles.index = index
}
particles.morph0 = () => particles.morph(0)
particles.morph1 = () => particles.morph(1)
particles.morph2 = () => particles.morph(2)
particles.morph3 = () => particles.morph(3)

// Tweak
pane.addBinding(particles.material.uniforms.uSize, 'value', {label:'uSize',min:0.01, max:0.1, step: 0.0001})
pane.addBinding(particles.material.uniforms.uProgress, 'value', { label: 'uProgress', min: 0, max: 1, step: 0.001 })
pane.addBinding(particles.material.uniforms.uProgress, 'value', { label: 'uProgress', min: 0, max: 1, step: 0.001 ,readonly: true})
const morph0Btn = pane.addButton({ title: 'morph0', label: 'morph' })
morph0Btn.on('click', ()=> particles.morph0())
const morph1Btn = pane.addButton({title: 'morph1', label:'morph'})
morph1Btn.on('click', ()=> particles.morph1())
const morph2Btn = pane.addButton({title: 'morph2', label:'morph'})
morph2Btn.on('click', ()=> particles.morph2())
const morph3Btn = pane.addButton({title: 'morph3', label:'morph'})
morph3Btn.on('click', ()=> particles.morph3())


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
  particles
    .material
    .uniforms
    .uResolution
    .value
    .set(
      size.x * renderer.getPixelRatio(),
      size.y * renderer.getPixelRatio(),
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

  // Rendering
  renderer.render(scene, camera)

  // Fps end
  fps.end()
}
renderer.setAnimationLoop(tick)
