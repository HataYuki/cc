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
  scrollPos = new THREE.Vector2(0, 0)
  constructor(parser) { super(parser) }
  async appSetup() { 
    this.controls.enabled = false  // 完全に無効化
    this.gui.hidden = false
    
    this.docMain = document.querySelector('main')

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
      new THREE.TorusGeometry(1, 0.4, 128, 128),
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

    mesh1.position.x = 2
    mesh2.position.x = -2
    mesh3.position.x = 2

    this.scene.add(mesh1, mesh2, mesh3)
    this.sectionMeshes = [mesh1, mesh2, mesh3]


    // Particles
    this.params.particleCount = 10000
    this.params.particleSize = 0.01
    let geometry, points = null
    this.particleMaterial = null
    this.genParticles = () => {
      if (points !== null)
      {
        geometry.dispose()
        this.particleMaterial.dispose()
        this.scene.remove(points)
      }
        
      const positions = new Float32Array(this.params.particleCount * 3)

      geometry = new THREE.BufferGeometry()
      this.particleMaterial = new THREE.PointsMaterial({
        size: this.params.particleSize,
        sizeAttenuation: true,
        depthWrite: false,
        blendColor: THREE.AdditiveBlending
      })

      for (let i = 0; i < this.params.particleCount; i++)
      {
        const i3 = i * 3
        positions[i3 + 0] = ((Math.random() - 0.5) * 20) 
        positions[i3 + 1] = this.params.objectDistance * 0.5 - Math.random() * this.params.objectDistance * this.sectionMeshes.length
        positions[i3 + 2] = ((Math.random() - 0.5) * 20)
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      points = new THREE.Points(geometry,this.particleMaterial)

      this.scene.add(points)
    }
    this.genParticles()

    


    /**
     * ========= Cursor =========
     */
    

    /**
     * Spin animation
     */
    


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
      this.particleMaterial.color.set(this.params.materialColor)
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
      mesh.rotation.x += deltaTime * 0.1
      mesh.rotation.y += deltaTime * 0.12
    }

    /**
     * Animate camera
     */
    this.parallax ??= new THREE.Vector2(0, 0)
    const campos = new THREE.Vector2(0, 0)
    const cursor = this.cursorPosition.clone().divide(this.viewSize).subScalar(0.5)
    
    campos.y = - this.scrollPosition.y / this.viewSize.y * this.params.objectDistance
    
    cursor.multiply(new THREE.Vector2(1, -1))
    cursor.multiplyScalar(0.5)
    damp2(this.parallax, cursor, 0.25, deltaTime)
  
    campos.add(this.parallax)
    
    this.camera.position.x = campos.x
    this.camera.position.y = campos.y

    
    /**
     * Spin animation
     */
    this.currentSection ??= 0
    if (this[Xdraw.SCROLL_FRAG])
    {
      const newSection = Math.round(this.scrollPosition.y / this.viewSize.y)
      if (this.currentSection !== newSection) {
        this.currentSection = newSection
        
        gsap
          .to(this.sectionMeshes[this.currentSection].rotation, {
            duration: 1.5,
            ease: 'power2.inOut',
            x: '+=6',
            y: '+=3',
            z: '+=1.5'
          })
      }
    }
    

    /**
     * Smooth scroll
     */
    if (this[Xdraw.RESIZE_FRAG] || this[Xdraw.SCROLL_FRAG])
    {
      const newPos = this.scrollPos.clone()
      const pageSize = this.docMain.getBoundingClientRect()
      
      newPos
        .add(this.scrollDelta)
        .clamp(
          new THREE.Vector2(0, 0),
          new THREE.Vector2(
            pageSize.width - this.viewSize.x,
            pageSize.height - this.viewSize.y
          )
      )
      
      damp2(this.scrollPos, newPos, 0.05, deltaTime)

      window.scroll(this.scrollPos.x, this.scrollPos.y)
    }
  }
}

