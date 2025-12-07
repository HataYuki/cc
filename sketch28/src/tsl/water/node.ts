import { Color } from 'three'
import {
    cameraProjectionMatrix,
    cameraViewMatrix,
    modelWorldMatrix,
    positionLocal,
    Fn, vec4,
    varying,
    uniform,uniformTexture,
    vec2,uv,
    color,float,
    vec3,smoothstep,
    mod,
    floor,fract,
    step,mix,sin,length,
    cos,
    abs,
    min,
    max,
    ceil,
    round,
    dot,
    rand,
    distance,
    rotateUV,
    time,atan,
    texture,
    clamp,
    pow,
    exp,
    log,
    varyingProperty,mx_noise_float,
    Loop,
    int
} from 'three/tsl'
import { simplexNoise, isolines } from 'tsl-textures' 

/**
 * Uniforms
 */
export const uSmallWavesElavation = uniform(0.15)
export const uSmallWavesFrequency = uniform(3)
export const uSmallWavesSpeed = uniform(0.2)
export const uSmallWavesIterations = uniform(5)

export const uBigWavesElavation = uniform(0.2)
export const uBigWavesFrequency = uniform( vec2(4, 1.5) )
export const uBigWavesSpeed = uniform(1)

export const uDepthColor = uniform(color('#03033d'))
export const uSurfaceColor = uniform(color('#819adb'))
export const uColorOffset = uniform(0.23)
export const uColorMultiplier = uniform(2.6)

/**
 * Varying
 */
const vUv = vec2(uv())
const vElavation = varyingProperty('float')

/**
 * tsl-textures
 */
const noise = simplexNoise()
const iso = isolines()

/**
 * Vertex
 */
export const vertexNode = Fn(() => {
    const modelPosition = modelWorldMatrix.mul(vec4(positionLocal), 1.0)

    // Elavation
    const elavation =
        sin(modelPosition.x.mul(uBigWavesFrequency.x).add(time.mul(uBigWavesSpeed)))
            .mul(sin(modelPosition.z.mul(uBigWavesFrequency.y).add(time.mul(uBigWavesSpeed))))
            .mul(uBigWavesElavation)
    
    Loop({ start: 1, end: uSmallWavesIterations }, ( { i } ) =>
    {
        const noiseInput = vec3(
            modelPosition.xz
                .mul(uSmallWavesFrequency)
                .mul(i),
            time.mul(uSmallWavesSpeed)
        )
        const noiseWave = mx_noise_float(noiseInput, 1, 0).mul(uSmallWavesElavation).div(i).abs()
        noiseWave.subAssign(0.005)
        noiseWave.mulAssign(elavation.mul(10).max(0).min(1).add(0.3))
        elavation.subAssign(noiseWave)
    })
    
    modelPosition.addAssign(vec4(0, elavation, 0, 0))

    const viewPosition = cameraViewMatrix.mul(modelPosition)
    const projectedPosition = cameraProjectionMatrix.mul(viewPosition)

    /**
     * Varyings
     */
    vElavation.assign(elavation)

    return projectedPosition
})


export const fragmentNode =  Fn(() =>
{
    const mixStrength = vElavation.add(uColorOffset).mul(uColorMultiplier)
    const col = mix(uDepthColor, uSurfaceColor, mixStrength)
    return vec4(col, 1.0);
})