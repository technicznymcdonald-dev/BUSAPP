const socket = io();

const linesListEl = document.getElementById('lines-list');
const addForm = document.getElementById('add-line-form');
const newNumberInput = document.getElementById('new-number');
const newDestinationInput = document.getElementById('new-destination');
const clearBtn = document.getElementById('clear-btn');
const backBtn = document.getElementById('back-btn');
const canvas = document.getElementById('display-canvas');
const ctx = canvas.getContext('2d');

let currentLines = [];
let currentText = 'NIEAKTYWNY';

/* ===================== SILNIK MATRYCY PUNKTOWEJ ===================== */
/* Renderuje tekst jako siatkę okrągłych "diod" - tak jak w prawdziwym
   wyświetlaczu autobusowym. Dłuższy tekst przewija się w poziomie. */

const ROWS = 24;             // liczba wierszy kropek (więcej = mniejsze, gęściejsze kropki)
const FONT_SCALE = 0.72;     // rozmiar liter względem wysokości matrycy (mniejszy = mniejszy tekst)
const DOT_FILL_RATIO = 0.34; // promień kropki względem komórki (mniejszy = mniejsze kropki, więcej odstępu)
const SCROLL_SPEED = 22;     // "pikseli matrycy" na sekundę

const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');

let cols = 40;               // liczba kolumn widocznych na ekranie (przelicza się przy resize)
let textCols = 0;            // szerokość całego tekstu w kolumnach matrycy
let scrollOffset = 0;
let lastFrameTime = null;
let needsScroll = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  cols = Math.max(10, Math.round((rect.width / rect.height) * ROWS));
  rasterizeText(currentText);
}

function rasterizeText(text) {
  // Rysujemy tekst na małym, "niskorozdzielczym" canvasie - jedna
  // komórka = jeden potencjalny punkt świetlny.
  const fontSize = Math.max(4, Math.round(ROWS * FONT_SCALE));
  offCtx.font = `bold ${fontSize}px "Courier New", monospace`;
  const measured = offCtx.measureText(text || '').width;
  textCols = Math.max(cols, Math.ceil(measured) + 4);

  offCanvas.width = textCols;
  offCanvas.height = ROWS;

  offCtx.fillStyle = '#000';
  offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

  offCtx.font = `bold ${fontSize}px "Courier New", monospace`;
  offCtx.fillStyle = '#fff';
  offCtx.textBaseline = 'middle';
  offCtx.textAlign = 'left';

  const startX = textCols > cols ? 2 : Math.floor((cols - measured) / 2);
  offCtx.fillText(text || '', startX, ROWS / 2 + 1);

  needsScroll = textCols > cols;
  scrollOffset = 0;
  lastFrameTime = null;
}

function drawFrame(timestamp) {
  if (lastFrameTime === null) lastFrameTime = timestamp;
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (needsScroll) {
    scrollOffset += SCROLL_SPEED * dt;
    const wrapAt = textCols + 6; // mały odstęp przed powtórką
    if (scrollOffset >= wrapAt) scrollOffset -= wrapAt;
  }

  const data = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const dotW = w / cols;
  const dotH = h / ROWS;
  const radius = Math.min(dotW, dotH) * DOT_FILL_RATIO;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < cols; col++) {
      let sampleCol = col;
      if (needsScroll) {
        sampleCol = Math.floor(col + scrollOffset) % (textCols + 6);
      }

      let on = false;
      if (sampleCol < textCols) {
        const idx = (row * offCanvas.width + sampleCol) * 4;
        on = data[idx] > 80 && data[idx + 3] > 80;
      }

      const cx = col * dotW + dotW / 2;
      const cy = row * dotH + dotH / 2;

      ctx.beginPath();
      if (on) {
        ctx.fillStyle = '#ff9100';
        ctx.shadowColor = '#ff9100';
        ctx.shadowBlur = radius * 1.6;
      } else {
        ctx.fillStyle = '#231a10';
        ctx.shadowBlur = 0;
      }
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(drawFrame);
}

function setDisplayText(text) {
  currentText = text;
  rasterizeText(currentText);
}

window.addEventListener('resize', resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);
requestAnimationFrame(drawFrame);
resizeCanvas();

/* ===================== PANEL STEROWANIA / SYNC ===================== */

function renderLines() {
  linesListEl.innerHTML = '';
  currentLines.forEach((line, index) => {
    const btn = document.createElement('button');
    btn.className = 'line-btn';
    btn.innerHTML = `
      <span class="num">${escapeHtml(line.number)}</span>
      <span class="dest">${escapeHtml(line.destination)}</span>
      <button class="del" title="Usuń linię">✕</button>
    `;
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('del')) return;
      socket.emit('select-line', line);
    });
    btn.querySelector('.del').addEventListener('click', (e) => {
      e.stopPropagation();
      currentLines.splice(index, 1);
      saveLines();
    });
    linesListEl.appendChild(btn);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function saveLines() {
  fetch('/api/lines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentLines),
  });
}

socket.on('lines-updated', (lines) => {
  currentLines = lines;
  renderLines();
});

function enterFullscreen() {
  document.body.classList.add('fullscreen-mode');
  resizeCanvas();
}

function exitFullscreen() {
  document.body.classList.remove('fullscreen-mode');
  resizeCanvas();
}

socket.on('display-updated', (display) => {
  if (!display || !display.number) {
    setDisplayText('NIEAKTYWNY');
    exitFullscreen();
  } else {
    setDisplayText(`${display.number}  ${display.destination}`.toUpperCase());
    enterFullscreen();
  }
});

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const number = newNumberInput.value.trim();
  const destination = newDestinationInput.value.trim();
  if (!number || !destination) return;
  currentLines.push({ number, destination });
  saveLines();
  newNumberInput.value = '';
  newDestinationInput.value = '';
});

clearBtn.addEventListener('click', () => {
  socket.emit('clear-display');
});

backBtn.addEventListener('click', () => {
  exitFullscreen();
});
