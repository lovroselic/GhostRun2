/////////////////////////////////////////score.js//////////////
/*
/  version 1.04 vy LS
/  
/   changelog:
/   padLeft exchanged with ES6 padStart
/   fill exchanged with ES6 repeat
/   name as optional parameter
/
**************************************************************/
"use strict";

const SCORE = {
  version: "1.05",
  reversedLogic: false,
  LIMIT:13,
  getVersion() {
    return SCORE.version;
  },
  checkScore(xxx, name) {
    let yourName;
    let start = SCORE.SCORE.depth - 1;
    const isConditionMet = SCORE.reversedLogic ? (value, target) => value < target : (value, target) => value > target;

    while (start >= 0 && isConditionMet(xxx, SCORE.SCORE.value[start])) {
      start--;
    }
    start++; 

    if (start === SCORE.SCORE.depth) {
      return;
    } else {
      if (name === undefined) {
        yourName = prompt(`You reached top ${SCORE.SCORE.depth} score. Enter your name (max 10 characters): `);
        yourName = yourName || "Unknown";
      } else yourName = name;

      if (yourName.length > SCORE.LIMIT) {
        yourName = yourName.substring(0, SCORE.LIMIT);
      } else if (yourName.length < SCORE.LIMIT) {
        var temp = SCORE.LIMIT - yourName.length;
        var sub = "&nbsp".repeat(temp);
        yourName += sub;
      }
      SCORE.SCORE.value.splice(start, 0, xxx);
      SCORE.SCORE.name.splice(start, 0, yourName);
      SCORE.SCORE.value.splice(SCORE.SCORE.depth, 1);
      SCORE.SCORE.name.splice(SCORE.SCORE.depth, 1);
    }
    return;
  },
  hiScore() {
    let HS = "";
    for (let hs = 1; hs <= SCORE.SCORE.depth; hs++) {
      HS += `${hs.toString().padStart(2, "0")}. ${SCORE.SCORE.name[hs - 1]} ${SCORE.SCORE.value[hs - 1].toString().padStart(7, " ")}<br/>`;
    }
    $("#hiscore").html(HS);
    SCORE.saveHS();
    return;
  },
  saveHS() {
    localStorage.setItem(SCORE.SCORE.id, JSON.stringify(SCORE.SCORE));
    return;
  },
  loadHS() {
    if (localStorage[SCORE.SCORE.id]) {
      SCORE.SCORE = JSON.parse(localStorage[SCORE.SCORE.id]);
    }
  },
  remove(a) {
    if (localStorage[a]) localStorage.removeItem(a);
  },
  SCORE: {
    value: [],
    name: [],
    depth: 10,
    id: "TEST"
  },
  dom: "<div id='hiscore'></div>",
  init(id, game, depth, hiscore, reversedLogic = false) {
    let appTo;
    if (!id) {
      appTo = "body";
    } else appTo = "#" + id;
    $(appTo).append(SCORE.dom);
    SCORE.SCORE.id = game;
    SCORE.SCORE.depth = depth;
    SCORE.reversedLogic = reversedLogic;


    for (let x = 0; x < depth; x++) {
      SCORE.SCORE.value.push(hiscore);
      SCORE.SCORE.name.push("LaughingSkull");
      if (reversedLogic) {
        hiscore *= 2;
      } else {
        hiscore = Math.round(Math.round(hiscore / 20) * 10);
      }
    }
  },
  extraLife: [],
  refresh() {
    SCORE.loadHS();
    SCORE.hiScore();
  }
};

////////////////////end of score.js/////////////////////////
console.log(`SCORE version ${SCORE.getVersion()} loaded.`);
