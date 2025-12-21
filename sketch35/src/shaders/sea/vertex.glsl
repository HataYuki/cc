// Uniforms
uniform float uTime;
uniform vec2 uBigWavesFrequency;
uniform float uBigWavesSpeed;
uniform float uBigWavesElevation;
uniform float uSmallWavesIterations;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesElevation;

// Varyings
varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/perlinClassic3D.glsl

float waveElevation (vec3 position)
{
    // Elavation
    float elavation = 
        sin(position.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) * 
        sin(position.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) * 
        uBigWavesElevation;

    for(float i = 1.0; i < uSmallWavesIterations; i++)
    {
        float noiseWave = abs(
            perlinClassic3D(
                vec3(
                    position.xz * uSmallWavesFrequency * i,
                    uTime * uSmallWavesSpeed
                )
            ) * uSmallWavesElevation / i
        );
        elavation -= noiseWave;
    }

    return elavation;
}

void main() 
{
    // Base posotion
    float shift = 0.01;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0.0, 0.0);
    vec3 modelPositionB = modelPosition.xyz + vec3(0.0, 0.0, -shift);

    float elevation = waveElevation(modelPosition.xyz);
    modelPosition.y += elevation;
    modelPositionA.y += waveElevation(modelPositionA);
    modelPositionB.y += waveElevation(modelPositionB);

    // Compute normal
    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computeNormal = cross(toA, toB);

    // Final position
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition; 
    gl_Position = projectedPosition;

    // Varyings
    vElevation = elevation;
    vNormal = computeNormal;
    vPosition = modelPosition.xyz;
}