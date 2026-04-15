import express from "express";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = join(__dirname, "data");
const FINCAS_FILE = join(DATA_DIR, "fincas.json");
const TECNICOS_FILE = join(DATA_DIR, "tecnicos.json");
const CREDENTIALS_FILE = join(__dirname, "google-credentials.json");

// ID de tu Google Sheet (extraído de la URL)
const SPREADSHEET_ID = "1FvtccGpyIfQw0l3CeD0-WTdyJ5MN37dSx8osUbo2wIw";
const SHEET_NAME = "Registros";

// ── Configurar Google Sheets API ──
let sheets;
try {
  let credentials;
  if (process.env.GOOGLE_CREDENTIALS) {
    // En producción (Railway): leer desde variable de entorno
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } else {
    // En desarrollo local: leer desde archivo
    credentials = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8"));
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheets = google.sheets({ version: "v4", auth });
  console.log("✅ Google Sheets API conectada");
} catch (e) {
  console.error("❌ Error al conectar Google Sheets:", e.message);
}

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

// ── Leer contenedores desde Google Sheets ──
async function leerContenedores() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:L`, // Desde fila 2 (después de headers)
    });

    const rows = response.data.values || [];
    const contenedores = rows.map(row => ({
      id: row[0] || "",
      fecha: row[1] || "",
      semana: row[2] || "",
      dia: row[3] || "",
      zona: row[4] || "",
      exportadora: row[5] || "",
      fincas: row[6] ? row[6].split(", ") : [],
      planificado: parseFloat(row[7]) || 0,
      inspeccionado: row[8] ? parseFloat(row[8]) : null,
      tecnicos: row[9] ? row[9].split(", ") : [],
      motivo: row[10] || "",
      timestamp: row[11] || "",
    }));

    return contenedores;
  } catch (e) {
    console.error("Error leyendo Google Sheets:", e.message);
    return [];
  }
}

// ── Escribir contenedores a Google Sheets ──
async function escribirContenedores(contenedores) {
  try {
    // Convertir contenedores a formato de filas
    const rows = contenedores.map(c => [
      c.id,
      c.fecha,
      c.semana,
      c.dia,
      c.zona,
      c.exportadora,
      c.fincas.join(", "),
      c.planificado,
      c.inspeccionado !== null ? c.inspeccionado : "",
      c.tecnicos.join(", "),
      c.motivo || "",
      c.timestamp,
    ]);

    // Limpiar sheet y escribir todo de nuevo
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:L`,
    });

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: "RAW",
        resource: { values: rows },
      });
    }

    console.log(`✅ ${rows.length} registros guardados en Google Sheets`);
    return true;
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
  // Config se mantiene en archivos locales (fincas y técnicos)
  res.json({ ok: true, message: "Config no se guarda en Sheets" });
});

// ── API: Contenedores (desde Google Sheets) ──
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
});
