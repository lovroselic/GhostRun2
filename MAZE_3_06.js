/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

///////////////////////Dungeon.js///////////////
//                                            //
//        Procedureal maze and dungeon        //
//             generation: 3.06               //
//                                            //
//    dependencies: Prototype LS, ENGINE      //
////////////////////////////////////////////////

/*
TODO:

known bugs:

*/

class Room {
    constructor(id, area, type = "common") {
        this.id = id;
        this.area = area;
        this.squareSize = area.w * area.h;
        this.type = type;
        this.door = [];
        this.reservedCount = 0;
    }
    randomGrid() {
        let grid;
        do {
            grid = new Grid(
                RND(this.area.x, this.area.x + this.area.w - 1),
                RND(this.area.y, this.area.y + this.area.h - 1)
            );
        } while (this.GA.isReserved(grid));
        return grid;
    }
    random_Uninhabited_Grid(obstacles = []) {
        let grid;
        do {
            grid = new Grid(
                RND(this.area.x, this.area.x + this.area.w - 1),
                RND(this.area.y, this.area.y + this.area.h - 1)
            );
        } while (this.GA.isStartPosition(grid) || grid.isInAt(obstacles) !== -1);
        this.GA.setStartPosition(grid);
        return grid;
    }
    hasSpace() {
        if (this.reservedCount / this.squareSize > 0.5) return false;
        else return true;
    }
}
class Tree {
    constructor(leaf) {
        this.leaf = leaf;
        this.left = null;
        this.right = null;
    }
    getLeafs() {
        if (this.left === null && this.right === null) {
            return [this.leaf];
        } else return [].concat(this.left.getLeafs(), this.right.getLeafs());
    }
    hasBothKids() {
        if (this.left !== null && this.right !== null) {
            return true;
        } else return false;
    }
    liveBranch() {
        if (this.left === null || this.right === null) return false;
        return this.left.hasBothKids() && this.right.hasBothKids();
    }
    deadEnd() {
        if (this.left === null && this.right === null) {
            return true;
        } else return false;
    }
}
class Bias {
    constructor(size) {
        this.size = size;
        this.reset();
    }
    reset() {
        this.current = 0;
        this.active = false;
        this.direction = null;
    }
    activate(dir) {
        this.active = true;
        this.direction = dir;
        this.current++;
    }
    next() {
        this.current++;
        if (this.current >= this.size) this.reset();
    }
}
class MasterDungeon {
    constructor(sizeX, sizeY, arraySize = 1) {
        this.width = parseInt(sizeX, 10);
        this.height = parseInt(sizeY, 10);
        this.maxX = sizeX - 2;
        this.maxY = sizeY - 2;
        this.minX = 1;
        this.minY = 1;
        this.deadEnds = [];
        this.nodeMap = null;
        this.entrance = null;
        this.exit = null;
        this.startPosition = null;
        this.obstacles = []; //check!!
        this.rooms = [];
        this.lockedRooms = {};
        this.keys = {};
        this.GA = new GridArray(sizeX, sizeY, arraySize, 1);
    }
    connectRooms(N, off = 1) {
        const conn = ["common", "temple"];
        for (let q = 0, RL = this.rooms.length; q < RL; q++) {
            let room = this.rooms[q];
            if (!conn.includes(room.type)) continue;

            if (!N) {
                if (DUNGEON.SINGLE_DOOR) {
                    N = 1;
                } else if (room.squareSize < 20) {
                    N = RND(1, 2);
                } else N = RND(2, 4);
            }

            this.connectToGrid(room, N, off);
            room.priority = 1 + q;
        }
    }
    hasConnections(grid) {
        let dots = 0;
        for (let q = 0; q < ENGINE.directions.length; q++) {
            let nextGrid = grid.add(ENGINE.directions[q]);
            if (this.GA.isEmpty(nextGrid)) dots++;
        }
        return dots;
    }
    connectToGrid(room, N, off = 1) {
        let connections = this.findConnections(room, off);
        let NoOfDoors = Math.min(N, connections.length);
        if (NoOfDoors === 0) {
            console.error("Cannot connect room to grid with standard procedure ERROR");
            console.warn("Tunneling!");
            return this.tunnelToGrid(room, N, off);
        } else {
            do {
                let door = connections.removeRandom();
                this.GA.toDoor(door);
                room.door.push(door);
                NoOfDoors--;
            } while (NoOfDoors > 0);
        }
    }
    tunnelToGrid(room, N, off = 1) {
        let connections = this.findTunnels(room, off);
        let NoOfDoors = Math.min(N, connections.length);
        if (NoOfDoors === 0) {
            console.error("no connections even after tunneling!");
            return;
        } else {
            do {
                let tunnel = connections.removeRandom();
                let door = tunnel.start;
                this.GA.toDoor(door);
                this.GA.carveDot(door.add(tunnel.direction));
                room.door.push(door);
                NoOfDoors--;
            } while (NoOfDoors > 0);
        }
    }
    findTunnels(room, off = 1) {
        room = room.area;
        var pool = [];
        let up = [];
        let down = [];
        let left = [];
        let right = [];
        for (let x = room.x + off; x < room.x + room.w - off; x++) {
            let bridge = new Grid(x, room.y - 1);
            let outer = bridge.add(UP);
            let next = outer.add(UP);
            if (
                this.GA.isEmpty(next) &&
                this.hasConnections(bridge) === 1 &&
                this.hasConnections(outer) === 1
            ) {
                up.push({ start: bridge, direction: UP });
            }
        }
        for (let x = room.x + off; x < room.x + room.w - off; x++) {
            let bridge = new Grid(x, room.y + room.h);
            let outer = bridge.add(DOWN);
            let next = outer.add(DOWN);
            if (
                this.GA.isEmpty(next) &&
                this.hasConnections(bridge) === 1 &&
                this.hasConnections(outer) === 1
            ) {
                down.push({ start: bridge, direction: DOWN });
            }
        }
        for (let y = room.y + off; y < room.y + room.h - off; y++) {
            let bridge = new Grid(room.x - 1, y);
            let outer = bridge.add(LEFT);
            let next = outer.add(LEFT);
            if (
                this.GA.isEmpty(next) &&
                this.hasConnections(bridge) === 1 &&
                this.hasConnections(outer) === 1
            ) {
                left.push({ start: bridge, direction: LEFT });
            }
        }
        for (let y = room.y + off; y < room.y + room.h - off; y++) {
            let bridge = new Grid(room.x + room.w, y);
            let outer = bridge.add(RIGHT);
            let next = outer.add(RIGHT);
            if (
                this.GA.isEmpty(next) &&
                this.hasConnections(bridge) === 1 &&
                this.hasConnections(outer) === 1
            ) {
                right.push({ start: bridge, direction: RIGHT });
            }
        }
        if (up.length) pool.push(up.chooseRandom());
        if (down.length) pool.push(down.chooseRandom());
        if (left.length) pool.push(left.chooseRandom());
        if (right.length) pool.push(right.chooseRandom());
        return pool;
    }
    findConnections(room, off = 1) {
        room = room.area;
        var pool = [];
        let up = [];
        let down = [];
        let left = [];
        let right = [];
        for (let x = room.x + off; x < room.x + room.w - off; x++) {
            let bridge = new Grid(x, room.y - 1);
            let next = bridge.add(UP);
            if (this.GA.isEmpty(next) && this.hasConnections(bridge) === 2) {
                up.push(bridge);
            }
        }
        for (let x = room.x + off; x < room.x + room.w - off; x++) {
            let bridge = new Grid(x, room.y + room.h);
            let next = bridge.add(DOWN);
            if (this.GA.isEmpty(next) && this.hasConnections(bridge) === 2) {
                down.push(bridge);
            }
        }
        for (let y = room.y + off; y < room.y + room.h - off; y++) {
            let bridge = new Grid(room.x - 1, y);
            let next = bridge.add(LEFT);
            if (this.GA.isEmpty(next) && this.hasConnections(bridge) === 2) {
                left.push(bridge);
            }
        }
        for (let y = room.y + off; y < room.y + room.h - off; y++) {
            let bridge = new Grid(room.x + room.w, y);
            let next = bridge.add(RIGHT);
            if (this.GA.isEmpty(next) && this.hasConnections(bridge) === 2) {
                right.push(bridge);
            }
        }
        if (up.length) pool.push(up.chooseRandom());
        if (down.length) pool.push(down.chooseRandom());
        if (left.length) pool.push(left.chooseRandom());
        if (right.length) pool.push(right.chooseRandom());
        return pool;
    }
    centerTopEntry(room) {
        return new Grid(room.area.x + (room.area.h - 1) / 2, room.area.y - 1);
    }
    randomEntry(room) {
        room = room.area;
        var pool = [];
        for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
            pool.push(new Grid(x, room.y - 1));
            pool.push(new Grid(x, room.y + room.h));
        }
        for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
            pool.push(new Grid(room.x - 1, y));
            pool.push(new Grid(room.x + room.w, y));
        }
        return pool.chooseRandom();
    }
    randomUnusedEntry(room) {
        room = room.area;
        var pool = [];
        for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
            let top = new Grid(x, room.y - 1);
            let bottom = new Grid(x, room.y + room.h);
            if (this.gridAndAdjacentAvailable(top, LEFT, RIGHT)) {
                pool.push(top);
            }
            if (this.gridAndAdjacentAvailable(bottom, LEFT, RIGHT)) {
                pool.push(bottom);
            }
        }
        for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
            let left = new Grid(room.x - 1, y);
            let right = new Grid(room.x + room.w, y);
            if (this.gridAndAdjacentAvailable(left, UP, DOWN)) {
                pool.push(left);
            }
            if (this.gridAndAdjacentAvailable(right, UP, DOWN)) {
                pool.push(right);
            }
        }
        return pool.chooseRandom();
    }
    gridAndAdjacentAvailable(grid, d1, d2) {
        return (
            this.gridAvailable(grid) &&
            this.gridAvailable(grid.add(d1)) &&
            this.gridAvailable(grid.add(d2))
        );
    }
    gridAvailable(grid) {
        return this.GA.notDoor(grid) && this.GA.notStair(grid) && this.GA.isWall(grid);
    }
    singleCenteredRoom() {
        let roomArr = [];
        let size = DUNGEON.MAX_ROOM;
        let x = Math.floor((this.width - size) / 2);
        let y = Math.floor((this.height - size) / 2);
        let area = new Area(x, y, size, size);
        this.carveRoom(area);
        let room = new Room(0, area);
        roomArr.push(room);
        return roomArr;
    }
    makeRooms() {
        let roomArr = [];
        let id = 0;
        if (DUNGEON.LIMIT_ROOMS) {
            this.areas.shuffle();
        }
        for (const area of this.areas) {
            let W = area.w - 2 * DUNGEON.MIN_PADDING;
            let H = area.h - 2 * DUNGEON.MIN_PADDING;
            W = RND(DUNGEON.MIN_ROOM, Math.min(W, DUNGEON.MAX_ROOM));
            H = RND(DUNGEON.MIN_ROOM, Math.min(H, DUNGEON.MAX_ROOM));
            let X = area.x + DUNGEON.MIN_PADDING;
            let Y = area.y + DUNGEON.MIN_PADDING;
            let DW = area.w - W - 2 * DUNGEON.MIN_PADDING;
            let DH = area.h - H - 2 * DUNGEON.MIN_PADDING;
            X += RND(0, DW);
            Y += RND(0, DH);
            let room = new Area(X, Y, W, H);
            this.carveRoom(room);
            let RoomObj = new Room(id, room);
            area.room = RoomObj;
            roomArr.push(RoomObj);
            id++;
            if (DUNGEON.LIMIT_ROOMS) {
                if (roomArr.length === DUNGEON.ROOM_LIMIT) {
                    break;
                }
            }
        }
        return roomArr;
    }
    carveRoom(room) {
        for (let x = room.x; x < room.x + room.w; x++) {
            for (let y = room.y; y < room.y + room.h; y++) {
                let grid = new Grid(x, y);
                this.GA.toRoom(grid);
            }
        }
    }
    setStartPosition() {
        let start = this.findRoom("start");
        this.startPosition = this.findMiddleSpace(start.area);
        this.GA.reserve(this.startPosition);
        this.GA.setStartPosition(this.startPosition);
    }
    findMiddleSpace(area) {
        let pool = [];
        for (let x = area.x + 1; x < area.x + area.w - 1; x++) {
            for (let y = area.y + 1; y < area.y + area.h - 1; y++) {
                let grid = new Grid(x, y);
                if (this.GA.notReserved(grid)) {
                    pool.push(grid);
                }
            }
        }
        if (pool.length > 0) {
            let selected = pool.chooseRandom();
            this.GA.reserve(selected);
            return selected;
        } else return null;
    }
    findMiddleSpaceUnreserved(area) {
        let pool = [];
        for (let x = area.x + 1; x < area.x + area.w - 1; x++) {
            for (let y = area.y + 1; y < area.y + area.h - 1; y++) {
                let grid = new Grid(x, y);
                pool.push(grid);
            }
        }
        return pool.chooseRandom();
    }
    findSpace(area) {
        let pool = [];
        for (let x = area.x; x < area.x + area.w; x++) {
            for (let y = area.y; y < area.y + area.h; y++) {
                let grid = new Grid(x, y);
                if (this.GA.notReserved(grid)) {
                    pool.push(grid);
                }
            }
        }
        let selected = pool.chooseRandom();
        this.GA.reserve(selected);
        return selected;
    }
    findRoom(type) {
        let room;
        for (let q = 0, LN = this.rooms.length; q < LN; q++) {
            room = this.rooms[q];
            if (room.type === type) return room;
        }
        return null;
    }
    isDeadEnd(grid) {
        let dots = 0;
        for (let q = 0; q < ENGINE.directions.length; q++) {
            let nextGrid = grid.add(ENGINE.directions[q]);
            if (this.GA.isEmpty(nextGrid)) dots++;
        }
        if (dots === 1) {
            return true;
        } else return false;
    }
    isInRoom(grid, room) {
        if (
            grid.x >= room.area.x &&
            grid.x <= room.area.x + room.area.w - 1 &&
            grid.y >= room.area.y &&
            grid.y <= room.area.y + room.area.h - 1
        )
            return true;
        else return false;
    }
    isInRoomOrItsDoors(grid, room) {
        if (this.isInRoom(grid, room)) {
            return true;
        } else {
            for (let q = 0; q < room.door.length; q++) {
                if (grid.same(room.door[q])) return true;
            }
        }
        return false;
    }
    isInAnyRoom(grid) {
        return this.GA.isRoom(grid);
    }
    isInWhichRoom(grid) {
        for (let q = 0, LN = this.rooms.length; q < LN; q++) {
            let room = this.rooms[q];
            if (this.isInRoom(grid, room)) return room;
        }
        return null;
    }
    getFreeCorrGrid(obstacles = []) {
        let grid;
        do {
            grid = new Grid(RND(this.minX, this.maxX), RND(this.minY, this.maxY));
        } while (
            !this.GA.isEmpty(grid) ||
            this.isInAnyRoom(grid) ||
            this.GA.isReserved(grid) ||
            grid.isInAt(obstacles) !== -1
        );
        this.GA.reserve(grid);
        return grid;
    }
    getUninhabitedCorrGrid(obstacles = []) {
        let grid;
        do {
            grid = new Grid(RND(this.minX, this.maxX), RND(this.minY, this.maxY));
        } while (
            !this.GA.isEmpty(grid) ||
            this.isInAnyRoom(grid) ||
            this.GA.isStartPosition(grid) ||
            grid.isInAt(obstacles) !== -1
        );
        this.GA.setStartPosition(grid);
        return grid;
    }
    getAnyGrid() {
        return new Grid(RND(this.minX, this.maxX), RND(this.minY, this.maxY));
    }
    getFreeAnyGrid() {
        let grid = new Grid(RND(this.minX, this.maxX), RND(this.minY, this.maxY));
        if (!this.GA.isEmpty(grid)) return this.getFreeAnyGrid();
        if (this.GA.isReserved(grid)) return this.getFreeAnyGrid();
        let isDE = grid.isInAt(this.deadEnds);
        if (isDE !== -1) {
            this.deadEnds.splice(isDE, 1);
            this.GA.reserve(grid);
            return grid;
        }
        if (this.GA.isRoom(grid)) {
            let room = this.isInWhichRoom(grid);
            if (room.hasSpace()) {
                this.GA.reserve(grid);
                return grid;
            } else return this.getFreeAnyGrid();
        } else {
            this.GA.reserve(grid);
            return grid;
        }
    }
    getFreeRoomGrid() {
        let room;
        do {
            room = this.rooms.chooseRandom();
        } while (!room.hasSpace());
        let grid = room.randomGrid();
        this.GA.reserve(grid);
        return grid;
    }
    setObstacles() {
        this.obstacles.clear();
        this.obstacles = [...arguments].flat().filter((el) => el !== null);
    }
    setNodeMap() {
        return this.GA.setNodeMap("nodeMap", [MAPDICT.WALL], "exclude", this.obstacles);
    }
    gridDistance(grid) {
        if (!this.nodeMap) return -1;
        return this.nodeMap[grid.x][grid.y].distance;
    }
    nextDirToGoal(grid) {
        if (!this.nodeMap) return -1;
        let prev = this.nodeMap[grid.x][grid.y].prev;
        return grid.direction(prev);
    }
    rectCircularCorridor(x, y, w, h) {
        for (let X = x; X < x + w; X++) {
            this.GA.carveDot(new Grid(X, y));
            this.GA.carveDot(new Grid(X, y + h - 1));
        }
        for (let Y = y; Y < y + h; Y++) {
            this.GA.carveDot(new Grid(x, Y));
            this.GA.carveDot(new Grid(x + w - 1, Y));
        }
    }
    connectionCandidates(DeadEnd) {
        let possible = [];
        for (let z = 0; z < 4; z++) {
            let bridge = DeadEnd.add(ENGINE.directions[z]);
            if (this.GA.isWall(bridge)) {
                let test = bridge.add(ENGINE.directions[z]);
                if (this.GA.isEmpty(test)) {
                    let connections = this.hasConnections(bridge);
                    if (connections === 2) {
                        if (!this.isInAnyRoom(test) && DUNGEON.REFUSE_CONNECTION_TO_ROOM) {
                            possible.push(bridge);
                        }
                    }
                }
            }
        }
        return possible;
    }
    _DE_connection(butLeave) {
        this.deadEnds = [...this.deadEnds];
        if (this.deadEnds.length === 0) return;
        let candidates;
        if (butLeave === 0) {
            candidates = this.deadEnds.splice(0);
        } else {
            candidates = this.deadEnds.removeRandomPool(this.deadEnds.length - butLeave);
        }
        let CL = candidates.length;
        for (let q = 0; q < CL; q++) {
            let DeadEnd = candidates[q];
            if (this.isDeadEnd(DeadEnd)) {
                let possible = this.connectionCandidates(DeadEnd);

                if (possible.length) {
                    this.GA.carveDot(possible.chooseRandom());
                } else {
                    this.deadEnds.push(DeadEnd);
                }
            }
        }
        for (let w = this.deadEnds.length - 1; w >= 0; w--) {
            let DeadEnd = this.deadEnds[w];
            if (!this.isDeadEnd(DeadEnd)) {
                this.deadEnds.splice(w, 1);
            }
        }
    }
    connectSomeDeadEnds(butLeave) {
        this._DE_connection(butLeave);
    }
    connectDeadEnds() {
        this._DE_connection(0);
    }
    eradicateDeadEnds() {
        do {
            this.connectDeadEnds();
            this.polishDeadEnds();
        } while (this.deadEnds.length > 0);
    }
    getConnectionCandidates() {
        let candidates = [];
        for (let y = this.minY + 1; y < this.maxY; y++) {
            for (let x = this.minX + 1; x < this.maxX; x++) {
                let test = new Grid(x, y);
                if (this.hasAnyConnection(test)) {
                    candidates.push(test);
                }
            }
        }
        return candidates;
    }
    addConnections() {
        let missing = this.missingToDensity(MAZE.targetDensity);
        let candidates = this.getConnectionCandidates();
        do {
            if (candidates.length === 0) break;
            let selected = candidates.removeRandom();
            if (this.hasAnyConnection(selected)) {
                this.GA.carveDot(selected);
                missing--;
            } else continue;
        } while (missing > 0);
    }
    hasAnyConnection(grid) {
        if (
            this.hasVerticalConnections(grid) ||
            this.hasHorizontalConnections(grid)
        ) {
            return true;
        } else return false;
    }
    hasVerticalConnections(grid) {
        if (this.isBridge(grid, UP, DOWN)) {
            return true;
        } else return false;
    }
    hasHorizontalConnections(grid) {
        if (this.isBridge(grid, LEFT, RIGHT)) {
            return true;
        } else return false;
    }
    isBridge(grid, v1, v2) {
        if (this.GA.isWall(grid) && this.hasConnections(grid) === 2) {
            let D1 = grid.add(v1);
            let D2 = grid.add(v2);
            if (
                this.GA.isEmpty(D1) &&
                this.GA.isEmpty(D2) &&
                !this.isInAnyRoom(D1) &&
                !this.isInAnyRoom(D2)
            ) {
                return true;
            } else return false;
        } else return false;
    }
    measureDensity() {
        let total = (this.maxY - this.minY) * (this.maxX - this.minX);
        let empty = this.allDots();
        let density = empty / total;
        return density.toFixed(3);
    }
    allDots() {
        let empty = 0;
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                let grid = new Grid(x, y);
                if (this.GA.isEmpty(grid)) empty++;
            }
        }
        return empty;
    }
    missingToDensity(density) {
        let dots = this.allDots();
        let total = (this.maxY - this.minY) * (this.maxX - this.minX);
        let required = total * density;
        let missing = Math.floor(required) - dots;
        return missing;
    }
    polishDeadEnds(short = false) {
        /**
         * if true, only size-1 DE are polished, else any, but shortened for only 1 grid
         */
        let cons = 2;
        if (short) cons = 3;
        this.deadEnds = [...this.deadEnds];
        for (let q = this.deadEnds.length - 1; q >= 0; q--) {
            let deadEnd = this.deadEnds[q];
            if (!this.isDeadEnd(deadEnd)) continue;
            if (this.GA.isStair(deadEnd)) continue;
            let dir = this.deadEndDirection(deadEnd);
            let next = deadEnd.add(dir);
            if (this.hasConnections(next) >= cons) {
                this.GA.toWall(deadEnd);
                this.deadEnds.splice(q, 1);
                if (this.isDeadEnd(next)) {
                    this.deadEnds.push(next);
                }
            }
        }
    }
    deadEndDirection(DE) {
        for (let z = 0; z < 4; z++) {
            let test = DE.add(ENGINE.directions[z]);
            if (this.GA.isEmpty(test)) return ENGINE.directions[z];
        }
        return null;
    }
    recheckDeadEnds() {
        for (let q = this.deadEnds.length - 1; q >= 0; q--) {
            let deadEnd = this.deadEnds[q];
            if (!this.isDeadEnd(deadEnd)) this.deadEnds.splice(q, 1);
        }
    }
    removeLongDeadEnds() {
        for (let q = 0; q < this.deadEnds.length; q++) {
            let DE = this.deadEnds[q];
            while (this.isDeadEnd(DE)) {
                let dir = this.deadEndDirection(DE);
                let possible = this.connectionCandidates(DE);
                if (possible.length) {
                    this.GA.isEmpty(possible.chooseRandom());
                    break;
                } else {
                    this.GA.toWall(DE);
                    DE = DE.add(dir);
                }
            }
        }
    }
    scanForDeadEnds() {
        let deadEnds = [];
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                let grid = new Grid(x, y);
                if (this.GA.isEmpty(grid) && this.isDeadEnd(grid)) deadEnds.push(grid);
            }
        }
        return deadEnds;
    }
    findFreeCorner(corner, dir1, dir2) {
        let possible = [];
        while (true) {
            possible.push(corner);

            let dir1m = dir1.mirror();
            let c1 = corner;
            while (!this.GA.isOut(c1.add(dir1m))) {
                c1 = c1.add(dir1m);
                possible.push(c1);
            }

            let dir2m = dir2.mirror();
            let c2 = corner;
            while (!this.GA.isOut(c2.add(dir2m))) {
                c2 = c2.add(dir2m);
                possible.push(c2);
            }

            while (possible.length > 0) {
                let opt = possible.removeRandom();
                if (this.GA.isEmpty(opt)) {
                    return opt;
                }
            }

            corner = corner.add(dir1).add(dir2);
        }
    }
    nextPointers(grid) {
        var pointerCandidates = [];
        for (let q = 0; q < 4; q++) {
            let checkedGrid = grid.add(ENGINE.directions[q]);
            if (!this.GA.isOut(checkedGrid) && this.GA.isWall(checkedGrid)) {
                pointerCandidates.push(new Pointer(checkedGrid, ENGINE.directions[q]));
            }
        }
        const PL = pointerCandidates.length;
        for (let w = PL - 1; w >= 0; w--) {
            if (!this.safePointer(pointerCandidates[w]))
                pointerCandidates.splice(w, 1);
        }
        return pointerCandidates;
    }
    safePointer(pointer) {
        let allDirections = [...ENGINE.directions, ...ENGINE.corners];
        let back = pointer.vector.mirror();
        back.trimMirror(allDirections);
        const ADL = allDirections.length;
        for (let q = 0; q < ADL; q++) {
            let testGrid = pointer.grid.add(allDirections[q]);
            if (this.GA.isEmpty(testGrid)) return false;
        }
        return true;
    }
    open() {
        if (MAZE.openDirs === null) {
            console.error("Supply array of directions for opening the maze");
            return true;
        }
        let x = null;
        let y = null;
        for (const dir of MAZE.openDirs) {
            let done = false;
            if (dir.x === 0) {
                x = Math.floor(this.width / 2);
            } else if (dir.x === -1) {
                x = 0;
            } else {
                x = this.width - 1;
            }
            if (dir.y === 0) {
                y = Math.floor(this.height / 2);
            } else if (dir.y === -1) {
                y = 0;
            } else {
                y = this.height - 1;
            }
            if (dir.x === 0) {
                let look = dir.mirror();
                let start = new Grid(x, y);
                let check = start.add(look);
                if (this.GA.isEmpty(check)) {
                    this.GA.carveDot(start);
                    done = true;
                    continue;
                }

                let left = start;
                let right = start;
                do {
                    left = left.add(LEFT);
                    right = right.add(RIGHT);
                    check = left.add(look);
                    if (this.GA.isEmpty(check)) {
                        this.GA.carveDot(left);
                        done = true;
                        break;
                    }
                    check = right.add(look);
                    if (this.GA.isEmpty(check)) {
                        this.GA.carveDot(right);
                        done = true;
                        break;
                    }
                } while (left.x > 0 && right.x < this.width - 1);
            } else if (dir.y === 0) {
                let look = dir.mirror();
                let start = new Grid(x, y);
                let check = start.add(look);
                if (this.GA.isEmpty(check)) {
                    this.GA.carveDot(start);
                    done = true;
                    continue;
                }
                let up = start;
                let down = start;
                do {
                    up = up.add(UP);
                    down = down.add(DOWN);
                    check = up.add(look);
                    if (this.GA.isEmpty(check)) {
                        this.GA.carveDot(up);
                        done = true;
                        break;
                    }
                    check = down.add(look);
                    if (this.GA.isEmpty(check)) {
                        this.GA.carveDot(down);
                        done = true;
                        break;
                    }
                } while (up.y > 0 && down.y < this.height - 1);
            }
            if (!done) {
                console.error("Opening not done on face:", dir);
                return false;
            }
        }
        return true;
    }
    adjacentToRoom(grid) {
        for (let i = 0; i < ENGINE.directions.length; i++) {
            let temp = grid.add(ENGINE.directions[i]);
            if (this.isInAnyRoom(temp)) return true;
        }
        return false;
    }
    carveMaze(start) {
        if (MAZE.storeDeadEnds) this.deadEnds = new Set();
        if (MAZE.useBias) this.bias = new Bias(MAZE.bias);
        this.density = null;

        let STACK = [];
        let selected, nextBranchPointer;
        let count = 0;
        let branch = 0;

        if (MAZE.storeDeadEnds) {
            this.deadEnds.add(start);
        }

        do {
            branch++;
            count = 0;
            do {
                count++;
                this.GA.carveDot(start);
                let pointers = this.nextPointers(start);
                if (pointers.length > 0) {
                    if (MAZE.useBias && this.bias.active) {
                        let check = this.bias.direction.isInPointerArray(pointers);
                        if (check !== -1) {
                            selected = pointers.splice(check, 1)[0];
                            this.bias.next();
                        } else {
                            selected = pointers.removeRandom();
                            if (MAZE.useBias) this.bias.activate(selected.vector);
                        }
                    } else {
                        selected = pointers.removeRandom();
                        if (MAZE.useBias) this.bias.activate(selected.vector);
                    }
                    start = selected.grid;
                    STACK = [...STACK, ...pointers];
                } else {
                    if (MAZE.storeDeadEnds) {
                        this.deadEnds.add(start);
                    }
                    break;
                }
            } while (true);
            do {
                if (STACK.length === 0) return;
                nextBranchPointer = STACK.pop();
            } while (!this.safePointer(nextBranchPointer));
            start = nextBranchPointer.grid;
        } while (true);

        this.recheckDeadEnds();
    }
    roomWallGrids(room) {
        let grids = [];
        let component = [1, -1];
        for (let x = room.area.x + 1; x < room.area.x + room.area.w - 1; x++) {
            for (let [i, y] of [
                room.area.y - 1,
                room.area.y + room.area.h
            ].entries()) {
                let grid = new Grid(x, y);
                let dir = new Vector(0, component[i]);
                if (
                    this.GA.isWall(grid) &&
                    this.GA.notDoor(grid) &&
                    this.GA.notReserved(grid)
                ) {
                    grids.push({ grid: grid, dir: dir });
                }
            }
        }
        for (let y = room.area.y + 1; y < room.area.y + room.area.h - 1; y++) {
            for (let [i, x] of [
                room.area.x - 1,
                room.area.x + room.area.w
            ].entries()) {
                let grid = new Grid(x, y);
                let dir = new Vector(component[i], 0);
                if (
                    this.GA.isWall(grid) &&
                    this.GA.notDoor(grid) &&
                    this.GA.notReserved(grid)
                ) {
                    grids.push({ grid: grid, dir: dir });
                }
            }
        }

        return grids;
    }
    roomCornerGrids(room) {
        let grids = [];
        grids.push({ grid: new Grid(room.area.x, room.area.y), dir: [LEFT, UP] });
        grids.push({
            grid: new Grid(room.area.x, room.area.y + room.area.h - 1),
            dir: [LEFT, DOWN]
        });
        grids.push({
            grid: new Grid(
                room.area.x + room.area.w - 1,
                room.area.y + room.area.h - 1
            ),
            dir: [RIGHT, DOWN]
        });
        grids.push({
            grid: new Grid(room.area.x + room.area.w - 1, room.area.y),
            dir: [RIGHT, UP]
        });

        while (grids.length > 0) {
            let selected = grids.chooseRandom();
            if (this.GA.notReserved(selected.grid)) {
                this.GA.reserve(selected.grid);
                return selected;
            }
        }
        return null;
    }
    poolOfRoomGrids(N) {
        let pool = [];
        for (let x = this.minX; x <= this.maxX; x++) {
            for (let y = this.minY; y <= this.maxY; y++) {
                let grid = new Grid(x, y);
                if (this.GA.notReserved(grid) && this.GA.isRoom(grid)) {
                    pool.push(grid);
                }
            }
        }
        return this.reservePool(N, pool);
    }
    poolOfCorridorGrids(N) {
        let pool = [];
        for (let x = this.minX; x <= this.maxX; x++) {
            for (let y = this.minY; y <= this.maxY; y++) {
                let grid = new Grid(x, y);
                if (
                    this.GA.notReserved(grid) &&
                    !this.GA.isRoom(grid) &&
                    this.GA.notWall(grid)
                ) {
                    pool.push(grid);
                }
            }
        }
        return this.reservePool(N, pool);
    }
    poolOfGrids(N) {
        let pool = [];
        for (let x = this.minX; x <= this.maxX; x++) {
            for (let y = this.minY; y <= this.maxY; y++) {
                let grid = new Grid(x, y);
                if (this.GA.notReserved(grid) && this.GA.notWall(grid)) {
                    pool.push(grid);
                }
            }
        }
        return this.reservePool(N, pool);
    }
    reservePool(N, pool) {
        let selected = pool.removeRandomPool(N);
        for (const S of selected) {
            this.GA.reserve(S);
        }
        return selected;
    }
    poolOfUnreservedWallGrids() {
        let pool = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let grid = new Grid(x, y);
                if (this.GA.notReserved(grid) && this.GA.isWall(grid)) {
                    pool.push(grid);
                }
            }
        }
        return pool;
    }
    poolOfCorridorDecalGrids(N) {
        let pool = this.poolOfUnreservedWallGrids();
        let decalGrids = [];
        while (N > 0) {
            let candidate = pool.removeRandom();
            let dirCandidates = [];
            for (let dir of ENGINE.directions) {
                let floorGrid = candidate.add(dir);
                if (this.GA.isOut(floorGrid)) continue;
                if (this.GA.notWall(floorGrid)) {
                    if (this.GA.notDoor(floorGrid) && this.GA.notRoom(floorGrid)) {
                        dirCandidates.push(dir);
                    }
                }
            }
            if (dirCandidates.length > 0) {
                let dir = dirCandidates.chooseRandom();
                decalGrids.push({ grid: candidate, dir: dir });
                this.GA.reserve(candidate);
                N--;
            }
        }
        return decalGrids;
    }
    freeDeadEnds(N) {
        let DE = [];
        for (let de of this.deadEnds) {
            if (DE.length >= N) return DE;
            if (this.GA.notReserved(de)) {
                DE.push(de);
                this.GA.reserve(de);
            }
        }
        return DE;
    }
    splitArea(area, iteration, parent) {
        var root = new Tree(area);
        if (area.w <= 2 * parent.PAD && area.h <= 2 * parent.PAD) return root;
        if (area.w > parent.FREE || area.h > parent.FREE) {
            if (iteration !== 0) {
                var splitRoot = this.randomSplit(area, parent);
                root.left = this.splitArea(splitRoot[0], iteration - 1, parent);
                root.right = this.splitArea(splitRoot[1], iteration - 1, parent);
            }
        }
        return root;
    }
    randomSplit(area, parent) {
        if (area.w <= 2 * parent.PAD) {
            return horizontal(area, parent);
        } else if (area.h <= 2 * parent.PAD) {
            return vertical(area, parent);
        } else if (coinFlip()) {
            return horizontal(area, parent);
        } else return vertical(area, parent);

        function horizontal(area, parent) {
            let r1, r2;
            r1 = new Area(
                area.x,
                area.y,
                area.w,
                RND(parent.PAD, area.h - parent.PAD)
            );
            r2 = new Area(area.x, area.y + r1.h, area.w, area.h - r1.h);
            return [r1, r2];
        }
        function vertical(area, parent) {
            let r1, r2;
            r1 = new Area(
                area.x,
                area.y,
                RND(parent.PAD, area.w - parent.PAD),
                area.h
            );
            r2 = new Area(area.x + r1.w, area.y, area.w - r1.w, area.h);
            return [r1, r2];
        }
    }
    getRoom(rooms, type, size = 4) {
        let sieveSize = [];
        let sieveType = [];
        for (let q = 0; q < rooms.length; q++) {
            if (rooms[q].type === type) {
                sieveType.push(q);
                if (rooms[q].squareSize >= size) {
                    sieveSize.push(q);
                }
            }
        }
        if (sieveType.length === 0) return null;
        if (sieveSize.length > 0) {
            return rooms[sieveSize.chooseRandom()];
        } else {
            return rooms[sieveType.chooseRandom()];
        }
    }
    line(start, length, dir, what = MAPDICT.EMPTY) {
        for (let i = 0; i < length; i++) {
            this.GA.setValue(start, what);
            start = start.add(dir);
        }
    }
}
class Maze extends MasterDungeon {
    constructor(sizeX, sizeY, start) {
        let t0 = performance.now();
        super(sizeX, sizeY);
        this.type = "MAZE";
        this.carveMaze(start);
        console.log(`%cMaze construction ${performance.now() - t0} ms.`, DUNGEON.CSS);
    }
}
class Arena extends MasterDungeon {
    constructor(sizeX, sizeY) {
        let t0 = performance.now();
        super(sizeX, sizeY);
        this.type = "ARENA";
        this.GA.massClear();
        this.GA.border(2);

        //set entrance, randomly on top
        this.entrance = new Grid(RND(this.minX + 2, this.maxX - 2), this.minY);
        this.GA.toStair(this.entrance);

        //center room with downstairs
        let center = new Grid((this.width / 2) | 0, (this.height / 2) | 0);
        let topLeft = center.add(new Vector(-ARENA.CENTRAL_ROOM_WALL_WIDTH, -ARENA.CENTRAL_ROOM_WALL_WIDTH));
        let W = 2 * ARENA.CENTRAL_ROOM_WALL_WIDTH + ARENA.CENTRAL_ROOM_SIZE;
        this.GA.rect(topLeft.x, topLeft.y, W, W, 2);
        let roomArea = new Area(center.x, center.y, ARENA.CENTRAL_ROOM_SIZE, ARENA.CENTRAL_ROOM_SIZE);
        let ignoreArea = new Area(topLeft.x, topLeft.y, W, W);
        let RoomObj = new Room(this.rooms.length + 1, roomArea, DUNGEON.LOCK_LEVELS[0]);
        let centeringVector = new Vector((ARENA.CENTRAL_ROOM_SIZE / 2) | 0, 0);
        //exit
        this.exit = center.add(UP).add(centeringVector);
        this.GA.toStair(this.exit);

        //corridor + door
        for (let x = 0; x < ARENA.CENTRAL_ROOM_SIZE; x++) {
            for (let y = 0; y < ARENA.CENTRAL_ROOM_SIZE; y++) {
                this.GA.toRoom(center.add(new Vector(x, y)));
            }
        }
        this.GA.toRoom(center.add(DOWN, ARENA.CENTRAL_ROOM_SIZE).add(centeringVector));
        let door = center.add(DOWN, ARENA.CENTRAL_ROOM_SIZE + 1).add(centeringVector);
        this.GA.toDoor(door);
        RoomObj.door.push(door);
        this.rooms.push(RoomObj);
        this.lockedRooms[DUNGEON.LOCK_LEVELS[0]] = RoomObj;

        //areas
        this.mainArea = new Area(this.minX + 3, this.minY + 3, this.maxX - this.minX - 6, this.maxY - this.minY - 6);
        this.areaTree = this.splitArea(this.mainArea, ARENA.ITERATIONS, ARENA);
        this.areas = this.areaTree.getLeafs();
        for (let i = this.areas.length - 1; i >= 0; i--) {
            if (this.areas[i].overlap(ignoreArea)) {
                this.areas.splice(i, 1);
            }
        }
        this.createChunks();
        this.density = this.measureDensity();

        //locking the doors
        for (let lockedDoor in this.lockedRooms) {
            this.GA.closeDoor(this.lockedRooms[lockedDoor].door[0]);
        }

        //shrines
        this.shrines = [];
        let shrinePool = [];
        shrinePool.push(new Grid(RND(this.minX + 2, this.maxX - 2), this.maxY));
        shrinePool.push(new Grid(this.minX, RND(this.minY + 2, this.maxY - 2)));
        shrinePool.push(new Grid(this.maxX, RND(this.minY + 2, this.maxY - 2)));
        for (let shrine of shrinePool) {
            this.shrines.push(shrine);
            this.GA.carveDot(shrine);
            this.GA.addShrine(shrine);
        }

        delete this.areas;
        delete this.areaTree;

        console.log(`%cArena construction ${performance.now() - t0} ms.`, DUNGEON.CSS);
    }
    createChunks() {
        this.downSizeAreas();
        for (let area of this.areas) {
            this.makeChunk(area);
        }
    }
    makeChunk(area) {
        let maxSurface = area.h * area.w;
        let surface = 0;
        let cursor = new Grid(RND(area.x, area.x + area.w - 1), RND(area.y, area.y + area.h - 1));
        do {
            this.GA.toWall(cursor);
            surface++;
            let completeness = surface / maxSurface;
            if (completeness / 2 > Math.random()) break;
            let candidates = [];
            for (let dir of ENGINE.directions) {
                candidates.push(cursor.add(dir));
            }
            candidates = candidates.filter(area.gridWithin, area);
            candidates = candidates.filter(this.GA.isEmpty, this.GA);
            if (candidates.length === 0) break;
            cursor = candidates.chooseRandom();
        } while (true);
    }
    downSizeAreas() {
        for (let area of this.areas) {
            let Wsize = RND(ARENA.MIN_SIZE, ARENA.MAX_SIZE);
            let Hsize = RND(ARENA.MIN_SIZE, ARENA.MAX_SIZE);
            area.x++;
            area.y++;
            area.h--;
            area.w--;
            while (area.h > Hsize) {
                let toss = coinFlip();
                if (toss) {
                    area.y++;
                    area.h--;
                } else {
                    area.h--;
                }
            }
            while (area.w > Wsize) {
                let toss = coinFlip();
                if (toss) {
                    area.x++;
                    area.w--;
                } else {
                    area.w--;
                }
            }
        }
    }
}
class Dungeon extends MasterDungeon {
    constructor(sizeX, sizeY) {
        let t0 = performance.now();
        super(sizeX, sizeY);
        this.type = "DUNGEON";
        if (DUNGEON.SINGLE_CENTERED_ROOM) {
            this.rooms = this.singleCenteredRoom();
        } else {
            this.mainArea = new Area(
                this.minX,
                this.minY,
                this.maxX - this.minX + 1,
                this.maxY - this.minY + 1
            );
            this.areaTree = this.splitArea(this.mainArea, DUNGEON.ITERATIONS, DUNGEON);
            this.areas = this.areaTree.getLeafs();
            this.rooms = this.makeRooms();
        }
        this.rooms.sortByPropDesc("squareSize");
        if (this.rooms[0].squareSize < DUNGEON.BIG_ROOM) {
            DUNGEON.BIG_ROOM = this.rooms[0].squareSize;
        }
        let startingRoom = this.getRoom(this.rooms, "common", DUNGEON.BIG_ROOM);
        startingRoom.type = "start";

        //staircase up, down,
        if (DUNGEON.SET_ROOMS) {
            let stairsUp = this.randomUnusedEntry(startingRoom);
            this.GA.toStair(stairsUp);
            this.GA.addRoom(stairsUp);
            this.entrance = stairsUp;

            let exitRoom = this.getRoom(this.rooms, "common");
            exitRoom.type = DUNGEON.LOCK_LEVELS[0];
            let stairsDown = this.randomUnusedEntry(exitRoom);
            this.GA.toStair(stairsDown);
            this.GA.addRoom(stairsDown);
            this.exit = stairsDown;

            this.shrines = [];
            let temple = this.getRoom(this.rooms, "common", DUNGEON.BIG_ROOM);
            temple.type = 'temple';
            for (let i = 0; i < DUNGEON.N_SHRINES; i++) {
                let shrine = this.randomUnusedEntry(temple);
                this.shrines.push(shrine);
                this.GA.carveDot(shrine);
                this.GA.addRoom(shrine);
                this.GA.addShrine(shrine);
            }
        }

        //start carving
        let start = this.randomUnusedEntry(startingRoom);
        startingRoom.door.push(start);
        this.carveMaze(start);
        this.GA.toDoor(start);
        MAZE.configure(this);

        if (DUNGEON.SET_ROOMS) {
            if (this.rooms.length < DUNGEON.LOCK_LEVEL - 1) {
                console.error("too few rooms: ", this.rooms.length, "; for lock level", DUNGEON.LOCK_LEVEL);
                throw "SOLVE it Lovro!";
            }

            for (let r = 0; r < DUNGEON.LOCK_LEVEL; r++) {
                let room;
                if (r > 0) {
                    room = this.getRoom(this.rooms, "common");
                    room.type = DUNGEON.LOCK_LEVELS[r];
                } else {
                    room = this.findRoom(DUNGEON.LOCK_LEVELS[0]);
                }
                this.lockedRooms[DUNGEON.LOCK_LEVELS[r]] = room;
                this.connectToGrid(room, 1);
            }

            //keys
            let firstKeyRoom = this.getRoom(this.rooms, "common");
            if (firstKeyRoom === undefined || firstKeyRoom === null) {
                throw "firstKeyRoom is undefined. need more rooms!";
            }
            firstKeyRoom.type = "firstKey";
            this.connectToGrid(firstKeyRoom, RND(1, 2));

            for (let r = 0; r < DUNGEON.LOCK_LEVEL - 1; r++) {
                let keyLocation = this.findMiddleSpace(
                    this.lockedRooms[DUNGEON.LOCK_LEVELS[r + 1]].area
                );
                this.keys[DUNGEON.LOCK_LEVELS[r]] = keyLocation;
            }
            let keyLocation = this.findMiddleSpace(firstKeyRoom.area);
            this.keys[DUNGEON.LOCK_LEVELS[DUNGEON.LOCK_LEVEL - 1]] = keyLocation;

            //locking the doors
            for (let lockedDoor in this.lockedRooms) {
                this.GA.closeDoor(this.lockedRooms[lockedDoor].door[0]);
            }
        }

        this.connectRooms();
        this.recheckDeadEnds();

        delete this.areas;
        delete this.areaTree;

        console.log(`%cDungeon construction ${performance.now() - t0} ms.`, DUNGEON.CSS);
        return;
    }
}
class PacDungeon extends MasterDungeon {
    constructor(sizeX, sizeY) {
        let t0 = performance.now();
        super(sizeX, sizeY);
        if (sizeX % 2 === 0) {
            console.error("sizeX not odd ERROR", sizeX);
        }
        this.maxX = (sizeX - 1) / 2;
        this.GA.maxX = (sizeX - 1) / 2;
        this.symX = new Grid(this.maxX, 0);
        this.type = "PAC-DUNGEON";
        this.rooms = this.singleCenteredRoom();
        let start = this.centerTopEntry(this.rooms[0]);
        this.GA.reserve(start);
        this.bonus = start.add(UP);
        this.startPoint = start.add(new Vector(0, 5));
        this.GA.reserve(this.bonus);
        this.GA.reserve(this.startPoint);
        this.rooms[0].door.push(start);
        this.GA.carveDot(start);
        this.rectCircularCorridor(
            this.rooms[0].area.x - 2,
            this.rooms[0].area.y - 2,
            this.rooms[0].area.w + 4,
            this.rooms[0].area.h + 4
        );
        start = start.add(UP).add(UP);

        MAZE.useBias = true;
        this.carveMaze(start);
        this.connectSomeDeadEnds(0);

        //maximize density!
        MAZE.targetDensity = 0.82;
        this.addConnections();
        this.polishDeadEnds();
        this.symCopy();
        this.maxX = sizeX - 2;
        this.GA.maxX = sizeX - 2;
        this.density = this.measureDensity();
        let doors = this.setSideDoors();
        if (!doors) {
            console.error("Door not created FEATURE!");
        }
        this.deadEnds = this.scanForDeadEnds();
        if (this.deadEnds.length > 0) {
            this.removeLongDeadEnds();
        }
        console.log(`%cPac-Dungeon construction ${performance.now() - t0} ms.`, DUNGEON.CSS);
    }
    symCopy() {
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = 1; x <= this.maxX - this.minX; x++) {
                if (this.GA.isEmpty(new Grid(this.maxX - x, y))) {
                    this.GA.carveDot(new Grid(this.maxX + x, y));
                }
            }
        }
    }
    setSideDoors() {
        let y = Math.floor(this.height / 2);
        let left = new Grid(0, y);
        if (this.GA.isEmpty(left.add(RIGHT))) {
            this.GA.carveDot(left);
            this.GA.carveDot(new Grid(this.width - 1, y));
            return true;
        }
        let up = 0;
        let down = 0;
        do {
            up--;
            down++;
            if (this.GA.isEmpty(new Grid(0, y + up).add(RIGHT))) {
                this.GA.carveDot(new Grid(0, y + up));
                this.GA.carveDot(new Grid(this.width - 1, y + up));
                return true;
            }
            if (this.GA.isEmpty(new Grid(0, y + down).add(RIGHT))) {
                this.GA.carveDot(new Grid(0, y + down));
                this.GA.carveDot(new Grid(this.width - 1, y + down));
                return true;
            }
        } while (y + up > 0 && y + down < this.height - 1);
        console.error("Doors not created!");
        return false;
    }
}
class PacGrid {
    constructor(sizeX, sizeY, buffer) {
        this.width = sizeX;
        this.height = sizeY;
        this.map = new Uint8Array(buffer);
    }
    static gridToPacGrid(maze) {
        /**accepts maze, dungeon*/
        let sizeX = parseInt(maze.width, 10);
        let sizeY = parseInt(maze.height, 10);
        let mapBuffer = new ArrayBuffer(sizeX * sizeY);
        let map = new Uint8Array(mapBuffer);
        for (let x = 0; x < sizeX; x++) {
            for (let y = 0; y < sizeY; y++) {
                var index = y * sizeX + x;
                var grid = new Grid(x, y);
                if (maze.GA.isMazeWall(grid)) {
                    map[index] = map[index] | 1;
                    for (let q = 0; q < ENGINE.circle.length; q += 2) {
                        let check = grid.add(ENGINE.circle[q]);
                        if (maze.GA.isMazeWall(check)) {
                            let prevI = q - 1;
                            if (prevI < 0) prevI = ENGINE.circle.length - 1;
                            let nextI = q + 1;
                            let prev = grid.add(ENGINE.circle[prevI]);
                            let next = grid.add(ENGINE.circle[nextI]);
                            if (maze.GA.isMazeWall(prev) && maze.GA.isMazeWall(next)) {
                                continue;
                            } else {
                                map[index] = map[index] | (2 ** (q / 2 + 2));
                                let mirrorIndex = check.y * sizeX + check.x;
                                let w = q + 4;
                                if (w >= ENGINE.circle.length) w -= ENGINE.circle.length;
                                map[mirrorIndex] = map[mirrorIndex] | (2 ** (w / 2 + 2));
                            }
                        }
                    }
                }
            }
        }
        return new PacGrid(sizeX, sizeY, mapBuffer);
    }
}
class RatArena extends MasterDungeon {
    constructor(sizeX, sizeY) {
        let t0 = performance.now();
        super(sizeX, sizeY);
        this.type = "RAT-ARENA";

        let centerX = Math.floor(sizeX / 2);
        let F = Math.floor(RAT_ARENA.NCORR / 2);
        let leftX = centerX - F * (RAT_ARENA.CORR_PAD + 1);
        let bottomLeft = new Grid(leftX, this.maxY);
        this.corridor_starts = [];
        //startPosition
        this.startPosition = new Grid(centerX, this.maxY - Math.round((RAT_ARENA.CORR_LENGTH - 1) / 2));
        for (let c = 0; c < RAT_ARENA.NCORR; c++) {
            let startGrid = new Grid(bottomLeft.x + c * (RAT_ARENA.CORR_PAD + 1), bottomLeft.y);
            this.line(startGrid, RAT_ARENA.CORR_LENGTH, UP, MAPDICT.ROOM);
            this.corridor_starts.push(startGrid.add(UP));
        }
        this.corridor_starts = this.corridor_starts.midsort();

        this.line(bottomLeft, (RAT_ARENA.NCORR - 1) * (RAT_ARENA.CORR_PAD + 1) + 1, RIGHT);
        this.line(bottomLeft.add(UP, RAT_ARENA.CORR_LENGTH - 1), (RAT_ARENA.NCORR - 1) * (RAT_ARENA.CORR_PAD + 1) + 1, RIGHT);
        let tempMaxY = this.maxY;
        this.maxY -= (RAT_ARENA.CORR_LENGTH + 2);
        this.mainArea = new Area(
            this.minX,
            this.minY,
            this.maxX - this.minX + 1,
            this.maxY - this.minY + 1
        );
        this.areaTree = this.splitArea(this.mainArea, DUNGEON.ITERATIONS, DUNGEON);
        this.areas = this.areaTree.getLeafs();
        this.rooms = this.makeRooms();
        this.maxY = tempMaxY;
        let start = new Grid(centerX, this.maxY - RAT_ARENA.CORR_LENGTH);
        this.carveMaze(start);
        this.connectRooms(3, 0);
        this.eradicateDeadEnds();
        this.density = this.measureDensity();
        MAZE.targetDensity = 0.65;
        this.addConnections();
        this.density = this.measureDensity();

        delete this.areas;
        delete this.areaTree;
        console.log(`%cRat-Arena construction ${performance.now() - t0} ms.`, DUNGEON.CSS);
    }
}
class FreeMap extends MasterDungeon {
    constructor(sizeX, sizeY, GA = null) {
        super(sizeX, sizeY);
        this.type = "FREE-MAP";
        if (GA !== null) this.GA = GA;
    }
}
var MAZE = {
    opened: false,
    openDirs: null,
    storeDeadEnds: true,
    autoCalcDensity: true,
    connectDeadEnds: false,
    connectSome: true,
    leaveDeadEnds: 8,
    polishDeadEnds: true,
    addConnections: false,
    useBias: true,
    bias: 2,
    targetDensity: 0.6,
    configure(maze, sizeX = null, sizeY = null, start = null) {
        if (MAZE.connectSome) maze.connectSomeDeadEnds(MAZE.leaveDeadEnds);
        if (MAZE.connectDeadEnds) maze.eradicateDeadEnds();
        if (MAZE.polishDeadEnds) maze.polishDeadEnds(true);
        if (MAZE.addConnections) maze.addConnections();
        if (MAZE.autoCalcDensity) maze.density = maze.measureDensity();
        if (MAZE.opened) {
            if (!maze.open()) {
                console.warn("Maze not opened. Retry with recursion.");
                return MAZE.create(sizeX, sizeY, start);
            }
        }
        return maze;
    },
    create(sizeX, sizeY, start) {
        return MAZE.configure(new Maze(sizeX, sizeY, start), sizeX, sizeY, start);
    }
};
var PACDUNGEON = {
    create(sizeX, sizeY) {
        return new PacDungeon(sizeX, sizeY);
    }
};
var RAT_ARENA = {
    NCORR: 5,
    CORR_PAD: 1,
    CORR_LENGTH: 9,
    create(sizeX, sizeY) {
        DUNGEON.MIN_ROOM = 3;
        DUNGEON.MAX_ROOM = 4;
        DUNGEON.MIN_PADDING = 2;
        DUNGEON.ITERATIONS = 5;
        DUNGEON.init();
        var rat_arena = new RatArena(sizeX, sizeY);
        return rat_arena;
    }
};
var ARENA = {
    CENTRAL_ROOM_SIZE: 1,
    CENTRAL_ROOM_WALL_WIDTH: 2,
    MIN_ROOM: 1,
    MAX_ROOM: 3,
    MIN_PADDING: 2,
    PAD: null,
    FREE: null,
    ITERATIONS: 6,
    create(sizeX, sizeY) {
        this.PAD = this.MIN_ROOM + (1.5 * this.MIN_PADDING) | 0; //minimum area
        this.FREE = this.MAX_ROOM + 2 * this.MIN_PADDING; //not carving further
        this.MIN_SIZE = this.MIN_ROOM; //compatibility
        this.MAX_SIZE = this.MAX_ROOM; //compatibility
        var arena = new Arena(sizeX, sizeY);
        return arena;
    }
};
var FREE_MAP = {
    create(sizeX, sizeY, GA = null) {
        var map = new FreeMap(sizeX, sizeY, GA);
        return map;
    },
    import(data) {
        data.map = GridArray.importMap(data.map);
        data.map = GridArray.fromString(data.width, data.height, data.map);
        return FREE_MAP.create(data.width, data.height, data.map);
    }
};
var DUNGEON = {
    VERSION: "3.06",
    CSS: "color: #f4ee42",
    REFUSE_CONNECTION_TO_ROOM: true,
    LIMIT_ROOMS: false,
    ROOM_LIMIT: null,
    MIN_ROOM: 4,
    MAX_ROOM: 8,
    MIN_PADDING: 2,
    PAD: null,
    FREE: null,
    ITERATIONS: 4,
    SET_ROOMS: true,
    BIG_ROOM: 24,
    SINGLE_DOOR: false,
    SINGLE_CENTERED_ROOM: false,
    GRID_ARRAY_SIZE: 1,
    LOCK_LEVEL: 3,
    MAX_LOCK_LEVEL: 3,
    MIN_LOCK_LEVEL: 1,
    LOCK_LEVELS: ["Gold", "Silver", "Red"],
    N_SHRINES: 3,
    setLockLevel(level) {
        let lockLevel = Math.min(this.MAX_LOCK_LEVEL, level);
        lockLevel = Math.max(this.MIN_LOCK_LEVEL, level);
        console.log(`%cDUNGEON lock level set to ${level}.`, DUNGEON.CSS);
        DUNGEON.SET_ROOMS = true;
        this.LOCK_LEVEL = lockLevel;
    },
    init() {
        this.PAD = this.MIN_ROOM + 2 * this.MIN_PADDING; //minimum area
        this.FREE = this.MAX_ROOM + 4 * this.MIN_PADDING; //not carving further
        if (this.MIN_ROOM < 3) this.MIN_ROOM = 3;
    },
    create(sizeX, sizeY) {
        this.init();
        var dungeon = new Dungeon(sizeX, sizeY);
        return dungeon;
    }
};

console.log(`%cDUNGEON ${DUNGEON.VERSION} loaded.`, DUNGEON.CSS);