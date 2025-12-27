uniform vec2 uResolution;
uniform sampler2D uPixtureTexture;
uniform sampler2D uDisplacementTexture;

attribute float aIntencity;
attribute float aAngle;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;

void main()
{
    // Displacement
    vec3 newPosition = position;
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);

    vec3 displacement = vec3(
        cos(aAngle),
        sin(aAngle),
        1.0
    );
    displacement = normalize(displacement);
    displacement *= displacementIntensity;
    displacement *= 0.25;
    displacement *= aIntencity;

    newPosition += displacement;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // pictureIntensity
    float pictureIntensity = texture(uPixtureTexture, uv).r; 

    // Point size
    gl_PointSize = 0.008 * pictureIntensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);  

    // Varying
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vPosition = modelPosition.xyz;
    vColor = vec3(pow(pictureIntensity, 2.0));
}