import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

class App extends Xapp {
  constructor() {
    super()
    /**
     * loading Manager
     */
    const loadingManager = new THREE.LoadingManager()

    /**
     * loader
     */
    const texLoader = new THREE.TextureLoader(loadingManager)
    const rgbeLoader = new RGBELoader(loadingManager)

    // const texLoader.load = (path,sRGB) => {
    //   return textureLoader.load(
    //     path, (tex) => {
    //       if(sRGB) tex.colorSpace = THREE.SRGBColorSpace
    //     }
    //   )
    // }
    // const loadRGBE = path => {
    //   return rgbeLoader.load(
    //     path,tex => {
    //       tex.mapping = THREE.EquirectangularReflectionMapping}
    //   )
    // }

    loadingManager.onStart = () => {}
    loadingManager.onProgress = () => {}
    loadingManager.onLoad = () => {}
    loadingManager.onError = e => console.log(e)

    this.alphaTex = texLoader.load('/textures/door/alpha.jpg')
    this.ambientOcculutionTex = texLoader.load('/textures/door/ambientOcclusion.jpg')
    this.colorTex = texLoader
      .load(
        '/textures/door/color.jpg',
        tex => {
          tex.colorSpace = THREE.SRGBColorSpace
        }
      )
    this.heightTex = texLoader.load('/textures/door/height.jpg')
    this.metalnessTex = texLoader.load('/textures/door/metalness.jpg')
    this.normalTex = texLoader.load('/textures/door/normal.jpg')
    this.roughnessTex = texLoader.load('/textures/door/roughness.jpg')
    this.matcapTex = texLoader.load('/textures/matcaps/3.png')
    this.gradientTex = texLoader.load('/textures/gradients/5.jpg')
    this.environmentTex = rgbeLoader
      .load(
        '/textures/environmentMap/2k.hdr',
        tex => {
          tex.mapping = THREE.EquirectangularReflectionMapping
        }
      )

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
    this.debugObj
  }
  onTap(event) {
    // Handle tap events
  }
  onKey(event) {
    if (event.key === 'h') {
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)

    /**
     * scene
     */
    this.scene = new THREE.Scene()
    this.scene.background = this.environmentTex
    this.scene.environment = this.environmentTex

    /**
     * camera
     */
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    )
    this.camera.position.z = 3
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))
    this.scene.add(this.camera)

    /**
     * controls
     */
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    /**
     * object
     */
    //MeshBasicMaterial
    // this.mat = new THREE.MeshBasicMaterial({color:'rgb(0,255,0)'})
    // // this.mat.map = this.colorTex
    // // this.mat.wireframe = true
    // this.mat.transparent = true
    // // this.mat.opacity = 0.1
    // this.mat.alphaMap = this.alphaTex

    // MeshNormalMaterial
    // this.mat = new THREE.MeshNormalMaterial()
    // this.mat.flatShading = true

    // MeshMatcapMaterial
    // this.mat = new THREE.MeshMatcapMaterial()
    // this.mat.matcap = this.matcapTex

    // MeshDepthMaterial
    // this.mat = new THREE.MeshDepthMaterial()

    // MeshLambertMaterial
    // this.mat = new THREE.MeshLambertMaterial()

    // // MeshPhongMaterial
    // this.mat = new THREE.MeshPhongMaterial()
    // this.mat.shininess = 100
    // this.mat.specular = new THREE.Color(0x1188ff)

    // // MeshPhongMaterial
    // this.mat = new THREE.MeshToonMaterial()
    // this.gradientTex.minFilter = THREE.NearestFilter
    // this.gradientTex.magFilter = THREE.NearestFilter
    // this.gradientTex.generateMipmaps = false
    // this.mat.gradientMap = this.gradientTex

    // // MeshStandardMaterial
    // this.mat = new THREE.MeshStandardMaterial()
    // this.mat.metalness = 1
    // this.mat.roughness = 1
    // this.mat.map = this.colorTex
    // this.mat.aoMap = this.ambientOcculutionTex
    // this.mat.aoMapIntensity = 1
    // this.mat.displacementMap = this.heightTex
    // this.mat.displacementScale = 0.1
    // this.mat.metalnessMap = this.metalnessTex
    // this.mat.roughnessMap = this.roughnessTex
    // this.mat.normalMap = this.normalTex
    // this.mat.normalScale.set(0.5, 0.5)
    // this.mat.transparent = true
    // this.mat.alphaMap = this.alphaTex

    // this.gui
    //   .add(this.mat, "roughness")
    //   .min(0.1)
    //   .max(1.0)
    //   .step(0.01)
    
    // this.gui
    //   .add(this.mat, "metalness")
    //   .min(0.1)
    //   .max(1.0)
    //   .step(0.01)

    // MeshPhysicalMaterial
    this.mat = new THREE.MeshPhysicalMaterial()
    this.mat.metalness = 0
    this.mat.roughness = 0
    // this.mat.map = this.colorTex
    // this.mat.aoMap = this.ambientOcculutionTex
    // this.mat.aoMapIntensity = 1
    // this.mat.displacementMap = this.heightTex
    // this.mat.displacementScale = 0.1
    // this.mat.metalnessMap = this.metalnessTex
    // this.mat.roughnessMap = this.roughnessTex
    // this.mat.normalMap = this.normalTex
    // this.mat.normalScale.set(0.5, 0.5)
    this.mat.transparent = true 
    // this.mat.alphaMap = this.alphaTex

    this.gui.add(this.mat, "roughness").min(0).max(1.0).step(0.0001)
    this.gui.add(this.mat, "metalness").min(0).max(1.0).step(0.0001)

    // clearcoat
    this.mat.clearcoat = 1
    this.mat.clearcoatRoughness = 0
    // this.map.opacity = 0.3

    this.gui.add(this.mat, 'clearcoat').min(0).max(1).step(0.0001)
    this.gui.add(this.mat, 'clearcoatRoughness').min(0).max(1).step(0.0001)

    // sheen
    // this.mat.sheen = 1
    // this.mat.sheenRoughness = 0.25
    // this.mat.sheenColor.set(1, 1, 1)
    
    // this.gui.add(this.mat, 'sheen').min(0).max(1).step(0.0001)
    // this.gui.add(this.mat, 'sheenRoughness').min(0).max(1).step(0.0001)
    // this.gui.addColor(this.mat,"sheenColor")

    // Iridescence
    // this.mat.iridescence = 1
    // this.mat.iridescenceIOR = 1
    // this.mat.iridescenceThicknessRange = [100,800]

    // this.gui.add(this.mat, 'iridescence').min(0).max(1).step(0.0001)
    // this.gui.add(this.mat, 'iridescenceIOR').min(1).max(2.333).step(0.0001)
    // this.gui.add(this.mat.iridescenceThicknessRange, '0').min(1).max(1000).step(1)
    // this.gui.add(this.mat.iridescenceThicknessRange,'1').min(1).max(1000).step(1)

    // Transmission
    this.mat.transmission = 1
    this.mat.ior = 1.5
    this.mat.thickness = 0.5

    this.gui.add(this.mat,'transmission').min(0).max(1).step(0.001)
    this.gui.add(this.mat,'ior').min(1).max(10).step(0.001)
    this.gui.add(this.mat, 'thickness').min(1).max(10).step(0.001)
    
    this.mat.attenuationColor = new THREE.Color('rgb(255,0,0)')
    this.mat.attenuationDistance = 1
    this.gui.addColor(this.mat, 'attenuationColor')
    this.gui.add(this.mat, 'attenuationDistance').min(0.1).max(1).step(0.0001)

    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 64, 64),
      this.mat
    )
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1,64,64),
      new THREE.MeshLambertMaterial({
        side: THREE.DoubleSide,
        color:'blue'
      })
    )
    this.plane.material.doun
    this.torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.15, 64, 64),
      this.mat
    )
    this.sphere.position.x = -1.5
    this.torus.position.x = 1.5
    this.scene.add(this.sphere, this.plane, this.torus)

    /**
     * light
     */
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.pointLight = new THREE.PointLight(0xffffff, 30)
    this.pointLight.position.x = 2
    this.pointLight.position.y = 3
    this.pointLight.position.z = 4
    this.scene.add(this.ambientLight,this.pointLight)

    /**
     * cursor
     */
    this.currentCursor = new THREE.Vector2()
    this.prevCursor = new THREE.Vector2()
    window.addEventListener('mousemove', (event) => {
      this.currentCursor.x = event.clientX / this.width - 0.5
      this.currentCursor.y = -1 * (event.clientY / this.height - 0.5)
    })

    /**
     * debug
     */
    
  }
  onUpdate(time, deltaTime, deltaScroll) {
    /**
     * time
     */
    const elapsedTime = this.clock.getElapsedTime()

    if (this.needUpdateResize) {
      /**
       * handle resize viewport
       */
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()
      this.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
      )
      this.renderer.setSize(this.width, this.height)
    }
    if (this.needUpdateScroll) {
    }

    /**
     * update cursor
     */
    this.prevCursor.copy(this.currentCursor)

    /**
     * update controls
     */
    this.controls.update()

    /**
     * animation
     */
    this.sphere.rotation.y = 0.1 * elapsedTime
    this.plane.rotation.y = 0.1 * elapsedTime
    this.torus.rotation.y = 0.1 * elapsedTime

    this.sphere.rotation.x = -0.1 * elapsedTime
    this.plane.rotation.x = -0.1 * elapsedTime
    this.torus.rotation.x = -0.1 * elapsedTime

    /**
     * render
     */
    this.renderer.render(this.scene, this.camera)
  }
}

const app = new App()
domReady(() => {
  app.onSetup()
})
