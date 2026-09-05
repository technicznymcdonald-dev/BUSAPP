const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const LINES_FILE = path.join(__dirname, 'lines.json');
const SOUNDMAP_FILE = path.join(__dirname, 'soundmap.json');
const SOUNDS_DIR = path.join(__dirname, 'public', 'sounds');

// Domyślna mapa dźwięków - używana tylko przy pierwszym uruchomieniu,
// jeśli soundmap.json jeszcze nie istnieje (żeby nic nie zniknęło).
const DEFAULT_SOUND_MAP = {
  "92_PODBÓRZ": [
    "sounds/poczatek_92_P.mp3",
    "sounds/92_Kollataja.mp3",
    "sounds/92_Niemcewicza.mp3",
    "sounds/92_dworzec_niebuszewo.mp3",
    "sounds/92_Krasinskiego.mp3",
    "sounds/92_chopina.mp3",
    "sounds/92_wiosny.mp3",
    "sounds/92_Podlesna.mp3",
    "sounds/92_ogrody.mp3",
    "sounds/92_junacka.mp3",
    "sounds/92_chozowksa.mp3",
    "sounds/92_osow.mp3",
    "sounds/92_andersebna.mp3",
    "sounds/92_Sudecka.mp3",
    "sounds/92_Wymarzona.mp3",
    "sounds/92_Podborz_koncowy.mp3",
    "sounds/92_Podborz.mp3"
  ],
  "92_KOŁŁATAJA": [
    "sounds/poczatek_92_K.mp3",
    "sounds/92_Podborz.mp3",
    "sounds/92_Wymarzona.mp3",
    "sounds/92_Sudecka.mp3",
    "sounds/92_andersebna.mp3",
    "sounds/92_osow.mp3",
    "sounds/92_chozowksa.mp3",
    "sounds/92_junacka.mp3",
    "sounds/92_ogrody.mp3",
    "sounds/92_Podlesna.mp3",
    "sounds/92_wiosny.mp3",
    "sounds/92_chopina.mp3",
    "sounds/92_Krasinskiego.mp3",
    "sounds/92_dworzec_niebuszewo.mp3",
    "sounds/92_Niemcewicza.mp3",
    "sounds/92_Kolataja_K.mp3",
    "sounds/92_Kollataja.mp3"
  ],
  "DEFAULT": [
    "sounds/braklini.mp3"
  ]
};

function loadLines() {
  try {
    return JSON.parse(fs.readFileSync(LINES_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLines(lines) {
  fs.writeFileSync(LINES_FILE, JSON.stringify(lines, null, 2), 'utf8');
}

function loadSoundMap() {
  try {
    return JSON.parse(fs.readFileSync(SOUNDMAP_FILE, 'utf8'));
  } catch (e) {
    // Plik jeszcze nie istnieje - tworzymy go z domyślną zawartością
    saveSoundMap(DEFAULT_SOUND_MAP);
    return DEFAULT_SOUND_MAP;
  }
}

function saveSoundMap(map) {
  fs.writeFileSync(SOUNDMAP_FILE, JSON.stringify(map, null, 2), 'utf8');
}

function listSoundFiles() {
  try {
    return fs.readdirSync(SOUNDS_DIR).filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f));
  } catch (e) {
    return [];
  }
}

// Aktualnie wyświetlana linia (dzielona przez wszystkie urządzenia)
let currentDisplay = { number: '', destination: '' };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/lines', (req, res) => {
  res.json(loadLines());
});

app.post('/api/lines', (req, res) => {
  const lines = req.body;
  if (!Array.isArray(lines)) {
    return res.status(400).json({ error: 'Oczekiwano tablicy linii' });
  }
  saveLines(lines);
  io.emit('lines-updated', lines);
  res.json({ ok: true });
});

app.get('/api/soundmap', (req, res) => {
  res.json(loadSoundMap());
});

app.post('/api/soundmap', (req, res) => {
  const map = req.body;
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return res.status(400).json({ error: 'Oczekiwano obiektu z mapą dźwięków' });
  }
  saveSoundMap(map);
  io.emit('soundmap-updated', map);
  res.json({ ok: true });
});

app.get('/api/sounds-files', (req, res) => {
  res.json(listSoundFiles());
});

app.get('/api/config', (req, res) => {
  res.json({ lines: loadLines(), soundMap: loadSoundMap() });
});

app.post('/api/config', (req, res) => {
  const { lines, soundMap } = req.body || {};
  if (!Array.isArray(lines) || !soundMap || typeof soundMap !== 'object') {
    return res.status(400).json({ error: 'Nieprawidłowy format konfiguracji' });
  }
  saveLines(lines);
  saveSoundMap(soundMap);
  io.emit('lines-updated', lines);
  io.emit('soundmap-updated', soundMap);
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  // Nowo podłączone urządzenie dostaje aktualny stan
  socket.emit('lines-updated', loadLines());
  socket.emit('display-updated', currentDisplay);
  socket.emit('soundmap-updated', loadSoundMap());

  socket.on('select-line', (line) => {
    if (!line || typeof line.number === 'undefined') return;
    currentDisplay = { number: line.number, destination: line.destination };
    io.emit('display-updated', currentDisplay);
  });

  socket.on('clear-display', () => {
    currentDisplay = { number: '', destination: '' };
    io.emit('display-updated', currentDisplay);
  });
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('=================================================');
  console.log('Serwer wystawiony na tablicę kierunkową autobusu.');
  console.log('Na KAŻDYM urządzeniu w tej samej sieci WiFi otwórz:');
  getLocalIPs().forEach((ip) => {
    console.log(`   http://${ip}:${PORT}`);
  });
  console.log('=================================================');
});
