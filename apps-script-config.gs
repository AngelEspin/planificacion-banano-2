/**
 * Apps Script para leer/escribir configuración de Fincas y Técnicos
 * Este script debe estar enlazado a tu Google Sheet
 * 
 * ESTRUCTURA DEL SHEET:
 * - Hoja "Fincas": Columnas [Zona | Exportadora | Finca]
 * - Hoja "Tecnicos": Columna [Nombre]
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getConfig') {
    return getConfig();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Acción no válida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'saveConfig') {
      return saveConfig(data.fincas, data.tecnicos);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Acción no válida' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Lee la configuración desde Google Sheets
 */
function getConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ── Leer Fincas ──
    const fincasSheet = ss.getSheetByName('Fincas');
    if (!fincasSheet) {
      throw new Error('No se encontró la hoja "Fincas"');
    }
    
    const fincasData = fincasSheet.getDataRange().getValues();
    const fincas = {};
    const zonas = new Set();
    
    // Saltar header (fila 0)
    for (let i = 1; i < fincasData.length; i++) {
      const [zona, exportadora, finca] = fincasData[i];
      
      // Saltar filas vacías
      if (!zona || !exportadora) continue;
      
      const zonaStr = zona.toString().trim();
      const exportadoraStr = exportadora.toString().trim();
      const fincaStr = finca ? finca.toString().trim() : '';
      
      zonas.add(zonaStr);
      
      // Inicializar estructura
      if (!fincas[zonaStr]) {
        fincas[zonaStr] = {};
      }
      if (!fincas[zonaStr][exportadoraStr]) {
        fincas[zonaStr][exportadoraStr] = [];
      }
      
      // Agregar finca si no está vacía y no existe
      if (fincaStr && !fincas[zonaStr][exportadoraStr].includes(fincaStr)) {
        fincas[zonaStr][exportadoraStr].push(fincaStr);
      }
    }
    
    // ── Leer Técnicos ──
    const tecnicosSheet = ss.getSheetByName('Tecnicos');
    if (!tecnicosSheet) {
      throw new Error('No se encontró la hoja "Tecnicos"');
    }
    
    const tecnicosData = tecnicosSheet.getDataRange().getValues();
    const tecnicos = [];
    
    // Saltar header (fila 0)
    for (let i = 1; i < tecnicosData.length; i++) {
      const nombre = tecnicosData[i][0];
      if (nombre && nombre.toString().trim()) {
        const nombreStr = nombre.toString().trim().toUpperCase();
        if (!tecnicos.includes(nombreStr)) {
          tecnicos.push(nombreStr);
        }
      }
    }
    
    const result = {
      zonas: Array.from(zonas).sort(),
      fincas: fincas,
      tecnicos: tecnicos.sort()
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Guarda la configuración en Google Sheets
 */
function saveConfig(fincas, tecnicos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ── Guardar Fincas ──
    const fincasSheet = ss.getSheetByName('Fincas');
    if (!fincasSheet) {
      throw new Error('No se encontró la hoja "Fincas"');
    }
    
    // Limpiar contenido (excepto header)
    const lastRow = fincasSheet.getLastRow();
    if (lastRow > 1) {
      fincasSheet.getRange(2, 1, lastRow - 1, 3).clearContent();
    }
    
    // Escribir datos
    const fincasArray = [];
    Object.keys(fincas).sort().forEach(zona => {
      Object.keys(fincas[zona]).sort().forEach(exportadora => {
        const fincasList = fincas[zona][exportadora];
        if (fincasList.length === 0) {
          // Si no hay fincas, agregar una fila con exportadora vacía
          fincasArray.push([zona, exportadora, '']);
        } else {
          fincasList.forEach(finca => {
            fincasArray.push([zona, exportadora, finca]);
          });
        }
      });
    });
    
    if (fincasArray.length > 0) {
      fincasSheet.getRange(2, 1, fincasArray.length, 3).setValues(fincasArray);
    }
    
    // ── Guardar Técnicos ──
    const tecnicosSheet = ss.getSheetByName('Tecnicos');
    if (!tecnicosSheet) {
      throw new Error('No se encontró la hoja "Tecnicos"');
    }
    
    // Limpiar contenido (excepto header)
    const lastRowTec = tecnicosSheet.getLastRow();
    if (lastRowTec > 1) {
      tecnicosSheet.getRange(2, 1, lastRowTec - 1, 1).clearContent();
    }
    
    // Escribir datos
    const tecnicosArray = tecnicos.sort().map(t => [t]);
    if (tecnicosArray.length > 0) {
      tecnicosSheet.getRange(2, 1, tecnicosArray.length, 1).setValues(tecnicosArray);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
