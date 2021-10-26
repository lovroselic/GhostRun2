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
  VERSION: "1.00",
  CSS: "color: silver",
  referenceEntity: null,
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
  immobile() {
    return [NOWAY];
  },
  hunt(enemy) {
    let nodeMap = enemy.parent.map.nodeMap;
    let grid = Grid.toClass(enemy.moveState.pos);
    let goto = nodeMap[grid.x][grid.y].goto || NOWAY;
    return [goto];
  },
  crossroader(enemy, playerPosition, dir) {
    let goal = enemy.parent.map.GA.findNextCrossroad(playerPosition, dir);
    if (goal === null) {
      return this.hunt(enemy);
    }

    let Astar = enemy.parent.map.GA.findPath_AStar_fast(
      Grid.toClass(enemy.moveState.pos),
      goal,
      [MAPDICT.WALL],
      "exclude"
    );

    if (Astar === null) {
      return this.immobile();
    }
    if (Astar === 0) {
      return this.hunt(enemy);
    }

    let path = GRID.pathFromNodeMap(goal, Astar);
    let directions = GRID.directionsFromPath(path, 1);
    return directions;
  },
  follower(enemy, ARG) {
    return this.crossroader(
      enemy,
      ARG.playerPosition,
      ARG.currentPlayerDir.mirror()
    );
  },
  advancer(enemy, ARG) {
    return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir);
  },
  runAway(enemy) {
    let nodeMap = enemy.parent.map.nodeMap;
    let grid = Grid.toClass(enemy.moveState.pos);
    let directions = enemy.parent.map.GA.getDirectionsFromNodeMap(
      grid,
      nodeMap,
      nodeMap[grid.x][grid.y].goto
    );
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
      return this.immobile();
    }
    if (Astar === 0) {
      if (enemy.behaviour.complex("passive")) {
        enemy.behaviour.cycle("passive"); 
        enemy.behaviour.strategy = enemy.behaviour.getPassive();
        return this.immobile();
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
        return this.immobile();
      }
    } else {
      return this.keepTheDistance(enemy, ARG);
    }
  },
  keepTheDistance(enemy, ARG) {
    let map = enemy.parent.map;
    let grid = Grid.toClass(enemy.moveState.pos);
    let playerGrid = Grid.toClass(ARG.playerPosition);
    let directions = map.GA.getDirectionsFromNodeMap(grid, map.nodeMap);
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
    } else return this.immobile();
  },

  //to do
  prophet(enemy, ARG) { },
  shadower() { }
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