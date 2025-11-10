import * as THREE from 'three'
import Experience from "./Experience.ts";
import { type FolderApi} from "@tweakpane/core";

export default class Renderer extends THREE.EventDispatcher<{ loop: { message:undefined } }>
{
    private experience: Experience
    private readonly canvas: HTMLCanvasElement
    private viewport: IViewport
    private camera: ICamera
    private readonly scene: THREE.Scene
    private tweak: ITweak
    private tweakRenderer!: Nullable<FolderApi>
    public instance: THREE.WebGLRenderer

    constructor()
    {
        super()
        this.experience = Experience.getInstance()
        this.canvas = this.experience.canvas
        this.viewport = this.experience.viewport
        this.camera = this.experience.camera
        this.scene = this.experience.scene
        this.tweak = this.experience.tweak

        if(this.tweak.instance)
        {
            this.tweakRenderer = this.tweak.instance.addFolder({title:'Renderer'})
        }
        this.instance = this.initRenderer()
    }

    private initRenderer()
    {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        })
        // Renderer setup
        this.instance.setSize(this.viewport.width, this.viewport.height, false)
        this.instance.setPixelRatio(this.viewport.pixelRatio)

        // Color
        this.instance.outputColorSpace = THREE.SRGBColorSpace

        // Tone mapping
        this.instance.toneMapping = THREE.ReinhardToneMapping
        this.instance.toneMappingExposure = 1

        // Shadow
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap

        if(this.tweakRenderer)
        {
            this.tweakRenderer.addBinding(this.instance.info.memory,'geometries',{readonly:true, interval:500})
            this.tweakRenderer.addBinding(this.instance.info.memory,'textures',{readonly:true, interval:500})
        }

        return this.instance
    }

    resize()
    {
        this.instance.setSize(this.viewport.width, this.viewport.height, false)
        this.instance.setPixelRatio(this.viewport.pixelRatio)
    }

    update()
    {
        this.instance.render(this.scene, this.camera.instance)
    }
}