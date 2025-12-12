import * as THREE from 'three'
import Game from '../Game'
type AnimationMap<T extends string> = {
    mixer: THREE.AnimationMixer
    actions: { [N in T]: THREE.AnimationAction }
    play: (name: T) => void
}
type AnimationType = AnimationMap<'idle' | 'walking' | 'running' | 'current'>

export default class Fox
{
    private game: Game
    private scene: THREE.Scene
    private resources: IResources
    private tweak: ITweak
    private renderer: IRenderer
    
    resource: Datatype<'gltf'>
    model: THREE.Group
    animation: AnimationType = { actions: {} } as AnimationType

    constructor()
    {
        this.game = Game.getInstance()
        this.scene = this.game.scene
        this.resources = this.game.resources
        this.resource = this.resources.items.foxModel
        this.renderer = this.game.renderer
        this.tweak = this.game.tweak

        this.model = this.initModel()
        this.animation = this.initAnimation()

        if(this.tweak.gui)
        {
            const gui = this.tweak.gui
            const guiFox = gui.addFolder({ title: 'Fox' })
            const idle = guiFox.addButton({title:'play Idle'})
            const walking = guiFox.addButton({title:'play walking'})
            const running = guiFox.addButton({ title: 'play running' })
            
            idle.on('click', () => this.animation.play('idle') )
            walking.on('click', () => this.animation.play('walking') )
            running.on('click', () => this.animation.play('running') )
        }
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
        this.animation.mixer = new THREE.AnimationMixer(this.model)

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

        return this.animation
    }

    update()
    {
        this.animation.mixer.update(this.renderer.delta)
    }

    dispose()
    {
        this.model.traverse(obj =>
        {
            if (obj instanceof THREE.Mesh)
            {
                obj.geometry.dispose()
                for (const key in obj.material)
                {
                    const value = obj.material[key]
                    if (
                        value &&
                        typeof value.dispose === 'function'
                    )
                    {
                        value.dispose()
                    }
                }
            }
        })
        this.scene.remove(this.model)
    }
}