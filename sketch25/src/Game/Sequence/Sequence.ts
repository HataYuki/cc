import * as THREE from 'three'
import Game from '../Game'
import { mod } from '../Utils/Math'

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
    
    scene1()
    {

    }

    scene2()
    {

    }

    update()
    {
        this.scene1()
        this.scene2()
    }
}