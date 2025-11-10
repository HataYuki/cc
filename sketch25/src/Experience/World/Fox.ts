import * as THREE from 'three'
import Experience from '../Experience'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import {FolderApi} from "@tweakpane/core";

type ActionsMap = {
    idle: THREE.AnimationAction,
    walking: THREE.AnimationAction,
    running: THREE.AnimationAction,
    current: THREE.AnimationAction
}
type ActionsName = keyof Omit<ActionsMap, 'current'>
type AnimationMap = {
    mixer: THREE.AnimationMixer
    actions :ActionsMap
    play: (name:ActionsName) => void
}

export default class Fox
{
    private experience: Experience
    private scene: THREE.Scene
    private resources: IResources
    private time: ITime
    private tweak: ITweak
    private tweakFox!: Nullable<FolderApi>
    resource: GLTF
    model: THREE.Group
    animation: AnimationMap

    constructor()
    {
        this.experience = Experience.getInstance()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.resource = this.resources.items.foxModel
        this.time = this.experience.time
        this.tweak = this.experience.tweak

        if(this.tweak.instance)
        {
            this.tweakFox = this.tweak.instance.addFolder({title:'Fox'})
        }

        this.model = this.initModel()
        this.animation = this.initAnimation()
    }
    initModel()
    {
        const model = this.resource.scene
        model.scale.set(0.02, 0.02, 0.02)
        model.traverse(child =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
            }
        })
        this.scene.add(model)

        return model
    }
    initAnimation()
    {
        this.animation = {} as AnimationMap
        this.animation.mixer = new THREE.AnimationMixer(this.model)

        this.animation.actions = {} as ActionsMap
        this.animation.actions.idle = this.animation.mixer.clipAction(this.resource.animations[0])
        this.animation.actions.walking = this.animation.mixer.clipAction(this.resource.animations[1])
        this.animation.actions.running = this.animation.mixer.clipAction(this.resource.animations[2])

        this.animation.actions.current = this.animation.actions.idle
        this.animation.actions.current.play()

        this.animation.play = (name) =>
        {
            const newAction = this.animation.actions[name]
            const oldAction = this.animation.actions.current

            newAction.reset()
            newAction.play()
            newAction.crossFadeFrom(oldAction, 1)

            this.animation.actions.current = newAction
        }

        // Tweak
        if(this.tweakFox)
        {
            const idle = this.tweakFox.addButton({title:'play Idle'})
            const walking = this.tweakFox.addButton({title:'play walking'})
            const running = this.tweakFox.addButton({title:'play running'})
            idle.on('click', () => this.animation.play('idle') )
            walking.on('click', () => this.animation.play('walking') )
            running.on('click', () => this.animation.play('running') )
        }

        return this.animation
    }
    update()
    {
        this.animation.mixer.update(this.time.delta)
    }
}