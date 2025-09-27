import './style.scss'
import Xapp from './utill.js'
import { domReady } from './utill.js'
import * as THREE from 'three'

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

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    })
    this.renderer.setPixelRatio(window.devicePixelRatio || 2)
    this.renderer.setSize(this.width, this.height)

    // scene
    this.scene = new THREE.Scene()

    // camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    )
    this.camera.position.z = 3
    this.scene.add(this.camera)

    // object
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    })
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.material)
    this.scene.add(this.mesh)
  }
  onUpdate(time, deltaTime, deltaScroll) {
    // Update logic here

    if (this.needUpdateSetup) {
      // Handle setup logic (once)
    }
    if (this.needUpdateOnload) {
      // Handle onload logic (once)
    }
    if (this.needUpdateResize) {
      // Handle resize logic
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.width, this.height)
    }
    if (this.needUpdateScroll) {
      // Handle scroll logic
    }

    this.mesh.rotation.x += 0.002 * deltaTime

    /**
     * render
     */
    this.renderer.render(this.scene, this.camera)
  }
}

domReady(() => {
  const app = new App()
  app.onSetup()
  app.needUpdateSetup = true
})
