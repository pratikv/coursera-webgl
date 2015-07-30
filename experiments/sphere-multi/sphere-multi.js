/**
 * App
 */
(function(window, ColorUtils) {
  'use strict';

  var gl,
    _canvas,
    _shapes = [];

  var drawSphere = function(radius) {
    var lats = 30,
      longs = 30,
      vertices = [],
      indices = [];

    for (var latNumber = 0; latNumber <= lats; ++latNumber) {
      for (var longNumber = 0; longNumber <= longs; ++longNumber) {
        var theta = latNumber * Math.PI / lats;
        var phi = longNumber * 2 * Math.PI / longs;
        var sinTheta = Math.sin(theta);
        var sinPhi = Math.sin(phi);
        var cosTheta = Math.cos(theta);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;

        vertices.push(radius * x);
        vertices.push(radius * y);
        vertices.push(radius * z);
      }
    }

    for (var latNumberI = 0; latNumberI < lats; ++latNumberI) {
      for (var longNumberI = 0; longNumberI < longs; ++longNumberI) {
        var first = (latNumberI * (longs+1)) + longNumberI;
        var second = first + longs + 1;
        indices.push(first);
        indices.push(second);
        indices.push(first+1);

        indices.push(second);
        indices.push(second+1);
        indices.push(first+1);
      }
    }

    return {
      v: vertices,
      i: indices
    };
  };

  var renderAll = function(shapes) {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shapes.forEach(function(shape) {

      // Load shaders
      gl.useProgram(shape.program);

      // Load index data onto GPU
      var iBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

      // Load vertex buffer onto GPU
      var vBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW );

      // Associate shader variables with vertex data buffer
      var vPosition = gl.getAttribLocation( shape.program, 'vPosition' );
      gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      // Uniform vars for user specified parameters
      var colorLoc = gl.getUniformLocation(shape.program, 'fColor');
      var thetaLoc = gl.getUniformLocation(shape.program, 'theta');
      var scaleLoc = gl.getUniformLocation(shape.program, 'scale');
      var translateLoc = gl.getUniformLocation(shape.program, 'translate');

      gl.uniform3fv(thetaLoc, shape.theta);
      gl.uniform3fv(scaleLoc, shape.scale);
      gl.uniform3fv(translateLoc, shape.translate);
      gl.uniform4fv(colorLoc, shape.color);

      gl.drawElements( gl.LINE_LOOP, shape.indices.length, gl.UNSIGNED_SHORT, 0 );

    });
  };

  var addShape = function() {
    var shape = {},
      shapeVI;

    shape.program = initShaders( gl, 'vertex-shader', 'fragment-shader' );

    shapeVI = drawSphere(1); // default radius
    shape.vertices = shapeVI.v;
    shape.indices = shapeVI.i;

    shape.color = ColorUtils.hexToGLvec4(document.getElementById('shapeColor').value);
    shape.theta = [
      document.getElementById('rotateX').valueAsNumber,
      document.getElementById('rotateY').valueAsNumber,
      document.getElementById('rotateZ').valueAsNumber
    ];
    shape.scale = [
      document.getElementById('scaleX').valueAsNumber,
      document.getElementById('scaleY').valueAsNumber,
      document.getElementById('scaleZ').valueAsNumber
    ];
    shape.translate = [
      document.getElementById('translateX').valueAsNumber,
      document.getElementById('translateY').valueAsNumber,
      document.getElementById('translateZ').valueAsNumber
    ];

    return shape;
  };

  var update = function(evt) {
    if (evt.target.id === 'addShape') {
      _shapes.push(addShape());
      renderAll(_shapes);
    }
  };

  var App = {

    init: function() {

      // Setup canvas
      _canvas = document.getElementById('gl-canvas');
      gl = WebGLUtils.setupWebGL( _canvas, {preserveDrawingBuffer: true} );
      if ( !gl ) { alert( 'WebGL isn\'t available' ); }

      // Register settings event handlers
      document.getElementById('settings').addEventListener('click', update);

      // Configure WebGL
      gl.viewport( 0, 0, _canvas.width, _canvas.height );
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      renderAll(_shapes);
    }

  };

  window.App = App;

}(window, window.ColorUtils));


/**
 * App Init
 */
(function(App) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

}(window.App || (window.App = {})));