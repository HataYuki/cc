import * as THREE from 'three'
import Game from '../Game'

export default class CameraRay extends THREE.EventDispatcher
{
	private raycaster:THREE.Raycaster = new THREE.Raycaster()
	private game: Game
	private camera: THREE.Camera
	private scene: THREE.Scene
	private input: IInput
	private coords: THREE.Vector2 = new THREE.Vector2(99999,99999)
	
	constructor()
	{
		super()
		
		this.game = Game.getInstance()
		this.camera = this.game.camera.instance
		this.scene = this.game.scene
		this.input = this.game.input
		this.input.on('cursormove', ()=>
		{
			this.coords.set(
				this.input.cursor.normalized.x,
				this.input.cursor.normalized.y
			)
		})
	}
	
	update()
	{
		this.raycaster.setFromCamera(
			this.coords,
			this.camera
		)
	}
}