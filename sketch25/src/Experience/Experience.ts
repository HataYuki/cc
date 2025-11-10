import * as THREE from 'three'
import Viewport from "./Utils/Viewport"
import Camera from './Camera'
import Renderer from './Renderer'
import Time from './Utils/Time'
import World from './World/World'
import Tweak from './Utils/Tweak'
import Resources from './Utils/Resources.ts'
import sources from './sources'

export default class Experience
{
    private static instance: Nullable<Experience> = null
    public readonly canvas: HTMLCanvasElement
    private __resize: () => void
    private __update: () => void
    tweak: Tweak
    viewport: Viewport
    time: Time
    scene: THREE.Scene
    camera: Camera
    renderer: Renderer
    resources: Resources
    world: World
    private constructor(
        canvas?: HTMLCanvasElement
    )
    {
        if(!canvas)
        {
            throw new Error('Canvas not found')
        }
        this.canvas = canvas

        // Setup instance
        Experience.instance = this
        window.experience = this

        // Setup
        this.tweak = new Tweak()
        this.resources = new Resources(sources)
        this.viewport = new Viewport()
        this.scene = new THREE.Scene()
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.time = new Time(this.renderer.instance)
        this.world = new World()

        // Viewport resize event
        this.__resize = () => this.resize()
        this.viewport.on('resize', this.__resize)

        // Animation tick event
        this.__update = () => this.update()
        this.time.on('update', this.__update)
    }

    resize()
    {
        this.camera.resize()
        this.renderer.resize()
    }

    update()
    {
        if(this.tweak.fps) this.tweak.fps.begin()

        this.camera.update()
        this.renderer.update()
        this.world.update()

        if(this.tweak.fps) this.tweak.fps.end()
    }

    destory()
    {
        this.viewport.removeEventListener('resize', this.__resize)
        this.time.removeEventListener('update', this.__update)

        // Traverse the whole scene
        this.scene.traverse(child =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.geometry.dispose()
                for(const key in child.material)
                {
                    const value = child.material[key]
                    if(value && typeof value.dispose === 'function')
                    {
                        value.dispose()
                    }
                }
            }
        })

        this.camera.controls.dispose()
        this.renderer.instance.dispose()

        if(this.tweak.instance)
        {
            this.tweak.instance.dispose()
        }
    }

    public static getInstance(canvas?:HTMLCanvasElement): Experience
    {
        // Singleton
        if (!Experience.instance)
        {
            Experience.instance = new Experience(canvas)
        }

        return Experience.instance
    }
}