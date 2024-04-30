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

const DEBUG = {
    FPS: false,
    BUTTONS: false,
    SETTING: true,
    VERBOSE: false,
    PAINT_TRAIL: false,
    invincible: false,
    INF_LIVES: false,
    finishLevel() {
        FLOOR_OBJECT.POOL.length = 1;
        FLOOR_OBJECT.manage();
        GAME.PAINT.gold();
    }
};
const INI = {
    GOLD: 100,
    HERO_SPEED: 8,
    MINI_PIX: 3,
    SCORE_GOLD: 10,
    SPLASH_COST: 10,
    SPLASH_TIME: 3000,
    LEVEL_BONUS: 1000,
    LEVEL_FACTOR: 0.4,
};
const PRG = {
    VERSION: "2.06",
    NAME: "GhostRun II",
    YEAR: "2021",
    CSS: "color: #239AFF;",
    INIT() {
        console.log("%c****************************", PRG.CSS);
        console.log(`${PRG.NAME} ${PRG.VERSION} by Lovro Selic, (c) LaughingSkull ${PRG.YEAR} on ${navigator.userAgent}`);
        $("#title").html(PRG.NAME);
        $("#version").html(`${PRG.NAME} V${PRG.VERSION} <span style='font-size:14px'>&copy</span> LaughingSkull ${PRG.YEAR}`);
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

        $("#engine_version").html(ENGINE.VERSION);
        $("#grid_version").html(GRID.VERSION);
        $("#maze_version").html(DUNGEON.VERSION);
        $("#ai_version").html(AI.VERSION);
        $("#lib_version").html(LIB.VERSION);
        $("#iam_version").html(IndexArrayManagers.VERSION);
        $("#speech_version").html(SPEECH.VERSION);

        $("#toggleHelp").click(function () {
            $("#help").toggle(400);
        });
        $("#toggleAbout").click(function () {
            $("#about").toggle(400);
        });

        $("#toggleVersion").click(function () {
            $("#debug").toggle(400);
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

        $("#bottom").css(
            "margin-top",
            ENGINE.gameHEIGHT + ENGINE.titleHEIGHT + ENGINE.bottomHEIGHT
        );
        $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + ENGINE.sideWIDTH + 4);
        ENGINE.addBOX("TITLE", ENGINE.titleWIDTH, ENGINE.titleHEIGHT, ["title"], null);
        ENGINE.addBOX("ROOM", ENGINE.gameWIDTH, ENGINE.gameHEIGHT,
            ["background", "splash", "actors", "explosion", "text", "animation", "FPS", "button", "click"],
            "side");
        ENGINE.addBOX("SIDE", ENGINE.sideWIDTH, ENGINE.gameHEIGHT,
            ["sideback", "score", "energy", "lives", "stage", "radar"],
            "fside");
        ENGINE.addBOX("DOWN", ENGINE.bottomWIDTH, ENGINE.bottomHEIGHT, ["bottom", "bottomText"], null);

        ENGINE.addBOX("LEVEL", ENGINE.gameWIDTH, ENGINE.gameHEIGHT, ["floor", "wall", "gold", "grid", "coord", "player", "debug",], null);

        if (!DEBUG.PAINT_TRAIL) $("#LEVEL").addClass("hidden");
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
        HERO.actor = new ACTOR(HERO.spriteClass, HERO.x, HERO.y, "front", HERO.asset, 30);
        HERO.dead = false;
    },
    init() {
        HERO.speed = INI.HERO_SPEED;
        HERO.slowed = false;
        HERO.dead = false;
        GRID.gridToSprite(MAP[GAME.level].DUNGEON.startPosition, HERO.actor);
        HERO.moveState = new MoveState(MAP[GAME.level].DUNGEON.startPosition, null, MAP[GAME.level].DUNGEON.GA);
        HERO.moveState.next(UP);
        HERO.actor.orientation = "front";
        HERO.actor.refresh();
    },
    draw() {
        if (HERO.dead) return;
        ENGINE.spriteDraw("actors", HERO.actor.vx, HERO.actor.vy, HERO.actor.sprite());
        ENGINE.layersToClear.add("actors");
        if (DEBUG.PAINT_TRAIL) {
            let CTX = LAYER.player;
            CTX.fillStyle = "blue";
            CTX.pixelAt(HERO.actor.x, HERO.actor.y, 2);
        }
    },
    move(lapsedTime) {
        if (HERO.dead) return;
        if (HERO.moveState.moving) {
            GRID.translateMove(HERO, lapsedTime, HERO.moveState.gridArray, true, HeroOnFinish);
        } else {
            HERO.moveState.next(HERO.findNewDir());
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
        if (GRID.same(HERO.moveState.dir.mirror(), dir)) {
            if (GRID.same(HERO.moveState.startGrid, GRID.trueToGrid(HERO.actor))) return;
            HERO.moveState.reverse();
            return;
        }
        if (!HERO.moveState.moving) {
            let dirs = HERO.moveState.gridArray.getDirectionsIfNot(HERO.moveState.endGrid, MAPDICT.WALL);
            if (GRID.isGridIn(dir, dirs) !== -1) {
                HERO.moveState.next(dir);
                return;
            }
        }
    },
    findNewDir() {
        let dirs = HERO.moveState.gridArray.getDirectionsIfNot(HERO.moveState.endGrid, MAPDICT.WALL, HERO.moveState.dir.mirror());
        if (GRID.isGridIn(HERO.moveState.dir, dirs) !== -1) return HERO.moveState.dir;
        return dirs.chooseRandom();
    },
    touchGold() {
        let IA = MAP[GAME.level].DUNGEON.floor_object_IA_1_1;
        let goldIndex = IA.unroll(HERO.moveState.homeGrid)[0];
        if (goldIndex) {
            FLOOR_OBJECT.remove(goldIndex);
            FLOOR_OBJECT.reIndexRequired = true;
            GAME.score += INI.SCORE_GOLD;
            TITLE.score();
            GAME.PAINT.gold();
            ENGINE.VIEWPORT.changed = true;
            AUDIO.Pick.play();
        }

        if (FLOOR_OBJECT.size === 0) {
            GAME.levelEnd();
        }

    },
    splash() {
        if (HERO.dead) return;
        let grid = Grid.toClass(HERO.moveState.homeGrid);
        if (!VANISHING.isGridFree(grid)) return;
        if (HERO.energy > INI.SPLASH_COST) {
            HERO.energy -= INI.SPLASH_COST;
            TITLE.energy();
            let splash = new Splash(grid, new ACTOR('Splash'));
            VANISHING.add(splash);
        }
    },
    collideMonster() {
        if (HERO.dead) return;
        let M = MAP[GAME.level].DUNGEON[ENEMY_TG.IA].unroll(HERO.moveState.homeGrid);
        let hit = M.sum();
        if (hit > 0) {
            if (!DEBUG.invincible) HERO.die();
            for (let m of M) {
                ENEMY_TG.remove(m);
            }
        }
    },
    die() {
        if (HERO.dead) return;
        AUDIO.Explosion.play();
        AUDIO.EvilLaughter.onended = GAME.endLaugh;
        AUDIO.EvilLaughter.play();
        console.log("HERO died");
        HERO.dead = true;
        DESTRUCTION_ANIMATION.add(new Explosion(HERO.moveState.homeGrid));
        ENGINE.GAME.ANIMATION.next(GAME.deadRun);
    },
};
class Explosion {
    constructor(grid) {
        this.grid = grid;
        this.layer = 'explosion';
        this.moveState = new MoveState(grid, NOWAY);
        this.actor = new ACTOR("Explosion", 0, 0, "linear", ASSET.Explosion);
        GRID.gridToSprite(this.grid, this.actor);
        this.alignToViewport();
    }
    alignToViewport() {
        ENGINE.VIEWPORT.alignTo(this.actor);
    }
    draw() {
        this.alignToViewport();
        ENGINE.spriteDraw(this.layer, this.actor.vx, this.actor.vy, this.actor.sprite());
    }
}
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
        ENGINE.spriteDraw("splash", this.actor.vx, this.actor.vy, SPRITE.Splash);
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
class Monster {
    constructor(grid, type) {
        this.parent = ENEMY_TG;
        this.grid = Grid.toClass(grid);
        this.moveState = new MoveState(grid, UP, MAP[GAME.level].DUNGEON.GA);
        for (const prop in type) {
            this[prop] = type[prop];
        }
        this.actor = new ACTOR(this.name, 0, 0, "front", ASSET[this.name], this.fps);
        GRID.gridToSprite(this.grid, this.actor);
        this.alignToViewport();
        this.dirStack = [];
        this.viewDir = null;
        this.captured = false;
        this.released = false;
        this.waiting = false;
    }
    alignToViewport() {
        ENGINE.VIEWPORT.alignTo(this.actor);
    }
    look() {
        let GA = this.moveState.gridArray;
        if (this.blind) return null;
        var heroDir = this.moveState.homeGrid.absDirection(HERO.moveState.homeGrid);
        if (!heroDir.isOrto()) return null;
        var dir = this.moveState.homeGrid.direction(HERO.moveState.homeGrid);
        if (dir.same(this.moveState.dir.mirror())) return null;
        if (GA.lookForGrid(this.moveState.homeGrid, dir, HERO.moveState.homeGrid)) {
            this.dirStack = [dir];
            return true;
        }
        return null;
    }
    makeMove() {
        let dir = this.dirStack.shift();
        if (GRID.same(dir, NOWAY)) return;
        this.moveState.dir = dir;
        this.moveState.next(this.moveState.dir);
    }
    setViewDir() {
        this.viewDir = this.moveState.dir;
    }
    manage(lapsedTime, IA) {
        if (!GAME.ENEMY.started) return;
        this.waiting = false; //
        let GA = this.moveState.gridArray;
        if (this.captured) {
            this.viewDir = this.viewDir.ccw();
            this.actor.orientation = this.actor.getOrientation(this.viewDir);
            this.actor.updateAnimation(lapsedTime, this.actor.orientation);
        } else if (this.released) {
            this.viewDir = null;
            this.actor.orientation = this.actor.getOrientation(this.moveState.dir);
            this.actor.animateMove(this.actor.orientation);
        } else {
            if (this.moveState.moving) {
                let others = IA.unroll(this.moveState.endGrid);
                others = others.addUnique(IA.unroll(this.moveState.homeGrid));
                others = others.filter(el => el !== this.id);

                let any = others.sum() !== 0;
                if (any) {
                    for (let monsterId of others) {
                        let monster = ENEMY_TG.show(monsterId);
                        if (monster.captured || monster.waiting) {
                            if (!monster.captured) {
                                if (this.id < monster.id) {
                                    return;
                                }
                            }
                        }
                    }
                }

                if (this.id >= Math.max(...others)) {
                    GRID.translateMove(this, lapsedTime, GA);
                    this.waiting = false;
                } else {
                    this.waiting = true;
                }
            } else {
                this.look();
                if (this.dirStack.length === 0) {
                    let ARG = {
                        playerPosition: HERO.moveState.homeGrid,
                        currentPlayerDir: HERO.moveState.dir,
                        block: [this.moveState.homeGrid.add(this.moveState.dir.mirror())],
                        MS: HERO.moveState
                    };
                    this.dirStack = AI[this.ai](this, ARG);
                }
                this.makeMove();
            }
        }
    }
    draw() {
        this.alignToViewport();
        ENGINE.spriteDraw("actors", this.actor.vx, this.actor.vy, this.actor.sprite());
        if (DEBUG.PAINT_TRAIL) {
            let CTX = LAYER.debug;
            CTX.fillStyle = "red";
            CTX.pixelAt(this.actor.x, this.actor.y, 2);
        }
    }
}
const GAME = {
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
        ENGINE.GAME.start(16);
        GAME.prepareForRestart();
        GAME.completed = false;
        GAME.won = false;
        GAME.level = 1;
        GAME.score = 0;
        GAME.lives = 3;
        HERO.startInit();
        AI.initialize(HERO);
        GAME.fps = new FPS_measurement();
        ENGINE.GAME.ANIMATION.waitThen(GAME.levelStart, 2);
    },
    levelStart() {
        MAP.createNewLevel(GAME.level);
        HERO.energy = MAP[GAME.level].energy;
        GAME.initLevel(GAME.level);
        GAME.continueLevel(GAME.level);
    },
    initLevel(level) {
        let randomDungeon = RAT_ARENA.create(MAP[level].width, MAP[level].height);
        MAP[level].DUNGEON = randomDungeon;
        FLOOR_OBJECT.init(MAP[level].DUNGEON);
        DESTRUCTION_ANIMATION.init(MAP[level].DUNGEON);
        SPAWN.gold(level);
        MAP[level].pw = MAP[level].width * ENGINE.INI.GRIDPIX;
        MAP[level].ph = MAP[level].height * ENGINE.INI.GRIDPIX;
        ENGINE.VIEWPORT.setMax({ x: MAP[level].pw, y: MAP[level].ph });
    },
    continueLevel(level) {
        ENEMY_TG.init(MAP[level].DUNGEON);
        VANISHING.init(MAP[level].DUNGEON);
        SPAWN.monsters(level);
        HERO.init();
        HERO.energy = Math.max(Math.round(FLOOR_OBJECT.size / INI.GOLD * MAP[GAME.level].energy), HERO.energy);
        GAME.levelExecute();
    },
    levelExecute() {
        GAME.CI.reset();
        ENGINE.VIEWPORT.reset();
        ENGINE.VIEWPORT.check(HERO.actor);
        ENGINE.VIEWPORT.alignTo(HERO.actor);
        GAME.drawFirstFrame(GAME.level);
        GAME.ENEMY.started = false;
        ENGINE.GAME.ANIMATION.next(GAME.countIn);
    },
    levelEnd() {
        SPEECH.speak("Good job!");
        GAME.levelCompleted = true;
        ENGINE.TEXT.centeredText("LEVEL COMPLETED", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 4);
        TITLE.endLevel();
        ENGINE.GAME.ANIMATION.next(ENGINE.KEY.waitFor.bind(null, GAME.nextLevel, "enter"));
    },
    nextLevel() {
        GAME.level++;
        GAME.levelCompleted = false;
        ENGINE.GAME.ANIMATION.waitThen(GAME.levelStart, 2);
    },
    countIn() {
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
    afterCountIn() {
        if (ENGINE.GAME.stopAnimation) return;
        ENGINE.clearLayer("text");
        setTimeout(() => (GAME.ENEMY.started = true), MAP[GAME.level].enemy_delay);
        GAME.resume();
    },
    run(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.respond();
        HERO.move(lapsedTime);
        HERO.touchGold();
        FLOOR_OBJECT.manage();
        VANISHING.manage(lapsedTime);
        GAME.ENEMY.move(lapsedTime);
        GAME.ENEMY.collideSplash();
        HERO.collideMonster();
        GAME.frameDraw(lapsedTime);
    },
    updateVieport() {
        if (!ENGINE.VIEWPORT.changed) return;
        ENGINE.VIEWPORT.change("floor", "background");
        ENGINE.VIEWPORT.change("gold", "background");
        ENGINE.VIEWPORT.changed = false;
    },
    deadRun(lapsedTime) {
        DESTRUCTION_ANIMATION.manage(lapsedTime);
        GAME.deadFrameDraw(lapsedTime);
    },
    deadFrameDraw(lapsedTime) {
        ENGINE.clearLayerStack();
        GAME.ENEMY.draw();
        ENGINE.spriteDraw("actors", HERO.actor.vx, HERO.actor.vy, SPRITE.skull);
        GAME.EXP.draw(lapsedTime);
    },
    frameDraw(lapsedTime) {
        ENGINE.clearLayerStack();
        GAME.updateVieport();
        HERO.draw();
        GAME.ENEMY.draw();
        TITLE.radar();
        GAME.PAINT.splash();

        if (DEBUG.FPS) {
            GAME.FPS(lapsedTime);
        }
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
        GAME.ENEMY.draw();

        if (DEBUG.PAINT_TRAIL) GAME.blockGrid(level);
    },
    blockGrid(level) {
        GRID.grid();
        GRID.paintCoord("coord", MAP[level].DUNGEON);
    },
    prepareForRestart() {
        ENGINE.TIMERS.clear();
    },
    setup() {
        console.log("GAME SETUP started");

        $("#buttons").prepend("<input type='button' id='startGame' value='Start Game'>");
        $("#startGame").prop("disabled", true);

        MAZE.bias = 2;
        MAZE.useBias = true;
    },
    setTitle() {
        const text = GAME.generateTitleText();
        const RD = new RenderData("Arcade", 16, "#0E0", "bottomText");
        const SQ = new RectArea(0, 0, LAYER.bottomText.canvas.width, LAYER.bottomText.canvas.height);
        GAME.movingText = new MovingText(text, 4, RD, SQ);
    },
    generateTitleText() {
        let text = `${PRG.NAME} ${PRG.VERSION
            }, a game by Lovro Selic, ${"\u00A9"} LaughingSkull ${PRG.YEAR
            }. Music: 'Determination' written and performed by LaughingSkull, ${"\u00A9"
            } 2007 Lovro Selic. `;
        text += "     ENGINE, SPEECH, GRID, MAZE, AI and GAME code by Lovro Selic using JavaScript. ";
        text = text.split("").join(String.fromCharCode(8202));
        return text;
    },
    runTitle() {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.movingText.process();
        GAME.titleFrameDraw();
    },
    titleFrameDraw() {
        GAME.movingText.draw();
    },
    lostFocus() {
        if (GAME.paused || HERO.dead) return;
        GAME.clickPause();
    },
    clickPause() {
        if (HERO.dead || GAME.levelCompleted) return;
        $("#pause").trigger("click");
        ENGINE.GAME.keymap[ENGINE.KEY.map.F4] = false;
    },
    pause() {
        if (GAME.paused) return;
        if (HERO.dead || GAME.levelCompleted) return;
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
    respond() {
        if (HERO.dead) return;
        var map = ENGINE.GAME.keymap;

        if (map[ENGINE.KEY.map.F4]) {
            $("#pause").trigger("click");
            ENGINE.TIMERS.display();
            ENGINE.GAME.keymap[ENGINE.KEY.map.F4] = false;
        }
        if (map[ENGINE.KEY.map.F9]) {
            if (DEBUG.BUTTONS) DEBUG.finishLevel();
        }
        if (map[ENGINE.KEY.map.ctrl]) {
            if (!VANISHING.map.vanishing_IA) return;
            HERO.splash();
            AUDIO.Splash.play();
            ENGINE.GAME.keymap[ENGINE.KEY.map.ctrl] = false;
        }
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
    FPS(lapsedTime) {
        let CTX = LAYER.FPS;
        CTX.fillStyle = "white";
        ENGINE.clearLayer("FPS");
        let fps = 1000 / lapsedTime || 0;
        GAME.fps.update(fps);
        CTX.fillText(GAME.fps.getFps(), 5, 10);
    },
    endLaugh() {
        ENGINE.GAME.ANIMATION.stop();
        GAME.lives--;
        if (GAME.lives < 0 && !DEBUG.INF_LIVES) {
            console.log("GAME OVER");
            TITLE.gameOver();
            GAME.end();
        } else {
            GAME.continueLevel(GAME.level);
        }
    },
    end() {
        ENGINE.showMouse();
        AUDIO.Death.onended = GAME.checkScore;
        AUDIO.Death.play();
    },
    checkScore() {
        SCORE.checkScore(GAME.score);
        SCORE.hiScore();
        TITLE.startTitle();
    },
    PAINT: {
        gold() {
            ENGINE.clearLayer("gold");
            FLOOR_OBJECT.draw();
        },
        splash() {
            ENGINE.clearLayer("splash");
            VANISHING.draw();
        }
    },
    CI: {
        text: ["READY", "SET?", "GO!"],
        reset() {
            GAME.CI.start = null;
            GAME.CI.now = null;
        }
    },
    ENEMY: {
        started: false,
        move(lapsedTime) {
            ENEMY_TG.manage(lapsedTime, HERO);
        },
        draw() {
            ENGINE.layersToClear.add("actors");
            ENEMY_TG.draw();
        },
        collideSplash() {
            for (const enemy of ENEMY_TG.POOL) {
                if (enemy.released) {
                    enemy.released = false;
                } else if (enemy.captured) {
                    enemy.captured = false;
                    enemy.released = true;
                }
                let hit = enemy.parent.map[VANISHING.IA].unroll(enemy.moveState.homeGrid).sum();
                if (hit > 0) {
                    enemy.captured = true;
                    if (!enemy.viewDir) enemy.setViewDir();
                }
            }
        }
    },
    EXP: {
        draw(lapsedTime) {
            ENGINE.clearLayer("explosion");
            DESTRUCTION_ANIMATION.draw(lapsedTime);
        }
    }
};
const TITLE = {
    firstFrame() {
        TITLE.clearAllLayers();
        TITLE.sideBackground();
        TITLE.topBackground();
        TITLE.titlePlot();
        TITLE.bottom();
        TITLE.hiScore();
        TITLE.score();
        TITLE.energy();
        TITLE.lives();
        TITLE.stage();
        TITLE.radar();
    },
    startTitle() {
        $("#pause").prop("disabled", true);
        if (AUDIO.Title) AUDIO.Title.play();
        TITLE.clearAllLayers();
        TITLE.blackBackgrounds();
        TITLE.titlePlot();
        ENGINE.draw("background", ENGINE.gameWIDTH - TEXTURE.Title.width , Math.floor((ENGINE.gameHEIGHT - TEXTURE.Title.height) / 2) - 50, TEXTURE.Title);
        $("#DOWN")[0].scrollIntoView();

        ENGINE.topCanvas = ENGINE.getCanvasName("ROOM");
        TITLE.drawButtons();
        GAME.setTitle();
        ENGINE.GAME.start(16);
        ENGINE.GAME.ANIMATION.next(GAME.runTitle);
    },
    clearAllLayers() {
        ENGINE.layersToClear = new Set(["text", "animation", "actors", "explosion", "sideback", "button", "score",
            "energy", "lives", "stage", "radar", "title", "splash"]);
        ENGINE.clearLayerStack();
    },
    blackBackgrounds() {
        this.topBackground();
        this.bottomBackground();
        this.sideBackground();
        ENGINE.fillLayer("background", "#000");
    },
    topBackground() {
        var CTX = LAYER.title;
        CTX.fillStyle = "#000";
        CTX.roundRect(0, 0, ENGINE.titleWIDTH, ENGINE.titleHEIGHT,
            { upperLeft: 20, upperRight: 20, lowerLeft: 0, lowerRight: 0 },
            true, true);
    },
    bottomBackground() {
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
    hiScore() {
        var CTX = LAYER.title;
        var fs = 16;
        CTX.font = fs + "px Garamond";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "#cec967";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        CTX.textAlign = "left";
        var x = 700;
        var y = 32 + fs;
        var index = SCORE.SCORE.name[0].indexOf("&nbsp");
        var HS;
        if (index > 0) {
            HS = SCORE.SCORE.name[0].substring(0, SCORE.SCORE.name[0].indexOf("&nbsp"));
        } else {
            HS = SCORE.SCORE.name[0];
        }
        var text = "HISCORE: " + SCORE.SCORE.value[0].toString().padStart(6, "0") + " by " + HS;
        CTX.fillText(text, x, y);
    },
    score() {
        ENGINE.clearLayer("score");
        var CTX = LAYER.score;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "#cec967";
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
    energy() {
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
    lives() {
        ENGINE.clearLayer("lives");
        var CTX = LAYER.lives;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "#cec967";
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
    stage() {
        ENGINE.clearLayer("stage");
        var CTX = LAYER.stage;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "#cec967";
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
    radar() {
        ENGINE.clearLayer("radar");
        var CTX = LAYER.radar;
        var fs = 16;
        CTX.font = fs + "px Emulogic";
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "#cec967";
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
        CTX.fillStyle = "#00F";
        CTX.pixelAt(
            orx + HERO.moveState.homeGrid.x * INI.MINI_PIX,
            ory + HERO.moveState.homeGrid.y * INI.MINI_PIX,
            INI.MINI_PIX
        );

        //draw gold
        CTX.fillStyle = "yellow";
        for (let q = 0; q < FLOOR_OBJECT.size; q++) {
            if (FLOOR_OBJECT.POOL[q] === null) continue;
            let grid = FLOOR_OBJECT.POOL[q].grid;
            CTX.pixelAt(
                orx + grid.x * INI.MINI_PIX,
                ory + grid.y * INI.MINI_PIX,
                INI.MINI_PIX
            );
        }

        //draw enemy
        CTX.fillStyle = "red";
        let pool = ENEMY_TG.POOL;
        for (let q = 0; q < pool.length; q++) {
            if (pool[q] === null) continue;
            CTX.pixelAt(
                orx + pool[q].moveState.homeGrid.x * INI.MINI_PIX,
                ory + pool[q].moveState.homeGrid.y * INI.MINI_PIX,
                INI.MINI_PIX
            );
        }
    },
    gameOver() {
        ENGINE.clearLayer("text");
        var CTX = LAYER.text;
        CTX.textAlign = "center";
        var x = ENGINE.gameWIDTH / 2;
        var y = ENGINE.gameHEIGHT / 2;
        var fs = 64;
        CTX.font = fs + "px Arcade";
        var txt = CTX.measureText("GAME OVER");
        var gx = x - txt.width / 2;
        var gy = y - fs;
        var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
        grad.addColorStop("0", "#DDD");
        grad.addColorStop("0.1", "#EEE");
        grad.addColorStop("0.2", "#DDD");
        grad.addColorStop("0.3", "#CCC");
        grad.addColorStop("0.4", "#BBB");
        grad.addColorStop("0.5", "#AAA");
        grad.addColorStop("0.6", "#BBB");
        grad.addColorStop("0.7", "#CCC");
        grad.addColorStop("0.8", "#DDD");
        grad.addColorStop("0.9", "#EEE");
        grad.addColorStop("1", "#DDD");
        CTX.fillStyle = grad;
        CTX.shadowColor = "#FFF";
        CTX.shadowOffsetX = 2;
        CTX.shadowOffsetY = 2;
        CTX.shadowBlur = 3;
        CTX.fillText("GAME OVER", x, y);
    },
    endLevel() {
        let CTX = LAYER.text;
        CTX.save();
        let p = ENGINE.window(ENGINE.gameWIDTH / 2, 232);
        CTX.textAlign = "center";
        let fs = 16;
        CTX.font = fs + "px Adore";
        let y = p.y + fs * 3;
        let x = ENGINE.gameWIDTH / 2;
        CTX.fillStyle = GAME.grad;
        CTX.shadowColor = "yellow";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        CTX.fillText("Level " + GAME.level.toString().padStart(2, "0") + " complete", x, y);
        y += fs * 1.3;
        CTX.fillText("-----------------", x, y);
        y += fs * 1.3;
        CTX.fillText("Time bonus: " + HERO.energy.toString().padStart(5, "0"), x, y);
        y += fs * 1.3;
        let bonus = INI.LEVEL_BONUS + (GAME.level - 1) * (INI.LEVEL_BONUS * INI.LEVEL_FACTOR);
        CTX.fillText("Stage bonus: " + bonus.toString().padStart(5, "0"), x, y);
        GAME.score += HERO.energy;
        GAME.score += bonus;
        TITLE.score();
        y += 3 * fs * 1.3;
        fs = 14;
        CTX.font = fs + "px Adore";
        CTX.fillText("Press ENTER to continue", x, y);
        CTX.restore();
    },
};

// -- main --
$(function () {
    PRG.INIT();
    SPEECH.init(1.0);
    PRG.setup();
    ENGINE.LOAD.preload();
    SCORE.init("SC", "GhostRun", 15, 5000);
    SCORE.loadHS();
    SCORE.hiScore();
    SCORE.extraLife = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, Infinity];
});