//#version 300 es

attribute vec4 aVertexPosition;
attribute vec4 normal;
attribute float aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform bool magicZoom;
uniform float nodeSize; // 0..1
uniform float focusedGroup;
uniform float edgeSize; // 0..1
uniform float zoom;
uniform float globalAlpha; // 0..1
uniform bool darkMode;
// modified by maxmin93 (2019-11-04)
uniform float devicePixelRatio;

const float MAX_NODE_SIZE = 16.0;
const float PI = 3.1415926535897932384626433832795;

varying vec4 vVertexColor;

// vec2 rotate(vec2 v, float a) {
// 	float s = sin(a);
// 	float c = cos(a);
// 	mat2 m = mat2(c, -s, s, c);
// 	return m * v;
// }

// https://mattdesl.svbtle.com/drawing-lines-is-hard
// https://github.com/mattdesl/three-line-2d/blob/master/shaders/basic.js
void main() {
  //float zoomX = length(uModelViewMatrix[0]);
  //float zoomY = length(uModelViewMatrix[1]);
  // vec2 standardZoomVector = normalize(vec2(1.0, 0.0));
  // vec2 zoomVector = normalize(vec2(zoomX, zoomY));
  // float zoomAngle = dot(standardZoomVector, zoomVector);
  // vec2 vec2Normal = vec2(normal.xy);
  // vec2 rotatedNormal = rotate(vec2Normal, zoomAngle);
  // vec4 newNormal = vec4(rotatedNormal.x, rotatedNormal.y, 0.0, 0.0);

  vec4 newNormal = MAX_NODE_SIZE * 0.25 * edgeSize * vec4(normal.x, normal.y, 0.0, 0.0);


  if (magicZoom) {
    gl_Position = uProjectionMatrix * ((uModelViewMatrix * aVertexPosition) + newNormal);
  }
  else {
    newNormal.x = newNormal.x * zoom * nodeSize;
    newNormal.y = newNormal.y * zoom * nodeSize;
    gl_Position = uProjectionMatrix * ((uModelViewMatrix * aVertexPosition) + newNormal);
  }

  //gl_Position.z = 0.0;
  

  bool isFocused = focusedGroup == -1.0 || aVertexColor == focusedGroup;

  if (isFocused) {
    gl_Position.z = -0.3;
  }
  else {
    gl_Position.z = 0.0;
  }

  float validColor = mod(aVertexColor, 40.0);   // 8.0);

  if (!isFocused) {
    if (darkMode) {
      vVertexColor = vec4(60.0/255.0, 60.0/255.0, 60.0/255.0, globalAlpha);     // 3C3C3C : darkGray
    }
    else {
      vVertexColor = vec4(220.0/255.0, 220.0/255.0, 220.0/255.0, globalAlpha);  // DCDCDC : brightGray
    }
  }
/*
  else if (validColor == 0.0) {
    vVertexColor = vec4(51.0/255.0, 102.0/255.0, 204.0/255.0, globalAlpha); // 3366CC
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
*/

    else if (validColor == 0.0) {
    vVertexColor = vec4(14.0/255.0, 33.0/255.0, 52.0/255.0, globalAlpha);     // '0e2134',
  } else if (validColor == 1.0) {
    vVertexColor = vec4(24.0/255.0, 152.0/255.0, 215.0/255.0, globalAlpha);   // '1898d7',
  } else if (validColor == 2.0) {
    vVertexColor = vec4(29.0/255.0, 91.0/255.0, 109.0/255.0, globalAlpha);    // '1d5b6d',
  } else if (validColor == 3.0) {
    vVertexColor = vec4(71.0/255.0, 147.0/255.0, 37.0/255.0, globalAlpha);    // '479325',
  } else if (validColor == 4.0) {
    vVertexColor = vec4(141.0/255.0, 201.0/255.0, 157.0/255.0, globalAlpha);  // '8dc99d',
  } else if (validColor == 5.0) {
    vVertexColor = vec4(80.0/255.0, 81.0/255.0, 66.0/255.0, globalAlpha);     // '505142',
  } else if (validColor == 6.0) {
    vVertexColor = vec4(212.0/255.0, 197.0/255.0, 133.0/255.0, globalAlpha);  // 'd4c585',
  } else if (validColor == 7.0) {
    vVertexColor = vec4(225.0/255.0, 189.0/255.0, 93.0/255.0, globalAlpha);   // 'ffbd5d',
  } else if (validColor == 8.0) {
    vVertexColor = vec4(203.0/255.0, 35.0/255.0, 75.0/255.0, globalAlpha);    // 'cb234b',
  } else if (validColor == 9.0) {
    vVertexColor = vec4(185.0/255.0, 95.0/255.0, 59.0/255.0, globalAlpha);    // 'b95f3b',

  } else if (validColor == 10.0) {
    vVertexColor = vec4(27.0/255.0, 63.0/255.0, 132.0/255.0, globalAlpha);    // '1b3f84',
  } else if (validColor == 11.0) {
    vVertexColor = vec4(61.0/255.0, 154.0/255.0, 214.0/255.0, globalAlpha);   // '3d9ad6',
  } else if (validColor == 12.0) {
    vVertexColor = vec4(34.0/255.0, 74.0/255.0, 80.0/255.0, globalAlpha);     // '224a50',
  } else if (validColor == 13.0) {
    vVertexColor = vec4(128.0/255.0, 171.0/255.0, 33.0/255.0, globalAlpha);   // '80ab21',
  } else if (validColor == 14.0) {
    vVertexColor = vec4(0.0, 140.0/255.0, 109.0/255.0, globalAlpha);          // '008c6d',
  } else if (validColor == 15.0) {
    vVertexColor = vec4(114.0/255.0, 110.0/255.0, 75.0/255.0, globalAlpha);   // '726e4b',
  } else if (validColor == 16.0) {
    vVertexColor = vec4(238.0/255.0, 202.0/255.0, 88.0/255.0, globalAlpha);   // 'eeca58',
  } else if (validColor == 17.0) {
    vVertexColor = vec4(244.0/255.0, 176.0/255.0, 52.0/255.0, globalAlpha);   // 'f4b034',
  } else if (validColor == 18.0) {
    vVertexColor = vec4(122.0/255.0, 47.0/255.0, 76.0/255.0, globalAlpha);    // '7a2f4c',
  } else if (validColor == 19.0) {
    vVertexColor = vec4(241.0/255.0, 99.0/255.0, 44.0/255.0, globalAlpha);    // 'f1632c',

  } else if (validColor == 20.0) {
    vVertexColor = vec4(0.0, 90.0/255.0, 168.0/255.0, globalAlpha);           // '005aa8',
  } else if (validColor == 21.0) {
    vVertexColor = vec4(102.0/255.0, 183.0/255.0, 230.0/255.0, globalAlpha);  // '66b7e6',
  } else if (validColor == 22.0) {
    vVertexColor = vec4(61.0/255.0, 76.0/255.0, 54.0/255.0, globalAlpha);     // '3d4c36',
  } else if (validColor == 23.0) {
    vVertexColor = vec4(181.0/255.0, 213.0/255.0, 110.0/255.0, globalAlpha);  // 'b5d56e',
  } else if (validColor == 24.0) {
    vVertexColor = vec4(0.0, 90.0/255.0, 63.0/255.0, globalAlpha);            // '005a3f',
  } else if (validColor == 25.0) {
    vVertexColor = vec4(160.0/255.0, 152.0/255.0, 87.0/255.0, globalAlpha);   // 'a09857',
  } else if (validColor == 26.0) {
    vVertexColor = vec4(253.0/255.0, 214.0/255.0, 86.0/255.0, globalAlpha);   // 'fdd656',
  } else if (validColor == 27.0) {
    vVertexColor = vec4(227.0/255.0, 74.0/255.0, 105.0/255.0, globalAlpha);   // 'e34a69',
  } else if (validColor == 28.0) {
    vVertexColor = vec4(158.0/255.0, 66.0/255.0, 61.0/255.0, globalAlpha);    // '9e423d',
  } else if (validColor == 29.0) {
    vVertexColor = vec4(242.0/255.0, 113.0/255.0, 72.0/255.0, globalAlpha);   // 'f27148',

  } else if (validColor == 30.0) {
    vVertexColor = vec4(92.0/255.0, 123.0/255.0, 187.0/255.0, globalAlpha);   // '5c7bbb',
  } else if (validColor == 31.0) {
    vVertexColor = vec4(0.0, 133.0/255.0, 174.0/255.0, globalAlpha);          // '0085ae',
  } else if (validColor == 32.0) {
    vVertexColor = vec4(29.0/255.0, 76.0/255.0, 20.0/255.0, globalAlpha);     // '1d4c14',
  } else if (validColor == 33.0) {
    vVertexColor = vec4(161.0/255.0, 208.0/255.0, 158.0/255.0, globalAlpha);  // 'a1d09e',
  } else if (validColor == 34.0) {
    vVertexColor = vec4(66.0/255.0, 107.0/255.0, 97.0/255.0, globalAlpha);    // '426b61',
  } else if (validColor == 35.0) {
    vVertexColor = vec4(163.0/255.0, 151.0/255.0, 120.0/255.0, globalAlpha);  // 'a39778',
  } else if (validColor == 36.0) {
    vVertexColor = vec4(255.0/255.0, 229.0/255.0, 91.0/255.0, globalAlpha);   // 'ffe55b',
  } else if (validColor == 37.0) {
    vVertexColor = vec4(210.0/255.0, 16.0/255.0, 61.0/255.0, globalAlpha);    // 'd2103d',
  } else if (validColor == 38.0) {
    vVertexColor = vec4(116.0/255.0, 79.0/255.0, 67.0/255.0, globalAlpha);    // '744f43',
  } else if (validColor == 39.0) {
    vVertexColor = vec4(247.0/255.0, 136.0/255.0, 62.0/255.0, globalAlpha);   // 'f7883e'
  }
}