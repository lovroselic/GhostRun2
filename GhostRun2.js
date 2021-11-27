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
    _2D_display: false,
};
var INI = {
    GOLD: 50
};
var PRG = {
    VERSION: "0.01.02",
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
        $("#ai_version").html(AI.VERSION);
        $("#lib_version").html(LIB.VERSION);


        $("#walltexture").change(function () {
            ENGINE.fill(LAYER.wallcanvas, TEXTURE[$("#walltexture")[0].value]);
        });
        $("#floortexture").change(function () {
            ENGINE.fill(LAYER.floorcanvas, TEXTURE[$("#floortexture")[0].value]);
        });
        $("#ceilingtexture").change(function () {
            ENGINE.fill(LAYER.ceilingcanvas, TEXTURE[$("#ceilingtexture")[0].value]);
        });


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
        ENGINE.addBOX("TITLE", ENGINE.titleWIDTH, ENGINE.titleHEIGHT, ["title"], null);
        ENGINE.addBOX("ROOM", ENGINE.gameWIDTH, ENGINE.gameHEIGHT,
            ["background", "splash", "actors", "explosion", "text", "animation", "button", "click"],
            "side");
        ENGINE.addBOX("SIDE", ENGINE.sideWIDTH, ENGINE.gameHEIGHT,
            ["sideback", "score", "energy", "lives", "stage", "radar"],
            "fside");
        ENGINE.addBOX("DOWN", ENGINE.bottomWIDTH, ENGINE.bottomHEIGHT, ["bottom", "bottomText"], null);

        ENGINE.addBOX("LEVEL", ENGINE.gameWIDTH, ENGINE.gameHEIGHT, ["blockgrid", "floor", "wall","grid", "coord", "player"], null);
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
    start() {
        console.log("GAME started");
        if (AUDIO.Title) {
            AUDIO.Title.pause();
            AUDIO.Title.currentTime = 0;
        }
        $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
        $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
        $(ENGINE.topCanvas).css("cursor", "");
        ENGINE.hideMouse();

        $("#pause").prop("disabled", false);
        $("#pause").off();
        GAME.paused = false;

        let GameRD = new RenderData("DeepDown", 35, "#FFF", "text", "#BBB", 2, 2, 2);
        ENGINE.TEXT.setRD(GameRD);

        ENGINE.watchVisibility(GAME.lostFocus);
        ENGINE.GAME.start(16); //INIT game loop
        GAME.prepareForRestart();
        GAME.completed = false;
        GAME.level = 1;

        //debug
        ENGINE.GAME.ANIMATION.stop();
        TITLE.clearAllLayers();
        ENGINE.fillLayer("background", "#000");
        TITLE.sideBackground();
        //
        TITLE.bottom();

        GAME.levelStart();

    },
    levelStart() {
        console.log("level", GAME.level, "started");
        this.initLevel(GAME.level);
        this.drawFirstFrame(GAME.level);
    },
    initLevel(level) {
        console.log("level", level, "initialized");
        let randomDungeon = RAT_ARENA.create(MAP[level].width, MAP[level].height);
        MAP[level].DUNGEON = randomDungeon;
        console.log("creating random dungeon", MAP[level].DUNGEON);
        
    },
    drawFirstFrame(level){
        ENGINE.resizeBOX("LEVEL", MAP[level].width * ENGINE.INI.GRIDPIX, MAP[level].height * ENGINE.INI.GRIDPIX);
        ENGINE.TEXTUREGRID.configure("floor", "wall", MAP[level].floor, MAP[level].wall);
        ENGINE.TEXTUREGRID.draw(MAP[level].DUNGEON);
        if (DEBUG._2D_display) {
            GAME.blockGrid(level);
        }
    },
    blockGrid(level) {
        console.log("block grid painted");
        //ENGINE.resizeBOX("LEVEL", MAP[level].width * ENGINE.INI.GRIDPIX, MAP[level].height * ENGINE.INI.GRIDPIX);
        ENGINE.BLOCKGRID.configure("blockgrid", "#FFF", "#000");
        ENGINE.BLOCKGRID.draw(MAP[level].DUNGEON);
        GRID.grid();
        GRID.paintCoord("coord", MAP[level].DUNGEON);
    },
    prepareForRestart() {
        console.log("preparing game for start or safe restart ...");
        ENGINE.TIMERS.clear();
    },
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
        LAYER.wallcanvas = $("#wallcanvas")[0].getContext("2d");
        LAYER.floorcanvas = $("#floorcanvas")[0].getContext("2d");
        ENGINE.fill(LAYER.wallcanvas, TEXTURE[$("#walltexture")[0].value]);
        ENGINE.fill(LAYER.floorcanvas, TEXTURE[$("#floortexture")[0].value]);

        $("#buttons").prepend("<input type='button' id='startGame' value='Start Game'>");
        $("#startGame").prop("disabled", true);

        MAZE.bias = 2;
        MAZE.useBias = true;
    },
    setTitle: function () {
        const text = GAME.generateTitleText();
        const RD = new RenderData("Adore", 16, "#0E0", "bottomText");
        const SQ = new Square(0, 0, LAYER.bottomText.canvas.width, LAYER.bottomText.canvas.height);
        GAME.movingText = new MovingText(text, 4, RD, SQ);
    },
    generateTitleText: function () {
        let text = `${PRG.NAME} ${PRG.VERSION
            }, a game by Lovro Selic, ${"\u00A9"} C00lSch00l ${PRG.YEAR
            }. Title screen graphics by Trina Selic. Music: 'Determination' written and performed by LaughingSkull, ${"\u00A9"} 2007 Lovro Selic. `;
        text +=
            "     ENGINE, SPEECH, GRID, MAZE and GAME code by Lovro Selic using JavaScript. ";
        text = text.split("").join(String.fromCharCode(8202));
        return text;
    },
    runTitle: function () {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.movingText.process();
        GAME.titleFrameDraw();
    },
    titleFrameDraw: function () {
        GAME.movingText.draw();
    },
    lostFocus() {
        if (GAME.paused) return;
        GAME.clickPause();
    },
    clickPause() {
        //if (HERO.dead) return;
        $("#pause").trigger("click");
        ENGINE.GAME.keymap[ENGINE.KEY.map.F4] = false;
    },
    pause() {
        //if (HERO.dead) return;
        console.log("%cGAME paused.", PRG.CSS);
        $("#pause").prop("value", "Resume Game [F4]");
        $("#pause").off("click", GAME.pause);
        $("#pause").on("click", GAME.resume);
        ENGINE.GAME.ANIMATION.next(ENGINE.KEY.waitFor.bind(null, GAME.clickPause, "F4"));
        ENGINE.TEXT.centeredText("Game Paused", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 2);
        GAME.paused = true;
        ENGINE.TIMERS.stop();
    },
    resume() {
        console.log("%cGAME resumed.", PRG.CSS);
        $("#pause").prop("value", "Pause Game [F4]");
        $("#pause").off("click", GAME.resume);
        $("#pause").on("click", GAME.pause);
        ENGINE.clearLayer("text");
        ENGINE.TIMERS.start();
        ENGINE.GAME.ANIMATION.resetTimer();
        ENGINE.GAME.ANIMATION.next(GAME.run);
        GAME.paused = false;
    },
};
var TITLE = {
    startTitle() {
        console.log("Title started ...");
        $("#pause").prop("disabled", true);
        if (AUDIO.Title) AUDIO.Title.play();
        TITLE.clearAllLayers();
        TITLE.blackBackgrounds();
        TITLE.titlePlot();
        ENGINE.draw("background", 0, 0, TEXTURE.GhostRun2_cover);
        $("#DOWN")[0].scrollIntoView();

        ENGINE.topCanvas = ENGINE.getCanvasName("ROOM");
        TITLE.drawButtons();
        GAME.setTitle();
        ENGINE.GAME.start(16); //INIT game loop
        ENGINE.GAME.ANIMATION.next(GAME.runTitle);
    },
    clearAllLayers() {
        ENGINE.layersToClear = new Set(["text", "animation", "actors", "explosion", "sideback", "background", "button"]);
        ENGINE.clearLayerStack();
    },
    blackBackgrounds() {
        this.topBackground();
        this.bottomBackground();
        this.sideBackground();
        ENGINE.fillLayer("background", "#000");
    },
    topBackground: function () {
        var CTX = LAYER.title;
        CTX.fillStyle = "#000";
        CTX.roundRect(0, 0, ENGINE.titleWIDTH, ENGINE.titleHEIGHT,
            { upperLeft: 20, upperRight: 20, lowerLeft: 0, lowerRight: 0 },
            true, true);
    },
    bottomBackground: function () {
        var CTX = LAYER.bottom;
        CTX.fillStyle = "#000";
        CTX.roundRect(0, 0, ENGINE.bottomWIDTH, ENGINE.bottomHEIGHT,
            { upperLeft: 0, upperRight: 0, lowerLeft: 20, lowerRight: 20 },
            true, true);
    },
    sideBackground() {
        ENGINE.fillLayer("sideback", "#000");
    },
    bottom() {

        this.bottomVersion();
    },
    bottomVersion() {
        ENGINE.clearLayer("bottomText");
        let CTX = LAYER.bottomText;
        CTX.textAlign = "center";
        var x = ENGINE.bottomWIDTH / 2;
        var y = ENGINE.bottomHEIGHT / 2;
        CTX.font = "13px Consolas";
        CTX.fillStyle = "#888";
        CTX.shadowOffsetX = 0;
        CTX.shadowOffsetY = 0;
        CTX.shadowBlur = 0;
        CTX.shadowColor = "#cec967";
        CTX.fillText("Version " + PRG.VERSION + " by Lovro Selič", x, y);
    },
    titlePlot() {
        let CTX = LAYER.title;
        var fs = 42;
        CTX.font = fs + "px Arcade";
        CTX.textAlign = "center";
        let txt = CTX.measureText(PRG.NAME);
        let x = ENGINE.titleWIDTH / 2;
        let y = fs + 10;
        let gx = x - txt.width / 2;
        let gy = y - fs;
        let grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
        grad.addColorStop("0", "#DDD");
        grad.addColorStop("0.1", "#EEE");
        grad.addColorStop("0.2", "#DDD");
        grad.addColorStop("0.3", "#AAA");
        grad.addColorStop("0.4", "#999");
        grad.addColorStop("0.5", "#666");
        grad.addColorStop("0.6", "#555");
        grad.addColorStop("0.7", "#777");
        grad.addColorStop("0.8", "#AAA");
        grad.addColorStop("0.9", "#CCC");
        grad.addColorStop("1", "#EEE");
        CTX.fillStyle = grad;
        CTX.shadowColor = "#cec967";
        CTX.shadowOffsetX = 2;
        CTX.shadowOffsetY = 2;
        CTX.shadowBlur = 3;
        CTX.fillText(PRG.NAME, x, y);
    },
    drawButtons() {
        ENGINE.clearLayer("button");
        FORM.BUTTON.POOL.clear();
        let x = 36;
        let y = 720;
        let w = 166;
        let h = 24;
        let startBA = new Area(x, y, w, h);
        let buttonColors = new ColorInfo("#F00", "#A00", "#222", "#666", 13);
        let musicColors = new ColorInfo("#0E0", "#090", "#222", "#666", 13);
        FORM.BUTTON.POOL.push(new Button("Start game", startBA, buttonColors, GAME.start));
        x += 1.2 * w;
        let music = new Area(x, y, w, h);
        FORM.BUTTON.POOL.push(new Button("Play title music", music, musicColors, TITLE.music));
        FORM.BUTTON.draw();
        $(ENGINE.topCanvas).on("mousemove", { layer: ENGINE.topCanvas }, ENGINE.mouseOver);
        $(ENGINE.topCanvas).on("click", { layer: ENGINE.topCanvas }, ENGINE.mouseClick);
    },
    music() {
        AUDIO.Title.play();
    },
};
// -- main --
$(function () {
    PRG.INIT();
    PRG.setup();
    ENGINE.LOAD.preload();
});