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
  TWEAK_WIDTH = 250
  RENDERER_OPT = {
    preserveDrawingBuffer:false,
    antialias: false,
    powerPreference: 'high-performance',  
    alpha: true
  }
  assets = {
    // envMapTexture1: { url: '/textures/environmentMaps/0/px.png', type: 'TEXTURE', must: true },
    // envMapTexture2: { url: '/textures/environmentMaps/0/nx.png', type: 'TEXTURE', must: true },
    // envMapTexture3: { url: '/textures/environmentMaps/0/py.png', type: 'TEXTURE', must: true },
    // envMapTexture4: { url: '/textures/environmentMaps/0/ny.png', type: 'TEXTURE', must: true },
    // envMapTexture5: { url: '/textures/environmentMaps/0/pz.png', type: 'TEXTURE', must: true },
    // envMapTexture6: { url: '/textures/environmentMaps/0/nz.png', type: 'TEXTURE', must: true },
  }
  params = {}
  scrollPos = new THREE.Vector2(0, 0)
  constructor(parser) { super(parser) }
  async appSetup() { 
    this.camera.position.set(-3, 3, 3)
    // this.camera.lookAt(new THREE.Vector3(0,0,0))
    
    /**
     * Cube Texure
     */
    const cubeTextureLoader = new THREE.CubeTextureLoader()
    this.envMapTexture = cubeTextureLoader.load([
      '/textures/environmentMaps/0/px.png',
      '/textures/environmentMaps/0/nx.png',
      '/textures/environmentMaps/0/py.png',
      '/textures/environmentMaps/0/ny.png',
      '/textures/environmentMaps/0/pz.png',
      '/textures/environmentMaps/0/nz.png'
    ])

    /**
     * ========= load must assets =========
     */
    await this.loadMustAssetsAndMarkComplete()
  

    /**
     * ========= Assets =========
     */
    const { } = this.assets


    /**
     * ========= load must assets =========
     */
    this.hitSound = new Audio('/sounds/hit.mp3')
    this.playHitSound = event =>
    {
      if (event.maxForceMagnitude() > 30)
      {
        this.hitSound.volume = Math.random()
        this.hitSound.currentTime = 0
        this.hitSound.play()
      }
    }
    
    /**
     * ========= Physic world =========
     */
    this.objectsToUpdate = []
    this.RAPIER = await import('@dimforge/rapier3d')
    this.world = new this.RAPIER.World(new THREE.Vector3(0, -9.82, 0))


    // Sphere
    // this.createSphere(0.5,new THREE.Vector3(0, 5, 0),this.envMapTexture)
    
    // Floor
    const floorCliderQuaternion = new THREE.Quaternion()
      .setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
      )
    const floorColiderDesk = this.RAPIER.ColliderDesc
      .cuboid(5, 5, 0.01)
      .setRotation(floorCliderQuaternion)
      
    this.world.createCollider(floorColiderDesk)

    // Box
    // this.createBox(1, 1, 1, new THREE.Vector3(0, 6, 0), this.envMapTexture)
    
    /**
     * ========= object =========
     */

    // Floor
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({
        color: '#777777',
        roughness: 0.4,
        metalness:0.3,
        envMap: this.envMapTexture,
        envMapIntensity: 0.5
      })
    )
    // this.floor.rotation.x = - Math.PI / 1.5
    this.floor.quaternion
      .setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        - Math.PI / 2
      )

    this.scene.add(this.floor)


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
    // this.sphere.castShadow = true
    this.floor.receiveShadow = true
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
     * ========= load non must assets =========
     */
    await this.loadNonMustAssetsAndMarkComplete()
  }
  createSphere(radius, position,envMapTexture)
  {
    this.sphereGeometry ??= new THREE.SphereGeometry(radius, 32, 32)
    this.sphrerMaterial ??= new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.4,
      envMap: envMapTexture
    })
    
    // Three Mesh
    const mesh = new THREE.Mesh(
      this.sphereGeometry,
      this.sphrerMaterial
    )

    mesh.castShadow = true
    mesh.position.copy(position)
    this.scene.add(mesh)

    // Rapier Body
    const rigidBodyDesk = this.RAPIER.RigidBodyDesc
      .dynamic()
      .setTranslation(position.x,position.y,position.z)
    const rigidBody = this.world.createRigidBody(rigidBodyDesk)

    const coliderDesk = this.RAPIER.ColliderDesc
      .ball(radius)
      .setFriction(0.1)
      .setRestitution(0.3)
      .setActiveEvents(this.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(0)
    
    this.world.createCollider(coliderDesk, rigidBody)
    
    // Save in objects to update
    this.objectsToUpdate.push({
      mesh,
      rigidBody
    })
    return mesh
  }
  createBox(width, height, depth, position, envMapTexture)
  {
    this.boxGeometry = new THREE.BoxGeometry(1,1,1,32,32)
    this.boxMaterial ??= new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.3,
      envMap:envMapTexture
    })
    
    const box = new THREE.Mesh(this.boxGeometry, this.boxMaterial)
    box.scale.set(width,height,depth)
    this.scene.add(box)

    const boxRigidBodyDesc = this.RAPIER.RigidBodyDesc
      .dynamic()
      .setTranslation(position.x,position.y,position.z)
    const boxRigidBody = this.world.createRigidBody(boxRigidBodyDesc)

    const boxColliderDesk = this.RAPIER.ColliderDesc
      .cuboid(width/2, height/2, depth/2)
      .setFriction(0.1)
      .setRestitution(0.4)
      .setActiveEvents(this.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(0)
    this.world.createCollider(boxColliderDesk, boxRigidBody)
  
    this.objectsToUpdate.push({
      mesh: box,
      rigidBody:boxRigidBody
    }) 
    return box
  }
  tweak(gui) {
    this.debugObject = {}
    this.debugObject.createSphere = () => {
      
    }
    const physics = gui.addFolder({ title: 'physics' })

    const createSpereBtn = physics.addButton({ title: 'createSphere' })    
    createSpereBtn.on('click',()=> {
      this.createSphere(0.5, new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        3,
        (Math.random() - 0.5) * 3
      ), this.envMapTexture)
    })

    const createBoxBtn = physics.addButton({ title: 'createBox' })
    createBoxBtn.on('click', () => {
      this.createBox(
        Math.random() * 2, Math.random() * 2, Math.random() * 2,
        new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        6,
        (Math.random() - 0.5) * 3
      ), this.envMapTexture)
    })

    const resetBtn = physics.addButton({ title: 'reset' })
    resetBtn.on('click', () => {
      for (const object of this.objectsToUpdate)
      {
        // Remove body
        this.world.removeRigidBody(object.rigidBody)

        // Remove mesh
        this.scene.remove(object.mesh)

      }
      this.objectsToUpdate.splice(0,this.objectsToUpdate.length)
    })

    const playSoundBtn = physics.addButton({ title: 'playsound' })
    playSoundBtn.on('click', () => {
      this.playHitSound()
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
    /**
     * Update Physics world
     */
    this.eventQueue ??= new this.RAPIER.EventQueue(true)
    this.world.step(this.eventQueue)
    this.eventQueue.drainContactForceEvents(this.playHitSound)
    /**
     * Apply mesh
     */
    for (const object of this.objectsToUpdate)
    {
      object.mesh.position.copy(object.rigidBody.translation()) 
      object.mesh.quaternion.copy(object.rigidBody.rotation())
    }
  }
}

