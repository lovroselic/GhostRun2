/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

//////////////////engine.js/////////////////////////

/*  

TODO:
      
*/

////////////////////////////////////////////////////

// Asset map
var LoadTextures = null;
var LoadSprites = null;
var LoadSequences = null;
var LoadSheets = null;
var ExtendSheetTag = [];
var LoadPacks = null;
var LoadRotated = null;
var LoadExtWasm = null;
var LoadAudio = null;
var LoadFonts = null;
var LoadRotatedSheetSequences = null;
var LoadSheetSequences = null;
var LoadShaders = null;
var LoadObjects = null;
var LoadModels = null;

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
  VERSION: "4.06",
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
  verbose: false,
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
  SOURCE: "/Assets/Graphics/",
  TEXTURE_SOURCE: "/Assets/Graphics/Textures/",
  SPRITE_SOURCE: "/Assets/Graphics/Sprites/",
  ROTATED_SPRITE_SOURCE: "/Assets/Graphics/Sprites/Rotated/",
  SHEET_SQUENCE_SOURCE: "/Assets/Graphics/SheetSequences/",
  SHEETS_SOURCE: "/Assets/Graphics/Sheets/",
  ROTATED_SHEET_SQUENCE_SOURCE: "/Assets/Graphics/RotatedSheetSequences/",
  PACK_SOURCE: "/Assets/Graphics/Packs/",
  WASM_SOURCE: "/Assets/WASM/",
  AUDIO_SOURCE: "/Assets/Sounds/",
  FONT_SOURCE: "/Assets/Fonts/",
  SHADER_SOURCE: "/Code/GLSL/Shaders/",
  OBJECT_SOURCE: "/Assets/Objects/",
  MODEL_SOURCE: "/Assets/Models/",
  checkProximity: true, //check proximity before pixel perfect evaluation of collision to background //very obsolete!!
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
    $(document).on('keydown keyup keypress', function (event) {
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
  fill(CTX, pattern) {
    let pat = CTX.createPattern(pattern, "repeat");
    CTX.fillStyle = pat;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  resizeCanvas(img, targetSize) {
    LAYER.temp.canvas.width = targetSize;
    LAYER.temp.canvas.height = targetSize;
    LAYER.temp.drawImage(img, 0, 0, img.width, img.height, 0, 0, targetSize, targetSize);
    return LAYER.temp.canvas;
  },
  conditionalResize(img, targetSize) {
    const dim = Math.max(img.width, img.height);
    if (dim > targetSize) return ENGINE.resizeCanvas(img, targetSize);
    return img;
  },
  resizeAndFill(CTX, pattern, targetSize) {
    const resizedPattern = CTX.createPattern(ENGINE.resizeCanvas(pattern, targetSize), 'repeat');
    CTX.fillStyle = resizedPattern;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  conditionalResizeAndFill(CTX, pattern, targetSize) {
    const resizedPattern = CTX.createPattern(ENGINE.conditionalResize(pattern, targetSize), 'repeat');
    CTX.fillStyle = resizedPattern;
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
      prop = alias.shift();
      canvasElement = `<canvas class='layer' 
      id='${id}_canvas_${x}' width='${width}' height='${height}' 
      style='z-index:${x}; top:${ENGINE.currentTOP}px; left:${ENGINE.currentLEFT}px' title='${prop}'></canvas>`;
      $(`#${id}`).append(canvasElement);

      if (prop.startsWith("3d_")) {
        LAYER[prop.substring(3)] = $(`#${id}_canvas_${x}`)[0].getContext("webgl2");
      } else {
        LAYER[prop] = $(`#${id}_canvas_${x}`)[0].getContext("2d");
      }
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
  drawToId(id, X, Y, image, clear = true, center = true) {
    let CTX = $(`#${id}`)[0].getContext("2d");
    if (clear) ENGINE.clearContext(CTX);
    if (center) {
      X = (CTX.canvas.width - image.width) / 2;
      Y = (CTX.canvas.height - image.height) / 2;
    }
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
    let PL = pool.length;
    if (PL === 0) return;
    for (let i = 0; i < PL; i++) {
      ENGINE.spriteDraw(layer, pool[i].x, pool[i].y, sprite);
    }
  },
  drawRectangleCW(CTX, point, dir, w, h, fillColor) {
    CTX.fillStyle = fillColor;
    CTX.beginPath();
    CTX.moveTo(point.x, point.y); //1
    point = point.translate(dir, w);
    CTX.lineTo(point.x, point.y); //2
    dir = dir.cw();
    point = point.translate(dir, h);
    CTX.lineTo(point.x, point.y); //3
    dir = dir.cw();
    point = point.translate(dir, w);
    CTX.lineTo(point.x, point.y); //4
    CTX.closePath();
    CTX.fill();
    return;
  },
  drawLine(CTX, pFrom, pTo, color, width) {
    CTX.beginPath();
    CTX.moveTo(pFrom.x, pFrom.y);
    CTX.lineTo(pTo.x, pTo.y);
    CTX.strokeStyle = color;
    CTX.lineWidth = width;
    CTX.stroke();
  },
  drawCircle(CTX, pCenter, radius, color) {
    CTX.beginPath();
    CTX.arc(pCenter.x, pCenter.y, radius, 0, 2 * Math.PI);
    CTX.fillStyle = color;
    CTX.fill();
  },
  trimCanvas(data) {
    let top = 0;
    let bottom = data.height;
    let left = 0;
    let right = data.width;
    const width = data.width;

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
    let trimmed = CTX.getImageData(TRIM.left, TRIM.top, TRIM.right - TRIM.left, TRIM.bottom - TRIM.top);
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
    /**
     * might be already redundant, check current uses
     */
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
    /**
     * deprecated - redesign required
     * candidate for removal
     */
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
    CTX.fillStyle = "#DDE0DD";
    CTX.fillRect(1, 1, Math.floor((ENGINE.LOAD_W - 2) * (percent / 100)), ENGINE.LOAD_H - 2);
    CTX.fillStyle = "black";
    CTX.font = "10px Verdana";
    CTX.fillStyle = "666";
    CTX.fillText(`${text}: ${percent}%`, ENGINE.LOAD_W * 0.1, ENGINE.LOAD_H * 0.62);
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
  parseObjectFile(text) {
    if (!ELEMENT) console.error("no ELEMENT object available!");
    const positions = [[0, 0, 0]];
    const textureCoordinates = [[0, 0]];
    const vertexNormals = [[0, 0, 0]];

    const objVertexData = [positions, textureCoordinates, vertexNormals];
    let webglVertexData = [[], [], [],];
    let NAME = null;

    const keywords = {
      o(parts) {
        NAME = parts[0];
      },
      v(parts) {
        positions.push(parts.map(parseFloat));
      },
      vn(parts) {
        vertexNormals.push(parts.map(parseFloat));
      },
      vt(parts) {
        textureCoordinates.push(parts.map(parseFloat));
      },
      s() { },              //not supported
      mtllib() { },         //not supported
      usemtl() { },         //not supported
      f(parts) {
        const numTriangles = parts.length - 2;
        for (let tri = 0; tri < numTriangles; ++tri) {
          addVertex(parts[0]);
          addVertex(parts[tri + 1]);
          addVertex(parts[tri + 2]);
        }
      }
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim();
      if (line === '' || line.startsWith('#')) continue;
      const m = keywordRE.exec(line);
      const [, keyword, _] = m;
      const parts = line.split(/\s+/).slice(1);
      const handler = keywords[keyword];
      if (!handler) {
        console.warn('unhandled keyword:', keyword);
        continue;
      }
      handler(parts);
    }

    let indices = [];
    for (let c = 0; c < webglVertexData[0].length / 3; c++) {
      indices.push(c);
    }

    ELEMENT[NAME] = {};
    ELEMENT[NAME].positions = webglVertexData[0];
    ELEMENT[NAME].indices = indices;
    ELEMENT[NAME].textureCoordinates = webglVertexData[1];
    ELEMENT[NAME].vertexNormals = webglVertexData[2];

    function addVertex(vert) {
      const ptn = vert.split('/');
      ptn.forEach((objIndexStr, i) => {
        const objIndex = parseInt(objIndexStr);
        const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
        webglVertexData[i].push(...objVertexData[i][index]);
      });
    }

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
      LTC: 226,
      1: 49,
      3: 51,
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
      16: false,    //shift
      17: false,    //CTRL
      37: false,    //LEFT
      38: false,    //UP
      39: false,    //RIGHT
      40: false,    //Down
      32: false,    //SPACE
      13: false,    //ENTER
      113: false,   //F2
      115: false,   //F4
      120: false,   //F9
      119: false,   //F8
      118: false,   //F7
      65: false,    //A
      68: false,    //D
      67: false,    //C
      8: false,     //back
      9: false,     //tab
      72: false,    //h
      77: false,    //m
      81: false,    //q
      69: false,    //e
      87: false,    //w
      83: false,    //s
      60: false,    //lt
      226: false,    //lt-chrome
      49: false,     //1
      51: false,     //3
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
    Shaders: 0,
    Objects: 0,
    Models: 0,
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
    HMShaders: null,
    HMObjects: null,
    HMModels: null,

    async preload() {
      console.time("preloading");
      console.group("preload");
      console.log("%cPreloading ...", ENGINE.CSS);
      const allPromises = [
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
        loadAllFonts(),
        loadShaders(),
        loadObjects(),
        loadGLTF(),
      ];

      await Promise.allSettled(allPromises);
      console.log("%cAll assets loaded and ready!", ENGINE.CSS);
      console.log("%c****************************", ENGINE.CSS);
      console.groupEnd("preload");
      console.timeEnd("preloading");
      ENGINE.ready();

      function appendCanvas(name) {
        let id = `preload_${name}`;
        $("#load").append(`<canvas id ='${id}' width='${ENGINE.LOAD_W}' height='${ENGINE.LOAD_H}'></canvas>`);
        LAYER.PRELOAD[name] = $("#" + id)[0].getContext("2d");
      }

      async function loadTextures(arrPath = LoadTextures) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} textures`, ENGINE.CSS);
          ENGINE.LOAD.HMTextures = arrPath.length;
          if (ENGINE.LOAD.HMTextures) appendCanvas("Textures");

          const obj = await Promise.all(arrPath.map((img) => loadImage(img, "Textures", ENGINE.TEXTURE_SOURCE)));
          obj.forEach(function (el) {
            ENGINE.imgToTexture(el);
          });

          return true;
        } catch (error) {
          console.error(`Failed to load textures: ${error}`);
          return false;
        }
      }

      async function loadSprites(arrPath = LoadSprites) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} sprites`, ENGINE.CSS);
          ENGINE.LOAD.HMSprites = arrPath.length;
          if (ENGINE.LOAD.HMSprites) appendCanvas("Sprites");
          const obj = await Promise.all(arrPath.map((img) => loadImage(img, "Sprites", ENGINE.SPRITE_SOURCE)));
          obj.forEach(function (el) {
            ENGINE.imgToSprite(el);
          });
          return true;
        } catch (error) {
          console.error(`Failed to load sprites: ${error}`);
          return false;
        }
      }

      async function loadSequences(arrPath = LoadSequences) {
        try {
          if (!arrPath) return true;
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
          const obj = await Promise.all(
            toLoad.map((img) => loadImage(img, "Sequences"))
          );

          obj.forEach(function (el) {
            ENGINE.imgToSprite(el);
            ENGINE.spriteToAsset(el);
          });

          return true;
        } catch (error) {
          console.error(`Failed to load sequences: ${error}`);
          return false;
        }
      }

      async function loadPacks(arrPath = LoadPacks) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} packs`, ENGINE.CSS);
          var toLoad = [];
          arrPath.forEach(function (el) {
            el.dimension = el.dimension || 4;
            ASSET[el.name] = new LiveSPRITE(`${el.dimension}D`);
            toLoad.push({ srcName: el.srcName, name: el.name, count: el.count, dimension: el.dimension });
          });
          ENGINE.LOAD.HMPacks = toLoad.length;
          if (ENGINE.LOAD.HMPacks) appendCanvas("Packs");
          const obj = await Promise.all(toLoad.map((img) => loadImage(img, "Packs", ENGINE.PACK_SOURCE)));
          obj.forEach(function (el) {
            ENGINE.packToSprite(el);
          });
          return true;
        } catch (error) {
          console.error(`Failed to load packs: ${error}`);
          return false;
        }
      }

      async function loadSheets(arrPath = LoadSheets, addTag = ExtendSheetTag) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} sheets`, ENGINE.CSS);

          const allTags = ["left", "right", "front", "back", ...addTag];
          const toLoad = [];

          for (const el of arrPath) {
            const dimension = el.dimension || 4;
            ASSET[el.name] = new LiveSPRITE(`${dimension}D`);
            const tags = allTags.slice(0, dimension);
            for (const tag of tags) {
              const srcName = `${el.srcName}_${tag}.${el.type}`;
              const name = `${el.name}_${tag}`;
              toLoad.push({ srcName, name, count: el.count, tag, parent: el.name });
            }
          }

          ENGINE.LOAD.HMSheets = toLoad.length;
          if (ENGINE.LOAD.HMSheets) appendCanvas("Sheets");
          const sheets = await Promise.all(toLoad.map((img) => loadImage(img, "Sheets", ENGINE.SHEETS_SOURCE)));
          for (const el of sheets) {
            ENGINE.sheetToSprite(el);
          }
          return true;
        } catch (error) {
          console.error(`Failed to load sheets: ${error}`);
          return false;
        }
      }

      async function loadSheetSequences(arrPath = LoadSheetSequences) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} sheet sequences`, ENGINE.CSS);
          const toLoad = arrPath.map(({ name, srcName, count, trim }) => {
            ASSET[name] = new LiveSPRITE("1D");
            return { name, srcName, count, trim };
          });

          ENGINE.LOAD.HMSheetSequences = toLoad.length;
          if (ENGINE.LOAD.HMSheetSequences) appendCanvas("SheetSequences");
          const sequences = await Promise.all(toLoad.map((img) => loadImage(img, "SheetSequences", ENGINE.SHEET_SQUENCE_SOURCE)));
          sequences.forEach((el) => ENGINE.seqToSprite(el));
          return true;
        } catch (error) {
          console.error(`Failed to load sheet sequences: ${error}`);
          return false;
        }
      }

      async function loadRotated(arrPath = LoadRotated) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} rotated sprites`, ENGINE.CSS);
          ENGINE.LOAD.HMRotated = arrPath.length;
          if (ENGINE.LOAD.HMRotated) appendCanvas("Rotated");
          const images = await Promise.all(arrPath.map(img => loadImage(img, "Rotated", ENGINE.ROTATED_SPRITE_SOURCE)));

          for (const { img, rotate, name } of images) {
            for (let q = rotate.first; q <= rotate.last; q += rotate.step) {
              ENGINE.rotateImage(img, q, name + "_" + q);
            }
          }

          return true;
        } catch (error) {
          console.error(`Failed to load rotated sprites: ${error}`);
          return false;
        }
      }

      async function loadRotatedSheetSequences(arrPath = LoadRotatedSheetSequences) {
        try {
          if (!arrPath) return true;
          console.log(`%c ...loading ${arrPath.length} rotated sheet sequences`, ENGINE.CSS);

          const toLoad = arrPath.map(({ name, srcName, count, rotate }) => {
            ASSET[name] = new LiveSPRITE("1D", []);
            return { name, srcName, count, rotate };
          });

          ENGINE.LOAD.HMRotSeq = toLoad.length;
          if (ENGINE.LOAD.HMRotSeq) appendCanvas("RotSeq");
          const sequences = await Promise.all(toLoad.map((img) => loadImage(img, "RotSeq", ENGINE.ROTATED_SHEET_SQUENCE_SOURCE)));

          await Promise.all(
            sequences.map(async (el) => {
              const assetNames = ENGINE.seqToSprite(el);
              const createdSprites = ASSET[el.name].linear;

              for (const sprite of createdSprites) {
                await new Promise((resolve) => {
                  sprite.onload = () => resolve();
                });
              }

              for (let i = 0; i < createdSprites.length; i++) {
                for (let angle = el.rotate.first; angle <= el.rotate.last; angle += el.rotate.step) {
                  const name = `${assetNames[i]}_${angle}`;
                  ENGINE.rotateImage(createdSprites[i], angle, name);
                }
              }

            })
          );

          return true;
        } catch (error) {
          console.error(`Failed to load rotated sheet sequences: ${error}`);
          return false;
        }
      }

      async function loadShaders(arrPath = LoadShaders) {
        if (!arrPath) return true;
        console.log(`%c ...loading ${arrPath.length} Shaders`, ENGINE.CSS);
        ENGINE.LOAD.HMShaders = arrPath.length;
        if (ENGINE.LOAD.HMShaders) appendCanvas("Shaders");
        try {
          const shaders = await Promise.all(arrPath.map(shader => loadShader(shader, 'Shaders')));
          shaders.forEach((shader) => {
            const name = shader.split("///")[1];
            SHADER[name] = shader;
          });
        } catch (error) {
          console.error(`Failed to load shaders: ${error}`);
          return false;
        }
      }

      async function loadObjects(arrPath = LoadObjects) {
        if (!arrPath) return;
        console.log(`%c...loading ${arrPath.length} Objects`, ENGINE.CSS);
        ENGINE.LOAD.HMObjects = arrPath.length;
        if (ENGINE.LOAD.HMObjects) appendCanvas("Objects");
        try {
          const objects = await Promise.all(arrPath.map(obj => loadObj(obj, 'Objects')));
          objects.forEach((object) => {
            ENGINE.parseObjectFile(object);
          });
          ENGINE.LOAD.Objects = ENGINE.LOAD.HMObjects;
          ENGINE.drawLoadingGraph("Objects");
        } catch (error) {
          console.error(`Failed to load objects: ${error}`);
          return false;
        }
      }

      async function loadWASM(arrPath = LoadExtWasm) {
        if (!arrPath) return;
        const LoadIntWasm = []; // internal hard-coded ENGINE requirements, never used yet
        const toLoad = [...arrPath, ...LoadIntWasm];
        console.log(`%c ...loading ${toLoad.length} WASM files`, ENGINE.CSS);
        ENGINE.LOAD.HMWASM = toLoad.length;
        if (ENGINE.LOAD.HMWASM) appendCanvas("WASM");
        try {
          const instances = await Promise.all(toLoad.map((wasm) => loadWebAssembly(wasm, "WASM")));
          instances.forEach((instance) => {
            ENGINE.linkToWasm(instance);
          });
        } catch (error) {
          console.error(`Error loading wasm: ${error}`);
          return false;
        }
      }

      async function loadingSounds(arrPath = LoadAudio) {
        if (!arrPath) return true;
        console.log(`%c ...loading ${arrPath.length} sounds`, ENGINE.CSS);
        ENGINE.LOAD.HMSounds = arrPath.length;
        if (ENGINE.LOAD.HMSounds) appendCanvas("Sounds");
        try {
          const loadedSounds = await Promise.all(arrPath.map((audio) => loadAudio(audio, "Sounds")));
          loadedSounds.forEach((el) => {
            ENGINE.audioToAudio(el);
          });
          return true;
        } catch (error) {
          console.error(`Error loading sounds: ${error}`);
          return false;
        }
      }

      async function loadAllFonts(fonts = LoadFonts) {
        if (!fonts) return;
        console.log(`%c ...loading ${fonts.length} fonts`, ENGINE.CSS);
        ENGINE.LOAD.HMFonts = fonts.length;
        if (ENGINE.LOAD.HMFonts) appendCanvas("Fonts");
        try {
          const fontPromises = fonts.map(font => loadFont(font));
          console.debug("fontPromises", fontPromises);
          const loadedFonts = await Promise.all(fontPromises);
          console.debug("loadedFonts", loadedFonts);
          loadedFonts.forEach(font => document.fonts.add(font));
        } catch (error) {
          console.error(`Error loading fonts: ${error}`);
          return false;
        }
      }

      async function loadGLTF(arrPath = LoadModels) {
        if (!arrPath) return;
        console.log(`%c...loading ${arrPath.length} Models`, ENGINE.CSS);
        ENGINE.LOAD.HMModels = arrPath.length;
        if (ENGINE.LOAD.HMObjects) appendCanvas("Models");
        try {
          const model_files = await Promise.all(arrPath.map(model => load_glTF_files(model)));


          for (const model of model_files) {
            const modelName = model.scenes[0].name;
            if (ENGINE.verbose) console.info(modelName, model);

            //assume single buffer!
            if (model.buffers.length > 1) throw new Error(`Expected single buffer, got ${model.buffers.length}`);
            const bin_name = ENGINE.MODEL_SOURCE + model.buffers[0].uri;
            const buffer = await loadBinaryFile(bin_name);

            //textures
            const texture_names = model.images.map((uri) => ENGINE.MODEL_SOURCE + uri.uri);
            const images = await Promise.all(texture_names.map(img => quickLoadImage(img)));
            const samplers = processSamplers(model.samplers);
            markparents(model.nodes);

            //meshes
            let meshes = new Array(model.meshes.length);
            for (let [index, mesh] of model.meshes.entries()) {
              let primitives = new Array(mesh.primitives.length);
              for (let [index, primitive] of mesh.primitives.entries()) {
                const indices = processAccessor(model, buffer, primitive.indices);
                const positions = processAccessor(model, buffer, primitive.attributes.POSITION);
                const normals = processAccessor(model, buffer, primitive.attributes.NORMAL);
                const textcoord = processAccessor(model, buffer, primitive.attributes.TEXCOORD_0);
                const joints = processAccessor(model, buffer, primitive.attributes.JOINTS_0);
                const weights = processAccessor(model, buffer, primitive.attributes.WEIGHTS_0);
                primitives[index] = new $Primitive(primitive.material, indices, positions, normals, textcoord, joints, weights);
              }
              meshes[index] = new $Mesh(mesh.name, primitives);
            }

            /** skins */
            let skins = new Array(model.skins.length);
            for (let [index, skin] of model.skins.entries()) {
              const invBindMatrices = processAccessor(model, buffer, skin.inverseBindMatrices);
              markNodes(model.nodes, skin.joints, index);
              const parentNodeIndex = findParentNode(model.nodes, skin.joints[0], index);
              const parentJoint = createJoint(model.nodes, skin.joints, invBindMatrices.data, parentNodeIndex, null);
              applyTRS(parentJoint);
              const jointMatrix = new Float32Array(skin.joints.length * 16);
              makeJointMatrix(parentJoint, jointMatrix, skin.joints);
              skins[index] = new $Armature(skin.name, skin.joints, parentJoint, jointMatrix);
            }

            /** animations */
            let animations = new Array(model.animations.length);
            for (let [index, animation] of model.animations.entries()) {
              //const skinJoints = model.skins[index].joints;
              const skinJoints = model.skins[0].joints;                       //only single skin supported
              const paths = {};
              for (let channel of animation.channels) {
                if (channel.target.node === undefined) {
                  if (ENGINE.verbose) console.warn(modelName, "undefined channel.target.node");
                  continue;
                }
                if (model.nodes[channel.target.node].skinIndex === undefined) {
                  if (ENGINE.verbose) console.warn(modelName, "undefined model.nodes[channel.target.node].skinIndex");
                  continue;
                }
                const sampler = animation.samplers[channel.sampler];
                if (sampler.interpolation !== "LINEAR") {
                  if (ENGINE.verbose) console.error("only LINEAR interpolation implemented and will be used as such!!");
                }
                const timeData = processAccessor(model, buffer, sampler.input);
                const animData = processAccessor(model, buffer, sampler.output);
                const nodeIndex = channel.target.node;

                if (!paths[nodeIndex]) paths[nodeIndex] = { jointIndex: skinJoints.indexOf(nodeIndex) };
                if (!paths[nodeIndex][channel.target.path]) paths[nodeIndex][channel.target.path] = {};
                paths[nodeIndex][channel.target.path].samples = [];
                const dataLength = animData.data.length / timeData.data.length;
                const samples = paths[nodeIndex][channel.target.path].samples;
                for (let i = 0; i < timeData.count; i++) {
                  const ii = i * dataLength;
                  samples.push({
                    time: timeData.data[i],
                    value: animData.data.slice(ii, ii + dataLength),
                    max: timeData.max[0],
                  });
                }
              }

              //to T,R,S
              const nodes = {};
              for (let nodeIndex in paths) {
                const node = paths[nodeIndex];
                const LEN = node.rotation.samples.length || node.translation.samples.length;
                nodes[nodeIndex] = { jointIndex: node.jointIndex };
                nodes[nodeIndex].time = new Array(LEN);
                nodes[nodeIndex].max = node.rotation.samples[0].max || node.translation.samples[0].max;
                nodes[nodeIndex].translation = new Array(LEN);
                nodes[nodeIndex].rotation = new Array(LEN);
                nodes[nodeIndex].scale = new Array(LEN);
                for (let t = 0; t < LEN; t++) {
                  nodes[nodeIndex].time[t] = node.rotation.samples[t].time;
                  nodes[nodeIndex].translation[t] = node.translation.samples[t].value;
                  nodes[nodeIndex].rotation[t] = node.rotation.samples[t].value;
                  nodes[nodeIndex].scale[t] = node.scale.samples[t].value;
                }
              }

              animations[index] = new $Animation(animation.name, nodes);
            }

            //add to models
            $3D_MODEL[modelName] = new $3D_Model(modelName, buffer, images, meshes, samplers, skins, animations);
            //finished

            ENGINE.LOAD.Models++;
            ENGINE.drawLoadingGraph("Models");

          }


          if (ENGINE.verbose) console.info("$3D_MODELs", $3D_MODEL);

        } catch (error) {
          console.error(`Error loading models: ${error}`);
          return false;
        }

        function makeJointMatrix(joint, matrix, skinJoints) {
          const index = skinJoints.indexOf(joint.index) * 16;
          glMatrix.mat4.copy(matrix.subarray(index, index + 16), joint.global_TRS);
          for (const child of joint.children) {
            makeJointMatrix(child, matrix, skinJoints);
          }
        }

        function applyTRS(joint) {
          const parentTRS = joint.parent ? joint.parent.global_TRS : glMatrix.mat4.create();
          glMatrix.mat4.multiply(joint.global_TRS, parentTRS, joint.local_TRS); //1
          for (const child of joint.children) {
            applyTRS(child);
          }
          glMatrix.mat4.multiply(joint.global_TRS, joint.global_TRS, joint.InverseBindMatrix);
        }

        function createJoint(nodes, joints, invBindMatrices, jointIndex, parent) {
          const accessIndex = joints.indexOf(jointIndex);
          const IBM = invBindMatrices.slice(accessIndex * 16, accessIndex * 16 + 16);
          const node = nodes[jointIndex];
          const Joint = new $Joint(node.name, jointIndex, node.translation, node.rotation, node.scale, IBM, parent, accessIndex);
          if (node.children) {
            for (let child of node.children) {
              Joint.addChild(createJoint(nodes, joints, invBindMatrices, child, Joint));
            }
          }
          return Joint;
        }

        function markparents(nodes) {
          for (let [i, node] of nodes.entries()) {
            if (node.children) {
              for (let child of node.children) {
                nodes[child].parent = i;
              }
            }
          }
        }

        function markNodes(nodes, joints, skinIndex) {
          for (let [i, node] of nodes.entries()) {
            if (joints.includes(i)) {
              if (!node.skinIndex) node.skinIndex = [];
              node.skinIndex.push(skinIndex);
            }
          }
        }

        function findParentNode(nodes, child, index) {
          const parentIndex = nodes[child].parent;
          if (!parentIndex) return child;
          const parent = nodes[parentIndex];
          if (parent.skinIndex && parent.skinIndex.includes(index)) return findParentNode(nodes, parentIndex, index);
          return child;
        }

        function processSamplers(s) {
          const samplers = [];
          for (let sampler of s) {
            let sampler_obj = {};
            for (let prop in sampler) {
              const mapped_prop = GLTF_GL_MAP[prop];
              const mapper_val = GL_CONSTANT[sampler[prop]];
              sampler_obj[mapped_prop] = mapper_val;
            }
            samplers.push(sampler_obj);
          }
          return samplers;
        }

        function processAccessor(model, buffer, idx) {

          const accessor = model.accessors[idx];
          if (!accessor) {
            console.error(model.meshes[0].name, idx);
          }
          const bufferView = model.bufferViews[idx];
          const component_type = GL_CONSTANT[accessor.componentType];

          const TArrLookup = {
            UNSIGNED_SHORT: Uint16Array,
            FLOAT: Float32Array,
            SHORT: Int16Array,
            UNSIGNED_INT: Uint32Array,
            UNSIGNED_BYTE: Uint8Array
          };

          const TArr = TArrLookup[component_type];
          if (!TArr) throw new Error(`Illegal component type: ${component_type}`);
          const aLen = accessor.count * GL_DATA_LENGTH[accessor.type];
          let array = new TArr(buffer, bufferView.byteOffset, aLen);
          let target = GL_CONSTANT[bufferView.target] || null;
          const min = accessor.min || null;
          const max = accessor.max || null;
          return new $BufferData(array, accessor.count, component_type, target, min, max);
        }
      }

      /** simple loaders */

      async function loadBinaryFile(filename) {
        try {
          const response = await fetch(filename);
          const buffer = await response.arrayBuffer();
          return buffer;
        } catch (error) {
          throw new Error(`Failed to load binary file: ${filename}: ${error}`);
        }
      }

      async function quickLoadImage(filename) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = filename;

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          return img;

        } catch (error) {
          throw new Error(`ENGINE: Failed to quickLoad image: ${filename}: ${error}`);
        }
      }

      /** loaders */

      async function loadImage(srcData, counter, dir = ENGINE.SOURCE) {
        let srcName, name, count, tag, parent, rotate, asset, trim, dimension;

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
            throw new Error(`ENGINE: loadImage srcData ERROR: ${typeof srcData}`);
        }

        const src = dir + srcName;
        //console.log("load image path:", src);

        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = src;

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          ENGINE.LOAD[counter]++;
          ENGINE.drawLoadingGraph(counter);
          return { img, name, count, tag, parent, rotate, asset, trim, dimension };
        } catch (error) {
          throw new Error(`ENGINE: Failed to load image: ${srcName}`, error);
        }
      }

      async function loadAudio(srcData, counter, dir = ENGINE.AUDIO_SOURCE) {
        let srcName, name;

        switch (typeof srcData) {
          case "string":
            srcName = srcData;
            name = srcName.substring(0, srcName.indexOf("."));
            break;
          case "object":
            srcName = srcData.srcName;
            name = srcData.name;
            break;
          default:
            throw new Error(`ENGINE: loadAudio srcData ERROR: ${typeof srcData}`);
        }

        const src = dir + srcName;
        const audio = new Audio(src);

        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = () => resolve();
          audio.onerror = (err) => reject(err);
          audio.preload = "auto";
          audio.load();
        });

        ENGINE.LOAD[counter]++;
        ENGINE.drawLoadingGraph(counter);
        return { audio, name };
      }

      async function load_glTF_files(fileName) {
        try {
          fileName = ENGINE.MODEL_SOURCE + fileName;
          const response = await fetch(fileName);
          const json = await response.json();
          return json;
        } catch (error) {
          console.error(`Error loading GLTF model from file ${fileName}:`, error);
          return null;
        }
      }

      async function loadShader(fileName, counter) {
        try {
          fileName = ENGINE.SHADER_SOURCE + fileName;
          const response = await fetch(fileName);
          ENGINE.LOAD[counter]++;
          ENGINE.drawLoadingGraph(counter);
          const text = await response.text();
          return text;
        } catch (err) {
          console.error(`Error loading shader from file ${fileName}:`, err);
          return null;
        }
      }

      async function loadObj(fileName, counter) {
        try {
          fileName = ENGINE.OBJECT_SOURCE + fileName;
          const response = await fetch(fileName);
          ENGINE.LOAD[counter]++;
          ENGINE.drawLoadingGraph(counter);
          const text = await response.text();
          return text;
        } catch (err) {
          throw new Error(`Error loading object from file ${fileName}:`, err);
        }
      }

      async function loadWebAssembly(fileName, counter) {
        try {
          const response = await fetch(ENGINE.WASM_SOURCE + fileName);
          const buffer = await response.arrayBuffer();
          const module = await WebAssembly.compile(buffer);
          ENGINE.LOAD[counter]++;
          ENGINE.drawLoadingGraph(counter);
          return new WebAssembly.Instance(module);
        } catch (error) {
          throw new Error(`Error loading WebAssembly: ${fileName}`, error);
        }
      }

      async function loadFont(srcData, dir = ENGINE.FONT_SOURCE) {
        try {
          const fontSource = dir + srcData.srcName;
          const url = `url(${fontSource})`;
          const temp = new FontFace(srcData.name, url);
          //const font = await temp.load();                       //firefox has issue with this             
          ENGINE.LOAD.Fonts++;
          ENGINE.drawLoadingGraph("Fonts");
          console.debug("loading font", "fontSource", fontSource, "url", url, "temp", temp);
          //return font;
          return temp.load();                                     //ff fix, but not really waiting for font
        } catch (error) {
          throw new Error(`Error loading font: ${srcData.srcName}`, error);
        }
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
      ENGINE.BLOCKGRID.decalDraw(maze, ENGINE.TEXTUREGRID.wallLayer);
      if (ENGINE.verbose) console.log(`%cTEXTUREGRID draw ${performance.now() - t0} ms`, ENGINE.CSS);
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
          if (maze.GA.isBlockWall(grid)) {
            ENGINE.BLOCKGRID.wall(x, y, CTX, value);
          }
          else if (maze.GA.isMazeWall(grid)) {
            value &= 2 ** maze.GA.gridSizeBit - 1 - MAPDICT.WALL;

            if (value & MAPDICT.STAIR) {
              value = MAPDICT.STAIR;
            }
            if (value & MAPDICT.SHRINE) {
              value = MAPDICT.SHRINE;
            }

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
      //cont here
      ENGINE.BLOCKGRID.decalDraw(maze, CTX);
      //if (ENGINE.verbose) console.log(`%cBLOCKGRID draw ${performance.now() - t0} ms`, ENGINE.CSS);
    },
    decalDraw(maze, CTX) {
      const decalWidth = 3;
      const W = (ENGINE.INI.GRIDPIX / 2) - decalWidth;
      const GA = maze.GA;
      //start
      if (maze.start) {
        let grid = GA.indexToGrid(maze.start[0]);
        let mid = GRID.gridToCenterPX(grid);
        ENGINE.drawCircle(CTX, mid, decalWidth * 2, "#000000");
      }
      if (maze.entities) {
        for (const entity of maze.entities) {
          displayEntity(entity, "#FF0000");
        }
      }
      if (maze.oracles) {
        for (const entity of maze.oracles) {
          displayEntity(entity, "#666");
        }
      }
      if (maze.triggers) {
        for (const trigger of maze.triggers) {
          let grid = GA.indexToGrid(trigger[0]);
          let dir = Vector.fromInt(trigger[1]);
          let pStart = dotOrLine(grid, dir, "#00FF00");
          let mid2 = GRID.gridToCenterPX(GA.indexToGrid(trigger[4]));
          CTX.save();
          CTX.setLineDash([2, 3]);
          ENGINE.drawLine(CTX, pStart, mid2, "#666", 1);
          CTX.restore();
          ENGINE.drawCircle(CTX, mid2, decalWidth * 1.5, "#CC0000");
        }
      }
      if (maze.traps) {
        for (const trigger of maze.traps) {
          let grid = GA.indexToGrid(trigger[0]);
          let dir = Vector.fromInt(trigger[1]);
          let pStart = dotOrLine(grid, dir, "#00FF00");
          let mid2 = GRID.gridToCenterPX(GA.indexToGrid(trigger[5]));
          CTX.save();
          CTX.setLineDash([2, 3]);
          ENGINE.drawLine(CTX, pStart, mid2, "#666", 1);
          CTX.restore();
          ENGINE.drawCircle(CTX, mid2, decalWidth * 1.5, "#EE0033");
          write(mid2, trigger[4])
        }
      }
      if (maze.decals) {
        for (const decal of maze.decals) {
          let grid = GA.indexToGrid(decal[0]);
          let dir = Vector.fromInt(decal[1]);
          dotOrLine(grid, dir, "#0000FF");
        }
      }
      if (maze.lights) {
        for (const light of maze.lights) {
          let grid = GA.indexToGrid(light[0]);
          let dir = Vector.fromInt(light[1]);
          let color = colorVectorToHex(LIGHT_COLORS[light[3]]);
          let mid = GRID.gridToCenterPX(grid);
          let start = mid.translate(dir, W);
          ENGINE.drawCircle(CTX, start, decalWidth * 2, color);
        }
      }
      if (maze.shrines && maze.trainers && maze.interactors) {
        const concat_shrines = [...maze.shrines, ...maze.trainers, ...maze.interactors];
        if (concat_shrines) {
          for (const shrine of concat_shrines) {
            let grid = GA.indexToGrid(shrine[0]);
            let mid = GRID.gridToCenterPX(grid);
            let dir = Vector.fromInt(shrine[1]);
            let start = mid.translate(dir, W);
            let color = "green";
            ENGINE.drawCircle(CTX, start, decalWidth * 3, color);
            start = start.translate(LEFT, W / 2);
            let pEnd = start.translate(RIGHT, W)
            ENGINE.drawLine(CTX, start, pEnd, color, decalWidth);
            write(mid, shrine[2]);
          }
        }
      }
      if (maze.gates) {
        for (const gate of maze.gates) {
          let grid = GA.indexToGrid(gate[0]);
          let bottomMid = GRID.gridToBottomCenterPX(grid);
          let point = bottomMid;
          CTX.strokeStyle = "#966F33";
          CTX.fillStyle = "#966F33";
          if (maze[3] === "Open") {
            CTX.strokeStyle = "#000";
            CTX.fillStyle = "#000";
          }
          CTX.lineWidth = 1;
          CTX.beginPath();
          CTX.moveTo(point.x, point.y);
          point = point.translate(LEFT, W / 2);
          CTX.lineTo(point.x, point.y);
          point = point.translate(UP, W);
          CTX.lineTo(point.x, point.y);
          point = point.translate(RIGHT, W / 2);
          CTX.arc(point.x, point.y, W / 2, Math.PI, 0);
          point = point.translate(RIGHT, W / 2);
          CTX.moveTo(point.x, point.y);
          point = point.translate(DOWN, W);
          CTX.lineTo(point.x, point.y);
          CTX.lineTo(bottomMid.x, bottomMid.y);
          CTX.closePath();
          CTX.stroke();
          CTX.fill();
          let mid = GRID.gridToCenterPX(grid);
          let color = "#966F33";
          switch (gate[4]) {
            case "Open":
              color = "#000";
              break;
            case "Closed":
              color = "#966F33";
              break;
            case "Gold":
              color = "gold";
              break;
            case "Silver":
              color = "silver";
              break;
            case "Red":
              color = "#F00";
              break;
            case "Blue":
              color = "blue";
              break;
            case "Green":
              color = "green";
              break;
            case "Emerald":
              color = "#50C878";
              break;
            case "Purple":
              color = "purple";
              break;
            case "Pearl":
              color = "whitesmoke";
              break;
          }
          ENGINE.drawCircle(CTX, mid, decalWidth * 2, color);
          let dir = Vector.fromInt(gate[1]);
          let start = mid.translate(dir, W);
          ENGINE.drawCircle(CTX, start, decalWidth * 2, "#99ccff");

          CTX.font = "8px Arial";
          CTX.textAlign = "center";
          CTX.textBaseLine = "middle";
          CTX.fillStyle = "white"
          CTX.fillText(gate[3], mid.x, mid.y);
        }
      }
      if (maze.keys && Array.isArray(maze.keys)) {
        for (const key of maze.keys) {
          const KEY_COLORS = ["gold", "silver", "red", "green", "blue", "#50C878", "purple", "beige"];
          const color = KEY_COLORS[key[1]];
          let grid = GA.indexToGrid(key[0]);
          let mid = GRID.gridToCenterPX(grid).translate(LEFT, W / 2);
          ENGINE.drawCircle(CTX, mid, decalWidth * 2, color);
          let pEnd = mid.translate(RIGHT, W);
          ENGINE.drawLine(CTX, mid, pEnd, color, decalWidth);
          ENGINE.drawLine(CTX, pEnd, pEnd.translate(UP, 5), color, decalWidth);
        }
      }
      if (maze.monsters) {
        for (const monster of maze.monsters) {
          let grid = GA.indexToGrid(monster[0]);
          let mid = GRID.gridToCenterPX(grid);
          write(mid, monster[1]);
        }
      }
      if (maze.scrolls) {
        for (const scroll of maze.scrolls) {
          let grid = GA.indexToGrid(scroll[0]);
          let mid = GRID.gridToCenterPX(grid).translate(UpLeft, W / 2);
          CTX.fillStyle = "yellow";
          CTX.fillRect(mid.x, mid.y, W, W);
          CTX.fillStyle = "black";
          if (SCROLL_TYPE) {
            mid = mid.translate(RIGHT, W / 2);
            write(mid, SCROLL_TYPE[scroll[1]]);
          }
        }
      }
      if (maze.potions) {
        for (const potion of maze.potions) {
          let grid = GA.indexToGrid(potion[0]);
          let mid = GRID.gridToCenterPX(grid);
          let color = POTION_TYPES[potion[1]].toLowerCase();
          ENGINE.drawCircle(CTX, mid, decalWidth * 2, color);
          ENGINE.drawLine(CTX, mid, mid.translate(UP, W / 2), color, decalWidth);
        }
      }
      if (maze.gold) {
        for (const gold of maze.gold) {
          let grid = GA.indexToGrid(gold[0]);
          let mid = GRID.gridToCenterPX(grid).translate(UpLeft, W / 2);
          CTX.fillStyle = "gold";
          CTX.fillRect(mid.x, mid.y, W, W / 2);
          mid = mid.translate(RIGHT, W / 2);
          write(mid, gold[1]);
        }
      }
      if (maze.objects && maze.movables) {
        const concat_objects = [...maze.objects, ...maze.movables];
        if (concat_objects) {
          for (const obj of concat_objects) {
            let grid = GA.indexToGrid(obj[0]);
            let mid = GRID.gridToCenterPX(grid);
            let text = `-${obj[1]}-`;
            write(mid, text, "#00F");
          }
        }
      }
      if (maze.skills) {
        for (const skill of maze.skills) {
          let grid = GA.indexToGrid(skill[0]);
          let mid = GRID.gridToCenterPX(grid);
          const color = "red";
          write(mid, `* ${skill[1]} *`, color);
          ENGINE.drawLine(CTX, mid.translate(UpLeft, W / 2), mid.translate(UpLeft, W / 2).translate(RIGHT, W), color, 3);
          ENGINE.drawLine(CTX, mid.translate(DownLeft, W / 2), mid.translate(DownLeft, W / 2).translate(RIGHT, W), color, 5);
        }
      }
      if (maze.containers) {
        for (const container of maze.containers) {
          let grid = GA.indexToGrid(container[0]);
          let mid = GRID.gridToCenterPX(grid);
          let start = mid.translate(LEFT, W / 2);
          CTX.fillStyle = "brown";
          CTX.fillRect(start.x, start.y, W, W);
          let up = mid.translate(UP, W / 2);
          write(mid, container[2].split(".")[1]);
          write(up, container[1]);

          if (container.length > 3 && container[3]) {
            let dir = Vector.fromInt(container[3]).mirror();
            dotOrLine(grid, dir, "#444");
          }
        }
      }

      function displayEntity(entity, color) {
        let grid = GA.indexToGrid(entity[0]);
        let dir = Vector.fromInt(entity[1]);
        dotOrLine(grid, dir, color);
        let mid = GRID.gridToCenterPX(grid);
        write(mid, entity[2]);
      }

      function write(point, text, color = "#000") {
        CTX.fillStyle = color;
        CTX.font = "10px Arial";
        CTX.textAlign = "center";
        CTX.textBaseLine = "middle";
        CTX.fillText(text, point.x, point.y);
      }

      function dotOrLine(grid, dir, color) {
        let mid = GRID.gridToCenterPX(grid);
        let start = mid.translate(dir, W);
        let pDirs = dir.getPerpendicularDirs();
        let pStart = start.translate(pDirs[0], W);
        let pEnd = start.translate(pDirs[1], W);
        if (pDirs[0].same(NOWAY)) {
          ENGINE.drawCircle(CTX, pStart, decalWidth * 2, color);
        } else {
          ENGINE.drawLine(CTX, pStart, pEnd, color, decalWidth);
        }
        return start;
      }
    },
    wall(x, y, CTX, value) {
      let FS;
      switch (value) {
        case MAPDICT.BLOCKWALL:
          FS = "#BBB";
          break;
        case MAPDICT.DOOR:
          FS = "brown";
          break;
        case MAPDICT.STAIR:
          FS = "#87CEFA";
          break;
        case MAPDICT.SHRINE:
          FS = "#FF00FF";
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
        case MAPDICT.HOLE:
          FS = "#000";
          break;
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
      this._circle(CTX, Vector3.to_FP_Grid(player.pos), player.r, Vector3.to_FP_Grid(player.dir));
    },
    _circle(CTX, grid, R, dir, color = null) {
      if (color) CTX.strokeStyle = color;
      let point = grid.toPoint();
      CTX.pixelAtPoint(point);
      let r = Math.round(ENGINE.INI.GRIDPIX * R);
      CTX.beginPath();
      CTX.arc(point.x, point.y, r, 0, 2 * Math.PI);
      CTX.moveTo(point.x, point.y);
      let end = point.translate(dir, r);
      CTX.lineTo(end.x, end.y);
      CTX.stroke();
    },
    drawPerspective(entity, color = "#000") {
      let CTX = ENGINE.VECTOR2D.layer;
      CTX.strokeStyle = color;
      CTX.lineWidth = 1;
      this._circle(CTX, Vector3.to_FP_Grid(entity.pos), entity.r, Vector3.to_FP_Grid(entity.dir));
    },
    drawBlock(monster, color = "#8000FF") {
      const CTX = ENGINE.VECTOR2D.layer;
      this._circle(CTX, Vector3.to_FP_Grid(monster.moveState.pos), monster.r, Vector3.to_FP_Grid(monster.moveState.dir), "#000"); //
      CTX.strokeStyle = color;
      CTX.lineWidth = 1;
      const point = monster.moveState.pos.toPoint();
      const dir = monster.moveState.dir;
      const corners = this.calcCornersFromBB(point, monster.moveState.boundingBox);
      CTX.beginPath();
      CTX.moveTo(corners[3].x, corners[3].y);
      for (let i = 0; i < 4; i++) {
        CTX.lineTo(corners[i].x, corners[i].y);
      }
      CTX.moveTo(point.x, point.y);
      let len = (monster.boundingBox.max.z - monster.boundingBox.min.z) * ENGINE.INI.GRIDPIX / 2;
      const endPoint = point.translate(dir, len);
      CTX.lineTo(endPoint.x, endPoint.y);
      CTX.stroke();
    },
    calcCornersFromBB(point, BB) {
      const gridpix = ENGINE.INI.GRIDPIX;
      const corners = [
        point.add(new Vector(BB.min.x * gridpix, BB.min.z * gridpix)), //top left
        point.add(new Vector(BB.max.x * gridpix, BB.min.z * gridpix)), //top right
        point.add(new Vector(BB.max.x * gridpix, BB.max.z * gridpix)), //bottom right
        point.add(new Vector(BB.min.x * gridpix, BB.max.z * gridpix)), //bottom left

      ];
      return corners;
    },
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
const TEXTURE = {};
const $3D_MODEL = {};
const LAYER = {
  PRELOAD: {}
};
const SPRITE = {};
const AUDIO = {};
const TILE = {};
const ASSET = {
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
const WASM = {};
const SHADER = {};
const MEMORY = {};

/*
const PATTERN = {
  create(which) {
    var image = TEXTURE[which];
    var CTX = LAYER.temp;
    PATTERN[which] = CTX.createPattern(image, "repeat");
  }
};*/

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
    this.orientationW = Math.abs(dir.y) * this.frontWidth + Math.abs(dir.x) * this.sideWidth;
    this.orientationH = Math.abs(dir.x) * this.frontWidth + Math.abs(dir.y) * this.sideWidth;
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
class $3D_ACTOR {
  constructor(parent, animations, skin, jointMatrix) {
    this.parent = parent;
    this.animationIndex = 0;
    this.animations = animations;
    this.birth = parent.birth;
    this.skin = skin;                       //limited to 0th skin
    this.jointMatrix = jointMatrix;
  }
  animate(date) {
    const A = this.animations[this.animationIndex];
    const rawDelta = (date - this.birth) / 1000;

    if (rawDelta > A.nodes[0].max) {
      if (this.parent.actionModes.includes(this.parent.mode)) {
        this.parent.actionCallback();
        this.parent.setMode("idle");
        return;
      }
    }

    const delta = (rawDelta) % A.nodes[0].max;
    let keyFrameIndex = -1;
    let samplingPeriod = null;
    let keyFrameTime = 0;
    const animationMatrix = new Array(Object.keys(A.nodes).length);

    for (let nodeIndex in A.nodes) {
      const node = A.nodes[nodeIndex];

      /** 
       * perform binary search only for the first node, 
       * the rest should be in sync
       * this will fail if nodes are not sampled uniformly! 
       */

      if (!(keyFrameIndex >= 0 && samplingPeriod && keyFrameTime === node.time[keyFrameIndex])) {
        samplingPeriod = node.time[1] - node.time[0];
        keyFrameIndex = binarySearchClosestLowFloat(node.time, delta, samplingPeriod);
        keyFrameTime = node.time[keyFrameIndex];
      }

      const nextKeyFrameTime = node.time[keyFrameIndex + 1];
      const timeScale = (delta - keyFrameTime) / (nextKeyFrameTime - keyFrameTime);
      const translation = glMatrix.vec3.create();
      glMatrix.vec3.lerp(translation, node.translation[keyFrameIndex], node.translation[keyFrameIndex + 1], timeScale);

      const rotation = glMatrix.quat.create();
      glMatrix.quat.slerp(rotation, node.rotation[keyFrameIndex], node.rotation[keyFrameIndex + 1], timeScale);

      const scale = glMatrix.vec3.create();
      glMatrix.vec3.lerp(scale, node.scale[keyFrameIndex], node.scale[keyFrameIndex + 1], timeScale);

      const TRS = glMatrix.mat4.create();
      glMatrix.mat4.fromRotationTranslationScale(TRS, rotation, translation, scale);
      animationMatrix[node.jointIndex] = TRS;
    }
    A.animationMatrix = animationMatrix;
    const parentJoint = this.skin.joint;
    this.applyTRS(parentJoint, A.animationMatrix);
    this.makeJointMatrix(parentJoint);
  }
  applyTRS(joint, animation_matrix) {
    const parentTRS = joint.parent ? joint.parent.global_TRS : glMatrix.mat4.create();
    const animMatrix = animation_matrix[joint.jointIndex];
    glMatrix.mat4.multiply(joint.global_TRS, parentTRS, animMatrix);
    for (const child of joint.children) {
      this.applyTRS(child, animation_matrix);
    }
    glMatrix.mat4.multiply(joint.global_TRS, joint.global_TRS, joint.InverseBindMatrix);
  }
  makeJointMatrix(joint) {
    const matrix = this.jointMatrix;
    const skinJoints = this.skin.skinJoints;
    const index = skinJoints.indexOf(joint.index) * 16;
    glMatrix.mat4.copy(matrix.subarray(index, index + 16), joint.global_TRS);
    for (const child of joint.children) {
      this.makeJointMatrix(child);
    }
  }
}
class $3D_MoveState {
  constructor(translation_vector, dir, rotation_to_north, parent) {
    this.pos = translation_vector;              //Vector3
    this.dir = dir;                             //2D dir
    this.rotation_to_north = rotation_to_north; // rad
    this.parent = parent;
    this.update();
    this.startPos = Vector3.to_FP_Grid(this.pos);
    this.endPos = this.startPos;
    this.resetView();
  }
  resetView() {
    this.lookDir = null;
    this.lookAngle = null;
  }
  setView(lookAt) {
    const pPos = Vector3.to_FP_Grid(lookAt);
    const ePos = Vector3.to_FP_Grid(this.pos);
    const direction = ePos.direction(pPos);
    this.lookDir = direction;
    const angle = -FP_Vector.toClass(UP).radAngleBetweenVectors(direction);
    this.lookAngle = angle;
  }
  next(dir) {
    if (!dir) throw new Error(`Direction ${dir} not defined error. Stopping execution!`);
    this.startPos = this.endPos;
    this.dir = dir;                             //2D dir
    this.endPos = this.startPos.add(this.dir);
    this.realDir = Vector3.to_FP_Grid(this.pos).direction(this.endPos);
    this.moving = true;
  }
  update() {
    this.setRotation();
    this.setDirectionVector();
    this.setRotatedBoundingBox();
    this.setGrid();
  }
  setDirectionVector() {
    this.directionVector = Vector3.from_2D_dir(this.dir);
  }
  setRotation() {
    if (this.lookAngle) {
      this.rotation_angle = this.lookAngle;
    }
    else {
      const angle = UP.radAngleBetweenVectors(this.dir);
      if (!isNaN(angle)) this.rotation_angle = angle;
    }
    this.rotate = glMatrix.mat4.create();
    glMatrix.mat4.rotate(this.rotate, this.rotate, this.rotation_to_north + this.rotation_angle, [0, 1, 0]);
  }
  setRotatedBoundingBox() {
    const axis = glMatrix.vec3.create();
    const max = glMatrix.vec3.create();
    const min = glMatrix.vec3.create();
    glMatrix.vec3.rotateY(max, this.parent.boundingBox.max.array, axis, this.rotation_angle);
    glMatrix.vec3.rotateY(min, this.parent.boundingBox.min.array, axis, this.rotation_angle);
    this.boundingBox = new BoundingBox(max, min);
  }
  setGrid() {
    this.grid = Vector3.to_FP_Grid(this.pos);
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
    const list = [];
    for (let obj of this.list) {
      for (let c = 0; c < obj.count; c++) {
        list.push(obj.object.type);
      }

    }
    console.info("display by type:", list);
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
  constructor(len = null) {
    this.len = len;
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
    super(len);
  }
  reset() {
    this.data = new Float32Array(this.len);
    this.data.fill(0);
    this.ptr = 0;
    this.total = 0;
    this.average = 0;
    this.count = 0;
  }
  update(fps) {
    if (this.count < this.len) this.count++;
    this.total += fps - this.data[this.ptr];
    this.data[this.ptr] = fps;
    this.ptr = ++this.ptr % this.len;
    this.average = this.total / this.count;
  }
}
const FILTER = {
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