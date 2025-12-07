import { cameraProjectionMatrix, cameraViewMatrix, Fn, materialPointSize, modelPosition, modelWorldMatrix, positionLocal, uniform, vec4 } from "three/tsl";


export const uSize = uniform(0.2)


export const positon = Fn(() => 
{
    return positionLocal
})

export const Size = Fn(() =>
{
    return uSize
})

export const color = Fn(() =>
{
    return vec4(1, 0, 0, 0)
})