import Emittery from 'emittery'

/**
 * Math utility functions
 */

export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value))
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
export const Ticker = (callback) => {
  let lastTime = performance.now()
  let id = 0

  const loop = (time) => {
    id = requestAnimationFrame(loop)
    const deltaTime = time - lastTime

    callback({ time, deltaTime })

    lastTime = time
  }

  id = requestAnimationFrame(loop)

  return () => cancelAnimationFrame(id)
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
 * VirtualScroll
 * originally from https://github.com/darkroomengineering/lenis/blob/main/packages/core/src/virtual-scroll.ts
 */
const LINE_HEIGHT = 100 / 6
const listenerOptions = { passive: false }

export class VirtualScroll {
  touchStart = { x: 0, y: 0 }
  lastDelta = { x: 0, y: 0 }
  window = { width: 0, height: 0 }
  options = {
    wheelMultiplier: 1,
    touchMultiplier: 1,
  }

  emitter = new Emittery()

  constructor(element, options) {
    this.element = element
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      }
    }

    window.addEventListener('resize', this.onWindowResize, false)
    this.onWindowResize()

    this.element.addEventListener('wheel', this.onWheel, listenerOptions)
    this.element.addEventListener(
      'touchstart',
      this.onTouchStart,
      listenerOptions
    )
    this.element.addEventListener(
      'touchmove',
      this.onTouchMove,
      listenerOptions
    )
    this.element.addEventListener('touchend', this.onTouchEnd, listenerOptions)
  }

  /**
   * Add an event listener for the given event and callback
   *
   * @param event Event name
   * @param callback Callback function
   */
  on(event, callback) {
    return this.emitter.on(event, callback)
  }

  /** Remove all event listeners and clean up */
  destroy() {
    this.emitter.clearListeners()

    window.removeEventListener('resize', this.onWindowResize, false)

    this.element.removeEventListener('wheel', this.onWheel, listenerOptions)
    this.element.removeEventListener(
      'touchstart',
      this.onTouchStart,
      listenerOptions
    )
    this.element.removeEventListener(
      'touchmove',
      this.onTouchMove,
      listenerOptions
    )
    this.element.removeEventListener(
      'touchend',
      this.onTouchEnd,
      listenerOptions
    )
  }

  /**
   * Event handler for 'touchstart' event
   *
   * @param event Touch event
   */
  onTouchStart = (event) => {
    // @ts-expect-error - event.targetTouches is not defined
    const { clientX, clientY } = event.targetTouches
      ? event.targetTouches[0]
      : event

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = {
      x: 0,
      y: 0,
    }

    this.emitter.emit('scroll', {
      deltaX: 0,
      deltaY: 0,
      event,
    })
  }

  /** Event handler for 'touchmove' event */
  onTouchMove = (event) => {
    // @ts-expect-error - event.targetTouches is not defined
    const { clientX, clientY } = event.targetTouches
      ? event.targetTouches[0]
      : event

    const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier
    const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = {
      x: deltaX,
      y: deltaY,
    }

    this.emitter.emit('scroll', {
      deltaX,
      deltaY,
      event,
    })
  }

  onTouchEnd = (event) => {
    this.emitter.emit('scroll', {
      deltaX: this.lastDelta.x,
      deltaY: this.lastDelta.y,
      event,
    })
  }

  /** Event handler for 'wheel' event */
  onWheel = (event) => {
    let { deltaX, deltaY, deltaMode } = event

    const multiplierX =
      deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1
    const multiplierY =
      deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1

    deltaX *= multiplierX
    deltaY *= multiplierY

    deltaX *= this.options.wheelMultiplier
    deltaY *= this.options.wheelMultiplier

    this.emitter.emit('scroll', { deltaX, deltaY, event })
  }

  onWindowResize = () => {
    this.window = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }
}

/**
 * detectSwipe
 * Detects swipe gestures based on scroll deltas and time intervals.
 * @param {number} scrollDelta - The change in scroll position.
 * @param {number} deltaTime - The time since the last scroll event.
 * @param {function} onSwipe - Callback function to call when a swipe is detected.
 *
 */
const DELTA_BUFFER_SIZE = 10
const DELTA_HISTORY_SIZE = 3

const deltaYBuffer = []
const smoothDeltaHistory = []

let isSwiping = false
let initSpeedDownAndUp = false

export const detectSwipe = (scrollDelta, deltaTime, onSwipe) => {
  const dir = scrollDelta > 0 ? 1 : -1

  let dy = Math.abs(scrollDelta)

  deltaYBuffer.push(dy)
  if (deltaYBuffer.length > DELTA_BUFFER_SIZE) {
    deltaYBuffer.shift()
  }

  let smoothDelta =
    deltaYBuffer.reduce((a, c) => a + c, 0) / deltaYBuffer.length

  if (smoothDelta < 0.1) {
    smoothDelta = 0
  }

  if (smoothDelta <= 0) return

  const speed = smoothDelta / deltaTime

  smoothDeltaHistory.push(smoothDelta)
  if (smoothDeltaHistory.length > DELTA_HISTORY_SIZE) {
    smoothDeltaHistory.shift()
  }

  const isSlowDown = smoothDeltaHistory.every(
    (v, i, a) => i === 0 || v < a[i - 1]
  )
  const isSpeedUp = smoothDeltaHistory.every(
    (v, i, a) => i === 0 || v > a[i - 1]
  )

  if (isSpeedUp && !isSwiping && speed > 0.5) {
    isSwiping = true
    if (initSpeedDownAndUp) {
      // console.log("speed up")
      onSwipe(dir)
    }
  }

  if (isSlowDown && isSwiping) {
    isSwiping = false
    if (initSpeedDownAndUp) {
      // console.log("slow down")
    }

    initSpeedDownAndUp = true
  }
}

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
 * Xapp
 * A base class for creating applications with scrolling and touch support.
 */
export default class Xapp {
  static DELATA_X_MAX = 300
  static DELATA_Y_MAX = 300

  needUpdateSetup = false
  needUpdateResize = true
  needUpdateScroll = false
  needUpdateOnload = false

  virtualScroll = new VirtualScroll(document.body)
  scrollTimer = null
  emulateMobileScrollInertia = false

  __deltaX = 0
  __deltaY = 0

  __deltaXSpeed = 0
  __deltYSpeed = 0

  width = window.innerWidth
  height = window.innerHeight

  constructor() {
    window.addEventListener('load', () => (this.needUpdateOnload = true))
    window.addEventListener('resize', () => (this.needUpdateResize = true))

    document.addEventListener('touchend', this.onTap.bind(this))
    document.addEventListener('mouseup', this.onTap.bind(this))

    this.virtualScroll.on('scroll', (arg) => {
      let { deltaX, deltaY, event } = arg

      event.preventDefault()

      this.__deltaX = clamp(deltaX, -1 * Xapp.DELATA_X_MAX, Xapp.DELATA_X_MAX)
      this.__deltaY = clamp(deltaY, -1 * Xapp.DELATA_Y_MAX, Xapp.DELATA_Y_MAX)

      this.__deltaXSpeed = this.__deltaX / Xapp.DELATA_X_MAX
      this.__deltYSpeed = this.__deltaY / Xapp.DELATA_Y_MAX

      this.needUpdateScroll = true

      if (this.scrollTimer !== null) {
        clearTimeout(this.scrollTimer)
      }

      if (event.type === 'touchstart') {
        this.__deltaX = this.__deltaY = 0
      }

      this.scrollTimer = setTimeout(() => {
        if (
          event.type === 'touchend' ||
          this.__deltaY !== 0 ||
          this.__deltaX !== 0
        )
          this.emulateMobileScrollInertia = true
      }, 80)
    })

    const smpInertiaY = () => {
      const inertiaDecay = 0.9
      const threshold = 0.1

      const d = Math.abs(this.__deltaY)

      if (d > threshold) {
        this.__deltaY *= inertiaDecay
      }

      if (d <= threshold) {
        this.__deltaY = 0
        this.emulateMobileScrollInertia = false
      }

      this.needUpdateScroll = true
    }

    Ticker((arg) => {
      let { time, deltaTime } = arg

      this.width = window.innerWidth
      this.height = window.innerHeight

      if (this.emulateMobileScrollInertia) {
        smpInertiaY()
      }

      detectSwipe(this.__deltaY, deltaTime, (dir) => this.onSwipe(dir))
      this.onUpdate(time, deltaTime, { x: this.__deltaX, y: this.__deltaY })

      this.needUpdateSetup = false
      this.needUpdateResize = false
      this.needUpdateScroll = false
      this.needUpdateOnload = false
    })
  }

  onSetup() {}
  onTap(event) {}
  onSwipe(dir) {}
  onUpdate(time, deltaTime, deltaScroll) {}
}
