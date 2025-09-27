precision mediump float;
#include lib/common;

uniform sampler2D tDiffuse;
uniform float baseNoiseStrangth;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    gl_FragColor = color;
}