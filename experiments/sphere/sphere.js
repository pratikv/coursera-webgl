/**
 * App
 */
(function(window) {
  'use strict';

  var _gl,
    _program,
    _canvas,
    _vertices = [],
    _normals = [],
    _vertexColors = [],
    _indices = [];

  // https://www.webkit.org/blog-files/webgl/Earth.html
  var drawSphere = function(radius) {
    var lats = 15,
      longs = 15;

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
            // var u = 1-(longNumber/longs);
            // var v = latNumber/lats;

            // normalData.push(x);
            // normalData.push(y);
            // normalData.push(z);
            // texCoordData.push(u);
            // texCoordData.push(v);
            _vertices.push(radius * x);
            _vertices.push(radius * y);
            _vertices.push(radius * z);

            _vertexColors.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
        }
    }

    for (var latNumberI = 0; latNumberI < lats; ++latNumberI) {
        for (var longNumberI = 0; longNumberI < longs; ++longNumberI) {
            var first = (latNumberI * (longs+1)) + longNumberI;
            var second = first + longs + 1;
            _indices.push(first);
            _indices.push(second);
            _indices.push(first+1);

            _indices.push(second);
            _indices.push(second+1);
            _indices.push(first+1);
        }
    }
  };

  var drawCube = function() {
    _vertices = [
      vec3( -0.5, -0.5,  0.5 ),
      vec3( -0.5,  0.5,  0.5 ),
      vec3(  0.5,  0.5,  0.5 ),
      vec3(  0.5, -0.5,  0.5 ),
      vec3( -0.5, -0.5, -0.5 ),
      vec3( -0.5,  0.5, -0.5 ),
      vec3(  0.5,  0.5, -0.5 ),
      vec3(  0.5, -0.5, -0.5 )
    ];

    _vertexColors = [
      vec4( 0.0, 0.0, 0.0, 1.0 ),
      vec4( 1.0, 0.0, 0.0, 1.0 ),
      vec4( 1.0, 1.0, 0.0, 1.0 ),
      vec4( 0.0, 1.0, 0.0, 1.0 ),
      vec4( 0.0, 0.0, 1.0, 1.0 ),
      vec4( 1.0, 0.0, 1.0, 1.0 ),
      vec4( 1.0, 1.0, 1.0, 1.0 ),
      vec4( 0.0, 1.0, 1.0, 1.0 )
    ];

    _indices = [
      1, 0, 3,
      3, 2, 1,
      2, 3, 7,
      7, 6, 2,
      3, 0, 4,
      4, 7, 3,
      6, 5, 1,
      1, 2, 6,
      4, 5, 6,
      6, 7, 4,
      5, 4, 0,
      0, 1, 5
    ];
  };

  var render = function() {
    _gl.clear( _gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
    // _gl.drawElements( _gl.TRIANGLES, _indices.length, _gl.UNSIGNED_BYTE, 0 );
    for (var i=0; i<_indices.length; i+=3) {
      _gl.drawElements( _gl.LINE_LOOP, 3, _gl.UNSIGNED_BYTE, i );
    }
  };

  var App = {

    init: function() {

      // Setup canvas
      _canvas = document.getElementById('gl-canvas');
      _gl = WebGLUtils.setupWebGL( _canvas, {preserveDrawingBuffer: true} );
      if ( !_gl ) { alert( 'WebGL isn\'t available' ); }

      // Configure WebGL
      _gl.viewport( 0, 0, _canvas.width, _canvas.height );
      _gl.clearColor(0.0, 0.0, 0.0, 1.0);
      _gl.enable(_gl.DEPTH_TEST);

      // Initialize data arrays
      // drawCube();
      drawSphere(0.5);

      // Load shaders
      _program = initShaders( _gl, 'vertex-shader', 'fragment-shader' );
      _gl.useProgram( _program );

      // Load index data onto GPU
      var iBuffer = _gl.createBuffer();
      _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, iBuffer);
      _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_indices), _gl.STATIC_DRAW);

      // Load normal data buffer onto GPU
      var nBuffer = _gl.createBuffer();
      _gl.bindBuffer(_gl.ARRAY_BUFFER, nBuffer);
      _gl.bufferData(_gl.ARRAY_BUFFER, flatten(_normals), _gl.STATIC_DRAW);

      // Associate shader variables with normal data buffer
      var vNormal = _gl.getAttribLocation( _program, 'vNormal');
      _gl.vertexAttribPointer(0, 3, _gl.FLOAT, false, 0, 0);
      // _gl.enableVertexAttribArray( vNormal );

      // Load color data buffer onto GPU
      var cBuffer = _gl.createBuffer();
      _gl.bindBuffer( _gl.ARRAY_BUFFER, cBuffer );
      _gl.bufferData( _gl.ARRAY_BUFFER, flatten(_vertexColors), _gl.STATIC_DRAW );

      // Associate shader variables with color data buffer
      var vColor = _gl.getAttribLocation( _program, 'vColor' );
      _gl.vertexAttribPointer( vColor, 4, _gl.FLOAT, false, 0, 0 );
      _gl.enableVertexAttribArray( vColor );

      // Load vertex buffer onto GPU
      var vBuffer = _gl.createBuffer();
      _gl.bindBuffer( _gl.ARRAY_BUFFER, vBuffer );
      _gl.bufferData( _gl.ARRAY_BUFFER, flatten(_vertices), _gl.STATIC_DRAW );

      // Associate shader variables with vertex data buffer
      var vPosition = _gl.getAttribLocation( _program, 'vPosition' );
      _gl.vertexAttribPointer( vPosition, 3, _gl.FLOAT, false, 0, 0 );
      _gl.enableVertexAttribArray( vPosition );

      render();
    }

  };

  window.App = App;

}(window));


/**
 * App Init
 */
(function(App) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

}(window.App || (window.App = {})));