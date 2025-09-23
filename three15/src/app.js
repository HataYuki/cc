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
    this.clock = new THREE.Clock()

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
      2,2,10
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
    this.mat = new THREE.MeshStandardMaterial()
    this.mat.roughness = 0.4

    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(5,5),
      this.mat
    )
    this.plane.receiveShadow = true
    this.plane.rotation.x = -90 * Math.PI / 180
    this.plane.position.y = -0.65
    this.scene.add(this.plane)

    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      this.mat
    )
    this.sphere.castShadow = true
    this.scene.add(this.sphere)

    this.sphereShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({
        color: 0x0000,
        transparent: true,
        alphaMap:simpleShadow
      })
    )
    this.sphereShadow.rotation.x = -Math.PI * 0.5
    this.sphereShadow.position.y = this.plane.position.y + 0.01
    this.scene.add(this.sphereShadow)
    
    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
    directionalLight.shadow.mapSize.width = directionalLight.shadow.mapSize.height = Math.pow(2, 10)
    directionalLight.shadow.camera.top = 2
    directionalLight.shadow.camera.right = 2
    directionalLight.shadow.camera.bottom = -2
    directionalLight.shadow.camera.left = -2
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 6
    directionalLight.shadow.radius = 10
    directionalLight.castShadow = true

    const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
    directionalLightCameraHelper.visible = false
    this.scene.add(directionalLightCameraHelper)

    directionalLight.position.set(1,0.5,0)
    this.scene.add(directionalLight)

    // spotLight
    const spotLight = new THREE.SpotLight(0xffffff, 3.6, 10, Math.PI * 0.3)
    spotLight.angle = 40 * Math.PI / 180
    spotLight.position.set(0, 2, 2)
    spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = Math.pow(2, 10)
    spotLight.shadow.camera.near = 1
    spotLight.shadow.camera.far = 6
    spotLight.castShadow = true
    this.scene.add(spotLight)
    this.scene.add(spotLight.target)

    const spotLightCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera)
    spotLightCameraHelper.visible = false
    this.scene.add(spotLightCameraHelper)

    // pointLight
    const pointLight = new THREE.PointLight(0xffffff, 2.7)
    pointLight.position.set(-1, 1, 0)
    pointLight.shadow.mapSize.width = pointLight.shadow.mapSize.height = Math.pow(2, 10)
    pointLight.shadow.camera.near = 0.1
    pointLight.shadow.camera.far = 5
    pointLight.castShadow = true
    this.scene.add(pointLight)

    const pointLightCameraHelper = new THREE.CameraHelper(pointLight.shadow.camera)
    pointLightCameraHelper.visible = false
    this.scene.add(pointLightCameraHelper)

    /**
     * ========= debug =========
     */
    this.gui.add(ambientLight,"intensity").min(0).max(10).step(0.001)
    this.gui.add(directionalLight,"intensity").min(0).max(10).step(0.001)
    this.gui.add(directionalLight.position,"x").min(0).max(10).step(0.001)
    this.gui.add(directionalLight.position,"y").min(0).max(10).step(0.001)
    this.gui.add(directionalLight.position, "z").min(0).max(10).step(0.001)
    this.gui.add(this.mat,"roughness").min(0).max(1).step(0.001)
    this.gui.add(this.mat, "metalness").min(0).max(1).step(0.001)

    /**
     * ========= load all assets =========
     */
    await loader.load()
    this.isAllAssetsLoaded = true
  }
  onUpdate(time, deltaTime, deltaScroll) {
    /**
     * ========= setting =========
     */
    const elapsedTime = this.clock.getElapsedTime() // main time
    const sequence = this.calcSequence(elapsedTime)
    const openingTime = this.OPENING_ANIMATION_DURATION / 1000
    const dt = deltaTime / 1000
    let t = 0
    if (sequence.isLoading) t = sequence.timeLoading;
    if (sequence.isPostMust) t = sequence.timePostMust;
    if (sequence.isMain) t = sequence.timeMain;
    
    /**
    * ========= start main code =========
    */    
    this.controls.update() //update controls

    if (sequence.isLoading)
    { // loading animation
      this.camera.position.z = 10
    }
    if (sequence.isPostMust)
    { // opening animation
      this.controls.enabled = false
      damp(this.camera.position, 'z', 4, 0.2, dt)
    }
    if (sequence.isMain)
    { // main loop animation
      this.controls.enabled = true
    }

    // circle animation
    const x = Math.sin(t)
    const z = Math.cos(t)
    const y = Math.abs(Math.sin(t * 3))

    this.sphere.position.x = x * 2
    this.sphere.position.z = z * 2
    this.sphere.position.y = y
    
    this.sphereShadow.position.x = this.sphere.position.x
    this.sphereShadow.position.z = this.sphere.position.z
    this.sphereShadow.material.opacity = (1 - y) * 0.5
    
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

