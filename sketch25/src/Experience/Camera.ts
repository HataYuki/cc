import { PerspectiveCamera, Scene } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Experience from "./Experience"

export default class Camera
{
    // Property setup
    private experience: Experience
    private viewport: IViewport
    private readonly canvas: HTMLCanvasElement
    private scene: Scene
    public instance: PerspectiveCamera
    public controls: OrbitControls

    constructor()
    {
        // Setup
        this.experience = Experience.getInstance()
        this.viewport = this.experience.viewport
        this.canvas = this.experience.canvas
        this.scene = this.experience.scene
        // Perspective camera
        this.instance = this.getInstance()
        // Orbit controls
        this.controls = this.getOrbitControls()
    }

    private getInstance()
    {
        this.instance = new PerspectiveCamera(
            35,
            this.viewport.width / this.viewport.height,
            0.1,
            100
        )
        this.instance.position.set(6, 4, 8)
        this.scene.add(this.instance)

        return this.instance
    }

    private getOrbitControls()
    {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
        return this.controls
    }

    resize()
    {
        this.instance.aspect = this.viewport.aspect
        this.instance.updateProjectionMatrix()
    }

    update()
    {
        this.controls.update()
    }
}