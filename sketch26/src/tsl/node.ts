import {
    cameraProjectionMatrix,
    cameraViewMatrix,
    modelWorldMatrix,
    positionLocal,
    Fn, vec4, sin,
    varying,
    uniform,attribute,uniformTexture,
    vec2,uv,
    time,
    color,
    texture,    
    varyingProperty,
    vec3
} from 'three/tsl'

/**
 * Uniform
 */
export const uFrequency = uniform(vec2(10, 5))
export const uColor = uniform(color(1, 0, 0))
export const uTexture = uniformTexture()

/**
 * Vertex
 */
const aRandom = attribute('aRandom')
const vRandom = varying(aRandom)
const vUv = varying(uv())
const vElevation = varyingProperty('float')
export const vertexNode =  Fn(() =>
{
    let modelPosition = modelWorldMatrix.mul(vec4(positionLocal, 1))

    let elevation = sin(modelPosition.x.mul(uFrequency.x).sub(time)).mul(0.1)
    elevation = elevation.add(sin(modelPosition.y.mul(uFrequency.y).sub(time)).mul(0.1))
    elevation = elevation.add(aRandom.mul(0.01))
    vElevation.assign(elevation)

    modelPosition = modelPosition.add(vec4(0, 0, elevation, 0))

    let viewPosition = cameraViewMatrix.mul(modelPosition)
    const projectedPosition = cameraProjectionMatrix.mul(viewPosition)
    return projectedPosition
})

/**
 * Fragment
 */
export const fragmentNode =  Fn(() =>
{
    let textureColor = texture(uTexture, vUv)
    textureColor.rgb = textureColor.rgb.mul(vec3(vElevation.mul(2).add(0.5)))
    textureColor.rgb = textureColor.rgb.mix(uColor, 0.5)
    return textureColor
})