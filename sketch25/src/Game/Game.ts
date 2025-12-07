import * as THREE from 'three'
import Viewport from "./Utils/Viewport.ts"
import Camera from './Camera.ts'
import Renderer from './Renderer.ts'
import World from './World/World.ts'
import Tweak from './Utils/Tweak.ts'
import Resources from './Utils/Resources.ts'
import sources from './sources.ts'
import Keyboard from './Utils/Keyboard.ts'
import keyboardInputConf from './keyboardInputConfig.ts'
import Navigate from './Navigate.ts'

export default class Game
{
    private static instance: Nullable<Game> = null

    canvas:    HTMLCanvasElement
    tweak:     Tweak
    viewport:  Viewport
    keyboard:  Keyboard
    navigate:  Navigate
    scene:     THREE.Scene
    camera:    Camera
    renderer:  Renderer
    resources: Resources
    world:     World

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
        this.keyboard   = new Keyboard(keyboardInputConf)
        this.scene      = new THREE.Scene()
        this.camera     = new Camera()
        this.renderer   = new Renderer()
        this.resources  = new Resources(sources)
        this.navigate   = new Navigate({})
        this.world      = new World()
        
        this.viewport.on('resize',  this.resize)
        this.renderer.on('update',  this.update)
        this.navigate.on('scrollX', this.scroll)
        this.navigate.on('scrollY', this.scroll)

        // Debug
        if (this.tweak.gui)
        {
            const { gui } = this.tweak
            const guiKeyInput = gui.addFolder({ title: 'Keyboard' })
            guiKeyInput.expanded = false
            guiKeyInput.addBinding(this.keyboard, 'pressedKeysStr', { readonly: true })
        }
        
    }

    resize = () =>
    {
        this.camera.resize()
        this.renderer.resize()
    }

    update = () =>
    {
        this.tweak.fpsMonitorBegin()
        
        this.navigate.update()
        this.camera.update()
        this.world.update()

        this.tweak.fpsMonitorEnd()
    }

    scroll = ({ dir }: { dir: string }) =>
    {
        if (dir === 'x')
        {
            
        }
        if (dir === 'y')
        {
            
        }
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

        if(this.tweak.gui)
        {
            this.tweak.gui.dispose()
        }

        this.keyboard.dispose()
    }

    public static getInstance(canvas?:HTMLCanvasElement): Game
    {
        if (!Game.instance)
        {
            Game.instance = new Game(canvas)
        }

        return Game.instance
    }
}