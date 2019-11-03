const Color = require('./Color');

//http://there4.io/2012/05/02/google-chart-color-list/
const PALETTE_HEX = [
/*
  '3366CC',
  'DC3912',
  'FF9900',
  '109618',
  '990099',
  '3B3EAC',
  '0099C6',
  'DD4477',
  '66AA00',
  'B82E2E',
  '316395',
  '994499',
  '22AA99',
  'AAAA11',
  '6633CC',
  'E67300',
  '8B0707',
  '329262',
  '5574A6',
  '3B3EAC'
*/

'0e2134',   // vVertexColor = vec4(14.0/255.0, 33.0/255.0, 52.0/255.0, globalAlpha);
'1898d7',   // vVertexColor = vec4(24.0/255.0, 152.0/255.0, 215.0/255.0, globalAlpha);
'1d5b6d',   // vVertexColor = vec4(29.0/255.0, 91.0/255.0, 109.0/255.0, globalAlpha);
'479325',   // vVertexColor = vec4(71.0/255.0, 147.0/255.0, 37.0/255.0, globalAlpha);
'8dc99d',   // vVertexColor = vec4(141.0/255.0, 201.0/255.0, 157.0/255.0, globalAlpha);
'505142',   // vVertexColor = vec4(80.0/255.0, 81.0/255.0, 66.0/255.0, globalAlpha);
'd4c585',   // vVertexColor = vec4(212.0/255.0, 197.0/255.0, 133.0/255.0, globalAlpha);
'ffbd5d',   // vVertexColor = vec4(225.0/255.0, 189.0/255.0, 93.0/255.0, globalAlpha);
'cb234b',   // vVertexColor = vec4(203.0/255.0, 35.0/255.0, 75.0/255.0, globalAlpha);
'b95f3b',   // vVertexColor = vec4(185.0/255.0, 95.0/255.0, 59.0/255.0, globalAlpha);

'1b3f84',   // vVertexColor = vec4(27.0/255.0, 63.0/255.0, 132.0/255.0, globalAlpha);
'3d9ad6',   // vVertexColor = vec4(61.0/255.0, 154.0/255.0, 214.0/255.0, globalAlpha);
'224a50',   // vVertexColor = vec4(34.0/255.0, 74.0/255.0, 80.0/255.0, globalAlpha);
'80ab21',   // vVertexColor = vec4(128.0/255.0, 171.0/255.0, 33.0/255.0, globalAlpha);
'008c6d',   // vVertexColor = vec4(0.0, 140.0/255.0, 109.0/255.0, globalAlpha);
'726e4b',   // vVertexColor = vec4(114.0/255.0, 110.0/255.0, 75.0/255.0, globalAlpha);
'eeca58',   // vVertexColor = vec4(238.0/255.0, 202.0/255.0, 88.0/255.0, globalAlpha);
'f4b034',   // vVertexColor = vec4(244.0/255.0, 176.0/255.0, 52.0/255.0, globalAlpha);
'7a2f4c',   // vVertexColor = vec4(122.0/255.0, 47.0/255.0, 76.0/255.0, globalAlpha);
'f1632c',   // vVertexColor = vec4(241.0/255.0, 99.0/255.0, 44.0/255.0, globalAlpha);

'005aa8',   // vVertexColor = vec4(0.0, 90.0/255.0, 168.0/255.0, globalAlpha);
'66b7e6',   // vVertexColor = vec4(102.0/255.0, 183.0/255.0, 230.0/255.0, globalAlpha);
'3d4c36',   // vVertexColor = vec4(61.0/255.0, 76.0/255.0, 54.0/255.0, globalAlpha);
'b5d56e',   // vVertexColor = vec4(181.0/255.0, 213.0/255.0, 110.0/255.0, globalAlpha);
'005a3f',   // vVertexColor = vec4(0.0, 90.0/255.0, 63.0/255.0, globalAlpha);
'a09857',   // vVertexColor = vec4(160.0/255.0, 152.0/255.0, 87.0/255.0, globalAlpha);
'fdd656',   // vVertexColor = vec4(253.0/255.0, 214.0/255.0, 86.0/255.0, globalAlpha);
'e34a69',   // vVertexColor = vec4(227.0/255.0, 74.0/255.0, 105.0/255.0, globalAlpha);
'9e423d',   // vVertexColor = vec4(158.0/255.0, 66.0/255.0, 61.0/255.0, globalAlpha);
'f27148',   // vVertexColor = vec4(242.0/255.0, 113.0/255.0, 72.0/255.0, globalAlpha);

'5c7bbb',   // vVertexColor = vec4(92.0/255.0, 123.0/255.0, 187.0/255.0, globalAlpha);
'0085ae',   // vVertexColor = vec4(0.0, 133.0/255.0, 174.0/255.0, globalAlpha);
'1d4c14',   // vVertexColor = vec4(29.0/255.0, 76.0/255.0, 20.0/255.0, globalAlpha);
'a1d09e',   // vVertexColor = vec4(161.0/255.0, 208.0/255.0, 158.0/255.0, globalAlpha);
'426b61',   // vVertexColor = vec4(66.0/255.0, 107.0/255.0, 97.0/255.0, globalAlpha);
'a39778',   // vVertexColor = vec4(163.0/255.0, 151.0/255.0, 120.0/255.0, globalAlpha);
'ffe55b',   // vVertexColor = vec4(255.0/255.0, 229.0/255.0, 91.0/255.0, globalAlpha);
'd2103d',   // vVertexColor = vec4(210.0/255.0, 16.0/255.0, 61.0/255.0, globalAlpha);
'744f43',   // vVertexColor = vec4(116.0/255.0, 79.0/255.0, 67.0/255.0, globalAlpha);
'f7883e'    // vVertexColor = vec4(247.0/255.0, 136.0/255.0, 62.0/255.0, globalAlpha);
];

let paletteRGB = [];

PALETTE_HEX.forEach(function(hex) {
  paletteRGB = paletteRGB.concat(Color.hexToRgb(hex));
});

const Theme = {
  palette: paletteRGB
};

module.exports = Theme;