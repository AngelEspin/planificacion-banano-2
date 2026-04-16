import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static("public"));

// ── URLs de Apps Script ────────────────────────────────────────────────────────
// Contenedores (planificaciones): Apps Script anterior
const CONTENEDORES_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby72YTvroCx71t7H7dSGeQ-D3FYZdGaXWAqEA3RCiq9BEpCjS1Est0ypBGPlH7NuD3-eg/exec";

// Fincas + Técnicos: nuevo Apps Script enlazado a los sheets
const CONFIG_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwOW0mHlIIUjdyCYWOm1DPVruqmWtsif47fxKrim2Mgb1FETihtCgxc3aU_tsVHiegY/exec";

// ── Cache de config (evita llamar a Sheets en cada clic) ──────────────────────
let _configCache     = null;
let _configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ── Helpers para llamar al Apps Script de config ──────────────────────────────
async function sheetsGet(params = {}) {
  const url = new URL(CONFIG_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { redirect: "follow" });
  return r.json();
}

async function sheetsPost(body) {
  // Apps Script /exec acepta POST directo, pero si redirige cambia a GET.
  // Workaround: detectamos redirect manual y reintentamos en la URL final.
  const r = await fetch(CONFIG_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",           // no seguir automáticamente
  });

  // Si responde directo (200) lo leemos
  if (r.status === 200) return r.json();

  // Si hay redirect (302/301), Google nos da la URL final → POST ahí
  if (r.status === 302 || r.status === 301) {
    const finalUrl = r.headers.get("location");
    if (finalUrl) {
      const r2 = await fetch(finalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        redirect: "follow",
      });
      return r2.json();
    }
  }

  // Fallback: leer lo que haya
  return r.json();
}

// ── API: Config — fincas + técnicos desde Google Sheets ──────────────────────
app.get("/api/config", async (req, res) => {
  const now = Date.now();

  // Devolver desde cache si está fresco
  if (_configCache && (now - _configCacheTime) < CONFIG_CACHE_TTL) {
    return res.json(_configCache);
  }

  try {
    const data = await sheetsGet({ action: "getConfig" });
    if (data.error) throw new Error(data.error);
    _configCache     = data;
    _configCacheTime = now;
    res.json(data);
  } catch (e) {
    console.error("Error obteniendo config desde Sheets:", e.message);
    // Si el cache está obsoleto, mejor devolverlo que nada
    if (_configCache) return res.json(_configCache);
    res.status(500).json({ error: "No se pudo cargar la configuración: " + e.message });
  }
});

app.post("/api/config", async (req, res) => {
  _configCache = null; // Invalidar cache al escribir
  try {
    const { fincas, tecnicos } = req.body;
    const result = await sheetsPost({ action: "saveConfig", fincas, tecnicos });
    res.json(result);
  } catch (e) {
    console.error("Error guardando config en Sheets:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── API: Contenedores (Apps Script anterior) ──────────────────────────────────
async function leerContenedores() {
  try {
    const r    = await fetch(CONTENEDORES_SCRIPT_URL);
    const data = await r.json();
    if (data.error) { console.error("Apps Script contenedores:", data.error); return []; }
    return (data.contenedores || []).map(c => ({
      id:           c.ID           || c.id           || "",
      fecha:        c.Fecha        || c.fecha        || "",
      semana:       c.Semana       || c.semana       || "",
      dia:          c.Día          || c.dia          || "",
      zona:         c.Zona         || c.zona         || "",
      exportadora:  c.Exportadora  || c.exportadora  || "",
      fincas:       typeof c.Fincas    === "string" ? c.Fincas.split(", ")    : (c.fincas    || []),
      tecnicos:     typeof c.Técnicos  === "string" ? c.Técnicos.split(", ")  : (c.tecnicos  || []),
      planificado:  parseFloat(c.Planificado  || c.planificado)  || 0,
      inspeccionado: (c.Inspeccionado || c.inspeccionado) != null
        ? parseFloat(c.Inspeccionado || c.inspeccionado) : null,
      motivo:       c.Motivo    || c.motivo    || "",
      problema:     c.Problema   || c.problema   || "",
      resolucion:   c.Resolucion || c.resolucion || "",
      problemaResuelto: (c.ProblemaResuelto || c.problemaResuelto) === true
        || String(c.ProblemaResuelto || c.problemaResuelto).toLowerCase() === "true",
      timestamp:    c.Timestamp || c.timestamp || "",
    }));
  } catch (e) {
    console.error("Error leyendo contenedores:", e.message);
    return [];
  }
}

async function escribirContenedores(contenedores) {
  try {
    const r = await fetch(CONTENEDORES_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ contenedores }),
    });
    const result = await r.json();
    if (!result.ok) console.error("Apps Script contenedores error:", result.error);
    return result.ok;
  } catch (e) {
    console.error("Error escribiendo contenedores:", e.message);
    return false;
  }
}

app.get("/api/contenedores", async (req, res) => {
  const contenedores = await leerContenedores();
  res.json({ contenedores });
});

app.post("/api/contenedores", async (req, res) => {
  const { contenedores } = req.body;
  const ok = await escribirContenedores(contenedores);
  res.json({ ok });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.status(200).send("OK"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Servidor en puerto", port);
  console.log("📊 Config → Google Sheets (fincas + técnicos)");
  console.log("📦 Contenedores → Google Sheets (planificaciones)");
});
