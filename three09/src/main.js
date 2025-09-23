import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'

class App extends Xapp {
  constructor() {
    super()
    /**
     * texture
     */
    const loadingManager = new THREE.LoadingManager()
    const textureLoader = new THREE.TextureLoader()
    const loadTex = (path) => {
      return textureLoader.load(
        path,
        (tex) => (tex.colorSpace = THREE.SRGBColorSpace)
      )
    }
    loadingManager.onStart = () => {}
    loadingManager.onProgress = () => {}
    loadingManager.onLoad = () => {}
    loadingManager.onError = () => {}

    this.colorTex = loadTex(
      // '/Door_Wood_001_SD/Door_Wood_001_basecolor.jpg'
      '/minecraft.png'
    )
    this.alphaTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_opacity.jpg'
    )
    this.heightTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_height.png'
    )
    this.normalTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_normal.jpg'
    )
    this.ambientOcclutionTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_ambientOcclusion.jpg'
    )
    this.metalnessTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_metallic.jpg'
    )
    this.roughnessTex = loadTex(
      '/Door_Wood_001_SD/Door_Wood_001_roughness.jpg'
    )

    // this.colorTex.repeat.x = 2
    // this.colorTex.repeat.y = 3
    // this.colorTex.wrapS = THREE.RepeatWrapping
    // this.colorTex.wrapT = THREE.RepeatWrapping

    // this.colorTex.offset.x = 0.5
    // this.colorTex.offset.y = 0.5

    // this.colorTex.rotation = 45 * (Math.PI / 180)
    // this.colorTex.center.set(0.5, 0.5)

    this.colorTex.magFilter = THREE.NearestFilter

    /**
     * Debug
     */
    const gui = new GUI({
      title: 'debug',
      width: 300,
      closeFolders: false,
    })
    gui.close()
    gui.hide()
    const debugObject = {}
  }
  onTap(event) {
    // Handle tap events
  }
  onKey(event) {
    if (event.key === 'h') {
      gui.show(gui._hidden)
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
    this.geo = new THREE.BoxGeometry(1, 1, 1)
    this.mat = new THREE.MeshBasicMaterial({
      map: this.colorTex,
    })
    this.mesh = new THREE.Mesh(this.geo, this.mat)
    this.scene.add(this.mesh)

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
     * render
     */
    this.renderer.render(this.scene, this.camera)
  }
}

const app = new App()
domReady(() => {
  app.onSetup()
})
