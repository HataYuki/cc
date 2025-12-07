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
    log
} from 'three/tsl'
import { simplexNoise, isolines } from 'tsl-textures' 



/**
 * Vertex
 */

export const vertexNode =  Fn(() =>
{
    let modelPosition = modelWorldMatrix.mul(vec4(positionLocal, 1))
    let viewPosition = cameraViewMatrix.mul(modelPosition)
    const projectedPosition = cameraProjectionMatrix.mul(viewPosition)
    return projectedPosition
})

/**
 * Fragment
 */
console.log(new Color('rgb(255,255,255)'))
const vUv = vec2(uv())
const noise = simplexNoise({
    scale: 2,
    balance: 0,
    contrast: 0,
    color: new Color('white'),
    background:new Color('black')
})
const iso = isolines({scale:1})
export const fragmentNode =  Fn(() =>
{
    // Pattern3
    // const strength = vUv.x

    // Pattern4
    // const strength = vUv.y

    // Pattern5
    // const strength = float(1).sub(vUv.y)

    // Pattern6
    // const strength = vUv.y.mul(10)

    // Pattern7
    // const strength = mod(vUv.y.mul(10), 1)
    // const strength = fract(vUv.y.mul(10))

    // Pattern8
    // const strength = step(0.5, mod(vUv.y.mul(10), 1))

    // Pattern9
    // const strength = step(0.8, mod(vUv.y.mul(10), 1))

    // Pattern10
    // const strength = step(0.8, mod(vUv.x.mul(10), 1))

    // // Pattern11
    // let strength = float(step(0.8, mod(vUv.x.mul(10), 1)))
    // strength = float(strength.add(step(0.8, mod(vUv.y.mul(10), 1))))

    // Pattern12
    // let strength = float(step(0.8, mod(vUv.x.mul(10), 1)))
    // strength = float(strength.mul(step(0.8, mod(vUv.y.mul(10), 1))))

    // Pattern13
    // let strength = float(step(0.5, mod(vUv.x.mul(10), 1)))
    // strength = float(strength.mul(step(0.8, mod(vUv.y.mul(10), 1))))

    // Pattern14
    // let barX = float(step(0.5, mod(vUv.x.mul(10), 1)))
    // barX = float(barX.mul(step(0.8, mod(vUv.y.mul(10), 1))))
    // let barY = float(step(0.8, mod(vUv.x.mul(10), 1)))
    // barY = float(barY.mul(step(0.5, mod(vUv.y.mul(10), 1))))
    // let strength = barX.add(barY)

    // Pattern15
    // let barX = float(step(0.5, mod(vUv.x.mul(10), 1)))
    // barX = float(barX.mul(step(0.8, mod(vUv.y.mul(10), 1))))
    // let barY = float(step(0.8, mod(vUv.x.mul(10).add(0.15), 1)))
    // barY = float(barY.mul(step(0.5, mod(vUv.y.mul(10).add(-0.15), 1))))
    // let strength = barX.add(barY)

    // // Pattern16
    // let strength = abs(vUv.x.add(-0.5))

    // Pattern17
    // let barX = abs(vUv.x.add(-0.5))
    // let barY = abs(vUv.y.add(-0.5))
    // let strength = min(barX,barY)

    // Pattern18
    // let barX = abs(vUv.x.add(-0.5))
    // let barY = abs(vUv.y.add(-0.5))
    // let strength = max(barX,barY)

    // Pattern19
    // let barX = abs(vUv.x.add(-0.5))
    // let barY = abs(vUv.y.add(-0.5))
    // let strength = step(0.2, max(barX,barY))

    // Pattern20
    // let size = 0.3
    // let tickness = 0.01
    // let inout = step(size, max(abs(vUv.x.add(-0.5)), abs(vUv.y.add(-0.5))))
    // let outin = float(1).sub(step(size + tickness, max(abs(vUv.x.add(-0.5)), abs(vUv.y.add(-0.5)))))
    // let strength = outin.mul(inout)

    // Pattern21
    // let strength = round(vUv.x.mul(10)).div(10)

    // Pattern22
    // let x = round(vUv.x.mul(10)).div(10)
    // let y = round(vUv.y.mul(10)).div(10)
    // let strength = x.mul(y)

    // Pattern23
    // let x = round(vUv.x.mul(10)).div(10)
    // let y = round(vUv.y.mul(10)).div(10)

    // Pattern24
    // let strength = rand(vUv)

    // // Pattern25
    // let x = round(vUv.x.mul(10)).div(10)
    // let y = round(vUv.y.mul(10).add(vUv.x.mul(5))).div(10)
    // let gridUv = vec2(x,y)
    // let strength = rand(gridUv)

    //  // Pattern26
    // let strength = length(vUv)

    // // Pattern27
    // let strength = distance(vUv, vec2(0.5))

    // // Pattern29
    // let strength = float(1).sub(distance(vUv, vec2(0.5)))

    // // Pattern30
    // let strength = float(0.02).div(distance(pos, vec2(0.0))).mul(0.25)

     // Pattern31
    // let uvNorm = vUv.sub(0.5)
    // let lightXPos = vec2(uvNorm.x.div(6), uvNorm.y.div(1))
    // let lightYPos = vec2(uvNorm.x.div(1), uvNorm.y.div(6))
    // let lightX = float(0.02).div(distance(lightXPos, vec2(0.0))).mul(0.25)
    // let lightY = float(0.02).div(distance(lightYPos, vec2(0.0))).mul(0.25)
    // let strength = lightX.mul(lightY)

    // Pattern32
    // let uvNorm = vUv.sub(0.5)
    // let rotatedUv = rotateUV(uvNorm, float((Math.PI / 180)).mul(time).mul(10), vec2(0,0))
    // let lightXPos = vec2(rotatedUv.x.div(6), rotatedUv.y.div(1))
    // let lightYPos = vec2(rotatedUv.x.div(1), rotatedUv.y.div(6))
    // let lightX = float(0.08).div(distance(lightXPos, vec2(0.0))).mul(0.25)
    // let lightY = float(0.08).div(distance(lightYPos, vec2(0.0))).mul(0.25)
    // let strength = lightX.mul(lightY)

    // Pattern33
    // let strength = step(0.25, distance(vUv, vec2(0.5)))

    // Pattern34
    // let strength = abs(distance(vUv, vec2(0.5)).sub(0.25))

    // Pattern35
    // let strength = step(0.01, abs(distance(vUv, vec2(0.5)).sub(0.25)))

    // Pattern36
    // let strength = float(1).sub(step(0.01, abs(distance(vUv, vec2(0.5)).sub(0.25))))

    // Pattern37
    // let wavedUv = vec2(vUv.x, vUv.y.add(sin(vUv.x.mul(30)).mul(0.1)) )
    // let strength = float(1).sub(step(0.01, abs(distance(wavedUv, vec2(0.5)).sub(0.25))))

    // Pattern38
    // let wavedUv = vec2(
    //     vUv.x.add(sin(vUv.y.mul(30)).mul(0.1)),
    //     vUv.y.add(sin(vUv.x.mul(30)).mul(0.1))
    // )
    // let strength = float(1).sub(step(0.01, abs(distance(wavedUv, vec2(0.5)).sub(0.25))))

    // Pattern39
    // let wavedUv = vec2(
    //     vUv.x.add(sin(vUv.y.mul(100)).mul(0.1)),
    //     vUv.y.add(sin(vUv.x.mul(100)).mul(0.1))
    // )
    // let strength = float(1).sub(step(0.01, abs(distance(wavedUv, vec2(0.5)).sub(0.25))))

    // Pattern40
    // let angle = atan(vUv.x,vUv.y)
    // let strength = angle

    // Pattern41
    // let angle = atan(vUv.x.sub(0.5),vUv.y.sub(0.5))
    // let strength = angle

    // Pattern42
    // let angle = atan(vUv.x.sub(0.5),vUv.y.sub(0.5))
    // let strength = angle.div(Math.PI * 2).add(0.5)

    // Pattern43
    // let angle = atan(vUv.x.sub(0.5),vUv.y.sub(0.5))
    // let strength = mod(angle.div(Math.PI * 2).add(0.5).mul(20),1)

    // Pattern44
    // let angle = atan(vUv.x.sub(0.5),vUv.y.sub(0.5))
    // let strength = sin(angle.div(Math.PI * 2).add(0.5).mul(20).mul(5))

    // Pattern45
    // let angle = atan(vUv.x.sub(0.5),vUv.y.sub(0.5))
    // let normalizedAngle = angle.div(Math.PI * 2).add(0.5)
    // const waveSinusoid = sin(normalizedAngle.mul(100))
    // const radius = float(0.25).add(waveSinusoid.mul(0.05))
    // const  circle = float(1).sub(step(0.01, abs(distance(vUv, vec2(0.5)).sub(radius))))
    // let strength = circle

    // Pattern45
    // const strength = noise

    // Pattern46
    // const strength = step(0.5, noise)

    // Pattern47
    // const strength = float(1).sub(abs(noise.sub(0.5)))

    // Pattern48
    // const strength = iso

    // Pattern49
    const strength = step(0.99999, iso)

    // Clamp strength
    const clampedStrength = clamp(strength, .0, 1.)
    
    // Colored version
    const blackColor = vec3(0)
    const uvColor = vec3(vUv.xy, 1)
    const mixedColor = mix(blackColor, uvColor, clampedStrength)
    const outputColor = mixedColor
    
    return vec4(vec3(outputColor), 1.0);
})