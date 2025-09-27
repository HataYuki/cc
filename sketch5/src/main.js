import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'

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
    // Setup code here
    this.canvas = document.getElementById('canvas')

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)

    // scene
    this.scene = new THREE.Scene()

    // camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    )
    // this.aspectRatio = this.width / this.height
    // this.camera = new THREE.OrthographicCamera(
    //   -1 * this.aspectRatio,
    //   1 * this.aspectRatio,
    //   1,
    //   -1,
    //   0.1,
    //   100.0
    // )

    // this.camera.position.y = 1
    this.camera.position.z = 3
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))
    this.scene.add(this.camera)

    // controls
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    // object
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    })
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.material)
    this.scene.add(this.mesh)

    // cursor
    this.cursor = { x: 0, y: 0 }
    window.addEventListener('mousemove', (event) => {
      this.cursor.x = event.clientX / this.width - 0.5
      this.cursor.y = -1 * (event.clientY / this.height - 0.5)
    })
  }
  onUpdate(time, deltaTime, deltaScroll) {
    // Update logic here

    /**
     * time
     */
    const elapsedTime = this.clock.getElapsedTime()

    if (this.needUpdateResize) {
      // Handle resize log

      /**
       * handle resize viewport
       */
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.setSize(this.width, this.height)
    }
    if (this.needUpdateScroll) {
      // Handle scroll logic
    }

    /**
     * handle animation
     */

    // this.mesh.rotation.y = elapsedTime

    /**
     * camera position
     */
    // this.camera.position.x = Math.sin(this.cursor.x * Math.PI * 2) * 3
    // this.camera.position.z = Math.cos(this.cursor.x * Math.PI * 2) * 3
    // this.camera.position.y = this.cursor.y * 5
    // this.camera.lookAt(this.mesh.position)

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
