/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/////////////////////AI.js///////////////
/* 

AI, Behaviour routines for grid and 3d based games           
                                           
dependencies: 
  Prototype LS 
  ENGINE      
  GRID
        
*/
//////////////////////////////////////////
/*  

TODO:

knownBugs:
      
*/
/////////////////////////////////////////

const AI = {
  VERSION: "2.02",
  CSS: "color: silver",
  VERBOSE: false,
  INI: {
    CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE: 3,
  },
  referenceEntity: null,
  immobileWander: true,
  initialize(ref, setting = "2D") {
    this.referenceEntity = ref;
    if (setting !== "3D" && setting !== "2D") setting = "2D";
    this.setting = setting;
  },
  getPosition(enemy) {
    switch (this.setting) {
      case "2D": return Grid.toClass(enemy.moveState.pos);
      case "3D": return Vector3.toGrid(enemy.moveState.pos);
    }
  },
  getGridValue(enemy) {
    let gridValue = GROUND_MOVE_GRID_EXCLUSION;
    if (enemy.fly) {
      gridValue = AIR_MOVE_GRID_EXCLUSION;
    }
    return gridValue;
  },
  wanderer(enemy) {
    let gridValue = this.getGridValue(enemy);
    gridValue = gridValue.sum();
    const directions = enemy.parent.map.GA.getDirectionsIfNot(this.getPosition(enemy), gridValue, enemy.moveState.dir.mirror());
    if (directions.length) {
      return [directions.chooseRandom()];
    } else {
      return [enemy.moveState.dir.mirror()];
    }
  },
  immobile(enemy) {
    if (this.VERBOSE) console.warn(`${enemy.name}-${enemy.id} IMMOBILE`);
    if (AI.immobileWander) return this.wanderer(enemy);
    return [NOWAY];
  },
  hunt(enemy, exactPosition) {
    if (exactPosition.hasOwnProperty("exactPlayerPosition")) exactPosition = exactPosition.exactPlayerPosition;
    let nodeMap = enemy.parent.map.GA.nodeMap;
    let grid = this.getPosition(enemy);
    let goto = nodeMap[grid.x][grid.y]?.goto || NOWAY;
    if (this.VERBOSE) console.info(`...${enemy.name}-${enemy.id} hunting -> goto:`, goto, "strategy", enemy.behaviour.strategy);
    if (GRID.same(goto, NOWAY) && this.setting === "3D") return this.hunt_FP(enemy, exactPosition);
    return [goto];
  },
  hunt_FP(enemy, exactPosition) {
    if (this.VERBOSE) console.log("..hunt_FP: exactPosition", exactPosition, "distance:", enemy.distance);
    if (!enemy.distance) {
      if (this.VERBOSE) console.warn("..terminating hunt - null distance");
      return this.immobile(enemy);
    }
    const pPos = Vector3.to_FP_Grid(exactPosition);
    const ePos = Vector3.to_FP_Grid(enemy.moveState.pos);
    const direction = ePos.direction(pPos);
    if (this.VERBOSE) console.log("pPos", pPos, "ePos", ePos, "direction", direction);
    const orto = direction.ortoAlign();
    if (this.VERBOSE) console.info(`${enemy.name}-${enemy.id} FP hunt`, orto, "strategy", enemy.behaviour.strategy);
    return [orto];
  },
  crossroader(enemy, playerPosition, dir, block, exactPosition) {
    if (this.VERBOSE) console.log("------------------------------");
    if (this.VERBOSE) console.info(`Crossroader analysis for ${enemy.name}-${enemy.id}`);
    let goal, _;
    [goal, _] = enemy.parent.map.GA.findNextCrossroad(playerPosition, dir, enemy.fly);
    if (this.VERBOSE) console.log(`.. ${enemy.name}-${enemy.id} goal`, goal, "strategy", enemy.behaviour.strategy);

    if (goal === null) {
      return this.hunt(enemy, exactPosition);
    }

    /** what if goal takes you further away - advancer! */
    const new_distance = enemy.parent.map.GA.nodeMap[goal.x][goal.y].distance;
    if (this.VERBOSE) console.log(`.. ${enemy.name}-${enemy.id} new_distance  from goal`, new_distance, "current distance", enemy.distance);
    if (enemy.distance < this.INI.CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE && new_distance > enemy.distance) {
      if (this.VERBOSE) console.warn("... overriding behavior -> hunt");
      return this.hunt(enemy, exactPosition);
    }

    const gridValue = this.getGridValue(enemy);
    const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), goal, gridValue, "exclude", block);
    if (this.VERBOSE) console.log(`.. ${enemy.name}-${enemy.id} Astar`, Astar);
    if (Astar === null) {
      return this.immobile(enemy);
    }
    if (Astar === 0) {
      return this.hunt(enemy, exactPosition);
    }

    let path = GRID.pathFromNodeMap(goal, Astar);
    let directions = GRID.directionsFromPath(path, 1);
    return directions;
  },
  follower(enemy, ARG) {
    return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir.mirror(), ARG.block, ARG.exactPlayerPosition);
  },
  advancer(enemy, ARG) {
    return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir, ARG.block, ARG.exactPlayerPosition);
  },
  runAway(enemy) {
    let nodeMap = enemy.parent.map.GA.nodeMap;
    let grid = this.getPosition(enemy);
    let directions = enemy.parent.map.GA.getDirectionsFromNodeMap(grid, nodeMap, nodeMap[grid.x][grid.y].goto);
    directions.push(NOWAY);
    let distances = [];
    for (const dir of directions) {
      let nextGrid = grid.add(dir);
      distances.push(nodeMap[nextGrid.x][nextGrid.y].distance);
    }
    let maxDistance = Math.max(...distances);
    return [directions[distances.indexOf(maxDistance)]];
  },
  goto(enemy) {
    const gridValue = this.getGridValue(enemy);
    const goal = enemy.guardPosition; // should be set in SPAWN!
    const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), goal, gridValue, "exclude");

    if (Astar === null) {
      return this.immobile(enemy);
    }
    if (Astar === 0) {
      if (enemy.behaviour.complex("passive")) {
        enemy.behaviour.cycle("passive");
        enemy.behaviour.strategy = enemy.behaviour.getPassive();
        return this.immobile(enemy);
      } else {
        //should be obsolete
        console.error("This should have never happened to", enemy);
        return this.hunt(enemy);
      }
    }

    let path = GRID.pathFromNodeMap(goal, Astar);
    let directions = GRID.directionsFromPath(path);
    return directions;
  },
  circler(enemy) {
    let currentGrid = this.getPosition(enemy);
    let gridPath = [currentGrid];
    let firstDir = ENGINE.directions.chooseRandom();
    const rs = randomSign();
    let index = firstDir.isInAt(ENGINE.circle);
    for (let off = 0; off < ENGINE.circle.length + 1; off++) {
      let curIndex =
        (ENGINE.circle.length + index + rs * off) % ENGINE.circle.length;
      gridPath.push(currentGrid.add(ENGINE.circle[curIndex]));
    }
    gridPath.push(currentGrid);
    let directions = GRID.directionsFromPath(gridPath);
    return directions;
  },
  shoot(enemy, ARG) {
    if (this.VERBOSE) console.warn(`..${enemy.name}-${enemy.id} tries to shoot.`);
    if (enemy.caster) {
      if (enemy.mana >= Missile.calcMana(enemy.magic)) {
        const GA = enemy.parent.map.GA;
        const IA = enemy.parent.map.enemyIA;
        if (GRID.vision(this.getPosition(enemy), Grid.toClass(ARG.playerPosition), GA) &&
          GRID.freedom(this.getPosition(enemy), Grid.toClass(ARG.playerPosition), IA)) {
          enemy.canShoot = true;
        }
        if (this.VERBOSE) console.info(`..${enemy.name}-${enemy.id} can shoot: ${enemy.canShoot}`);

        if (enemy.distance) {
          return this.hunt(enemy, ARG.exactPlayerPosition);
        } else return this.immobile(enemy);

      } else {
        this.caster = false;
        if (enemy.weak()) {
          enemy.behaviour.set("active", "runAway");
        } else {
          enemy.behaviour.set("active", "hunt");
        }
        return this.immobile(enemy);
      }
    } else {
      return this.keepTheDistance(enemy, ARG);
    }
  },
  keepTheDistance(enemy, ARG) {
    const map = enemy.parent.map;
    const grid = this.getPosition(enemy);
    const playerGrid = Grid.toClass(ARG.playerPosition);
    const directions = map.GA.getDirectionsFromNodeMap(grid, map.GA.nodeMap);
    let possible = [];
    let max = [];
    let curMax = 0;
    for (let i = 0; i < directions.length; i++) {
      const test = grid.add(directions[i]);
      const distance = test.distanceDiagonal(playerGrid);
      if (distance === enemy.stalkDistance) possible.push(directions[i]);
      if (distance > curMax) {
        max.clear();
        curMax = distance;
        max.push(directions[i]);
      } else if (distance === curMax) max.push(directions[i]);
    }
    if (possible.length > 0) {
      return [possible.chooseRandom()];
    } else if (max.length > 0) {
      return [max.chooseRandom()];
    } else return this.immobile(enemy);
  },
  shadower(enemy, ARG) {
    let gridValue = this.getGridValue(enemy);

    //let directions = enemy.parent.map.GA.getDirectionsIfNot(this.getPosition(enemy), MAPDICT.WALL, enemy.moveState.dir.mirror());
    const directions = enemy.parent.map.GA.getDirectionsIfNot(this.getPosition(enemy), gridValue, enemy.moveState.dir.mirror());
    if (directions.length === 1) return [directions[0]];
    if (enemy.moveState.goingAway(ARG.MS) || enemy.moveState.towards(ARG.MS, enemy.tolerance)) {
      //if going away or not coming towards, take HERo's dir if possible
      if (ARG.MS.dir.isInAt(directions) !== -1) {
        return [ARG.MS.dir];
      }
    } else {
      //else take opposite dir
      let contra = ARG.MS.dir.mirror();
      if (contra.isInAt(directions) !== -1) {
        return [contra];
      }
    }
    //remaining: take direction in which the distance is largest
    let solutions = enemy.moveState.endGrid.directionSolutions(ARG.MS.homeGrid);
    let selected = solve();
    if (selected) return [selected];
    return [directions.chooseRandom()];

    function solve() {
      for (let q = 0; q < 2; q++) {
        if (solutions[q].dir.isInAt(directions) !== -1)
          return solutions[q].dir;
      }
      return null;
    }
  },
  prophet(enemy, ARG) {
    let firstCR, lastDir;
    [firstCR, lastDir] = enemy.parent.map.GA.findNextCrossroad(ARG.playerPosition, ARG.currentPlayerDir, enemy.fly);
    let directions = enemy.parent.map.GA.getDirectionsIfNot(firstCR, MAPDICT.WALL, lastDir.mirror());
    let crossroads = [];
    let secondCR, _;
    for (let dir of directions) {
      [secondCR, _] = enemy.parent.map.GA.findNextCrossroad(firstCR.add(dir), dir, enemy.fly);
      crossroads.push(secondCR);
    }
    let distances = [];
    let paths = [];
    let gridValue = this.getGridValue(enemy);
    for (let cross of crossroads) {
      const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), cross, gridValue, "exclude", ARG.block);

      if (Astar === null) {
        return this.immobile(enemy);
      }
      if (Astar === 0) {
        return this.hunt(enemy, ARG.exactPlayerPosition);
      }

      distances.push(Astar[cross.x][cross.y].path);
      paths.push(Astar);
    }

    let minIndex = distances.indexOf(Math.min(...distances));
    let path = GRID.pathFromNodeMap(crossroads[minIndex], paths[minIndex]);
    let finalDirections = GRID.directionsFromPath(path, 1);
    return finalDirections;
  },

};
class Behaviour {
  constructor(
    passsiveDistance = 7,
    passiveQueue = ["wanderer"],
    activeDistance = 4,
    activeQueue = ["hunt"]
  ) {
    this.passive = {};
    this.active = {};
    this.passive.distance = passsiveDistance;
    this.passive.queue = passiveQueue;
    this.active.distance = activeDistance;
    this.active.queue = activeQueue;
    this.strategy = this.getPassive();
    this.passiveInitial = this.passive.queue[0];
    console.assert(this.active.distance < this.passive.distance, this);
  }
  set(type, behaviour) {
    this[type].queue = [behaviour];
    this.strategy = behaviour;
  }
  complex(type) {
    return this[type].queue.length > 1;
  }
  cycle(type) {
    this[type].queue.push(this[type].queue.shift());
  }
  getPassive() {
    return this.passive.queue[0];
  }
  getActive() {
    return this.active.queue[0];
  }
  restorePassive() {
    while (this.getPassive() !== this.passiveInitial) {
      this.cycle("passive");
    }
  }
  manage(enemy, distance, passiveFlag) {
    if (passiveFlag || !distance) {
      this.strategy = this.getPassive();
      return;
    }
    if (distance <= this.active.distance && this.strategy === this.getPassive()) {
      this.strategy = this.getActive();
      enemy.dirStack.clear();
    }
    if (distance >= this.passive.distance && this.strategy === this.getActive()) {
      if (this.complex("passive")) {
        this.restorePassive();
      }
      this.strategy = this.getPassive();
      enemy.dirStack.clear();
    }
    return;
  }
}

//END
console.log(`%cAI ${AI.VERSION} loaded.`, AI.CSS);