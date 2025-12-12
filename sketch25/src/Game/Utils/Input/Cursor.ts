import * as THREE from 'three'
import Input from './Input'

interface Pos<T> { x: T, y: T }
export type CursorEventNames = 'cursormove' | 'cursormovestart' | 'cursormovestop'
export type CursorEvents = { [N in CursorEventNames] : { _: undefined } }

export default class Cursor extends THREE.EventDispatcher<CursorEvents>
{
    private input:Input
    private __value: Pos<number> = { x: 0, y: 0 }
    private moved = false
    private eventTypeTouch = false

    value: Pos<number> = { x: 0, y: 0 }
    delta: Pos<number> = { x: 0, y: 0 }
    velocity: Pos<number> = { x: 0, y: 0 }

    on = this.addEventListener.bind(this)

    constructor()
    {
        super()

        this.input = Input.getInstance()

        window.addEventListener('pointermove', this.pointer)
        window.addEventListener('touchmove', this.pointer)
    }

    private damp(
        /** The object */
        current: { [key: string]: any },
        /** The key to animate */
        prop: string,
        /** To goal value */
        target: number,
        /** Approximate time to reach the target. A smaller value will reach the target faster. */
        smoothTime = 0.25,
        /** Frame delta, for refreshrate independence */
        delta = 0.01,
        /** NavigateOptionally allows you to clamp the maximum speed. If smoothTime is 0.25s and looks OK
         *  going between two close points but not for points far apart as it'll move very rapid,
         *  then a maxSpeed of e.g. 1 which will clamp the speed to 1 unit per second, it may now
         *  take much longer than smoothTime to reach the target if it is far away. */
        maxSpeed = Infinity,
        /** End of animation precision */
        eps = 0.001,
        /** Easing function */
        easing = (t: number) => 1 / (1 + t + 0.48 * t * t + 0.235 * t * t * t),
    )
    {
        const vel = "velocity_" + prop;
        if (current.__damp === undefined) current.__damp = {};
        if (current.__damp[vel] === undefined) current.__damp[vel] = 0;

        if (Math.abs(current[prop] - target) <= eps) {
          current[prop] = target;
          return false;
        }
    
        smoothTime = Math.max(0.0001, smoothTime);
        const omega = 2 / smoothTime;
        const t = easing(omega * delta);
        let change = current[prop] - target;
        const originalTo = target;
        // Clamp maximum maxSpeed
        const maxChange = maxSpeed * smoothTime;
        change = Math.min(Math.max(change, -maxChange), maxChange);
        target = current[prop] - change;
        const temp = (current.__damp[vel] + omega * change) * delta;
        current.__damp[vel] = (current.__damp[vel] - omega * temp) * t;
        let output = target + (change + temp) * t;
        // Prevent overshooting
        if (originalTo - current[prop] > 0.0 === output > originalTo) {
          output = originalTo;
          current.__damp[vel] = (output - originalTo) / delta;
        }
        current[prop] = output;
        return true;
    }

    pointer = (event: PointerEvent | TouchEvent) =>
    {
        let e = (event instanceof TouchEvent) ? event.changedTouches[0] : event

        if (event.type === 'touchmove')
        {
            if (!this.eventTypeTouch) window.addEventListener('touchend', this.touchend)
            this.eventTypeTouch = true
        }
        else
        {
            this.eventTypeTouch = false
            window.removeEventListener('touchend', this.touchend)
        }
        
        const { clientX, clientY } = e

        this.__value.x = clientX
        this.__value.y = clientY
    }

    touchend = () =>
    {
        this.moved = false
        this.dispatchEvent({ type: 'cursormovestop', _: undefined })

        window.removeEventListener('touchend', this.touchend)
    }
 
    update()
    {
        const isMoveX = this.damp(
            this.value,
            'x',
            this.__value.x,
            0.5,
            this.input.deltaTime,
            Infinity
        )
        const isMoveY = this.damp(
            this.value,
            'y',
            this.__value.y,
            0.5,
            this.input.deltaTime,
            Infinity
        )

        this.delta.x = this.__value.x - this.value.x
        this.delta.y = this.__value.y - this.value.y

        this.velocity.x = this.delta.x / this.input.deltaTime    
        this.velocity.y = this.delta.y / this.input.deltaTime

        if (isMoveX || isMoveY)
        {
            this.dispatchEvent({ type: 'cursormove', _: undefined })
        }

        if (isMoveX && isMoveY && !this.moved)
        {
            this.moved = true
            this.dispatchEvent({ type: 'cursormovestart', _: undefined })
        }

        if (
            (!isMoveX && !isMoveY && this.moved) &&
            !this.eventTypeTouch
        )
        {
            this.moved = false
            this.dispatchEvent({ type: 'cursormovestop', _: undefined })
        }
    }

    dispose()
    {
        window.removeEventListener('pointermove', this.pointer)
        window.removeEventListener('touchmove', this.pointer)
        window.removeEventListener('touchend', this.touchend)
    }
}