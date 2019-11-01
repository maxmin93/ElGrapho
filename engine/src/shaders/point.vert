//#version 300 es

attribute vec4 aVertexPosition;
// TODO: this should be an int
attribute float aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform bool magicZoom;
uniform float nodeSize;
// TODO: focusedGroup and group should change to int
uniform float focusedGroup;
uniform float zoom;
uniform float globalAlpha; // 0..1
uniform bool darkMode;

varying vec4 vVertexColor;

const float MAX_NODE_SIZE = 20.0;   //16.0;

/*
// https://www.rapidtables.com/convert/number/hex-to-decimal.html
// ** cannot initialize array by this way
float PALETTE_HEX[19] = [
  3368652,    //'3366CC',
  14432530,   //'DC3912',
  16750848,   //'FF9900',
  1087000,    //'109618',
  10027161,   //'990099',
  3882668,    //'3B3EAC',
  39366,      //'0099C6',
  14500983,   //'DD4477',
  6728192,    //'66AA00',
  12070446,   //'B82E2E',
  3236757,    //'316395',
  10044569,   //'994499',
  2271897,    //'22AA99',
  11184657,   //'AAAA11',
  6697932,    //'6633CC',
  15102720,   //'E67300',
  9111303,    //'8B0707',
  3314274,    //'329262',
  5600422     //'5574A6',
];
*/

// https://stackoverflow.com/questions/6893302/decode-rgb-value-to-single-float-without-bit-shift-in-glsl
// had to flip r and b to match concrete notation
vec3 unpackColor(float f) {
  vec3 color;
  color.r = floor(f / 256.0 / 256.0);
  color.g = floor((f - color.r * 256.0 * 256.0) / 256.0);
  color.b = floor(f - color.r * 256.0 * 256.0 - color.g * 256.0);
  // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!
  return color / 255.0;
}

void main() {

  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  if (magicZoom) {
    gl_PointSize = MAX_NODE_SIZE;
  }
  else {
    gl_PointSize = nodeSize * MAX_NODE_SIZE * zoom;
  }

  float validColor = mod(aVertexColor, 8.0);

  // gl_VertexID

  bool isFocused = focusedGroup == -1.0 || aVertexColor == focusedGroup;

  if (isFocused) {
    // must be between -1 and 1
    gl_Position.z = -0.5;
  }
  else {
    gl_Position.z = -0.2;
  }

  if (!isFocused) {
    if (darkMode) {
      vVertexColor = vec4(60.0/255.0, 60.0/255.0, 60.0/255.0, globalAlpha);
    }
    else {
      vVertexColor = vec4(220.0/255.0, 220.0/255.0, 220.0/255.0, globalAlpha);
    }
  }

  // '[]' : Index expression must be constant
  // https://stackoverflow.com/q/19529690/6811653

  else if (validColor == 0.0) {
    vVertexColor = vec4(51.0/255.0, 102.0/255.0, 204.0/255.0, globalAlpha); // 3366CC
    // vVertexColor = vec4(unpackColor(3368652.0), globalAlpha); // 3366CC
  }
  else if (validColor == 1.0) {
    vVertexColor = vec4(220.0/255.0, 57.0/255.0, 18.0/255.0, globalAlpha); // DC3912
  }
  else if (validColor == 2.0) {
    vVertexColor = vec4(255.0/255.0, 153.0/255.0, 0.0/255.0, globalAlpha); // FF9900
  }
  else if (validColor == 3.0) {
    vVertexColor = vec4(16.0/255.0, 150.0/255.0, 24.0/255.0, globalAlpha); // 109618
  }
  else if (validColor == 4.0) {
    vVertexColor = vec4(153.0/255.0, 0.0/255.0, 153.0/255.0, globalAlpha); // 990099
  }
  else if (validColor == 5.0) {
    vVertexColor = vec4(59.0/255.0, 62.0/255.0, 172.0/255.0, globalAlpha); // 3B3EAC
  }
  else if (validColor == 6.0) {
    vVertexColor = vec4(0.0/255.0, 153.0/255.0, 198.0/255.0, globalAlpha); // 0099C6
  }
  else if (validColor == 7.0) {
    vVertexColor = vec4(221.0/255.0, 68.0/255.0, 119.0/255.0, globalAlpha); // DD4477
  }

}