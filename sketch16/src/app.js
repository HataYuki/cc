/**
 * Style
 */
import './style.scss'

/**
 * Template
 */
import Xdraw from './utill.js'

/**
 * Three
 */
import * as THREE from 'three'
import gsap from 'gsap'
import {Sky} from 'three/addons/objects/Sky.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
const { lerp, clamp, damp } = THREE.MathUtils

/**
 * shader
 */
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import passVertexShader from './shader/postProcessVertex.glsl'
import passFragmentShader from './shader/postProcessFragment.glsl'

/**
 * main class
 */
export default class App extends Xdraw{
  CANVAS_ID = 'canvas'
  OPENING_ANIMATION_DURATION = 0
  PIXEL_RATIO = 2
  DRAWING_BUFFER = false
  must_assets_loading_progress = 0
  assets = {
    particleTexture1: { url: '/textures/particles/1.png',type:'TEXTURE', must:true},
    particleTexture2: { url: '/textures/particles/2.png',type:'TEXTURE', must:true},
    particleTexture3: { url: '/textures/particles/3.png',type:'TEXTURE', must:true},
    particleTexture4: { url: '/textures/particles/4.png',type:'TEXTURE', must:true},
    particleTexture5: { url: '/textures/particles/5.png',type:'TEXTURE', must:true},
    particleTexture6: { url: '/textures/particles/6.png',type:'TEXTURE', must:true},
    particleTexture7: { url: '/textures/particles/7.png',type:'TEXTURE', must:false},
    particleTexture8: { url: '/textures/particles/8.png',type:'TEXTURE', must:false},
    particleTexture9: { url: '/textures/particles/9.png',type:'TEXTURE', must:false},
    particleTexture10: { url: '/textures/particles/10.png',type:'TEXTURE', must:false},
    particleTexture11: { url: '/textures/particles/11.png',type:'TEXTURE', must:false},
    particleTexture12: { url: '/textures/particles/12.png',type:'TEXTURE', must:false},
    particleTexture13: { url: '/textures/particles/13.png',type:'TEXTURE', must:false},
  }
  constructor(parser) {
    super(parser)
  }
  async appSetup() { 
    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
    this.scene.background = new THREE.Color('#000000')
    

     /**
     * ========= Texture =========
     */
    const {
      particleTexture1
    } = this.assets
    // const particleAlphaTexture = particleTexture.clone()
    // particleTexture.colorSpace = THREE.SRGBColorSpace
    


    /**
     * ========= object =========
     */
    // Particles Geometory
    // const particleGeometory = new THREE.SphereGeometry(1, 32, 32)
    this.particleGeometory = new THREE.BufferGeometry()
    this.particleCount = 500000
    const positionArray = new Float32Array(this.particleCount * 3)
    const colorArray = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount; i++)
    {
      const u = Math.random()
      const v = Math.random()
      const theta = Math.PI * 2 * u
      const phi = Math.PI * v
      const r = Math.cbrt(Math.random()) * 25

      positionArray[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      positionArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positionArray[i * 3 + 2] = r * Math.cos(phi)

      const c = lerp(0.5, 1.0, Math.random())
      colorArray[i * 3 + 0] = c
      colorArray[i * 3 + 1] = c
      colorArray[i * 3 + 2] = c
    }
    this.particleGeometory.setAttribute('position',new THREE.BufferAttribute(positionArray, 3))
    this.particleGeometory.setAttribute('color',new THREE.BufferAttribute(colorArray, 3))


    // Particle Material
    const particleMaterial = new THREE.PointsMaterial()
    particleMaterial.size = 0.1
    particleMaterial.sizeAttenuation = true
    // particleMaterial.color = new THREE.Color('#ffffff')
    particleMaterial.alphaMap = particleTexture1
    particleMaterial.transparent = true
    // particleMaterial.alphaTest = 0.001
    // particleMaterial.depthTest = false
    particleMaterial.depthWrite = false
    particleMaterial.blending = THREE.AdditiveBlending
    particleMaterial.vertexColors = true
    
    // Points
    this.particles = new THREE.Points(this.particleGeometory, particleMaterial)
    this.scene.add(this.particles)


    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshNormalMaterial()
    )
    this.scene.add(this.sphere)


    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.275)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight('#86cdff', 6)
    directionalLight.position.set(3, 2, -8)
    this.scene.add(directionalLight)


    /**
     * ========= Shadows =========
     */
    directionalLight.castShadow = true

    // Mapping
    directionalLight.shadow.mapSize.width = Math.pow(2, 8)
    directionalLight.shadow.mapSize.height = Math.pow(2, 8)
    directionalLight.shadow.camera.top = 8
    directionalLight.shadow.camera.bottom = -8
    directionalLight.shadow.camera.left = -8
    directionalLight.shadow.camera.right = 8
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 20

    /**
     * ========= load all assets =========
     */
    await this.loadAllAssetsAndMarkComplete()
  }
  debugSetup(gui) {
    const main = gui.addFolder('main')
  }
  effect(addPass,ShaderPass) {
    /**
     * ========= Base Post-Process shader =========
     */
    const basePass = new ShaderPass ({
      uniforms: {
        tDiffuse: { value: null }
      },
      vertexShader:passVertexShader,
      fragmentShader:passFragmentShader
    })
    addPass(basePass)
  }
  mousePressed(event) {
    // Handle tap events
    if (event.type === 'dblclick')
    {
      // saveCanvas(this.renderer)
    }
  }
  keyPressed(event) {
    // Handle key events
    if (event.key === '')
    {

    }
  }
  swipeStarted(dir) { }
  swipeEnded(dir) { }
  draw(time, deltaTime) {
    
    if (!this.particleGeometory) return
    
    for (let i = 0; i < this.particleCount; i++)
    {
      const pos =  this.particleGeometory.attributes.position.array
      
      pos[i * 3 + 1] = Math.sin(time + pos[i * 3 + 0])
    }
    this.particleGeometory.attributes.position.needsUpdate = true
  }
}

