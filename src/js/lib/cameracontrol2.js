import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';

let detector;
let canDetectMove = true;
const coolDownPeriod = 2000; // Cooldown de 2 segundos entre acciones

const videoControls = {
  next: { click: '.navigate-down' },
  back: { click: '.navigate-up' },
};

// Configuración e inicialización del detector de manos
async function createDetector() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', // Usar CDN aquí
  };
  const detector = await handPoseDetection.createDetector(model, detectorConfig);
  return detector;
}

createDetector().then(detector => {
  console.log('Detector creado:', detector);
  // Aquí continúa tu lógica de detección
});

// Iniciar el video y la detección
async function startCameraControls() {
  const videoElement = document.createElement('video');
  videoElement.setAttribute('autoplay', true);
  videoElement.setAttribute('muted', true);
  videoElement.setAttribute('playsinline', true);
  document.body.appendChild(videoElement);

  await createDetector();

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = stream;

  videoElement.addEventListener('loadeddata', () => {
    detectHands(videoElement);
  });
}

// Detecta las manos en el video
async function detectHands(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  async function detectFrame() {
    const hands = await detector.estimateHands(video);

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar las manos detectadas
    hands.forEach(hand => {
      hand.keypoints.forEach(point => {
        drawPoint(ctx, point.x, point.y, 5, 'red');
      });
    });

    // Acciones basadas en el número de manos detectadas
    if (canDetectMove) {
      if (hands.length === 1) {
        console.log("Una mano detectada: avanzando");
        triggerMoveEvent(videoControls.next);
      } else if (hands.length === 2) {
        console.log("Dos manos detectadas: retrocediendo");
        triggerMoveEvent(videoControls.back);
      }
    }

    requestAnimationFrame(detectFrame);
  }

  detectFrame();
}

// Función para dibujar puntos clave en el canvas
function drawPoint(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

// Función para activar la acción de avance o retroceso
function triggerMoveEvent(action) {
  if (action) {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    let elementToClick = document.querySelector(action.click);
    if (action.click === ".navigate-down" && (!elementToClick || elementToClick.disabled)) {
      elementToClick = document.querySelector(".navigate-right");
    }
    if (action.click === ".navigate-up" && (!elementToClick || elementToClick.disabled)) {
      elementToClick = document.querySelector(".navigate-left");
    }
    if (elementToClick) {
      elementToClick.dispatchEvent(event);
      console.log(`Acción disparada: ${action.click}`, event);
    }
  }

  // Activar cooldown para evitar múltiples activaciones
  canDetectMove = false;
  setTimeout(() => {
    canDetectMove = true;
  }, coolDownPeriod);
}
