console.log("%cMAP for GhostRun2 loaded.", "color: #888");
var MONSTER = {
    Ghosty: {
        speed: 8,
        ai: 'follower',
        blind: false,
        name: "Ghosty",
        fps: 30
    },
    ZombieGirl: {
        speed: 8,
        ai: 'advancer',
        blind: false,
        name: "ZombieGirl",
        fps: 30
    },
    Death: {
        speed: 8,
        ai: 'advancer',
        blind: false,
        name: "Death2",
        fps: 30
    }
};
var MAP = {
    1: {
        width: 50,
        height: 50,
        floor: "RockFloor",
        wall: "BrickWall4",
        energy: 1500,
        enemy_delay: 3000,
        //monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl],
        monsters: [MONSTER.Death],
    },
};

var SPAWN = {
    gold(level) {
        let goldGrids = MAP[level].DUNGEON.poolOfGrids(INI.GOLD);
        for (let gold of goldGrids) {
            GRID_SOLO_FLOOR_OBJECT.add(new Gold(gold));
        }
        GRID_SOLO_FLOOR_OBJECT.manage(MAP[level].DUNGEON);
    },
    monsters(level) {
        for (let [index, monster] of MAP[level].monsters.entries()) {
            console.log(index, monster);
            ENEMY_TG.add(new Monster(MAP[level].DUNGEON.corridor_starts[index], monster));

        }
        console.log("spawning monsters", ENEMY_TG.POOL);
    }

};

