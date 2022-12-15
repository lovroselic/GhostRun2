//////////////////speech.js/////////////////////////
//                                                //
//       SPEECH version 1.02  by LS               //
//                                                //
////////////////////////////////////////////////////
/*  

TODO:
    
*/
////////////////////////////////////////////////////

var SPEECH = {
  VERSION: "1.02",
  CSS: "color: #0A0",
  interval: 20,
  browserSupport: true,
  voices: null,
  voice: null,
  settings: null,
  wait() {
    if (!SPEECH.browserSupport) return;
    if (SPEECH.ready) {
      return;
    } else {
      console.log(`%cwaiting for voices to load ....`, "color: #0A0");
      setTimeout(SPEECH.wait, SPEECH.inteval);
    }
  },
  init(rate = 0.5, pitch = 0.9, volume = 1) {
    if (!("speechSynthesis" in window)) {
      SPEECH.browserSupport = false;
      console.log(`%cInitializing SPEECH failed. Browser not supported!`, "color: #F00");
      return;
    }
    let ready = Promise.all([SPEECH.getVoices()]).then(function () {
      SPEECH.ready = true;
      console.log(`%cSPEECH ${SPEECH.VERSION}: ready`, SPEECH.CSS);
      SPEECH.voice = SPEECH.voices[1];
    });

    let def = new VoiceSetting(rate, pitch, volume);
    SPEECH.settings = def;
    SPEECH.wait();
  },
  speak(txt) {
    if (!SPEECH.ready) {
      console.log(`%cSPEECH not ready ....`, "color: #A00");
      return;
    }

    let msg = new SpeechSynthesisUtterance();
    msg.text = txt;
    msg.pitch = SPEECH.settings.pitch;
    msg.rate = SPEECH.settings.rate;
    msg.volume = SPEECH.settings.volume;
    msg.voice = SPEECH.voice;
    speechSynthesis.speak(msg);
  },
  getVoices() {
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
      console.log(`%cInitializing SPEECH failed. Browser not supported!`, "color: #F00");
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