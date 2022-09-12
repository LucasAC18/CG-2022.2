let w;                                                                              //canvas width
let h;                                                                              //canvas height
let cindex;                                                                         //index of current array relative to corner
let modelMatrix;                                                                    //model transformation matrix

let vertices = [new DOMPoint(-0.5,-0.5),
                new DOMPoint(0.5,-0.5),
                new DOMPoint(0.5,0.5),
                new DOMPoint(-0.5,0.5)];                                            //vertices corners (DOMPoint for each corner of the square)

let numPoints = vertices.length;                                                    //number of vertices
let colors = ["red", "green", "blue", "white"]                                      //array of colors

//function to map the [x,y] coordinates of a given point to the viewport coordinates
function mapToViewport(x, y, n = 5) {
    return [((x + n / 2) * w) / n, ((-y + n / 2) * h) / n];
}

//return the [x,y] coordinates of a given vertex i
function getVertex(i) {
    return [vertices[i].x, vertices[i].y];
}

//rotate the square about a given corner at a certain angle
function rotateAboutCorner(ang, x, y) {   
    modelMatrix = new DOMMatrix();
    mat1 = modelMatrix.translate(-x,-y);
    mat2 = modelMatrix.rotate(0,0,ang);
    mat3 = mat1.inverse();
    
    for (let i = 0; i < numPoints; i++) {
        vertices[i] = mat1.transformPoint(vertices[i]);
        vertices[i] = mat2.transformPoint(vertices[i]);
        vertices[i] = mat3.transformPoint(vertices[i]);
    }
}

//function to draw the square and background
function draw(ctx) {

    //draw background
    ctx.fillStyle = "rgba(35, 56, 117, 1)";
    ctx.rect(0, 0, w, h);
    ctx.fill();

    //draw square
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
        let [x, y] = mapToViewport(...getVertex(i).map((x) => x));
        if (i == 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    //color the square based on the current pivot corner
    ctx.fillStyle = colors[cindex];
    ctx.fill();

    //draw colored circles in the corners of the square
    for (let i = 0; i < numPoints; i++) {
        ctx.beginPath();
        let [x, y] = mapToViewport(...getVertex(i).map((x) => x));
        ctx.moveTo(x, y);
        ctx.arc(x, y, 5, 0, 2*Math.PI);
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.closePath();
    }
}

//handles the key presses and changes the pivot corner based on the key pressed
window.onkeydown = function (event) {
    if (event.key === "r") {
        cindex = 0;
    }
    else if (event.key === "g") {
        cindex = 1;
    }
    else if (event.key === "b") {
        cindex = 2;
    }
    else if (event.key === "w") {
        cindex = 3;
    }
}

function mainEntrance() {
    let canvasElement = document.querySelector("#theCanvas");
    let ctx = canvasElement.getContext("2d")

    w = canvasElement.width;
    h = canvasElement.height;
    cindex = 0;

    let runanimation = (() => {
        var ang = 2; 

        return () => {
            draw(ctx);
            var [x, y] = getVertex(cindex);
            rotateAboutCorner(ang, x, y);

            requestAnimationFrame(runanimation);
        };
    })();

    runanimation();
}