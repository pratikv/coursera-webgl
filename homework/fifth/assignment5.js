/**
 * App
 */
(function(window, Sphere) {
  'use strict';

  var gl,
    canvas,
    program,
    shape,
    theta = [45.0, 45.0, 45.0],
    modelMatrix = mat4(),
    zoom = 5.3,
    eyeTheta = 30.0,
    eyePhi = 30.0,
    eyeAtX = 0.8,
    eyeAtY = -0.4,
    eyeAtZ = 1.0,
    viewMatrix = mat4(),
    modelViewMatrix = mat4(),
    fovy = 45.0,
    near = 1.0,
    far = -1.0,
    projectionMatrix = mat4(),
    shapeColor = vec4(1.0, 1.0, 1.0, 1.0),
    texture,
    mouseDown = false,
    lastMouseX = null,
    lastMouseY = null,
    texSize = 64,
    checkerboardImage, fileImage,
    textureType = 'file',
    normalMatrix = mat4(),
    cubeMapImages = {},
    cubeMap;

  var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
  var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
  var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
  var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

  var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
  var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
  var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
  var materialShininess = 20.0;

  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  var buildCheckerboard = function() {
    var image1 = [];
    for (var i =0; i<texSize; i++) {
      image1[i] = [];
    }
    for (var i =0; i<texSize; i++) {
      for ( var j = 0; j < texSize; j++) {
        image1[i][j] = new Float32Array(4);
      }
    }
    for (var i =0; i<texSize; i++) {
      for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
      }
    }

    // Convert floats to ubytes for texture
    var checkImage = new Uint8Array(4*texSize*texSize);
    for ( var i = 0; i < texSize; i++ ) {
      for ( var j = 0; j < texSize; j++ ) {
        for(var k =0; k<4; k++) {
          checkImage[4*texSize*i+4*j+k] = 255*image1[i][j][k];
        }
      }
    }

    return checkImage;
  };

  var configureTexture = function(image) {
    texture = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    if (textureType === 'file') {
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    }

    if (textureType === 'pattern') {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);
  };

  var adjustCanvas = function() {
    var width = canvas.clientWidth,
      height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);

    projectionMatrix = perspective(fovy, canvas.width / canvas.height, near, far);
    gl.uniformMatrix4fv(gl.getUniformLocation( program, 'projectionMatrix' ), false, flatten(projectionMatrix) );
  };

  var render = function() {
    var vBuffer,
      vPosition;

    adjustCanvas();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix' ), false, flatten(modelViewMatrix) );

    if (textureType === 'reflection') {
      var nBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
      gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.normals), gl.STATIC_DRAW );

      var vNormal = gl.getAttribLocation( program, "vNormal" );
      gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vNormal);

      vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW);

      vPosition = gl.getAttribLocation( program, "vPosition");
      gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);

      // Send normal matrix
      var normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
      gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

      // Send lighting
      gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
      gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
      gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
      gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
      gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );

    } else {
      // Load index data
      var iBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

      // Load vertex data
      vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW);

      // Associate shader variable with vertex data buffer
      vPosition = gl.getAttribLocation( program, 'vPosition' );
      gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      // Load texture data
      var tBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.textureCoords), gl.STATIC_DRAW);

      // Associate shader variable with texture data buffer
      var vTexCoord = gl.getAttribLocation(program, 'vTexCoord');
      gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vTexCoord);

      // Send color
      gl.uniform4fv(gl.getUniformLocation(program, 'fColor'), flatten(shapeColor));
    }

    gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);

    setTimeout(
      function () {requestAnimFrame( render );},
      1000 / 60
    );
  };

  var buildViewMatrix = function() {
    var at = vec3(eyeAtX, eyeAtY, eyeAtZ);
    var up = vec3(0.0, 1.0, 0.0);
    var eye = vec3(
      zoom * Math.sin(radians(eyeTheta)) * Math.cos(radians(eyePhi)),
      zoom * Math.sin(radians(eyeTheta)) * Math.sin(radians(eyePhi)),
      zoom * Math.cos(radians(eyeTheta))
    );
    return lookAt(eye, at, up);
  };

  var buildModelViewMatrix = function() {
    var modelMatrix = mat4(),
      mv;

    modelMatrix = mult(modelMatrix, rotate(theta[0], [1, 0, 0] ));
    modelMatrix = mult(modelMatrix, rotate(theta[1], [0, 1, 0] ));
    modelMatrix = mult(modelMatrix, rotate(theta[2], [0, 0, 1] ));

    mv = mult(viewMatrix, modelMatrix);

    normalMatrix = inverseMat3(flatten(mv));
    normalMatrix = transpose(normalMatrix);

    return mv;
  };

  var handleMouseDown = function(evt) {
    mouseDown = true;
    lastMouseX = evt.clientX;
    lastMouseY = evt.clientY;
  };

  var handleMouseUp = function() {
    mouseDown = false;
  };

  var handleMouseMove = function(evt) {
    if (!mouseDown) {
      return;
    }
    var newX = evt.clientX;
    var newY = evt.clientY;

    var deltaX = newX - lastMouseX;
    theta[1] -= deltaX / 10;

    var deltaY = newY - lastMouseY;
    theta[0] -= deltaY / 10;

    modelViewMatrix = buildModelViewMatrix();

    lastMouseX = newX;
    lastMouseY = newY;
  };

  var handlePatternTextureSelection = function(evt) {
    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    textureType = 'pattern';
    configureTexture(checkerboardImage);
  };

  var loadTextureFile = function(textureFileUrl) {
    fileImage = new Image();
    fileImage.onload = function() {
        configureTexture( fileImage );
        render();
    };
    fileImage.onerror = function() {
      console.error('Unable to load image: ' + textureFileUrl);
    };
    fileImage.src = textureFileUrl;
  };

  var configureCubeMap = function() {
    cubeMap = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posx );
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negx );
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posy );
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negy );
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posz );
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negz );

    // format cube map texture
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.activeTexture( gl.TEXTURE0 );
    gl.uniform1i(gl.getUniformLocation(program, "texMap"),0);
  };

  var cubeMapLoaded = function() {
    var cubeMapLoaded = function() {
      if (cubeMapImages.posx && cubeMapImages.negx &&
          cubeMapImages.posy && cubeMapImages.negy &&
          cubeMapImages.posz && cubeMapImages.negz) {
        configureCubeMap();
      }
    };
  };

  var loadCubeMapImage = function(position, url, cb) {
    var fileImage = new Image();
    fileImage.onload = function() {
      cubeMapImages[position] = fileImage;
      cb();
    };
    fileImage.src = url;
  };

  var loadCubeMapImages = function() {
    loadCubeMapImage('negx', 'images/lycksele/negx.jpg', cubeMapLoaded);
    loadCubeMapImage('negy', 'images/lycksele/negy.jpg', cubeMapLoaded);
    loadCubeMapImage('negz', 'images/lycksele/negz.jpg', cubeMapLoaded);
    loadCubeMapImage('posx', 'images/lycksele/posx.jpg', cubeMapLoaded);
    loadCubeMapImage('posy', 'images/lycksele/posy.jpg', cubeMapLoaded);
    loadCubeMapImage('posz', 'images/lycksele/posz.jpg', cubeMapLoaded);
  };

  var handleFileTextureSelection = function(evt) {
    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    var textureFileUrl = 'images/' + evt.target.dataset.textureFile;
    textureType = 'file';
    loadTextureFile(textureFileUrl);
  };

  var handleReflectionSelection = function() {
    program = initShaders(gl, 'vertex-shader-2', 'fragment-shader-2');
    gl.useProgram(program);

    textureType = 'reflection';
    loadCubeMapImages();
  };

  var handleCameraControl = function() {
    near = document.getElementById('cameraNear').valueAsNumber;
    far = document.getElementById('cameraFar').valueAsNumber;
    fovy = document.getElementById('cameraFovy').valueAsNumber;
    // no need to rebuild projection matrix here, handled in render
  };

  var handleEyeControl = function() {
    zoom = document.getElementById('eyeZoom').valueAsNumber;
    eyeTheta = document.getElementById('eyeTheta').valueAsNumber;
    eyePhi = document.getElementById('eyePhi').valueAsNumber;
    eyeAtX = document.getElementById('eyeAtX').valueAsNumber;
    eyeAtY = document.getElementById('eyeAtY').valueAsNumber;
    eyeAtZ = document.getElementById('eyeAtZ').valueAsNumber;

    viewMatrix = buildViewMatrix();
    modelViewMatrix = buildModelViewMatrix();
  };

  var App = {

    init: function() {

      // Setup canvas
      canvas = document.getElementById('gl-canvas');
      gl = WebGLUtils.setupWebGL( canvas, {preserveDrawingBuffer: true} );
      if ( !gl ) { alert( 'WebGL isn\'t available' ); }

      // Register event handlers
      canvas.onmousedown = handleMouseDown;
      document.onmouseup = handleMouseUp;
      document.onmousemove = handleMouseMove;
      document.getElementById('patternTextureSelection').addEventListener('click', handlePatternTextureSelection);
      document.getElementById('fileTextureSelection').addEventListener('click', handleFileTextureSelection);
      document.getElementById('reflectionSelection').addEventListener('click', handleReflectionSelection);
      document.getElementById('cameraControl').addEventListener('change', handleCameraControl);
      document.getElementById('eyeControl').addEventListener('change', handleEyeControl);

      // Configure WebGL
      gl.viewport( 0, 0, canvas.width, canvas.height );
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.0, 2.0);

      // Model and view
      shape = Sphere.generate();
      viewMatrix = buildViewMatrix();
      modelViewMatrix = buildModelViewMatrix();

      // Load shaders
      program = initShaders(gl, 'vertex-shader', 'fragment-shader');
      gl.useProgram(program);

      // Load index data
      var iBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

      // Load vertex data
      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW);

      // Associate shader variable with vertex data buffer
      var vPosition = gl.getAttribLocation( program, 'vPosition' );
      gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      // Load texture data
      var tBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.textureCoords), gl.STATIC_DRAW);

      // Associate shader variable with texture data buffer
      var vTexCoord = gl.getAttribLocation(program, 'vTexCoord');
      gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vTexCoord);

      // Send color
      gl.uniform4fv(gl.getUniformLocation(program, 'fColor'), flatten(shapeColor));

      // Initialize textures
      checkerboardImage = buildCheckerboard();
      loadTextureFile('images/moon.gif');
    }

  };

  window.App = App;

}(window, window.Sphere));


/**
 * App Init
 */
(function(App) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

}(window.App || (window.App = {})));
