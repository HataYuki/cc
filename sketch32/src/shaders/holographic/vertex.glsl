uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

#include ../include/random.glsl

void main()
{
    // Position
    vec4 modelPositon = modelMatrix * vec4(position, 1.0);

    // Glitch
    float glitchTime = uTime - modelPositon.y;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76);
    glitchStrength /= 3.0;
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
    glitchStrength *= 0.25;
    modelPositon.x += (random(modelPositon.xz + uTime) - 0.5) * glitchStrength;
    modelPositon.z += (random(modelPositon.zx + uTime) - 0.5) * glitchStrength;

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPositon;

    // Model normal
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Varying
    vPosition = modelPositon.xyz;
    vNormal = modelNormal.xyz;
}