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
import {Sky} from 'three/addons/objects/Sky.js'
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
  
  OPENING_ANIMATION_DURATION = 0
  PIXELRATIO = 2
  DRAWINGBUFFER = false

  constructor(parser) {
    super()
    if (parser.getDevice().type) {
      this.deviceType = parser.getDevice().type
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
    this.renderer.shadowMap.enabled = true
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
     * ========= assets setting =========
     */
    this.assets = {
      // floor
      floorAlphaTexture: { url: '/textures/floor/alpha.webp',type:'TEXTURE', must:true},
      floorARMTexture: { url: '/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp',type:'TEXTURE', must:true},
      floorColorTexture: { url: '/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp',type:'TEXTURE', must:true},
      floorDisplacementTexture: { url: '/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp',type:'TEXTURE', must:true},
      floorNormalTexture: { url: '/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp', type: 'TEXTURE', must: true },
      // wall
      wallARMTexture: { url: '/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp',type:'TEXTURE', must:true},
      wallColorTexture: { url: '/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp',type:'TEXTURE', must:true},
      wallNormalTexture: { url: '/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp', type: 'TEXTURE', must: true },
      // root
      roofARMTexture: { url: '/textures/roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp',type:'TEXTURE', must:true},
      roofColorTexture: { url: '/textures/roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp',type:'TEXTURE', must:true},
      roofNormalTexture: { url: '/textures/roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp', type: 'TEXTURE', must: true },
      // bush
      bushARMTexture: { url: '/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_arm_1k.webp',type:'TEXTURE', must:true},
      bushColorTexture: { url: '/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_diff_1k.webp',type:'TEXTURE', must:true},
      bushNormalTexture: { url: '/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_nor_gl_1k.webp', type: 'TEXTURE', must: true },
      // grave
      graveARMTexture: { url: '/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_arm_1k.webp',type:'TEXTURE', must:true},
      graveColorTexture: { url: '/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_diff_1k.webp',type:'TEXTURE', must:true},
      graveNormalTexture: { url: '/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.webp', type: 'TEXTURE', must: true },
      // door
      doorAlphaTexture:{ url: '/textures/door/alpha.webp',type:'TEXTURE', must:true},
      doorColorTexture:{ url: '/textures/door/color.webp',type:'TEXTURE', must:true},
      doorAmbientOcclusionTexture:{ url: '/textures/door/ambientOcclusion.webp',type:'TEXTURE', must:true},
      doorRoughnessTexture: { url: '/textures/door/roughness.webp', type: 'TEXTURE', must: true },
      doorMetalnessTexture: { url: '/textures/door/metalness.webp', type: 'TEXTURE', must: true },
      doorHeightTexture:{ url: '/textures/door/height.webp',type:'TEXTURE', must:true},
      doorNormalTexture:{ url: '/textures/door/normal.webp',type:'TEXTURE', must:true},
    }

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
     * ========= Texture =========
     */
    const {
      // floor
      floorAlphaTexture,
      floorColorTexture,
      floorARMTexture,
      floorDisplacementTexture,
      floorNormalTexture,
      // wall
      wallARMTexture,
      wallColorTexture,
      wallNormalTexture,
      // roof
      roofARMTexture,
      roofColorTexture,
      roofNormalTexture,
      // bush
      bushARMTexture,
      bushColorTexture,
      bushNormalTexture,
      // grave
      graveARMTexture,
      graveColorTexture,
      graveNormalTexture,
      // door
      doorColorTexture,
      doorAlphaTexture,
      doorAmbientOcclusionTexture,
      doorRoughnessTexture,
      doorMetalnessTexture,
      doorHeightTexture,
      doorNormalTexture
    } = this.assets

    floorColorTexture.colorSpace = THREE.SRGBColorSpace
    wallColorTexture.colorSpace = THREE.SRGBColorSpace
    roofColorTexture.colorSpace = THREE.SRGBColorSpace
    bushColorTexture.colorSpace = THREE.SRGBColorSpace
    doorColorTexture.colorSpace = THREE.SRGBColorSpace
    
    floorColorTexture.repeat.set(8,8)
    floorARMTexture.repeat.set(8,8)
    floorDisplacementTexture.repeat.set(8,8)
    floorNormalTexture.repeat.set(8, 8)
    
    floorColorTexture.wrapS = THREE.RepeatWrapping
    floorARMTexture.wrapS = THREE.RepeatWrapping
    floorDisplacementTexture.wrapS = THREE.RepeatWrapping
    floorNormalTexture.wrapS = THREE.RepeatWrapping

    floorColorTexture.wrapT = THREE.RepeatWrapping
    floorARMTexture.wrapT = THREE.RepeatWrapping
    floorDisplacementTexture.wrapT = THREE.RepeatWrapping
    floorNormalTexture.wrapT = THREE.RepeatWrapping

    roofARMTexture.repeat.set(3,1)
    roofColorTexture.repeat.set(3,1)
    roofNormalTexture.repeat.set(3,1)
    
    roofARMTexture.wrapS = THREE.RepeatWrapping
    roofColorTexture.wrapS = THREE.RepeatWrapping
    roofNormalTexture.wrapS = THREE.RepeatWrapping
    /**
     * ========= object =========
     */

    // floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20, 100, 100),
      new THREE.MeshStandardMaterial({
        // wireframe:true,
        alphaMap: floorAlphaTexture,
        transparent: true,
        map: floorColorTexture,
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        displacementScale:0.1
      })
    )
    floor.rotation.x = Math.PI * -0.5
    this.scene.add(floor)

    // House container
    const house = new THREE.Group()
    this.scene.add(house)

    // walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 4),
      new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        aoMap:wallARMTexture,
        roughnessMap:wallARMTexture,
        metalnessMap: wallARMTexture,
        normalMap:wallNormalTexture
      })
    )
    walls.position.y = 2.5/2
    house.add(walls)

    // roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 1.5, 4),
      new THREE.MeshStandardMaterial({
        map: roofColorTexture,
        aoMap:roofARMTexture,
        roughnessMap:roofARMTexture,
        metalnessMap: roofARMTexture,
        normalMap:roofNormalTexture
      })
    )
    roof.position.y += 2.5 + 1.5 / 2
    roof.rotation.y = Math.PI * 0.25
    house.add(roof)

    // Door
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
      new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.15,
        displacementBias: -0.04,
        normalMap:doorNormalTexture,
        aoMap: doorAmbientOcclusionTexture,
        roughnessMap: doorRoughnessTexture,
        metalnessMap: doorMetalnessTexture,
      })
    )
    door.position.y += 2.2 / 2
    door.position.z += 4/2 + 0.01
    house.add(door)

    // Bushes
    const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
    const bushMaterial = new THREE.MeshStandardMaterial({
        color:'#ccffcc',
        map: bushColorTexture,
        aoMap:bushARMTexture,
        roughnessMap:bushARMTexture,
        metalnessMap: bushARMTexture,
        normalMap:bushNormalTexture
    })
    
    const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush1.scale.set(0.5,0.5,0.5)
    bush1.position.set(0.8, 0.2, 2.2)
    bush1.rotation.x = -0.75
    
    const bush2 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush2.scale.set(0.25,0.25,0.25)
    bush2.position.set(1.4, 0.1, 2.1)
    bush2.rotation.x = -0.75

    const bush3 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush3.scale.set(0.4,0.4,0.4)
    bush3.position.set(-0.8, 0.1, 2.2)
    bush3.rotation.x = -0.75

    const bush4 = new THREE.Mesh(bushGeometry, bushMaterial)
    bush4.scale.set(0.15,0.15,0.15)
    bush4.position.set(-1, 0.05, 2.8)
    bush4.rotation.x = -0.75
    
    house.add(bush1, bush2, bush3, bush4)
    
    // Graves
    const graveGeometory = new THREE.BoxGeometry(0.6, 0.8, 0.2)
    const graveMaterial = new THREE.MeshStandardMaterial({
      map: graveColorTexture,
      aoMap: graveARMTexture,
      roughnessMap: graveARMTexture,  
      metalnessMap: graveARMTexture,
      normalMap:graveNormalTexture
    })

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
      // grave.receiveShadow = grave.castShadow = true
      graves.add(grave)
    }

    // Sky
    this.sky = new Sky()
    this.sky.scale.set(100,100,100)
    this.scene.add(this.sky)
    this.sky.material.uniforms['turbidity'].value = 10
    this.sky.material.uniforms['rayleigh'].value = 3
    this.sky.material.uniforms['mieCoefficient'].value = 0.1
    this.sky.material.uniforms['mieDirectionalG'].value = 0.95
    this.sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95)

    // Fog
    this.scene.fog = new THREE.FogExp2('#07090d', 0.1)

    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight('#86cdff', 1.275)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight('#86cdff', 6)
    directionalLight.position.set(3,2,-8)
    this.scene.add(directionalLight)

    // Door light
    const doorLight = new THREE.PointLight('#ff7d46', 5)
    doorLight.position.set(0, 2.2, 2.5)
    house.add(doorLight)
    
    // Ghosts
    this.ghost1 = new THREE.PointLight('#8800ff', 6)
    this.ghost2 = new THREE.PointLight('#ff0088', 6)
    this.ghost3 = new THREE.PointLight('#ff0000', 6)
    this.scene.add(this.ghost1, this.ghost2, this.ghost3)

    /**
     * ========= Shadows =========
     */
    directionalLight.castShadow = true
    this.ghost1.castShadow = true
    this.ghost2.castShadow = true
    this.ghost3.castShadow = true

    walls.castShadow = walls.receiveShadow = true
    roof.castShadow = true
    floor.castShadow = floor.receiveShadow = true

    for (const grave of graves.children)
    {
      grave.castShadow = grave.receiveShadow = true
    }

    // Mapping
    directionalLight.shadow.mapSize.width =
      directionalLight.shadow.mapSize.height = Math.pow(2, 8)
    directionalLight.shadow.camera.top = 8
    directionalLight.shadow.camera.bottom = -8
    directionalLight.shadow.camera.left = -8
    directionalLight.shadow.camera.right = 8
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 20

    this.ghost1.shadow.mapSize.width =
      this.ghost1.shadow.mapSize.height = Math.pow(2, 8)
    this.ghost1.shadow.camera.far = 10

    this.ghost2.shadow.mapSize.width =
      this.ghost2.shadow.mapSize.height = Math.pow(2, 8)
    this.ghost2.shadow.camera.far = 10

    this.ghost3.shadow.mapSize.width =
      this.ghost3.shadow.mapSize.height = Math.pow(2, 8)
    this.ghost3.shadow.camera.far = 10

    
    /**
     * ========= debug =========
     */
    this.gui.add(floor.material,"displacementScale").min(0).max(1).step(0.001).name('floorDisplacementScale')
    this.gui.add(floor.material, "displacementBias").min(-1).max(1).step(0.001).name('floorDisplacementBias')

    
    
    // Sky GUI Controls
    const skyFolder = this.gui.addFolder('Sky Settings')
    skyFolder.add(this.sky.material.uniforms.turbidity, 'value').min(0).max(20).step(0.1).name('Turbidity')
    skyFolder.add(this.sky.material.uniforms.rayleigh, 'value').min(0).max(10).step(0.1).name('Rayleigh')
    skyFolder.add(this.sky.material.uniforms.mieCoefficient, 'value').min(0).max(0.5).step(0.001).name('Mie Coefficient')
    skyFolder.add(this.sky.material.uniforms.mieDirectionalG, 'value').min(0).max(1).step(0.001).name('Mie Directional G')
    
    // Sun Position Controls
    const sunFolder = skyFolder.addFolder('Sun Position')
    sunFolder.add(this.sky.material.uniforms.sunPosition.value, 'x').min(-1).max(1).step(0.001).name('Sun X')
    sunFolder.add(this.sky.material.uniforms.sunPosition.value, 'y').min(-1).max(1).step(0.001).name('Sun Y')
    sunFolder.add(this.sky.material.uniforms.sunPosition.value, 'z').min(-1).max(1).step(0.001).name('Sun Z')

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

      const ghost1Angle = elapsedTime * 0.5
      this.ghost1.position.x = Math.sin(ghost1Angle) * 4
      this.ghost1.position.z = Math.cos(ghost1Angle) * 4
      this.ghost1.position.y = Math.sin(ghost1Angle) * Math.sin(ghost1Angle * 2.34) * Math.sin(ghost1Angle * 5.67)

      const ghost2Angle = elapsedTime * 0.38 * -1
      this.ghost2.position.x = Math.sin(ghost2Angle) * 5
      this.ghost2.position.z = Math.cos(ghost2Angle) * 5
      this.ghost2.position.y = Math.sin(ghost2Angle) * Math.sin(ghost2Angle * 2.34) * Math.sin(ghost2Angle * 5.67)

      const ghost3Angle = elapsedTime * 0.23
      this.ghost3.position.x = Math.sin(ghost3Angle) * 6
      this.ghost3.position.z = Math.cos(ghost3Angle) * 6
      this.ghost3.position.y = Math.sin(ghost3Angle) * Math.sin(ghost3Angle * 2.34) * Math.sin(ghost3Angle * 5.67)
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

