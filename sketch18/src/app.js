/**
 * Style
 */
import './styles/style.scss'

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
  PIXEL_RATIO = 2
  TWEAK_WIDTH = 300
  RENDERER_OPT = {
    preserveDrawingBuffer:false,
    antialias: false,
    powerPreference: 'high-performance',  
    alpha: true
  }
  assets = {
    gradientTexture: { url: '/textures/gradients/3.jpg',type:'TEXTURE', must:true},
  }
  params = {}
  constructor(parser) { super(parser) }
  async appSetup() { 
    this.controls.enabled = false  // 完全に無効化
    this.gui.hidden = false

    /**
     * camera
     */
    this.camera.position.set(0, 0, 3)
    this.camera.lookAt(0, 0, 0)
    

    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
    

     /**
     * ========= Assets =========
     */
    const { gradientTexture } = this.assets
    gradientTexture.magFilter = THREE.NearestFilter
    

    /**
     * ========= object =========
     */
    // Material
    this.params.materialColor = '#ffeded'
    this.material = new THREE.MeshToonMaterial({
      color: this.params.materialColor,
      gradientMap: gradientTexture,
    })

    // Meshes
    this.params.objectDistance = 4
    const mesh1 = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.4, 16, 60),
      this.material
    )

    const mesh2 = new THREE.Mesh(
      new THREE.ConeGeometry(1,2,31),
      this.material
    )

    const mesh3 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.8,0.35,100,16),
      this.material
    )

    mesh1.position.y = - this.params.objectDistance * 0
    mesh2.position.y = - this.params.objectDistance * 1
    mesh3.position.y = - this.params.objectDistance * 2

    this.scene.add(mesh1, mesh2, mesh3)

    this.sectionMeshes = [mesh1, mesh2, mesh3]
    


    /**
     * ========= light =========
     */
    // ambient
    // const ambientLight = new THREE.AmbientLight('#ffffff', 1.275)
    // this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
    directionalLight.position.set(1, 1, 0)
    this.scene.add(directionalLight)


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
    // directionalLight.shadow.camera.far = 20

    /**
     * ========= load all assets =========
     */
    await this.loadAllAssetsAndMarkComplete()
  }
  tweak(gui) {
    const materialColor = gui.addFolder({ title: 'Material Color' })
    materialColor.addBinding(this.params, 'materialColor', { view: 'color' })
    materialColor.on('change', () => {
      this.material.color.set(this.params.materialColor)
    })
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
    for (const mesh of this.sectionMeshes)
    {
      mesh.rotation.x = time * 0.1
      mesh.rotation.y = time * 0.12
    }
    if (this[Xdraw.SCROLL_FRAG])
    {
      this.camera.position.y = - this.scrollPosition.y / this.viewSize.y * this.params.objectDistance
    }
  }
}

