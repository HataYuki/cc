import * as THHREE from 'three'
import Game from "./Game";

type Events = 'scrollstart' | 'scrollEnd' 
type EventMap = { [N in Events]: { _: undefined } }
    & { scrollX: { dir: 'x' } } & { scrollY: {dir: 'y'} }
interface Option {
    wheelMul: number
    touchMul: number
    applyScroll: boolean
}
interface Pos<T> { x: T, y: T }

export default class Navigate extends THHREE.EventDispatcher<EventMap>
{
    private static LINE_HEIGHT = 100 / 6
    private startTouchedPos: Pos<number> = { x: 0, y: 0 }
    private __value: Pos<number> = { x: 0, y: 0 }
    private option: Option = {
        wheelMul: 1,
        touchMul: 1,
        applyScroll: false
    }
    private game: Game
    private renderer: IRenderer
    private tweak: ITweak
    
    delta: Pos<number> = { x: 0, y: 0 }
    value: Pos<number> = { x: 0, y: 0 }

    on = this.addEventListener.bind(this)

    constructor(option: Partial<Option>)
    {
        super()

        this.option = { ...this.option, ...option }

        this.game = Game.getInstance()
        this.renderer = this.game.renderer
        this.tweak = this.game.tweak

        window.addEventListener('wheel', this.wheel, { passive: false })
        window.addEventListener('touchstart', this.touch, { passive: false })
        window.addEventListener('touchmove', this.touch, { passive: false })
        window.addEventListener('touchend', this.touch, { passive: false })

        if (this.tweak.gui)
        {
            const { gui } = this.tweak
            const tweakScroll = gui.addFolder({ title: 'Scroll' })
            tweakScroll.expanded = false
            tweakScroll.addBinding(this.value, 'y', { readonly: true, view: 'graph', min: -3000, max: 3000 })
        }
    }

    wheel = (event:WheelEvent) =>
    {
        event.preventDefault()

        let { deltaX, deltaY, deltaMode } = event
        let mulX = 1, mulY = 1

        const width = window.innerWidth
        const height = window.innerHeight
        const { wheelMul } = this.option
            
        if (deltaMode === 1) mulX = mulY = Navigate.LINE_HEIGHT
        if (deltaMode === 2) mulX = width, mulY = height

        deltaX *= mulX, deltaY *= mulY
        deltaX *= wheelMul, deltaY *= wheelMul

        this.delta.x = deltaX
        this.delta.y = deltaY

        this.__value.x += deltaX
        this.__value.y += deltaY
    }

    touch = (event:TouchEvent) =>
    {
        event.preventDefault()
        const touches = event.changedTouches
        const { clientX, clientY } = touches[0]
        const { touchMul } = this.option

        if (event.type === 'touchstart')
        {
            this.startTouchedPos.x = clientX
            this.startTouchedPos.y = clientY
        }
        else if(event.type === 'touchend')
        {
            const deltaX = - (clientX - this.startTouchedPos.x) * touchMul
            const deltaY = - (clientY - this.startTouchedPos.y) * touchMul

            this.__value.x += deltaX
            this.__value.y += deltaY

            this.delta.x = deltaX
            this.delta.y = deltaY

            this.startTouchedPos.x = 0
            this.startTouchedPos.y = 0
        }
        else if (event.type === 'touchmove')
        {
            const deltaX = - (clientX - this.startTouchedPos.x) * touchMul
            const deltaY = - (clientY - this.startTouchedPos.y) * touchMul

            this.__value.x += deltaX
            this.__value.y += deltaY

            this.delta.x = deltaX
            this.delta.y = deltaY

            this.startTouchedPos.x = clientX
            this.startTouchedPos.y = clientY
        }
    }

    // https://github.com/pmndrs/maath/blob/main/packages/maath/src/easing.ts
    damp(
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
        /** Optionally allows you to clamp the maximum speed. If smoothTime is 0.25s and looks OK
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

    update() {
        const { delta } = this.renderer
        
        const isScrollX = this.damp(
            this.value,
            'x',
            this.__value.x,
            0.25,
            delta,
            Infinity
        )
        const isScrollY = this.damp(
            this.value,
            'y',
            this.__value.y,
            0.25,
            delta,
            Infinity
        )

        // Decay
        if (Math.abs(this.delta.x) > 0 || Math.abs(this.delta.y) > 0)
        {
            let { x, y } = this.delta

            x *= 0.95
            y *= 0.95

            this.__value.x += x
            this.__value.y += x

            if(x <= 0.1) this.delta.x = 0
            if(y <= 0.1) this.delta.y = 0
        }

        if (isScrollX)
            this.dispatchEvent({ type: 'scrollX', dir: 'x' })
        if (isScrollY)
            this.dispatchEvent({ type: 'scrollY', dir: 'y' })

        if (this.option.applyScroll)
        {
            window.scroll(
                this.value.x,
                this.value.y
            )
        }
    }
}