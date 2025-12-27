// Varyings
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;

void main()
{    
    // init
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(vec2(0.5) - uv);
    if(distanceToCenter > 0.5)
    {
        discard;
    }
    vec3 color = vec3(vColor);

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}