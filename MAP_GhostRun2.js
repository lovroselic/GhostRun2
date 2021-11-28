console.log("%cMAP for GhostRun2 loaded.", "color: #888");
var MAP = {
    1: {
        width: 50,
        height: 50,
        floor: "RockFloor",
        wall: "BrickWall4"
    },
};

var SPAWN = {
    gold(level) {
        console.log("...spawning gold for level:", level);
        let goldGrids = MAP[level].DUNGEON.poolOfGrids(INI.GOLD);
        console.log("goldGrids", goldGrids);
        for (let gold of goldGrids){
            GRID_SOLO_FLOOR_OBJECT.add(new Gold(gold));
        }
        GRID_SOLO_FLOOR_OBJECT.manage(MAP[level].DUNGEON);
        console.log(GRID_SOLO_FLOOR_OBJECT);
    }
};