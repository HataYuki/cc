import * as THREE from 'three'
import Experience from '../Experience.ts';
import type {FolderApi} from "@tweakpane/core";

export default class Environment
{
    private experience: Experience
    private scene: THREE.Scene
    private resources: IResources
    private tweak: ITweak
    private tweakEnvironment!: Nullable<FolderApi>
    environmentMap: THREE.CubeTexture
    sunLight: THREE.DirectionalLight

    constructor()
    {
        this.experience = Experience.getInstance()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.tweak = this.experience.tweak

        if(this.tweak.instance)
        {
            this.tweakEnvironment = this.tweak.instance.addFolder({title:'Environment'})
        }

        this.sunLight = this.initSunLight()
        this.environmentMap = this.initEnvironmentMap()
    }

    private initSunLight()
    {
        const directionalLight = new THREE.DirectionalLight('#ffffff', 4)
        const mapSize = Math.pow(2, 9)
        directionalLight.shadow.mapSize.set(mapSize, mapSize)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.far = 15
        directionalLight.shadow.bias = 0.05
        directionalLight.position.set(3.5, 2, -1.25)

        this.scene.add(directionalLight)

        if(this.tweakEnvironment)
        {
            this.tweakEnvironment.addBinding(directionalLight, 'intensity', {label:'sun intensity',min:0, max:10, step:0.001})
            this.tweakEnvironment.addBinding(directionalLight.position, 'x', {label:'sun pos x', min:0, max:10, step:0.001})
            this.tweakEnvironment.addBinding(directionalLight.position, 'y', {label:'sun pos y', min:0, max:10, step:0.001})
            this.tweakEnvironment.addBinding(directionalLight.position, 'z', {label:'sun pos x', min:0, max:10, step:0.001})
        }

        return directionalLight
    }

    private initEnvironmentMap()
    {　
        this.environmentMap = this.resources.items.environmentMapTexture
        this.scene.environment = this.environmentMap
        // this.scene.environmentIntensity = 1

        if(this.tweakEnvironment)
        {
            this.tweakEnvironment.addBinding(this.scene, 'environmentIntensity', {min:0, max:4, step:0.01})
        }

        return this.environmentMap
    }
}