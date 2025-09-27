import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

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

    this.matcapTex = texLoader.load('/textures/matcaps/3.png')
    this.matcapTex.colorSpace = THREE.SRGBColorSpace
    fontLoader.load(
      '/fonts/helvetiker_regular.typeface.json',
      font => {
        this.mesh.geometry.dispose()
        const textGeo = new TextGeometry(
          'hello Three.js',
          {
            font: font,
            size: 0.5,
            depth: 0.2,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize:0.03,
            bevelOffset: 0,
            bevelSegments:4
          }
        )
        // textGeo.computeBoundingBox()
        // textGeo.translate(
        //   - (textGeo.boundingBox.max.x - 0.02) * 0.5,
        //   - (textGeo.boundingBox.max.y - 0.02) * 0.5,
        //   - (textGeo.boundingBox.max.z - 0.03) * 0.5,
        // )
        // console.log(textGeo.boundingBox)

        textGeo.center()


        this.mesh.geometry = textGeo
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
    this.mat = new THREE.MeshMatcapMaterial()
    this.mat.matcap = this.matcapTex
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.mat
    )
    this.scene.add(this.mesh)

    console.time('donuts')

    const donutGeo = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
    for (let i = 0; i < 1000; i++){
      
      const donut = new THREE.Mesh(donutGeo, this.mat)
      
      donut.position.x = (Math.random() * 2 - 1) * 5
      donut.position.y = (Math.random() * 2 - 1) * 5
      donut.position.z = (Math.random() * 2 - 1) * 5

      donut.rotation.x = Math.random() * Math.PI
      donut.rotation.y = Math.random() * Math.PI
      
      const scale = Math.random()
      donut.scale.set(scale,scale,scale)

      this.scene.add(donut)
    }

    console.timeEnd('donuts')
    

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
     * render
     */
    this.renderer.render(this.scene, this.camera)
  }
}

const app = new App()
domReady(() => {
  app.onSetup()
})
