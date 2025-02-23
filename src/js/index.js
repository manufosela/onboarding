// Common
import './lib/common';

// Load Web components
import '@firebase-utils/firebase-loginbutton';
import '@firebase-utils/firebase-crud';

// Load libraries
import Reveal from 'reveal.js';
import { loadSlidesFromGoogleSheets } from './lib/loadslidesfromgooglesheets.js';

// import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
// import { controlPorAudio } from './lib/control_por_audio';
// import { selectCamera, startCamera } from './lib/video_stream';

let deck;
let dataNotLoaded = true;
let slides = [];

let fbCRUD;
let firebaseSigninReady = false;
let fbCRUDReady = false;

let user;
let displayName;
let email;
let photoURL;
let uid;

const primaryColor = 'hsl(186.67, 53.78%, 49.22%)';
const secundaryColor = 'hsl(187.00, 90.91%, 25.88%)';
const tertiaryColor = 'hsl(240.00, 0.78%, 25.29%)';

const spreadsheetId = '1I8orUVnLJ2ha3EEejVq8LAaEDHDfkUADHEHYFCZ7iE0';
const range = 'slides!A:D';

const useAudioControls = true;
const useCameraControls = false;

const TRANSITION = 'zoom'; // none/fade/slide/convex/concave/zoom
const TRANSITION_SPEED = 'default'; // default/fast/slow
const KEYBOARD = true;
const PLUGINS = []; // [Markdown];

/**
 * Asynchronously loads the audio control module if audio controls are enabled.
 * 
 * This function checks if the `useAudioControls` flag is set to true. If so, it dynamically imports
 * the `audiocontrol.js` module and starts the audio controls with the specified locale ('es-ES').
 * 
 * @async
 * @function loadAudioControlModule
 * @returns {Promise<void>} A promise that resolves when the audio control module is loaded and started.
 */
async function loadAudioControlModule() {
  if (useAudioControls) {
    const module = await import('./lib/audiocontrol.js');
    module.startAudioControls('es-ES');
    console.log('Audio controls loaded.');
  }
}

async function loadCameraControlModule() {
  if (useCameraControls) {
    const module = await import('./lib/cameracontrol.js');
    await module.startCameraControls();
    console.log('Camera controls loaded.');
  }
}

/**
 * Adjusts the behavior of the Reveal.js deck to handle custom navigation controls.
 * Specifically, it modifies the behavior of the down arrow key to move to the next
 * horizontal slide when the last vertical subslide is reached.
 *
 * @param {Object} deck - The Reveal.js deck instance.
 */
function fixRevealControls(deck) {
  document.addEventListener('keydown', (e) => {
    const { indexh, indexv } = deck.getIndices();
    const currentSlide = deck.getCurrentSlide();

    // Calcular el total de subslides en la sección actual
    const totalSubslides = currentSlide.parentElement.childElementCount - 1;

    // Detecta si se presionó la tecla hacia abajo
    if (e.key === 'ArrowDown') {
      // Si estamos en la última subslide, avanzar a la siguiente slide horizontal
      if (indexv === totalSubslides) {
        e.preventDefault(); // Previene el comportamiento por defecto
        deck.next(); // Avanza a la siguiente slide horizontal
      }
    }
  });
}

/**
 * Asynchronously loads and displays slides on the webpage.
 *
 * This function takes an array of slide objects, generates HTML content for the slides,
 * and updates the DOM to display the slides. It also initializes the Reveal.js presentation.
 *
 * @param {Array} slides - An array of slide objects. Each slide object should have the following properties:
 *   @param {string} slides[].title - The title of the slide.
 *   @param {string} [slides[].background] - The background image URL for the slide. If not provided, a default image is used.
 *   @param {string|Array} slides[].content - The content of the slide. It can be a string or an array of strings for subslides.
 *
 * @example
 * const slides = [
 *   {
 *     title: 'Slide 1',
 *     background: '/path/to/image.jpg',
 *     content: 'This is the content of slide 1'
 *   },
 *   {
 *     title: 'Slide 2',
 *     content: ['Subslide 1 content', 'Subslide 2 content']
 *   }
 * ];
 * loadSlides(slides);
 */
async function loadSlides(slides) {
  console.log(`Generando presentación con ${slides.length} slides principales con sus subslides.`);
  var titlesHTML = slides.map(function (item, index) {
    return `<li><a href="#/${index}">${item.title}</a></li>`;
  });
  document.querySelector('.asideTitles').innerHTML = /* html */`
    <details>
      <summary>Índice</summary>
      <ul>${titlesHTML.join('')}</ul>
    </details>
  `;

  document.querySelector('.asideTitles ul').addEventListener('click', (ev) => {
    if (ev.target.tagName === 'A') {
      ev.preventDefault();
      const index = ev.target.getAttribute('href').split('/')[1];
      deck.slide(index);
      document.querySelector('.asideTitles details').removeAttribute('open');
    }
  });

  document.querySelector('firebase-loginbutton').classList.add('hidden');
  document.querySelector('main').classList.remove('welcome');

  document.querySelector('main').innerHTML = /* html */`
    <div class="reveal">
      <div class="slides">
        ${slides.map((slide, slideIndex) => {
    return /* html */`
            <section
              data-background-gradient="linear-gradient(to bottom,${secundaryColor}, ${primaryColor})"
              data-background-image="${slide.background ?? '/assets/images/LeanMind_logo_with_slogan_bgtransparent.png'}"
              data-background-size="200px"
              data-background-position="top left">
              <h2>${slide.title}</h2>
              ${Array.isArray(slide.content) ? slide.content.map((content) => {
      return /* html */`
                  <section>${content}</section>`;
    }).join('') : slide.content}
            </section> `;
  }).join('')}
      </div> 
    </div>`;

  deck = new Reveal({
    controls: true,
    controlsTutorial: true,
    controlsLayout: 'bottom-right',
    controlsBackArrows: 'faded',
    progress: true,
    history: true,
    center: true,
    transition: TRANSITION,
    transitionSpeed: TRANSITION_SPEED,
    keyboard: KEYBOARD,
    plugins: PLUGINS
  });

  deck.initialize();

  fixRevealControls(deck);
  loadAudioControlModule();
  loadCameraControlModule();
}


async function loginReady() {
  // console.log('loginReady');
  if (fbCRUDReady && firebaseSigninReady && dataNotLoaded) {
    dataNotLoaded = false;
    deck = new Reveal();
    slides = await loadSlidesFromGoogleSheets(spreadsheetId, range);
    loadSlides(slides);
  }
}

document.addEventListener('wc-ready', (ev) => {
  if (ev.detail.id === 'login-button' && !firebaseSigninReady) {
    fbCRUD = document.createElement('firebase-crud');
    fbCRUD.setAttribute('id', 'firebasecrud');
    fbCRUD.setAttribute('reference-id', 'login-button');
    document.body.appendChild(fbCRUD);
  }
  if (ev.detail.id === 'firebasecrud' && !fbCRUDReady) {
    fbCRUDReady = true;
    setTimeout(() => { loginReady() }, 100);
  }
});

document.addEventListener('firebase-signin', (ev) => {
  if (firebaseSigninReady) {
    return;
  }
  // console.log('firebase-signin');
  firebaseSigninReady = true;
  user = ev.detail.user;
  loginReady();
});

document.addEventListener('firebase-signout', (ev) => {
  if (!firebaseSigninReady) {
    return;
  }
  // console.log('firebase-signout');
  firebaseSigninReady = false;
});

/* DOMContentLoaded function */
// document.addEventListener('DOMContentLoaded', init);