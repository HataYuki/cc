import * as THHREE from 'three'
import Experience from "./Game.ts";

export default class Renderer extends THHREE.EventDispatcher<{ update: { message:undefined } }>
{
    private experience: Experience
    private canvas: HTMLCanvasElement
    private viewport: IViewport
    private camera: ICamera
    private scene: THHREE.Scene
    private tweak: ITweak
    private clock: THHREE.Clock

    instance: THHREE.WebGLRenderer
    delta: number = 60 / 1000
    elapsedTime: number = 0

    on = this.addEventListener.bind(this)

    constructor()
    {
        super()
        this.experience = Experience.getInstance()
        this.canvas = this.experience.canvas
        this.viewport = this.experience.viewport
        this.camera = this.experience.camera
        this.scene = this.experience.scene
        this.tweak = this.experience.tweak

        this.clock = new THHREE.Clock()
        this.instance = this.initRenderer()
        
        this.instance.setAnimationLoop(() =>
        {
            this.delta = this.clock.getDelta()
            this.elapsedTime = this.clock.getElapsedTime()

            this.dispatchEvent({ type: 'update', message: undefined })

            this.instance.render(this.scene, this.camera.instance)
        })

        if(this.tweak.gui) 
        {
            const gui = this.tweak.gui
            const guiRenderer = gui.addFolder({ title: 'Renderer' })
            
            guiRenderer.addBinding(this.instance.info.memory,'geometries',{label:'Geom' ,readonly:true, interval:500})
            guiRenderer.addBinding(this.instance.info.memory, 'textures', { label: 'Tex', readonly: true, interval: 500 })
            
            guiRenderer.expanded = false
        }
    }

    private initRenderer()
    {
        this.instance = new THHREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        })

        // Renderer setup
        this.instance.setSize(this.viewport.width, this.viewport.height, false)
        this.instance.setPixelRatio(this.viewport.pixelRatio)

        // Backkground color
        this.instance.setClearColor('black')

        // Color
        this.instance.outputColorSpace = THHREE.SRGBColorSpace

        // Tone mapping
        this.instance.toneMapping = THHREE.ReinhardToneMapping
        this.instance.toneMappingExposure = 1

        // Shadow
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THHREE.PCFSoftShadowMap

        return this.instance
    }

    resize()
    {
        this.instance.setSize(this.viewport.width, this.viewport.height, false)
        this.instance.setPixelRatio(this.viewport.pixelRatio)
    }
}