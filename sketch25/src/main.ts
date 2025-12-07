import './style.scss'
import Game from './Game/Game'

const game = Game.getInstance(
    document.getElementById('webgl') as HTMLCanvasElement,
)

window.addEventListener('beforeunload',()=>
{
    game.destory()
})





