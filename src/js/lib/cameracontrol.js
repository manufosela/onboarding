const videoControls = {
  'next': {
    click: '.navigate-down'
  },
  'back': {
    click: '.navigate-up'
  }
};

export async function startCameraControls() {
  const cameraId = await selectCamera();
  startCamera(cameraId, videoControls);
}

export async function startCamera(cameraId, videoControls) {
  if (cameraId === null) return;
  const videoElement = document.createElement('video');
  videoElement.setAttribute('id', 'video');
  videoElement.setAttribute('autoplay', '');
  videoElement.setAttribute('muted', '');
  videoElement.setAttribute('playsinline', '');
  videoElement.classList.add('camera');
  document.body.appendChild(videoElement);
  const canvasElement = document.createElement('canvas');
  canvasElement.setAttribute('id', 'canvas');
  canvasElement.classList.add('canvas');
  document.body.appendChild(canvasElement);

  try {
    const constraints = {
      video: { deviceId: cameraId ? { exact: cameraId } : undefined }
    };
    // console.log(cameraId);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoElement = document.querySelector('video');
    videoElement.srcObject = stream;

    await new Promise((resolve) => video.onloadedmetadata = () => {
      // Establece las dimensiones del canvas de acuerdo a las del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve();
    });
    await drawFrame(videoControls);
  } catch (error) {
    console.error('Error accessing the camera', error);
  }
}

async function drawFrame(videoControls) {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  const model = await handpose.load(modelParams);
  detect(model, video, context, videoControls);
}

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error listing the devices', error);
    return [];
  }
}

export async function selectCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    if (videoDevices.length === 0) {
      throw 'No cameras found.';
    }
    let promptMessage = 'Select a camera:\n';
    videoDevices.forEach((device, index) => {
      promptMessage += `${index}: ${device.label || `Camera ${index}`}\n`;
    });
    promptMessage += `${videoDevices.length}: Sin cámara`;
    let selectedIndex = prompt(promptMessage, '0');
    selectedIndex = parseInt(selectedIndex, 10);
    if (selectedIndex === videoDevices.length) {
      console.log('No camera selected.');
      return null;
    } else if (selectedIndex < 0 || selectedIndex >= videoDevices.length) {
      throw 'Invalid camera selection.';
    }
    return videoDevices[selectedIndex].deviceId;
  } catch (error) {
    console.error('Error selecting the camera', error);
    return null;
  }
}


const modelParams = {
  flipHorizontal: true,   // flip e.g for video 
  maxNumBoxes: 20,        // maximum number of boxes to detect
  iouThreshold: 0.5,      // ioU threshold for non-max suppression
  scoreThreshold: 0.6,    // confidence threshold for predictions.
}

async function __detect(model, video, ctx) {
  const predictions = await model.estimateHands(video);
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;


  ctx.clearRect(0, 0, videoWidth, videoHeight);

  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      // Dibuja las predicciones en el canvas
      const keypoints = predictions[i].landmarks;

      // Dibuja los puntos clave
      for (let j = 0; j < keypoints.length; j++) {
        const [x, y] = keypoints[j];
        drawPoint(ctx, x, y, 5, 'red');
      }
    }
  }
  requestAnimationFrame(() => detect(model, video, ctx));
}

let lastXPosition = null;
let moveThreshold = 20;
let coolDownPeriod = 1000;
let canDetectMove = true;

async function detect(model, video, ctx, videoControls) {
  const predictions = await model.estimateHands(video);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].landmarks;
    const [x, y] = keypoints[9]; // Punto de referencia

    // Dibuja los puntos clave de la mano
    keypoints.forEach(([x, y]) => {
      drawPoint(ctx, x, y, 5, 'red');
    });

    if (canDetectMove && lastXPosition !== null) {
      const xMove = x - lastXPosition; // Distancia movida en el eje X

      if (xMove > moveThreshold) {
        console.log('Next slide');
        triggerMoveEvent(videoControls['next']);
      } else if (xMove < -moveThreshold) {
        console.log('Back slide');
        triggerMoveEvent(videoControls['back']);
      }
    }
    lastXPosition = x;
  } else {
    lastXPosition = null;
  }

  requestAnimationFrame(() => detect(model, video, ctx, videoControls));
}

function triggerMoveEvent(action) {
  let elementToClick = document.querySelector(action.click);

  // Verificar si el botón de navegación está disponible
  if (!elementToClick || elementToClick.disabled) {
    if (action.click === '.navigate-down') {
      // Si no hay más subslides hacia abajo, intenta moverse hacia la derecha
      elementToClick = document.querySelector('.navigate-right');
    } else if (action.click === '.navigate-up') {
      // Si no hay más subslides hacia arriba, intenta moverse hacia la izquierda
      elementToClick = document.querySelector('.navigate-left');
    }
  }

  // Disparar el evento solo si el elemento está disponible
  if (elementToClick) {
    const evento = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    elementToClick.dispatchEvent(evento);
    console.log(`Acción disparada: ${action.click}`, evento);
  }

  // Activar periodo de espera para evitar movimientos continuos
  canDetectMove = false;
  setTimeout(() => {
    canDetectMove = true;
  }, coolDownPeriod);
}



function drawPoint(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

