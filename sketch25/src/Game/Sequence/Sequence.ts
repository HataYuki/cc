import * as THREE from 'three'
import Game from '../Game'
import { mod ,clampedRemap } from '../Utils/Math'

export default class Sequence extends THREE.EventDispatcher
{
    game:     Game
    renderer: IRenderer
    navigate: INavigate
    seek:     number = 0
    range:    number = 10000
    
    constructor()
    {
        super()

        this.game     = Game.getInstance()
        this.renderer = this.game.renderer
        this.navigate = this.game.input.navigate
        
        this.navigate.on('scroll', () =>
        {
            let seek = this.navigate.value.y
                seek = mod(seek, this.range) / this.range
            
            this.seek = seek
        })
    }
    
    scene1(progress: number)
    {
        
    }

    scene2(progress: number)
    {
        
    }

    scene3(progress: number)
    {
        
    }

    scene4(progress: number)
    {
        
    }

    scene5(progress: number)
    {
        
    }

    update()
    {
        const scene1Progress = clampedRemap(0.0, 0.2, 0.0, 1.0, this.seek)
        this.scene1(scene1Progress)

        const scene2Progress = clampedRemap(0.2, 0.4, 0.0, 1.0, this.seek)
        this.scene2(scene2Progress)

        const scene3Progress = clampedRemap(0.4, 0.6, 0.0, 1.0, this.seek)
        this.scene3(scene3Progress)

        const scene4Progress = clampedRemap(0.6, 0.8, 0.0, 1.0, this.seek)
        this.scene4(scene4Progress)

        const scene5Progress = clampedRemap(0.8, 1.0, 0.0, 1.0, this.seek)
        this.scene5(scene5Progress)
    }
}