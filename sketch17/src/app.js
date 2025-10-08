/**
 * Style
 */
import './style.scss'

/**
 * Template
 */
import Xdraw from './utill.js'

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
  CANVAS_ID = 'canvas'
  PIXEL_RATIO = 2
  DRAWING_BUFFER = false
  assets = {
    particleTexture1: { url: '/textures/particles/1.png',type:'TEXTURE', must:true},
  }
  constructor(parser) { super(parser) }
  async appSetup() { 
    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
    this.scene.background = new THREE.Color('#000000')
    

     /**
     * ========= Assets =========
     */
    const {} = this.assets
    

    /**
     * ========= object =========
     */
    // Galaxy
    this.parameter = {}
    this.parameter.count = 100000
    this.parameter.size = 0.02
    this.parameter.radius = 5
    this.parameter.branches = 3
    this.parameter.spin = 1
    this.parameter.randomness = 0.2
    this.parameter.randomnessPower = 3
    this.parameter.insideColor = '#ff6030'
    this.parameter.outsideColor = '#1b3984'
    let geometry, material, points = null

    this.generateGalaxy = () =>
    {
      // Destory
      if (points !== null) {
        geometry.dispose()
        material.dispose()
        this.scene.remove(points)
      }
      
      // geometory
      geometry = new THREE.BufferGeometry()

      const positions = new Float32Array(this.parameter.count * 3)
      const colors = new Float32Array(this.parameter.count * 3)

      const insideColor = new THREE.Color(this.parameter.insideColor)
      const outsideColor = new THREE.Color(this.parameter.outsideColor)

      for (let i = 0; i < this.parameter.count; i++)
      {
        const i3 = i * 3
        
        // Position
        const radius = Math.random() * this.parameter.radius
        const spinPhi = radius * this.parameter.spin
        const phi = (i % this.parameter.branches) / this.parameter.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(),this.parameter.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomY = Math.pow(Math.random(),this.parameter.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomZ = Math.pow(Math.random(),this.parameter.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

        positions[i3 + 0] = radius * Math.sin(phi + spinPhi) + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = radius * Math.cos(phi + spinPhi) + randomZ

        // Color
        const mixedColor = insideColor.clone()
        mixedColor.lerp(outsideColor, radius / this.parameter.radius)

        colors[i3 + 0] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      // material
      material = new THREE.PointsMaterial({
        size: this.parameter.size,
        sizeAttenuation: true,
        depthWrite: false,
        blendColor: THREE.AdditiveBlending,
        vertexColors: true
      })

      // Points
      points = new THREE.Points(
        geometry,
        material
      )
      this.scene.add(points)
    }

    this.generateGalaxy()


    /**
     * ========= light =========
     */
    // ambient
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.275)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight('#86cdff', 6)
    directionalLight.position.set(3, 2, -8)
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
    directionalLight.shadow.camera.far = 20

    /**
     * ========= load all assets =========
     */
    await this.loadAllAssetsAndMarkComplete()
  }
  tweak(gui) {
    const garaxy = gui.addFolder({title:'Garaxy'})
    garaxy.addBinding(this.parameter, 'count', { min: 100, max: 10000000, step: 100 })
    garaxy.addBinding(this.parameter, 'size', { min: 0.001, max: 0.1, step: 0.001 })
    garaxy.addBinding(this.parameter, 'radius', { min: 0.01, max: 20, step: 0.01 })
    garaxy.addBinding(this.parameter, 'branches', { min: 2, max: 20, step: 1 })
    garaxy.addBinding(this.parameter, 'spin', { min: -5, max: 5, step: 0.001 })
    garaxy.addBinding(this.parameter, 'randomness', { min: 0, max: 2, step: 0.001 })
    garaxy.addBinding(this.parameter, 'randomnessPower', { min: 1, max: 10, step: 0.001 })
    garaxy.addBinding(this.parameter, 'insideColor', { view: 'color' })
    garaxy.addBinding(this.parameter, 'outsideColor', { view: 'color' })
    garaxy.on('change', this.generateGalaxy)
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

