precision mediump float;

varying vec3 vColor;

void main() 
{
    /**
    * Light point 
    **/
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    /**
    * final color
    */
    vec3 col = mix(vec3(0.0), vColor, strength);
    
    /**
    * Output
    **/
    gl_FragColor = vec4(col, 1.0);

    #include <colorspace_fragment>
}