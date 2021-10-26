/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/////////////////////////////////////////////////
/*
      
TODO:

known bugs: 


 */
////////////////////////////////////////////////////

var DEBUG = {
    FPS: true,
    SETTING: true,
    BUTTONS: true,
    VERBOSE: true,
};
var INI = {};
var PRG = {
    VERSION: "0.00.01",
    NAME: "GhostRun II",
    YEAR: "2021",
    CSS: "color: #239AFF;",
    INIT() {
        console.log("%c****************************", PRG.CSS);
        console.log(
            `${PRG.NAME} ${PRG.VERSION} by Lovro Selic, (c) C00lSch00l ${PRG.YEAR} on ${navigator.userAgent}`
        );
        $("#title").html(PRG.NAME);
        $("#version").html(
            `${PRG.NAME} V${PRG.VERSION} <span style='font-size:14px'>&copy</span> C00lSch00l ${PRG.YEAR}`
        );
        $("input#toggleAbout").val("About " + PRG.NAME);
        $("#about fieldset legend").append(" " + PRG.NAME + " ");

        ENGINE.autostart = true;
        ENGINE.start = PRG.start;
        ENGINE.readyCall = GAME.setup;
        ENGINE.setSpriteSheetSize(48);
        ENGINE.init();
    },
    setup() {
        console.log("PRG.setup");
        if (DEBUG.SETTING) {
            $('#debug').show();
        } else $('#debug').hide();
        $("#gridsize").val(INI.GRIDSIZE);
        $("#gridsize").change(GAME.resizeGrid);
        $("#engine_version").html(ENGINE.VERSION);
        $("#grid_version").html(GRID.VERSION);
        $("#maze_version").html(DUNGEON.VERSION);
        //$("#raycast_version").html(RAYCAST.VERSION);
        $("#ai_version").html(AI.VERSION);
        $("#lib_version").html(LIB.VERSION);
        //$("#screen_width").html(INI.SCREEN_WIDTH);
        //$("#screen_height").html(INI.SCREEN_HEIGHT);

        /*
        $("#walltexture").change(function () {
            ENGINE.fill(LAYER.wallcanvas, TEXTURE[$("#walltexture")[0].value]);
            GAME.applyTextures();
        });
        $("#floortexture").change(function () {
            ENGINE.fill(LAYER.floorcanvas, TEXTURE[$("#floortexture")[0].value]);
            GAME.applyTextures();
        });
        $("#ceilingtexture").change(function () {
            ENGINE.fill(LAYER.ceilingcanvas, TEXTURE[$("#ceilingtexture")[0].value]);
            GAME.applyTextures();
        });
        */

        $("#toggleHelp").click(function () {
            $("#help").toggle(400);
        });
        $("#toggleAbout").click(function () {
            $("#about").toggle(400);
        });

        //boxes
        ENGINE.gameWIDTH = 768;
      ENGINE.sideWIDTH = 960 - ENGINE.gameWIDTH;
      ENGINE.gameHEIGHT = 768;
      ENGINE.titleHEIGHT = 80;
      ENGINE.titleWIDTH = 960;
      ENGINE.bottomHEIGHT = 40;
      ENGINE.bottomWIDTH = 960;
      ENGINE.checkProximity = false;
      ENGINE.checkIntersection = false;
      ENGINE.setCollisionsafe(49);
      $("#bottom").css(
        "margin-top",
        ENGINE.gameHEIGHT + ENGINE.titleHEIGHT + ENGINE.bottomHEIGHT
      );
      $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + ENGINE.sideWIDTH + 4);
      ENGINE.addBOX(
        "TITLE",
        ENGINE.titleWIDTH,
        ENGINE.titleHEIGHT,
        ["title"],
        null
      );
      ENGINE.addBOX(
        "ROOM",
        ENGINE.gameWIDTH,
        ENGINE.gameHEIGHT,
        ["background", "splash", "actors", "explosion", "text", "animation","button", "click"],
        "side"
      );
      ENGINE.addBOX(
        "SIDE",
        ENGINE.sideWIDTH,
        ENGINE.gameHEIGHT,
        ["sideback", "score", "energy", "lives", "stage", "radar"],
        "fside"
      );
      ENGINE.addBOX(
        "DOWN",
        ENGINE.bottomWIDTH,
        ENGINE.bottomHEIGHT,
        ["bottom", "bottomText"],
        null
      );

      ENGINE.addBOX(
        "LEVEL",
        ENGINE.gameWIDTH,
        ENGINE.gameHEIGHT,
        ["floor", "wall", "coord", "gold"],
        null
      );
      //$("#LEVEL").addClass("hidden");
    },
    start() {
        console.log(PRG.NAME + " started.");
        $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
        $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
        $(ENGINE.topCanvas).css("cursor", "");

        $("#startGame").addClass("hidden");
        $(document).keypress(function (event) {
            if (event.which === 32 || event.which === 13) {
                event.preventDefault();
            }
        });
        TITLE.startTitle();
    }
};
var GAME = {
    start() { },
    setup() {
        console.log("GAME SETUP started");

        for (var prop in TEXTURE) {
            $("#walltexture").append(
                "<option value='" + prop + "'>" + prop + "</option>"
            );
            $("#floortexture").append(
                "<option value='" + prop + "'>" + prop + "</option>"
            );
            $("#ceilingtexture").append(
                "<option value='" + prop + "'>" + prop + "</option>"
            );
        }
        $("#walltexture").val("CastleWall");
        $("#floortexture").val("RockFloor");
        $("#ceilingtexture").val("MorgueFloor");
        //ENGINE.fill(LAYER.wallcanvas, TEXTURE[$("#walltexture")[0].value]);
        //ENGINE.fill(LAYER.floorcanvas, TEXTURE[$("#floortexture")[0].value]);
        //ENGINE.fill(LAYER.ceilingcanvas, TEXTURE[$("#ceilingtexture")[0].value]);
    }
};
var TITLE = {
    startTitle(){
        console.log("Title started ...");
    }
};
// -- main --
$(function () {
    PRG.INIT();
    PRG.setup();
    ENGINE.LOAD.preload();
});