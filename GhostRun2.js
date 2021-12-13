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
    finishLevel() {
        GRID_SOLO_FLOOR_OBJECT.POOL.length = 1;
        GRID_SOLO_FLOOR_OBJECT.manage();
        GAME.PAINT.gold();
    }
};
var INI = {
    GOLD: 100,
    HERO_SPEED: 8,
    MINI_PIX: 3,
    SCORE_GOLD: 10,
    SPLASH_COST: 10,
    SPLASH_TIME: 3000,
};
var PRG = {
    VERSION: "0.04.01",
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

        ENGINE.addBOX("LEVEL", ENGINE.gameWIDTH, ENGINE.gameHEIGHT, ["floor", "wall", "gold", "grid", "coord", "player"], null);
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
var HERO = {
    startInit() {
        HERO.spriteClass = "Wizard";
        HERO.asset = ASSET[HERO.spriteClass];
        HERO.actor = new ACTOR(
            HERO.spriteClass,
            HERO.x,
            HERO.y,
            "front",
            HERO.asset,
            30
        );
        HERO.dead = false;
    },
    init() {
        HERO.speed = INI.HERO_SPEED;
        HERO.slowed = false;
        HERO.dead = false;
        GRID.gridToSprite(MAP[GAME.level].DUNGEON.startPosition, HERO.actor);
        HERO.MoveState = new MoveState(MAP[GAME.level].DUNGEON.startPosition, null, MAP[GAME.level].DUNGEON.GA);
        HERO.MoveState.next(UP);
        ENGINE.VIEWPORT.check(HERO.actor);
        ENGINE.VIEWPORT.alignTo(HERO.actor);
        HERO.actor.orientation = "front";
        HERO.actor.refresh();
        console.log("HERO", HERO);
    },
    draw() {
        if (HERO.dead) return;
        ENGINE.spriteDraw(
            "actors",
            HERO.actor.vx,
            HERO.actor.vy,
            HERO.actor.sprite()
        );
        ENGINE.layersToClear.add("actors");
    },
    move(lapsedTime) {
        if (HERO.dead) return;
        if (HERO.MoveState.moving) {
            GRID.translateMove(HERO, lapsedTime, HERO.MoveState.gridArray, true, HeroOnFinish);
        } else {
            HERO.MoveState.next(HERO.findNewDir());
        }

        function HeroOnFinish() {
            if (DEBUG.INF_ENERGY) return;
            if (!HERO.slowed) HERO.energy--;
            if (HERO.energy <= 0 && !HERO.slowed) {
                HERO.energy = 0;
                HERO.speed /= 2;
                HERO.slowed = true;
            }
            TITLE.energy();
        }
    },
    tryToChangeDir(dir) {
        if (GRID.same(HERO.MoveState.dir.mirror(), dir)) {
            if (GRID.same(HERO.MoveState.startGrid, GRID.trueToGrid(HERO.actor))) return;
            HERO.MoveState.reverse();
            return;
        }
        if (!HERO.MoveState.moving) {
            let dirs = HERO.MoveState.gridArray.getDirectionsIfNot(HERO.MoveState.endGrid, MAPDICT.WALL);
            if (GRID.isGridIn(dir, dirs) !== -1) {
                HERO.MoveState.next(dir);
                return;
            }
        }
    },
    findNewDir() {
        let dirs = HERO.MoveState.gridArray.getDirectionsIfNot(HERO.MoveState.endGrid, MAPDICT.WALL, HERO.MoveState.dir.mirror());
        if (GRID.isGridIn(HERO.MoveState.dir, dirs) !== -1) return HERO.MoveState.dir;
        return dirs.chooseRandom();
    },
    touchGold() {
        let IA = MAP[GAME.level].DUNGEON.grid_solo_floor_object_IA;
        let goldIndex = IA.unroll(HERO.MoveState.homeGrid)[0];
        if (goldIndex) {
            GRID_SOLO_FLOOR_OBJECT.remove(goldIndex);
            GRID_SOLO_FLOOR_OBJECT.reIndexRequired = true;
            GAME.score += INI.SCORE_GOLD;
            TITLE.score();
            GAME.PAINT.gold();
            ENGINE.VIEWPORT.changed = true;
            AUDIO.Pick.play();
        }
        //check if over
        if (GRID_SOLO_FLOOR_OBJECT.size === 0) {
            GAME.levelEnd();
        }

    },
    splash() {
        if (HERO.dead) return;
        let grid = Grid.toClass(HERO.MoveState.homeGrid);
        if (!VANISHING.isGridFree(grid)) return;
        if (HERO.energy > INI.SPLASH_COST) {
            HERO.energy -= INI.SPLASH_COST;
            TITLE.energy();
            let splash = new Splash(grid, new ACTOR('Splash'));
            VANISHING.add(splash);
        }
    }
};
class Gold {
    constructor(grid) {
        this.grid = grid;
        this.sprite = SPRITE.Gold;
        this.type = "Gold";
        this.layer = 'gold';
    }
    draw() {
        ENGINE.spriteToGrid(this.layer, this.grid, this.sprite);
    }
}
class Splash {
    constructor(grid, actor) {
        this.grid = grid;
        this.actor = actor;
        GRID.gridToSprite(this.grid, this.actor);
        this.alignToViewport();
        this.maxTime = INI.SPLASH_TIME;
        this.currentTime = this.maxTime;
        this.alpha = 1.0;
    }
    draw() {
        let CTX = LAYER.splash;
        CTX.save();
        CTX.globalAlpha = this.alpha;
        ENGINE.spriteDraw(
            "splash",
            this.actor.vx,
            this.actor.vy,
            SPRITE.Splash
        );
        CTX.restore();
    }
    update(time) {
        this.alignToViewport();
        this.currentTime -= time;
        if (this.currentTime <= 0) {
            VANISHING.remove(this.id);
        }
        this.alpha = Math.max(0.2, (this.currentTime / this.maxTime));
    }
    alignToViewport() {
        ENGINE.VIEWPORT.alignTo(this.actor);
    }
}
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
        GAME.extraLife = SCORE.extraLife.clone();

        $("#pause").prop("disabled", false);
        $("#pause").off();
        GAME.paused = false;

        let GameRD = new RenderData("Arcade", 60, "#DDD", "text", "#FFF", 2, 2, 2);
        ENGINE.TEXT.setRD(GameRD);

        ENGINE.watchVisibility(GAME.lostFocus);
        ENGINE.GAME.start(16); //INIT game loop
        GAME.prepareForRestart();
        GAME.completed = false;
        GAME.won = false;
        GAME.level = 1;
        GAME.score = 0;
        GAME.lives = 4;

        HERO.startInit();
        ENGINE.GAME.ANIMATION.waitThen(GAME.levelStart, 2);
    },
    levelStart() {
        console.log("level", GAME.level, "started");
        HERO.energy = MAP[GAME.level].energy;
        GAME.initLevel(GAME.level);
        GAME.levelExecute();

    },
    initLevel(level) {
        console.log("level", level, "initialized");
        let randomDungeon = RAT_ARENA.create(MAP[level].width, MAP[level].height);
        MAP[level].DUNGEON = randomDungeon;
        console.log("creating random dungeon", MAP[level].DUNGEON);
        GRID_SOLO_FLOOR_OBJECT.init(MAP[level].DUNGEON);
        VANISHING.init(MAP[level].DUNGEON);
        SPAWN.gold(level);
        MAP[level].pw = MAP[level].width * ENGINE.INI.GRIDPIX;
        MAP[level].ph = MAP[level].height * ENGINE.INI.GRIDPIX;
        ENGINE.VIEWPORT.setMax({ x: MAP[level].pw, y: MAP[level].ph });

    },
    levelExecute() {
        console.log("level", GAME.level, "executes");
        GAME.CI.reset();
        ENGINE.VIEWPORT.reset();
        HERO.init();

        GAME.drawFirstFrame(GAME.level);
        ENEMY.started = false;

        ENGINE.GAME.ANIMATION.next(GAME.countIn);
    },
    levelEnd() {
        console.log("level", GAME.level, "ended.");
        SPEECH.speak("Good job!");
        GAME.levelCompleted = true;
        //
        ENGINE.GAME.ANIMATION.stop();
        ENGINE.TEXT.centeredText("LEVEL COMPLETED", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 4);
    },
    countIn: function () {
        if (ENGINE.GAME.stopAnimation) return;
        if (!GAME.CI.start) GAME.CI.start = performance.now();
        var delta = Math.floor((performance.now() - GAME.CI.start) / 1000);
        if (delta >= 3) {
            ENGINE.GAME.ANIMATION.next(GAME.afterCountIn);
        } else if (delta !== GAME.CI.now) {
            SPEECH.speak(GAME.CI.text[delta]);
            ENGINE.clearLayer("text");
            ENGINE.TEXT.centeredText(GAME.CI.text[delta], ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 4);
            GAME.CI.now = delta;
        }
    },
    afterCountIn: function () {
        if (ENGINE.GAME.stopAnimation) return;
        ENGINE.clearLayer("text");
        setTimeout(() => (ENEMY.started = true), MAP[GAME.level].enemy_delay);
        ENGINE.GAME.ANIMATION.next(GAME.run);
    },
    run: function (lapsedTime) {
        //console.log(lapsedTime);
        //GAME.run() template
        if (ENGINE.GAME.stopAnimation) return;
        //do all game loop stuff here
        GAME.respond();
        HERO.move(lapsedTime);
        HERO.touchGold();
        GRID_SOLO_FLOOR_OBJECT.manage();
        VANISHING.manage(lapsedTime);
        //SPLASH.manage();
        //ENEMY.move();
        //ENEMY.collideSplash();
        //HERO.collideMonster();
        //
        GAME.frameDraw();
    },
    updateVieport: function () {
        if (!ENGINE.VIEWPORT.changed) return;
        // do required repaints
        ENGINE.VIEWPORT.change("floor", "background");
        ENGINE.VIEWPORT.change("gold", "background");
        //
        ENGINE.VIEWPORT.changed = false;
    },
    frameDraw: function () {
        ENGINE.clearLayerStack();
        GAME.updateVieport();
        //EXPLOSIONS.draw();
        HERO.draw();
        //ENEMY.draw();
        TITLE.radar();
        //SPLASH.draw();
        GAME.PAINT.splash();
    },
    drawFirstFrame(level) {
        ENGINE.resizeBOX("LEVEL", MAP[level].pw, MAP[level].ph);
        ENGINE.TEXTUREGRID.configure("floor", "wall", MAP[level].floor, MAP[level].wall);
        ENGINE.TEXTUREGRID.draw(MAP[level].DUNGEON);
        GAME.PAINT.gold();
        GAME.updateVieport();
        ENGINE.clearLayer("actors");
        ENGINE.clearLayer("splash");
        ENGINE.clearLayer("explosion");
        TITLE.firstFrame();
        HERO.draw();
        //debug
        GAME.blockGrid(level);

    },
    blockGrid(level) {
        console.log("block grid painted");
        //ENGINE.BLOCKGRID.configure("blockgrid", "#FFF", "#000");
        //ENGINE.BLOCKGRID.draw(MAP[level].DUNGEON);
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
    respond: function () {
        //GAME.respond() template
        if (HERO.dead) return;
        var map = ENGINE.GAME.keymap;

        //fall throught section
        if (map[ENGINE.KEY.map.F9]) {
            DEBUG.finishLevel();
        }
        /*if (map[ENGINE.KEY.map.F8]) {
          console.log("kill ,,,,,");
          GAME.lives = 0;
        }*/


        if (map[ENGINE.KEY.map.ctrl]) {
            HERO.splash();
            AUDIO.Splash.play();
            ENGINE.GAME.keymap[ENGINE.KEY.map.ctrl] = false; //NO repeat
        }


        //single key section
        if (map[ENGINE.KEY.map.left]) {
            HERO.tryToChangeDir(LEFT);
            return;
        }
        if (map[ENGINE.KEY.map.right]) {
            HERO.tryToChangeDir(RIGHT);
            return;
        }
        if (map[ENGINE.KEY.map.up]) {
            HERO.tryToChangeDir(UP);
            return;
        }
        if (map[ENGINE.KEY.map.down]) {
            HERO.tryToChangeDir(DOWN);
            return;
        }
        return;
    },
    PAINT: {
        gold() {
            ENGINE.clearLayer("gold");
            GRID_SOLO_FLOOR_OBJECT.draw();
        },
        splash() {
            ENGINE.clearLayer("splash");
            VANISHING.draw();
        }
    },
    CI: {
        text: ["READY", "SET?", "GO!"],
        reset: function () {
            GAME.CI.start = null;
            GAME.CI.now = null;
        }
    },
};
var TITLE = {
    firstFrame() {
        TITLE.clearAllLayers();
        TITLE.sideBackground();
        TITLE.bottom();
        TITLE.hiScore();
        TITLE.score();
        TITLE.energy();
        TITLE.lives();
        TITLE.stage();
        TITLE.radar();
    },
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
        ENGINE.layersToClear = new Set(["text", "animation", "actors", "explosion", "sideback", "button"]);
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
        GAME.grad = grad;
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
    hiScore: function () {
        var CTX = LAYER.title;
        var fs = 16;
        CTX.font = fs + "px Garamond";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "left";
        var x = 700;
        var y = 32 + fs;
        var index = SCORE.SCORE.name[0].indexOf("&nbsp");
        var HS;
        if (index > 0) {
            HS = SCORE.SCORE.name[0].substring(
                0,
                SCORE.SCORE.name[0].indexOf("&nbsp")
            );
        } else {
            HS = SCORE.SCORE.name[0];
        }
        var text =
            "HISCORE: " +
            SCORE.SCORE.value[0].toString().padStart(6, "0") +
            " by " +
            HS;
        CTX.fillText(text, x, y);
    },
    score() {
        ENGINE.clearLayer("score");
        var CTX = LAYER.score;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "center";
        var x = ENGINE.sideWIDTH / 2;
        var y = 48;
        CTX.fillText("SCORE", x, y);
        CTX.fillStyle = "#FFF";
        CTX.shadowColor = "#DDD";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        y += fs + 4;
        CTX.fillText(GAME.score.toString().padStart(6, "0"), x, y);
        if (GAME.score >= GAME.extraLife[0]) {
            GAME.lives++;
            GAME.extraLife.shift();
            TITLE.lives();
        }
    },
    energy: function () {
        ENGINE.clearLayer("energy");
        var CTX = LAYER.energy;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "center";
        var x = ENGINE.sideWIDTH / 2;
        var y = 112;
        CTX.fillText("ENERGY", x, y);
        y += fs;
        var pad = 16;
        CTX.beginPath();
        CTX.lineWidth = "1";
        CTX.strokeStyle = "#DDD";
        var energyWidth = ENGINE.sideWIDTH - 2 * pad;
        CTX.rect(pad, y, energyWidth, 32);
        CTX.closePath();
        CTX.stroke();
        CTX.fillStyle = "#DDD";
        CTX.shadowColor = "transparent";
        CTX.shadowOffsetX = 0;
        CTX.shadowOffsetY = 0;
        CTX.shadowBlur = 0;
        var percent = HERO.energy / MAP[GAME.level].energy;
        if (percent < 0.2 && percent > 0.1) {
            CTX.fillStyle = "yellow";
        } else if (percent <= 0.1) {
            CTX.fillStyle = "red";
        }
        CTX.fillRect(pad + 1, y + 1, Math.round(energyWidth * percent) - 2, 30);
    },
    lives: function () {
        ENGINE.clearLayer("lives");
        var CTX = LAYER.lives;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "center";
        var x = ENGINE.sideWIDTH / 2;
        var y = 220;
        CTX.fillText("LIVES", x, y);
        y += fs + 32;
        CTX.shadowColor = "transparent";
        CTX.shadowOffsetX = 0;
        CTX.shadowOffsetY = 0;
        CTX.shadowBlur = 0;
        var spread = ENGINE.spreadAroundCenter(GAME.lives, x, 32);
        for (let q = 0; q < GAME.lives; q++) {
            ENGINE.spriteDraw("lives", spread[q], y, SPRITE.Wizard_front_0);
        }
    },
    stage: function () {
        ENGINE.clearLayer("stage");
        var CTX = LAYER.stage;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "center";
        var x = ENGINE.sideWIDTH / 2;
        var y = 344;
        CTX.fillText("STAGE", x, y);
        CTX.fillStyle = "#FFF";
        CTX.shadowColor = "#DDD";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        y += fs + 4;
        CTX.fillText(GAME.level.toString().padStart(2, "0"), x, y);
    },
    radar: function () {
        ENGINE.clearLayer("radar");
        var CTX = LAYER.radar;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 2;
        CTX.textAlign = "center";
        var x = ENGINE.sideWIDTH / 2;
        var y = 420;
        CTX.fillText("RADAR", x, y);

        var pad = 20;
        y += fs;
        CTX.beginPath();
        CTX.lineWidth = "1";
        CTX.strokeStyle = "#DDD";
        CTX.rect(pad, y, ENGINE.sideWIDTH - 2 * pad, 152);
        CTX.closePath();
        CTX.stroke();
        CTX.shadowColor = "transparent";
        CTX.shadowOffsetX = 0;
        CTX.shadowOffsetY = 0;
        CTX.shadowBlur = 0;
        var orx = pad + 1;
        var ory = y + 1;
        //draw hero
        CTX.fillStyle = "#00F"; //blue
        CTX.pixelAt(
            orx + HERO.MoveState.homeGrid.x * INI.MINI_PIX,
            ory + HERO.MoveState.homeGrid.y * INI.MINI_PIX,
            INI.MINI_PIX
        );

        //draw gold

        CTX.fillStyle = "yellow";
        for (let q = 0; q < GRID_SOLO_FLOOR_OBJECT.size; q++) {
            if (GRID_SOLO_FLOOR_OBJECT.POOL[q] === null) continue;
            let grid = GRID_SOLO_FLOOR_OBJECT.POOL[q].grid;
            CTX.pixelAt(
                orx + grid.x * INI.MINI_PIX,
                ory + grid.y * INI.MINI_PIX,
                INI.MINI_PIX
            );
        }


        //draw enemy
        /*
        CTX.fillStyle = "red";
        for (let q = 0; q < ENEMY.pool.length; q++) {
          CTX.pixelAt(
            orx + ENEMY.pool[q].MoveState.homeGrid.x * INI.MINI_PIX,
            ory + ENEMY.pool[q].MoveState.homeGrid.y * INI.MINI_PIX,
            INI.MINI_PIX
          );
        }
        */
    },
};
// -- main --
$(function () {
    PRG.INIT();
    SPEECH.init();
    PRG.setup();
    ENGINE.LOAD.preload();
    SCORE.init("SC", "GhostRun", 10, 2500);
    SCORE.loadHS();
    SCORE.hiScore();
    SCORE.extraLife = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, Infinity];
});