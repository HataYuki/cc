 /**
 * Uniforms
 */
 uniform float uSize;
 uniform float uTime;

/**
* attributes
*/
 attribute float aScale;
 attribute vec3 aRandomness;

 /**
 * Variyng
 */
 varying vec3 vColor;
 
 void main()
{
    /**
    * Position
    */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
    angle += angleOffset;
    modelPosition.x = sin(angle) * distanceToCenter;
    modelPosition.z = cos(angle) * distanceToCenter;

    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = uSize * aScale;
    gl_PointSize *= aScale / - viewPosition.z;

    /**
    * Varying
    */
    vColor = color;
}