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
      saveCanvas(this.renderer)
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
      preserveDrawingBuffer: true,
      antialias: false,
      powerPreference: 'high-performance',
    }
    this.renderer = new THREE.WebGLRenderer(renderOpt)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.pixelRatio))
    this.renderer.setSize(this.width, this.height, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    /**
     * scene
     */
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color().setHex(0xfcfcfc)

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
    this.camera.position.z = 1
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

    /**
     * ======= plane =======
     */
    this.debugObj.baseCol = new THREE.Color(0xe94e4e)
    const uniforms = {
      colA: {
        value: new THREE.Vector3(
         this.debugObj.baseCol.r,
         this.debugObj.baseCol.g,
         this.debugObj.baseCol.b
        )
      },
      colB: { value: new THREE.Vector3(0.5,0.5,0.5) },
      colC: { value: new THREE.Vector3(1.0,1.0,1.0) },
      colD: { value: new THREE.Vector3(0.0,0.1,0.2) },
      colT:{value:0.0}
    }
    this.mat = new THREE.RawShaderMaterial({
      uniforms,vertexShader,fragmentShader
    })
    // this.mat.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 64, 64),
      this.mat
    )
    // this.mat.wireframe = true
    this.scene.add(this.mesh)    
    /**
     * ======= plane =======
     */
    /**
     * ======= tube =======
     */
    const points = [
        new THREE.Vector3(-0.3, -0.4, 0.3),
        new THREE.Vector3(0.2,0,0.5),
        new THREE.Vector3(1,1,-1)
      ];
    const curve = new THREE.CatmullRomCurve3(points);
    
    const tubeGeo = new THREE.TubeGeometry(
        curve,          // パス
        100,            // tubularSegments
        0.01,            // radius
        32,             // radialSegments
        false           // closed
      );
      const tubeMat = new THREE.MeshStandardMaterial({ color: 'black', side: THREE.DoubleSide });
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(
        curve,          // パス
        100,            // tubularSegments
        0.01,            // radius
        32,             // radialSegments
        false           // closed
      ), this.mat);
      // this.scene.add(tube);
    /**
     * ======= tube =======
     */

    /**
     * light
     */
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.scene.add(this.ambientLight)

    /**
     * cursor
     */
    // this.currentCursor = new THREE.Vector2()
    // this.prevCursor = new THREE.Vector2()
    // window.addEventListener('mousemove', (event) => {
    //   this.currentCursor.x = event.clientX / this.width - 0.5
    //   this.currentCursor.y = -1 * (event.clientY / this.height - 0.5)
    // })

    /**
     * debug
     */
    const col = this.gui.addFolder("col")

    // colA
    col.addColor(this.debugObj, "baseCol")
      .onChange(v => {
        this.mat.uniforms.colA.value.set(v.r,v.g,v.b)
      })
    
    // colB
    col.add(this.mat.uniforms.colB.value, "x")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col range x")
     col.add(this.mat.uniforms.colB.value, "y")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col range y")
    col.add(this.mat.uniforms.colB.value, "z")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col range z")
    
    // colB
    col.add(this.mat.uniforms.colC.value, "x")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col frequency x")
     col.add(this.mat.uniforms.colC.value, "y")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col frequency y")
    col.add(this.mat.uniforms.colC.value, "z")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col frequency z")
    
    // colB
    col.add(this.mat.uniforms.colD.value, "x")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col phaseOffset x")
     col.add(this.mat.uniforms.colD.value, "y")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col phaseOffset y")
    col.add(this.mat.uniforms.colD.value, "z")
      .min(0.0)
      .max(1.0)
      .step(0.001)
      .name("col phaseOffset z")
    
    const postprocess = this.gui.addFolder('postprocess')
    postprocess
      .add(this.postProcessPass.uniforms.baseNoiseStrangth, 'value')
      .min(0.001)
      .max(0.9)
      .step(0.001)
    .name("baseNoiseStrangth")
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
