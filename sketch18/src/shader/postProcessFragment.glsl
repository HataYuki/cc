precision mediump float;
#include lib/common;

uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    color = vigneting(vUv, color, 0.65, 0.57);

    gl_FragColor = color;
}