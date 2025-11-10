import './style.scss'
import Experience from './Experience/Experience'

const experience = Experience.getInstance(
    document.getElementById('webgl') as HTMLCanvasElement,
)

window.addEventListener('beforeunload',()=>
{
    experience.destory()
})





