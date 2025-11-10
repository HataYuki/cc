import {type GLTF} from 'three/addons/loaders/GLTFLoader.js'
import {type HDR} from 'three/addons/loaders/HDRloader.js'
import {type Texture, type CubeTexture} from 'three'

export {}

declare global {
    interface Source<T> {
        name: string,
        type: T,
        path: T extends 'cubeTexture' ? string[] : string
    }
    type SourceType =
        'texture' |
        'cubeTexture' |
        'gltf' |
        'HDR'
    type Sources = readonly Source<SourceType>[]
    type FileOfType<T> =
        T extends 'gltf' ? GLTF :
        T extends 'texture' ? Texture :
        T extends 'cubeTexture' ? CubeTexture :
        T extends 'hdr' ? HDR :
        never
}