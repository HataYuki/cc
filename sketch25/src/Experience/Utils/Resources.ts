import {LoadingManager, TextureLoader, CubeTextureLoader, EventDispatcher} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js"

type S = typeof import('../sources.ts').default
type Elem  = S[number]
type Names = Elem['name']
type ElemOfName<N extends Names> = Extract<Elem, { name: N }>
type ItemOfName<N extends Names> = FileOfType<ElemOfName<N>['type']>
type Items= { [N in Names]: ItemOfName<N> }
type EventNames = `ready:${Names}` | 'ready'
type EventMap = { [N in EventNames]: any }

export default class Resources extends EventDispatcher<EventMap>
{
    sources: Sources
    loadingManager: LoadingManager = new LoadingManager()
    loaders : {
        gltfLoader: GLTFLoader,
        textureLoader: TextureLoader,
        cubeTextureLoader: CubeTextureLoader
    }
    items: Items = {} as Items
    on = this.addEventListener.bind(this)
    constructor(sources: Sources)
    {
        super();
        this.sources = sources
        this.loaders = this.getLoaders()
        this.loadingManager.onProgress = (_, loaded, total) =>
        {
            if(loaded === total)
            {
                this.dispatchEvent({type:"ready"})
            }
        }
        this.startLoading()
    }
    private getLoaders(){
        const gltfLoader = new GLTFLoader(this.loadingManager)
        const textureLoader = new TextureLoader(this.loadingManager)
        const cubeTextureLoader = new CubeTextureLoader(this.loadingManager)
        const dracoLoader =  new DRACOLoader()

        dracoLoader.setDecoderPath('/draco/')
        gltfLoader.setDRACOLoader(dracoLoader)

        return {
            gltfLoader,
            textureLoader,
            cubeTextureLoader
        }
    }
    startLoading()
    {
        for(const source of this.sources)
        {
            // @ts-ignore
            if(source.type === "cubeTexture")
            {
                this.loaders.cubeTextureLoader.load(
                    (source.path as string[]),
                    file =>
                    {
                      this.setLoaded(source, file)
                    }
                )
            }

            // @ts-ignore
            if(source.type === "texture")
            {
                this.loaders.textureLoader.load(
                    (source.path as string),
                    file =>
                    {
                      this.setLoaded(source, file)
                    }
                )
            }

            // @ts-ignore
            if(source.type === "gltf")
            {
                this.loaders.gltfLoader.load(
                    (source.path as string),
                    file =>
                    {
                        this.setLoaded(source, file)
                    }
                )
            }
        }
    }

    setLoaded(source:Source<SourceType>, file:any)
    {
        this.items[source.name as Names] = file
        this.dispatchEvent({type:`ready:${source.name as Names}`})
    }
}