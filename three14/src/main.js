/**
 * Style
 */
import './style.scss'

/**
 * Template
 */
import Xapp from './utill.js'
import { domReady, saveCanvas } from './utill.js'

/**
 * Three
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import {RectAreaLightHelper} from 'three/examples/jsm/helpers/RectAreaLightHelper.js'

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

class App extends Xapp {
  constructor() {
    super()
    /**
     * loader
     */
    const loadingManager = new THREE.LoadingManager()
    const texLoader = new THREE.TextureLoader(loadingManager)
    const rgbeLoader = new RGBELoader(loadingManager)
    const fontLoader = new FontLoader(loadingManager)

    loadingManager.onStart = () => {}
    loadingManager.onProgress = () => {}
    loadingManager.onLoad = () => {}
    loadingManager.onError = e => console.log(e)

    /**
     * GUI
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
    // Handle swipe events
  }
  onSetup() {
    /**
     * setup code
     */
    this.canvas = document.getElementById('canvas')

    /**
     * clock
     */
    this.clock = new THREE.Clock()

    /**
     * renderer
     */
    this.pixelRatio = 2
    const renderOpt = {
      canvas: this.canvas,
      preserveDrawingBuffer: false,
      antialias: false,
      powerPreference: 'high-performance',
    }
    this.renderer = new THREE.WebGLRenderer(renderOpt)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.pixelRatio))
    this.renderer.setSize(this.width, this.height, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    /**
     * scene
     */
    this.scene = new THREE.Scene()

    /**
     * Axes helper
     */
    const axesHelper = new THREE.AxesHelper()
    // this.scene.add(axesHelper)

    /**
     * camera
     */
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    )
    this.camera.position.set(
      1,1,2
    )
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))
    this.scene.add(this.camera)

    /**
     * Post processing
     */
    this.effectComposer = new EffectComposer(this.renderer)
    this.effectComposer.setSize(this.size.x, this.size.y)
    this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.pixelRatio))

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
     * controls
     */
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    /**
     * object
     */
    this.mat = new THREE.MeshStandardMaterial()
    this.mat.roughness = 0.4

    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(5,5),
      this.mat
    )
    this.plane.rotation.x = -90 * Math.PI / 180
    this.plane.position.y = -0.65
    this.scene.add(this.plane)


    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      this.mat
    )
    this.sphere.position.x = -1.5
    this.scene.add(this.sphere)

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.75, 0.75),
      this.mat
    )
    this.box.position.set(0.0,0.1,0)
    this.scene.add(this.box)

    this.torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.2, 32, 64),
      this.mat
    )
    this.torus.position.x = 1.5
    this.scene.add(this.torus)
  

    /**
     * light
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.9)
    directionalLight.position.set(1,0.25,0)
    this.scene.add(directionalLight)

    const hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 0.9)
    this.scene.add(hemisphereLight)

    const pointLight = new THREE.PointLight(0xff9000, 1.5,3)
    pointLight.position.set(1,-0.5,1)
    this.scene.add(pointLight)

    const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 2, 1, 1)
    rectAreaLight.position.set(-1.5, 0, 1.5)
    rectAreaLight.lookAt(new THREE.Vector3(0,0,0))
    this.scene.add(rectAreaLight)

    const spotLight = new THREE.SpotLight(0x78ff00, 4.5, 10, Math.PI * 0.1, 0.25, 1)
    spotLight.position.set(0, 2, 3)
    spotLight.target.position.x = -0.75
    this.scene.add(spotLight)
    this.scene.add(spotLight.target)

    /**
     * helpers
     */
    const hemsphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 0.2)
    this.scene.add(hemsphereLightHelper)

    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2)
    this.scene.add(directionalLightHelper)

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2)
    this.scene.add(pointLightHelper)

    const spotLightHelper = new THREE.SpotLightHelper(spotLight)
    this.scene.add(spotLightHelper)

    const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight)
    this.scene.add(rectAreaLightHelper)

    /**
     * debug
     */

    
  }
  onUpdate(time, deltaTime, deltaScroll) {
    /**
     * ========= setup =========
     */
    const elapsedTime = this.clock.getElapsedTime() // time


    /**
    * ========= start main cord =========
    */
    
    this.controls.update() //update controls

    this.box.rotation.x += 0.001
    this.box.rotation.y += 0.001

    this.torus.rotation.x += 0.001
    this.torus.rotation.y += 0.001
    
    /**
    * =========  end main cord  =========
    */
    

    /**
    * ========= handle resize viewport =========
    */
    if (this.needUpdateResize)
    {
      this.camera.aspect = this.size.x / this.size.y
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.pixelRatio))
      this.renderer.setSize(this.size.x, this.size.y,false)
      this.camera.updateProjectionMatrix()

      this.effectComposer.setSize(this.size.x, this.size.y)
      this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.pixelRatio))
    }

    /**
     * ========= render =========
     */
    this.renderer.render(this.scene, this.camera)
    this.effectComposer.render()
  }
}

const app = new App()
domReady(() => {
  app.onSetup()
})
