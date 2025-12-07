import * as THREE from 'three'

export default class Viewport extends THREE.EventDispatcher< { resize : { message:undefined } } >
{
    // Setup
    public width = window.innerWidth
    public height = window.innerHeight
    public aspect = this.width / this.height
    public pixelRatio = Math.min(window.devicePixelRatio, 2)
    public on = this.addEventListener.bind(this)

    constructor()
    {
        super()
        
        window.addEventListener('resize', () =>
        {
            this.width = window.innerWidth
            this.height = window.innerHeight
            this.aspect = this.width / this.height
            this.pixelRatio = Math.min(window.devicePixelRatio, 2)

            this.dispatchEvent( { type: 'resize', message: undefined } )
        })
    }
}

