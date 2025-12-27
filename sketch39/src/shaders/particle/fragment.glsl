varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;

void main()
{    
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    float alpha = 0.05 / distanceToCenter - 0.05 * 2.0;
    vec3 color = vColor;

    // Final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}