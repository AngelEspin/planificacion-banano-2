import express from "express";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = join(__dirname, "data");
const FINCAS_FILE = join(DATA_DIR, "fincas.json");
const TECNICOS_FILE = join(DATA_DIR, "tecnicos.json");

// URL de tu Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby72YTvroCx71t7H7dSGeQ-D3FYZdGaXWAqEA3RCiq9BEpCjS1Est0ypBGPlH7NuD3-eg/exec";

function loadJSON(path, fallback = {}) {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading", path, e);
  }
  return fallback;
}

// ── Leer contenedores desde Google Sheets (Apps Script) ──
async function leerContenedores() {
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const data = await response.json();
    
    if (data.error) {
      console.error("Error desde Apps Script:", data.error);
      return [];
    }
    
    // Convertir datos del sheet al formato esperado
    const contenedores = (data.contenedores || []).map(c => ({
      id: c.ID || c.id || "",
      fecha: c.Fecha || c.fecha || "",
      semana: c.Semana || c.semana || "",
      dia: c.Día || c.dia || "",
      zona: c.Zona || c.zona || "",
      exportadora: c.Exportadora || c.exportadora || "",
      fincas: typeof c.Fincas === 'string' ? c.Fincas.split(', ') : (c.fincas || []),
      planificado: parseFloat(c.Planificado || c.planificado) || 0,
      inspeccionado: c.Inspeccionado || c.inspeccionado ? parseFloat(c.Inspeccionado || c.inspeccionado) : null,
      tecnicos: typeof c.Técnicos === 'string' ? c.Técnicos.split(', ') : (c.tecnicos || []),
      motivo: c.Motivo || c.motivo || "",
      timestamp: c.Timestamp || c.timestamp || "",
    }));
    
    console.log(`✅ Leídos ${contenedores.length} registros desde Google Sheets`);
    return contenedores;
  } catch (e) {
    console.error("Error leyendo Google Sheets:", e.message);
    return [];
  }
}

// ── Escribir contenedores a Google Sheets (Apps Script) ──
async function escribirContenedores(contenedores) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenedores }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ ${contenedores.length} registros guardados en Google Sheets`);
      return true;
    } else {
      console.error("Error desde Apps Script:", result.error);
      return false;
    }
  } catch (e) {
    console.error("Error escribiendo en Google Sheets:", e.message);
    return false;
  }
}

// ── API: Config (fincas + técnicos) ──
app.get("/api/config", (req, res) => {
  const fincas = loadJSON(FINCAS_FILE, {});
  const tecnicos = loadJSON(TECNICOS_FILE, []);
  const zonas = Object.keys(fincas);
  res.json({ zonas, fincas, tecnicos });
});

app.post("/api/config", (req, res) => {
  res.json({ ok: true, message: "Config no se guarda en Sheets" });
});

// ── API: Contenedores (desde Google Sheets via Apps Script) ──
app.get("/api/contenedores", async (req, res) => {
  const contenedores = await leerContenedores();
  res.json({ contenedores });
});

app.post("/api/contenedores", async (req, res) => {
  const { contenedores } = req.body;
  const ok = await escribirContenedores(contenedores);
  res.json({ ok });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Servidor corriendo en puerto", port);
  console.log("📊 Conectado a Google Sheets via Apps Script");
});
