/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

var IAM = {
    version: "1.01.DEV",
    draw() {
        for (let obj of this.POOL) {
            if (obj) obj.draw();
        }
    },
    update(lapsedTime) {
        for (let obj of this.POOL) {
            if (obj) obj.update(lapsedTime);
        }
    },
    linkMap(map) {
        this.map = map;
    },
    add: function (obj) {
        this.POOL.push(obj);
        obj.id = this.POOL.length;
    },
    remove(id) {
        this.POOL[id - 1] = null;
    },
    poolToIA(IA) {
        for (const obj of this.POOL) {
            let grid = Grid.toClass(obj.moveState.pos);
            if (!IA.has(grid, obj.id)) {
                IA.next(grid, obj.id);
            }
        }
    },
    reIndex() {
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
    },
    init(map) {
        this.POOL = [];
        this.linkMap(map);
    },
    isGridFree(grid){
        return this.map[this.IA].empty(grid);
    },
    clearAll() {
        for (let E of this.POOL) {
            if (E) this.remove(E.id);
        }
    },
    show(id) {
        return this.POOL[id - 1];
    },
};

/** Texture grid IA Managers */
var ENEMY_TG = {
    POOL: null,
    map: null,
    IA: "enemy_tg_IA",
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    init: IAM.init,
    clearAll: IAM.clearAll,
    show: IAM.show,
    reIndex: IAM.reIndex,
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.moveState.homeGrid, obj.id);
        }
    },
    manage(lapsedTime){
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 1, 1); 
        this.reIndex();
        this.poolToIA(map[this.IA]);
    },

};
var VANISHING = {
    POOL: null,
    map: null,
    IA: "vanishing_IA",
    size: null,
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    init: IAM.init,
    isGridFree: IAM.isGridFree,
    reIndex: IAM.reIndex,
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.grid, obj.id);
        }
    },
    update: IAM.update,
    manage(lapsedTime) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 1, 1);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
        this.update(lapsedTime);
    },
};

var GRID_SOLO_FLOOR_OBJECT = {
    /*
    expects simple static objects withouot moveState 
    */    
    POOL: null,
    map: null,
    IA: "grid_solo_floor_object_IA",
    size: null,
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    init: IAM.init,
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.grid, obj.id);
        }
    },
    reIndexRequired: false,
    reIndex() {
        if (!this.reIndexRequired) return;
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
        this.reIndexRequired = false;
    },
    manage() {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 1, 1);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
    },
};

/**  Raycast IA Managers */
var FLOOR_OBJECT = {
    POOL: null,
    map: null,
    IA: "floor_objectIA",
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    poolToIA: IAM.poolToIA,
    init(map) {
        this.linkMap(map);
        this.manage(null, map);
    },
    reIndexRequired: false,
    reIndex() {
        if (!this.reIndexRequired) return;
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
        this.reIndexRequired = false;
    },

    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
    },
};
var DESTRUCTION_ANIMATION = {
    POOL: null,
    map: null,
    IA: "destranimIA",
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    poolToIA: IAM.poolToIA,
    reIndex: IAM.reIndex,
    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const anim of this.POOL) {
            anim.actor.updateAnimation(lapsedTime);
            if (anim.actor.animationThrough) {
                DESTRUCTION_ANIMATION.remove(anim.id);
            }
        }
    },
};
var CHANGING_ANIMATION = {
    POOL: null,
    map: null,
    IA: "changeanimIA",
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    poolToIA: IAM.poolToIA,
    reIndex: IAM.reIndex,
    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const anim of this.POOL) {
            anim.lift(lapsedTime);
            if (anim.complete()) {
                CHANGING_ANIMATION.remove(anim.id);
            }
        }
    }
};
var MISSILE = {
    POOL: null,
    map: null,
    IA: "missileIA",
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    poolToIA: IAM.poolToIA,
    reIndex: IAM.reIndex,
    manage(lapsedTime, map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const missile of this.POOL) {
            GRID.contTranslatePosition(missile, lapsedTime);
            let wallHit = !this.map.GA.entityNotInWall(
                missile.moveState.pos,
                missile.moveState.dir,
                missile.r,
                8
            );
            if (wallHit) {
                let position = missile.moveState.pos.translate(
                    missile.moveState.dir.reverse(),
                    RAYCAST.INI.EXPLOSION_OFFWALL
                );
                let explosion = new Destruction(
                    position,
                    missile.base,
                    DESTRUCTION_TYPE.SmallShortExplosion
                );
                DESTRUCTION_ANIMATION.add(explosion);
                MISSILE.remove(missile.id);
                AUDIO.Explosion.volume = RAYCAST.volume(missile.distance);
                AUDIO.Explosion.play();
                continue;
            }

            //check entity collision
            let IA = RAYCAST.MAP[ENEMY.IA];
            let grid = Grid.toClass(missile.moveState.pos);
            if (!IA.empty(grid)) {
                let possibleEnemies = IA.unroll(grid);
                for (let P of possibleEnemies) {
                    let monster = ENEMY.POOL[P - 1];
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
    },

};
var DECAL = {
    POOL: null,
    map: null,
    IA: "decalIA",
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    init(map) {
        this.linkMap(map);
        this.manage(map);
    },
    manage(map) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4); // = IA
        this.poolToIA(map[this.IA]);
    },
    update(map) {
        this.manage(map);
    },
    poolToIA(IA) {
        for (const decal of this.POOL) {
            if (decal === null) continue;
            IA.next(decal.floorGrid, decal.id);
            IA.next(decal.grid, decal.id);
        }
    },
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
    },
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
    },
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
};
var ENEMY = {
    POOL: null,
    map: null,
    IA: "enemyIA",
    draw: IAM.draw,
    linkMap: IAM.linkMap,
    add: IAM.add,
    remove: IAM.remove,
    clearAll: IAM.clearAll,
    show: IAM.show,
    poolToIA(IA) {
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            for (const dir of ENGINE.corners) {
                let x =
                    enemy.moveState.pos.x +
                    dir.x * (enemy.actor.orientationW / 2 / ENGINE.INI.GRIDPIX);
                let y =
                    enemy.moveState.pos.y +
                    dir.y * (enemy.actor.orientationH / 2 / ENGINE.INI.GRIDPIX);
                let pos = new Grid(x, y);
                if (!IA.has(pos, enemy.id)) {
                    IA.next(pos, enemy.id);
                }
            }
        }
    },
    manage(lapsedTime, map, flagArray) {
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.poolToIA(map[this.IA]);
        GRID.calcDistancesBFS_A(Grid.toClass(PLAYER.pos), map);
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            //check distance
            enemy.setDistanceFromNodeMap(map.nodeMap);
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
                        if (ENEMY.POOL[id - 1].base < 1) {
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
                        let EE_hit = GRID.circleCollision(enemy, ENEMY.POOL[e - 1]);
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
    },

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
};

console.log(`%cIndexArrayManagers (IAM) ${IAM.version} ready.`, "color: #7FFFD4");