import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = join(__dirname, "data");
const FINCAS_FILE = join(DATA_DIR, "fincas.json");
const TECNICOS_FILE = join(DATA_DIR, "tecnicos.json");
const CONTENEDORES_FILE = join(DATA_DIR, "contenedores.json");

// Datos embebidos
const FINCAS_DEFAULT = {
  "Zona 1 - El Oro": {
    "PALMAR": ["Calichana", "Santa Clara", "Don Euclides", "Morella 1", "Morella 2", "Doña Jenny", "Jorge Edward", "Jenny Judith", "Daniel Alejandro", "Darwin Andres 2", "Xavier Euclides", "Isaias"],
    "INTERBANANA": ["Center", "María Enriqueta", "Tranquilidad"],
    "DUREXPORTA": ["Tadura", "San Fernando", "San Gabriel", "San Jose", "Krapp"],
    "LATBIO": ["Cancha", "Santa Rosa", "Tendales", "Cascadas", "Voluntad de Dios", "Abril", "Agrilugo", "Tenguel", "Chombo", "Florida", "Balao"],
    "BAGATOCORP": ["Chalacal", "El Porvenir", "San Cristobal"],
    "MARPLANTIS": ["Matanegro", "Zobeida", "Maria Ines", "Techo Rojo", "Agroitalia", "San Jorge"],
    "ECUAGREENPRODEX": ["Nueva Esperanza", "Santo Domingo", "La Serrano", "Victoria 2", "Delia Maria", "Victoria 1"],
    "NOBOA": ["Porvenir", "Tomatal", "Lote Paladines"]
  },
  "Zona 2 - Guayas Sur": {
    "FRUTADELI": ["Doña Mirian", "Rosita", "La Armonia", "Nancy", "San Juan", "Clemencia", "San German 1", "San German 2", "Maria Esperanza", "San German", "Alejandra", "San Jose", "San Antonio", "Oro Verde", "La Maravilla", "El Porvenir", "Banamar La Gaby", "San Felipe", "Enmita del Rocio", "Sarita 1", "La Florida", "Don Fede", "Las Palmas"],
    "LYRA EXPORT": ["Alejandra", "Alberto Joaquin", "Leonardo", "San Alberto", "San Alberto 2", "San Antonio", "Margarita", "Thomas", "Eva Maria", "Maria Gracia", "Delia Grace", "Benjamin 1", "Benjamin 2"],
    "COMERSUR": ["Dioselina", "Rancho Leathed", "Bella Isla", "San Jorge", "San Jose", "Juan Jose", "San Juan", "Maria Isabel", "Lorenita", "San Henrique", "El Tesoro", "Emma Violeta", "Sitio Nuevo", "Kadima"],
    "NOBOA": ["Agrosabana", "San Antonio", "Cisne", "San Fermin"],
    "MENDOEXPORT": ["Angela Beatriz", "Lourdez Verónica", "Andrea", "Timbirin", "Andreina", "Bellavista", "La Aurora", "Santa Isabel", "Luciana", "Teresita", "Ilinka Tamara"]
  },
  "Zona 3 - Guayas Este": {
    "FRESKBANA": ["El Carmen", "San Luis", "Porvenir", "Diamante"],
    "GREEN EXPRESS": ["Henrry Orozco", "Wilfrido Leon", "Nicola Falconi", "Juan Vicuña", "Asoprobaly"],
    "MENDOEXPORT": ["Fortaleza", "San Lorenzo", "GDios 2"],
    "PIÑAS RICAS": ["Don Víctor", "La Gaby", "Valeria", "La Toquilla", "Banamar", "La Ricosa", "Ramizan", "Napoles"],
    "DUREXPORTA": ["Venecia", "Gabriela", "Zaragoza"],
    "JORCORP": ["San Luis", "Miraflores"],
    "TUCHOK": ["Renata", "Carlita", "Cindia", "Las Garzas"]
  },
  "Zona 4 - Los Rios Norte": {
    "SUMIFRUT": ["San Marcos 1", "San Luís", "Carolina", "Soledad", "San Marcos 2", "La Suerte 1", "La Suerte 2", "Triple A", "Manos de Dios", "Maria Fernanda", "Sigal", "Clemencia", "Doña Luisa", "Claudia Maria", "Doña Laura", "Mercedes"],
    "FRESKBANA": ["El Carmen", "Isabella 2", "Diamante", "La Gema", "Isabella 1", "San Luis", "Naranjo Chico", "San Eduardo 1", "Guayabo 2", "Guayabo 3", "Princesa Banana 1", "Princesa Banana 4", "Santa Teresita 2"],
    "MENDOEXPORT": ["Mathias", "Maria Maria", "No Lo Pensé 1", "Juana de Oro", "Desbroce", "Inmaculada 1", "Inmaculada 2", "Inmaculada 4", "Sitio Nuevo", "Inmaculada 3", "Constancia", "Jota Jota", "La Virgen", "La Nola 1", "Alejandro Alberto", "Banpal", "JJ", "Jota Jota 1", "Transval 2", "Transval 1"],
    "JORCORP": ["Primor", "Ciruelo", "Margarita", "Rosa Andrea", "Victoria de Chapulo 2", "Victoria Chapulo 3", "Playa Grande", "La Clara", "Laurita", "Jota Jota", "San Jacinto", "Buena Esperanza", "Pepita", "Maria Isabel", "Despertar", "Achotillo", "La Ruth", "Don Enrique"]
  },
  "Zona 5 - Los Rios Sur": {
    "FRESKBANA": ["El Carmen", "Isabella 2", "Diamante", "La Gema", "Isabella 1", "San Luis"],
    "LUDERSON": ["San Sebastián"],
    "MENDOEXPORT": ["Mathias", "Maria Maria", "No Lo Pensé 1", "Juana de Oro"],
    "JORCORP": ["Toñito", "Rosita", "Margarita", "San Luis", "Rosa Andrea", "Victoria de Chapulo 2", "Carmela/Ciruelo 2", "Don Eloy", "Paraíso 1", "Laurita"],
    "PALMAR": ["Isla", "Cerro Gusano", "Cordones", "Diamante", "Regalito", "Rancho Grande", "Vinceña"],
    "DUREXPORTA": ["San Miguel", "Victoria 2", "Victoria 3", "La Clara", "D'Roma", "Carmela", "Ciruelo 1", "Zaragoza", "Playa Grande", "Reversa", "Las Palma"]
  }
};

const TECNICOS_DEFAULT = [
  "LUIS GERMAN GARCIA CEVALLOS", "WALTER LEONARDO CONTRERAS BOBADILLA", "DARWIN JOSE RIZO LOPEZ",
  "BRYAN ALEXANDER GALARZA GUERRERO", "CHRISTOPHER MAURICIO CORTEZ MERA", "ANGEL ABIUD MUÑOZ ARIAS",
  "JERRY SIMON ARREAGA CARRILLO", "RENY ANTHONY ZUÑIGA BERREZUETA", "ALEX DI GANG WU TORRES",
  "JORDY AARON AGUILAR GONZALEZ", "GUSTAVO ADOLFO GARCIA QUICHIMBO", "HUGO XAVIER CALDERON AYALA",
  "MILTON PATRICIO FERNANDEZ COELLO", "JAIME ANDRES RENDON ANCHUNDIA", "FABIAN ENRIQUE MONTIEL BRAVO",
  "LUIS ANDERSON MORA GALARZA", "EDISON FABIAN GUAMANGATE CASILLAS", "DANNY DAVID DUMAGUALA ARTEAGA",
  "RICHARD SEBASTIAN GARCIA ESPINOZA", "LEANDRO STALIN FIGUEROA ORBE", "LUIS ARMANDO PEREZ ALVARADO",
  "LUIS FERNANDO LITARDO GARCES", "JEFFERSON LENIN BONE CHILA", "FERNANDO JOSE DURAN GUERRERO",
  "HOLGER FERNANDO SANCHEZ PEÑA", "ALEXY LEONEL MUÑOZ COELLO", "DALEMBER ARIEL MURILLO AGILA",
  "JACKSON GRISMALDO MOLINA VERA", "LUIS ANGEL ARGUELLO ROMERO", "BYRON KEVIN PARRALES LASSO",
  "BRYAN ANDRES ARMIJOS ROMERO", "ELVIS NICOLA FAJARDO CHAGUAY", "ESTIVEN ERNESTO SANTILLAN BRICIO",
  "JONATHAN ARGENIS SERNA ACOSTA", "HERMES DARWIN GAVILANES MACIAS", "ROGER DYLAN LOPEZ MARQUEZ",
  "MISAEL PAUL RIVERA CONTRERAS", "EDGAR MAURICIO VILLON PALMA", "JEAN CARLOS GARRIDO QUINTERO",
  "PEDRO PAUL PONGUILLO AYALA", "MANUEL STEVEN REYES RODRIGUEZ", "JESUS ANDRES BOSQUEZ BOSQUEZ",
  "PERFECTO HOMERO CHICA PEREZ", "NIXON JOSUE REYES YEPEZ", "MARCOS IVAN SANCHEZ LEON",
  "BIALLO ALEXIS MIRANDA ROBLES", "RODERICK ORLEY CADENA DELGADO", "MARLON ALEXI ALAVA DELGADO",
  "LUIS FERNANDO LLIVICURA SALAZAR"
];

// Crear carpeta data si no existe
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

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

function saveJSON(path, data) {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving", path, e);
    return false;
  }
}


// ── API: Config (fincas + técnicos) ──
app.get("/api/config", (req, res) => {
  const fincas = loadJSON(FINCAS_FILE, FINCAS_DEFAULT);
  const tecnicos = loadJSON(TECNICOS_FILE, TECNICOS_DEFAULT);
  const zonas = Object.keys(fincas);
  
  res.json({ zonas, fincas, tecnicos });
});

app.post("/api/config", (req, res) => {
  const { fincas, tecnicos } = req.body;
  if (fincas) saveJSON(FINCAS_FILE, fincas);
  if (tecnicos) saveJSON(TECNICOS_FILE, tecnicos);
  res.json({ ok: true });
});

// ── API: Contenedores ──
app.get("/api/contenedores", (req, res) => {
  const data = loadJSON(CONTENEDORES_FILE, { contenedores: [] });
  res.json(data);
});

app.post("/api/contenedores", (req, res) => {
  const ok = saveJSON(CONTENEDORES_FILE, req.body);
  res.json({ ok });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Servidor corriendo en puerto", port);
});
