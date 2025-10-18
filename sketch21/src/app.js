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
    this.camera.position.set(0, 0, 5)

    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
  

    /**
     * ========= Assets =========
     */
    const { } = this.assets


     /**
     * ========= Model =========
     */
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader
      .load('/models/Duck/glTF-Draco/Duck.gltf',
        gltf =>
        {
          this.gltf = gltf
          this.gltf.scene.position.y = -1.2
          this.scene.add(this.gltf.scene)
        }
      )


    
    /**
     * ========= object =========
     */
    const radius = 0.5
    const distance = 2
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32)
    
    this.sphere0 = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({color:'#ff0000'}))
    this.sphere0.position.x = distance

    this.sphere1 = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({color:'#ff0000'}))
    
    this.sphere2 = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({color:'#ff0000'}))
    this.sphere2.position.x = - distance

    this.scene.add(this.sphere0, this.sphere1, this.sphere2)
    this.sphere0.updateMatrixWorld()
    this.sphere1.updateMatrixWorld()
    this.sphere2.updateMatrixWorld()
    
    /**
     * ====== Raycaster ======
     */
    this.raycaster = new THREE.Raycaster()
    


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
     * Click
     */
    window.addEventListener('click', () => {
      if (this.currentIntersect)
      {
        switch (this.currentIntersect.object)
        {
          case this.sphere0:
            console.log('click on shere 0')
            break
          
          case this.sphere1:
            console.log('click on shere 1')
            break
          
          case this.sphere2:
            console.log('click on shere 2')
            break
        }
        
      }
    })

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
    // Animate Object
    this.sphere0.position.y = Math.sin(time * 0.3) * 1.5
    this.sphere1.position.y = Math.sin(time * 0.8) * 1.5
    this.sphere2.position.y = Math.sin(time * 1.4) * 1.5

    const cursor = this.cursorPosition.clone()
    cursor
      .divide(this.viewSize)
      .multiply(new THREE.Vector2(2, -2))
      .add(new THREE.Vector2(-1, 1))
    
    // Cast a ray
    this.raycaster.setFromCamera(cursor,this.camera)
    
    const objectsToTest = [this.sphere0, this.sphere1, this.sphere2]
    const intersects = this.raycaster.intersectObjects(objectsToTest)
    for (const object of objectsToTest)
    {
      object.material.color.set('#ff0000')
    }
    for (const intersect of intersects)
    {
      intersect.object.material.color.set('#0000ff')
    }

    
    if (intersects.length)
    {
      if (!this.currentIntersect)
      {
        console.log('mouse enter')
      }
      this.currentIntersect ??= intersects[0]
    } else
    {
      if (this.currentIntersect)
      {
        console.log('mouse leave')
      }
      delete this.currentIntersect
    }

    // Intersect with model
    if (this.gltf) {
      const modelIntersect = this.raycaster.intersectObject(this.gltf.scene)
      
      if (modelIntersect.length)
      {
        this.gltf.scene.scale.set(1.2,1.2,1.2)
      } else
      {
        this.gltf.scene.scale.set(1,1,1)
      }
    }
  }
}

