import Emittery from 'emittery'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Three
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
const { clamp, damp } = THREE.MathUtils

/**
 * Tweak pane
 */
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

/**
 * Post processor
 */
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Vector2 } from 'three/src/Three.Core.js'

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
  __delta = new THREE.Vector2(0, 0)
  __speed = new THREE.Vector2(0, 0)
  __scroll = new THREE.Vector2(0, 0)
  __needsUpdate = false

  __rafWheelId = null
  __rafTouchMoveId = null
  __rafScrollId = null

  __startInertiaTimer = null

  constructor(element = window, options) {
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

  get speed() {
    return this.__speed.clone()
  }

  get position() {
    return this.__scroll.clone()
  }

  __onScroll(deltaX, deltaY, event) {
    const newDeltaX = clamp(deltaX, -1 * this.options.deltaXMax, this.options.deltaXMax)
    const newDeltaY = clamp(deltaY, -1 * this.options.deltaYMax, this.options.deltaYMax)

    const newSpeedX = newDeltaX / this.options.deltaXMax
    const newSpeedY = newDeltaY / this.options.deltaYMax

    const needUpdate = (this.__delta.x !== newDeltaX || this.__delta.y !== newDeltaY)

    this.__scroll.set(window.scrollX, window.scrollY)
   
    
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

    this.__rafScrollId = requestAnimationFrame(() => this.__onScroll(newDelta.x, newDelta.y, {}))
  }

  __needsInertia(event) {
    return (event.type === 'touchend' || this.__delta.x !== 0 || this.__delta.y !== 0)
  }

  __startInertia(event) {
    clearTimeout(this.__startInertiaTimer)

    this.__startInertiaTimer = setTimeout(() => {
      if (this.__needsInertia(event)) {
        const delta = this.__delta.clone().multiplyScalar(ScrollManager.INERTIA_DECAY)
        this.__rafScrollId = requestAnimationFrame(() => this.__onScroll(delta.x, delta.y, { }))
      }

      clearTimeout(this.__startInertiaTimer)
      this.__startInertiaTimer = null
    }, 80)
  }


  consumeScrollUpdate(object, keyName) {
    const scrollStoped = (this.__delta.x === 0 && this.__delta.y === 0)
    if (scrollStoped) this.__needsUpdate = false
    
    const wasNeeded = this.__needsUpdate
    if (object && keyName) object[keyName] = wasNeeded
    
    return wasNeeded
  }


  __onTouchStart = (event) => {
    event.preventDefault()
    cancelAnimationFrame(this.__rafScrollId)
    
    const { clientX, clientY } = event.targetTouches
      ? event.targetTouches[0]
      : event

    this.__touchStart.set(clientX, clientY)
    this.__lastDelta.set(0, 0)

    this.__onScroll(0, 0, event)
  }


  __onTouchMove = event => {
    event.preventDefault()
    cancelAnimationFrame(this.__rafScrollId)
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
    event.preventDefault()
    cancelAnimationFrame(this.__rafScrollId)
    this.__onScroll(this.__lastDelta.x, this.__lastDelta.y, event)
  }

  __onWheel = event => {
    event.preventDefault()

    cancelAnimationFrame(this.__rafScrollId)
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
    if(this.__rafScrollId) cancelAnimationFrame(this.__rafScrollId)
    this.__rafTouchMoveId = null
    this.__rafWheelId = null
    this.__rafScrollId = null
  }
}

/**
 * SwipeManager
 */
class SwipeManager {
  static DELTA_BUFFER_SIZE = 5
  static DELTA_HISTORY_SIZE = 5
  
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
      const dir = (scrollDeltaX > 0) ? 1 : -1

      if (isUp && speedX > 0.5 && !this.__xSwiped) {
        this.__emitter.emit('startSwipeX', { dir }), this.__xSwiped = true, this.__needsUpdateX = true
      }
      if (isDown && this.__xSwiped) {
        this.__emitter.emit('endSwipeX', { dir }), this.__xSwiped = false, this.__needsUpdateX = true

      }
    }

    if (speedY) {
      this.__pushHistory(null, smoothDelta.y)
      const isUp = this.__isSpeedUp(this.__smooth_y_his)
      const isDown = this.__isSpeedDown(this.__smooth_y_his)
      const dir = (scrollDeltaY > 0) ? 1 : -1

      if (isUp && speedY > 0.5 && !this.__ySwiped) {
        this.__emitter.emit('startSwipeY', { dir }), this.__ySwiped = true, this.__needsUpdateY = true
      }
      if (isDown && this.__ySwiped) {
        this.__emitter.emit('endSwipeY', { dir }), this.__ySwiped = false, this.__needsUpdateY = true
      }
    }
  }

  on(event, callback) {
    this.__emitter.on(event, callback)
    return this
  }

  consumeSwipeX(object, keyName) {
    const wasNeeded = this.__needsUpdateX
    this.__needsUpdateX = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  consumeSwipeY(object, keyName) {
    const wasNeeded = this.__needsUpdateY
    this.__needsUpdateY = false
    if (object && keyName) object[keyName] = wasNeeded
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
  if (smoothX) this.__push('__smooth_x_his', smoothX, SwipeManager.DELTA_HISTORY_SIZE)
  if (smoothY) this.__push('__smooth_y_his', smoothY, SwipeManager.DELTA_HISTORY_SIZE)
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
  __mustAssetsLen = 0
  __nonMustAssetsLen = 0
  __mustLoaded = false
  __allLoaded = false
  __needsUpdateLoadedMust = false
  __needsUpdateLoadedall = false
  __needsUpdateStartLoadAll = false
  __mustProgress = 0
  __nonMustProgress = 0
  __loadingManager = null
  __emitter = new Emittery()
  __assets = null
  __textureLoader = null
  __rgbeLoader = null
  __fontLoader = null

  constructor(assets) {
    if (assets) this.setup(assets)
    
    this.__loadingManager = new THREE.LoadingManager()
    this.__textureLoader = new THREE.TextureLoader(this.__loadingManager)
    this.__rgbeLoader = new RGBELoader(this.__loadingManager)
    this.__fontLoader = new FontLoader(this.__loadingManager)

    this.__loadingManager.onProgress = (url, load, total) => this.__onProgress.apply(this,[url, load, total])
    this.__loadingManager.onError = (url) => console.error(`Failed to load asset: ${url}`)
  }

  setup(assets) {
    this.__assets = assets
    this.__mustAssetsLen = Object.keys(this.__assets).filter(k => this.__assets[k].must).length
    this.__nonMustAssetsLen = Object.keys(this.__assets).filter(k => !this.__assets[k].must).length
    return this
  }

  on(event, callback) {
    this.__emitter.on(event, callback)
    return this
  }

  async whenMustLoad() {
    if (!this.__mustAssetsLen) return Promise.resolve().then(() => this.__mustLoaded = true)
    
    return Promise.all(Object.keys(this.__assets)
      .filter(key => this.__assets[key].must)
      .map(key => this.__load(key)))
      .then(() => this.__mustLoaded = true,this.__needsUpdateLoadedMust = true)
  }

  async load() {
    this.__needsUpdateStartLoadAll = true

    if (!this.__mustLoaded) await this.whenMustLoad()
    if (!this.__nonMustAssetsLen) return Promise.resolve()
    
    const checkNotMust = key => (this.__assets[key].hasOwnProperty('must') && !this.__assets[key].must)
    
    return Promise.all(Object.keys(this.__assets)
      .filter(key => checkNotMust(key))
      .map(key => this.__load(key)))
      .then(() => this.__allLoaded = true,this.__needsUpdateLoadedall = true)
  }

  consumeMustLoaded(object, keyName) {
    const wasNeeded = this.__needsUpdateLoadedMust
    this.__needsUpdateLoadedMust = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  consumeStartedLoadingAll(object, keyName) {
    const wasNeeded = this.__needsUpdateStartLoadAll
    this.__needsUpdateStartLoadAll = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  consumeAllLoaded(object, keyName) {
    const wasNeeded = this.__needsUpdateLoadedall
    this.__needsUpdateLoadedall = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }

  __selectLoader(type) {
    let loader = null

    switch(type.toUpperCase()) {
      case 'TEXTURE':
        loader = this.__textureLoader
        break
      case 'HDR':
        loader = this.__rgbeLoader
        break
      case 'FONT':
        loader = this.__fontLoader
        break
      default:
        loader = this.__textureLoader
    }

    return loader
  }

  __load(key) {
    const asset = this.__assets[key]

    return new Promise((resolve, reject) => {
      this.__selectLoader(asset.type)
        .load(asset.url,
          data => {
            this.__assets[key] = data
            resolve(data)
        }
      )
    })
  }

  __onProgress(url, number) {
     if (!this.__mustLoaded) {
      this.__mustProgress = number / this.__mustAssetsLen
      this.__emitter.emit('mustAssetsLoading', { progress: this.__mustProgress })
    } else {
      this.__nonMustProgress = (number - this.__mustAssetsLen) / this.__allAssetsLen
      this.__emitter.emit('nonMustAssetsLoading', { progress: this.__nonMustProgress })
    }
  }

  dispose() {
    this.__emitter.clearListeners()
    this.__loadingManager = null
    if (!this.__assets) return

    for (const key in this.__assets) {
      const asset = this.__assets[key]
      
      if (!asset) {
        delete this.__assets[key]; continue
      }

      if (asset.type === 'Font') {
        this.__assets[key] = null
        delete this.__assets[key]
        continue
      }

      if (asset.isTexture) {
        asset.dispose()
      }

      try { asset.dispose() } catch (_) { }
      this.__assets[key] = null
      delete this.__assets[key]
    }

    this.__assets = null
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

  consumeViewportUpdate(object, keyName = 'needsViewportUpdate') {
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
class InputKeyManager {
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
 * CursorManager
 */
class CursorManager{
  static LISTENER_OPTION ={passive:true}
  __emitter = new Emittery()
  __position = new THREE.Vector2(0, 0)
  __delta = new THREE.Vector2(0, 0)
  __speed = 0
  __rafId = null
  __needsUpdate = false
  constructor() {
    this.setup()
  }
  get position() {
    return this.__position.clone()
  }
  setup() {
    window.addEventListener('mousemove', this.__onMouseMove, CursorManager.LISTENER_OPTION)
  }
  on(event,callback) {
    this.__emitter.on(event, callback)
    return this
  }
  consumeCursorUpdate(object, keyName) {
    const wasNeeded = this.__needsUpdate
    this.__needsUpdate = false
    if (object && keyName) object[keyName] = wasNeeded
    return wasNeeded
  }
  __mouseMove(event) {
    const newPosition = new THREE.Vector2(event.clientX, event.clientY)
    this.__delta.copy(newPosition).sub(this.__position)
    this.__position.copy(newPosition)

    this.__speed = this.__delta.length()
    this.__needsUpdate = true

    this.__emitter.emit('cursormove', { position: this.__position })
    cancelAnimationFrame(this.__rafId)
    this.__rafId = null
  }
  __onMouseMove = event => {
    cancelAnimationFrame(this.__rafId)
    this.__rafId = requestAnimationFrame(()=>this.__mouseMove(event))
  }
  dispose() {
    window.removeEventListener('mousemove', this.__onMouseMove, CursorManager.LISTENER_OPTION)
    this.__emitter.clearListeners()
    if(this.__rafId) cancelAnimationFrame(this.__rafId),this.__rafId = null
  }
}

/**
 * Xapp
 * A base class for creating applications with scrolling and touch support.
 */
class Xapp {
  static RESIZE_FRAG = 'needsResizeUpdate'
  static SCROLL_FRAG = 'needsScrollUpdate'
  static SWIPE_X_FRAG = 'needsSwipeXTriggered'
  static SWIPE_Y_FRAG = 'needsSwipeYTriggered'
  static CURSOR_MOVE_FRAG = 'needsCursorMoved'

  /**
   * Manager
   */
  viewportManager = new ViewportManager()
  inputKeyManager = new InputKeyManager()
  scrollManager = new ScrollManager()
  swipeManager = new SwipeManager()
  cursorManager = new CursorManager()

  /**
   * Tiker
   */
  tickerDispose = null

  viewSize = this.viewportManager.size
  scrollDelta = this.scrollManager.delta
  scrollSpeed = this.scrollManager.speed
  scrollPosition = this.scrollManager.position
  cursorPosition = this.cursorManager.position

  constructor() {
    this.inputKeyManager
      .on('keyPressed', arg => this.onKeyPressed(arg.event, arg.isCombKey, arg.isAnyKey))
      .on('keyReleased', arg => this.onKeyReleased(arg.event))
    
    this.scrollManager
      .on('scroll', arg => { })
    
    this.swipeManager
      .on('startSwipeX', arg => this.onSwipeXStart(arg.dir))
      .on('endSwipeX', arg => this.onSwipeXEnd(arg.dir))
      .on('startSwipeY', arg => this.onSwipeYStart(arg.dir))
      .on('endSwipeY', arg => this.onSwipeYEnd(arg.dir))
    

  this.tickerDispose = Ticker((arg) => {
      let { time, deltaTime } = arg

      this.swipeManager.update(this.scrollDelta.x, this.scrollDelta.y, deltaTime)

      // Frag Manage
      this.viewportManager.consumeViewportUpdate(this, Xapp.RESIZE_FRAG)
      this.scrollManager.consumeScrollUpdate(this, Xapp.SCROLL_FRAG)
      this.swipeManager.consumeSwipeX(this, Xapp.SWIPE_X_FRAG)
      this.swipeManager.consumeSwipeY(this, Xapp.SWIPE_Y_FRAG)
  this.cursorManager.consumeCursorUpdate(this, Xapp.CURSOR_MOVE_FRAG)

      this.viewSize = this.viewportManager.size
      this.scrollDelta = this.scrollManager.delta
      this.scrollSpeed = this.scrollManager.speed
      this.scrollPosition = this.scrollManager.position
      this.cursorPosition = this.cursorManager.position

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
}

export default class Xdraw extends Xapp {
  static MUST_ASSETS_LOADED_FRAG = 'mustAssetsLoaded'
  static START_LOAD_ALL_ASSETS_FRAG = 'startLoadAllAssets'
  static ALL_ASSETS_LOADED_FRAG = 'allAssetsLoaded'
  
  assetsManager = new AssetManager()

  CANVAS_ID = 'webgl'
  PIXEL_RATIO = 2
  TWEAK_WIDTH = 280
  RENDERER_OPT = {
    preserveDrawingBuffer:false,
    antialias: false,
    powerPreference: 'high-performance',  
    alpha: false
  }

  deviceType = 'pc'
  mustAssetsProgress = 0
  nonMustAssetsProgress = 0

  __isContinueUpdate = false
  __firstLoop = true

  constructor(parser) {
    super()
    /**
     * ========= Check device =========
     */
    const type = parser.getDevice().type
    if (type) this.device_type = type 
  }
  async __setup() {
    /**
     * Tweak pane
     */
    this.gui = new Pane({ title: 'Parameters', expanded: true })
    this.gui.registerPlugin(EssentialsPlugin)
    this.gui.hidden = true
    document.documentElement.style.setProperty('--tweakpane-width', `${this.TWEAK_WIDTH}px`)

    /**
     * Asset setting
     */
    this.assetsManager
      .setup(this.assets)
      .on('mustAssetsLoading', p => { this.mustAssetsProgress = p.progress })
      .on('nonMustAssetsLoading', p => this.nonMustAssetsProgress = p.progress)

    /**
     * ========= Setup code =========
     */
    this.canvas = document.getElementById(this.CANVAS_ID)
    if (!this.canvas) throw new Error(`Canvas element with ID '${this.CANVAS_ID}' not found`)
    
    this.__container = this.canvas.parentNode


    /**
     * ========= clock =========
     */
    this.__timer = new THREE.Timer()


    /**
     * ========= renderer =========
     */
    this.RENDERER_OPT.canvas = this.canvas
    
    try {
      this.renderer = new THREE.WebGLRenderer(this.RENDERER_OPT)
    } catch (error) {
      console.error('WebGL initialization failed:', error)
      if (!this.renderer) throw new Error('WebGL is not supported or available in this browser')
    }
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.PIXEL_RATIO))
    this.renderer.setSize(this.viewSize.x, this.viewSize.y, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMaBıpping
    

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
    this.cameraGroup = new THREE.Group()
    const aspect = this.viewSize.x / this.viewSize.y
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
    this.camera.position.set(3, 3, 3)
    this.camera.lookAt(0, 0, 0)
    this.cameraGroup.add(this.camera)
    this.scene.add(this.cameraGroup)

    
    /**
     * ========= Post processing =========
     */
    const pr = Math.min(window.devicePixelRatio, this.PIXEL_RATIO)
    this.effectComposer = new EffectComposer(this.renderer)

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

    // Output
    const outputPass = new OutputPass()
    this.effectComposer.addPass(outputPass)
    this.effectComposer.setPixelRatio(pr)
    this.effectComposer.setSize(this.viewSize.x, this.viewSize.y)


    /**
     * ========= Controls =========
     */
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    
    /**
     * ========= App setUp =========
     */
    await this.appSetup()


    /**
     * ========= Debug =========
     */
    this.fpsGraph = this.gui.addBlade({ view: 'fpsgraph', label: 'fpsgraph', rows: 1 })

    const arrowHelperGui = this.gui.addFolder({title:'ArrowHelper'})
    arrowHelperGui.addBinding(this.arrowHelper, 'visible')

    this.tweak(this.gui)
  }
  update(time, deltaTime) {
    /**
     * ========= Flag manage =========
     */
    this.assetsManager.consumeMustLoaded(this, Xdraw.MUST_ASSETS_LOADED_FRAG)
    this.assetsManager.consumeStartedLoadingAll(this, Xdraw.START_LOAD_ALL_ASSETS_FRAG)
    this.assetsManager.consumeAllLoaded(this, Xdraw.ALL_ASSETS_LOADED_FRAG)

    if (this[Xdraw.START_LOAD_ALL_ASSETS_FRAG]) this.__isContinueUpdate = true
      
    if (!this.__isContinueUpdate) return

    /**
     * ========= Tweak pane fps begin =========
     */
    this.fpsGraph.begin()
    
    /**
     * ========= Timer =========
     */
    this.__timer.update()

   
    /**
    * ========= Update utilitys =========
    */
    if (this.controls.enabled) this.controls.update()    


    /**
     * ========= Main draw =========
     */
    
    this.draw(this.__timer.getElapsed(), deltaTime)
    
    
  
    /**
    * ========= handle resize viewport =========
    */
    if (this[Xdraw.RESIZE_FRAG])
    {
      const pr = Math.min(window.devicePixelRatio, this.PIXEL_RATIO)
      
      this.renderer.setPixelRatio(pr)
      this.renderer.setSize(this.viewSize.x, this.viewSize.y, false)
      this.camera.aspect = this.viewSize.x / this.viewSize.y
      this.camera.updateProjectionMatrix()
      this.effectComposer.setPixelRatio(pr)
      this.effectComposer.setSize(this.viewSize.x, this.viewSize.y)
    }

    /**
     * ========= render =========
     */
    this.effectComposer.render()

    
    /**
     * ========= Tweak pane fps end =========
     */
    this.fpsGraph.end()
  }

  onSwipeXStart(dir) { this.swipe(new THREE.Vector3(1, 0, dir)) }
  onSwipeXEnd(dir) { this.swipe(new THREE.Vector3(1, 0, dir)) }
  onSwipeYStart(dir) { this.swipe(new THREE.Vector3(0, 1, dir)) }
  onSwipeYEnd(dir) { this.swipe(new THREE.Vector3(0, 1, dir)) }
  onKeyPressed(event, isCombKey, isAnyKey) {
    this.key(event, isCombKey, isAnyKey)

    // Toggle GUI
    if (isAnyKey(['h']))
    {
      this.gui.hidden = !this.gui.hidden
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
    const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement

    try {
      if (isFull) {
        (doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen)?.call(doc)
      } else {
        (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)
          ?.call(el)
          .catch(() => { })
      }
    } catch (_) { }
  }

  async loadMustAssetsAndMarkComplete() {
    await this.assetsManager.whenMustLoad()
    this.__is_must_assets_loaded = true
  }

  async loadNonMustAssetsAndMarkComplete() {
    await this.assetsManager.load()
    this.__is_all_assets_loaded = true
  }
  dispose() {
    console.log('===== dispose =====')
    /**
     * OrbitControls
     */
    this.controls?.dispose()

    /**
     * Tiker
     */
    this.tickerDispose()

    /**
     * Tweak pane
     */
    this.gui.dispose()

    /**
     * Effect
     */
    this.effectComposer.dispose()


    /**
     * Dispose Manager
     */
    this.viewportManager.dispose()
    this.inputKeyManager.dispose()
    this.scrollManager.dispose()
    this.swipeManager.dispose()
    this.cursorManager.dispose()
    this.assetsManager.dispose()

    /**
     * Dispose scene objects
     */
    let geometryes = [], materials = [], meshes = []
    this.scene.traverse(obj => {
      if (obj.isMesh) {
        const mesh = obj
        const { geometry, material } = mesh
        if(geometry) geometryes.push(geometry)
        if(material) materials.push(material)
        meshes.push(mesh)
      }
    })
    geometryes.forEach(geometry => geometry.dispose())
    materials.forEach(meterial => meterial.dispose())
    this.scene.remove(...meshes)

    /**
     * Dispose renderer
     */
    this.renderer.dispose()
  }

  /**
   * App methods
   */
  async appSetup() { }
  effect(addPass, ShaderPass) { }
  tweak(gui) { }
  key(event, isCombKey, isAnyKey) { }
  swipe(vec3){}
  draw(time, deltaTime) { }
}
