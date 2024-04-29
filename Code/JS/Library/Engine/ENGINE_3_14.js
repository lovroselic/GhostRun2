/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

//////////////////engine.js/////////////////////////
//                                                //
//      ENGINE version 3.12        by LS          //
//                                                //
////////////////////////////////////////////////////

/*  

TODO:
      
*/

////////////////////////////////////////////////////

//vector definitions
const UP = new Vector(0, -1);
const DOWN = new Vector(0, 1);
const LEFT = new Vector(-1, 0);
const RIGHT = new Vector(1, 0);
const NOWAY = new Vector(0, 0);
const UpRight = new Vector(1, -1);
const UpLeft = new Vector(-1, -1);
const DownRight = new Vector(1, 1);
const DownLeft = new Vector(-1, 1);

const ENGINE = {
  VERSION: "3.14",
  CSS: "color: #0FA",
  INI: {
    ANIMATION_INTERVAL: 16,
    SPRITESHEET_HEIGHT: 48,
    SPRITESHEET_DEFAULT_WIDTH: 48,
    SPRITESHEET_DEFAULT_HEIGHT: 48,
    sprite_maxW: 300,
    sprite_maxH: 100,
    GRIDPIX: 48,
    FADE_FRAMES: 50,
    PATH_ROUNDS: 1999,
    MAX_PATH: 999,
    MOUSE_IDLE: 3000,
    OVERLAP_TOLERANCE: 4
  },
  verbose: true,
  setGridSize(size = 48) {
    ENGINE.INI.GRIDPIX = size;
  },
  setSpriteSheetSize(size = 48) {
    ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH = size;
    ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT = size;
  },
  setCollisionTolerance(def = 4) {
    ENGINE.INI.OVERLAP_TOLERANCE = def;
  },
  readyCall: null,
  start: null,
  SOURCE: "https://www.c00lsch00l.eu/Games/AA/",
  WASM_SOURCE: "https://www.c00lsch00l.eu/WASM/",
  AUDIO_SOURCE: "https://www.c00lsch00l.eu/Mp3/",
  FONT_SOURCE: "https://www.c00lsch00l.eu/Fonts/",
  checkProximity: true, //check proximity before pixel perfect evaluation of collision to background
  LOAD_W: 160,
  LOAD_H: 22,
  autostart: false,
  gameWindowId: "#game",
  topCanvas: null,
  gameWIDTH: 960,
  gameHEIGHT: 768,
  sideWIDTH: 960,
  sideHEIGHT: 768,
  titleHEIGHT: 120,
  titleWIDTH: 960,
  scoreWIDTH: 960,
  scoreHEIGHT: 80,
  bottomHEIGHT: 40,
  bottomWIDTH: 960,
  mapWIDTH: 512,
  statusWIDTH: 312,
  currentTOP: 0,
  currentLEFT: 0,
  mouseX: null,
  mouseY: null,
  directions: [LEFT, UP, RIGHT, DOWN],
  corners: [UpLeft, UpRight, DownLeft, DownRight],
  circle: [UP, UpRight, RIGHT, DownRight, DOWN, DownLeft, LEFT, UpLeft],
  dirCircle: [UP, RIGHT, DOWN, LEFT],
  layersToClear: new Set(),
  disableKey(key) {
    $(document).keydown(function (event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
    $(document).keyup(function (event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
    $(document).keypress(function (event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
  },
  hideMouse() {
    $("#game").css("cursor", "none");
    $("#game").on("mousemove", ENGINE.waitThenHideMouse);
  },
  waitThenHideMouse() {
    $("#game").css("cursor", "default");
    $("#game").off("mousemove", ENGINE.waitThenHideMouse);
    setTimeout(ENGINE.hideMouse, ENGINE.INI.MOUSE_IDLE);
  },
  showMouse() {
    $("#game").off("mousemove", ENGINE.waitThenHideMouse);
    $("#game").css("cursor", "default");
  },
  disableArrows() {
    ENGINE.disableKey("up");
    ENGINE.disableKey("down");
  },
  init() {
    console.log(`%cInitializing ENGINE V${String(ENGINE.VERSION)}`, ENGINE.CSS);
    $("#temp").append(`<canvas id ='temp_canvas' width='${ENGINE.INI.sprite_maxW}' height='${ENGINE.INI.sprite_maxH}'></canvas>`);
    $("#temp2").append(`<canvas id ='temp_canvas2' width='${ENGINE.INI.sprite_maxW}' height='${ENGINE.INI.sprite_maxH}'></canvas>`);
    LAYER.temp = $("#temp_canvas")[0].getContext("2d");
    LAYER.temp2 = $("#temp_canvas2")[0].getContext("2d");
    VIEW.init();
  },
  fill(ctx, pattern) {
    let CTX = ctx;
    let pat = CTX.createPattern(pattern, "repeat");
    CTX.fillStyle = pat;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  clearManylayers(layers) {
    layers.forEach(item => ENGINE.layersToClear.add(item));
    ENGINE.clearLayerStack();
  },
  clearLayer(layer) {
    let CTX = LAYER[layer];
    CTX.clearRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  clearContext(CTX) {
    CTX.clearRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  clearLayerStack() {
    let CLR = ENGINE.layersToClear.length;
    if (CLR === 0) return;
    ENGINE.layersToClear.forEach(layer => ENGINE.clearLayer(layer));
    ENGINE.layersToClear.clear();
  },
  fillLayer(layer, colour) {
    let CTX = LAYER[layer];
    CTX.fillStyle = colour;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  resizeBOX(id, width, height) {
    width = width || ENGINE.gameWIDTH;
    height = height || ENGINE.gameHEIGHT;
    let box = $("#" + id).children();
    for (let a = 0; a < box.length; a++) {
      box[a].width = width;
      box[a].height = height;
    }
  },
  addBOX(id, width, height, alias, type) {
    /** 
     * types null, side, fside
     * gw class: side by side windows
     * gh class: windows below
     */

    if (id === null) return;
    if (width === null) return;
    if (height === null) return;
    let layers = alias.length;
    $(ENGINE.gameWindowId).append(`<div id ='${id}' style='position: relative'></div>`);
    if (type === "side" || type === "fside") {
      $(`#${id}`).addClass("gw");
    } else {
      $(`#${id}`).addClass("gh");
    }
    let prop;
    let canvasElement;
    for (let x = 0; x < layers; x++) {
      canvasElement = `<canvas class='layer' 
      id='${id}_canvas_${x}' width='${width}' height='${height}' 
      style='z-index:${x}; top:${ENGINE.currentTOP}px; left:${ENGINE.currentLEFT}px'></canvas>`;

      $(`#${id}`).append(canvasElement);
      prop = alias.shift();
      LAYER[prop] = $(`#${id}_canvas_${x}`)[0].getContext("2d");
    }
    if (type === "side") {
      ENGINE.currentLEFT += width;
    } else if (type === "fside") {
      ENGINE.currentTOP += height;
      ENGINE.currentLEFT = 0;
    } else {
      ENGINE.currentTOP += height;
      ENGINE.currentLEFT = 0;
    }
  },
  addCanvas(id, w, h) {
    //adds canvas to div
    let canvas = `<canvas id="c_${id}" width="${w}" height="${h}"></canvas>`;
    $(`#${id}`).append(canvas);
    LAYER[id] = $(`#c_${id}`)[0].getContext("2d");
  },
  copyLayer(copyFrom, copyTo, orX, orY, orW, orH) {
    let CTX = LAYER[copyTo];
    CTX.drawImage(LAYER[copyFrom].canvas, orX, orY, orW, orH, 0, 0, orW, orH);
  },
  flattenLayers(src, dest) {
    let W = LAYER[dest].canvas.width;
    let H = LAYER[dest].canvas.height;
    ENGINE.copyLayer(src, dest, 0, 0, W, H, 0, 0, W, H);
  },
  spriteDraw(layer, X, Y, image, offset = new Vector(0, 0)) {
    let CX = offset.x + Math.floor(X - Math.floor(image.width / 2));
    let CY = offset.y + Math.floor(Y - Math.floor(image.height / 2));
    let CTX = LAYER[layer];
    CTX.drawImage(image, CX, CY);
  },
  drawToGrid(layer, grid, image) {
    let p = GRID.gridToCoord(grid);
    ENGINE.draw(layer, p.x, p.y, image);
  },
  spriteToGrid(layer, grid, image) {
    let p = GRID.gridToCenterPX(grid);
    ENGINE.spriteDraw(layer, p.x, p.y, image);
  },
  draw(layer, X, Y, image) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, X, Y);
  },
  drawScaled(layer, X, Y, image, scale = 1) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, 0, 0, image.width, image.height, X, Y, image.width * scale, image.height * scale);
  },
  drawBottomLeft(layer, X, Y, image) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, X, Y - image.height);
  },
  drawBottomRight(layer, X, Y, image) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, X - image.width, Y - image.height);
  },
  drawBottomCenter(layer, X, Y, image) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, X - image.width / 2, Y - image.height);
  },
  spriteDrawPart(layer, X, Y, image, top = 0, left = 0, right = 0, bottom = 0) {
    let CX = Math.floor(X - Math.floor(image.width / 2));
    let CY = Math.floor(Y - Math.floor(image.height / 2));
    this.drawPart(layer, CX, CY, image, top, left, right, bottom);
  },
  drawPart(layer, X, Y, image, top = 0, left = 0, right = 0, bottom = 0) {
    let CTX = LAYER[layer];
    CTX.drawImage(
      image,
      left,
      top,
      image.width - left - right,
      image.height - top - bottom,
      X + left,
      Y + top,
      image.width - left - right,
      image.height - top - bottom,
    );
  },
  drawPool(layer, pool, sprite) {
    //let CTX = LAYER[layer];
    let PL = pool.length;
    if (PL === 0) return;
    for (let i = 0; i < PL; i++) {
      ENGINE.spriteDraw(layer, pool[i].x, pool[i].y, sprite);
    }
  },
  trimCanvas(data) {
    var top = 0,
      bottom = data.height,
      left = 0,
      right = data.width;
    var width = data.width;
    while (top < bottom && rowBlank(data, width, top)) ++top;
    while (bottom - 1 > top && rowBlank(data, width, bottom - 1)) --bottom;
    while (left < right && columnBlank(data, width, left, top, bottom)) ++left;
    while (right - 1 > left && columnBlank(data, width, right - 1, top, bottom)) --right;

    return { left: left, top: top, right: right, bottom: bottom };

    function rowBlank(data, width, y) {
      for (let x = 0; x < width; ++x) {
        if (data.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }

    function columnBlank(data, width, x, top, bottom) {
      for (let y = top; y < bottom; ++y) {
        if (data.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }
  },
  rotateImage(image, degree, newName) {
    let CTX = LAYER.temp;
    let CW = image.width;
    let CH = image.height;
    let max = Math.max(CW, CH);
    let min = Math.max(CW, CH);
    CTX.canvas.width = max * 2;
    CTX.canvas.height = max * 2;
    CTX.save();
    CTX.translate(max, max);
    CTX.rotate((degree * Math.PI) / 180);
    CTX.drawImage(image, -min / 2, -min / 2);
    CTX.restore();
    let imgDATA = CTX.getImageData(0, 0, CTX.canvas.width, CTX.canvas.height);
    let TRIM = ENGINE.trimCanvas(imgDATA);
    let trimmed = CTX.getImageData(
      TRIM.left,
      TRIM.top,
      TRIM.right - TRIM.left,
      TRIM.bottom - TRIM.top
    );
    CTX.canvas.width = TRIM.right - TRIM.left;
    CTX.canvas.height = TRIM.bottom - TRIM.top;
    CTX.putImageData(trimmed, 0, 0);
    const sprite = ENGINE.contextToSprite(newName, CTX);
    sprite.onload = ENGINE.creationSpriteCount;
    return sprite;
  },
  ready() {
    console.log("%cENGINE ready!", ENGINE.CSS);
    $("#load").addClass("hidden");
    ENGINE.readyCall.call();
    if (ENGINE.autostart) {
      if (ENGINE.start !== null) ENGINE.start();
    }
  },
  lineIntersectsCircle(lineP1, lineP2, C, cR) {
    let P1 = lineP1.sub(C);
    let P2 = lineP2.sub(C);
    let dx = P1.x - P2.x;
    let dy = P1.y - P2.y;
    let dr2 = dx ** 2 + dy ** 2;
    let D = P1.x * P2.y - P2.x * P1.y;
    return cR ** 2 * dr2 > D ** 2;
  },
  intersectionCollision(actor1, actor2) {
    if (actor1.class !== "bullet" && actor2.class !== "bullet") return;
    if (actor1.prevX === null || actor2.prevX === null) return;

    let AL = arguments.length;
    let line1 = {};
    let line2 = {};
    for (let q = 0; q < AL; q++) {
      switch (arguments[q].class) {
        case "bullet":
          // for 5px*5px bullet
          line1.x1 = arguments[q].prevX;
          line1.y1 = arguments[q].prevY + 3;
          line1.x2 = arguments[q].x;
          line1.y2 = arguments[q].y - 3;
          break;
        default:
          //linear representation of object, angle not considered
          line2.x1 = parseInt(
            (arguments[q].prevX + arguments[q].x) / 2 + arguments[q].width / 2,
            10
          );
          line2.y1 = parseInt((arguments[q].prevY + arguments[q].y) / 2, 10);
          line2.x2 = parseInt(
            (arguments[q].prevX + arguments[q].x) / 2 - arguments[q].width / 2,
            10
          );
          line2.y2 = line2.y1;
          break;
      }
    }
    return ENGINE.lineIntersects(line1.x1, line1.y1, line1.x2, line1.y2, line2.x1, line2.y1, line2.x2, line2.y2);
  },
  lineIntersects(a, b, c, d, p, q, r, s) {
    //https://stackoverflow.com/a/24392281/4154250
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
    }
  },
  collisionFuzyArea(actor1, actor2) {
    let area = ENGINE.collisionArea(actor1, actor2);
    if (area) {
      if (area.w >= ENGINE.INI.OVERLAP_TOLERANCE && area.h >= ENGINE.INI.OVERLAP_TOLERANCE) {
        return true;
      }
    }
    return false;
  },
  collisionRectangles(actor1, actor2) {
    actor1.setArea();
    actor2.setArea();
    return actor1.area.overlap(actor2.area);
  },
  collisionArea(actor1, actor2) {
    actor1.setArea();
    actor2.setArea();
    let x = Math.min(actor1.area.x + actor1.area.w, actor2.area.x + actor2.area.w);
    let W = x - Math.max(actor1.area.x, actor2.area.x);
    let y = Math.min(actor1.area.y + actor1.area.h, actor2.area.y + actor2.area.h);
    let H = y - Math.max(actor1.area.y, actor2.area.y);
    if (W > 0 && H > 0) {
      return new RectArea(x, y, W, H);
    } else return null;
  },
  collisionToBackground(actor, layer) {
    //deprecated - redesign required
    var CTX = layer;
    var maxSq = Math.max(actor.width, actor.height);
    var R = Math.ceil(0.5 * Math.sqrt(2 * Math.pow(maxSq, 2)));
    var X = actor.x;
    var Y = actor.y;
    var proximity = false;
    if (ENGINE.checkProximity) {
      var imgDATA = CTX.getImageData(X - R, Y - R, 2 * R, 2 * R);
      var check = 1;
      var left, right, down, top;
      while (check < R) {
        left = imgDATA.data[toIndex(X - check, Y)];
        right = imgDATA.data[toIndex(X + check, Y)];
        down = imgDATA.data[toIndex(X, Y + check)];
        top = imgDATA.data[toIndex(X, Y - check)];
        if (left || right || down || top) {
          proximity = true;
          break;
        }
        check++;
      }
    } else proximity = true;
    if (!proximity) {
      return false;
    } else {
      var CX = Math.floor(X - actor.width / 2);
      var CY = Math.floor(Y - actor.height / 2);
      var CTX1 = LAYER.temp;
      CTX1.canvas.width = actor.width;
      CTX1.canvas.height = actor.height;
      ENGINE.draw("temp", 0, 0, SPRITE[actor.name]);
      var data1 = CTX1.getImageData(0, 0, actor.width, actor.height); //actor data
      var data2 = CTX.getImageData(CX, CY, actor.width, actor.height); //layer data
      var DL = data1.data.length;
      var index;
      for (index = 3; index < DL; index += 4) {
        if (data1.data[index] > 0 && data2.data[index] > 0) {
          return true;
        }
      }
      return false;
    }

    function toIndex(x, y) {
      var index = (y - Y) * 4 * (2 * R) + (x - (X - R)) * 4 + 3;
      return index;
    }
  },
  drawLoadingGraph(counter) {
    var count = ENGINE.LOAD[counter];
    var HMI = ENGINE.LOAD["HM" + counter];
    var text = counter;
    var percent = Math.floor((count / HMI) * 100);
    var CTX = LAYER.PRELOAD[counter];
    CTX.clearRect(0, 0, ENGINE.LOAD_W, ENGINE.LOAD_H);
    CTX.beginPath();
    CTX.lineWidth = "1";
    CTX.strokeStyle = "black";
    CTX.rect(0, 0, ENGINE.LOAD_W, ENGINE.LOAD_H);
    CTX.closePath();
    CTX.stroke();
    CTX.fillStyle = "#999";
    CTX.fillRect(1, 1, Math.floor((ENGINE.LOAD_W - 2) * (percent / 100)), ENGINE.LOAD_H - 2);
    CTX.fillStyle = "black";
    CTX.font = "10px Verdana";
    CTX.fillText(
      text + ": " + percent + "%",
      ENGINE.LOAD_W * 0.1,
      ENGINE.LOAD_H * 0.62
    );
    return;
  },
  percentBar(percent, y, CTX, panelSize, colors, H) {
    let pad = panelSize / 12;
    CTX.beginPath();
    CTX.lineWidth = "1";
    CTX.strokeStyle = colors[0];
    var Width = panelSize - 2 * pad;
    CTX.rect(pad, y, Width, H);
    CTX.closePath();
    CTX.stroke();
    CTX.shadowColor = "transparent";
    CTX.shadowOffsetX = 0;
    CTX.shadowOffsetY = 0;
    CTX.shadowBlur = 0;

    CTX.fillStyle = colors[0];
    if (percent < 0.2 && percent > 0.1) {
      CTX.fillStyle = colors[1];
    } else if (percent <= 0.1) {
      CTX.fillStyle = colors[2];
    }
    CTX.fillRect(pad + 1, y + 1, Math.max(0, Math.round(Width * percent) - 2), H - 2);
  },
  statusBar(CTX, x, y, w, h, value, max, color, annotate = true) {
    CTX.save();
    ENGINE.resetShadow(CTX);
    let fs = h / 2;
    CTX.font = `${fs}px Verdana`;
    CTX.strokeStyle = color;
    CTX.fillStyle = color;
    CTX.beginPath();
    CTX.lineWidth = "1";
    CTX.rect(x, y, w, h);
    CTX.closePath();
    CTX.stroke();
    let fraction = value / max;
    CTX.fillRect(x, y, Math.round(fraction * w), h);
    if (annotate) {
      CTX.fillStyle = "#FFF";
      CTX.textAlign = "center";
      let tx = x + w / 2 + fs / 2;
      let ty = y + h / 2 + fs / 2;
      CTX.fillText(`${value}/${max}`, tx, ty);
    }
    CTX.restore();
  },
  resetShadow(CTX) {
    CTX.shadowColor = "#000";
    CTX.shadowOffsetX = 0;
    CTX.shadowOffsetY = 0;
    CTX.shadowBlur = 0;
  },
  spriteDump(layer, spriteList) {
    console.log("%c********* SPRITE DUMP *********", ENGINE.CSS);
    console.log(SPRITE);
    var x = 0;
    var y = 0;
    var dy = 0;

    if (spriteList === undefined) {
      var keys = Object.keys(SPRITE);
      spriteList = keys.map((x) => SPRITE[x]);
    }

    spriteList.forEach(function (q) {
      ENGINE.draw(layer, x, y, q);
      x += q.width;
      if (q.height > dy) dy = q.height;
      if (x > LAYER[layer].canvas.width - 64) {
        y += dy;
        x = 0;
      }
    });
  },
  window(
    width = ENGINE.gameWIDTH / 2,
    height = ENGINE.gameHEIGHT / 2,
    CTX = LAYER.text,
    x = Math.floor((ENGINE.gameWIDTH - width) / 2),
    y = Math.floor((ENGINE.gameHEIGHT - height) / 2)
  ) {
    CTX.save();
    CTX.fillStyle = "#000";
    CTX.shadowColor = "#000";
    CTX.shadowOffsetX = 0;
    CTX.shadowOffsetY = 0;
    CTX.shadowBlur = 0;
    CTX.globalAlpha = 0.8;
    CTX.roundRect(x, y, width, height, { upperLeft: 15, upperRight: 15, lowerLeft: 15, lowerRight: 15 }, true, true);
    CTX.restore();
    return new Point(x, y);
  },
  mouseOver(event) {
    ENGINE.readMouse(event);
    FORM.BUTTON.changeMousePointer(ENGINE.topCanvas);
  },
  mouseOverId(id) {
    return $(`#${id}:hover`).length !== 0;
  },
  mouseClickId(id) {
    return $(`#${id}:active`).length !== 0;
  },
  mousePointer(cname) {
    $(cname).css("cursor", "pointer");
  },
  mouseGrab(cname) {
    $(cname).css("cursor", "grab");
  },
  mouseGrabbing(cname) {
    $(cname).css("cursor", "grabbing");
  },
  mouseDefault(cname) {
    $(cname).css("cursor", "default");
  },
  readMouse(event) {
    var canvasOffset = $(event.data.layer).offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var mouseX = parseInt(event.pageX - offsetX, 10);
    var mouseY = parseInt(event.pageY - offsetY, 10);
    ENGINE.mouseX = mouseX;
    ENGINE.mouseY = mouseY;
  },
  mouseClick(event) {
    ENGINE.readMouse(event);
    FORM.BUTTON.click();
    return;
  },
  mousePassClick(event, func) {
    ENGINE.readMouse(event);
    func.call();
  },
  getCanvasNumber(id) {
    var cnv = $("#" + id + " .layer");
    return cnv.length;
  },
  getCanvasName(id) {
    let CL = ENGINE.getCanvasNumber(id);
    let cname = `#${id}_canvas_${--CL}`;
    return cname;
  },
  watchVisibility(func) {
    document.addEventListener("visibilitychange", ENGINE._watch.bind(null, func), false);
  },
  _watch(func) {
    if (document.visibilityState !== "visible") {
      func.call();
    }
  },
  cutGrid(layer, point) {
    var CTX = layer;
    CTX.clearRect(point.x, point.y, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    return;
  },
  cutManyGrids(layer, point, N) {
    var CTX = layer;
    CTX.clearRect(point.x, point.y, N * ENGINE.INI.GRIDPIX, N * ENGINE.INI.GRIDPIX);
    return;
  },
  spreadAroundCenter(toDo, x, delta) {
    var xS = [];
    var odd = toDo % 2;
    var n = 2;
    if (odd) {
      xS.push(x);
      toDo--;
      while (toDo > 0) {
        xS.push(x + (n - 1) * delta);
        xS.push(x - (n - 1) * delta);
        toDo -= 2;
        n++;
      }
    } else {
      while (toDo > 0) {
        xS.push(x + ((n - 1) * delta) / 2);
        xS.push(x - ((n - 1) * delta) / 2);
        toDo -= 2;
        n += 2;
      }
    }
    xS.sort((a, b) => a - b);
    return xS;
  },
  grayScaleImg(img, name) {
    const MIN = 0x44;
    const MAX = 0xdd;
    var NTX = LAYER.temp2;
    NTX.canvas.width = img.width;
    NTX.canvas.height = img.height;
    NTX.clearRect(0, 0, NTX.canvas.width, NTX.canvas.height);
    NTX.drawImage(img, 0, 0);
    let imgData = NTX.getImageData(0, 0, NTX.canvas.width, NTX.canvas.height);
    let data = imgData.data;
    for (let i = 0, LN = data.length; i < LN; i += 4) {
      let R = data[i];
      let G = data[i + 1];
      let B = data[i + 2];
      let A = data[i + 3];
      if (A > 0) {
        let selection = Math.min(R, G, B);
        if (selection < MIN) selection = MIN;
        if (selection > MAX) selection = MAX;
        //R, G, B, A
        data[i] = selection;
        data[i + 1] = selection;
        data[i + 2] = selection;
        data[i + 3] = Math.floor(A * 0.9);
      }
    }
    NTX.putImageData(imgData, 0, 0);
    return ENGINE.contextToSprite(name, NTX);
  },
  imgToTexture(obj) {
    TEXTURE[obj.name] = obj.img;
  },
  imgToSprite(obj) {
    SPRITE[obj.name] = obj.img;
    SPRITE[obj.name].crossOrigin = "Anonymous";
    SPRITE[obj.name].width = obj.img.width;
    SPRITE[obj.name].height = obj.img.height;
  },
  imgToCanvas(img) {
    LAYER.temp.canvas.width = img.width;
    LAYER.temp.canvas.height = img.height;
    LAYER.temp.drawImage(img, 0, 0);
    return LAYER.temp.canvas;
  },
  getImgData(img, offX = 0, offY = 0) {
    const canvas = ENGINE.imgToCanvas(img);
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(offX, offY, canvas.width, canvas.height);
  },
  extractImg(x, y, CTX, trim = true) {
    var data, imgDATA;
    var NTX = LAYER.temp2;
    data = CTX.getImageData(x, y, ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH, ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT);
    NTX.canvas.width = ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
    NTX.canvas.height = ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT;
    NTX.putImageData(data, 0, 0);
    if (trim) {
      imgDATA = NTX.getImageData(0, 0, ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH, ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT);
      var TRIM = ENGINE.trimCanvas(imgDATA);
      var trimmed = NTX.getImageData(TRIM.left, TRIM.top, TRIM.right - TRIM.left, TRIM.bottom - TRIM.top);
      NTX.canvas.width = TRIM.right - TRIM.left;
      NTX.canvas.height = TRIM.bottom - TRIM.top;
      NTX.putImageData(trimmed, 0, 0);
    }
    return NTX;
  },
  drawSheet(spriteSheet) {
    var CTX = LAYER.temp;
    CTX.canvas.width = spriteSheet.width;
    CTX.canvas.height = spriteSheet.height;
    ENGINE.draw("temp", 0, 0, spriteSheet);
    return CTX;
  },
  contextToSprite(newName, NTX) {
    SPRITE[newName] = new Image();
    SPRITE[newName].crossOrigin = "Anonymous";
    SPRITE[newName].src = NTX.canvas.toDataURL("image/png");
    SPRITE[newName].width = NTX.canvas.width;
    SPRITE[newName].height = NTX.canvas.height;
    return SPRITE[newName];
  },
  packToSprite(obj) {
    var tags = ["left", "right", "front", "back"];
    var tag = tags.slice(0, obj.dimension);
    var CTX = ENGINE.drawSheet(obj.img);
    let x, y;
    let newName;
    for (var W = 0, LN = tag.length; W < LN; W++) {
      for (var q = 0; q < obj.count; q++) {
        x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
        y = W * ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT;
        let NTX = ENGINE.extractImg(x, y, CTX);
        newName = `${obj.name}_${tag[W]}_${q}`;
        ASSET[obj.name][tag[W]].push(ENGINE.contextToSprite(newName, NTX));
      }
    }
  },
  seqToSprite(obj) {
    var CTX = ENGINE.drawSheet(obj.img);
    let x;
    let newName;
    let names = [];
    for (var q = 0; q < obj.count; q++) {
      x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
      let NTX = ENGINE.extractImg(x, 0, CTX, obj.trim);
      newName = obj.name + "_" + q.toString().padStart(2, "0");
      ASSET[obj.name].linear.push(ENGINE.contextToSprite(newName, NTX));
      names.push(newName);
    }
    return names;
  },
  sheetToSprite(obj) {
    var CTX = ENGINE.drawSheet(obj.img);
    let x;
    let newName;
    for (var q = 0; q < obj.count; q++) {
      x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
      let NTX = ENGINE.extractImg(x, 0, CTX);
      newName = `${obj.name}_${q}`;
      ASSET[obj.parent][obj.tag].push(ENGINE.contextToSprite(newName, NTX));
    }
  },
  audioToAudio(obj) {
    AUDIO[obj.name] = obj.audio;
  },
  linkToWasm(obj) {
    var bin = obj.exports;
    let name = null;
    for (var fn in bin) {
      if (typeof bin[fn] === "function") {
        name = fn;
        break;
      }
    }
    WASM[name] = bin[name];
    MEMORY[name] = bin.memory;
  },
  spriteToAsset(obj) {
    ASSET[obj.asset].linear.push(SPRITE[obj.name]);
  },
  KEY: {
    on() {
      $(document).keydown(ENGINE.GAME.checkKey);
      $(document).keyup(ENGINE.GAME.clearKey);
    },
    off() {
      $(document).off("keyup", ENGINE.GAME.clearKey);
      $(document).off("keydown", ENGINE.GAME.checkKey);
    },
    map: {
      shift: 16,
      ctrl: 17,
      back: 8,
      tab: 9,
      alt: 18,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      space: 32,
      enter: 13,
      F2: 113,
      F4: 115,
      F9: 120,
      F8: 119,
      F7: 118,
      A: 65,
      D: 68,
      C: 67,
      H: 72,
      M: 77,
      Q: 81,
      E: 69,
      W: 87,
      S: 83,
      LT: 60,
      LTC: 226
    },
    waitFor(func, key = "enter") {
      if (ENGINE.GAME.stopAnimation) return;
      let map = ENGINE.GAME.keymap;
      if (map[ENGINE.KEY.map[key]]) {
        ENGINE.GAME.ANIMATION.stop();
        func.call();
        ENGINE.GAME.keymap[ENGINE.KEY.map[key]] = false;
        return;
      }
    },
    dirFromKey() {
      //[LEFT, UP, RIGHT, DOWN]
      let pressed = [0, 0, 0, 0];
      if (ENGINE.GAME.keymap[ENGINE.KEY.map.left]) pressed[0] = 1;
      if (ENGINE.GAME.keymap[ENGINE.KEY.map.up]) pressed[1] = 1;
      if (ENGINE.GAME.keymap[ENGINE.KEY.map.right]) pressed[2] = 1;
      if (ENGINE.GAME.keymap[ENGINE.KEY.map.down]) pressed[3] = 1;
      let test = pressed.reduce((a, b) => a + b, 0);
      if (test !== 1) return null;
      for (const [index, key] of pressed.entries()) {
        if (key === 1) return ENGINE.directions[index];
      }
      return null;
    }
  },
  GAME: {
    running: false,
    keymap: {
      16: false, //shift
      17: false, //CTRL
      37: false, //LEFT
      38: false, //UP
      39: false, //RIGHT
      40: false, //Down
      32: false, //SPACE
      13: false, //ENTER
      113: false, //F2
      115: false, //F4
      120: false, //F9
      119: false, //F8
      118: false, //F7
      65: false, //A
      68: false, //D
      67: false, //C
      8: false, //back
      9: false, //tab
      72: false, //h
      77: false, //m
      81: false, //q
      69: false, //e
      87: false, //w
      83: false, //s
      60: false, //lt
      226: false //lt-chrome
    },
    clearAllKeys() {
      for (var key in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[key] = false;
      }
    },
    clearKey(e) {
      e = e || window.event;
      if (e.keyCode in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[e.keyCode] = false;
      }
    },
    checkKey(e) {
      e = e || window.event;
      if (e.keyCode in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[e.keyCode] = true;
        e.preventDefault();
      }
    },
    run(func, nextFunct) {
      ENGINE.GAME.running = true;
      if (ENGINE.GAME.frame.start === null) {
        ENGINE.GAME.frame.start = performance.now();
      }
      ENGINE.GAME.frame.delta = performance.now() - ENGINE.GAME.frame.start;
      if (ENGINE.GAME.frame.delta >= ENGINE.INI.ANIMATION_INTERVAL) {
        if (ENGINE.GAME.stopAnimation) {
          if (nextFunct) nextFunct.call();
          console.log(`%cAnimation stopped BEFORE execution ${func.name}`, "color: #f00");
          ENGINE.GAME.running = false;
          return;
        }
        func.call(null, ENGINE.GAME.frame.delta);
        ENGINE.GAME.frame.start = null;
      }
      if (!ENGINE.GAME.stopAnimation) {
        requestAnimationFrame(ENGINE.GAME.run.bind(null, func, nextFunct));
      } else {
        if (nextFunct) nextFunct.call();
        console.log(`%cAnimation stopped AFTER execution ${func.name}`, "color: #f00");
        ENGINE.GAME.running = false;
        return;
      }
    },
    start(interval = 16) {
      $(window).scrollTop($("#game").offset().top);
      ENGINE.GAME.stopAnimation = false;
      ENGINE.GAME.started = Date.now();
      ENGINE.GAME.frame = {};
      ENGINE.GAME.frame.start = null;
      ENGINE.KEY.on();
      ENGINE.INI.ANIMATION_INTERVAL = interval;
    },
    ANIMATION: {
      start(wrapper) {
        console.log(`%cENGINE.GAME.ANIMATION.start --> ${wrapper.name}`, "color: #0F0");
        ENGINE.GAME.stopAnimation = false;
        ENGINE.GAME.run(wrapper, ENGINE.GAME.ANIMATION.queue);
      },
      stop() {
        ENGINE.GAME.stopAnimation = true;
      },
      next(functionPointer) {
        if (ENGINE.GAME.running) {
          ENGINE.GAME.ANIMATION.addToQueue(functionPointer);
          ENGINE.GAME.ANIMATION.stop();
        } else {
          ENGINE.GAME.ANIMATION.start(functionPointer);
        }
      },
      addToQueue(functionPointer) {
        ENGINE.GAME.ANIMATION.STACK.push(functionPointer);
      },
      queue() {
        ENGINE.GAME.ANIMATION.stop();
        setTimeout(() => {
          console.log(`%cGame running? ${ENGINE.GAME.running}`, ENGINE.CSS);
          if (ENGINE.GAME.ANIMATION.STACK.length > 0) {
            let next = ENGINE.GAME.ANIMATION.STACK.shift();
            console.log(`%c..... animation queue: ${next.name}`, ENGINE.CSS);
            ENGINE.GAME.ANIMATION.start(next);
          } else {
            console.log("%cAnimation STACK EMPTY! Game stopped running.", ENGINE.CSS);
          }
        }, ENGINE.INI.ANIMATION_INTERVAL);
      },
      waitThen(func, n = 1) {
        setTimeout(func, ENGINE.INI.ANIMATION_INTERVAL * n);
      },
      STACK: [],
      resetTimer() {
        ENGINE.GAME.frame.start = null;
      }
    }
  },
  VIEWPORT: {
    max: {
      x: 0,
      y: 0
    },
    setMax(max) {
      ENGINE.VIEWPORT.max.x = max.x;
      ENGINE.VIEWPORT.max.y = max.y;
    },
    changed: false,
    reset() {
      ENGINE.VIEWPORT.vx = 0;
      ENGINE.VIEWPORT.vy = 0;
    },
    vx: 0,
    vy: 0,
    report() {
      console.log("VIEWPORT:", ENGINE.VIEWPORT.vx, ENGINE.VIEWPORT.vy);
    },
    change(from, to) {
      ENGINE.copyLayer(
        from,
        to,
        ENGINE.VIEWPORT.vx,
        ENGINE.VIEWPORT.vy,
        ENGINE.gameWIDTH,
        ENGINE.gameHEIGHT
      );
    },
    check(actor, max = ENGINE.VIEWPORT.max) {
      var vx = actor.x - ENGINE.gameWIDTH / 2;
      var vy = actor.y - ENGINE.gameHEIGHT / 2;
      if (vx < 0) vx = 0;
      if (vy < 0) vy = 0;
      if (vx > max.x - ENGINE.gameWIDTH) vx = max.x - ENGINE.gameWIDTH;
      if (vy > max.y - ENGINE.gameHEIGHT) vy = max.y - ENGINE.gameHEIGHT;
      if (vx != ENGINE.VIEWPORT.vx || vy != ENGINE.VIEWPORT.vy) {
        ENGINE.VIEWPORT.vx = vx;
        ENGINE.VIEWPORT.vy = vy;
        ENGINE.VIEWPORT.changed = true;
      }
    },
    alignTo(actor) {
      actor.vx = actor.x - ENGINE.VIEWPORT.vx;
      actor.vy = actor.y - ENGINE.VIEWPORT.vy;
    }
  },
  TEXT: {
    setRD(rd) {
      ENGINE.TEXT.RD = rd;
    },
    RD: null,
    text(text, x, y) {
      let CTX = ENGINE.TEXT.RD.layer;
      CTX.textAlign = "center";
      CTX.fillText(text, x, y);
    },
    centeredText(text, width, y) {
      let x = (width / 2) | 0;
      ENGINE.TEXT.text(text, x, y);
    },
    leftText(text, x, y) {
      var CTX = ENGINE.TEXT.RD.layer;
      CTX.textAlign = "left";
      CTX.fillText(text, x, y);
    }
  },
  LOAD: {
    Textures: 0,
    Sprites: 0,
    Sequences: 0,
    Sheets: 0,
    Rotated: 0,
    WASM: 0,
    Sounds: 0,
    Fonts: 0,
    Packs: 0,
    SheetSequences: 0,
    RotSeq: 0,
    HMRotSeq: null,
    HMSheetSequences: null,
    HMFonts: null,
    HMSequences: null,
    HMTextures: null,
    HMSprites: null,
    HMSheets: null,
    HMRotated: null,
    HMWASM: null,
    HMSounds: null,
    HMPacks: null,
    preload() {
      console.time("preloading");
      console.group("preload");
      console.log("%cPreloading ...", ENGINE.CSS);
      var AllLoaded = Promise.all([
        loadTextures(),
        loadSprites(),
        loadSequences(),
        loadSheets(),
        loadPacks(),
        loadSheetSequences(),
        loadRotated(),
        loadRotatedSheetSequences(),
        loadingSounds(),
        loadWASM(),
        loadAllFonts()
      ]).then(function () {
        console.log("%cAll assets loaded and ready!", ENGINE.CSS);
        console.log("%c****************************", ENGINE.CSS);
        console.groupEnd("preload");
        console.timeEnd("preloading");
        ENGINE.ready();
      });
      return;

      function appendCanvas(name) {
        let id = "preload_" + name;
        $("#load").append(`<canvas id ='${id}' width='${ENGINE.LOAD_W}' height='${ENGINE.LOAD_H}'></canvas>`);
        LAYER.PRELOAD[name] = $("#" + id)[0].getContext("2d");
      }
      function loadTextures(arrPath = LoadTextures) {
        console.log(`%c ...loading ${arrPath.length} textures`, ENGINE.CSS);
        ENGINE.LOAD.HMTextures = arrPath.length;
        if (ENGINE.LOAD.HMTextures) appendCanvas("Textures");

        const temp = Promise.all(
          arrPath.map((img) => loadImage(img, "Textures"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.imgToTexture(el);
          });
        });
        return temp;
      }
      function loadSprites(arrPath = LoadSprites) {
        console.log(`%c ...loading ${arrPath.length} sprites`, ENGINE.CSS);
        ENGINE.LOAD.HMSprites = arrPath.length;
        if (ENGINE.LOAD.HMSprites) appendCanvas("Sprites");

        const temp = Promise.all(
          arrPath.map((img) => loadImage(img, "Sprites"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.imgToSprite(el);
          });
        });
        return temp;
      }
      function loadSequences(arrPath = LoadSequences) {
        console.log(`%c ...loading ${arrPath.length} sequences`, ENGINE.CSS);
        var toLoad = [];

        arrPath.forEach(function (el) {
          ASSET[el.name] = new LiveSPRITE("1D", []);
          for (let i = 1; i <= el.count; i++) {
            toLoad.push({
              srcName: el.srcName + "_" + i.toString().padStart(2, "0") + "." + el.type,
              name: el.name + (i - 1).toString().padStart(2, "0"),
              asset: el.name
            });
          }
        });

        ENGINE.LOAD.HMSequences = toLoad.length;
        if (ENGINE.LOAD.HMSequences) appendCanvas("Sequences");

        const temp = Promise.all(
          toLoad.map((img) => loadImage(img, "Sequences"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.imgToSprite(el);
            ENGINE.spriteToAsset(el);
          });
        });
        return temp;
      }
      function loadPacks(arrPath = LoadPacks) {
        console.log(`%c ...loading ${arrPath.length} packs`, ENGINE.CSS);
        var toLoad = [];
        arrPath.forEach(function (el) {
          if (!el.dimension) {
            el.dimension = 4;
          }
          ASSET[el.name] = new LiveSPRITE(`${el.dimension}D`);
          toLoad.push({
            srcName: el.srcName,
            name: el.name,
            count: el.count,
            dimension: el.dimension
          });
        });
        ENGINE.LOAD.HMPacks = toLoad.length;
        if (ENGINE.LOAD.HMPacks) appendCanvas("Packs");
        const temp = Promise.all(
          toLoad.map((img) => loadImage(img, "Packs"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.packToSprite(el);
          });
        });
        return temp;
      }
      function loadSheets(arrPath = LoadSheets, addTag = ExtendSheetTag) {
        console.log(`%c ...loading ${arrPath.length} sheets`, ENGINE.CSS);
        var toLoad = [];
        var all_tags = ["left", "right", "front", "back", ...addTag];
        arrPath.forEach(function (el) {
          if (!el.dimension) {
            el.dimension = 4;
          }
          ASSET[el.name] = new LiveSPRITE(`${el.dimension}D`);
          let tag = all_tags.slice(0, el.dimension);
          for (let q = 0, TL = tag.length; q < TL; q++) {
            toLoad.push({
              srcName: el.srcName + "_" + tag[q] + "." + el.type,
              name: el.name + "_" + tag[q],
              count: el.count,
              tag: tag[q],
              parent: el.name
            });
          }
        });

        ENGINE.LOAD.HMSheets = toLoad.length;
        if (ENGINE.LOAD.HMSheets) appendCanvas("Sheets");
        const temp = Promise.all(
          toLoad.map((img) => loadImage(img, "Sheets"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.sheetToSprite(el);
          });
        });
        return temp;
      }
      function loadSheetSequences(arrPath = LoadSheetSequences) {
        console.log(`%c ...loading ${arrPath.length} sheet sequences`, ENGINE.CSS);
        var toLoad = [];
        arrPath.forEach(function (el) {
          ASSET[el.name] = new LiveSPRITE("1D");
          toLoad.push({
            srcName: el.srcName,
            name: el.name,
            count: el.count,
            trim: el.trim
          });
        });
        ENGINE.LOAD.HMSheetSequences = toLoad.length;
        if (ENGINE.LOAD.HMSheetSequences) appendCanvas("SheetSequences");
        const temp = Promise.all(
          toLoad.map((img) => loadImage(img, "SheetSequences"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.seqToSprite(el);
          });
        });
        return temp;
      }
      function loadRotated(arrPath = LoadRotated) {
        console.log(`%c ...loading ${arrPath.length} rotated sprites`, ENGINE.CSS);
        ENGINE.LOAD.HMRotated = arrPath.length;
        if (ENGINE.LOAD.HMRotated) appendCanvas("Rotated");

        const temp = Promise.all(
          arrPath.map((img) => loadImage(img, "Rotated"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            for (let q = el.rotate.first; q <= el.rotate.last; q += el.rotate.step) {
              ENGINE.rotateImage(el.img, q, el.name + "_" + q);
            }
          });
        });
        return temp;
      }
      function loadRotatedSheetSequences(arrPath = LoadRotatedSheetSequences) {
        console.log(`%c ...loading ${arrPath.length} rotated sheet sequences`, ENGINE.CSS);
        var toLoad = [];
        arrPath.forEach(function (el) {
          ASSET[el.name] = new LiveSPRITE("1D", []);
          toLoad.push({ srcName: el.srcName, name: el.name, count: el.count, rotate: el.rotate });
        });
        ENGINE.LOAD.HMRotSeq = toLoad.length;
        if (ENGINE.LOAD.HMRotSeq) appendCanvas("RotSeq");
        const temp = Promise.all(
          toLoad.map((img) => loadImage(img, "RotSeq"))
        )
          .then(function (obj) {
            let ready;
            obj.forEach(function (el) {
              let assetNames = ENGINE.seqToSprite(el);
              let createdSprites = ASSET[el.name].linear;

              ready = Promise.all(createdSprites.map((sprite) => isReady(sprite)))
                .then(
                  (obj) => {
                    obj.forEach((S, i) => {
                      for (let angle = el.rotate.first; angle <= el.rotate.last; angle += el.rotate.step) {
                        let name = `${assetNames[i]}_${angle}`;
                        ENGINE.rotateImage(S, angle, name);
                      }
                    });
                  }
                );
            });
            return ready;
          });
        return temp;
      }
      function isReady(sprite) {
        return new Promise((resolve, reject) => {
          sprite.onload = () => {
            resolve(sprite);
          };
        });
      }
      function loadWASM(arrPath = LoadExtWasm) {
        var LoadIntWasm = []; //internal hard coded ENGINE requirements
        var toLoad = [...arrPath, ...LoadIntWasm];
        console.log(`%c ...loading ${toLoad.length} WASM files`, ENGINE.CSS);
        ENGINE.LOAD.HMWASM = toLoad.length;
        if (ENGINE.LOAD.HMWASM) appendCanvas("WASM");
        const temp = Promise.all(
          toLoad.map((wasm) => loadWebAssembly(wasm, "WASM"))
        ).then((instance) => {
          instance.forEach(function (el) {
            ENGINE.linkToWasm(el);
          });
        });

        return temp;
      }
      function loadingSounds(arrPath = LoadAudio) {
        console.log(`%c ...loading ${arrPath.length} sounds`, ENGINE.CSS);
        ENGINE.LOAD.HMSounds = arrPath.length;
        if (ENGINE.LOAD.HMSounds) appendCanvas("Sounds");

        const temp = Promise.all(
          arrPath.map((audio) => loadAudio(audio, "Sounds"))
        ).then(function (obj) {
          obj.forEach(function (el) {
            ENGINE.audioToAudio(el);
          });
        });
      }
      function loadAllFonts(arrPath = LoadFonts) {
        console.log(`%c ...loading ${arrPath.length} fonts`, ENGINE.CSS);
        ENGINE.LOAD.HMFonts = arrPath.length;
        if (ENGINE.LOAD.HMFonts) {
          appendCanvas("Fonts");
          const temp = Promise.all(arrPath.map((font) => loadFont(font))).then(
            function (obj) {
              obj.map((x) => document.fonts.add(x));
              ENGINE.LOAD.Fonts = ENGINE.LOAD.HMFonts;
              ENGINE.drawLoadingGraph("Fonts");
            }
          );
        }
      }

      function loadImage(srcData, counter, dir = ENGINE.SOURCE) {
        var srcName, name, count, tag, parent, rotate, asset, trim, dimension;
        switch (typeof srcData) {
          case "string":
            srcName = srcData;
            name = srcName.substring(0, srcName.indexOf("."));
            break;
          case "object":
            srcName = srcData.srcName;
            name = srcData.name;
            count = srcData.count || null;
            tag = srcData.tag || null;
            parent = srcData.parent || null;
            rotate = srcData.rotate || null;
            asset = srcData.asset || null;
            trim = srcData.trim;
            dimension = srcData.dimension;
            if (trim === undefined) trim = true;
            break;
          default:
            console.error(`ENGINE: loadImage srcData ERROR: ${typeof srcData}`);
        }

        var src = dir + srcName;
        return new Promise((resolve, reject) => {
          const img = new Image();
          var obj = {
            img: img,
            name: name,
            count: count,
            tag: tag,
            parent: parent,
            rotate: rotate,
            asset: asset,
            trim: trim,
            dimension: dimension
          };
          img.onload = function () {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            resolve(obj);
          };
          img.onerror = (err) => reject(err);
          img.crossOrigin = "Anonymous";
          img.src = src;
        });
      }
      function loadAudio(srcData, counter, dir = ENGINE.AUDIO_SOURCE) {
        var srcName, name;
        switch (typeof srcData) {
          case "string":
            srcName = srcData;
            name = srcName.substr(0, srcName.indexOf("."));
            break;
          case "object":
            srcName = srcData.srcName;
            name = srcData.name;

            break;
          default:
            console.error(`ENGINE: loadAudio srcData ERROR: ${typeof srcData}`);
        }

        var src = dir + srcName;
        return new Promise((resolve, reject) => {
          const audio = new Audio();
          var obj = {
            audio: audio,
            name: name
          };

          audio.oncanplaythrough = function () {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            resolve(obj);
          };

          audio.onerror = (err) => resolve(err);
          audio.preload = "auto";
          audio.src = src;
          audio.load();
        });
      }
      function loadWebAssembly(fileName, counter) {
        fileName = ENGINE.WASM_SOURCE + fileName;
        return fetch(fileName)
          .then((response) => response.arrayBuffer())
          .then((bits) => WebAssembly.compile(bits))
          .then((module) => {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            return new WebAssembly.Instance(module);
          });
      }
      function loadFont(srcData, dir = ENGINE.FONT_SOURCE) {
        const fontSource = dir + srcData.srcName;
        const url = `url(${fontSource})`;
        const temp = new FontFace(srcData.name, url);
        return temp.load();
      }
    }
  },
  FRAME_COUNTERS: {
    STACK: [],
    display() {
      console.table(ENGINE.FRAME_COUNTERS.STACK, ["id", "count", "onFrame", "onEnd"]);
    },
    update() {
      ENGINE.FRAME_COUNTERS.STACK.forEach((counter) => counter.update());
    },
    clear() {
      ENGINE.FRAME_COUNTERS.STACK.clear();
    },
    remove(timerID) {
      for (let i = ENGINE.FRAME_COUNTERS.STACK.length - 1; i >= 0; i--) {
        if (ENGINE.FRAME_COUNTERS.STACK[i].id === timerID) {
          ENGINE.FRAME_COUNTERS.STACK.splice(i, 1);
          break;
        }
      }
    }
  },
  TIMERS: {
    STACK: [],
    remove(timerID) {
      for (let i = ENGINE.TIMERS.STACK.length - 1; i >= 0; i--) {
        if (ENGINE.TIMERS.STACK[i].id === timerID) {
          ENGINE.TIMERS.STACK.splice(i, 1);
          break;
        }
      }
    },
    access(timerID) {
      let index = this.index(timerID);
      if (index === -1) {
        console.error("Timer does not exists:", timerID);
        return null;
      }
      return this.STACK[index];
    },
    index(timerID) {
      for (let i = ENGINE.TIMERS.STACK.length - 1; i >= 0; i--) {
        if (ENGINE.TIMERS.STACK[i].id === timerID) {
          return i;
        }
      }
      return -1;
    },
    exists(timerID) {
      if (ENGINE.TIMERS.index(timerID) >= 0) {
        return true;
      } else return false;
    },
    stop() {
      ENGINE.TIMERS.STACK.forEach((timer) => timer.stop());
    },
    start() {
      ENGINE.TIMERS.STACK.forEach((timer) => timer.continue());
    },
    update() {
      ENGINE.TIMERS.STACK.forEach((timer) => timer.update());
    },
    display() {
      console.table(ENGINE.TIMERS.STACK, ["id", "delta", "now", "kwargs", "func", "value"]);
    },
    clear() {
      ENGINE.TIMERS.STACK.clear();
    }
  },
  TEXTUREGRID: {
    floorLayer: null,
    floorLayerString: null,
    wallLayer: null,
    wallLayerString: null,
    floorTexture: null,
    floorTextureString: null,
    wallTexture: null,
    wallTextureString: null,
    _3D_asset: null,
    _3D: true,
    _dynamic: true,
    dynamicAssets: { door: null, trapdoor: null, blockwall: null },
    configure(floorLayer, wallLayer, floorTexture, wallTexture) {
      ENGINE.TEXTUREGRID.setLayers(floorLayer, wallLayer);
      ENGINE.TEXTUREGRID.setTextures(floorTexture, wallTexture);
    },
    setLayers(floorLayer, wallLayer) {
      ENGINE.TEXTUREGRID.floorLayer = LAYER[floorLayer];
      ENGINE.TEXTUREGRID.floorLayerString = floorLayer;
      ENGINE.TEXTUREGRID.wallLayer = LAYER[wallLayer];
      ENGINE.TEXTUREGRID.wallLayerString = wallLayer;
    },
    set3D(asset, flag = true) {
      ENGINE.TEXTUREGRID._3D = flag;
      ENGINE.TEXTUREGRID._3D_asset = asset;
    },
    setTextures(floorTexture, wallTexture) {
      ENGINE.TEXTUREGRID.floorTexture = TEXTURE[floorTexture];
      ENGINE.TEXTUREGRID.floorTextureString = floorTexture;
      ENGINE.TEXTUREGRID.wallTexture = TEXTURE[wallTexture];
      ENGINE.TEXTUREGRID.wallTextureString = wallTexture;
    },
    corr(CTX, point) {
      CTX.setLineDash([1, 1]);
      CTX.strokeStyle = "#EEE";
      CTX.strokeRect(point.x, point.y, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    },
    draw(maze, corr = false) {
      let t0 = performance.now();
      ENGINE.fill(ENGINE.TEXTUREGRID.floorLayer, ENGINE.TEXTUREGRID.floorTexture);
      ENGINE.fill(ENGINE.TEXTUREGRID.wallLayer, ENGINE.TEXTUREGRID.wallTexture);

      for (let x = 0; x < maze.width; x++) {
        for (let y = 0; y < maze.height; y++) {
          let grid = new Grid(x, y);
          if (maze.GA.isEmpty(grid)) {
            let point = GRID.gridToCoord(grid);
            ENGINE.cutGrid(ENGINE.TEXTUREGRID.wallLayer, point);
            if (corr) ENGINE.TEXTUREGRID.corr(ENGINE.TEXTUREGRID.wallLayer, point);
          }
        }
      }
      ENGINE.flattenLayers(ENGINE.TEXTUREGRID.wallLayerString, ENGINE.TEXTUREGRID.floorLayerString);
      if (ENGINE.verbose) {
        console.log(`%cTEXTUREGRID draw ${performance.now() - t0} ms`, ENGINE.CSS);
      }
    },
    drawTiles(maze, corr = false) {
      let t0 = performance.now();
      for (let x = 0; x < maze.width; x++) {
        for (let y = 0; y < maze.height; y++) {
          let grid = new Grid(x, y);
          if (maze.GA.isWall(grid)) {
            ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID.wallTextureString].linear.chooseRandom());
          } else {
            ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID.floorTextureString].linear.chooseRandom());
            //3d embelish
            if (ENGINE.TEXTUREGRID._3D) {
              //
              if (maze.GA.isWall(grid.add(DOWN)) && maze.GA.isWall(grid.add(LEFT))) {
                ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[4]);
              }
              else if (maze.GA.isWall(grid.add(DOWN))) {
                if (maze.GA.isWall(grid.add(DownLeft))) {
                  ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[0]);
                } else {
                  ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[1]);
                }
              }
              else if (maze.GA.isWall(grid.add(DownLeft)) && maze.GA.notWall(grid.add(LEFT)) && maze.GA.notWall(grid.add(DOWN))) {
                ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[5]);
              }
              else if (maze.GA.isWall(grid.add(LEFT))) {
                if (maze.GA.isWall(grid.add(DownLeft))) {
                  ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[2]);
                } else {
                  ENGINE.drawToGrid(ENGINE.TEXTUREGRID.floorLayerString, grid, ASSET[ENGINE.TEXTUREGRID._3D_asset].linear[3]);
                }
              }
            }
            //dynamic
            if (ENGINE.TEXTUREGRID._dynamic) {
              if (maze.GA.isDoor(grid)) {
                ENGINE.drawToGrid(ENGINE.TEXTUREGRID.wallLayerString, grid, ASSET[ENGINE.TEXTUREGRID.dynamicAssets.door].linear.chooseRandom());
              }
              if (maze.GA.isTrapDoor(grid)) {
                ENGINE.drawToGrid(ENGINE.TEXTUREGRID.wallLayerString, grid, ASSET[ENGINE.TEXTUREGRID.dynamicAssets.trapdoor].linear.chooseRandom());
              }
              if (maze.GA.isBlockWall(grid)) {
                ENGINE.drawToGrid(ENGINE.TEXTUREGRID.wallLayerString, grid, ASSET[ENGINE.TEXTUREGRID.dynamicAssets.blockwall].linear.chooseRandom());
              }
            }
          }
          if (corr && maze.GA.notWall(grid)) ENGINE.TEXTUREGRID.corr(ENGINE.TEXTUREGRID.wallLayer, GRID.gridToCoord(grid));
        }
      }
      if (ENGINE.verbose) {
        console.log(`%cTEXTUREGRID tileDraw ${performance.now() - t0} ms`, ENGINE.CSS);
      }
    }
  },
  PACGRID: {
    draw(pacgrid, corr) {
      let t0 = performance.now();
      let sizeX = pacgrid.width;
      let sizeY = pacgrid.height;
      let CTX = ENGINE.PACGRID.layer;
      ENGINE.clearLayer(ENGINE.PACGRID.layerString);
      if (ENGINE.PACGRID.background) {
        ENGINE.fillLayer(ENGINE.PACGRID.layerString, ENGINE.PACGRID.background);
      }
      if (ENGINE.PACGRID.shadowColor) {
        CTX.shadowColor = ENGINE.PACGRID.shadowColor;
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
      } else {
        ENGINE.resetShadow(CTX);
      }
      CTX.strokeStyle = ENGINE.PACGRID.color;
      CTX.lineWidth = ENGINE.PACGRID.lineWidth;
      CTX.lineJoin = "round";
      for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
          let index = y * sizeX + x;
          let data = pacgrid.map[index];
          if (data === 0) {
            if (corr) {
              CTX.save();
              CTX.setLineDash([1, 2]);
              CTX.lineWidth = 1;
              CTX.globalAlpha = 0.5;
              dashRect(x, y);
              CTX.restore();
              continue;
            } else continue;
          }
          CTX.setLineDash([]);
          if (data === 1) {
            rect(x, y);
            continue;
          }
          if (data > 1) {
            let px = x * ENGINE.INI.GRIDPIX;
            let py = y * ENGINE.INI.GRIDPIX;
            let x1 = ENGINE.INI.GRIDPIX / 2 + px;
            let y1 = ENGINE.INI.GRIDPIX / 2 + py;
            let x2, y2;
            if (data & 4) {
              //up
              x2 = ENGINE.INI.GRIDPIX / 2 + px;
              y2 = 0 + py;
              line(x1, y1, x2, y2);
            }
            if (data & 8) {
              //right
              x2 = ENGINE.INI.GRIDPIX + px;
              y2 = ENGINE.INI.GRIDPIX / 2 + py;
              line(x1, y1, x2, y2);
            }
            if (data & 16) {
              //down
              x2 = ENGINE.INI.GRIDPIX / 2 + px;
              y2 = ENGINE.INI.GRIDPIX + py;
              line(x1, y1, x2, y2);
            }
            if (data & 32) {
              //left
              x2 = 0 + px;
              y2 = ENGINE.INI.GRIDPIX / 2 + py;
              line(x1, y1, x2, y2);
            }
            continue;
          }
        }
      }
      if (ENGINE.verbose)
        console.log(`%cPACGRID draw ${performance.now() - t0} ms`, ENGINE.CSS);

      function dashRect(x, y) {
        let px = x * ENGINE.INI.GRIDPIX;
        let py = y * ENGINE.INI.GRIDPIX;
        CTX.strokeRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      }
      function rect(x, y) {
        let px = x * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 4;
        let py = y * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 4;
        const round = ENGINE.PACGRID.round;
        CTX.roundRect(px, py, ENGINE.INI.GRIDPIX / 2, ENGINE.INI.GRIDPIX / 2, { upperLeft: round, upperRight: round, lowerLeft: round, lowerRight: round }, false, true);
      }
      function line(x1, y1, x2, y2) {
        CTX.beginPath();
        CTX.moveTo(x1, y1);
        CTX.lineTo(x2, y2);
        CTX.closePath();
        CTX.stroke();
      }
    },
    shadowColor: null,
    setShadow(color) {
      ENGINE.PACGRID.shadowColor = color;
    },
    round: 4,
    layer: null,
    layerString: null,
    setLayer(layer) {
      ENGINE.PACGRID.layerString = layer;
      ENGINE.PACGRID.layer = LAYER[layer];
    },
    color: null,
    setColor(color) {
      ENGINE.PACGRID.color = color;
    },
    lineWidth: 2,
    setLineWidth(w) {
      if (w <= 0 || w > 48) return;
      ENGINE.PACGRID.lineWidth = w;
    },
    background: null,
    setBackground(back) {
      ENGINE.PACGRID.background = back;
    },
    configure(width, layer, background, color, shadow = null) {
      ENGINE.PACGRID.setLayer(layer);
      ENGINE.PACGRID.setLineWidth(width, layer);
      ENGINE.PACGRID.setColor(color);
      ENGINE.PACGRID.setBackground(background);
      ENGINE.PACGRID.setShadow(shadow);
    }
  },
  BLOCKGRID: {
    draw(maze, corr) {
      let t0 = performance.now();
      var CTX = ENGINE.BLOCKGRID.layer;
      ENGINE.clearLayer(ENGINE.BLOCKGRID.layerString);
      let sizeX = parseInt(maze.width, 10);
      let sizeY = parseInt(maze.height, 10);
      for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
          let grid = new Grid(x, y);
          let value = maze.GA.getValue(grid);
          value &= 2 ** maze.GA.gridSizeBit - 1 - MAPDICT.FOG - MAPDICT.RESERVED;
          if (maze.GA.isMazeWall(grid)) {
            value &= 2 ** maze.GA.gridSizeBit - 1 - MAPDICT.WALL;
            ENGINE.BLOCKGRID.wall(x, y, CTX, value);
          } else {
            value &= 2 ** maze.GA.gridSizeBit - 1 - MAPDICT.RESERVED - MAPDICT.START_POSITION;
            if (value & MAPDICT.STAIR) {
              value = MAPDICT.STAIR;
            }
            ENGINE.BLOCKGRID.corr(x, y, CTX, value, corr);
          }
        }
      }
      if (ENGINE.verbose)
        console.log(`%cBLOCKGRID draw ${performance.now() - t0} ms`, ENGINE.CSS);
    },
    wall(x, y, CTX, value) {
      let FS;
      switch (value) {
        case MAPDICT.DOOR:
          FS = "brown";
          break;
        default:
          FS = "#999";
          break;
      }
      CTX.fillStyle = FS;
      let px = x * ENGINE.INI.GRIDPIX;
      let py = y * ENGINE.INI.GRIDPIX;
      CTX.fillRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    },
    corr(x, y, CTX, value, corr) {
      let FS;
      switch (value) {
        case MAPDICT.ROOM:
          FS = "#DDD";
          break;
        case MAPDICT.DOOR:
          FS = "#C8E6C9";
          break;
        case MAPDICT.STAIR:
          FS = "#87CEFA";
          break;
        default:
          FS = "#FFF";
          break;
      }
      CTX.fillStyle = FS;
      let px = x * ENGINE.INI.GRIDPIX;
      let py = y * ENGINE.INI.GRIDPIX;
      CTX.fillRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      if (corr) {
        CTX.setLineDash([1, 1]);
        CTX.strokeStyle = "#000";
        CTX.strokeRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      }
    },
    layer: null,
    layerString: null,
    setLayer(layer) {
      ENGINE.BLOCKGRID.layerString = layer;
      ENGINE.BLOCKGRID.layer = LAYER[layer];
    },
    color: null,
    setColor(color) {
      ENGINE.BLOCKGRID.color = color;
    },
    background: null,
    setBackground(back) {
      ENGINE.BLOCKGRID.background = back;
    },
    configure(layer, background, color) {
      ENGINE.BLOCKGRID.setLayer(layer);
      ENGINE.BLOCKGRID.setColor(color);
      ENGINE.BLOCKGRID.setBackground(background);
    }
  },
  VECTOR2D: {
    layer: null,
    layerString: null,
    configure(layer) {
      ENGINE.VECTOR2D.setLayer(layer);
    },
    setLayer(layer) {
      ENGINE.VECTOR2D.layerString = layer;
      ENGINE.VECTOR2D.layer = LAYER[layer];
    },
    draw(player = PLAYER) {
      //always draws player 2D representation
      let CTX = ENGINE.VECTOR2D.layer;
      CTX.fillStyle = "#000";
      CTX.strokeStyle = "#000";
      CTX.lineWidth = 1;
      CTX.miterLimit = 1;
      CTX.lineJoin = "round";
      let point = player.pos.toPoint();
      CTX.pixelAtPoint(point);
      let r = Math.round((ENGINE.INI.GRIDPIX * player.size) / 2);
      CTX.beginPath();
      CTX.arc(point.x, point.y, r, 0, 2 * Math.PI);
      CTX.moveTo(point.x, point.y);
      let end = point.translate(player.dir, r);
      CTX.lineTo(end.x, end.y);
      CTX.stroke();
    },
    drawBlock(monster) {
      monster.actor.updateOrientationWidths();
      let CTX = ENGINE.VECTOR2D.layer;
      CTX.fillStyle = "#000";
      CTX.strokeStyle = "#000";
      if (monster.type === "Missile") {
        CTX.strokeStyle = "#F00";
      }
      CTX.lineWidth = 1;
      let point = monster.moveState.pos.toPoint();
      let dir = monster.moveState.dir;
      let x = point.x - (monster.actor.frontWidth / 2) * Math.abs(dir.y) - (monster.actor.sideWidth / 2) * Math.abs(dir.x);
      let y = point.y - (monster.actor.frontWidth / 2) * Math.abs(dir.x) - (monster.actor.sideWidth / 2) * Math.abs(dir.y);

      CTX.beginPath();
      CTX.rect(x, y, monster.actor.orientationW, monster.actor.orientationH);
      if (monster.actor.orientationW + monster.actor.orientationH === 0) {
        CTX.strokeStyle = "#F00";
        CTX.rect(x, y, 5, 5);
      }
      CTX.moveTo(point.x, point.y);
      //let r = (monster.actor.orientationH / 2) * Math.abs(dir.y) + (monster.actor.orientationW / 2) * Math.abs(dir.x);
      let end = point.translate(dir, monster.r * ENGINE.INI.GRIDPIX);
      CTX.lineTo(end.x, end.y);
      CTX.stroke();
    }
  },
  RAYCAST_DRAW: {
    configure(floor, ceiling, wall) {
      this.floorTextureString = floor;
      this.ceilingTextureString = ceiling;
      this.wallTextureString = wall;
      this.floorTexture = TEXTURE[floor];
      this.ceilingTexture = TEXTURE[ceiling];
      this.wallTexture = TEXTURE[wall];
      this.floorData = ENGINE.getImgData(this.floorTexture);
      this.ceilingData = ENGINE.getImgData(this.ceilingTexture);
      this.wallData = ENGINE.getImgData(this.wallTexture);
    },
    draw(layerString) {
      let imageData = RAYCAST.renderView(
        ENGINE.RAYCAST_DRAW.floorData,
        ENGINE.RAYCAST_DRAW.ceilingData,
        ENGINE.RAYCAST_DRAW.wallData
      );
      LAYER[layerString].putImageData(imageData, 0, 0);
    },
    drawFilter(layerString, filters = [], ARG = []) {
      let imageData = RAYCAST.renderView(
        ENGINE.RAYCAST_DRAW.floorData,
        ENGINE.RAYCAST_DRAW.ceilingData,
        ENGINE.RAYCAST_DRAW.wallData
      );
      for (const [index, func] of filters.entries()) {
        func.call(null, imageData, ARG[index]);
      }
      LAYER[layerString].putImageData(imageData, 0, 0);
    }
  }
};
var TEXTURE = {};
var LAYER = {
  PRELOAD: {}
};
var SPRITE = {};
var AUDIO = {};
var TILE = {};
var ASSET = {
  convertToGrayScale(original, target, howmany = 1) {
    ASSET[target] = {};
    ASSET[target].type = ASSET[original].type;
    for (let face in ASSET[original]) {
      if (typeof ASSET[original][face] !== "object") continue;
      ASSET[target][face] = [];
      for (let i = 0, LN = ASSET[original][face].length; i < LN; i++) {
        let originalSprite = ASSET[original][face][i];
        ASSET[target][face].push(
          ENGINE.grayScaleImg(
            ASSET[original][face][i],
            `${target}_${face}_${i}`
          )
        );
      }
    }
  }
};
var WASM = {};
var MEMORY = {};
var PATTERN = {
  create(which) {
    var image = TEXTURE[which];
    var CTX = LAYER.temp;
    PATTERN[which] = CTX.createPattern(image, "repeat");
  }
};
class LiveSPRITE {
  constructor(type, left, right, front, back) {
    this.type = type || null;
    switch (type) {
      case "1D":
        this.linear = left || [];
        break;
      case "2D":
        this.left = left || [];
        this.right = right || [];
        break;
      case "4D":
        this.left = left || [];
        this.right = right || [];
        this.front = front || [];
        this.back = back || [];
        break;
      default:
        throw "LiveSPRITE type ERROR";
    }
  }
}
class ACTOR {
  constructor(sprite_class, x, y, orientation, asset, fps) {
    this.class = sprite_class;
    this.x = x || 0;
    this.y = y || 0;
    this.orientation = orientation || null;
    this.asset = asset || null;
    this.vx = 0;
    this.vy = 0;
    this.fps = fps || 30;
    this.nextSpriteTime = 1000 / this.fps;
    this.currentSpriteTime = 0;
    this.resetIndexes();
    if (this.class !== null) this.refresh();
    this.animationThrough = false;
    this.drawX = null;
    this.drawY = null;
    this.area = null;
  }
  simplify(name) {
    this.class = name;
    this.orientation = null;
    this.refresh();
  }
  resetIndexes() {
    this.left_index = 0;
    this.right_index = 0;
    this.front_index = 0;
    this.back_index = 0;
    this.linear_index = 0;
  }
  refresh() {
    if (this.orientation === null) {
      this.name = this.class;
    } else {
      switch (this.asset.type) {
        case "4D":
        case "2D":
          this.name = `${this.class}_${this.orientation}_${this[this.orientation + "_index"]}`;
          break;
        case "1D":
          this.name = `${this.class}_${this.linear_index.toString().padStart(2, "0")}`;
          break;
        default:
          throw "actor.refresh asset type ERROR";
      }
    }

    this.width = SPRITE[this.name].width;
    this.height = SPRITE[this.name].height;
  }
  sprite() {
    return SPRITE[this.name];
  }
  getOrientation(dir) {
    var orientation;
    if (this.asset.type === "1D") {
      orientation = "linear";
      return orientation;
    }
    switch (dir.x) {
      case 1:
        orientation = "right";
        break;
      case -1:
        orientation = "left";
        break;
      case 0:
        switch (dir.y) {
          case 1:
            orientation = "front";
            break;
          case -1:
            orientation = "back";
            break;
          case 0:
            orientation = "front";
            break;
        }
        break;
    }
    return orientation;
  }
  updateAnimation(time, orientation = this.orientation) {
    this.currentSpriteTime += time;
    if (this.currentSpriteTime >= this.nextSpriteTime) {
      this.currentSpriteTime -= this.nextSpriteTime;
      this.animateMove(orientation);
    }
  }
  animateMove(orientation = this.orientation) {
    this[orientation + "_index"]++;
    if (this[orientation + "_index"] >= this.asset[orientation].length) {
      this[orientation + "_index"] = 0;
      this.animationThrough = true;
    }
    this.refresh();
  }
  static gridToClass(grid, sprite_class) {
    var p = GRID.gridToCenterPX(grid);
    return new ACTOR(sprite_class, p.x, p.y);
  }
  setSpriteClass(spriteClass) {
    this.asset = ASSET[spriteClass];
    this.class = spriteClass;
    this.resetIndexes();
    this.animateMove(this.orientation);
  }
  setDraw(x, y) {
    this.drawX = x;
    this.drawY = y;
  }
  getDraw() {
    return new Grid(this.drawX, this.drawY);
  }
  setCoord(point) {
    this.x = point.x;
    this.y = point.y;
  }
  setArea() {
    this.area = new RectArea(this.x - Math.floor(this.width / 2), this.y - Math.floor(this.height / 2), this.width, this.height);
  }
}
class Gravity_ACTOR extends ACTOR {
  constructor(sprite_class, x, y, fps, orientation = 'left') {
    super(sprite_class, x, y, orientation, ASSET[sprite_class], fps);
  }
  setArea() {
    this.area = new RectArea(this.x - Math.floor(this.width / 2), this.y - this.height, this.width, this.height);
  }
}
class Rotating_ACTOR extends ACTOR {
  constructor(sprite_class, x, y, fps) {
    super(sprite_class, x, y, 'linear', ASSET[sprite_class], fps);
    this.drawX = this.x;
    this.drawY = this.y;
    this.angle = 0;
  }
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  setAngle(angle) {
    this.angle = angle;
  }
  sprite() {
    return SPRITE[`${this.name}_${this.angle}`];
  }
}
class Static_ACTOR {
  constructor(spriteClass) {
    this._sprite = SPRITE[spriteClass];
    this.name = spriteClass;
    this.width = this._sprite.width;
    this.height = this._sprite.height;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }
  sprite() {
    return this._sprite;
  }
  setDraw(x, y) {
    this.drawX = x;
    this.drawY = y;
  }
}
class Flat_ACTOR {
  constructor(spriteClass, parent = null) {
    this.flat = true;
    this.sprite = SPRITE[spriteClass];
    this.parent = parent;
  }
  getImageData() {
    return this.parent.getImageData();
  }
  face(rayDirection) {
    return null;
  }
}
class _3D_ACTOR {
  constructor(spriteClass, parent) {
    this.asset = ASSET[spriteClass];
    this.parent = parent;
    switch (this.asset.type) {
      case "4D":
        this.sequenceLength = this.asset.front.length;
        break;
      case "1D":
        this.sequenceLength = this.asset.linear.length;
        break;
    }
    this.now = 0;
    this.frontWidth = null;
    this.sideWidth = null;
    this.orientationW = null;
    this.orientationH = null;
    this.faceShown = null;
    this.width();
    this.updateOrientationWidths();
    this.nextSpriteTime = 1000 / parent.SPRITE_FPS;
    this.currentSpriteTime = 0;
    this.animationThrough = false;
  }
  changeClass(spriteClass) {
    this.asset = ASSET[spriteClass];
  }
  updateAnimation(time) {
    this.currentSpriteTime += time;
    if (this.currentSpriteTime >= this.nextSpriteTime) {
      this.currentSpriteTime -= this.nextSpriteTime;
      this.animateMove();
    }
  }
  animateMove() {
    this.now++;
    if (this.now === this.sequenceLength) {
      this.animationThrough = true;
    }
    this.now %= this.sequenceLength;
    this.width();
    this.updateOrientationWidths();
  }
  updateOrientationWidths() {
    if (this.asset.type === "1D") {
      this.orientationW = this.frontWidth;
      this.orientationH = this.frontWidth;
      return;
    }
    let dir = this.parent.moveState.dir;
    this.orientationW =
      Math.abs(dir.y) * this.frontWidth + Math.abs(dir.x) * this.sideWidth;
    this.orientationH =
      Math.abs(dir.x) * this.frontWidth + Math.abs(dir.y) * this.sideWidth;
  }
  width() {
    switch (this.asset.type) {
      case "4D":
        this.frontWidth = this.asset.front[this.now].width;
        this.sideWidth = this.asset.left[this.now].width;
        break;

      case "1D":
        this.frontWidth = this.asset.linear[this.now].width;
        this.sideWidth = this.asset.linear[this.now].width;
        break;
    }
  }
  face(rayDirection) {
    if (this.asset.type === "1D") {
      this.faceShown = "linear";
      return;
    }
    let aligned = rayDirection.ortoAlign();
    let angle = this.parent.moveState.dir.angleBetweenVectors(aligned);
    this.faceShown = this.angleToFace(angle);
  }
  angleToFace(angle) {
    if (!angle) return "front";
    let faces = ["front", "left", "back", "right"];
    let index = angle / 90;
    return faces[index];
  }
  getImageData() {
    let img = this.asset[this.faceShown][this.now];
    return ENGINE.getImgData(img);
  }
}
class _1D_MoveState {
  constructor(x, dir) {
    this.x = x;
    this.dir = dir;
  }
  move(dx) {
    this.x = this.x + this.dir * dx;
  }
  getX() {
    return Math.round(this.x);
  }
  setX(x) {
    console.assert(Number.isInteger(x), "X must be integer!");
    this.x = x;
  }
}
class MoveState {
  constructor(startGrid, dir, GA) {
    this.startGrid = Grid.toClass(startGrid);
    this.dir = dir || null;
    this.homeGrid = Grid.toClass(startGrid);
    this.endGrid = Grid.toClass(startGrid);
    this.pos = this.homeGrid; //compatibility with 3D MS
    this.moving = false;
    this.gridArray = null;
    if (GA) {
      this.linkGridArray(GA);
    }
  }
  linkGridArray(gridArray) {
    this.gridArray = gridArray;
  }
  setEnd(repeat = 1) {
    if (this.dir !== null) {
      this.endGrid = this.startGrid.add(this.dir.prolong(repeat));
      if (this.gridArray.outside(this.endGrid)) {
        this.endGrid = this.gridArray.toOtherSide(this.endGrid);
      }
      this.moving = true;
    }
  }
  next(dir, repeat = 1) {
    if (dir !== null) {
      this.startGrid = this.endGrid;
      this.dir = dir;
      this.setEnd(repeat);
    }
  }
  flip() {
    this.homeGrid = this.startGrid;
    this.startGrid = this.endGrid;
    this.endGrid = this.homeGrid;
  }
  reverse() {
    this.dir = this.dir.mirror();
    this.flip();
  }
  goingAway(MS) {
    let oldDistance = this.homeGrid.distance(MS.startGrid);
    let newDistance = this.homeGrid.distance(MS.startGrid.add(MS.dir));
    return newDistance > oldDistance;
  }
  towards(MS, tolerance = 5) {
    let oldDistance = this.homeGrid.distance(MS.startGrid);
    let newDistance = this.homeGrid.distance(MS.startGrid.add(MS.dir));
    return newDistance < oldDistance && newDistance < tolerance;
  }
  closerGrid(MS) {
    if (
      this.startGrid.distance(MS.homeGrid) < this.endGrid.distance(MS.homeGrid)
    ) {
      return this.startGrid;
    } else {
      return this.endGrid;
    }
  }
  reset(grid) {
    this.startGrid = Grid.toClass(grid);
    this.homeGrid = Grid.toClass(grid);
    this.endGrid = Grid.toClass(grid);
    this.moving = false;
  }
}
class _2D_MoveState {
  constructor(pos, dir, parent) {
    this.pos = pos;
    this.dir = dir || null;
    this.parent = parent || null;
  }
  posToCoord() {
    this.parent.actor.setCoord(GRID.gridToCoord(this.parent.moveState.pos));
  }
}
class _3D_MoveState {
  constructor(pos, dir) {
    this.pos = pos;
    this.dir = dir;
    this.moving = false;
    this.startPos = pos;
    this.endPos = pos;
    this.gridArray = null;
    this.realDir = null;
  }
  linkGridArray(gridArray) {
    this.gridArray = gridArray;
  }
  next(dir) {
    if (dir !== null || dir !== undefined) {
      this.startPos = this.endPos;
      this.dir = dir;
      this.endPos = this.startPos.add(this.dir);
      this.realDir = this.pos.direction(this.endPos);
      this.moving = true;
    } else throw "Dir null!";
  }
  start() {
    this.moving = true;
  }
  stop() {
    this.moving = false;
  }
}
var VIEW = {
  init() {
    VIEW.x = 0;
    VIEW.y = 0;
    VIEW.speed = 1;
    VIEW.actor = new ACTOR(null, 0, 0);
  },
  move(dir) {
    VIEW.actor.x += VIEW.speed * ENGINE.INI.GRIDPIX * dir.x;
    VIEW.actor.y += VIEW.speed * ENGINE.INI.GRIDPIX * dir.y;
    if (VIEW.actor.x < 0) VIEW.actor.x = 0;
    if (VIEW.actor.y < 0) VIEW.actor.y = 0;
    if (VIEW.actor.x > ENGINE.VIEWPORT.max.x) VIEW.actor.x = ENGINE.VIEWPORT.max.x;
    if (VIEW.actor.y > ENGINE.VIEWPORT.max.y) VIEW.actor.y = ENGINE.VIEWPORT.max.y;
    ENGINE.VIEWPORT.check(VIEW.actor);
    ENGINE.VIEWPORT.alignTo(VIEW.actor);
  }
};
var FORM = {
  INI: {
    DIV: "#ROOM",
    FONT: "Consolas",
    layer: "button",
    lettButtonPad: 8
  },
  set(div, layer) {
    this.setDiv(div);
    this.setLayer(layer);
  },
  setDiv(div) {
    this.INI.DIV = `#${div}`;
  },
  setLayer(layer) {
    this.INI.layer = layer;
  },
  BUTTON: {
    POOL: [],
    draw() {
      ENGINE.clearLayer(FORM.INI.layer);
      for (let q = 0; q < FORM.BUTTON.POOL.length; q++) {
        FORM.BUTTON.POOL[q].draw();
      }
    },
    changeMousePointer(cname) {
      for (let q = 0; q < FORM.BUTTON.POOL.length; q++) {
        let button = FORM.BUTTON.POOL[q];
        if (button.within()) {
          ENGINE.mousePointer(cname);
          return;
        }
      }
      ENGINE.mouseDefault(cname);
    },
    click() {
      for (let q = 0; q < FORM.BUTTON.POOL.length; q++) {
        let button = FORM.BUTTON.POOL[q];
        if (button.within()) {
          button.handler.call();
          return;
        }
      }
      return;
    }
  }
};
class Form {
  constructor(name, x, y, w, h, wedge) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    $(FORM.INI.DIV).append(`<div id = 'FORM' class = 'form'><h1>${this.name}</h1><hr></div>`);
    $("#FORM").css({ top: this.y, left: this.x, width: this.w, height: this.h });
    $("#FORM").append(wedge);
    ENGINE.showMouse();
  }
}
class Inventory {
  constructor() {
    this.list = [];
  }
  clear() {
    this.list = [];
  }
  add(element) {
    for (let q = 0, QL = this.list.length; q < QL; q++) {
      let item = this.list[q].object;
      if (element.id === item.id) {
        this.list[q].count++;
        return;
      }
    }
    this.list.push(new Item(element, 1));
  }
  remove(index) {
    let element = this.list[index].object;
    this.list[index].count--;
    if (this.list[index].count === 0) this.list.splice(index, 1);
    return element;
  }
  size() {
    return this.list.length;
  }
  info(index, prop) {
    return this.list[index].object[prop];
  }
  find(prop, value) {
    for (let q = 0, QL = this.list.length; q < QL; q++) {
      let item = this.list[q].object;
      if (item[prop] === value) return q;
    }
    return null;
  }
  getCount(prop, value) {
    let index = this.find(prop, value);
    if (index !== null) {
      return this.list[index].count;
    } else return 0;
  }
  display() {
    console.table("Inventory:", this.list);
  }
  stringify() {
    let list = [];
    this.list.forEach((item) => {
      list.push([item.count]);
      let idx = list.length - 1;
      for (const def of item.object.saveDefinition) {
        list[idx].push(item.object[def]);
      }
    });
    let str = JSON.stringify(list);
    return str;
  }
  objectify(str) {
    const list = JSON.parse(str);
    list.forEach((item) => {
      let className = item[1];
      let obj = eval(className);
      obj = new obj(item[2]); //all arguments 2 ->
      let count = item[0];
      do {
        this.add(obj);
        count--;
      } while (count > 0);
    });
  }
}
class Item {
  constructor(object, count) {
    this.object = object;
    this.count = count;
  }
}
class FrameCounter {
  constructor(id, frames, onFrame, onEnd) {
    this.register();
    this.id = id;
    this.count = frames;
    this.onFrame = onFrame;
    this.onEnd = onEnd;
  }
  register() {
    ENGINE.FRAME_COUNTERS.STACK.push(this);
  }
  unregister() {
    ENGINE.FRAME_COUNTERS.remove(this.id);
  }
  update() {
    this.count--;
    this.onFrame.call(this);
    if (this.count <= 0) this.quit();
  }
  quit() {
    this.unregister();
    this.onEnd.call(this);
  }
}
class Timer {
  constructor(id) {
    this.id = id;
    this.start = Date.now();
    this.end = null;
    this.delta = 0;
    this.now = 0;
    this.runs = true;
    this.register();
    this.class = this.constructor.name;
  }
  load(template) {
    this.delta = template.delta;
  }
  update() {
    this.now = (this.delta + (Date.now() - this.start)) / 1000;
    if (this.constructor.name === "CountDown") {
      if (this.now >= this.value) this.quit();
    }
  }
  time(time) {
    if (this.runs) {
      time = (time || this.delta + (Date.now() - this.start)) / 1000;
    } else {
      time = this.delta / 1000;
    }
    let hours = Math.floor(time / 3600);
    let min = Math.floor((time % 3600) / 60);
    let sec = Math.floor((time % 3600) % 60);
    return {
      h: hours,
      m: min,
      s: sec
    };
  }
  timeString() {
    let time = this.time();
    let str = time.h.toString().padStart(2, "0") + ":";
    str += time.m.toString().padStart(2, "0") + ":";
    str += time.s.toString().padStart(2, "0");
    return str;
  }
  stop() {
    this.runs = false;
    this.end = Date.now();
    this.delta += this.end - this.start;
    this.start = this.end;
  }
  continue() {
    this.runs = true;
    this.start = Date.now();
    this.end = null;
  }
  register() {
    ENGINE.TIMERS.STACK.push(this);
  }
  unregister() {
    ENGINE.TIMERS.remove(this.id);
  }
}
class CountDown extends Timer {
  constructor(id, seconds, func, kwargs) {
    super(id);
    this.value = seconds;
    this.func = func;
    this.kwargs = kwargs || null;
  }
  extend(value) {
    this.value += value;
  }
  set(value) {
    this.value = value;
  }
  reset() {
    this.now = 0;
  }
  quit() {
    this.unregister();
    this.func.call(this);
  }
  remains() {
    return this.value - this.now;
  }
}
var CONSOLE = {
  id: "Console",
  set(id) {
    CONSOLE.id = id;
  },
  print(text) {
    $(`#${CONSOLE.id}`).append(`<p>${text}</p>`);
    $(`#${CONSOLE.id}`).children().last()[0].scrollIntoView();
    $(window).scrollTop($("#game").offset().top);
  }
};
class RenderData {
  constructor(
    font,
    fontSize,
    color,
    layer,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    shadowBlur
  ) {
    this.layerName = layer;
    this.layer = LAYER[layer];
    this.layer.font = `${fontSize}px ${font}`;
    this.layer.fillStyle = color;
    this.layer.textAlign = "left";
    this.layer.shadowColor = shadowColor || "#000";
    this.layer.shadowOffsetX = shadowOffsetX || 0;
    this.layer.shadowOffsetY = shadowOffsetY || 0;
    this.layer.shadowBlur = shadowBlur || 0;
    this.fs = fontSize;
  }
}
class VerticalScrollingText {
  constructor(text, speed, renderData) {
    this.text = text;
    this.speed = speed;
    this.RD = renderData;
    this.textArray = this.text.split('\n').map(x => x.trim(" "));
    this.lineHeight = Math.round(1.1 * this.RD.fs);
    this.cw = this.RD.layer.canvas.width;
    this.ch = this.RD.layer.canvas.height;
    this.measureLineWidths();
    this.maxWidth = Math.max(...this.lineWidths);
    console.assert(this.maxWidth <= this.cw, "Line too wide for layer -  ERROR");
    this.cursorX = Math.max(((this.cw - this.maxWidth) / 2) | 0, 0);
    this.bottomY = this.ch + this.lineHeight;
    this.reset();
  }
  reset() {
    this.cursorY = this.ch + this.lineHeight;
    this.firstLine = 0;
    this.lastLine = 0;
  }
  measureLineWidths() {
    let LN = this.textArray.length;
    this.lineWidths = [];
    for (let i = 0; i < LN; i++) {
      this.lineWidths.push(Math.ceil(this.RD.layer.measureText(this.textArray[i]).width));
    }
  }
  process() {
    let LN = this.textArray.length;
    this.cursorY -= this.speed;

    if (this.bottomY - this.cursorY >= this.lineHeight * (this.lastLine + 1 - this.firstLine)) {
      this.lastLine++;
    }
    if (this.cursorY <= 0) {
      this.cursorY = this.lineHeight;
      this.firstLine++;
    }
    if (this.lastLine >= LN) {
      if (this.firstLine >= LN) {
        this.reset();
      } else this.lastLine = LN - 1;
    }

  }
  draw() {
    let CTX = this.RD.layer;
    ENGINE.clearLayer(this.RD.layerName);
    for (let i = this.firstLine; i <= this.lastLine; i++) {
      let actualY = this.cursorY + this.lineHeight * (i - this.firstLine);
      CTX.fillText(this.textArray[i], this.cursorX, actualY);
    }
  }
}
class MovingText {
  constructor(text, speed, renderData, area) {
    this.text = text;
    this.length = this.text.length;
    this.speed = speed;
    this.RD = renderData;
    this.AREA = area;
    this.nodes = this.measureNodes();
    this.visible = null;
    this.y = Math.floor(this.AREA.h / 2) + this.AREA.x;
    this.left = this.AREA.x;
    this.right = this.AREA.x + this.AREA.w - 1;
    this.reset();
  }
  reset() {
    this.first = 0;
    this.last = 0;
    this.cursor = this.AREA.x + this.AREA.w - 1;
  }
  measureNodes() {
    let temp = [];
    let LN = this.text.length;
    let start = 0;
    for (let i = 0; i < LN; i++) {
      let char = this.text[i];
      let width = Math.ceil(this.RD.layer.measureText(char).width);
      temp.push({ char: char, offset: start, width: width });
      start += width;
    }
    return temp;
  }
  process() {
    this.visible = this.text.substr(this.first, this.last - this.first + 1);
    this.cursor -= this.speed;
    while (this.cursor + this.nodes[this.first].width <= this.left) {
      this.cursor += this.nodes[this.first].width;
      this.first++;
      if (this.first === this.length) {
        this.reset();
        return;
      }
    }
    if (this.last < this.length - 1) {
      while (this.cursor + (this.nodes[this.last].offset - this.nodes[this.first].offset) + this.nodes[this.last].width < this.right) {
        this.last++;
      }
    }
    return;
  }
  draw() {
    ENGINE.clearLayer(this.RD.layerName);
    this.drawWithWidth();
  }
  drawWithWidth() {
    let x = this.cursor;
    let now = this.first;
    while (now <= this.last) {
      this.RD.layer.fillText(this.nodes[now].char, x, this.y);
      x += this.nodes[now].width;
      now++;
    }
  }
}
class Area {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  gridWithin(grid) {
    return this.within(grid.x, grid.y);
  }
  within(X, Y) {
    if (
      X >= this.x &&
      X < this.x + this.w &&
      Y >= this.y &&
      Y < this.y + this.h
    ) {
      return true;
    } else return false;
  }
  overlap(area) {
    if (this.x > area.x + area.w) return false;
    if (this.x + this.w < area.x) return false;
    if (this.y > area.y + area.h) return false;
    if (this.y + this.h < area.y) return false;
    return true;
  }
}
class Button {
  constructor(text, area, col, handler) {
    this.text = text;
    this.area = area;
    this.colInfo = col;
    this.handler = handler;
  }
  draw() {
    let CTX = LAYER[FORM.INI.layer];
    if (this.colInfo.back) {
      CTX.fillStyle = this.colInfo.back;
      CTX.fillRect(this.area.x, this.area.y, this.area.w, this.area.h);
    }
    if (this.colInfo.border) {
      CTX.strokeStyle = this.colInfo.border;
      CTX.strokeRect(this.area.x, this.area.y, this.area.w, this.area.h);
    }

    CTX.save();
    CTX.font = `${this.colInfo.fontSize}px ${FORM.INI.FONT}`;
    CTX.fillStyle = this.colInfo.ink;
    let x = FORM.INI.lettButtonPad + this.area.x;
    let y = this.area.y + this.colInfo.fontSize + Math.round((this.area.h - this.colInfo.fontSize) / 2) - 1;
    if (this.colInfo.inkShadow) {
      CTX.shadowColor = this.colInfo.inkShadow;
      CTX.shadowOffsetX = 1;
      CTX.shadowOffsetY = 1;
      CTX.shadowBlur = 1;
    }
    CTX.fillText(this.text, x, y);
    CTX.restore();
  }
  within() {
    return this.area.within(ENGINE.mouseX, ENGINE.mouseY);
  }
}
class ColorInfo {
  constructor(ink, inkShadow, back, border, fontSize) {
    this.ink = ink;
    this.inkShadow = inkShadow;
    this.back = back;
    this.border = border;
    this.fontSize = fontSize;
  }
}
class FancyText {
  constructor(text, x, y, renderData, colors) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.RD = renderData;
    this.colors = colors;
    this.nodes = this.measureNodes();
    this.colorIndex = 0;
  }
  next() {
    this.colorIndex++;
    this.colorIndex = Math.abs(this.colorIndex % this.colors.length);
  }
  draw() {
    ENGINE.clearLayer(this.RD.layerName);
    let LN = this.nodes.length;
    let CTX = this.RD.layer;
    for (let q = 0; q < LN; q++) {
      CTX.fillStyle = this.colors[this.colorIndex];
      let shadow = Math.abs(this.colorIndex + (1 % this.colors.length));
      CTX.shadowColor = this.colors[shadow];
      CTX.fillText(this.nodes[q].char, this.x + this.nodes[q].offset, this.y);
      this.next();
    }
  }
  measureNodes() {
    let temp = [];
    let LN = this.text.length;
    let start = 0;
    for (let i = 0; i < LN; i++) {
      let char = this.text[i];
      let width = Math.ceil(this.RD.layer.measureText(char).width);
      temp.push({ char: char, offset: start, width: width });
      start += width;
    }
    return temp;
  }
}
class FPS_measurement {
  constructor() {
    this.reset();
  }
  reset() {
    this.count = 0;
    this.average = 0;
  }
  update(fps) {
    this.average = (this.count * this.average + fps) / ++this.count;
  }
  getFps() {
    return this.average.toFixed(1);
  }
}
class FPS_short_term_measurement extends FPS_measurement {
  constructor(len = 100) {
    super();
    this.len = len;
  }
  reset() {
    this.data = [];
    this.average = 0;
  }
  update(fps) {
    this.data.push(fps);
    if (this.data.length > this.len) {
      this.data.shift();
    }
    this.average = this.data.average();
  }
}
var FILTER = {
  DarkShift(imageData, arg) {
    let rigthShift = arg.shift;
    let DATA = imageData.data;
    for (let pix = 0, LN = DATA.length; pix <= LN; pix += 4) {
      for (let offset = 0; offset < 3; offset++) {
        DATA[pix + offset] = DATA[pix + offset] >>> rigthShift;
      }
    }
  }
};
//END
console.log(`%cENGINE ${ENGINE.VERSION} loaded.`, ENGINE.CSS);