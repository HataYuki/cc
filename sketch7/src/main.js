import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'

/**
 * Debug
 */
const gui = new GUI({
  title: "debug",
  
})
const debugObject = {}

class App extends Xapp {
  constructor() {
    super()
  }
  onTap(event) {
    // Handle tap events
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
      color: new THREE.Color('#e5cbcb'),
      wireframe: true,
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
    gui
      .add(this.mesh.position, 'y')
      .min(-3)
      .max(3)
      .step(0.01)
      .name('elevation')

    gui.add(this.mesh, 'visible')

    gui.add(this.mat, 'wireframe')

    const debugObject = {
      color: 'e5cbcb',
      spin: () => {
        gsap.to(this.mesh.rotation, {
          y: this.mesh.rotation.y + Math.PI * 2,
        })
      },
    }

    gui.addColor(debugObject, 'color').onChange(() => {
      this.mat.color.set(debugObject.color)
    })

    gui.add(debugObject, 'spin')

    debugObject.subdivition = 2
    gui
      .add(debugObject, 'subdivition')
      .min(1)
      .max(20)
      .step(1)
      .onFinishChange(() => {
        this.mesh.geometry.dispose()
        this.mesh.geometry = new THREE.BoxGeometry(
          1,
          1,
          1,
          debugObject.subdivition,
          debugObject.subdivition,
          debugObject.subdivition
        )
      })
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

domReady(() => {
  const app = new App()
  app.onSetup()
})
