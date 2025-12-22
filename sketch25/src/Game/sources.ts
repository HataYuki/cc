import type { Sources } from "../types/Resources"

export default
[
        {
            name: 'envTextureKtx', type: 'ktx2', path: 'textures/environmentMap/resized_2k.ktx2'
        },
        {
            name: 'grassColorTexture',
            type: 'ktx2',
            path: 'textures/dirt/color.ktx2',
        },
        {
            name: 'grassNormalTexture',
            type: 'ktx2',
            path: 'textures/dirt/normal.ktx2',
        },
        {
            name: 'foxModel',
            type: 'gltf',
            path: 'models/Fox/glTF/Fox.gltf',
        },
] as const satisfies Sources