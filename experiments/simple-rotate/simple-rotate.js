'use strict';

var gl;

var render = function() {
  gl.clear( gl.COLOR_BUFFER_BIT );
  gl.drawArrays( gl.TRIANGLES, 0, 3 );
};

var rotate = function(vec2Point, theta) {
  var originalX = vec2Point[0];
  var originalY = vec2Point[1];
  var newX = (originalX * Math.cos(theta)) - (originalY * Math.sin(theta));
  var newY = (originalX * Math.sin(theta)) + (originalY * Math.cos(theta));
  return vec2(newX, newY);
};

window.onload = function init() {

  // init
  var canvas = document.getElementById( 'gl-canvas' );
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( 'WebGL isn\'t available' ); }

  var originalTriangle = [
    vec2(-0.5, -0.5),
    vec2(0, 0.5),
    vec2(0.5, -0.5)
  ];

  var theta = 30;
  var rotatedTriangle = [
    rotate(originalTriangle[0], theta),
    rotate(originalTriangle[1], theta),
    rotate(originalTriangle[2], theta)
  ];

  // configure display
  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0, 0, 0, 1.0 );

  // load shaders
  var program = initShaders( gl, 'vertex-shader', 'fragment-shader' );
  gl.useProgram( program );

  // load the data into the GPU
  var bufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(rotatedTriangle), gl.STATIC_DRAW );

  // associate shader variables with data buffer
  var vPosition = gl.getAttribLocation( program, 'vPosition' );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  render();
};
