const PERMITED_LANGUAGES = ['es-ES', 'en-US'];
const wordsControlKeys = {
  'es-ES': ['siguiente', 'anterior', 'avanza', 'retrocede', 'inicio'],
  'en-US': ['next', 'back', 'down', 'up', 'home']
}
const wordsControlActions = [
  { click: '.navigate-down' },
  { click: '.navigate-up' },
  { click: '.navigate-down' },
  { click: '.navigate-up' },
  { click: '.logoLM' }
];

/**
 * Creates an object from two arrays: one with keys and another with values.
 * @param {Array} keys - Array of keys for the object.
 * @param {Array} values - Array of values for the object.
 * @returns {Object} The resulting object with key-value pairs.
 */
function createObjectFromArrays(keys, values) {
  return keys.reduce((obj, key, index) => {
    obj[key] = values[index];
    return obj;
  }, {});
}

/**
 * Initializes audio controls for navigation based on the specified language.
 * If the provided language is not permitted, defaults to Spanish ('es-ES').
 *
 * @param {string} [_lang='es-ES'] - The language code for the audio controls. Defaults to 'es-ES'.
 * @returns {void}
 */
export function startAudioControls(_lang = 'es-ES') {
  const lang = PERMITED_LANGUAGES.includes(_lang)
    ? _lang
    : (() => {
      console.error('Language not permitted. Defaulting to Spanish.');
      return 'es-ES';
    })();
  const audioControls = createObjectFromArrays(wordsControlKeys[lang], wordsControlActions);
  voiceControl(audioControls, lang);
}

/**
 * Initializes and manages voice control for specified audio controls.
 *
 * @param {Object} audioControls - An object where keys are voice commands and values are actions to be performed.
 * @param {string} [lang='es-ES'] - The language for speech recognition. Defaults to 'es-ES'.
 *
 * @example
 * const audioControls = {
 *   'play': { click: '#playButton' },
 *   'pause': { click: '#pauseButton' }
 * };
 * voiceControl(audioControls, 'en-US');
 *
 * @returns {void}
 */
function voiceControl(audioControls, lang = 'es-ES') {
  const commands = Object.keys(audioControls);
  const recognition = new webkitSpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = true; // Para que siga escuchando incluso después de reconocer algo

  recognition.onresult = function (event) {
    const last = event.results.length - 1;
    const text = event.results[last][0].transcript.trim();

    commands.forEach((command) => {
      // console.log(text.toLowerCase(), command);
      if (text.toLowerCase() === command) {
        const action = audioControls[command];
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        let elementToClick = document.querySelector(action.click);
        if (action.click === '.navigate-down' && elementToClick.disabled) {
          elementToClick = document.querySelector('.navigate-right');
        }
        if (action.click === '.navigate-up' && elementToClick.disabled) {
          elementToClick = document.querySelector('.navigate-left');
        }
        elementToClick.dispatchEvent(event);
        console.log(command, action, event);
        recognition.stop();
      }
    });
  };

  recognition.onerror = function (event) {
    console.error('Voice Recognition Error: ', event.error);
  };

  recognition.onend = function () {
    console.log('Restarting Voice Recognition...');
    recognition.start();
  };

  recognition.start();
}
