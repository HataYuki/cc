import Emittery from 'emittery'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Three
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import Stats from 'three/addons/libs/stats.module.js'
const { clamp,damp } = THREE.MathUtils

/**
 * Post processer
 */
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * domReady
 * Executes a function when the DOM is fully loaded.
 * @example
 * domReady(() => {
 *  console.log('DOM is ready');
 * }
 * @param {*} fn
 */
export const domReady = (fn) => {
  if (document.readyState === 'complete' || document.readyState !== 'loading') {
    Promise.resolve().then(fn)
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}
  
/**
 * ticker
 * A simple ticker function that calls a callback on each animation frame
 * @example
 * const stopTicker = Ticker(({ time, deltaTime }) => {
 *   console.log(`Time: ${time}, Delta Time: ${deltaTime}`);
 * })
 * // To stop the ticker
 * stopTicker();
 * @param {function} callback - Function to be called on each tick
 * @returns A function to stop the ticker
 */
const Ticker = (callback) => {
  let lastTime = performance.now(), rafId = 0, deltaTime = 0

  const loop = (time) => {
    rafId = requestAnimationFrame(loop)
    deltaTime = time - lastTime
    lastTime = time
    callback({ time: time / 1000, deltaTime: deltaTime / 1000 })
  }

  rafId = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(rafId)
}

/**
 *
 * fps
 * A function to control the frame rate of a callback
 * @example
 * const checkFps = fps(60)
 * if (checkFps(performance.now())) {
 *   // Do something at 60 FPS
 * }
 * @param {number} targetFps - The target frames per second
 * @returns {function} A function that returns true if enough time has passed for the next frame
 * @description This function can be used to limit the frame rate of a callback function.
 */
export const fps = (targetFps) => {
  const interval = 1000 / targetFps
  let lastTime = 0

  return (time) => {
    if (time - lastTime >= interval) {
      lastTime = time
      return true
    }
    return false
  }
}

/**
 * saveCanvas
 * @param {*} renderer 
 */
export const saveCanvas = (renderer) => {
  const url = renderer.domElement.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = url;
  a.download = "three.png";
  a.click()
}

/**
 * ScrollManager
 * originally from https://github.com/darkroomengineering/lenis/blob/main/packages/core/src/virtual-scroll.ts
 */
class ScrollManager {
  static LINE_HEIGHT = 100 / 6
  static LISTENER_OPTIONS = { passive: false }
  static INERTIA_DECAY = 0.95

  options = {
    wheelMultiplier: 1,
    touchMultiplier: 1,
    deltaXMax: 300,
    deltaYMax: 300,
  }

  __element = null
  __touchStart = new THREE.Vector2(0,0)
  __lastDelta = new THREE.Vector2(0, 0)
  __emitter = new Emittery()
  __speed = new THREE.Vector2(0, 0)
  __delta = new THREE.Vector2(0, 0)
  __needsUpdate = false

  __rafWheelId = null
  __rafTouchMoveId = null
  __rafScroll = null

  __startInertiaTimer = null

  constructor(element, options) {
    this.__element = element

    if (options) this.options = { ...this.options, ...options }

    this.setup()
  }

  setup() {
    this.__element.addEventListener('wheel', this.__onWheel, ScrollManager.LISTENER_OPTIONS)
    this.__element.addEventListener('touchstart', this.__onTouchStart, ScrollManager.LISTENER_OPTIONS)
    this.__element.addEventListener('touchmove', this.__onTouchMove, ScrollManager.LISTENER_OPTIONS)
    this.__element.addEventListener('touchend', this.__onTouchEnd, ScrollManager.LISTENER_OPTIONS)
  }

  on(event, callback) {
    this.__emitter.on(event, callback)
    return this
  }

  get delta() {
    return this.__delta.clone()
  }

  __onScroll(deltaX, deltaY, event) {
    if(event?.preventDefault) event.preventDefault()
    
    const newDeltaX = clamp(deltaX, -1 * this.options.deltaXMax, this.options.deltaXMax)
    const newDeltaY = clamp(deltaY, -1 * this.options.deltaYMax, this.options.deltaYMax)

    const newSpeedX = newDeltaX / this.options.deltaXMax
    const newSpeedY = newDeltaY / this.options.deltaYMax

    const needUpdate = (this.__delta.x !== newDeltaX || this.__delta.y !== newDeltaY)

    if (needUpdate) {
      this.__delta.set(newDeltaX, newDeltaY)
      this.__speed.set(newSpeedX, newSpeedY)

      this.__needsUpdate = true

      this.__emitter.emit('scroll', { delta: this.__delta.clone(), event: event })
    }
    
    if (this.__needsInertia(event)) {
      this.__simulateInertia()
    } else {
      this.__startInertia(event)  
    }
  }

  __simulateInertia() {
    const newDelta = this.__delta.clone().multiplyScalar(ScrollManager.INERTIA_DECAY)

    if (Math.abs(newDelta.x) <= 0.1) newDelta.x = 0
    if (Math.abs(newDelta.y) <= 0.1) newDelta.y = 0

    this.__rafScroll = requestAnimationFrame(() => this.__onScroll(newDelta.x, newDelta.y, {}))
  }

  __needsInertia(event) {
    return (event.type === 'touchend' || this.__delta.x !== 0 || this.__delta.y !== 0)
  }

  __startInertia(event) {
    clearTimeout(this.__startInertiaTimer)

    this.__startInertiaTimer = setTimeout(() => {
      if (this.__needsInertia(event)) {
        const delta = this.__delta.clone().multiplyScalar(ScrollManager.INERTIA_DECAY)
        this.__rafScroll = requestAnimationFrame(() => this.__onScroll(delta.x, delta.y, { }))
      }

      clearTimeout(this.__startInertiaTimer)
      this.__startInertiaTimer = null
    }, 80)
  }


  consume(object,keyName) {
    const wasNeeded = this.__needsUpdate
    const scrollStopped = (this.delta.x === 0 && this.delta.y === 0)
    if (scrollStopped) this.__needsUpdate = false
    if (object && keyName) object[keyName] = wasNeeded
    
    return wasNeeded
  }


  __onTouchStart = (event) => {
    cancelAnimationFrame(this.__rafScroll)
    
    const { clientX, clientY } = event.targetTouches
      ? event.targetTouches[0]
      : event

    this.__touchStart.set(clientX, clientY)
    this.__lastDelta.set(0, 0)

    this.__onScroll(0, 0, event)
  }


  __onTouchMove = event => {
    cancelAnimationFrame(this.__rafScroll)
    cancelAnimationFrame(this.__rafTouchMoveId)

    this.__rafTouchMoveId = requestAnimationFrame(() => this.__touchMoveUpdate(event))
  }

  __touchMoveUpdate = (event) => {
    const { clientX, clientY } = event.targetTouches
      ? event.targetTouches[0]
      : event

    const deltaX = -(clientX - this.__touchStart.x) * this.options.touchMultiplier
    const deltaY = -(clientY - this.__touchStart.y) * this.options.touchMultiplier

    this.__touchStart.x = clientX
    this.__touchStart.y = clientY

    this.__lastDelta.set(deltaX, deltaY)

    this.__onScroll(deltaX, deltaY, event)
    this.__rafTouchMoveId = null
  }


  __onTouchEnd = (event) => {
    cancelAnimationFrame(this.__rafScroll)
    this.__onScroll(this.__lastDelta.x, this.__lastDelta.y, event)
  }

  __onWheel = event => {
    cancelAnimationFrame(this.__rafScroll)
    cancelAnimationFrame(this.__rafWheelId)
    
    this.__rafWheelId = requestAnimationFrame(() => this.__wheelUpdate(event))
  }

  __wheelUpdate = (event) => {
    let { deltaX, deltaY, deltaMode } = event

    const multiplierX =
      deltaMode === 1 ? ScrollManager.LINE_HEIGHT : deltaMode === 2 ? window.innerWidth : 1
    const multiplierY =
      deltaMode === 1 ? ScrollManager.LINE_HEIGHT : deltaMode === 2 ? window.innerHeight : 1

    deltaX *= multiplierX
    deltaY *= multiplierY

    deltaX *= this.options.wheelMultiplier
    deltaY *= this.options.wheelMultiplier

    this.__onScroll(deltaX, deltaY, event)
    this.__rafWheelId = null
  }


  dispose() {
    this.__emitter.clearListeners()

    this.__element.removeEventListener('wheel', this.__onWheel, ScrollManager.LISTENER_OPTIONS)
    this.__element.removeEventListener('touchstart', this.__onTouchStart, ScrollManager.LISTENER_OPTIONS)
    this.__element.removeEventListener('touchmove', this.__onTouchMove, ScrollManager.LISTENER_OPTIONS)
    this.__element.removeEventListener('touchend', this.__onTouchEnd, ScrollManager.LISTENER_OPTIONS)

    if(this.__rafTouchMoveId) cancelAnimationFrame(this.__rafTouchMoveId)
    if(this.__rafWheelId) cancelAnimationFrame(this.__rafWheelId)
    if(this.__rafScroll) cancelAnimationFrame(this.__rafScroll)
    this.__rafTouchMoveId = null
    this.__rafWheelId = null
    this.__rafScroll = null
  }
}

/**
 * SwipeManager
 */
class SwipeManager{
  static DELTA_BUFFER_SIZE = 5
  static DELTA_HISTORY_SIZE = 3
  
  __delta_x_buffer = new Array(SwipeManager.DELTA_BUFFER_SIZE).fill(0)
  __delta_y_buffer = new Array(SwipeManager.DELTA_BUFFER_SIZE).fill(0)
  __smooth_x_his = new Array(SwipeManager.DELTA_HISTORY_SIZE).fill(0)
  __smooth_y_his = new Array(SwipeManager.DELTA_HISTORY_SIZE).fill(0)
  __xSwiped = false
  __ySwiped = false
  __needsUpdateX = false
  __needsUpdateY = false
  __emitter = new Emittery()

  constructor() {}

  update(scrollDeltaX, scrollDeltaY, deltaTime) {
    this.__pushDelta(Math.abs(scrollDeltaX), Math.abs(scrollDeltaY))

    const smoothDelta = this.__getSmoothDelta()
    const speedX = this.__calcSpeed(smoothDelta.x, deltaTime)
    const speedY = this.__calcSpeed(smoothDelta.y, deltaTime)

    if (speedX) {
      this.__pushHistory(smoothDelta.x, null)
      const isUp = this.__isSpeedUp(this.__smooth_x_his)
      const isDown = this.__isSpeedDown(this.__smooth_x_his)
      const dir = (speedX > 0) ? 1 : -1

      if (isUp && speedX > 0.5 && !this.__xSwiped) {
        this.__emitter.emit('startSwipeX', { dir }), this.__xSwiped = true, this.__needsUpdateX = true
      }
      if (isDown && this.__xSwiped) {
        this.__emitter.emit('endSwipeX'), this.__xSwiped = false, this.__needsUpdateY = true
      }
    }

    if (speedY) {
      this.__pushHistory(null, smoothDelta.y)
      const isUp = this.__isSpeedUp(this.__smooth_y_his)
      const isDown = this.__isSpeedDown(this.__smooth_y_his)
      const dir = (speedY > 0) ? 1 : -1

      if (isUp && speedY > 0.5 && !this.__ySwiped) {
        this.__emitter.emit('startSwipeY', { dir }), this.__ySwiped = true
      }
      if (isDown && this.__ySwiped) {
        this.__emitter.emit('endSwipeY',{dir}), this.__ySwiped = false
      }
    }
  }

  on(event, callback) {
    this.__emitter.on(event, callback)
    return this
  }

  consumeX(object, keyName) {
    const wasNeeded = this.__needsUpdateX
    this.__needsUpdateX = false
    if (object && keyName) this[keyName] = wasNeeded
    return wasNeeded
  }

  consumeY(object, keyName) {
    const wasNeeded = this.__needsUpdateY
    this.__needsUpdateY = false
    if (object && keyName) this[keyName] = wasNeeded
    return wasNeeded
  }

  __calcSpeed(smoothDelta, deltaTime) {
    if (smoothDelta < 0.1) return 0
    
    return smoothDelta / deltaTime
  }

  __isSpeedUp(history) {
    return history.every((v, i, a) => i === 0 || v > a[i - 1])
  }

  __isSpeedDown(history) {
     return history.every((v, i, a) => i === 0 || v < a[i - 1])
  }
    
  __pushDelta(deltaX, deltaY) {
    if (deltaX) this.__push('__delta_x_buffer', deltaX, SwipeManager.DELTA_BUFFER_SIZE)
    if (deltaY) this.__push('__delta_y_buffer', deltaY, SwipeManager.DELTA_BUFFER_SIZE)
  }
  
  __pushHistory(smoothX, smoothY) {
    if (smoothX) this.__push('__smooth_x_his', smoothX, SwipeManager.DELTA_BUFFER_SIZE)
    if (smoothY) this.__push('__smooth_y_his', smoothY, SwipeManager.DELTA_BUFFER_SIZE)
  }

  __push(bufferName, value, maxBufferLen) {
    this[bufferName].push(value)
    if(this[bufferName].length > maxBufferLen) this[bufferName].shift()
  }
  
  __getSmoothDelta() {
    return {
      x: this.__smoothing(this.__delta_x_buffer),
      y: this.__smoothing(this.__delta_y_buffer)
    }
  }

  __smoothing(buffer) {
    return buffer.reduce((a, c) => a + c, 0) / buffer.length
  }

  dispose() {
    this.__emitter.clearListeners()
    this.__delta_x_buffer.fill(0)
    this.__delta_y_buffer.fill(0)
    this.__smooth_x_his.fill(0)
    this.__smooth_y_his.fill(0)
  }
}


class AssetManager {
  mustAseetsLen = 0
  allAssetsLen = 0
  mustLoaded = false
  allLoaded = false
  needsUpdateLoadedMust = false
  needsUpdateLoadedall = false
  mustProgress = 0
  allProgress = 0
  emitter = new Emittery()

  constructor(assets) {
    if (assets) this.setup(assets)
    
    const loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(loadingManager)
    this.rgbeLoader = new RGBELoader(loadingManager)
    this.fontLoader = new FontLoader(loadingManager)

    loadingManager.onProgress = (url, load, total) => this.__onProgress.apply(this,[url, load, total])
    loadingManager.onError = (url) => console.error(`Failed to load asset: ${url}`)
  }

  setup(assets) {
    this.assets = assets
    this.mustAseetsLen = Object.keys(this.assets).filter(k => this.assets[k].must).length
    this.allAssetsLen = Object.keys(this.assets).filter(k => !this.assets[k].must).length
    return this
  }

  on(event, callback) {
    this.emitter.on(event, callback)
    return this
  }

  async whenMustLoad() {
    if (!this.mustAseetsLen) return Promise.resolve().then(() => this.mustLoaded = true)
    
    return Promise.all(Object.keys(this.assets)
      .filter(key => this.assets[key].must)
      .map(key => this.__load(key)))
      .then(() => this.mustLoaded = true,this.needsUpdateLoadedMust = true)
  }

  async load() {
    if (!this.mustLoaded) await this.whenMustLoad()
    if (!this.allAssetsLen) return Promise.resolve()
    
    const checkNotMust = key => (this.assets[key].hasOwnProperty('must') && !this.assets[key].must)
    
    return Promise.all(Object.keys(this.assets)
      .filter(key => checkNotMust(key))
      .map(key => this.__load(key)))
      .then(() => this.allLoaded = true,this.needsUpdateLoadedall = true)
  }

  consumeLoadedMust(object, keyName) {
    const wasNeeded = this.needsUpdateLoadedMust
    this.needsUpdateLoadedMust = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  consumeLoadedAll(object, keyName) {
    const wasNeeded = this.needsUpdateLoadedall
    this.needsUpdateLoadedall = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  __selectLoader(type) {
    let loader = null

    switch(type.toUpperCase()) {
      case 'TEXTURE':
        loader = this.textureLoader
        break
      case 'HDR':
        loader = this.rgbeLoader
        break
      case 'FONT':
        loader = this.fontLoader
        break
      default:
        loader = this.textureLoader
    }

    return loader
  }

  __load(key) {
    const asset = this.assets[key]

    return new Promise((resolve, reject) => {
      this.__selectLoader(asset.type)
        .load(asset.url,
          data => {
            this.assets[key] = data
            resolve(data)
        }
      )
    })
  }

  __onProgress(url, number) {
    if (!this.mustLoaded) {
      this.mustProgress = number / this.mustAseetsLen
      this.emitter.emit('loadingMust', { progress: this.mustProgress })
    } else {
      this.allProgress = (number - this.mustAseetsLen) / this.allAssetsLen
      this.emitter.emit('loadingAll', { progress: this.allProgress })
    }
  }
} 

/**
 * ViewportManager
 * Optimized viewport size management with caching and throttling
 */
class ViewportManager {
  __size = new THREE.Vector2(window.innerWidth, window.innerHeight)
  __needsUpdate = true
  __onResizeBound  = null
  __rafId = null
    
  constructor() {
    this.setup()
  }
  
  setup() {
    this.__onResizeBound = this.__onResize.bind(this)
    window.addEventListener('resize', this.__onResizeBound, { passive: true })
  }

  get size() {
    return this.__size
  }

  consume(object, keyName = 'needsViewportUpdate') {
    const v = this.__needsUpdate;
    this.__needsUpdate = false;
    if (object && keyName) object[keyName] = v;
    return v;
}

  __onResize() {
    cancelAnimationFrame(this.__rafId)
    this.__rafId = requestAnimationFrame(() => this.__updateSize())
  }
  
  __updateSize() {
    const newWidth = window.innerWidth
    const newHeight = window.innerHeight
    
    if (this.__size.x !== newWidth || this.__size.y !== newHeight) {
      this.__needsUpdate = true
      this.__size.set(newWidth, newHeight)  
    }
    
    this.__rafId = null
  }
  
  dispose() {
    window.removeEventListener('resize', this.__onResizeBound)
    this.__onResizeBound = null

    if (this.__rafId !== null) cancelAnimationFrame(this.__rafId)
    this.__rafId = null
  }
}

/**
 * InputKeyManager - Manages keyboard input with advanced key combination detection and special key support (Ctrl, Shift, Alt, Meta)
 * Uses event emitter pattern to distribute key events to multiple listeners for flexible input handling
 */
class InputKeyManager{
  __pressedKeys = new Set()
  __emitter = new Emittery()
  __onKeyPressedBound = null
  __onKeyReleasedBound = null

  constructor() {
    this.__onKeyPressedBound = this.__onKeyPressed.bind(this)
    this.__onKeyReleasedBound = this.__onKeyReleased.bind(this)
    window.addEventListener('keydown',this.__onKeyPressedBound)
    window.addEventListener('keyup',this.__onKeyReleasedBound)
  }

  on(event, callback) {
    this.__emitter.on(event, callback)
    return this
  }

  __onKeyPressed(event) {
    this.__pressedKeys.add(event.key.toLowerCase())
    this.__emitter.emit('keyPressed', {
      event,
      isCombKey: (keys) => this.__isCombKeyPressed(event, keys),
      isAnyKey: (keys) => this.__isAnyKeyPressed(event, keys)
    })
  }

  __onKeyReleased(event) {
    this.__pressedKeys.delete(event.key.toLowerCase())
    this.__emitter.emit('keyReleased', { event })
  }

  __isCombKeyPressed(event, keys) {
    const normalKeysPressed = keys.every(key => {
      const lowerKey = key.toLowerCase()
      const special = this.__matchModifierSpecialKey(event,key)
        
      if(special) return special
        
      return this.__pressedKeys.has(lowerKey)
    })
      
    return normalKeysPressed
  }

  __isAnyKeyPressed(event, keys) {
    return keys.some(key => {
      const lowerKey = key.toLowerCase()
      const special = this.__matchModifierSpecialKey(event,key)
        
      if(special) return special
        
      return this.__pressedKeys.has(lowerKey)
    })
  }

  __matchModifierSpecialKey(event, key) {
    const lowerKey = key.toLowerCase()
    switch (lowerKey) {
      case 'shift': return !!event?.shiftKey
      case 'ctrl':
      case 'control': return !!event?.ctrlKey
      case 'alt': return !!event?.altKey
      case 'meta':
      case 'cmd': return !!event?.metaKey
      default: return null
    }
  }
  
  dispose() {
    this.__emitter.clearListeners()
    window.removeEventListener('keydown',this.__onKeyPressedBound)
    window.removeEventListener('keyup', this.__onKeyReleasedBound)
    this.__onKeyPressedBound = null
    this.__onKeyReleasedBound = null
  }
}

/**
 * Xapp
 * A base class for creating applications with scrolling and touch support.
 */
class Xapp {
  static DELATA_X_MAX = 300
  static DELATA_Y_MAX = 300
  static RESIZE_FRAG = 'needsReizeUpdate'
  static SCROLL_FRAG = 'needsScrollUpdate'
  static SWIPE_X_FRAG = 'needsSwipeXTriggered'
  static SWIPE_Y_FRAG = 'needsSwipeYTriggered'

  /**
   * Manager
   */
  viewportManager = new ViewportManager()
  inputKeyManager = new InputKeyManager()
  scrollManager = new ScrollManager(document.body)
  swipeManager = new SwipeManager()

  viewSize = this.viewportManager.size
  scrollDelta = this.scrollManager.delta

  constructor() {
    this.inputKeyManager
      .on('keyPressed', arg => this.onKeyPressed(arg.event, arg.isCombKey, arg.isAnyKey))
      .on('keyRelease', arg => this.onKeyReleased(arg.event))
    
    this.scrollManager
      .on('scroll', arg => { })
    
    this.swipeManager
      .on('startSwipeX', arg => this.onSwipeXStart(arg.dir))
      .on('startSwipeY', arg => this.onSwipeXEnd(arg.dir))
      .on('endSwipeX', arg => this.onSwipeYStart(arg.dir))
      .on('endSwipeY', arg => this.onSwipeYEnd(arg.dir))
    

    Ticker((arg) => {
      let { time, deltaTime } = arg

      this.swipeManager.update(this.scrollDelta.x, this.scrollDelta.y, deltaTime)

      // Frag Manage
      this.viewportManager.consume(this, Xapp.RESIZE_FRAG)
      this.scrollManager.consume(this, Xapp.SCROLL_FRAG)
      this.swipeManager.consumeX(this, Xapp.DELATA_X_MAX)
      this.swipeManager.consumeY(this, Xapp.SWIPE_Y_FRAG)

      this.viewSize = this.viewportManager.size
      this.scrollDelta = this.scrollManager.delta

      this.update(time, deltaTime)
    })
  }

  async __setup() {}
  /**
   * Key events
   * @param {string} event 
   * @param {function} isCombKey 
   * @param {function} isAnyKey 
   */
  onKeyPressed(event,isCombKey, isAnyKey) {}
  onKeyReleased(event) { }
  /**
   * Swipe events
   * @param {number} dir 
   */
  onSwipeXStart(dir) {}
  onSwipeXEnd(dir) { }
  onSwipeYStart(dir) {}
  onSwipeYEnd(dir) { }
  /**
   * Update
   * @param {number} time 
   * @param {number} deltaTime 
   * @param {THREE.Vector2} deltaScroll 
   */
  update(time, deltaTime, deltaScroll) { }
  /**
   * dispose
   */
  dispose() { }
}

export default class Xdraw extends Xapp{
  static MUST_ASSETS_LOADED_FRAG = 'mustAssetsLoaded'
  static ALL_ASSETS_LOADED_FRAG = 'allAssetsLoaded'

  CANVAS_ID = 'canvas'
  OPENING_ANIMATION_DURATION = 0
  PIXEL_RATIO = 2
  DRAWING_BUFFER = false

  assetsManager = new AssetManager()

  deviceType = 'pc'
  mustAssetsProgress = 0
  allAssetProgress = 0

  __continuUpdate = false

  constructor(parser) {
    super()
    /**
     * ========= Check device =========
     */
    const type = parser.getDevice().type
    if (type) this.device_type = type
  
    /**
     * ========= GUI =========
     */
    this.gui = new GUI({ title: 'debug', width: 300, closeFolders: false })
    this.gui.close()
    this.gui.hide()
  }
  async __setup() {
    /**
     * Asset setting
     */
    this.assetsManager
      .setup(this.assets)
      .on('mustAssetsLoading', p => { this.mustAssetsProgress = p.progress })
      .on('allAssetsLoading', p => this.allAssetProgress = p.progress)

    /**
     * ========= Setup code =========
     */
    this.canvas = document.getElementById(this.CANVAS_ID)
    if (!this.canvas) throw new Error(`Canvas element with ID '${this.CANVAS_ID}' not found`)
    
    this.__container = this.canvas.parentNode


    /**
     * ========= Stats =========
     */
    this.__isStatsShow = 3
    this.__stats = new Stats()
    this.__container.appendChild(this.__stats.dom)
    this.__stats.showPanel(this.__isStatsShow)


    /**
     * ========= clock =========
     */
    this.__timer = new THREE.Timer()


    /**
     * ========= renderer =========
     */
    const renderOpt = {
      canvas: this.canvas,
      preserveDrawingBuffer: this.DRAWING_BUFFER,
      antialias: false,
      powerPreference: 'high-performance',
    }
    
    try {
      this.renderer = new THREE.WebGLRenderer(renderOpt)
    } catch (error) {
      console.error('WebGL initialization failed:', error)
      if (!this.renderer) throw new Error('WebGL is not supported or available in this browser')
    }
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXEL_RATIO))
    this.renderer.setSize(this.viewSize.x, this.viewSize.y, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    

    /**
     * ========= scene =========
     */
    this.scene = new THREE.Scene()


    /**
     * ========= Axes helper =========
     */
    this.arrowHelper = new THREE.Group()
    const size = 3
    const origin = new THREE.Vector3(0, 0, 0)
    const headLength = 0.5
    const headWidth = 0.3
    const arrowX = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      origin,
      size,
      0xff0000,
      headLength,
      headWidth,
    )
    const arrowY = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      origin,
      size,
      0x00ff00,
      headLength,
      headWidth,
    )
    const arrowZ = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      origin,
      size,
      0x0000ff,
      headLength,
      headWidth,
    )
    this.arrowHelper.add(arrowX, arrowY, arrowZ)
    this.arrowHelper.visible = false
    this.scene.add(this.arrowHelper)
    

    /**
     * ========= camera =========
     */
    const aspect = this.viewSize.x / this.viewSize.y
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
    this.camera.position.set(3, 3, 3)
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))
    this.scene.add(this.camera)

    
    /**
     * ========= Post processing =========
     */
    this.effectComposer = new EffectComposer(this.renderer)
    this.effectComposer.setSize(this.viewSize.x, this.viewSize.y)
    this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXEL_RATIO))

    const renderPass = new RenderPass(this.scene, this.camera)
    this.effectComposer.addPass(renderPass)

    // FXAA
    const fxaaPass = new FXAAPass()
    this.effectComposer.addPass(fxaaPass)

    // SSAO
    const ssaoPass = new SSAOPass(
      this.scene,this.camera,
      this.viewSize.x,this.viewSize.y
    )
    this.effectComposer.addPass(ssaoPass)

    // Custom post process
    this.effect(
      effect => this.effectComposer.addPass(effect),
      ShaderPass
    )

    // output
    const outputPass = new OutputPass()
    this.effectComposer.addPass(outputPass)


    /**
     * ========= controls =========
     */
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    
    /**
     * ========= App setUp =========
     */
    await this.appSetup()


    /**
     * ========= debug =========
     */
    this.gui.add(this.arrowHelper,'visible').name('ArrowHelper')
    this.debugSetup(this.gui)
  }
  update(time, deltaTime) {
    /**
     * ========= Flag manage =========
     */
    this.assetsManager.consumeLoadedMust(this, Xdraw.MUST_ASSETS_LOADED_FRAG)
    this.assetsManager.consumeLoadedAll(this, Xdraw.ALL_ASSETS_LOADED_FRAG)

    if(this[Xdraw.MUST_ASSETS_LOADED_FRAG]) this.__continuUpdate = true
      
    if (!this.__continuUpdate) return
    
    
    /**
     * ========= Timer =========
     */
    this.__timer.update()

   
    /**
    * ========= Update utilitys =========
    */    
    this.controls.update()
    this.__stats.update()


    /**
     * ========= Main draw =========
     */
    this.draw(this.__timer.getElapsed(), deltaTime)
    
  
    /**
    * ========= handle resize viewport =========
    */
    if (this[Xdraw.RESIZE_FRAG])
    {
      this.camera.aspect = this.viewSize.x / this.viewSize.y
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXEL_RATIO))
      this.renderer.setSize(this.viewSize.x, this.viewSize.y,false)
      this.camera.updateProjectionMatrix()

      this.effectComposer.setSize(this.viewSize.x, this.viewSize.y)
      this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXEL_RATIO))
    }

    /**
     * ========= render =========
     */
    this.renderer.render(this.scene, this.camera)
    this.effectComposer.render()
  }

  onSwipeStart(dir) { this.swipeStarted(dir) }
  
  onSwipeEnd(dir) { this.swipeEnded(dir) }
  
  onKeyPressed(event, isCombKey, isAnyKey) {
    this.keyPressed(event, isCombKey, isAnyKey)

    // Toggle GUI
    if (isAnyKey(['h']))
    {
      this.gui.show(this.gui._hidden)
    }

    // Toggle Stats
    if (isAnyKey(['h']))
    {
      this.__isStatsShow = (this.__isStatsShow < 3) ? 3 : 0
      this.__stats.showPanel(this.__isStatsShow)
    }
    
    // Toggle FullScreen
    if (isAnyKey(['F11']) || isCombKey(['ctrl', 'f']))
    {
      event.preventDefault()
      this.__toggleFullScreen()
    }

    // ScreenShot
    if (isCombKey(['cmd','shift','s']))
    {
      saveCanvas(this.renderer)
    }
  }

  __toggleFullScreen() {
    const doc = document
    const el = doc.documentElement
    const isFull = !!doc.fullscreenElement || !!doc.webkitFullscreenElement || !!doc.msFullscreenElement

    if (isFull) {
      (doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen)?.call(doc)
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el)
    }
  }

  async loadMustAssetsAndMarkComplete() {
    await this.assetsManager.whenMustLoad()
    this.__is_must_assets_loaded = true
  }

  async loadAllAssetsAndMarkComplete() {
    await this.assetsManager.load()
    this.__is_all_assets_loaded = true
  }

  async appSetup() { }
  effect(addPass, ShaderPass) { }
  debugSetup(gui) { }
  keyPressed(event, isCombKey, isAnyKey) { }
  swipeStarted(dir) { }
  swipeEnded(dir) { }
  draw(time, deltaTime) { }
}
