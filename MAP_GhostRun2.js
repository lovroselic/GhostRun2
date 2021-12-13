console.log("%cMAP for GhostRun2 loaded.", "color: #888");
var MAP = {
    1: {
        width: 50,
        height: 50,
        floor: "RockFloor",
        wall: "BrickWall4",
        energy: 1500,
        enemy_delay: 3000,
        monsters: [],
    },
};

var SPAWN = {
    gold(level) {
        let goldGrids = MAP[level].DUNGEON.poolOfGrids(INI.GOLD);
        for (let gold of goldGrids) {
            GRID_SOLO_FLOOR_OBJECT.add(new Gold(gold));
        }
        GRID_SOLO_FLOOR_OBJECT.manage(MAP[level].DUNGEON);
    }
};

var MONSTER = {
    Ghosty:{
        speed: 8,
        ai: 'follower',
    }
};