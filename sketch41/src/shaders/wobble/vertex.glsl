uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;
uniform float uWarpPositionFrequency;
uniform float uWarpTimeFrequency;
uniform float uWarpStrength;

attribute vec4 tangent;

varying float vWobble;

#include ../includes/simplexNoise4d.glsl

float getWobble(vec3 position)
{
    vec3 warpedPosition = position;

    warpedPosition += snoise4d(vec4(
        position * uWarpPositionFrequency,
        uTime * uWarpTimeFrequency
    )) * uWarpStrength;

    return snoise4d(vec4(
        warpedPosition * uPositionFrequency, // xyz
        uTime * uTimeFrequency          // w
    )) * uStrength;
}

void main()
{
    vec3 bitTangent = cross(normal,tangent.xyz);

    // Neighbours postion
    float shift = 0.01;
    vec3 positionA = csm_Position + tangent.xyz * shift;
    vec3 positionB = csm_Position + bitTangent * shift;

    // wobble
    float wobble = getWobble(csm_Position);
    csm_Position += wobble * normal;
    positionA += getWobble(positionA) * normal;
    positionB += getWobble(positionB) * normal;

    // Compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);

    csm_Normal = cross(toA, toB);

    // Varying
    vWobble = wobble / uStrength;
}