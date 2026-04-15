const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readFile(name) {
  const file = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeFile(name, data) {
  const file = path.join(DATA_DIR, name + '.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ── Config (exportadoras + fincas) ──────────────────────────────────────
app.get('/api/config', (req, res) => {
  const data = readFile('config');
  res.json(data || { exportadoras: [] });
});

app.post('/api/config', (req, res) => {
  writeFile('config', req.body);
  res.json({ ok: true });
});

// ── Semanas ──────────────────────────────────────────────────────────────
app.get('/api/semanas', (req, res) => {
  const data = readFile('semanas');
  res.json(data || {});
});

app.post('/api/semanas', (req, res) => {
  writeFile('semanas', req.body);
  res.json({ ok: true });
});

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
