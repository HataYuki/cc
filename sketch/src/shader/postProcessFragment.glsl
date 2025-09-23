precision mediump float;
#include lib/common;

uniform sampler2D tDiffuse;
uniform float baseNoiseStrangth;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    // uv += noize2(vUv);
    uv += hash(uv) * 0.004;
    vec4 color = texture2D(tDiffuse, uv);
    // vUv += noise(vUv);
    color.a = 1.0 - hash(vUv * 1.0) * baseNoiseStrangth;
    gl_FragColor = color;
}