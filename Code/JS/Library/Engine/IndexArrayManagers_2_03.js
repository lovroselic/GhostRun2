/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
/*jshint esversion: 11 */
"use strict";

/*  

TODO:
      
*/

const IndexArrayManagers = {
    VERSION: "2.01",
};

class IAM {
    constructor() {
        this.POOL = null;
        this.map = null;
    }
    draw() {
        for (let obj of this.POOL) {
            if (obj) obj.draw(this.map);
        }
    }
    update(lapsedTime) {
        for (let obj of this.POOL) {
            if (obj) obj.update(lapsedTime);
        }
    }
    linkMap(map) {
        this.map = map;
    }
    add(obj) {
        this.POOL.push(obj);
        obj.id = this.POOL.length;
    }
    remove(id) {
        this.POOL[id - 1] = null;
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            let grid = null;
            if (obj.moveState) {
                grid = Grid.toClass(obj.moveState.pos);
            } else grid = obj.grid;
            //let grid = Grid.toClass(obj.moveState?.pos) || obj.grid;
            if (!IA.has(grid, obj.id)) {
                IA.next(grid, obj.id);
            }
        }
    }
    reIndex() {
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
    }
    init(map) {
        this.POOL = [];
        this.linkMap(map);
    }
    isGridFree(grid) {
        return this.map[this.IA].empty(grid);
    }
    clearAll() {
        this.POOL = [];
    }
    show(id) {
        return this.POOL[id - 1];
    }
}

/** Profile IA Managers */
class Decor extends IAM {
    constructor() {
        super();
        this.IA = "decor_IA";
    }
    poolToIA(IA) {
        return;
    }
    manage(lapsedTime) {
        return;
    }
}

class Profile_Ballistic extends IAM {
    constructor() {
        super();
        this.IA = "ballistic_IA";
    }
    poolToIA(IA) {
        return;
    }
    manage(lapsedTime) {
        this.reIndex();
        for (let obj of this.POOL) {
            if (obj) {
                obj.collisionBackground(this.map);
                if (obj === null) continue;
                obj.collisionEntity(this.map);
                if (obj === null) continue;
                obj.move(lapsedTime);
            }
        }
    }
}

class Profile_Actors extends IAM {
    constructor() {
        super();
        this.IA = "profile_actor_IA";
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            for (let x = Math.max(0, Math.round(obj.moveState.x - obj.actor.width / 2));
                x <= Math.min(this.map.DATA.map.length - 1, Math.round(obj.moveState.x + obj.actor.width / 2));
                x++) {
                IA.next(new Grid(x, 0), obj.id);
            }
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        this.reIndex();
        map[this.IA] = new IndexArray(map.planeLimits.width, 1, 4, 4);
        this.poolToIA(map[this.IA]);
        for (let obj of this.POOL) {
            if (obj && !obj.ignoreByManager) {
                obj.collisionBackground(this.map);
                if (obj === null) continue;
                obj.collisionToActors(this.map);
                if (obj === null) continue;
                obj.move(lapsedTime);
            }
        }
    }
}

/** Texture grid IA Managers */
class Enemy_TG extends IAM {
    constructor() {
        super();
        this.IA = "enemy_tg_IA";
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.moveState.startGrid, obj.id);
            IA.next(obj.moveState.endGrid, obj.id);
        }
    }
    manage(lapsedTime, reference = null) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        if (reference) {
            GRID.calcDistancesBFS_A(reference.moveState.pos, map);
        }
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            enemy.manage(lapsedTime, map[this.IA]);
        }
    }
}

class Vanishing extends IAM {
    constructor() {
        super();
        this.IA = "vanishing_IA";
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.grid, obj.id);
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 1, 1);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
        this.update(lapsedTime);
    }
}

class Floor_Object extends IAM {
    /*
    can work with objects that has moveState or just grid
    */
    constructor(byte = 1, banks = 1) {
        super();
        this.IA = `floor_object_IA_${byte}_${banks}`;
        this.reIndexRequired = false;
        this.byte = byte;
        this.banks = banks;
    }

    requestReIndex() {
        this.reIndexRequired = true;
    }
    reIndex() {
        if (!this.reIndexRequired) return;
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
        this.reIndexRequired = false;
    }
    init(map) {
        if (!this.POOL) this.POOL = [];
        this.linkMap(map);
        this.manage();
    }
    manage() {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, this.byte, this.banks);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
    }
}

class Destruction_Animation extends IAM {
    constructor() {
        super();
        this.IA = "destranimIA";
    }
    manage(lapsedTime, map = this.map) {
        this.reIndex();
        if (map.width && map.height) {
            map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
            this.poolToIA(map[this.IA]);
        }
        for (const anim of this.POOL) {
            anim.actor.updateAnimation(lapsedTime);
            if (anim.actor.animationThrough) {
                this.remove(anim.id);
            }
        }
    }
}

class Changing_Animation extends IAM {
    constructor() {
        super();
        this.IA = "changeanimIA";
    }
    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const anim of this.POOL) {
            anim.change(lapsedTime);
            if (anim.complete()) {
                CHANGING_ANIMATION.remove(anim.id);
            }
        }
    }
}
/**  Raycast IA Managers */
class Missile_RC extends IAM {
    constructor() {
        super();
        this.IA = "missileIA";
    }
    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const missile of this.POOL) {
            GRID.contTranslatePosition(missile, lapsedTime);
            let wallHit = !this.map.GA.entityNotInWall(missile.moveState.pos, missile.moveState.dir, missile.r, 8);
            if (wallHit) {
                let position = missile.moveState.pos.translate(missile.moveState.dir.reverse(), RAYCAST.INI.EXPLOSION_OFFWALL);
                let explosion = new Destruction(position, missile.base, DESTRUCTION_TYPE.SmallShortExplosion);
                DESTRUCTION_ANIMATION.add(explosion);
                MISSILE.remove(missile.id);
                AUDIO.Explosion.volume = RAYCAST.volume(missile.distance);
                AUDIO.Explosion.play();
                continue;
            }

            //check entity collision
            let IA = RAYCAST.MAP[ENEMY_RC.IA];
            let grid = Grid.toClass(missile.moveState.pos);
            if (!IA.empty(grid)) {
                let possibleEnemies = IA.unroll(grid);
                for (let P of possibleEnemies) {
                    let monster = ENEMY_RC.POOL[P - 1];
                    if (monster === null) continue;
                    if (monster.id === missile.casterId) continue;
                    let monsterHit = GRID.circleCollision(monster, missile);
                    if (monsterHit) {
                        monster.hitByMissile(missile);
                        continue;
                    }
                }
            }

            //check player collision
            if (missile.casterId !== 0) {
                let playerHit = PLAYER.circleCollision(missile);
                if (playerHit) {
                    PLAYER.hitByMissile(missile);
                }
            }
        }
    }
}

class Decal_IA extends IAM {
    constructor() {
        super();
        this.IA = "decalIA";
    }
    init(map) {
        this.linkMap(map);
        this.manage();
    }
    manage() {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4); // = IA
        this.poolToIA(map[this.IA]);
    }
    update(map) {
        this.manage(map);
    }
    poolToIA(IA) {
        for (const decal of this.POOL) {
            if (decal === null) continue;
            IA.next(decal.floorGrid, decal.id);
            IA.next(decal.grid, decal.id);
        }
    }
    calcPosition(position) {
        let offset = new FP_Grid();
        switch (position[0]) {
            case "center":
                offset.y = 0.5;
                break;
            case "top":
                offset.y = 0.3333;
                break;
            case "bottom":
                offset.y = 0.6667;
                break;
            default:
                offset.y = 0.5;
                break;
        }
        switch (position[1]) {
            case "center":
                offset.x = 0.5;
                break;
            case "left":
                offset.x = 0.3333;
                break;
            case "right":
                offset.x = 0.6667;
                break;
            default:
                offset.x = 0.5;
                break;
        }
        return offset;
    }
    playerBehindPlane(instance) {
        let playerGrid = Grid.toClass(PLAYER.pos);
        let delta = instance.grid.direction(playerGrid);
        for (let dim of ["x", "y"]) {
            if (instance.facingDir[dim] === 0) {
                continue;
            }
            if (instance.facingDir[dim] === delta[dim]) {
                return false;
            } else return true;
        }
    }
    drawPosition(instance) {
        let drawPosition = new FP_Grid();
        let leftPosition = new FP_Grid();
        let rightPosition = new FP_Grid();
        let widthFactor = instance.width / RAYCAST.INI.BLOCK_SIZE;
        let dims = ["x", "y"];
        for (const [i, comp] of dims.entries()) {
            if (instance.facingDir[comp] === 0) {
                drawPosition[comp] = instance.grid[comp] + 0.5;
                let otherIndex = (i + 1) % 2;
                let factor = instance.facingDir[dims[otherIndex]];
                if (dims[otherIndex] === "x") {
                    factor *= -1;
                }
                leftPosition[comp] = drawPosition[comp] - (factor * widthFactor) / 2;
                rightPosition[comp] = drawPosition[comp] + (factor * widthFactor) / 2;
            }
            if (instance.facingDir[comp] === 1) {
                drawPosition[comp] = instance.grid[comp] + 1.0;
                leftPosition[comp] = drawPosition[comp];
                rightPosition[comp] = drawPosition[comp];
            } else if (instance.facingDir[comp] === -1) {
                drawPosition[comp] = instance.grid[comp];
                leftPosition[comp] = drawPosition[comp];
                rightPosition[comp] = drawPosition[comp];
            }
        }
        return [drawPosition, leftPosition, rightPosition];
    }
}

class Enemy_RC extends IAM {
    constructor() {
        super();
        this.IA = "enemyIA";
    }
    poolToIA(IA) {
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            for (const dir of ENGINE.corners) {
                let x = enemy.moveState.pos.x + dir.x * (enemy.actor.orientationW / 2 / ENGINE.INI.GRIDPIX);
                let y = enemy.moveState.pos.y + dir.y * (enemy.actor.orientationH / 2 / ENGINE.INI.GRIDPIX);
                let pos = new Grid(x, y);
                if (!IA.has(pos, enemy.id)) {
                    IA.next(pos, enemy.id);
                }
            }
        }
    }
    manage(lapsedTime, map, flagArray) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.poolToIA(map[this.IA]);
        GRID.calcDistancesBFS_A(Grid.toClass(PLAYER.pos), map);
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            //check distance
            enemy.setDistanceFromNodeMap(map.GA.nodeMap);
            if (enemy.distance === null) continue;
            if (enemy.petrified) continue;
            //enemy/enemy collision resolution
            if (enemy.base === 1 && !enemy.moveState.dir.isNull()) {
                let ThisGrid = Grid.toClass(enemy.moveState.pos);
                let EndGrid = Grid.toClass(enemy.moveState.endPos);
                let Indices = map[this.IA].unroll(ThisGrid);

                if (!GRID.same(ThisGrid, EndGrid)) {
                    let add = map[this.IA].unroll(EndGrid);
                    Indices.splice(0, -1, ...add);
                }

                let setIndices = new Set(Indices);
                setIndices.delete(enemy.id);

                let FilteredIndices = [];
                if (setIndices.size > 0) {
                    for (let id of setIndices) {
                        if (this.POOL[id - 1].base < 1) {
                            setIndices.delete(id);
                        }
                    }
                    FilteredIndices = Array.from(setIndices).filter(
                        (val) => val < enemy.id
                    );
                }

                let wait = false;
                if (FilteredIndices.length > 0) {
                    for (let e of FilteredIndices) {
                        let EE_hit = GRID.circleCollision(enemy, this.POOL[e - 1]);
                        if (EE_hit) {
                            wait = true;
                            break;
                        }
                    }
                    if (wait) continue;
                }
            }
            //enemy/player collision
            let EP_hit = PLAYER.circleCollision(enemy);
            if (EP_hit) {
                if (enemy.canAttack) {
                    enemy.performAttack();
                }
                continue;
            }
            if (enemy.canShoot) enemy.shoot();
            if (enemy.moveState.moving) {
                GRID.translatePosition(enemy, lapsedTime);
                continue;
            }

            let passiveFlag = flagArray.includes(true);
            enemy.behaviour.manage(enemy, enemy.distance, passiveFlag);
            if (!enemy.hasStack()) {
                //next move(s) based on strategy
                let ARG = {
                    playerPosition: Grid.toClass(PLAYER.pos),
                    currentPlayerDir: PLAYER.dir.ortoAlign()
                };
                enemy.dirStack = AI[enemy.behaviour.strategy](enemy, ARG);
            }
            enemy.makeMove();
        }
    }
    analyze() {
        let monsterDict = new DefaultDict(0);
        for (const enemy of this.POOL) {
            monsterDict[enemy.class]++;
        }

        console.group("ENEMY analysis");
        for (const item in monsterDict) {
            console.log(item, monsterDict[item], Number(monsterDict[item] / this.POOL.length * 100).toFixed(2), "%");
        }
        console.groupEnd("ENEMY analysis");
    }
}

/**  IAM INSTANCES */
var DECOR = new Decor();
var PROFILE_BALLISTIC = new Profile_Ballistic();
var PROFILE_ACTORS = new Profile_Actors();
var ENEMY_TG = new Enemy_TG();
var ENEMY_RC = new Enemy_RC();
var VANISHING = new Vanishing();
var FLOOR_OBJECT = new Floor_Object();
var FLOOR_OBJECT_WIDE = new Floor_Object(4, 4);
var DESTRUCTION_ANIMATION = new Destruction_Animation();
var CHANGING_ANIMATION = new Changing_Animation();
var MISSILE = new Missile_RC();
var DECAL = new Decal_IA();
/** *********************************************** */

console.log(`%cIndexArrayManagers (IAM) ${IndexArrayManagers.version} ready.`, "color: #7FFFD4");