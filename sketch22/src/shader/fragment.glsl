precision mediump float;
#include lib/common;

uniform vec3 colA;
uniform vec3 colB;
uniform vec3 colC;
uniform vec3 colD;
uniform float colT;

varying vec2 vUv;

void main() {
    gl_FragColor = vec4(col, 1.0);
}