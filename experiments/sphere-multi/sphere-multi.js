/**
 * App
 */
(function(window, ColorUtils, Shape) {
  'use strict';

  var gl,
    _canvas,
    _shapes = [];

  var renderShape = function(shape, isBorder) {
    // Load shaders
    gl.useProgram(shape.program);

    // Load index data onto GPU
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

    // if (isBorder) {
    //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.border.indices), gl.STATIC_DRAW);
    // } else {
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);
    // }

    // Load vertex buffer onto GPU
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    if (isBorder) {
      gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.border.vertices), gl.STATIC_DRAW );
    } else {
      gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW );
    }

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

    if (isBorder) {
      gl.uniform3fv(scaleLoc, shape.border.scale);
    } else {
      gl.uniform3fv(scaleLoc, shape.scale);
    }

    // if (isBorder) {
    //   gl.uniform3fv(translateLoc, [
    //     shape.boundingBox.t[0] * shape.translate[0],
    //     shape.boundingBox.t[1] * shape.translate[1],
    //     shape.boundingBox.t[2] * shape.translate[2]
    //   ]);
    // } else {
      gl.uniform3fv(translateLoc, shape.translate);
    // }

    if (isBorder) {
        gl.uniform4fv(colorLoc, vec4(1.0, 1.0, 1.0, 1.0));
    } else {
      gl.uniform4fv(colorLoc, shape.color);
    }

    // if (isBorder) {
    //   gl.drawElements( gl.LINE_LOOP, shape.boundingBox.i.length, gl.UNSIGNED_SHORT, 0 );
    // } else {
      gl.drawElements( gl.LINE_LOOP, shape.indices.length, gl.UNSIGNED_SHORT, 0 );
    // }
  };

  var render = function(shapes, oneShape) {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (oneShape) {
      renderShape(oneShape);
      renderShape(oneShape, true);
    }

    shapes.forEach(function(shape) {
      renderShape(shape);
    });

  };

  var addShape = function(shapeOption, editing) {
    var shape = {type: shapeOption},
      shapeVI;

    shape.program = initShaders( gl, 'vertex-shader', 'fragment-shader' );

    shapeVI = Shape.generate(shapeOption);
    shape.vertices = shapeVI.v;
    shape.indices = shapeVI.i;

    // if (editing) {
    //   shape.boundingBox = Shape.boundingBox(shape.vertices);
    // }

    shape.color = ColorUtils.hexToGLvec4(document.getElementById('shapeColor').value);

    shape.theta = [
      document.getElementById('rotateX').valueAsNumber,
      document.getElementById('rotateY').valueAsNumber,
      document.getElementById('rotateZ').valueAsNumber
    ];

    if (editing) {
      shape.scale = [
        document.getElementById('scaleX').valueAsNumber * 1.1,
        document.getElementById('scaleY').valueAsNumber * 1.1,
        document.getElementById('scaleZ').valueAsNumber * 1.1
      ];
    } else {
      shape.scale = [
        document.getElementById('scaleX').valueAsNumber,
        document.getElementById('scaleY').valueAsNumber,
        document.getElementById('scaleZ').valueAsNumber
      ];
    }

    shape.translate = [
      document.getElementById('translateX').valueAsNumber,
      document.getElementById('translateY').valueAsNumber,
      document.getElementById('translateZ').valueAsNumber
    ];

    return shape;
  };

  var update = function(evt) {
    var shapeSelect = document.getElementById('shape');
    var shapeOption = shapeSelect.options[shapeSelect.selectedIndex].value;

    if (evt.target.id === 'addShape' || evt.target.id === 'addShapeIcon') {
      _shapes.push(addShape(shapeOption));
      render(_shapes);
    }

    if (evt.target.id === 'clear' || evt.target.id === 'clearIcon') {
      _shapes = [];
      render(_shapes);
    }
  };

  var edit = function() {
    var shapeSelect = document.getElementById('shape');
    var shapeOption = shapeSelect.options[shapeSelect.selectedIndex].value;

    var shapeToEdit = addShape(shapeOption);
    shapeToEdit.border = addShape(shapeOption, true);
    render(_shapes, shapeToEdit);
  };

  var App = {

    init: function() {

      // Setup canvas
      _canvas = document.getElementById('gl-canvas');
      gl = WebGLUtils.setupWebGL( _canvas, {preserveDrawingBuffer: true} );
      if ( !gl ) { alert( 'WebGL isn\'t available' ); }

      // Register settings event handlers
      document.getElementById('settings').addEventListener('click', update);
      document.getElementById('settings').addEventListener('change', edit);

      // Configure WebGL
      gl.viewport( 0, 0, _canvas.width, _canvas.height );
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      // Seed the system with one sphere
      edit();
    }

  };

  window.App = App;

}(window, window.ColorUtils, window.Shape));


/**
 * App Init
 */
(function(App) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

}(window.App || (window.App = {})));
