// HOLD IT v1.0 — app.js

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const permScreen = document.getElementById('permission-screen');
const startBtn = document.getElementById('start-btn');
const errorMsg = document.getElementById('error-msg');
const hud = document.getElementById('hud');
const loading = document.getElementById('loading');
const hudStatus = document.getElementById('hud-status');
const handNumber = document.getElementById('hand-number');

let handsModel = null;
let camera = null;
let handCount = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function updateStatus(n) {
  handCount = n;
  handNumber.textContent = n;
  hudStatus.textContent = n === 0
    ? 'show your hands'
    : n === 1
    ? 'hand detected'
    : 'both hands detected';
}

function onResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks) {
    updateStatus(0);
    return;
  }

  const detected = results.multiHandLandmarks.length;
  updateStatus(detected);

  for (const landmarks of results.multiHandLandmarks) {
    // Draw connections
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: '#00ccff',
      lineWidth: 1.5
    });

    // Draw landmark dots
    drawLandmarks(ctx, landmarks, {
      color: '#00ff88',
      fillColor: '#00ff88',
      lineWidth: 0,
      radius: (data) => {
        // fingertips slightly bigger
        const tips = [4, 8, 12, 16, 20];
        return tips.includes(data.index) ? 5 : 3;
      }
    });
  }
}

async function startCamera() {
  loading.classList.add('active');
  permScreen.classList.add('hidden');

  try {
    handsModel = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsModel.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    });

    handsModel.onResults(onResults);

    camera = new Camera(video, {
      onFrame: async () => {
        await handsModel.send({ image: video });
      },
      width: 1280,
      height: 720,
      facingMode: 'user'
    });

    await camera.start();

    video.classList.add('active');
    hud.classList.add('active');
    loading.classList.remove('active');
    updateStatus(0);

  } catch (err) {
    loading.classList.remove('active');
    permScreen.classList.remove('hidden');
    errorMsg.style.display = 'block';

    if (err.name === 'NotAllowedError') {
      errorMsg.textContent = 'Camera access denied. Please allow camera and retry.';
    } else if (err.name === 'NotFoundError') {
      errorMsg.textContent = 'No camera found on this device.';
    } else {
      errorMsg.textContent = 'Something went wrong. Try refreshing.';
    }
    console.error('HOLD IT error:', err);
  }
}

startBtn.addEventListener('click', startCamera);
