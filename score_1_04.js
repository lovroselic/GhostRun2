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

var SCORE = {
  version: "1.04",
  getVersion: function() {
    return SCORE.version;
  },
  checkScore: function(xxx, name) {
    var yourName;
    xxx = parseInt(xxx, 10);
    var start = SCORE.SCORE.depth - 1;
    while (xxx > SCORE.SCORE.value[start] && start >= 0) {
      start--;
    }
    start++;
    if (start === SCORE.SCORE.depth) {
      return;
    } else {
      if (name === undefined) {
        yourName = prompt(
          "You reached top " +
            SCORE.SCORE.depth +
            " score. Enter your name (max 10 characters): "
        );
        yourName = yourName || "Unknown";
      } else yourName = name;

      if (yourName.length > 10) {
        yourName = yourName.substring(0, 10);
      } else if (yourName.length < 10) {
        var temp = 10 - yourName.length;
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
  hiScore: function() {
    var HS = "";
    var tempVal;
    for (var hs = 1; hs <= SCORE.SCORE.depth; hs++) {
      HS +=
        hs.toString().padStart(2, "0") +
        ". " +
        SCORE.SCORE.name[hs - 1] +
        " " +
        SCORE.SCORE.value[hs - 1].toString().padStart(7, "\u0020") +
        "<br/>";
    }
    $("#hiscore").html(HS);
    SCORE.saveHS();
    return;
  },
  saveHS: function() {
    localStorage.setItem(SCORE.SCORE.id, JSON.stringify(SCORE.SCORE));
    return;
  },
  loadHS: function() {
    if (localStorage[SCORE.SCORE.id]) {
      SCORE.SCORE = JSON.parse(localStorage[SCORE.SCORE.id]);
    }
  },
  remove: function(a) {
    if (localStorage[a]) localStorage.removeItem(a);
  },
  SCORE: {
    value: [],
    name: [],
    depth: 10,
    id: "TEST"
  },
  dom: "<div id='hiscore'></div>",
  init: function(id, game, depth, hiscore) {
    var appTo;
    if (!id) {
      appTo = "body";
    } else appTo = "#" + id;
    $(appTo).append(SCORE.dom);
    SCORE.SCORE.id = game;
    SCORE.SCORE.depth = depth;
    for (var x = 0; x < depth; x++) {
      SCORE.SCORE.value.push(hiscore);
      SCORE.SCORE.name.push("C00lSch00l");
      hiscore = Math.round(Math.round(hiscore / 20) * 10);
    }
  },
  extraLife: [],
  refresh: function(){
    SCORE.loadHS();
    SCORE.hiScore();
  }
};

////////////////////end of score.js/////////////////////////
console.log(`SCORE version ${SCORE.getVersion()} loaded.`);
