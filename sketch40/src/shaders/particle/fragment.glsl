varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;

void main()
{    
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    vec3 color = vColor;

    if(distanceToCenter > 0.5)
    {
        discard;
    }

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}