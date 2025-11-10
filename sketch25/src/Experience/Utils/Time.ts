import {WebGLRenderer, EventDispatcher, Clock} from "three";

export default class Time extends EventDispatcher<{update: { message: undefined }}>
{
    private readonly renderer: WebGLRenderer
    private clock: Clock
    public on = this.addEventListener.bind(this)

    constructor(renderer: WebGLRenderer)
    {
        super()
        this.renderer = renderer
        this.clock = new Clock()

        this.renderer.setAnimationLoop(()=>
        {
            this.animation()
        })
    }
    public get delta()
    {
        return this.clock.getDelta()
    }
    public get elapsedTime()
    {
        return this.clock.getElapsedTime()
    }
    private animation()
    {
        this.dispatchEvent( { type:'update', message: undefined } )
    }
}