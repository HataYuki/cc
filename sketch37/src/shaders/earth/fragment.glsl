// Uniforms
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

// Varyings
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{    
    // init
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
    float sunOrientation = dot(normal, uSunDirection);

    // Day / night color
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    // Specular clouds color 
    vec2 speclarCloudsColor = texture(uSpecularCloudsTexture, vUv).rg;

    // Clouds
    float cloudsMix = smoothstep(0.2, 1.0, speclarCloudsColor.g);
    cloudsMix *= dayMix;
    color = mix(color, vec3(1.0), cloudsMix);

    // Frenel
    float frenel = dot(viewDirection, normal) + 1.0;
    frenel = pow(frenel, 2.0);

    // Atomosphere
    float atomsphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atomsphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atomsphereDayMix);
    color = mix(color, atomsphereColor, frenel * atomsphereDayMix);

    // Specular
    vec3 reflection = reflect(- uSunDirection, normal);
    float specular = - dot(reflection, viewDirection);
    specular = max(0.0, specular);
    specular = pow(specular, 32.0);
    specular *= speclarCloudsColor.r;

    vec3 specularColor = mix(vec3(1.0), atomsphereColor, frenel);
    color += specular * specularColor;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}