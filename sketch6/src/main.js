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
    const geometry = new THREE.BufferGeometry()
    const count = 5000
    const positionsArray = new Float32Array(count * 3 * 3)
    for (let i = 0; i < count * 3; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = Math.PI * 2 * u
      // const phi = Math.acos(2 * v - 1)
      const phi = Math.PI * v
      const r = Math.cbrt(Math.random()) * 5

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positionsArray[i * 3 + 0] = x
      positionsArray[i * 3 + 1] = y
      positionsArray[i * 3 + 2] = z
    }
    const positionAttribute = new THREE.BufferAttribute(positionsArray, 3)
    geometry.setAttribute('position', positionAttribute)

    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    })
    this.mesh = new THREE.Mesh(
      // new THREE.BoxGeometry(1, 1, 1, 3, 3, 3),
      geometry,
      this.material
    )
    this.scene.add(this.mesh)

    // cursor
    this.currentCursor = new THREE.Vector2()
    this.prevCursor = new THREE.Vector2()
    window.addEventListener('mousemove', (event) => {
      this.currentCursor.x = event.clientX / this.width - 0.5
      this.currentCursor.y = -1 * (event.clientY / this.height - 0.5)
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
     * update cursor
     */
    // this.prevCursor.copy(this.currentCursor)

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
