/**
 * Style
 */
import './style.scss'

/**
 * Template
 */
import Xapp from './utill.js'
import {saveCanvas, AssetLoader } from './utill.js'

/**
 * Three
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {damp} from 'maath/easing'
import gsap from 'gsap'
import GUI from 'lil-gui'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
const {lerp,clamp} = THREE.MathUtils

/**
 * Post processer
 */
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

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
export default class App extends Xapp {
  deviceType = 'pc'
  isMustAssetsLoaded = false
  isAllAssetsLoaded = false
  mustAssetsLoadedTime = -1
  allAssetsLoadedTime = -1
  mustAssetsLoadingProgress = 0
  
  OPENING_ANIMATION_DURATION = 1500
  PIXELRATIO = 2
  DRAWINGBUFFER = false

  constructor(parser) {
    super()
    if (parser.getDevice().type) {
      this.deviceType = parser.getDevice().type
    }
    /**
     * ========= assets setting =========
     */
    this.assets = {
      bakedshadow: { url: '/textures/bakedShadow.jpg',type:'TEXTURE', must:true},
      simpleShadow: { url: '/textures/simpleShadow.jpg',type:'TEXTURE', must:true},
    }
  
    /**
     * ========= GUI =========
     */
    this.gui = new GUI({
      title: 'debug',
      width: 300,
      closeFolders: false,
    })
    this.gui.close()
    this.gui.hide()
    this.debugObj = {}
  }
  async onSetup() {
    /**
     * ========= setup code =========
     */
    this.canvas = document.getElementById('canvas')

    /**
     * ========= clock =========
     */
    this.timer = new THREE.Timer()

    /**
     * ========= renderer =========
     */
    
    const renderOpt = {
      canvas: this.canvas,
      preserveDrawingBuffer: this.DRAWINGBUFFER,
      antialias: false,
      powerPreference: 'high-performance',
    }
      
    this.renderer = new THREE.WebGLRenderer(renderOpt)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXELRATIO))
    this.renderer.setSize(this.width, this.height, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      // this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    
    /**
     * ========= scene =========
     */
    this.scene = new THREE.Scene()

    /**
     * ========= Axes helper =========
     */
    const axesHelper = new THREE.AxesHelper()
    // this.scene.add(axesHelper)

    /**
     * ========= camera =========
     */
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    )
    this.camera.position.set(
      4,2,3
    )
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))
    this.scene.add(this.camera)
    
    /**
     * ========= Post processing =========
     */
    this.effectComposer = new EffectComposer(this.renderer)
    this.effectComposer.setSize(this.size.x, this.size.y)
    this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXELRATIO))

    const renderPass = new RenderPass(this.scene, this.camera)
    this.effectComposer.addPass(renderPass)

    // FXAA
    const fxaaPass = new FXAAPass()
    this.effectComposer.addPass(fxaaPass)

    // post process shader
    const passUniforms = {
      tDiffuse: { value: null },
      baseNoiseStrangth: { value:0.2}
    }
    this.postProcessPass = new ShaderPass({
      uniforms: passUniforms,
      vertexShader:passVertexShader,
      fragmentShader:passFragmentShader
    })
    this.effectComposer.addPass(this.postProcessPass)
    
    /**
     * ========= controls =========
     */
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    /**
     * ========= loader =========
     */
    const loader = new AssetLoader(this.assets)
    loader
      .on('mustAssetsLoading', p => {
        this.mustAssetsLoadingProgress = p.progress
      })
      .on('allAssetsLoading', p => {
        // console.log('progress',p)
      })
    
     /**
     * ========= load must assets =========
     */
    await loader.whenMustLoad()
    this.isMustAssetsLoaded = true

    /**
     * ========= texture =========
     */
    const bakedShadow = this.assets.bakedshadow.data
    const simpleShadow = this.assets.simpleShadow.data
    bakedShadow.colorSpace = THREE.SRGBColorSpace
    simpleShadow.colorSpace = THREE.SRGBColorSpace
    
    /**
     * ========= object =========
     */

    // floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial()
    )
    floor.rotation.x = Math.PI * -0.5
    this.scene.add(floor)

    // House container
    const house = new THREE.Group()
    this.scene.add(house)

    // walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 4),
      new THREE.MeshStandardMaterial()
    )
    walls.position.y = 2.5/2
    house.add(walls)

    // roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 1.5, 4),
      new THREE.MeshStandardMaterial()
    )
    roof.position.y += 2.5 + 1.5 / 2
    roof.rotation.y = Math.PI * 0.25
    house.add(roof)

    // Door
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshStandardMaterial()
    )
    door.position.y += 2.2 / 2
    door.position.z += 4/2 + 0.01
    house.add(door)

    // Bushes
    const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
    const bushMaterial = new THREE.MeshStandardMaterial()
    
    const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush1.scale.set(0.5,0.5,0.5)
    bush1.position.set(0.8,0.2,2.2)
    
    const bush2 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush2.scale.set(0.25,0.25,0.25)
    bush2.position.set(1.4,0.1,2.1)

    const bush3 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush3.scale.set(0.4,0.4,0.4)
    bush3.position.set(-0.8,0.1,2.2)

    const bush4 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush4.scale.set(0.15,0.15,0.15)
    bush4.position.set(-1, 0.05, 2.8)
    
    house.add(bush1, bush2, bush3, bush4)
    
    // Graves
    const graveGeometory = new THREE.BoxGeometry(0.6, 0.8, 0.2)
    const graveMaterial = new THREE.MeshStandardMaterial()

    const graves = new THREE.Group()
    this.scene.add(graves)

    for (let i = 0; i < 30; i++){
      // Mesh
      const grave = new THREE.Mesh(graveGeometory, graveMaterial)

      // position
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 4
      const x = Math.sin(angle) * radius
      const z = Math.cos(angle) * radius
      grave.position.x = x
      grave.position.z = z
      grave.position.y += 0.4
      grave.rotation.x = (Math.random() - 0.5) * 0.4
      grave.rotation.y = (Math.random() - 0.5) * 0.4
      grave.rotation.z = (Math.random() - 0.5) * 0.4

      
      // Add to grave group
      graves.add(grave)
    }

    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
    directionalLight.position.set(3,2,-8)
    this.scene.add(directionalLight)

    /**
     * ========= debug =========
     */

    /**
     * ========= load all assets =========
     */
    await loader.load()
    this.isAllAssetsLoaded = true
  }
  onUpdate(time, deltaTime, deltaScroll) {
    /**
     * ========= timer =========
     */
    this.timer.update()
    const elapsedTime = this.timer.getElapsed()
    const sequence = this.calcSequence(elapsedTime)
    const openingTime = this.OPENING_ANIMATION_DURATION / 1000
    const dt = deltaTime / 1000
    let t = 0

    /**
     * ========= setting =========
     */
    if (sequence.isLoading) t = sequence.timeLoading;
    if (sequence.isPostMust) t = sequence.timePostMust;
    if (sequence.isMain) t = sequence.timeMain;
    
    /**
    * ========= start main code =========
    */    
    this.controls.update() //update controls

    if (sequence.isLoading)
    { // loading animation
      
    }
    if (sequence.isPostMust)
    { // opening animation
      
    }
    if (sequence.isMain)
    { // main loop animation
      
    }
    
    /**
    * ========= handle resize viewport =========
    */
    if (this.needUpdateResize)
    {
      this.camera.aspect = this.size.x / this.size.y
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXELRATIO))
      this.renderer.setSize(this.size.x, this.size.y,false)
      this.camera.updateProjectionMatrix()

      this.effectComposer.setSize(this.size.x, this.size.y)
      this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXELRATIO))
    }

    /**
     * ========= render =========
     */
    this.renderer.render(this.scene, this.camera)
    this.effectComposer.render()

    /**
     * ========= clear Frag =========
     */
    this.isMustAssetsLoaded = false
    this.isAllAssetsLoaded = false
  }
  onTap(event) {
    // Handle tap events
    if (event.type === 'dblclick')
    {
      // saveCanvas(this.renderer)
    }
  }
  onKey(event) {
    if (event.key === 'h')
    {
      this.gui.show(this.gui._hidden)
    }
  }
  onSwipe(dir) {
    // console.log('swipe',dir)
  }
  onSwipeEnd(dir) {
    // console.log('swipe end',dir)
  }
  calcSequence(elapsedTime) {
    const result = {
      timeLoading: 0,
      timePostMust: 0,
      timeMain: 0,
      isLoading: false,
      isPostMust: false,
      isMain:false
    }
    const recordTimeFrag1 = (this.isMustAssetsLoaded && this.mustAssetsLoadedTime === -1)
    const recordTimeFrag2 = (this.isAllAssetsLoaded && this.allAssetsLoadedTime === -1)
    const opening = this.OPENING_ANIMATION_DURATION / 1000

    if (recordTimeFrag1) this.mustAssetsLoadedTime = elapsedTime;  
    if (recordTimeFrag2) this.allAssetsLoadedTime = elapsedTime;

    let postMustTime = elapsedTime - this.mustAssetsLoadedTime
    let postMainTime = elapsedTime - this.allAssetsLoadedTime

    if (this.allAssetsLoadedTime < opening) {
      postMainTime = elapsedTime - opening 
    }
    
    if (
      this.mustAssetsLoadedTime < 0 &&
      this.allAssetsLoadedTime < 0
    ) {
      result.timeLoading = elapsedTime
      // result.timePostMust = 0
      // result.timeMain = 0
      result.isLoading = true
      result.isPostMust = false
      result.isMain = false
    }else if (
      this.mustAssetsLoadedTime >= 0 &&
      this.allAssetsLoadedTime < 0
    ) {
      // result.timeLoading = elapsedTime
      result.timePostMust = postMustTime
      // result.timeMain = 0
      result.isLoading = false
      result.isPostMust = true
      result.isMain = false
    } else if (
      this.mustAssetsLoadedTime >= 0 &&
      this.allAssetsLoadedTime >= 0 &&
      postMustTime < opening
    ) {
      // result.timeLoading = elapsedTime
      result.timePostMust = postMustTime
      // result.timeMain = 0
      result.isLoading = false
      result.isPostMust = true
      result.isMain = false
    } else {
      // result.timeLoading = elapsedTime
      // result.timePostMust = postMustTime
      result.timeMain = postMainTime
      result.isLoading = false
      result.isPostMust = false
      result.isMain = true
    }
    
    return result
  }
}

