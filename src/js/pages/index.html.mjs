import data from '../../json/index.json.js'; /* FUENTE DE DATOS JSON */
import { CommonTpl } from './common.html.mjs';

CommonTpl.detectLanguage();
const lang = CommonTpl.LANG;

const pageData = data.index[lang];
const slides = data.index.slides;


const HTMLbody = /* html */`
  <firebase-loginbutton 
    id="login-button"
    api-key="AIzaSyATC0JHeXiD3jKjizKmHCVJIso9662s8XI"
    domain = "onboarding-leanmind"
    messaging-sender-id = "234858706751",
    app-id = "1:234858706751:web:8b28dc00ddb84d7da7058a"
    zone = "europe-west1"
    show-email>
  </firebase-loginbutton>
  <main class="welcome">
    <img class="bienvenido" src="/assets/images/LeanMind_logo_with_slogan_bgtransparent.png" alt="Lean Mind logo" class="logo" />
    <h1 class="bienvenido">${pageData.header.title}</h1>
    <img class="tenerifelm" src="${pageData.header.tenerife}" alt="Tenerife Lean Mind" />
  </main>
  <aside class="asideTitles"></aside>

  <map name="logoLM">
    <area class="logoLM" shape="rect" coords="0,0,200,200" href="/" alt="Onboarding de Lean Mind">
  </map>
`;

document.body.innerHTML = /* HTML */`${HTMLbody}`;