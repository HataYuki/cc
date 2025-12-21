import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import type { KTX } from 'three/addons/loaders/KTX2Loader.js'

type __S = typeof import('../Game/sources.ts').default
    
export type SourceType =
    'texture' |
    // 'cubeTexture' |
    'gltf' |
    // 'hdr' |
    'ktx2'
    
export interface Loaders {
    gltf: GLTFLoader,
    texture: TextureLoader,
    // cubeTexture: CubeTextureLoader
    // hdr: HDRLoader
    ktx2: KTX2Loader
}

declare global{
    type Datatype<T extends SourceType> =
        T extends 'gltf' ? GLTF :
        T extends 'texture' ? Texture<HTMLImageElement> :
        // T extends 'cubeTexture' ? CubeTexture :
        // T extends 'hdr' ? HDR :
        T extends 'ktx2' ? KTX :
        never
}

    
interface Source<T extends SourceType> {
    name: string,
    type: T,
    path: T extends 'cubeTexture' ? string[] : string
}

export type Sources = Source<SourceType>[]

export type SourceNames = __S[number]['name']

type TypeOfName<N> = Extract<__S[number], { name: N }>['type']

export type Items = { [N in SourceNames] :  Datatype<TypeOfName<N>>}
    
export type EventMap =
    { [K in SourceNames]: { data: Items[k] } }
    & { ready: { data: Items } }
