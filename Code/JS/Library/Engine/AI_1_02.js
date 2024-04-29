/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/////////////////////AI.js///////////////
/* 

AI, Behaviour routines for grid based games                  
                                           
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

var AI = {
  VERSION: "1.01",
  CSS: "color: silver",
  referenceEntity: null,
  immobileWander: true,
  initialize(ref) {
    this.referenceEntity = ref;
  },
  wanderer(enemy) {
    let directions = enemy.parent.map.GA.getDirectionsIfNot(
      Grid.toClass(enemy.moveState.pos),
      MAPDICT.WALL,
      enemy.moveState.dir.mirror()
    );
    if (directions.length) {
      return [directions.chooseRandom()];
    } else {
      return [enemy.moveState.dir.mirror()];
    }
  },
  immobile(enemy) {
    if (AI.immobileWander) return this.wanderer(enemy);
    return [NOWAY];
  },
  hunt(enemy) {
    let nodeMap = enemy.parent.map.GA.nodeMap;
    let grid = Grid.toClass(enemy.moveState.pos);
    let goto = nodeMap[grid.x][grid.y].goto || NOWAY;
    return [goto];
  },
  crossroader(enemy, playerPosition, dir, block) {
    let goal, _;
    [goal, _] = enemy.parent.map.GA.findNextCrossroad(playerPosition, dir);
    if (goal === null) {
      return this.hunt(enemy);
    }

    let Astar = enemy.parent.map.GA.findPath_AStar_fast(Grid.toClass(enemy.moveState.pos), goal, [MAPDICT.WALL], "exclude", block);

    if (Astar === null) {
      return this.immobile(enemy);
    }
    if (Astar === 0) {
      return this.hunt(enemy);
    }

    let path = GRID.pathFromNodeMap(goal, Astar);
    let directions = GRID.directionsFromPath(path, 1);
    return directions;
  },
  follower(enemy, ARG) {
    return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir.mirror(), ARG.block);
  },
  advancer(enemy, ARG) {
    return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir, ARG.block);
  },
  runAway(enemy) {
    let nodeMap = enemy.parent.map.GA.nodeMap;
    let grid = Grid.toClass(enemy.moveState.pos);
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
    let goal = enemy.guardPosition; // should be set in SPAWN!
    let Astar = enemy.parent.map.GA.findPath_AStar_fast(
      Grid.toClass(enemy.moveState.pos),
      goal,
      [MAPDICT.WALL],
      "exclude"
    );

    if (Astar === null) {
      return this.immobile(enemy);
    }
    if (Astar === 0) {
      if (enemy.behaviour.complex("passive")) {
        enemy.behaviour.cycle("passive");
        enemy.behaviour.strategy = enemy.behaviour.getPassive();
        return this.immobile(enemy);
      } else {
        //maybe obsolete
        return this.hunt(enemy);
      }
    }

    let path = GRID.pathFromNodeMap(goal, Astar);
    let directions = GRID.directionsFromPath(path);
    return directions;
  },
  circler(enemy) {
    let currentGrid = Grid.toClass(enemy.moveState.pos);
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
    if (enemy.caster) {
      if (enemy.mana >= Missile.calcMana(enemy.magic)) {
        let GA = enemy.parent.map.GA;
        let IA = enemy.parent.map.enemyIA;
        if (GRID.vision(Grid.toClass(enemy.moveState.pos), Grid.toClass(ARG.playerPosition), GA) &&
          GRID.freedom(Grid.toClass(enemy.moveState.pos), Grid.toClass(ARG.playerPosition), IA)) {
          enemy.canShoot = true;
        }
        return this.hunt(enemy);
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
    let map = enemy.parent.map;
    let grid = Grid.toClass(enemy.moveState.pos);
    let playerGrid = Grid.toClass(ARG.playerPosition);
    let directions = map.GA.getDirectionsFromNodeMap(grid, map.GA.nodeMap);
    let possible = [];
    let max = [];
    let curMax = 0;
    for (let i = 0; i < directions.length; i++) {
      let test = grid.add(directions[i]);
      let distance = test.distanceDiagonal(playerGrid);
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
    let directions = enemy.parent.map.GA.getDirectionsIfNot(
      Grid.toClass(enemy.moveState.pos),
      MAPDICT.WALL,
      enemy.moveState.dir.mirror()
    );
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
    [firstCR, lastDir] = enemy.parent.map.GA.findNextCrossroad(ARG.playerPosition, ARG.currentPlayerDir);
    let directions = enemy.parent.map.GA.getDirectionsIfNot(firstCR, MAPDICT.WALL, lastDir.mirror());
    let crossroads = [];
    let secondCR, _;
    for (let dir of directions) {
      [secondCR, _] = enemy.parent.map.GA.findNextCrossroad(firstCR.add(dir), dir);
      crossroads.push(secondCR);
    }
    let distances = [];
    let paths = [];
    for (let cross of crossroads) {
      let Astar = enemy.parent.map.GA.findPath_AStar_fast(Grid.toClass(enemy.moveState.pos), cross, [MAPDICT.WALL], "exclude", ARG.block);

      if (Astar === null) {
        return this.immobile(enemy);
      }
      if (Astar === 0) {
        return this.hunt(enemy);
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
    if (passiveFlag) {
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