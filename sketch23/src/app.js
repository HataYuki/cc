/**
 * Template
 */
import Xdraw from './core/__utils.js'

/**
 * Three
 */
import * as THREE from 'three'
import gsap from 'gsap'
import { Sky } from 'three/addons/objects/Sky.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js'

/**
 * maath
 */
import { damp, damp2 } from 'maath/easing'

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
export default class App extends Xdraw {
  PIXEL_RATIO = 2
  TWEAK_WIDTH = 250
  RENDERER_OPT = {
    preserveDrawingBuffer: false,
    antialias: false,
    powerPreference: 'high-performance',
    alpha: true,
  }
  assets = {}
  params = {}
  scrollPos = new THREE.Vector2(0, 0)
  constructor(parser) {
    super(parser)
  }
  async appSetup() {
    this.camera.position.set(3, 3, 4)
    this.controls.target = new THREE.Vector3(0, 3.5, 0)

    /**
     * Loaer
     */
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    const cubeTextureLoader = new THREE.CubeTextureLoader()
    const hdrLoader = new HDRLoader()
    const textureLoader = new THREE.TextureLoader()
    hdrLoader.setDataType(THREE.FloatType)
    dracoLoader.setDecoderPath('/draco/')
    gltfLoader.setDRACOLoader(dracoLoader)

    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()

    /**
     * ========= Assets =========
     */
    const {} = this.assets

    /**
     * Emviroment map
     */
    // LDR cube texture
    // const enviromentMap = cubeTextureLoader.load([
    //   'textures/environmentMaps/0/px.png',
    //   'textures/environmentMaps/0/nx.png',
    //   'textures/environmentMaps/0/py.png',
    //   'textures/environmentMaps/0/ny.png',
    //   'textures/environmentMaps/0/pz.png',
    //   'textures/environmentMaps/0/nz.png',
    // ])
    // this.scene.environment = enviromentMap
    // this.scene.background = enviromentMap
    // this.scene.backgroundIntensity = 17
    // this.scene.environmentIntensity = 12
    // this.scene.backgroundBlurriness = 0.05

    // HDR equirectangular
    hdrLoader.load(
      // 'textures/environmentMaps/0/studio_small_01_2k.hdr',
      'textures/environmentMaps/blender-2k.hdr',
      environmentMap => {
        environmentMap.mapping = THREE.EquirectangularReflectionMapping
        environmentMap.colorSpace = THREE.SRGBColorSpace
        // this.scene.environment = environmentMap
        this.scene.background = environmentMap
      }
    )

    // Ground projected skybox
    // hdrLoader.load('textures/environmentMaps/1/2k.hdr', environment => {
    //   environment.mapping = THREE.EquirectangularReflectionMapping
    //   // this.scene.background = environment
    //   this.scene.environment = environment

    //   // SSAOが有効だとskyboxに変な影が出る。
    //   this.effectComposer.passes[2].enabled = false

    //   // Skybox
    //   const skybox = new GroundedSkybox(environment, 15, 70, 32)
    //   // skybox.material.wireframe = true
    //   skybox.position.y = 15
    //   this.scene.add(skybox)
    // })

    /**
     * Real time environment map
     */
    // const environmentMap = textureLoader.load(
    //   'textures/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg'
    // )
    // environmentMap.mapping = THREE.EquirectangularReflectionMapping
    // environmentMap.colorSpace = THREE.SRGBColorSpace

    // this.scene.background = environmentMap

    // Holy donut
    this.holyDonut = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) })
    )
    this.holyDonut.position.y = 3.5
    this.holyDonut.layers.enable(1)
    this.scene.add(this.holyDonut)

    // Cube render target
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      type: THREE.HalfFloatType,
    })

    this.scene.environment = cubeRenderTarget.texture

    // Cube camera
    this.cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
    this.cubeCamera.layers.set(1)

    /**
     * ========= object =========
     */
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.3, 128, 128),
      new THREE.MeshStandardMaterial({
        roughness: 0.1,
        metalness: 1,
        color: 0xaaaaaa,
      })
    )
    torusKnot.position.x = -4
    torusKnot.position.y = 4
    this.scene.add(torusKnot)

    /**
     * ========= Model =========
     */
    gltfLoader.load('models/FlightHelmet/glTF/FlightHelmet.gltf', gltf => {
      gltf.scene.scale.set(10, 10, 10)
      gltf.scene.traverse(object => console.log(object.name))
      // gltf.scene.getObjectByName('RubberWood_low').visible = false
      this.scene.add(gltf.scene)
    })

    /**
     * ========= light =========
     */
    // ambient
    // const ambientLight = new THREE.AmbientLight('#ffffff', 1)
    // this.scene.add(ambientLight)

    // Directional light
    // const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
    // directionalLight.position.set(1, 1, 0)
    // this.scene.add(directionalLight)

    /**
     * ========= Shadows =========
     */
    // directionalLight.castShadow = true

    // Mapping
    // directionalLight.shadow.mapSize.width = Math.pow(2, 8)
    // directionalLight.shadow.mapSize.height = Math.pow(2, 8)
    // directionalLight.shadow.camera.top = 8
    // directionalLight.shadow.camera.bottom = -8
    // directionalLight.shadow.camera.left = -8
    // directionalLight.shadow.camera.right = 8
    // directionalLight.shadow.camera.near = 1
    // directionalLight.shadow.camera.far = 10

    /**
     * ========= load non must assets =========
     */
    await this.loadNonMustAssetsAndMarkComplete()
  }
  tweak(gui) {
    // this.scene.environmentIntensity
    const scene = gui.addFolder({ title: 'scene' })
    scene.addBinding(this.scene, 'environmentIntensity', {
      min: 1,
      max: 20,
      step: 0.001,
    })
    scene.addBinding(this.scene, 'backgroundIntensity', {
      min: 1,
      max: 20,
      step: 0.001,
    })
    scene.addBinding(this.scene, 'backgroundBlurriness', {
      min: 0,
      max: 1,
      step: 0.001,
    })
    scene.addBinding(this.scene.backgroundRotation, 'y', {
      min: 0,
      max: Math.PI * 2,
      step: 0.001,
    })
    scene.addBinding(this.scene.environmentRotation, 'y', {
      min: 0,
      max: Math.PI * 2,
      step: 0.001,
    })
    // scene.on('change', () => {
    //   this.scene.environmentRotation.y = this.scene.backgroundRotation.y
    // })
  }
  effect(addPass, ShaderPass) {
    /**
     * ========= Base Post-Process shader =========
     */
    addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: passVertexShader,
        fragmentShader: passFragmentShader,
      })
    )
  }
  draw(time, deltaTime) {
    if (this.holyDonut) {
      this.holyDonut.rotation.x = Math.sin(time) * 2
      this.cubeCamera.update(this.renderer, this.scene)
    }
  }
}
