/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */

"use strict";
console.clear();

var LIB = {
  VERSION: "3.00",
  CSS: "color: #EFE",
  log: function () {
    console.log(`%cPrototype LIB ${LIB.VERSION} loaded`, LIB.CSS);
  }
};

/*
Prototype and helpful functions library
as used by LS

changelog:
3.00: new fresh version
*/

(function () {
  function RND(start, end) {
    return Math.floor(Math.random() * (++end - start) + start);
  }

  function coinFlip() {
    let flip = RND(0, 1);
    if (flip) return true;
    return false;
  }
  function randomSign() {
    if (coinFlip()) return 1;
    else return -1;
  }
  function probable(x) {
    let flip = RND(0, 100);
    if (flip <= x) return true;
    return false;
  }
  function round10(x) {
    return Math.round(x / 10) * 10;
  }
  function weightedRnd(_json) {
    let json = $.extend(true, {}, _json);
    normalize(json);
    let rnd = Math.random();
    for (const c in json) {
      if (rnd < json[c]) return c;
    }
    return null;

    function normalize(json) {
      let sum = 0;
      for (const c in json) {
        sum += json[c];
      }
      let curr = 0;
      for (const c in json) {
        json[c] /= sum;
        json[c] = json[c] + curr;
        curr = json[c];
      }
    }
  }
  window.RND = RND;
  window.coinFlip = coinFlip;
  window.probable = probable;
  window.round10 = round10;
  window.randomSign = randomSign;
  window.weightedRnd = weightedRnd;
})();

// Converts from degrees to radians.
Math.radians = function (degrees) {
  return (degrees * Math.PI) / 180;
};
// Converts from radians to degrees.
Math.degrees = function (radians) {
  return (radians * 180) / Math.PI;
};

CanvasRenderingContext2D.prototype.pixelAt = function (x, y, size) {
  size = size || 1; // default
  this.fillRect(x, y, size, size);
};
CanvasRenderingContext2D.prototype.pixelAtPoint = function (point, size) {
  size = size || 1; // default
  this.fillRect(point.x, point.y, size, size);
};
CanvasRenderingContext2D.prototype.roundRect = function (
  x,
  y,
  width,
  height,
  radius,
  fill,
  stroke
) {
  var cornerRadius = {
    upperLeft: 0,
    upperRight: 0,
    lowerLeft: 0,
    lowerRight: 0
  };
  if (typeof stroke == "undefined") {
    stroke = true;
  }
  if (typeof radius === "object") {
    for (let side in radius) {
      cornerRadius[side] = radius[side];
    }
  }
  this.beginPath();
  this.moveTo(x + cornerRadius.upperLeft, y);
  this.lineTo(x + width - cornerRadius.upperRight, y);
  this.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
  this.lineTo(x + width, y + height - cornerRadius.lowerRight);
  this.quadraticCurveTo(
    x + width,
    y + height,
    x + width - cornerRadius.lowerRight,
    y + height
  );
  this.lineTo(x + cornerRadius.lowerLeft, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
  this.lineTo(x, y + cornerRadius.upperLeft);
  this.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
  this.closePath();
  if (stroke) {
    this.stroke();
  }
  if (fill) {
    this.fill();
  }
};

/* collection of prototypes LS */

Array.prototype.clear = function () {
  if (!this) return false;
  this.splice(0, this.length);
};
Array.prototype.swap = function (x, y) {
  let TMP = this[x];
  this[x] = this[y];
  this[y] = TMP;
};
Array.prototype.shuffle = function () {
  var i = this.length,
    j;
  while (--i > 0) {
    j = RND(0, i);
    this.swap(i, j);
  }
  return this;
};
Array.prototype.sum = function () {
  return this.reduce((a, b) => a + b, 0);
};
Array.prototype.average = function () {
  return this.reduce((a, b) => a + b) / this.length;
};
Array.prototype.createPool = function (mx, N) {
  if (!this) return false;
  this.clear();
  var tempArray = [];
  for (var ix = 0; ix < mx; ix++) {
    tempArray[ix] = ix;
  }
  var top;
  for (var iy = 0; iy < N; iy++) {
    top = tempArray.length;
    var addx = RND(0, top - 1);
    this[iy] = tempArray[addx];
    tempArray.splice(addx, 1);
  }
  return this;
};
Array.prototype.compare = function (array) {
  if (!array) return false;
  var LN = this.length;
  if (LN !== array.length) return false;
  for (var x = 0; x < LN; x++) {
    if (this[x] !== array[x]) return false;
  }
  return true;
};
Array.prototype.remove = function (value) {
  var LN = this.length;
  for (var x = 0; x < LN; x++) {
    if (this[x] === value) {
      this.splice(x, 1);
      this.remove(value);
    }
  }
};
Array.prototype.chooseRandom = function () {
  let LN = this.length;
  let choose = RND(1, LN) - 1;
  return this[choose];
};
Array.prototype.removeRandom = function () {
  let LN = this.length;
  let choose = RND(1, LN) - 1;
  return this.splice(choose, 1)[0];
};
Array.prototype.removeRandomPool = function (N) {
  let LN = this.length;
  if (N >= LN) {
    let temp = this.clone();
    this.clear();
    return temp;
  }
  if (N <= 0) return [];
  let temp = [];
  do {
    temp.push(this.removeRandom());
    N--;
  } while (N > 0);
  return temp;
};
Array.prototype.clone = function () {
  return [].concat(this);
};
Array.prototype.sortByPropAsc = function (prop) {
  this.sort(sort);

  function sort(a, b) {
    return a[prop] - b[prop];
  }
};
Array.prototype.sortByPropDesc = function (prop) {
  this.sort(sort);

  function sort(a, b) {
    return b[prop] - a[prop];
  }
};
Array.prototype.last = function () {
  if (this.length === 0) return null;
  return this[this.length - 1];
};
Array.prototype.fromBack = function (idx) {
  return this[this.length - idx];
};
Array.prototype.unique = function () {
  let set = new Set(this);
  return [...set];
};

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};
String.prototype.trimSpace = function () {
  let temp = this.split(" ");
  temp.remove("");
  return temp.join(" ");
};
String.prototype.changeChar = function (at, char) {
  let LN = this.length - 1;
  if (at > LN || at < 0) return -1;
  const p1 = this.slice(0, at);
  const p2 = this.slice(at + 1, ++LN);
  return [p1, char, p2].join("");
};
String.prototype.splitByN = function (N) {
  let result = [];
  for (let i = 0, LN = this.length; i < LN; i += N) {
    result.push(this.substr(i, N));
  }
  return result;
};

class Grid {
  constructor(x = 0, y = 0) {
    this.x = parseInt(x, 10);
    this.y = parseInt(y, 10);
  }
  static toClass(grid) {
    return new Grid(grid.x, grid.y);
  }
  static toCenter(grid) {
    return new FP_Grid(grid.x + 0.5, grid.y + 0.5);
  }
  add(vector, mul = 1) {
    return new Grid(this.x + vector.x * mul, this.y + vector.y * mul);
  }
  isInAt(dirArray) {
    for (let q = 0; q < dirArray.length; q++) {
      if (this.x === dirArray[q].x && this.y === dirArray[q].y) {
        return q;
      }
    }
    return -1;
  }
  direction(vector) {
    var dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
    var dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
    return new Vector(dx, dy);
  }
  absDirection(vector) {
    let dx = vector.x - this.x;
    let dy = vector.y - this.y;
    return new Vector(dx, dy);
  }
  same(vector) {
    if (this.x === vector.x && this.y === vector.y) {
      return true;
    } else return false;
  }
  distance(vector) {
    let distance = Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
    return distance;
  }
  distanceDiagonal(vector) {
    let distance = (this.x - vector.x) ** 2 + (this.y - vector.y) ** 2;
    distance = Math.floor(Math.sqrt(distance));
    return distance;
  }
  directionSolutions(vector) {
    let solutions = [];
    let dir = this.direction(vector);
    let absDir = this.absDirection(vector);
    let split = dir.ortoSplit();
    solutions.push(new Direction(split[0], Math.abs(absDir.x)));
    solutions.push(new Direction(split[1], Math.abs(absDir.y)));
    //SORT!!
    if (solutions[0].len < solutions[1].len) solutions.swap(0, 1); //check
    return solutions;
  }
  reflect(C) {
    let x;
    let y;
    if (C.x !== 0) {
      x = 2 * C.x - this.x;
    } else x = this.x;
    if (C.y !== 0) {
      y = 2 * C.y - this.y;
    } else y = this.y;
    return new Grid(x, y);
  }
  EuclidianDistance(grid) {
    return Math.hypot(this.x - grid.x, this.y - grid.y);
  }
}
class FP_Grid {
  constructor(x = 0, y = 0) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
  }
  static toClass(grid) {
    return new FP_Grid(grid.x, grid.y);
  }
  toPoint(GS = ENGINE.INI.GRIDPIX) {
    let x = Math.round(this.x * GS);
    let y = Math.round(this.y * GS);
    return new Point(x, y);
  }
  translate(vector, length = 1) {
    let x = this.x + vector.x * length;
    let y = this.y + vector.y * length;
    return new FP_Grid(x, y);
  }
  EuclidianDistance(grid) {
    return Math.hypot(this.x - grid.x, this.y - grid.y);
  }
  direction(grid) {
    let dx = grid.x - this.x;
    let dy = grid.y - this.y;
    let D = this.EuclidianDistance(grid);
    return new FP_Vector(dx / D, dy / D);
  }
  add(vector) {
    return new FP_Grid(this.x + vector.x, this.y + vector.y);
  }
  sub(grid) {
    return new FP_Grid(this.x - grid.x, this.y - grid.y);
  }
}
class FP_Vector {
  constructor(x = 0, y = 0) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
  }
  static toClass(vector) {
    return new FP_Vector(vector.x, vector.y);
  }
  normalize() {
    return new Vector(this.x / Math.abs(this.x), this.y / Math.abs(this.y));
  }
  rotate(rad) {
    let COS = Math.cos(rad);
    let SIN = Math.sin(rad);
    let x = this.x * COS - this.y * SIN;
    let y = this.x * SIN + this.y * COS;
    return new FP_Vector(x, y);
  }
  scale(factor) {
    return new FP_Vector(this.x * factor, this.y * factor);
  }
  reverse() {
    return this.rotate(Math.PI);
  }
  mirror() {
    return this.reverse();
  }
  add(vector, factor = 1.0) {
    return new FP_Vector(
      this.x + vector.x * factor,
      this.y + vector.y * factor
    );
  }
  sub(vector, factor = 1.0) {
    return new FP_Vector(
      this.x - vector.x * factor,
      this.y - vector.y * factor
    );
  }
  ortoAlign() {
    let dim = ["x", "y"];
    let spread = [Math.abs(this.x), Math.abs(this.y)];
    let i = spread.indexOf(Math.max(...spread));
    let ortoVector = new Vector(0, 0);
    ortoVector[dim[i]] = Math.round(this[dim[i]]);
    return ortoVector;
  }
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }
  radAngleBetweenVectors(vector) {
    return Math.acos(this.dot(vector));
  }
}
class Vector {
  constructor(x = 0, y = 0) {
    this.x = parseInt(x, 10);
    this.y = parseInt(y, 10);
  }
  static toClass(vector) {
    return new Vector(vector.x, vector.y);
  }
  normalize() {
    return new Vector(this.x / Math.abs(this.x), this.y / Math.abs(this.y));
  }
  isInAt(dirArray) {
    for (let q = 0; q < dirArray.length; q++) {
      if (this.x === dirArray[q].x && this.y === dirArray[q].y) {
        return q;
      }
    }
    return -1;
  }
  isInPointerArray(dirArray) {
    for (let q = 0; q < dirArray.length; q++) {
      if (this.x === dirArray[q].vector.x && this.y === dirArray[q].vector.y) {
        return q;
      }
    }
    return -1;
  }
  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  prolong(num) {
    return new Vector(this.x * num, this.y * num);
  }
  mul(vector, num = 1) {
    return new Vector(this.x + num * vector.x, this.y + num * vector.y);
  }
  distance(vector) {
    let distance = Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
    return distance;
  }
  mirror() {
    let nx, ny;
    if (this.x) {
      nx = -this.x;
    } else {
      nx = 0;
    }
    if (this.y) {
      ny = -this.y;
    } else {
      ny = 0;
    }
    return new Vector(nx, ny);
  }
  direction(vector) {
    let dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
    let dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
    return new Vector(dx, dy);
  }
  absDirection(vector) {
    let dx = vector.x - this.x;
    let dy = vector.y - this.y;
    return new Vector(dx, dy);
  }
  directionSolutions(vector) {
    let solutions = [];
    let dir = this.direction(vector);
    let absDir = this.absDirection(vector);
    let split = dir.ortoSplit();
    solutions.push(new Direction(split[0], Math.abs(absDir.x)));
    solutions.push(new Direction(split[1], Math.abs(absDir.y)));
    //SORT!!
    if (solutions[0].len < solutions[1].len) solutions.swap(0, 1); //check
    return solutions;
  }
  ortoSplit() {
    let split = [];
    split.push(new Vector(this.x, 0));
    split.push(new Vector(0, this.y));
    return split;
  }
  cw() {
    let directions = [UP, RIGHT, DOWN, LEFT];
    let q;
    for (q = 0; q < 4; q++) {
      if (this.same(directions[q])) {
        q++;
        if (q > 3) q = 0;
        return directions[q];
      }
    }
    return null;
  }
  ccw() {
    let directions = [UP, RIGHT, DOWN, LEFT];
    let q;
    for (q = 0; q < 4; q++) {
      if (this.same(directions[q])) {
        q--;
        if (q < 0) q = 3;
        return directions[q];
      }
    }
    return null;
  }
  same(vector) {
    if (this.x === vector.x && this.y === vector.y) {
      return true;
    } else return false;
  }
  isOrto() {
    return this.x * this.y === 0;
  }
  isNull() {
    return this.x === 0 && this.y === 0;
  }
  isDiagonal() {
    return Math.abs(this.x) === Math.abs(this.y);
  }
  isContra(vector) {
    let X = this.x + vector.x;
    let Y = this.y + vector.y;
    return X === 0 && Y === 0;
  }
  getDirectionAxis() {
    if (this.x !== 0) {
      return "x";
    } else if (this.y !== 0) {
      return "y";
    } else throw ("error getting direction axis from", this);
  }
  trimMirror(dirArray) {
    let axis = this.getDirectionAxis();
    let LN = dirArray.length;
    for (let q = LN - 1; q >= 0; q--) {
      if (dirArray[q][axis] === this[axis]) dirArray.splice(q, 1);
    }

    return dirArray;
  }
  toRad() {
    if (this.x !== 0) {
      switch (this.x) {
        case 1:
          return 2 * Math.PI;
        case -1:
          return Math.PI;
      }
    } else {
      switch (this.y) {
        case -1:
          return Math.PI / 2;
        case 1:
          return (3 * Math.PI) / 2;
      }
    }
  }
  angleBetweenVectors(vector) {
    let Angle2 = vector.toRad();
    let Angle1 = this.toRad();
    return (Math.degrees(Angle2 - Angle1) + 360) % 360;
  }
  radAngleBetweenVectors(vector) {
    return Math.acos(this.dot(vector));
  }
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }
  rotate(rad) {
    let COS = Math.cos(rad);
    let SIN = Math.sin(rad);
    let x = this.x * COS - this.y * SIN;
    let y = this.x * SIN + this.y * COS;
    return new FP_Vector(x, y);
  }
  static sumVectors(arr) {
    let sum = arr.pop();
    while (arr.length) {
      sum = sum.add(arr.pop());
    }
    return sum;
  }
}
class Direction {
  constructor(vector, len, weight) {
    //this.dir = vector;
    this.dir = new Vector(vector.x, vector.y);
    this.len = len || 1;
    this.weight = weight || 0;
  }
  isInAt(dirArray) {
    for (let q = 0; q < dirArray.length; q++) {
      if (
        this.dir.x === dirArray[q].dir.x &&
        this.dir.y === dirArray[q].dir.y
      ) {
        return q;
      }
    }
    return -1;
  }
}
class Point {
  constructor(x = 0, y = 0) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }
  static toClass(point) {
    return new Grid(point.x, point.y);
  }
  translate(vector, len = ENGINE.INI.GRIDPIX) {
    return new Point(this.x + vector.x * len, this.y + vector.y * len);
  }
  toViewport() {
    //change to offset
    this.x = this.x - ENGINE.VIEWPORT.vx;
    this.y = this.y - ENGINE.VIEWPORT.vy;
  }
  add(vector) {
    return new Point(this.x + vector.x, this.y + vector.y);
  }
}
class Pointer {
  constructor(grid, vector) {
    this.grid = Grid.toClass(grid);
    this.vector = Vector.toClass(vector);
  }
}
class Square {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}
class Angle {
  constructor(a) {
    this.angle = a;
  }
  rotate(R) {
    return new Angle((this.angle + 360 + R) % 360);
  }
  rotateCCW(R) {
    return (this.angle + 360 - R) % 360;
  }
  rotateCW(R) {
    return (this.angle + 360 + R) % 360;
  }
  bounce(face) {
    return new Angle((180 + 2 * face - this.angle) % 360);
  }
}
class DefaultDict {
  constructor(defaultVal) {
    return new Proxy(
      {},
      {
        get: (target, name) => (name in target ? target[name] : defaultVal),
      }
    );
  }

}

var float64ToInt64Binary = (function () {
  //https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
  var flt64 = new Float64Array(1);
  var uint16 = new Uint16Array(flt64.buffer);
  var MAX_SAFE = Math.pow(2, 53) - 1;
  var MAX_INT32 = Math.pow(2, 31);

  function uint16ToBinary() {
    var bin64 = "";
    for (var word = 0; word < 4; word++) {
      bin64 = uint16[word].toString(2).padStart(16, 0) + bin64;
    }
    return bin64;
  }

  return function float64ToInt64Binary(number) {
    if (Math.abs(number) > MAX_SAFE) {
      throw new RangeError("Absolute value must be less than 2**53");
    }
    if (Math.abs(number) <= MAX_INT32) {
      return (number >>> 0).toString(2).padStart(64, "0");
    }

    // little endian byte ordering
    flt64[0] = number;

    // subtract bias from exponent bits
    var exponent = ((uint16[3] & 0x7ff0) >> 4) - 1023 + 1; //+1!!
    // encode implicit leading bit of mantissa
    uint16[3] |= 0x10;
    // clear exponent and sign bit
    uint16[3] &= 0x1f;
    // only keep integer part of mantissa
    var bin64 = uint16ToBinary().substr(11, Math.max(exponent, 0));
    return bin64;
  };
})();
LIB.log();
/////////////////////////