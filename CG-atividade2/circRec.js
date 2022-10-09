let vec2d = (function () {
  
  let glvec2 = Object.assign({}, vec2);
  let glmat3 = mat3;

  glvec2.orient = function (a, b, c) {
    return Math.sign(
      glmat3.determinant([1, a[0], a[1], 1, b[0], b[1], 1, c[0], c[1]])
    );
  };

  glvec2.segmentsIntersect = function (a, b, c, d) {
    return (
      glvec2.orient(a, b, c) != glvec2.orient(a, b, d) &&
      glvec2.orient(c, d, a) != glvec2.orient(c, d, b)
    );
  };

  glvec2.lineIntersection = function (
    out,
    [x1, y1],
    [x2, y2],
    [x3, y3],
    [x4, y4]
  ) {
    const D = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const a = x1 * y2 - y1 * x2,
      b = x3 * y4 - y3 * x4;

    out[0] = (a * (x3 - x4) - (x1 - x2) * b) / D;
    out[1] = (a * (y3 - y4) - (y1 - y2) * b) / D;
    return out;
  };
  return glvec2;
})();
 

function fillCanvas(ctx, w, h) {
  ctx.fillStyle = "antiquewhite";
  ctx.strokeStyle = "brown";
  ctx.lineWidth = 10;
  // clear canvas.
  ctx.fillRect(0, 0, w, h);
  // draw canvas border.
  ctx.strokeRect(0, 0, w, h);
  ctx.lineWidth = 1;
}


function convexPolysIntersect(poly, poly2) {
  let ptsInPoly = 0;
  let ptsInPoly2 = 0;
  
  for (let i = 0 ; i < poly.length-1 ; i++)
  {
    if (pointInConvexPoly(poly[i], poly2)) {
      ptsInPoly2++
    }
    if (pointInConvexPoly(poly2[i], poly)) {
      ptsInPoly++ 
    }
  }

  for (let i = 0; i <= poly.length-1; i++) {
    for (let ii = 0; ii <= poly2.length-1; ii++) {
      if (segmentsIntersect(poly[i],poly[(i+1)%poly.length],poly2[ii],poly2[(ii+1)%poly2.length])) {
        return true;
      }
    }
  } 

  if (ptsInPoly == poly.length-1 || ptsInPoly2 == poly.length-1) {
    return true;
  }

  return false;
}
 

function convexPolyCircleIntersect(poly, circle, radius) {
  let shortestDistance = Number.MAX_VALUE;

  for (let i = 0; i <= poly.length-1; i++)  {
    if (i == poly.length-1) {
      let dist = distToSegment( circle.center, poly[i], poly[0]);
      if (dist <= shortestDistance) {shortestDistance = dist;}
    }
    else {
      let dist = distToSegment( circle.center, poly[i], poly[i+1]);
      if (dist <= shortestDistance) {shortestDistance = dist;}
    }
  }

  console.log(radius, shortestDistance)
  if (radius >= shortestDistance) {
    return true;
  }
  else if (pointInConvexPoly(circle.center, poly) && pointInConvexPoly(circle.u, poly)) {
    return true;
  }

  return false;
}
 

function circleCircleIntersect(center1, radius1, center2, radius2) {
  if (radius1 + radius2 >= dist(center1, center2)) {
    return true;
  }
}
 

function makeRectangle({center, u, size}) {
  // create a 90 degree rotation matrix 
  let model = mat3.create();
  model = mat3.rotate([], model, -90*(Math.PI/180));

  // calculate the midway points oposite sides of the rectangle based on vector u
  const midway1 = u;
  const midway2 = vec2d.add([], center, vec2d.sub([], center, u));

  // create a vector perpendicular to the vector "u" with length {size/2}
  let aux_vect = vec2d.sub([], midway1, center);
  vec2d.normalize(aux_vect, aux_vect);
  vec2d.transformMat3(aux_vect, aux_vect, model);
  vec2d.scale(aux_vect, aux_vect, size/2);
  vec2d.add(aux_vect, center, aux_vect);

  // calculate the position for the vertex of the rectangle
  const vertex1 = vec2d.add([], midway1, vec2d.sub([], aux_vect, center));
  const vertex2 = vec2d.add([], midway2, vec2d.sub([], aux_vect, center));
  const vertex3 = vec2d.sub([], midway2, vec2d.sub([], aux_vect, center));
  const vertex4 = vec2d.sub([], midway1, vec2d.sub([], aux_vect, center));

  return [
    vertex1,
    vertex2,
    vertex3,
    vertex4
  ];
}


function isosceles({ basePoint, oppositeVertex }) {
  const u = vec2d.sub([], basePoint, oppositeVertex);
  const v = [-u[1], u[0]];
  const w = [u[1], -u[0]];
  return [
    oppositeVertex,
    vec2d.add([], basePoint, v),
    vec2d.add([], basePoint, w),
  ];
}


function midPoints(poly) {
  pointList = [];
  for (let i = 0; i <= poly.length-2; i++) {
    point = vec2d.add([], poly[i], poly[i+1]);
    vec2d.scale(point, point, 1/2);
    pointList.push(point);
  }

  // Adding the last midway point
  point = vec2d.add([], poly[poly.length-1], poly[0]);
  vec2d.scale(point, point, 1/2);
  pointList.push(point);

  return pointList;
}


// Returns the position of the closests vertex of poly to the vector u
function getClosestVertex(u, poly) {
  let least = dist(u, poly[1]);
  let closest = poly[1];
  for (let vert = 2; vert <= poly.length-1; vert++) {
    if (dist(u, poly[vert]) < least) {
      least = dist(u, poly[vert])
      closest = poly[vert]
    }
  }

  return closest;
}


// ============================================================ALL DEMO============================================================
(function allDemo() {
  const demo = document.querySelector("#theCanvas");
  const ctx = demo.getContext("2d");
  let [w, h] = [demo.clientWidth, demo.clientHeight];
  const rect = [
    { center: [100, 100], u: [100, 50], size: 50, color: "black" },
    { center: [100, 250], u: [100, 200], size: 75, color: "black" },
    { center: [100, 400], u: [100, 350], size: 100, color: "black" }
  ];
  const circ = [
    { center: [250, 100], u: [250, 50], color: "black" },
    { center: [250, 250], u: [250, 200], color: "black" },
    { center: [250, 400], u: [250, 350], color: "black" }
  ];
  const iso = [
    { basePoint: [400, 100], oppositeVertex: [400, 70], color: "black" },
    { basePoint: [400, 250], oppositeVertex: [400, 180], color: "black" },
    { basePoint: [400, 400], oppositeVertex: [400, 310], color: "black" },
  ];

  function makePts() {
    for (let t of rect) {
      t.poly = makeRectangle(t);
      t.anchors = midPoints(t.poly);
      t.anchors.unshift(t.center);
    }
    for (let t of circ) {
      t.anchors = [t.center, t.u];
    }
    for (let t of iso) {
      t.poly = isosceles(t);
      t.anchors = [t.basePoint, t.oppositeVertex];
    }
  }

  makePts();
  let sel = null;
  let prevMouse = null;

  const update = () => {
    fillCanvas(ctx, w, h);

    for (let r of rect) {
      r.color = "black";
    }
    for (let c of circ) {
      c.color = "black";
    }
    for (let t of iso) {
      t.color = "black";
    }

    for (let t1 of rect) {

      // rect âˆ© rect
      for (let t2 of rect) {
        if (t1 == t2) continue;
        let intersect = convexPolysIntersect(t1.poly, t2.poly);
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }

      // rect âˆ© circle
      for (let t2 of circ) {
        if (t1 == t2) continue;
        let intersect = convexPolyCircleIntersect(t1.poly, t2, dist(t2.center, t2.u));
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }

      // rect âˆ© triangle
      for (let t2 of iso) {
        if (t1 == t2) continue;
        let intersect = convexPolysIntersect(t1.poly, t2.poly);
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    for (let t1 of circ) {
      
      // circle âˆ© circle
      for (let t2 of circ) {
        if (t1 == t2) continue;
        let intersect = circleCircleIntersect(t1.center, dist(t1.center, t1.u), t2.center, dist(t2.center, t2.u));
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }

      // circle âˆ© triangle
      for (let t2 of iso) {
        if (t1 == t2) continue;
        let intersect = convexPolyCircleIntersect(t2.poly, t1, dist(t1.center, t1.u));
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    for (let t1 of iso) {
      
      // tri âˆ© tri
      for (let t2 of iso) {
        if (t1 == t2) continue;
        let intersect = convexPolysIntersect(t1.poly, t2.poly);
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    // draw rectangles
    for (let t of rect) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      for (let p of t.poly) {
        ctx.lineTo(...p);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // draw circles
    for (let t of circ) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(t.center[0], t.center[1], dist(t.center, t.u), 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();
    }

    // draw triangles
    for (let t of iso) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      for (let p of t.poly) {
        ctx.lineTo(...p);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };
  update();

  // controls forms movement with mouse
  demo.onmousemove = (e) => {
    if (sel) {
      let mouse = [e.offsetX, e.offsetY];
      let [pol, ianchor] = sel;
      let delta = vec2d.sub([], mouse, prevMouse);
      prevMouse = mouse;

      switch (type) {
        case ("rect"):
          if (ianchor == 0) {
            let v = vec2d.sub([], pol.u, pol.center);
            vec2d.add(pol.center, pol.center, delta);
            vec2d.add(pol.u, pol.center, v);
          } else {
            vec2d.add(pol.u, pol.u, delta);
          }
          break;

        case ("circ"):
          if (ianchor == 0) {
            let v = vec2d.sub([], pol.u, pol.center);
            vec2d.add(pol.center, pol.center, delta);
            vec2d.add(pol.u, pol.center, v);
          } else {
            vec2d.add(pol.u, pol.u, delta);
          }
          break;

        case ("iso"):
          if (ianchor == 0) {
            let v = vec2d.sub([], pol.oppositeVertex, pol.basePoint);
            vec2d.add(pol.basePoint, pol.basePoint, delta);
            vec2d.add(pol.oppositeVertex, pol.basePoint, v);
          } else {
            vec2d.add(pol.oppositeVertex, pol.oppositeVertex, delta);
          }
          break;

        default:
      }

      makePts();
      update();
    }
  };

  demo.onmousedown = (e) => {
    sel = null;
    type = null;
    const mouse = [e.offsetX, e.offsetY];
    prevMouse = mouse;

    for (let pol of rect) {
      for (let [ianchor, p] of pol.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [pol, ianchor];
          type = "rect";
          if (ianchor != 0) {
            pol.u = pol.anchors[ianchor];
            pol.size = 2*dist(pol.anchors[ianchor], getClosestVertex(pol.anchors[ianchor], pol.poly));
          }
        }
      }
    }

    for (let c of circ) {
      for (let [ianchor, p] of c.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [c, ianchor];
          type = "circ";
        }
      }
    }

    for (let tri of iso) {
      for (let [ianchor, p] of tri.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [tri, ianchor];
          type = "iso";
        }
      }
    }
  };

  demo.onmouseup = () => {
    sel = null;
    type = null;
  };
  update();
})();


// ============================================================CIRCLE DEMO============================================================
(function circDemo() {
  const demo = document.querySelector("#theCanvas1");
  const ctx = demo.getContext("2d");
  let [w, h] = [demo.clientWidth, demo.clientHeight];
  const circ = [
    { center: [110, 200], u: [140, 100], color: "black" },
    { center: [320, 220], u: [340, 260], color: "black" },
    { center: [250, 320], u: [240, 310], color: "black" }
  ];

  function makePts() {
    for (let t of circ) {
      t.anchors = [t.center, t.u];
    }
  }

  makePts();
  let sel = null;
  let prevMouse = null;

  const update = () => {
    fillCanvas(ctx, w, h);

    // circle âˆ© circle
    for (let t1 of circ) {
      t1.color = "black";
      for (let t2 of circ) {
        if (t1 == t2) continue;
        let intersect = circleCircleIntersect(t1.center, dist(t1.center, t1.u), t2.center, dist(t2.center, t2.u));
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    for (let t of circ) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(t.center[0], t.center[1], dist(t.center, t.u), 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();
    }
  };
  update();

  demo.onmousemove = (e) => {
    if (sel) {
      let mouse = [e.offsetX, e.offsetY];
      let [c, ianchor] = sel;
      let delta = vec2d.sub([], mouse, prevMouse);
      prevMouse = mouse;
      if (ianchor == 0) {
        let v = vec2d.sub([], c.u, c.center);
        vec2d.add(c.center, c.center, delta);
        vec2d.add(c.u, c.center, v);
      } else {
        vec2d.add(c.u, c.u, delta);
      }
      makePts();
      update();
    }
  };

  demo.onmousedown = (e) => {
    sel = null;
    const mouse = [e.offsetX, e.offsetY];
    prevMouse = mouse;
    for (let c of circ) {
      for (let [ianchor, p] of c.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [c, ianchor];
        }
      }
    }
  };

  demo.onmouseup = () => {
    sel = null;
  };
  update();
})();


// ============================================================RECT DEMO============================================================
(function rectDemo() {
  const demo = document.querySelector("#theCanvas2");
  const ctx = demo.getContext("2d");
  let [w, h] = [demo.clientWidth, demo.clientHeight];
  const rect = [
    { center: [100, 90], u: [130, 130], size: 100, color: "black" },
    { center: [240, 200], u: [180, 300], size: 100, color: "black" },
    { center: [340, 400], u: [280, 410], size: 50, color: "black" }
  ];

  function makePts() {
    for (let t of rect) {
      t.poly = makeRectangle(t);
      t.anchors = midPoints(t.poly);
      t.anchors.unshift(t.center);
    }
  }

  makePts();
  let sel = null;
  let prevMouse = null;

  const update = () => {
    fillCanvas(ctx, w, h);

    // rect âˆ© rect
    for (let t1 of rect) {
      t1.color = "black";
      for (let t2 of rect) {
        if (t1 == t2) continue;
        let intersect = convexPolysIntersect(t1.poly, t2.poly);
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    for (let t of rect) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      for (let p of t.poly) {
        ctx.lineTo(...p);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };
  update();

  demo.onmousemove = (e) => {
    if (sel) {
      let mouse = [e.offsetX, e.offsetY];
      let [pol, ianchor] = sel;
      let delta = vec2d.sub([], mouse, prevMouse);
      prevMouse = mouse;
      if (ianchor == 0) {
        let v = vec2d.sub([], pol.u, pol.center);
        vec2d.add(pol.center, pol.center, delta);
        vec2d.add(pol.u, pol.center, v);
      } else {
        vec2d.add(pol.u, pol.u, delta);
      }
      makePts();
      update();
    }
  };

  demo.onmousedown = (e) => {
    sel = null;
    const mouse = [e.offsetX, e.offsetY];
    prevMouse = mouse;
    for (let pol of rect) {
      for (let [ianchor, p] of pol.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [pol, ianchor];
          if (ianchor != 0) {
            pol.u = pol.anchors[ianchor];
            pol.size = 2*dist(pol.anchors[ianchor], getClosestVertex(pol.anchors[ianchor], pol.poly));
          }
        }
      }
    }
  };

  demo.onmouseup = () => {
    sel = null;
  };
  update();
})();


// ============================================================ISOSCELES DEMO============================================================
(function isoscelesDemo() {
  const demo = document.querySelector("#theCanvas3");
  const ctx = demo.getContext("2d");
  let [w, h] = [demo.clientWidth, demo.clientHeight];
  const iso = [
    { basePoint: [270, 350], oppositeVertex: [300, 200], color: "black" },
    { basePoint: [100, 50], oppositeVertex: [50, 20], color: "black" },
    { basePoint: [250, 150], oppositeVertex: [150, 100], color: "black" },
  ];

  function makePts() {
    for (let t of iso) {
      t.poly = isosceles(t);
      t.anchors = [t.basePoint, t.oppositeVertex];
    }
  }

  makePts();
  let sel = null;
  let prevMouse = null;

  const update = () => {
    fillCanvas(ctx, w, h);

    // tri âˆ© tri
    for (let t1 of iso) {
      t1.color = "black";
      for (let t2 of iso) {
        if (t1 == t2) continue;
        let intersect = convexPolysIntersect(t1.poly, t2.poly);
        if (intersect) {
          t1.color = "red";
          t2.color = "red";
        }
      }
    }

    for (let t of iso) {
      ctx.fillStyle = ctx.strokeStyle = t.color;
      for (let p of t.anchors) {
        ctx.beginPath();
        ctx.arc(...p, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      for (let p of t.poly) {
        ctx.lineTo(...p);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };
  update();

  demo.onmousemove = (e) => {
    if (sel) {
      let mouse = [e.offsetX, e.offsetY];
      let [tri, ianchor] = sel;
      let delta = vec2d.sub([], mouse, prevMouse);
      prevMouse = mouse;
      if (ianchor == 0) {
        let v = vec2d.sub([], tri.oppositeVertex, tri.basePoint);
        vec2d.add(tri.basePoint, tri.basePoint, delta);
        vec2d.add(tri.oppositeVertex, tri.basePoint, v);
      } else {
        vec2d.add(tri.oppositeVertex, tri.oppositeVertex, delta);
      }
      makePts();
      update();
    }
  };

  demo.onmousedown = (e) => {
    sel = null;
    const mouse = [e.offsetX, e.offsetY];
    prevMouse = mouse;
    for (let tri of iso) {
      for (let [ianchor, p] of tri.anchors.entries()) {
        if (vec2d.distance(mouse, p) <= 5) {
          sel = [tri, ianchor];
        }
      }
    }
  };

  demo.onmouseup = () => {
    sel = null;
  };
  update();
})();
