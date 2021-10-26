/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

//////////////////////////////////////
// GRID v 3.00.DEV   by LS          //
//////////////////////////////////////

/*
TODO:
  
known bugs:

*/

var GRID = {
  VERSION: "3.00",
  CSS: "color: #0AA",
  SETTING: {
    ALLOW_CROSS: false,
    EPSILON: 0.05
  },
  circleCollision(entity1, entity2) {
    let distance = entity1.moveState.pos.EuclidianDistance(
      entity2.moveState.pos
    );
    let touchDistance = entity1.r + entity2.r;
    return distance < touchDistance;
  },
  circleRectangleCollision() { },
  collision(actor, grid) {
    let actorGrid = actor.MoveState.homeGrid;
    return GRID.same(actorGrid, grid);
  },
  spriteToSpriteCollision(actor1, actor2) {
    return GRID.same(actor1.MoveState.homeGrid, actor2.MoveState.homeGrid);
  },
  gridToCenterPX(grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX + Math.floor(ENGINE.INI.GRIDPIX / 2);
    var y = grid.y * ENGINE.INI.GRIDPIX + Math.floor(ENGINE.INI.GRIDPIX / 2);
    return new Point(x, y);
  },
  gridToSprite(grid, actor) {
    GRID.coordToSprite(GRID.gridToCoord(grid), actor);
  },
  coordToSprite(coord, actor) {
    actor.x = coord.x + Math.floor(ENGINE.INI.GRIDPIX / 2);
    actor.y = coord.y + Math.floor(ENGINE.INI.GRIDPIX / 2);
  },
  gridToCoord(grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX;
    var y = grid.y * ENGINE.INI.GRIDPIX;
    return new Point(x, y);
  },
  coordToGrid(x, y) {
    var tx = Math.floor(x / ENGINE.INI.GRIDPIX);
    var ty = Math.floor(y / ENGINE.INI.GRIDPIX);
    return new Grid(tx, ty);
  },
  grid(CTX = LAYER.grid) {
    //potentially obsolete
    var x = 0;
    var y = 0;
    CTX.strokeStyle = "#AAA";
    //horizonal lines
    do {
      y += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(CTX.canvas.width, y);
      CTX.closePath();
      CTX.stroke();
    } while (y <= CTX.canvas.height);
    //vertical lines
    y = 0;
    do {
      x += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(x, CTX.canvas.height);
      CTX.closePath();
      CTX.stroke();
    } while (x <= CTX.canvas.width);
  },
  paintText(point, text, layer, color = "#FFF") {
    //check usage, obsolete?
    var CTX = LAYER[layer];
    CTX.font = "10px Consolas";
    var y = point.y + ENGINE.INI.GRIDPIX / 2;
    var x = point.x + ENGINE.INI.GRIDPIX / 2;
    CTX.fillStyle = color;
    CTX.textAlign = "center";
    CTX.fillText(text, x, y);
  },
  trueToGrid(actor) {
    var TX = actor.x - Math.floor(ENGINE.INI.GRIDPIX / 2);
    var TY = actor.y - Math.floor(ENGINE.INI.GRIDPIX / 2);
    var GX = Math.floor(TX / ENGINE.INI.GRIDPIX);
    var GY = Math.floor(TY / ENGINE.INI.GRIDPIX);
    var MX = TX % ENGINE.INI.GRIDPIX;
    var MY = TY % ENGINE.INI.GRIDPIX;
    if (MX || MY) {
      return null;
    } else return { x: GX, y: GY };
  },
  same(grid1, grid2) {
    if (grid1 === null || grid2 === null) return false;
    if (grid1 === undefined || grid2 === undefined) return false;
    if (grid1.x === grid2.x && grid1.y === grid2.y) {
      return true;
    } else return false;
  },
  isGridIn(grid, gridArray) {
    for (var q = 0; q < gridArray.length; q++) {
      if (grid.x === gridArray[q].x && grid.y === gridArray[q].y) {
        return q;
      }
    }
    return -1;
  },
  contTranslatePosition(entity, lapsedTime) {
    let length = (lapsedTime / 1000) * entity.moveSpeed;
    entity.moveState.pos = entity.moveState.pos.translate(
      entity.moveState.dir,
      length
    );
    entity.actor.updateAnimation(lapsedTime);
    return;
  },
  translatePosition(entity, lapsedTime) {
    let length = (lapsedTime / 1000) * entity.moveSpeed;
    entity.moveState.pos = entity.moveState.pos.translate(
      entity.moveState.realDir,
      length
    );
    let distance = entity.moveState.pos.EuclidianDistance(
      entity.moveState.endPos
    );

    let boundGrid = Grid.toClass(entity.moveState.pos);
    if (
      !(
        GRID.same(boundGrid, Grid.toClass(entity.moveState.endPos)) ||
        GRID.same(boundGrid, Grid.toClass(entity.moveState.startPos))
      )
    ) {
      entity.moveState.pos = entity.moveState.endPos;
      entity.moveState.moving = false;
      return;
    }

    entity.actor.updateAnimation(lapsedTime);

    if (distance < GRID.SETTING.EPSILON) {
      entity.moveState.moving = false;
      return;
    }
  },
  translateMove(
    entity,
    gridArray,
    changeView = false,
    onFinish = null,
    animate = true
  ) {
    entity.actor.x += entity.MoveState.dir.x * entity.speed;
    entity.actor.y += entity.MoveState.dir.y * entity.speed;
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    if (animate) {
      entity.actor.animateMove(entity.actor.orientation);
    }
    entity.MoveState.homeGrid = GRID.coordToGrid(
      entity.actor.x,
      entity.actor.y
    );

    if (gridArray.outside(entity.MoveState.homeGrid)) {
      entity.MoveState.homeGrid = gridArray.toOtherSide(
        entity.MoveState.homeGrid
      );
      GRID.gridToSprite(entity.MoveState.homeGrid, entity.actor);
    }

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }

    ENGINE.VIEWPORT.alignTo(entity.actor);

    if (GRID.same(entity.MoveState.endGrid, GRID.trueToGrid(entity.actor))) {
      entity.MoveState.moving = false;
      entity.MoveState.startGrid = entity.MoveState.endGrid;
      entity.MoveState.homeGrid = entity.MoveState.endGrid;

      if (onFinish) onFinish.call();
    }
    return;
  },
  blockMove(entity, changeView = false) {
    let newGrid = entity.MoveState.startGrid.add(entity.MoveState.dir);
    entity.MoveState.reset(newGrid);
    GRID.gridToSprite(newGrid, entity.actor);
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    entity.actor.animateMove(entity.actor.orientation);

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
    return;
  },
  teleportToGrid(entity, grid, changeView = false) {
    entity.MoveState.reset(grid);
    GRID.gridToSprite(grid, entity.actor);
    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
  },
  gridToIndex(grid, map = MAP[GAME.level]) {
    return grid.x + grid.y * map.width;
  },
  indexToGrid(index, map = MAP[GAME.level]) {
    let x = index % map.width;
    let y = Math.floor(index / map.width);
    return new Grid(x, y);
  },
  vision(startGrid, endGrid, GA) {
    if (GRID.same(startGrid, endGrid)) return true;
    let path = GRID.raycasting(startGrid, endGrid);
    return GA.pathClear(path);
  },
  freedom(startGrid, endGrid, IA) {
    if (GRID.same(startGrid, endGrid)) return true;
    let path = GRID.raycasting(startGrid, endGrid).slice(1);
    let candidates = IA.unrollArray(path);
    if (candidates.size > 0) {
      return false;
    } else return true;
  },
  raycasting(startGrid, endGrid) {
    let normDir = startGrid.direction(endGrid);
    let path = [];
    path.push(Grid.toClass(startGrid));
    let x = startGrid.x;
    let y = startGrid.y;
    let dx = Math.abs(endGrid.x - x);
    let dy = -Math.abs(endGrid.y - y);
    let Err = dx + dy;
    let E2, node;
    do {
      E2 = Err * 2;
      if (E2 >= dy) {
        Err += dy;
        x += normDir.x;
      }
      if (E2 <= dx) {
        Err += dx;
        y += normDir.y;
      }
      node = new Grid(x, y);
      path.push(node);
    } while (!GRID.same(node, endGrid));
    return path;
  },
  pathClear(path) {
    if (path.length === 0) return true;
    for (let q = 0; q < path.length; q++) {
      if (GRID.gridIsBlock(path[q])) return false;
    }
    return true;
  },
  calcDistancesBFS_BH(start, dungeon) {
    dungeon.setNodeMap();
    let BH = new BinHeap("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    dungeon.nodeMap[start.x][start.y].goto = new Vector(0, 0);
    BH.insert(dungeon.nodeMap[start.x][start.y]);
    while (BH.size() > 0) {
      let node = BH.extractMax();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        let nextNode =
          dungeon.nodeMap[node.grid.x + ENGINE.directions[D].x][
          node.grid.y + ENGINE.directions[D].y
          ];
        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            nextNode.goto = ENGINE.directions[D].mirror();
            BH.insert(nextNode);
          }
        }
      }
    }
  },
  calcDistancesBFS_A(start, dungeon) {
    dungeon.setNodeMap();
    let Q = new NodeQ("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    dungeon.nodeMap[start.x][start.y].goto = new Vector(0, 0);
    Q.queueSimple(dungeon.nodeMap[start.x][start.y]);
    while (Q.size() > 0) {
      let node = Q.dequeue();

      for (let D = 0; D < ENGINE.directions.length; D++) {
        let x =
          (node.grid.x + ENGINE.directions[D].x + dungeon.width) %
          dungeon.width;
        let y =
          (node.grid.y + ENGINE.directions[D].y + dungeon.height) %
          dungeon.height;
        let nextNode = dungeon.nodeMap[x][y];

        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            nextNode.goto = ENGINE.directions[D].mirror();
            Q.queueSimple(nextNode);
          }
        }
      }
    }
  },
  pathFromNodeMap(origin, nodeMap) {
    let path = [origin];
    let prev = nodeMap[origin.x][origin.y].prev;
    while (prev) {
      path.push(prev);
      prev = nodeMap[prev.x][prev.y].prev;
    }
    return path;
  },
  directionsFromPath(path, cut = false) {
    let directions = [];
    let from = path.pop();
    while (path.length > 0) {
      directions.push(from.direction(path.last()));
      from = path.pop();
      if (cut && directions.length === cut) {
        return directions;
      }
    }
    return directions;
  }
};
class PathNode {
  constructor(x, y) {
    this.distance = Infinity;
    this.priority = Infinity;
    this.path = Infinity;
    this.prev = null;
    this.goto = null;
    this.grid = new Grid(x, y);
    this.visited = false;
  }
  setPriority() {
    this.priority = this.path + this.distance;
  }
}
class BinHeap {
  constructor(prop) {
    this.HEAP = [];
    this.sort = prop;
  }
  size() {
    return this.HEAP.length;
  }
  parent(i) {
    return Math.floor((i - 1) / 2);
  }
  leftChild(i) {
    return 2 * i + 1;
  }
  rightChild(i) {
    return 2 * i + 2;
  }
  siftUp(i) {
    while (
      i > 0 &&
      this.HEAP[this.parent(i)][this.sort] > this.HEAP[i][this.sort]
    ) {
      this.HEAP.swap(this.parent(i), i);
      i = this.parent(i);
    }
  }
  siftDown(i) {
    let maxIndex = i;
    let L = this.leftChild(i);
    if (
      L <= this.size() - 1 &&
      this.HEAP[L][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = L;
    }
    let R = this.rightChild(i);
    if (
      R <= this.size() - 1 &&
      this.HEAP[R][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = R;
    }
    if (i !== maxIndex) {
      this.HEAP.swap(i, maxIndex);
      this.siftDown(maxIndex);
    }
  }
  insert(node) {
    this.HEAP.push(node);
    this.siftUp(this.size() - 1);
  }
  extractMax() {
    let result = this.HEAP[0];
    this.HEAP[0] = this.HEAP[this.size() - 1];
    this.HEAP.pop();
    this.siftDown(0);
    return result;
  }
  display() {
    while (this.size() > 0) {
      console.log(this.extractMax());
    }
  }
}
class Node {
  constructor(HG, goal, stack, path, history, iterations) {
    this.grid = HG;
    this.stack = stack || [];
    this.history = history || [HG];
    this.path = path || 0;
    this.dist = this.grid.distance(goal);
    this.priority = this.path + this.dist;
    this.status = "Progress";
    this.iterations = iterations || 0;
  }
  append(node, goal) {
    let stack = this.stack.concat(node.stack);
    let history = this.history.concat(node.history.slice(1));
    let path = this.path + node.path;
    return new Node(node.grid, goal, stack, path, history);
  }
}
class BlindNode {
  constructor(HG, stack, path, history, iterations) {
    this.grid = HG;
    this.stack = stack || [];
    this.history = history || [HG];
    this.path = path || 0;
    this.status = "Progress";
    this.iterations = iterations || 0;
  }
}
class NodeQ {
  constructor(prop) {
    this.list = [];
    this.sort = prop;
  }
  dequeue() {
    return this.list.shift();
  }
  destack() {
    return this.list.pop();
  }
  size() {
    return this.list.length;
  }
  queueSimple(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node[this.sort] < this.list[q][this.sort]) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
  queue(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node.priority < this.list[q].priority) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      } else if (
        node.priority === this.list[q].priority &&
        node.dist < this.list[q].dist
      ) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
}
var MAPDICT = {
  EMPTY: 0, //0
  WALL: 2 ** 0, //1
  ROOM: 2 ** 1, //2
  DOOR: 2 ** 2, //4
  RESERVED: 2 ** 3, //8
  START_POSITION: 2 ** 4, //16
  STAIR: 2 ** 5, //32
  SHRINE: 2 ** 6, // 64
  FOG: 2 ** 7 //128 - fog should remain largest!
};
class GridArray {
  constructor(sizeX, sizeY, byte = 1, fill = 0) {
    if (byte !== 1 && byte !== 2 && byte !== 4) {
      console.error(
        "GridArray set up with wrong size. Reset to default 8 bit!"
      );
      byte = 1;
    }
    let buffer = new ArrayBuffer(sizeX * sizeY * byte);
    let GM;
    switch (byte) {
      case 1:
        GM = new Uint8Array(buffer);
        break;
      case 2:
        GM = new Uint16Array(buffer);
        break;
      case 4:
        GM = new Uint32Array(buffer);
        break;
    }
    this.width = parseInt(sizeX, 10);
    this.height = parseInt(sizeY, 10);
    this.maxX = sizeX - 2;
    this.maxY = sizeY - 2;
    this.minX = 1;
    this.minY = 1;
    this.map = GM;
    this.nodeMap = null;
    this.gridSizeBit = byte * 8;
    if (fill !== 0) {
      this.map.fill(fill);
    }
  }
  massSet(bin) {
    for (let i = 0; i < this.map.length; i++) {
      this.map[i] |= bin;
    }
  }
  massClear() {
    for (let i = 0; i < this.map.length; i++) {
      this.map[i] = 0;
    }
  }
  linkToEntity(entities) {
    for (const entity of entities) {
      entity.MoveState.gridArray = this;
    }
  }
  indexToGrid(index) {
    let x = index % this.width;
    let y = Math.floor(index / this.width);
    return new Grid(x, y);
  }
  gridToIndex(grid) {
    if (this.isOutOfBounds(grid)) throw "Grid is out of bounds - ERROR";
    return grid.x + grid.y * this.width;
  }
  set(grid, bin) {
    if (this.isOutOfBounds(grid)) throw "Grid is out of bounds - ERROR";
    this.map[this.gridToIndex(grid)] |= bin;
  }
  setValue(grid, value) {
    if (this.isOutOfBounds(grid)) throw "Grid is out of bounds - ERROR";
    this.map[this.gridToIndex(grid)] = value;
  }
  clear(grid, bin) {
    if (this.isOutOfBounds(grid)) throw "Grid is out of bounds - ERROR";
    this.map[this.gridToIndex(grid)] &= (2 ** this.gridSizeBit - 1 - bin);
  }
  check(grid, bin) {
    if (this.isOutOfBounds(grid)) return false;
    return this.map[this.gridToIndex(grid)] & bin;
  }
  value(grid, value) {
    if (this.isOutOfBounds(grid)) return false;
    return this.map[this.gridToIndex(grid)] === value;
  }
  getValue(grid) {
    if (this.isOutOfBounds(grid)) return false;
    return this.map[this.gridToIndex(grid)];
  }
  toWall(grid) {
    this.setValue(grid, MAPDICT.WALL);
  }
  carveDot(grid) {
    this.setValue(grid, MAPDICT.EMPTY);
  }
  isWall(grid) {
    return this.check(grid, MAPDICT.WALL) === MAPDICT.WALL;
  }
  notWall(grid) {
    return !this.isWall(grid);
  }
  isMazeWall(grid) {
    if (this.isOutOfBounds(grid)) return false;
    return this.map[this.gridToIndex(grid)] & (MAPDICT.WALL === MAPDICT.WALL);
  }
  toDoor(grid) {
    this.setValue(grid, MAPDICT.DOOR);
  }
  isDoor(grid) {
    return this.check(grid, MAPDICT.DOOR) === MAPDICT.DOOR;
  }
  notDoor(grid) {
    return !this.isDoor(grid);
  }
  addStair(grid) {
    this.set(grid, MAPDICT.STAIR);
    this.reserve(grid);
  }
  toStair(grid) {
    this.setValue(grid, MAPDICT.STAIR);
    this.reserve(grid);
  }
  isStair(grid) {
    return this.check(grid, MAPDICT.STAIR) === MAPDICT.STAIR;
  }
  notStair(grid) {
    return !this.isStair(grid);
  }
  closeDoor(grid) {
    if (this.isDoor(grid)) {
      this.set(grid, MAPDICT.WALL);
      this.reserve(grid);
    }
  }
  openDoor(grid) {
    if (this.isDoor(grid)) {
      this.clear(grid, MAPDICT.WALL);
    }
  }
  isDoorClosed(grid) { }
  isDoorOpen(grid) { }
  toRoom(grid) {
    this.setValue(grid, MAPDICT.ROOM);
  }
  addRoom(grid) {
    this.set(grid, MAPDICT.ROOM);
  }
  isRoom(grid) {
    return this.check(grid, MAPDICT.ROOM) === MAPDICT.ROOM;
  }
  notRoom(grid) {
    return !this.isRoom(grid);
  }
  toShrine(grid) {
    this.setValue(grid, MAPDICT.SHRINE);
  }
  addShrine(grid) {
    this.set(grid, MAPDICT.SHRINE);
  }
  reserve(grid) {
    this.set(grid, MAPDICT.RESERVED);
  }
  isReserved(grid) {
    return this.check(grid, MAPDICT.RESERVED) === MAPDICT.RESERVED;
  }
  notReserved(grid) {
    return !this.isReserved(grid);
  }
  toEmpty(grid) {
    this.setValue(grid, MAPDICT.EMPTY);
  }
  isEmpty(grid) {
    return this.check(grid, MAPDICT.WALL) === MAPDICT.EMPTY;
  }
  notEmpty(grid) {
    return !this.isEmpty(grid);
  }
  setStartPosition(grid) {
    this.set(grid, MAPDICT.START_POSITION);
  }
  isStartPosition(grid) {
    return this.check(grid, MAPDICT.START_POSITION) === MAPDICT.START_POSITION;
  }
  isFog(grid) {
    return this.check(grid, MAPDICT.FOG) === MAPDICT.FOG;
  }
  clearFog(grid) {
    this.clear(grid, MAPDICT.FOG);
  }
  rect(X, Y, W, H, width = 1, set = MAPDICT.WALL) {
    for (let x = X; x < X + W; x++) {
      for (let w = 0; w < width; w++) {
        let grid1 = new Grid(x, Y + w);
        let grid2 = new Grid(x, Y + H - 1 - w);
        this.set(grid1, set);
        this.set(grid2, set);
      }
    }
    for (let y = Y; y < Y + H; y++) {
      for (let w = 0; w < width; w++) {
        let grid1 = new Grid(X + w, y);
        let grid2 = new Grid(X + W - 1 - w, y);
        this.set(grid1, set);
        this.set(grid2, set);
      }
    }
  }
  border(width = 1, set = MAPDICT.WALL) {
    this.rect(0, 0, this.width, this.height, width, set);
  }
  importGridMap(map) {
    /** map is maze or dungeon object */
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        let grid = new Grid(x, y);
        let index = this.gridToIndex(grid);
        if (map.isMazeWall(grid)) {
          this.toWall(grid);
        }
      }
    }
  }
  isOut(grid) {
    if (
      grid.x > this.maxX ||
      grid.x < this.minX ||
      grid.y > this.maxY ||
      grid.y < this.minY
    ) {
      return true;
    } else return false;
  }
  isOutOfBounds(grid) {
    if (
      grid.x >= this.width ||
      grid.x < 0 ||
      grid.y >= this.height ||
      grid.y < 0
    ) {
      return true;
    } else return false;
  }
  outside(grid) {
    return this.isOutOfBounds(grid);
  }
  toOtherSide(grid) {
    grid.x = (grid.x + this.width) % this.width;
    grid.y = (grid.y + this.height) % this.height;
    return grid;
  }
  checkLine(start, dir, length, value) {
    while (length > 0) {
      start = start.add(dir);
      if (this.isOutOfBounds(start)) return false;
      if (!this.value(start, value)) return false;
      length--;
    }
    return true;
  }
  checkNext(start, dir, value) {
    let next = start.add(dir);
    if (this.isOutOfBounds(next)) return false;
    return this.value(next, value);
  }
  setNodeMap(where = "nodeMap", path = [0], type = "value") {
    let map = [];
    for (let x = 0; x < this.width; x++) {
      map[x] = [];
      for (let y = 0; y < this.height; y++) {
        let carve;
        switch (type) {
          case "value":
            let value = this.map[this.gridToIndex(new Grid(x, y))];
            carve = path.includes(value);
            break;
          case "exclude":
            carve = !this.check(new Grid(x, y), path.sum());
            break;
          case "include":
            carve = this.check(new Grid(x, y), path.sum());
            break;
          default:
            console.error("nodeMape type error!");
        }

        if (carve) {
          map[x][y] = new PathNode(x, y);
        } else {
          map[x][y] = null;
        }
      }
    }
    this[where] = map;
    return map;
  }
  getDirectionsFromNodeMap(grid, nodeMap, leaveOut = null, allowCross = false) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      if (leaveOut === null || !leaveOut.same(ENGINE.directions[D])) {
        let newGrid = grid.add(ENGINE.directions[D]);

        if (this.outside(newGrid)) {
          if (allowCross) {
            newGrid = this.toOtherSide(newGrid);
          } else continue;
        }

        if (nodeMap[newGrid.x][newGrid.y]) {
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  directionsFromVisitedNodeMap(grid, nodeMap, allowCross = false) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);

      if (this.outside(newGrid)) {
        if (allowCross) {
          newGrid = this.toOtherSide(newGrid);
        } else continue;
      }

      if (nodeMap[newGrid.x][newGrid.y]) {
        if (!nodeMap[newGrid.x][newGrid.y].visited) {
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  findAllNodesOnPath(start, finish, path = [0]) {
    let STACK = [];
    let NODES = [];
    let NodeMap = this.setNodeMap("AllNodes", path);
    STACK.push(start);
    while (STACK.length > 0) {
      let node = STACK.pop();
      NODES.push(node);
      NodeMap[node.x][node.y].visited = true;
      if (GRID.same(node, finish)) continue;
      let dirs = this.directionsFromVisitedNodeMap(node, NodeMap);
      for (const d of dirs) {
        STACK.push(node.add(d));
      }
    }
    return NODES;
  }
  findPath_AStar_fast(start, finish, path = [0], type = "value") {
    /** 
    return
    null: no path exist
    0: start is the same as finish
    nodeMap: path found, extract from nodeMap
    */

    if (GRID.same(start, finish)) {
      return 0;
    }

    var Q = new NodeQ("priority");
    let NodeMap = this.setNodeMap("AStar", path, type);

    NodeMap[start.x][start.y].distance = start.distance(finish);
    NodeMap[start.x][start.y].path = 0;
    NodeMap[start.x][start.y].setPriority();

    Q.queueSimple(NodeMap[start.x][start.y]);
    while (Q.size() > 0) {
      let node = Q.dequeue();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        let x =
          (node.grid.x + ENGINE.directions[D].x + this.width) % this.width;
        let y =
          (node.grid.y + ENGINE.directions[D].y + this.height) % this.height;

        let nextNode = NodeMap[x][y];
        if (nextNode) {
          if (nextNode.path > node.path + 1) {
            nextNode.path = node.path + 1;
            nextNode.prev = node.grid;
            nextNode.distance = nextNode.grid.distance(finish);
            nextNode.setPriority();
            Q.queueSimple(nextNode);
            if (nextNode.distance === 0) {
              return NodeMap;
            }
          }
        }
      }
    }
    return null;
  }
  findPath_AStar(
    start,
    finish,
    path = [0],
    allowCross = false,
    maxPath = Infinity,
    maxIterations = Infinity
  ) {
    var Q = new NodeQ("distance");
    let NodeMap = this.setNodeMap("tempNodeMap", path);
    Q.list.push(new Node(start, finish));
    if (Q.list[0].dist === 0) {
      Q.list[0].status = "Overlap";
      return Q.list[0];
    }
    NodeMap[start.x][start.y].distance = start.distance(finish);
    var selected;
    var iteration = 0;
    while (Q.list.length > 0) {
      iteration++;
      selected = Q.list.shift();

      if (selected.path > maxPath) {
        selected.status = "PathTooLong";
        return selected;
      }

      let dirs = this.getDirectionsFromNodeMap(
        selected.grid,
        NodeMap,
        allowCross
      );
      for (let q = 0; q < dirs.length; q++) {
        let HG = selected.grid.add(dirs[q]);

        if (allowCross) {
          if (this.outside(HG)) {
            HG = this.toOtherSide(HG);
          }
        }

        let history = [].concat(selected.history);
        history.push(HG);
        let I_stack = [].concat(selected.stack);
        I_stack.push(dirs[q]);
        let fork = new Node(
          HG,
          finish,
          I_stack,
          selected.path + 1,
          history,
          iteration
        );
        if (fork.dist === 0) {
          fork.status = "Found";
          return fork;
        }
        let node = NodeMap[fork.grid.x][fork.grid.y];
        if (fork.path < node.distance) {
          node.distance = fork.path;
          Q.queue(fork);
        }
      }

      if (iteration > maxIterations) {
        selected.status = "Abandoned";
        return selected;
      }
    }
    selected.status = "NoSolution";
    return selected;
  }
  setStackValue(stack, value) {
    for (const grid of stack) {
      this.setValue(grid, value);
    }
  }
  floodFill(grid, value, condition = [0]) {
    var Q = [grid];
    let NodeMap = this.setNodeMap("floodFillNodeMap", condition);
    var selected;
    let iterations = 0;
    while (Q.length > 0) {
      selected = Q.shift();
      let dirs = this.getDirectionsFromNodeMap(selected, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let next = selected.add(dirs[q]);
        NodeMap[next.x][next.y] = null;
        Q.push(next);
      }
      this.setValue(selected, value);
      iterations++;
    }
    return iterations;
  }
  floodFillSearch(grid, search, condition = [0]) {
    var Q = [grid];
    let NodeMap = this.setNodeMap("floodFillNodeMap", condition);
    var selected;
    while (Q.length > 0) {
      selected = Q.shift();
      let dirs = this.getDirectionsFromNodeMap(selected, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let next = selected.add(dirs[q]);
        NodeMap[next.x][next.y] = null;
        Q.push(next);
      }
      if (selected.x === search.x && selected.y === search.y) {
        return true;
      }
    }
    return false;
  }
  getDirections(grid, value, leaveOut = null) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      if (leaveOut === null || !leaveOut.same(ENGINE.directions[D])) {
        let newGrid = grid.add(ENGINE.directions[D]);
        if (this.outside(newGrid)) {
          if (GRID.SETTING.ALLOW_CROSS) {
            newGrid = this.toOtherSide(newGrid);
          } else continue;
        }
        if (this.value(newGrid, value)) {
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  getDirectionsIfNot(grid, value, leaveOut = null) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      if (leaveOut === null || !leaveOut.same(ENGINE.directions[D])) {
        let newGrid = grid.add(ENGINE.directions[D]);

        if (!this.check(newGrid, value)) {
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  findPathByValue(grid, follow, find, firstDir) {
    let NodeMap = this.setNodeMap("searchValue", [follow, find]);
    let back = grid.add(firstDir.mirror());
    NodeMap[back.x][back.y].visited = true;
    let Q = [new BlindNode(grid)];
    let iteration = 0;
    while (true) {
      let T = [];
      for (const q of Q) {
        if (this.value(q.grid, find)) {
          q.status = "Found";
          return q;
        }
        NodeMap[q.grid.x][q.grid.y].visited = true;
        let dirs = this.directionsFromVisitedNodeMap(q.grid, NodeMap);
        for (const dir of dirs) {
          let nextGrid = q.grid.add(dir);
          let history = [].concat(q.history);
          history.push(nextGrid);
          let dirStack = [].concat(q.stack);
          dirStack.push(dir);
          let fork = new BlindNode(
            nextGrid,
            dirStack,
            q.path + 1,
            history,
            iteration
          );
          T.push(fork);
        }
      }
      Q = T;
      iteration++;
    }
  }
  cutPath(path, goodValue) {
    let start = 0;
    let end = path.length - 1;
    let mid;
    while (true) {
      mid = Math.floor((end + start) / 2);
      if (mid === start) {
        return path[mid];
      }
      if (this.value(path[mid], goodValue)) {
        start = mid;
      } else {
        end = mid;
      }
    }
  }
  followPathUntil(path, goodValue) {
    for (let i = 1; i < path.length; i++) {
      if (!this.value(path[i], goodValue)) {
        return path[i - 1];
      }
    }
    return path.last();
  }
  xFilterNodes(nodes, badValue) {
    let goodNodes = [];
    for (const node of nodes) {
      let ok = true;
      for (const dir of ENGINE.corners) {
        let check = node.add(dir);
        if (this.value(check, badValue)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        goodNodes.push(node);
      }
    }
    return goodNodes;
  }
  findNextCrossroad(start, dir) {
    let directions = this.getDirectionsIfNot(start, MAPDICT.WALL, dir.mirror());
    while (directions.length <= 1) {
      if (directions.length === 0) return null; //dead end!
      start = start.add(directions[0]);
      directions = this.getDirectionsIfNot(
        start,
        MAPDICT.WALL,
        directions[0].mirror()
      );
    }
    return start;
  }
  positionIsNotWall(pos) {
    let grid = Grid.toClass(pos);
    let check = this.check(grid, MAPDICT.WALL);
    return !check;
  }
  entityNotInWall(pos, dir, r, resolution = 4) {
    let checks = this.pointsAroundEntity(pos, dir, r, resolution = 4);
    for (const point of checks) {
      let notWall = this.positionIsNotWall(point);
      if (!notWall) return false;
    }
    return true;
  }
  pointsAroundEntity(pos, dir, r, resolution = 4) {
    let checks = [];
    for (
      let theta = 0;
      theta < 2 * Math.PI;
      theta += (2 * Math.PI) / resolution
    ) {
      checks.push(pos.translate(dir.rotate(theta), r));
    }
    return checks;
  }
  gridsAroundEntity(pos, dir, r, resolution = 4) {
    let checks = this.pointsAroundEntity(pos, dir, r, resolution = 4);
    checks = checks.filter(this.positionIsNotWall, this);
    return checks.map(Grid.toClass);
  }
  pathClear(path) {
    for (const grid of path) {
      if (this.isWall(grid)) return false;
    }
    return true;
  }
}
class IndexArray {
  constructor(sizeX, sizeY, byte = 1, banks = 1) {
    if (byte !== 1 && byte !== 2 && byte !== 4) {
      console.error(
        "IndexArray set up with wrong size. Reset to default 8 bit!"
      );
      byte = 1;
    }
    banks = parseInt(banks, 10);
    if (banks <= 0 || banks > byte * 4) {
      console.error("Illegal value for banks. Set to default 4!");
      banks = byte * 4;
    }
    let buffer = new ArrayBuffer(sizeX * sizeY * byte);
    let GM;
    switch (byte) {
      case 1:
        GM = new Uint8Array(buffer);
        break;
      case 2:
        GM = new Uint16Array(buffer);
        break;
      case 4:
        GM = new Uint32Array(buffer);
        break;
    }
    this.width = parseInt(sizeX, 10);
    this.height = parseInt(sizeY, 10);
    this.gridSizeBit = byte * 8;
    this.map = GM;
    this.banks = banks;
    this.bankBitWidth = (this.gridSizeBit / this.banks) >>> 0;
    this.layerSize = 2 ** this.bankBitWidth - 1;
  }
  indexToGrid(index) {
    let x = index % this.width;
    let y = Math.floor(index / this.width);
    return new Grid(x, y);
  }
  gridToIndex(grid) {
    if (this.isOutOfBounds(grid)) {
      console.error("grid", grid);
      throw "Grid out of bounds...";
    }
    return grid.x + grid.y * this.width;
  }
  isOutOfBounds(grid) {
    if (
      grid.x >= this.width ||
      grid.x < 0 ||
      grid.y >= this.height ||
      grid.y < 0
    ) {
      return true;
    } else return false;
  }
  validate(bank, indexValue) {
    if (bank >= this.banks || bank < 0) {
      console.error("bank", bank, "max:", this.banks - 1);
      throw "Illegal bank value error.";
    }
    if (indexValue > this.layerSize || indexValue <= 0) {
      console.error("indexValue", indexValue, "max:", this.layerSize);
      throw "Illegal indexValue error.";
    }
  }
  add(grid, indexValue, bank) {
    this.validate(bank, indexValue);
    let index = this.gridToIndex(grid);
    if (bank > 0) {
      indexValue = indexValue << (this.bankBitWidth * bank);
    }
    this.map[index] += indexValue;
  }
  next(grid, indexValue) {
    let bank = this.nextFreeBank(grid);
    if (bank !== -1) {
      this.add(grid, indexValue, bank);
    } else return -1;
  }
  nextFreeBank(grid) {
    let index = this.gridToIndex(grid);
    let layerValue = this.map[index];
    let bank = 0;
    while (layerValue > 0) {
      layerValue = layerValue >>> this.bankBitWidth;
      bank++;
      if (bank >= this.banks) {
        return -1;
      }
    }
    return bank;
  }
  unroll(grid) {
    let index = this.gridToIndex(grid);
    let items = [];
    let layerValue = this.map[index];
    for (let i = 0; i < this.banks; i++) {
      let current = layerValue & this.layerSize;
      if (current !== 0) {
        items.push(current);
      }
      layerValue = layerValue >>> this.bankBitWidth;
    }
    return items;
  }
  unrollArray(arr) {
    let items = [];
    for (let a of arr) {
      items = items.concat(this.unroll(a));
    }
    return new Set(items);
  }
  clear(grid) {
    let index = this.gridToIndex(grid);
    this.map[index] = 0;
  }
  empty(grid) {
    return this.map[this.gridToIndex(grid)] === 0;
  }
  set(grid, indexValue, bank) {
    if (bank === undefined) {
      let index = this.gridToIndex(grid);
      this.map[index] = indexValue;
    } else {
      this.clear(grid);
      this.validate(bank, indexValue);
      this.add(grid, indexValue, bank);
    }
  }
  get(grid) {
    let index = this.gridToIndex(grid);
    return this.map[index];
  }
  has(grid, indexValue) {
    let items = this.unroll(grid);
    return items.includes(indexValue);
  }
  removeIndex(grid, indexValue) {
    let before = this.unroll(grid);
    let after = before.filter((el) => el !== indexValue);
    this.clear(grid);
    for (const [i, a] of after.entries()) {
      this.add(grid, a, i);
    }
  }
  hasFreeBanks(grid) {
    if (this.empty(grid)) {
      return true;
    } else if (this.nextFreeBank(grid) !== -1) {
      return true;
    }
    return false;
  }
  //removeBank() {}
}
var MINIMAP = {
  LEGEND: {
    FOG: "#BBB",
    BORDER: "#FFF",
    EMPTY: "#000",
    ROOM: "#222",
    DOOR: "#111",
    STAIR: "#008000",
    WALL: "#8b4513", //brown
    LOCKED_DOOR: "#826644",
    HERO: "#FFF",
    SHRINE: "#FF00FF",
  },
  DATA: {
    PIX_SIZE: 4,
    layer: null,
    x: 0,
    y: 0,
    dungeon: null,
    drawX: null,
    drawY: null,
    w: null,
    h: null,
    rectWidth: 1
  },
  init(map, W, H, layer = "minimap") {
    this.DATA.dungeon = map;
    this.setLayer(layer);
    this.calcSize(W, H);
  },
  setLayer(layer) {
    this.DATA.layer = layer;
  },
  setOffset(x, y) {
    this.DATA.x = x;
    this.DATA.y = y;
  },
  calcSize(W, H) {
    let WPS = (W / this.DATA.dungeon.width) | 0;
    let HPS = (H / this.DATA.dungeon.height) | 0;
    this.DATA.PIX_SIZE = Math.min(WPS, HPS);
    let newW = this.DATA.dungeon.width * this.DATA.PIX_SIZE;
    let newH = this.DATA.dungeon.height * this.DATA.PIX_SIZE;
    this.DATA.drawX = this.DATA.x + Math.floor((W - newW) / 2);
    this.DATA.drawY = this.DATA.y + Math.floor((H - newH) / 2);
    this.DATA.w = newW;
    this.DATA.h = newH;
  },
  draw() {
    ENGINE.clearLayer(this.DATA.layer);
    let CTX = LAYER[this.DATA.layer];
    CTX.fillStyle = MINIMAP.LEGEND.FOG;
    CTX.strokeStyle = MINIMAP.LEGEND.FOG;
    CTX.strokeRect(
      this.DATA.drawX - this.DATA.rectWidth,
      this.DATA.drawY - this.DATA.rectWidth,
      this.DATA.w + 2 * this.DATA.rectWidth,
      this.DATA.h + 2 * this.DATA.rectWidth
    );
    CTX.fillRect(this.DATA.drawX, this.DATA.drawY, this.DATA.w, this.DATA.h);
    const GA = this.DATA.dungeon.GA;
    for (const [index, value] of GA.map.entries()) {
      if (value >= MAPDICT.FOG) continue;
      let ignored = [MAPDICT.RESERVED, MAPDICT.START_POSITION];
      let mask = 2 ** GA.gridSizeBit - 1;
      for (const ig of ignored) {
        mask -= ig;
      }
      let clenValue = value & mask;
      if (clenValue % 2 === 0) {
        //empty
        switch (clenValue) {
          case MAPDICT.EMPTY:
            CTX.fillStyle = MINIMAP.LEGEND.EMPTY;
            break;
          case MAPDICT.ROOM:
            CTX.fillStyle = MINIMAP.LEGEND.ROOM;
            break;
          case MAPDICT.DOOR:
            CTX.fillStyle = MINIMAP.LEGEND.DOOR;
            break;
          case MAPDICT.STAIR + MAPDICT.ROOM:
          case MAPDICT.STAIR:
            CTX.fillStyle = MINIMAP.LEGEND.STAIR;
            break;
          case MAPDICT.SHRINE + MAPDICT.ROOM:
          case MAPDICT.SHRINE:
            CTX.fillStyle = MINIMAP.LEGEND.SHRINE;
            break;
          default:
            console.log("ALERT default empty", index, value, clenValue);
            CTX.fillStyle = "#F00";
            break;
        }
      } else {
        switch (clenValue) {
          case MAPDICT.WALL:
            CTX.fillStyle = MINIMAP.LEGEND.WALL;
            break;
          default:
            let specificWall = clenValue - MAPDICT.WALL;
            switch (specificWall) {
              case MAPDICT.STAIR:
                CTX.fillStyle = MINIMAP.LEGEND.WALL;
                break;
              case MAPDICT.DOOR:
                CTX.fillStyle = MINIMAP.LEGEND.LOCKED_DOOR;
                break;
              default:
                console.log("ALERT default wall", index, value, clenValue);
                CTX.fillStyle = "#E00";
                break;
            }
            break;
        }
      }
      let grid = GA.indexToGrid(index);
      CTX.pixelAt(
        this.DATA.drawX + grid.x * this.DATA.PIX_SIZE,
        this.DATA.drawY + grid.y * this.DATA.PIX_SIZE,
        this.DATA.PIX_SIZE
      );
    }

    //keys
    for (const key in this.DATA.dungeon.keys) {
      if (this.DATA.dungeon.GA.isFog(this.DATA.dungeon.keys[key])) continue;
      CTX.fillStyle = key.toLowerCase();
      CTX.pixelAt(
        this.DATA.drawX + this.DATA.dungeon.keys[key].x * this.DATA.PIX_SIZE,
        this.DATA.drawY + this.DATA.dungeon.keys[key].y * this.DATA.PIX_SIZE,
        this.DATA.PIX_SIZE
      );
    }

    CTX.fillStyle = MINIMAP.LEGEND.HERO;
    let heroPos = Grid.toClass(PLAYER.pos);

    CTX.pixelAt(
      this.DATA.drawX + heroPos.x * this.DATA.PIX_SIZE,
      this.DATA.drawY + heroPos.y * this.DATA.PIX_SIZE,
      this.DATA.PIX_SIZE
    );
  },
  unveil(at, vision = 1) {
    let x = at.x - vision;
    let y = at.y - vision;
    let range = 2 * vision + 1;
    for (let ix = x; ix < x + range; ix++) {
      for (let iy = y; iy < y + range; iy++) {
        let grid = new Grid(ix, iy);
        if (!this.DATA.dungeon.GA.isOutOfBounds(grid)) {
          this.DATA.dungeon.GA.clearFog(grid);
        }
      }
    }
  },
  reveal(origin, r) {
    let GA = this.DATA.dungeon.GA;
    let map = this.DATA.dungeon;
    let sX = Math.max(0, origin.x - r);
    let sY = Math.max(0, origin.y - r);
    let eX = Math.min(origin.x + r, map.maxX);
    let eY = Math.min(origin.y + r, map.maxY);
    for (let x = sX; x <= eX; x++) {
      for (let y = sY; y <= eY; y++) {
        let grid = new Grid(x, y);
        GA.clearFog(grid);
      }
    }
  }
};
//END
console.log(`%cGRID ${GRID.VERSION} loaded.`, GRID.CSS);