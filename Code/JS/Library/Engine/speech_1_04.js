//////////////////speech.js/////////////////////////
//                                                //
//       SPEECH version 1.04  by LS               //
//                                                //
////////////////////////////////////////////////////
/*  

TODO:
    
*/
////////////////////////////////////////////////////

const SPEECH = {
  VERSION: "1.04",
  CSS: "color: #0A0",
  VERBOSE: true,
  browserSupport: true,
  voices: null,
  voice: null,
  settings: null,
  ready: false,
  init(rate = 0.5, pitch = 0.9, volume = 1) {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        SPEECH.browserSupport = false;
        console.log(`%cInitializing SPEECH failed. Browser not supported!`, "color: #F00");
        reject("Browser not supported");
        return;
      }

      Promise.all([SPEECH.getVoices()]).then(function () {
        SPEECH.ready = true;
        console.log(`%cSPEECH ${SPEECH.VERSION}: ready`, SPEECH.CSS);
        SPEECH.voice = SPEECH.voices[1];
        let def = new VoiceSetting(rate, pitch, volume);
        SPEECH.settings = def;
        resolve();
      });
    });
  },
  use(voice) {
    voice = VOICE[voice];
    SPEECH.voice = SPEECH.voices[voice.voice];
    for (const setting in voice.setting) {
      SPEECH.settings[setting] = voice.setting[setting];
    }
  },
  speak(txt) {
    if (!SPEECH.ready) {
      console.log(`%cSPEECH not ready ....`, "color: #A00");
      return;
    }
    if (speechSynthesis.pending) {
      if (SPEECH.VERBOSE) console.log(`%cSPEECH is already speaking. Skipping new text.`, "color: #A00");
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
  speakWithArticulation(txt) {
    if (!SPEECH.ready) {
      console.log(`%cSPEECH not ready ....`, "color: #A00");
      return;
    }
    if (speechSynthesis.pending || speechSynthesis.speaking) {
      if (SPEECH.VERBOSE) console.log(`%cSPEECH is already speaking. Skipping new text.`, "color: #A00");
      return;
    }

    const articulations = ".!?<>+-";
    let sentences = txt.split(new RegExp(`([${articulations}])`, "g"));
    let i = 0;
    speakSentence();

    function speakSentence() {
      if (i >= sentences.length) {
        return;
      }

      let sentence = sentences[i];
      let punctuation = sentences[i + 1];
      const descriptor = punctuation;

      let msg = new SpeechSynthesisUtterance();
      if (!["!", "?", "."].includes(punctuation)) punctuation = ".";

      msg.text = sentence + (punctuation || '');
      msg.voice = SPEECH.voice;
      msg.volume = SPEECH.settings.volume;

      switch (descriptor) {
        case "?":
          msg.rate = SPEECH.settings.rate * 0.8;
          msg.pitch = SPEECH.settings.pitch * 1.5;
          break;
        case "!":
          msg.rate = SPEECH.settings.rate * 1.2;
          msg.pitch = SPEECH.settings.pitch * 0.8;
          break;
        case "<":
          SPEECH.settings.rate *= 0.667;
          msg.rate = SPEECH.settings.rate;
          msg.pitch = SPEECH.settings.pitch;
          break;
        case ">":
          SPEECH.settings.rate *= 1.5;
          msg.rate = SPEECH.settings.rate;
          msg.pitch = SPEECH.settings.pitch;
          break;
        case "-":
          SPEECH.settings.pitch *= 0.667;
          msg.rate = SPEECH.settings.rate;
          msg.pitch = SPEECH.settings.pitch;
          break;
        case "#":
          SPEECH.settings.pitch *= 1.5;
          msg.rate = SPEECH.settings.rate;
          msg.pitch = SPEECH.settings.pitch;
          break;
        default:
          msg.rate = SPEECH.settings.rate;
          msg.pitch = SPEECH.settings.pitch;
          break;
      }

      msg.onend = () => {
        i += 2;
        speakSentence();
      };
      speechSynthesis.speak(msg);
    }
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

const VOICE = {
  'Male': {
    voice: 0,
    setting: new VoiceSetting(0.75, 1.0, 1.0)
  },
  'Female': {
    voice: 1,
    setting: new VoiceSetting(0.75, 1.0, 1.0)
  },
  'MaleLowSlow': {
    voice: 0,
    setting: new VoiceSetting(0.75, 0.6, 1.0)
  },
  'FemHighQuick': {
    voice: 1,
    setting: new VoiceSetting(1.4, 2.0, 1.0)
  },
  'GlaDOS': {
    voice: 1,
    setting: new VoiceSetting(0.5, 0.9, 1.0)
  },
  'Princess': {
    voice: 6,
    setting: new VoiceSetting(1.2, 2.0, 1.0)
  },
  'GhostFace': {
    voice: 1,
    setting: new VoiceSetting(2.0, 0.0, 1.0)
  },
};
console.log(`%cSPEECH ${SPEECH.VERSION} loaded.`, SPEECH.CSS);