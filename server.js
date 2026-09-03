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

io.on('connection', (socket) => {
  // Nowo podłączone urządzenie dostaje aktualny stan
  socket.emit('lines-updated', loadLines());
  socket.emit('display-updated', currentDisplay);

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
