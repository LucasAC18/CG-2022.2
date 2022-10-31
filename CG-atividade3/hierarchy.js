/**
 * @file
 *
 * Summary.
 * <p>Hierarchical Robot object using a matrix stack.</p>
 *
 * @author Paulo Roma & Lucas Araujo Carvalho
 * @since 27/09/2016
 * @see https://orion.lcg.ufrj.br/WebGL/labs/WebGL/Assignment_3/Hierarchy.html
 * @see <a href="/WebGL/labs/WebGL/Assignment_3/Hierarchy.js">source</a>
 * @see <a href="/WebGL/labs/WebGL/teal_book/cuon-matrix.js">cuon-matrix</a>
 * @see https://www.cs.ucy.ac.cy/courses/EPL426/courses/eBooks/ComputerGraphicsPrinciplesPractice.pdf#page=188
 * @see https://www.cs.drexel.edu/~david/Classes/ICG/Lectures_new/L-14_HierchModels.pdf
 * @see https://www.lcg.ufrj.br/WebGL/labs/WebGL/Assignment_3/5.hierarchy.pdf
 * @see <img src="../robot.png" width="512">
 */

 "use strict";

 /**
  * A very basic stack class,
  * for keeping a hierarchy of transformations.
  * @class
  */
 class Stack {
   /**
    * Constructor.
    * @constructs Stack
    */
   constructor() {
     /** Array for holding the stack elements. */
     this.elements = [];
     /** Top of the stack. */
     this.t = 0;
   }
 
   /**
    * Pushes a given matrix onto this stack.
    * @param {Matrix4} m transformation matrix.
    */
   push(m) {
     this.elements[this.t++] = m;
   }
 
   /**
    * Return the matrix at the top of this stack.
    * @return {Matrix4} m transformation matrix.
    */
   top() {
     if (this.t <= 0) {
       console.log("top = ", this.t);
       console.log("Warning: stack underflow");
     } else {
       return this.elements[this.t - 1];
     }
   }
 
   /**
    * Pops the matrix at the top of this stack.
    * @return {Matrix4} m transformation matrix.
    */
   pop() {
     if (this.t <= 0) {
       console.log("Warning: stack underflow");
     } else {
       this.t--;
       var temp = this.elements[this.t];
       this.elements[this.t] = undefined;
       return temp;
     }
   }
 
   /**
    * Returns whether this stack is empty.
    * @returns {Boolean} true if the stack is empty.
    */
   isEmpty() {
     return this.t <= 0;
   }
 }
 
 /**
  * <p>Creates data for vertices, colors, and normal vectors for
  * a unit cube. </p>
  *
  * Return value is an object with three attributes:
  * vertices, colors, and normals, each referring to a Float32Array.<br>
  * (Note this is a "self-invoking" anonymous function.)
  * @return {Object<{numVertices: Number, vertices: Float32Array, colors: Float32Array, normals: Float32Array}>}
  * vertex array with associated color and normal arrays.
  * @function
  * @global
  */
 var cube = (function makeCube() {
   // vertices of cube
   // prettier-ignore
   var rawVertices = new Float32Array([
       -0.5, -0.5, 0.5,
       0.5, -0.5, 0.5,
       0.5, 0.5, 0.5,
       -0.5, 0.5, 0.5,
       -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5, 0.5, -0.5,
       -0.5, 0.5, -0.5
     ]);
 
   // prettier-ignore
   var rawColors = new Float32Array([
       1.0, 0.0, 0.0, 1.0,  // red
       0.0, 1.0, 0.0, 1.0,  // green
       0.0, 0.0, 1.0, 1.0,  // blue
       1.0, 1.0, 0.0, 1.0,  // yellow
       1.0, 0.0, 1.0, 1.0,  // magenta
       0.0, 1.0, 1.0, 1.0,  // cyan
     ]);
 
   // prettier-ignore
   var rawNormals = new Float32Array([
       0, 0, 1,
       1, 0, 0,
       0, 0, -1,
       -1, 0, 0,
       0, 1, 0,
       0, -1, 0
     ]);
 
   // prettier-ignore
   var indices = new Uint16Array([
       0, 1, 2, 0, 2, 3,  // z face
       1, 5, 6, 1, 6, 2,  // +x face
       5, 4, 7, 5, 7, 6,  // -z face
       4, 0, 3, 4, 3, 7,  // -x face
       3, 2, 6, 3, 6, 7,  // + y face
       4, 5, 1, 4, 1, 0   // -y face
     ]);
 
   var verticesArray = [];
   var colorsArray = [];
   var normalsArray = [];
   for (var i = 0; i < 36; ++i) {
     // for each of the 36 vertices...
     var face = Math.floor(i / 6);
     var index = indices[i];
 
     // (x, y, z): three numbers for each point
     for (var j = 0; j < 3; ++j) {
       verticesArray.push(rawVertices[3 * index + j]);
     }
 
     // (r, g, b, a): four numbers for each point
     for (var j = 0; j < 4; ++j) {
       colorsArray.push(rawColors[4 * face + j]);
     }
 
     // three numbers for each point
     for (var j = 0; j < 3; ++j) {
       normalsArray.push(rawNormals[3 * face + j]);
     }
   }
 
   return {
     numVertices: 36,
     vertices: new Float32Array(verticesArray),
     colors: new Float32Array(colorsArray),
     normals: new Float32Array(normalsArray),
   };
 })();
 
 /**
  * Return a matrix to transform normals, so they stay
  * perpendicular to surfaces after a linear transformation.
  * @param {Matrix4} model model matrix.
  * @param {Matrix4} view view matrix.
  * @returns {Float32Array} modelview transposed inverse.
  */
 function makeNormalMatrixElements(model, view) {
   var n = new Matrix4(view).multiply(model);
   n.transpose();
   n.invert();
   n = n.elements;
   // prettier-ignore
   return new Float32Array([
       n[0], n[1], n[2],
       n[4], n[5], n[6],
       n[8], n[9], n[10]
     ]);
 }
 
 // A few global variables...
 
 // the OpenGL context
 var gl;
 
 // handle to a buffer on the GPU
 var vertexBuffer;
 var vertexNormalBuffer;
 
 // handle to the compiled shader program on the GPU
 var lightingShader;

 // A SimpleRotator object that lets the user rotate the view by mouse.
 var rotator;
 
 // transformation matrices defining 15 objects in the scene
 var torsoMatrix = new Matrix4().setTranslate(0, 0, 0);
 var shoulderMatrix = new Matrix4().setTranslate(6.5, 2, 0);
 var shoulder2Matrix = new Matrix4().setTranslate(-6.5, 2, 0);
 var armMatrix = new Matrix4().setTranslate(0, -5, 0);
 var arm2Matrix = new Matrix4().setTranslate(0, -5, 0);
 var handMatrix = new Matrix4().setTranslate(0, -4, 0);
 var hand2Matrix = new Matrix4().setTranslate(0, -4, 0);
 var thighMatrix = new Matrix4().setTranslate(2, -7.5, 0);
 var thigh2Matrix = new Matrix4().setTranslate(-2, -7.5, 0);
 var legMatrix = new Matrix4().setTranslate(0, -5, 0);
 var leg2Matrix = new Matrix4().setTranslate(0, -5, 0);
 var feetMatrix = new Matrix4().setTranslate(0, -3, 1.5);
 var headMatrix = new Matrix4().setTranslate(0, 7, 0);
 var eyeMatrix = new Matrix4().setTranslate(1, 0.5, 2);
 var eye2Matrix = new Matrix4().setTranslate(-1, 0.5, 2);
 
 var torsoAngle = 0.0;
 var shoulderAngle = 0.0;
 var shoulder2Angle = 0.0;
 var armAngle = 0.0;
 var handAngle = 0.0;
 var arm2Angle = 0.0;
 var hand2Angle = 0.0;
 var thighAngle = 0.0;
 var thigh2Angle = 0.0;
 var legAngle = 0.0;
 var leg2Angle = 0.0;
 var feetAngle = 0.0;
 var headAngle = 0.0;
 
 var torsoMatrixLocal = new Matrix4().setScale(10, 10, 5);
 var shoulderMatrixLocal = new Matrix4().setScale(3, 5, 2);
 var armMatrixLocal = new Matrix4().setScale(3, 5, 2);
 var handMatrixLocal = new Matrix4().setScale(1, 3, 3);
 var thighMatrixLocal = new Matrix4().setScale(3, 5, 3.5);
 var legMatrixLocal = new Matrix4().setScale(3, 5, 3.5);
 var feetMatrixLocal = new Matrix4().setScale(3, 1, 5);
 var headMatrixLocal = new Matrix4().setScale(4, 4, 4);
 var eyeMatrixLocal = new Matrix4().setScale(1, 1, 1);
 
 // view matrix
 // prettier-ignore
 var view = new Matrix4().setLookAt(
         20, 20, 20,   // eye
         0, 0, 0,      // at - looking at the origin
         0, 1, 0); // up vector - y axis
 
 // Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
 var projection = new Matrix4().setPerspective(45, 1.5, 0.1, 1000);
 
 /**
  * Translate keypress events to strings.
  * @param {KeyboardEvent} event key pressed.
  * @return {String | null}
  * @see http://javascript.info/tutorial/keyboard-events
  */
 function getChar(event) {
   if (event.which == null) {
     return String.fromCharCode(event.keyCode); // IE
   } else if (event.which != 0 && event.charCode != 0) {
     return String.fromCharCode(event.which); // the rest
   } else {
     return null; // special key
   }
 }
 
 /**
  * <p>Handler for key press events.</p>
  * Adjusts object rotations.
  * @param {KeyboardEvent} event key pressed.
  */
 function handleKeyPress(event) {
   var ch = getChar(event);
   switch (ch) {
     case "t":
       torsoAngle += 15;
       torsoMatrix.setTranslate(0, 0, 0).rotate(torsoAngle, 0, 1, 0);
       break;
     case "T":
       torsoAngle -= 15;
       torsoMatrix.setTranslate(0, 0, 0).rotate(torsoAngle, 0, 1, 0);
       break;
     case "s":
       shoulderAngle += 15;
       // rotate shoulder clockwise about a point 2 units above its center
       var currentShoulderRot = new Matrix4()
         .setTranslate(0, 2, 0)
         .rotate(-shoulderAngle, 1, 0, 0)
         .translate(0, -2, 0);
       shoulderMatrix.setTranslate(6.5, 2, 0).multiply(currentShoulderRot);
       break;
     case "S":
       shoulderAngle -= 15;
       // rotate shoulder clockwise about a point 2 units above its center
       var currentShoulderRot = new Matrix4()
         .setTranslate(0, 2, 0)
         .rotate(-shoulderAngle, 1, 0, 0)
         .translate(0, -2, 0);
       shoulderMatrix.setTranslate(6.5, 2, 0).multiply(currentShoulderRot);
       break;
     case "a":
       armAngle += 15;
       // rotate arm 1 clockwise about its top front corner
       var currentArm = new Matrix4()
         .setTranslate(0, 2.5, 1.0)
         .rotate(-armAngle, 1, 0, 0)
         .translate(0, -2.5, -1.0);
       armMatrix.setTranslate(0, -5, 0).multiply(currentArm);
       break;
     case "A":
       armAngle -= 15;
       // rotate arm 1 clockwise about its top front corner
       var currentArm = new Matrix4()
         .setTranslate(0, 2.5, 1.0)
         .rotate(-armAngle, 1, 0, 0)
         .translate(0, -2.5, -1.0);
       armMatrix.setTranslate(0, -5, 0).multiply(currentArm);
       break;
     case "h":
       handAngle += 15;
       handMatrix.setTranslate(0, -4, 0).rotate(handAngle, 0, 1, 0);
       break;
     case "H":
       handAngle -= 15;
       handMatrix.setTranslate(0, -4, 0).rotate(handAngle, 0, 1, 0);
       break;
     case "n":
       headAngle += 15;
       headMatrix.setTranslate(0, 7, 0).rotate(headAngle, 0, 1, 0);
       break;
     case "N":
       headAngle -= 15;
       headMatrix.setTranslate(0, 7, 0).rotate(headAngle, 0, 1, 0);
       break;
     case "d":
       shoulder2Angle += 15;
       // rotate shoulder 2 clockwise about a point 2 units above its center
       var currentShoulderRot = new Matrix4()
         .setTranslate(0, 2, 0)
         .rotate(-shoulder2Angle, 1, 0, 0)
         .translate(0, -2, 0);
       shoulder2Matrix.setTranslate(-6.5, 2, 0).multiply(currentShoulderRot);
       break;
     case "D":
       shoulder2Angle -= 15;
       // rotate shoulder 2 clockwise about a point 2 units above its center
       var currentShoulderRot = new Matrix4()
         .setTranslate(0, 2, 0)
         .rotate(-shoulder2Angle, 1, 0, 0)
         .translate(0, -2, 0);
       shoulder2Matrix.setTranslate(-6.5, 2, 0).multiply(currentShoulderRot);
       break;
     case "c":
       thighAngle += 15;
        // rotate shoulder clockwise about a point 2 units above its center
        var currentThighRot = new Matrix4()
          .setTranslate(0, 2, 0)
          .rotate(-thighAngle, 1, 0, 0)
          .translate(0, -2, 0);
        thighMatrix.setTranslate(2, -7.5, 0).multiply(currentThighRot);
        break;
     case "C":
       thighAngle -= 15;
        // rotate shoulder clockwise about a point 2 units above its center
        var currentThighRot = new Matrix4()
          .setTranslate(0, 2, 0)
          .rotate(-thighAngle, 1, 0, 0)
          .translate(0, -2, 0);
        thighMatrix.setTranslate(2, -7.5, 0).multiply(currentThighRot);
        break;
      case "m":
        thigh2Angle += 15;
        // rotate shoulder clockwise about a point 2 units above its center
        var currentThighRot = new Matrix4()
          .setTranslate(0, 2, 0)
          .rotate(-thigh2Angle, 1, 0, 0)
          .translate(0, -2, 0);
        thigh2Matrix.setTranslate(-2, -7.5, 0).multiply(currentThighRot);
        break;
      case "M":
       thigh2Angle -= 15;
        // rotate shoulder clockwise about a point 2 units above its center
        var currentThighRot = new Matrix4()
          .setTranslate(0, 2, 0)
          .rotate(-thigh2Angle, 1, 0, 0)
          .translate(0, -2, 0);
        thigh2Matrix.setTranslate(-2, -7.5, 0).multiply(currentThighRot);
        break;
      case "k":
        legAngle += 15;
        // rotate arm clockwise about its top front corner
        var currentLeg = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(legAngle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        legMatrix.setTranslate(0, -5, 0).multiply(currentLeg);
        break;
      case "K":
        legAngle -= 15;
        // rotate arm clockwise about its top front corner
        var currentLeg = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(legAngle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        legMatrix.setTranslate(0, -5, 0).multiply(currentLeg);
        break;
      case "f":
        arm2Angle += 15;
        // rotate arm 2 clockwise about its top front corner
        var currentArm = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(-arm2Angle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        arm2Matrix.setTranslate(0, -5, 0).multiply(currentArm);
        break;
      case "F":
       arm2Angle -= 15;
        // rotate arm 2 clockwise about its top front corner
        var currentArm = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(-arm2Angle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        arm2Matrix.setTranslate(0, -5, 0).multiply(currentArm);
        break;
      case "j":
        hand2Angle += 15;
        hand2Matrix.setTranslate(0, -4, 0).rotate(hand2Angle, 0, 1, 0);
        break;
      case "J":
        hand2Angle -= 15;
        hand2Matrix.setTranslate(0, -4, 0).rotate(hand2Angle, 0, 1, 0);
        break;
      case "l":
        leg2Angle += 15;
        // rotate arm clockwise about its top front corner
        var currentLeg = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(leg2Angle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        leg2Matrix.setTranslate(0, -5, 0).multiply(currentLeg);
        break;
      case "L":
        leg2Angle -= 15;
        // rotate arm clockwise about its top front corner
        var currentLeg = new Matrix4()
          .setTranslate(0, 2.5, 1.0)
          .rotate(leg2Angle, 1, 0, 0)
          .translate(0, -2.5, -1.0);
        leg2Matrix.setTranslate(0, -5, 0).multiply(currentLeg);
        break;
      default:
        return;
   }
 }
 
 /**
  * <p>Helper function.</p>
  * Renders the cube based on the model transformation
  * on top of the stack and the given local transformation.
  * @param {Matrix4} matrixStack matrix on top of the stack;
  * @param {Matrix4} matrixLocal local transformation.
  */
 function renderCube(matrixStack, matrixLocal) {
   // bind the shader
   gl.useProgram(lightingShader);
 
   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(lightingShader, "a_Position");
   if (positionIndex < 0) {
     console.log("Failed to get the storage location of a_Position");
     return;
   }
 
   var normalIndex = gl.getAttribLocation(lightingShader, "a_Normal");
   if (normalIndex < 0) {
     console.log("Failed to get the storage location of a_Normal");
     return;
   }
 
   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(normalIndex);
 
   // bind data for points and normals
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
 
   var loc = gl.getUniformLocation(lightingShader, "view");
   gl.uniformMatrix4fv(loc, false, view.elements);
   loc = gl.getUniformLocation(lightingShader, "projection");
   gl.uniformMatrix4fv(loc, false, projection.elements);
   loc = gl.getUniformLocation(lightingShader, "u_Color");
   gl.uniform4f(loc, 0.0, 0.8, 0.7, 1.0);
   var loc = gl.getUniformLocation(lightingShader, "lightPosition");
   gl.uniform4f(loc, 5.0, 5.0, 10.0, 1.0);
 
   var modelMatrixloc = gl.getUniformLocation(lightingShader, "model");
   var normalMatrixLoc = gl.getUniformLocation(lightingShader, "normalMatrix");

   // transform using current model matrix on top of stack
   var current = new Matrix4(matrixStack.top()).multiply(matrixLocal);
   gl.uniformMatrix4fv(modelMatrixloc, false, current.elements);
   gl.uniformMatrix3fv(
     normalMatrixLoc,
     false,
     makeNormalMatrixElements(current, view)
   );
 
   gl.drawArrays(gl.TRIANGLES, 0, 36);
 
   // on safari 10, buffer cannot be disposed before drawing...
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   gl.useProgram(null);
 }
 
 /** Code to actually render our geometry. */
 function draw() {
   // clear the framebuffer
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

   view.elements = rotator.getViewMatrix();
   rotator.setViewDistance(45);
 
   // set up the matrix stack
   var s = new Stack();
   s.push(torsoMatrix);
   renderCube(s, torsoMatrixLocal);
 
   // shoulder 1 relative to torso
   s.push(new Matrix4(s.top()).multiply(shoulderMatrix));
   renderCube(s, shoulderMatrixLocal);
 
   // arm 1 relative to shoulder 1
   s.push(new Matrix4(s.top()).multiply(armMatrix));
   renderCube(s, armMatrixLocal);
 
   // hand 1 relative to arm 1
   s.push(new Matrix4(s.top()).multiply(handMatrix));
   renderCube(s, handMatrixLocal);
   s.pop();
   s.pop();
   s.pop();

   // shoulder 2 relative to torso
   s.push(new Matrix4(s.top()).multiply(shoulder2Matrix));
   renderCube(s, shoulderMatrixLocal);

   // arm 2 relative to shoulder 2
   s.push(new Matrix4(s.top()).multiply(arm2Matrix));
   renderCube(s, armMatrixLocal);

   // hand 2 relative to arm 2
   s.push(new Matrix4(s.top()).multiply(hand2Matrix));
   renderCube(s, handMatrixLocal);
   s.pop();
   s.pop();
   s.pop();

   // thigh 1 relative to torso
   s.push(new Matrix4(s.top()).multiply(thighMatrix));
   renderCube(s, thighMatrixLocal);

   // leg 1 relative to thigh 1
   s.push(new Matrix4(s.top()).multiply(legMatrix));
   renderCube(s, legMatrixLocal);

   // foot 1 relative to leg 1
   s.push(new Matrix4(s.top()).multiply(feetMatrix));
   renderCube(s, feetMatrixLocal);
   s.pop();
   s.pop();
   s.pop();

   // thigh 2 relative to torso
   s.push(new Matrix4(s.top()).multiply(thigh2Matrix));
   renderCube(s, thighMatrixLocal);

   // leg 2 relative to thigh 2
   s.push(new Matrix4(s.top()).multiply(leg2Matrix));
   renderCube(s, legMatrixLocal);

   // foot 2 relative to leg 2
   s.push(new Matrix4(s.top()).multiply(feetMatrix));
   renderCube(s, feetMatrixLocal);
   s.pop();
   s.pop();
   s.pop();

   // head relative to torso
   s.push(new Matrix4(s.top()).multiply(headMatrix));
   renderCube(s, headMatrixLocal);

   // eye 1 relative to head
   s.push(new Matrix4(s.top()).multiply(eyeMatrix));
   renderCube(s, eyeMatrixLocal);
   s.pop();

   // eye 2 relative to head
   s.push(new Matrix4(s.top()).multiply(eye2Matrix));
   renderCube(s, eyeMatrixLocal);
   s.pop();
   s.pop();
   s.pop();
 
   if (!s.isEmpty()) {
     console.log("Warning: pops do not match pushes");
   }
 }
 
 /**
  * <p>Entry point when page is loaded.</p>
  *
  * Basically this function does setup that "should" only have to be done once,<br>
  * while draw() does things that have to be repeated each time the canvas is
  * redrawn.
  * @function
  * @memberof Window
  * @name anonymous_load
  * @global
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
  */
 window.addEventListener("load", (event) => {
   // retrieve <canvas> element
   var canvas = document.getElementById("theCanvas");
 
   // key handler
   window.onkeypress = handleKeyPress;
 
   // get the rendering context for WebGL, using the utility from the teal book
   gl = getWebGLContext(canvas);
   if (!gl) {
     console.log("Failed to get the rendering context for WebGL");
     return;
   }
 
   // load and compile the shader pair, using utility from the teal book
   var vshaderSource = document.getElementById(
     "vertexLightingShader"
   ).textContent;
   var fshaderSource = document.getElementById(
     "fragmentLightingShader"
   ).textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
     console.log("Failed to intialize shaders.");
     return;
   }
   lightingShader = gl.program;
   gl.useProgram(null);
 
   // buffer for vertex positions for triangles
   vertexBuffer = gl.createBuffer();
   if (!vertexBuffer) {
     console.log("Failed to create the buffer object");
     return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
 
   // buffer for vertex normals
   vertexNormalBuffer = gl.createBuffer();
   if (!vertexNormalBuffer) {
     console.log("Failed to create the buffer object");
     return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
 
   // buffer is not needed anymore (not necessary, really)
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
   // specify a fill color for clearing the framebuffer
   gl.clearColor(0.9, 0.9, 0.9, 1.0);
 
   gl.enable(gl.DEPTH_TEST); 

   rotator = new SimpleRotator(canvas);
 
   // define an animation loop
   var animate = function () {
     draw();
     requestAnimationFrame(animate, canvas);
   };
 
   // start drawing!
   animate();
 });
