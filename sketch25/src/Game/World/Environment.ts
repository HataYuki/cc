import * as THREE from 'three'
import Experience from '../Game.ts';

export default class Environment
{
    private experience: Experience
    private scene: THREE.Scene
    private resources: IResources
    private tweak: ITweak

    private environmentMap: Datatype<'ktx2'>
    private sunLight: THREE.DirectionalLight

    constructor()
    {
        this.experience = Experience.getInstance()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.tweak = this.experience.tweak

        this.sunLight = this.initSunLight()
        this.environmentMap = this.initEnvironmentMap()

        if(this.tweak.gui)
        {
            const gui = this.tweak.gui
            const guiEnvironment = gui.addFolder({ title: 'Environment' })
            
            guiEnvironment.addBinding(this.sunLight, 'intensity', {label:'sun intensity',min:0, max:10, step:0.001})
            guiEnvironment.addBinding(this.sunLight.position, 'x', {label:'sun pos x', min:0, max:10, step:0.001})
            guiEnvironment.addBinding(this.sunLight.position, 'y', {label:'sun pos y', min:0, max:10, step:0.001})
            guiEnvironment.addBinding(this.sunLight.position, 'z', { label: 'sun pos x', min: 0, max: 10, step: 0.001 })
            
            guiEnvironment.addBinding(this.scene, 'environmentIntensity', {min:0, max:4, step:0.01})
        }
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

        return directionalLight
    }

    private initEnvironmentMap()
    {
        
        this.environmentMap = this.resources.items.envTextureKtx
        this.environmentMap.flipY = true
        this.environmentMap.mapping = THREE.EquirectangularReflectionMapping
        // this.environmentMap.colorSpace = SRGBColorSpace
        this.scene.environment = this.environmentMap
        this.scene.background = this.environmentMap
        
        return this.environmentMap
    }

    dispose()
    {
        this.scene.remove(this.sunLight)
        this.sunLight.dispose()
        this.environmentMap.dispose()
    }
}