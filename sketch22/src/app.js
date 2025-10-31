/**
 * Template
 */
import Xdraw from './core/__utils.js'

/**
 * Three
 */
import * as THREE from 'three'
import gsap from 'gsap'
import {Sky} from 'three/addons/objects/Sky.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * maath
 */
import { damp ,damp2} from 'maath/easing'

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
  PIXEL_RATIO = 2
  TWEAK_WIDTH = 250
  RENDERER_OPT = {
    preserveDrawingBuffer:false,
    antialias: false,
    powerPreference: 'high-performance',  
    alpha: true
  }
  assets = {}
  params = {}
  scrollPos = new THREE.Vector2(0, 0)
  constructor(parser) { super(parser) }
  async appSetup() { 
    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
  

    /**
     * ========= Assets =========
     */
    const { } = this.assets


    /**
      * Cube Texure
      */
        const cubeTextureLoader = new THREE.CubeTextureLoader()
        this.envMapTexture = cubeTextureLoader.load([
          '/textures/environmentMaps/0/px.png',
          '/textures/environmentMaps/0/nx.png',
          '/textures/environmentMaps/0/py.png',
          '/textures/environmentMaps/0/ny.png',
          '/textures/environmentMaps/0/pz.png',
          '/textures/environmentMaps/0/nz.png'
        ])


     /**
     * ========= Model =========
     */
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader.load('/models/humburger/humburger.glb',
      gltf => {
        gltf.scene.scale.set(0.5, 0.5, 0.5)
        console.log(gltf)
        this.scene.add(gltf.scene)
      }
    )


    
    /**
     * ========= object =========
     */
    /**
     * ========= object =========
     */

    // Floor
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({
        color: '#777777',
        roughness: 0.4,
        metalness:0.3,
        envMap: this.envMapTexture,
        envMapIntensity: 0.5
      })
    )
    // this.floor.rotation.x = - Math.PI / 1.5
    this.floor.quaternion
      .setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        - Math.PI / 2
      )

    this.scene.add(this.floor)
    


    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight('#ffffff', 1)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
    directionalLight.position.set(1, 1, 0)
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
    directionalLight.shadow.camera.far = 10

    /**
     * ========= load non must assets =========
     */
    await this.loadNonMustAssetsAndMarkComplete()
  }
  tweak(gui) {
    
  }
  effect(addPass,ShaderPass) {
    /**
     * ========= Base Post-Process shader =========
     */
    addPass(new ShaderPass ({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: passVertexShader,
      fragmentShader: passFragmentShader
    }))
  }
  draw(time, deltaTime) {
    
  }
}

