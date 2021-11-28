//////////////////speech.js/////////////////////////
//                                                //
//       SPEECH version 1.00  by LS               //
//                                                //
////////////////////////////////////////////////////
/*  

TODO:
    
*/
////////////////////////////////////////////////////

var SPEECH = {
  VERSION: "1.00",
  CSS: "color: #0A0",
  interval: 20,
  browserSupport: true,
  voices: null,
  voice: null,
  settings: null,
  wait: function () {
    if (!SPEECH.browserSupport) return;
    if (SPEECH.ready) {
      return;
    } else {
      console.log(`%cwaiting for voices to load ....`, "color: #0A0");
      setTimeout(SPEECH.wait, SPEECH.inteval);
    }
  },
  init: function () {
    if (!("speechSynthesis" in window)) {
      SPEECH.browserSupport = false;
      console.log(
        `%cInitializing SPEECH failed. Browser not supported!`,
        "color: #F00"
      );
      return;
    }
    let ready = Promise.all([SPEECH.getVoices()]).then(function () {
      SPEECH.ready = true;
      console.log(`%cSPEECH ${SPEECH.VERSION}: ready`, SPEECH.CSS);
      SPEECH.voice = SPEECH.voices[0];
    });
    
    let def = new VoiceSetting(1, 1, 1);
    SPEECH.settings = def;
    SPEECH.wait();
  },
  speak: function (txt) {
    if (!SPEECH.ready){
      console.log(`%cSPEECH not ready ....`, "color: #A00");
      return;
    }
    
    let msg = new SpeechSynthesisUtterance();
    msg.text = txt;
    msg.pitch = SPEECH.settings.pitch;
    msg.rate = SPEECH.settings.pitch;
    msg.volume = SPEECH.settings.pitch;
    msg.voice = SPEECH.voice;
    //console.log("saying msg", msg);
    speechSynthesis.speak(msg);
  },
  getVoices: function () {
    if (navigator.userAgent.includes("Firefox")) {
      console.log(`%cInitializing SPEECH - Firefox`, SPEECH.CSS);
      return new Promise((resolve) => {
        let voices;
        voices = speechSynthesis.getVoices();
        SPEECH.voices = voices;
        resolve(voices);
      });
    } else if (navigator.userAgent.includes("Chrome")) {
      console.log(`%cInitializing SPEECH - Chrome`, SPEECH.CSS);
      return new Promise((resolve) => {
        let voices;
        speechSynthesis.onvoiceschanged = function () {
          voices = speechSynthesis.getVoices();
          SPEECH.voices = voices;
          resolve(voices);
        };
      });
    } else {
      SPEECH.browserSupport = false;
      console.log(
        `%cInitializing SPEECH failed. Browser not supported!`,
        "color: #F00"
      );
    }
  },
  ready: false
};
class VoiceSetting {
  constructor(rate, pitch, volume) {
    this.rate = rate;
    this.pitch = pitch;
    this.volume = volume;
  }
}
console.log(`%cSPEECH ${SPEECH.VERSION} loaded.`, SPEECH.CSS);