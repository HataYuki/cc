import * as THREE from 'three'
import Viewport from "./Utils/Viewport"
import Camera from './Camera.ts'
import Renderer from './Renderer'
import World from './World/World'
import Tweak from './Utils/Tweak'
import Resources from './Utils/Resources'
import Input from './Utils/Input/Input'
import Sequence from './Sequence/Sequence'

import keyboardInputConfig from './Utils/Input/Config/keyboardInputConfig.ts'
import sources from './sources'

export default class Game
{
    private static instance: Nullable<Game> = null

    canvas:    HTMLCanvasElement
    tweak:     Tweak
    viewport:  Viewport
    scene:     THREE.Scene
    camera:    Camera
    renderer:  Renderer
    resources: Resources
    world:     World
    input:     Input
    sequence:  Sequence

    private constructor(
        canvas?: HTMLCanvasElement
    )
    {
        if(!canvas)
        {
            throw new Error('Canvas not found')
        }

        this.canvas   = canvas
        Game.instance = this
        window.game   = this

        this.tweak      = new Tweak()
        this.viewport   = new Viewport()
        this.scene      = new THREE.Scene()
        this.camera     = new Camera()
        this.renderer   = new Renderer()
        this.resources  = new Resources(sources)
        this.world      = new World()
        this.input      = Input.getInstance({
            keyboard: keyboardInputConfig,
        })
        this.sequence   = new Sequence()
        
        this.viewport.on('resize',          this.resize)
        this.renderer.on('update',          this.update)
        this.input.on('fullscreen:down', this.fullScreen)
    }

    resize = () =>
    {
        this.camera.resize()
        this.renderer.resize()
    }

    update = () =>
    {
        this.tweak.fpsMonitorBegin()
        
        this.sequence.update()
        this.camera.update()
        this.world.update()

        this.tweak.fpsMonitorEnd()
    }

    fullScreen = () =>
    {
        const isFull = document.fullscreenElement
            
        if (isFull) document.exitFullscreen()
        else document.documentElement.requestFullscreen()
    }

    destory()
    {
        this.viewport.removeEventListener('resize', this.resize)
        this.renderer.removeEventListener('update', this.update)

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

        this.world.dispose()
        this.resources.dispose()
        this.camera.controls.dispose()
        this.renderer.instance.dispose()
        this.input.dispose()

        if(this.tweak.gui)
        {
            this.tweak.gui.dispose()
        }

        this.input.dispose()
    }

    public static getInstance(canvas?: HTMLCanvasElement): Game
    {
        if (!Game.instance)
        {
            Game.instance = new Game(canvas)
        }

        return Game.instance
    }
}