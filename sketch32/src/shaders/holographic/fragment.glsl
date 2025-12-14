uniform float uTime;
uniform vec3 uColor;

varying vec3 vPosition;
varying vec3 vNormal;

void main()
{
    // Normal 
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
    {
        normal *= -1.0;
    }

    // Stripes
    float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    // Frenel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float frenel = dot(viewDirection, normal) + 1.0;
    frenel = pow(frenel, 2.0);

    float falloff = smoothstep(0.8, 0.0, frenel);

    // Holographic
    float holographic = stripes * frenel;
    holographic += frenel * 1.25;
    holographic *= falloff;

    // Final color
    gl_FragColor = vec4(uColor, holographic);
    // gl_FragColor = vec4(vNormal, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}