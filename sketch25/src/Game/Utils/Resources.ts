import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import Game from '../Game'
import type { EventMap, Sources, Loaders, Items, SourceNames, } from '../../types/Resources'

export default class Resources extends THREE.EventDispatcher<EventMap>
{
    private loadingManager: THREE.LoadingManager = new THREE.LoadingManager()
    private loaders: Loaders
    private game: Game
    private renderer:IRenderer

    items: Items = {} as Items
    sources: Sources
    on = this.addEventListener.bind(this)

    constructor(sources: Sources)
    {
        super();

        this.game = Game.getInstance()
        this.renderer = this.game.renderer
        
        this.sources = sources
        this.loaders = this.initLoader()
        this.loadingManager.onProgress = (_, loaded, total) =>
        {
            if(loaded === total)
            {
                this.dispatchEvent({ type: 'ready', data: this.items })
            }
        }
    }

    private initLoader()
    {
        const gltfLoader = new GLTFLoader(this.loadingManager)
        const dracoLoader = new DRACOLoader()
        const ktx2Loader = new KTX2Loader()
        
        dracoLoader.setDecoderPath('/draco/')
        gltfLoader.setDRACOLoader(dracoLoader)

        ktx2Loader.setTranscoderPath('/basis/')
        ktx2Loader.detectSupport(this.renderer.instance)

        return {
            gltf: gltfLoader,
            // texture: new THREE.TextureLoader(this.loadingManager),
            // cubeTexture:  new THREE.CubeTextureLoader(this.loadingManager),
            // hdr: new HDRLoader(),
            ktx2: ktx2Loader
        }
    }


    private async startLoad<T extends SourceNames>(name: T): Promise<Items[T]>
    {
        if (this.items.hasOwnProperty(name))
        {
            return this.items[name]
        }
        
        const source = this.sources.find(s => s.name === name)

        if (!source)
        {
            throw new Error('Unknown source.')
        }
        
        this.items[name] = await this.loaders[source.type]
            .loadAsync(source.path as any) as Items[T]

        this.dispatchEvent({ type: name, data: this.items[name] })
        
        return this.items[name]
    }

    load<const T extends SourceNames[]>(...names: T) {

        const tasks = names.map(async name => this.startLoad(name)) as { [K in keyof T]: Promise<Items[T[K]]> }

        return Promise.all(tasks) as Promise<{ [K in keyof T]: Items[T[K]] }>    
    }

    dispose(...names: SourceNames[])
    {
        const targets = (names.length)
            ? names
            : Object.keys(this.items) as SourceNames[]
            
        targets.forEach((key) => 
        {
            const file = this.items[key]

            // Texture dispose
            if (file instanceof THREE.Texture)
            {
                file.dispose()
            }

            // Mesh dispose
            else if (file instanceof THREE.Object3D)
            {
                file.traverse(obj =>
                {
                    if (obj instanceof THREE.Mesh) {
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
            }
        })
    }
}