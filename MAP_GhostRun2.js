console.log("%cMAP for GhostRun2 loaded.", "color: #888");

var MONSTER = {
    Ghosty: {
        speed: 8,
        ai: 'follower',
        blind: false,
        name: "Ghosty",
        fps: 30,
        tolerance: 0
    },
    Devil: {
        speed: 8,
        ai: 'follower',
        blind: false,
        name: "Devil",
        fps: 30,
        tolerance: 0
    },
    ZombieGirl: {
        speed: 8,
        ai: 'advancer',
        blind: false,
        name: "ZombieGirl",
        fps: 30,
        tolerance: 0
    },
    Death2: {
        speed: 8,
        ai: 'shadower',
        blind: false,
        name: "Death2",
        fps: 30,
        tolerance: 5
    },
    Skeleton: {
        speed: 8,
        ai: 'prophet',
        blind: false,
        name: "Skeleton",
        fps: 30,
        tolerance: 0
    },
    Wanderer: {
        speed: 8,
        ai: 'wanderer',
        blind: false,
        name: "Wanderer",
        fps: 30,
        tolerance: 0
    },
    Death: {
        speed: 8,
        ai: 'shadower',
        blind: false,
        name: "Death",
        fps: 30,
        tolerance: 4
    },
    Skeleton3: {
        speed: 8,
        ai: 'shadower',
        blind: false,
        name: "Skeleton3",
        fps: 30,
        tolerance: 3
    },
    Snake: {
        speed: 8,
        ai: 'prophet',
        blind: false,
        name: "Snake",
        fps: 30,
        tolerance: 0
    },
    Death3: {
        speed: 8,
        ai: 'shadower',
        blind: false,
        name: "Death2",
        fps: 30,
        tolerance: 3
    },
    Behemoth: {
        speed: 8,
        ai: 'prophet',
        blind: false,
        name: "Behemoth",
        fps: 30,
        tolerance: 0
    },
    Ghoul: {
        speed: 8,
        ai: 'advancer',
        blind: false,
        name: "Ghoul",
        fps: 30,
        tolerance: 0
    },
};
var MAP = {
    createNewLevel(level) {
        if (!MAP.hasOwnProperty(level)) {
            MAP[level] = $.extend(true, {}, MAP['10']);
        }
    },
    1: {
        width: 50,
        height: 50,
        floor: "RockFloor",
        wall: "BrickWall4",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [MONSTER.Ghosty, MONSTER.Skeleton, MONSTER.Death2],
    },
    2: {
        width: 50,
        height: 50,
        floor: "TlakFloor4b",
        wall: "StoneWall",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl, MONSTER.Death2, MONSTER.Wanderer],
    },
    3: {
        width: 50,
        height: 50,
        floor: "BrokenRuin",
        wall: "StoneFloor",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl, MONSTER.Death2, MONSTER.Wanderer, MONSTER.Skeleton],
    },
    4: {
        width: 50,
        height: 50,
        floor: "TileFloor",
        wall: "BlackBrickWall2",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl, MONSTER.Death2, MONSTER.Death, MONSTER.Skeleton],
    },
    5: {
        width: 50,
        height: 50,
        floor: "StoneFloor3",
        wall: "DungeonWall",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl, MONSTER.Death2, MONSTER.Skeleton3, MONSTER.Skeleton],
    },
    6: {
        width: 50,
        height: 50,
        floor: "StoneFloor3",
        wall: "DungeonWall",
        energy: 1500,
        enemy_delay: 2500,
        monsters: [MONSTER.Ghosty, MONSTER.Snake, MONSTER.Death2, MONSTER.Skeleton3, MONSTER.Skeleton],
    },
    7: {
        width: 50,
        height: 50,
        floor: "TlakFloor4b",
        wall: "DungeonWall2",
        energy: 1500,
        enemy_delay: 2500,
        monsters: [MONSTER.Ghosty, MONSTER.ZombieGirl, MONSTER.Death, MONSTER.Death3, MONSTER.Skeleton],
    },
    8: {
        width: 50,
        height: 50,
        floor: "StoneFloor5",
        wall: "DungeonFloor2",
        energy: 1500,
        enemy_delay: 2000,
        monsters: [MONSTER.Devil, MONSTER.ZombieGirl, MONSTER.Death, MONSTER.Death3, MONSTER.Behemoth],
    },
    9: {
        width: 50,
        height: 50,
        floor: "TlakFloor2b",
        wall: "RockWall",
        energy: 1200,
        enemy_delay: 2000,
        monsters: [MONSTER.Devil, MONSTER.ZombieGirl, MONSTER.Ghoul, MONSTER.Death3, MONSTER.Behemoth],
    },
    10: {
        width: 50,
        height: 50,
        floor: "RockFloor",
        wall: "BrickWall4",
        energy: 1200,
        enemy_delay: 1500,
        monsters: [MONSTER.Devil, MONSTER.ZombieGirl, MONSTER.Ghoul, MONSTER.Death3, MONSTER.Behemoth],
    }
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
        ENEMY_TG.clearAll();
        for (let [index, monster] of MAP[level].monsters.entries()) {
            ENEMY_TG.add(new Monster(MAP[level].DUNGEON.corridor_starts[index], monster));
        }
    }
};

