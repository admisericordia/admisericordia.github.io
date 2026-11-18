/**
 * =========================================================================
 * 🔄 SINCRONIZADOR EN TIEMPO REAL: GOOGLE SHEETS ➔ SUPABASE
 * =========================================================================
 * Monitorea y sincroniza en segundo plano cualquier modificación realizada
 * directamente por los docentes en las hojas de cálculo de Google Sheets hacia Supabase.
 *
 * USO:
 *   node sync-sheets-watcher.js             # Modo daemon continuo (revisa cada 60s)
 *   node sync-sheets-watcher.js --once      # Ejecuta una sola pasada de sincronización y sale
 *   node sync-sheets-watcher.js --status    # Muestra el estado actual y fecha de último barrido
 *   node sync-sheets-watcher.js --stop      # KILL-SWITCH: Cancela definitivamente la sincronización (Pase a producción)
 *   node sync-sheets-watcher.js --start     # Reactiva el sincronizador
 *   node sync-sheets-watcher.js --course=ID # Sincroniza una planilla específica
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ehtezblqbttaxyyudzyy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodGV6YmxxYnR0YXh5eXVkenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDM4MjAsImV4cCI6MjEwNzQ3OTgyMH0.nqcJwBPHmr5q3Ng8bcEVnsop5-wvdAVpBagcqZVx3R8';

const APPS_SCRIPT_URLS = [
  "https://script.google.com/macros/s/AKfycbyAjxyFWJZTIqvYo2bfq1vNDlEaIMHrqo9Zqb96SnRHy4WWJrIa7XeUsIlDwo0N-JuZYA/exec",
  "https://script.google.com/macros/s/AKfycby_SOVso62pE-AggkjhoaSRA1iQ6Gndr27YchudExl3pbFHvpxh4yGmd3FDfVGHBjrR/exec",
  "https://script.google.com/macros/s/AKfycbzlzK4XbDRVcuvGF5f1pjaeSOrkhPLbfnTrc7morbQd8aQxmkiWLRRrXSZ1FbVuL9_2KQ/exec"
];

const STATE_FILE = path.join(__dirname, 'sync-sheets-state.json');

const SUPABASE_AUDITORIA_URL = 'https://iqnmysppdoytbxipvfhr.supabase.co';
const SUPABASE_AUDITORIA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxbm15c3BwZG95dGJ4aXB2ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDcxODYsImV4cCI6MjEwNzcyMzE4Nn0.FUjjn_GfhIBbH-Et_CGyxrip5jqxTvj5yRWwKmerpec';
let lastAuditKeepAlive = 0;

async function pingAuditKeepAlive() {
  const now = Date.now();
  if (now - lastAuditKeepAlive < 60 * 60 * 1000) return; // Máximo 1 ping por hora
  lastAuditKeepAlive = now;
  try {
    await fetch(`${SUPABASE_AUDITORIA_URL}/rest/v1/auditoria?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_AUDITORIA_KEY,
        'Authorization': `Bearer ${SUPABASE_AUDITORIA_KEY}`
      }
    });
  } catch (e) {
    // Si la base está pausada o temporalmente inalcanzable, no interrumpe el watcher
  }
}

async function obtenerUltimoEstadoSyncDesdeSupabase() {
  try {
    const resp = await fetch(
      `${SUPABASE_AUDITORIA_URL}/rest/v1/auditoria?planilla_id=eq.SYNC_SHEETS_GLOBAL&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_AUDITORIA_KEY,
          'Authorization': `Bearer ${SUPABASE_AUDITORIA_KEY}`
        }
      }
    );
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0];
    let detalleJson = {};
    try {
      detalleJson = JSON.parse(row.cambios || '{}');
    } catch (_) {}
    return {
      fechaIso: detalleJson.fechaIso || row.created_at || null,
      exitosa: detalleJson.exitosa !== undefined ? Boolean(detalleJson.exitosa) : row.dni_alumno === 'EXITOSA',
      exitosas: Number(detalleJson.exitosas || 0),
      fallidas: Number(detalleJson.fallidas || 0)
    };
  } catch (_) {
    return null;
  }
}

async function registrarResultadoSyncEnAuditoria({ fechaIso, exitosa, exitosas, fallidas, totalDetectadas, origen, detalle }) {
  try {
    await fetch(`${SUPABASE_AUDITORIA_URL}/rest/v1/auditoria`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_AUDITORIA_KEY,
        'Authorization': `Bearer ${SUPABASE_AUDITORIA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        usuario: 'sistema-sync-sheets',
        planilla_id: 'SYNC_SHEETS_GLOBAL',
        nombre_planilla: 'Sincronización Google Sheets ➔ Supabase',
        hoja: origen || 'AUTOMÁTICA (GitHub Actions)',
        dni_alumno: exitosa ? 'EXITOSA' : (exitosas > 0 ? 'PARCIAL' : 'FALLIDA'),
        cambios: JSON.stringify({
          fechaIso: fechaIso || new Date().toISOString(),
          exitosa: Boolean(exitosa),
          exitosas: Number(exitosas || 0),
          fallidas: Number(fallidas || 0),
          totalDetectadas: Number(totalDetectadas || 0),
          origen: origen || 'AUTOMÁTICA (GitHub Actions)',
          detalle: detalle || ''
        })
      })
    });
  } catch (e) {
    console.warn('⚠️ No se pudo registrar el estado de sincronización en Supabase:', e.message);
  }
}

// Helper para llamadas a Supabase PostgREST
async function supabaseRest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.prefer ? { 'Prefer': options.prefer } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error Supabase [${res.status}] en ${endpoint}: ${errorText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Llamada distribuida con reintento automático a los nodos de Apps Script
async function invocarAppsScript(action, payload) {
  const nodos = [...APPS_SCRIPT_URLS].sort(() => Math.random() - 0.5);
  let ultimoError = null;

  for (const url of nodos) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data !== undefined ? data.data : data;
    } catch (err) {
      ultimoError = err;
    }
  }
  throw new Error(`Fallo en todos los nodos de Apps Script (${action}): ${ultimoError?.message}`);
}

// Cargar y guardar estado persistente
function cargarEstado() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {}
  }
  return {
    enabled: true,
    intervalSeconds: 60,
    lastSyncIso: null,
    totalCursosSincronizados: 0,
    sheetsState: {} // spreadsheetId -> lastUpdated
  };
}

function guardarEstado(estado) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(estado, null, 2), 'utf8');
  } catch (e) {
    console.warn("⚠️ No se pudo guardar el archivo de estado:", e.message);
  }
}

// Normalizar formato si viene en compact-v1
function normalizarFormatoCurso(data) {
  if (data && data.courseFormat === 'compact-v1') {
    const compactSheets = Array.isArray(data.sheets) ? data.sheets : [];
    const sheetConfigs = {};
    compactSheets.forEach(sheet => {
      if (sheet && sheet.name) {
        sheetConfigs[sheet.name] = {
          allHeaders: sheet.allHeaders || [],
          editableFields: sheet.editableFields || []
        };
      }
    });

    const students = (data.students || []).map(student => {
      const datosHojas = {};
      (student.sheets || []).forEach((compactRow, sheetIndex) => {
        const sheet = compactSheets[sheetIndex];
        if (!compactRow || !sheet || !sheet.name) return;
        const values = compactRow[1] || [];
        const row = {};
        (sheet.allHeaders || []).forEach((header, colIndex) => {
          if (header) row[header] = values[colIndex] == null ? '' : String(values[colIndex]);
        });
        row._rowIndex = compactRow[0];
        datosHojas[sheet.name] = row;
      });
      return {
        dni: String(student.dni || '').trim(),
        nombreCompleto: String(student.nombreCompleto || '').trim(),
        datosHojas
      };
    });

    return {
      sheetOrder: compactSheets.map(s => s.name),
      sheets: sheetConfigs,
      students
    };
  }
  return data;
}

// Sincronizar un curso individual a Supabase (Batch Upsert ultra-rápido)
async function sincronizarCursoASupabase(planilla, rawCursoData) {
  const cursoData = normalizarFormatoCurso(rawCursoData);
  const sheetOrder = cursoData.sheetOrder || Object.keys(cursoData.sheets || {});
  const sheets = cursoData.sheets || {};
  const students = cursoData.students || [];
  const ahoraIso = new Date().toISOString();

  // 1. Guardar metadatos de hojas en planilla_hojas en lote
  const hojasMap = new Map();
  for (let ord = 0; ord < sheetOrder.length; ord++) {
    const nombreHoja = sheetOrder[ord];
    if (!nombreHoja) continue;
    const configHoja = sheets[nombreHoja] || {};
    hojasMap.set(`${planilla.id}|${nombreHoja}`, {
      planilla_id: planilla.id,
      nombre_hoja: nombreHoja,
      orden: ord + 1,
      all_headers: configHoja.allHeaders || [],
      editable_fields: configHoja.editableFields || [],
      es_especial: /ESP|PLASTICA|MUSICA|FISICA|INGLES/i.test(planilla.nombre)
    });
  }
  if (hojasMap.size > 0) {
    await supabaseRest('planilla_hojas?on_conflict=planilla_id,nombre_hoja', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: Array.from(hojasMap.values())
    });
  }

  // 2. Preparar lote de Alumnos, Matrícula y Calificaciones
  const alumnosMap = new Map();
  const matriculasMap = new Map();
  const calificacionesMap = new Map();

  let orden = 1;
  for (const st of students) {
    const dni = String(st.dni || '').trim();
    if (!dni) continue;

    const datosPersonales = (st.datosHojas && st.datosHojas["DATOS"]) ? st.datosHojas["DATOS"] : {};
    let apellido = String(datosPersonales["APELLIDO"] || '').trim();
    let nombre = String(datosPersonales["NOMBRE"] || '').trim();

    if (!apellido && !nombre && st.nombreCompleto) {
      const partes = st.nombreCompleto.split(',');
      apellido = partes[0] ? partes[0].trim() : st.nombreCompleto;
      nombre = partes[1] ? partes[1].trim() : '';
    }

    const sexo = String(datosPersonales["SEXO"] || '').trim();
    const fechaNac = String(datosPersonales["FECHA NACIMIENTO"] || datosPersonales["FECHA DE NACIMIENTO"] || datosPersonales["FECHA DE NAC"] || '').trim();

    const ocultoVal = String(datosPersonales["OCULTO"] || '').toUpperCase().trim();
    const estaOculto = (ocultoVal === 'SI' || ocultoVal === 'SÍ' || ocultoVal === 'TRUE');

    const activoVal = String(datosPersonales["ACTIVOS"] || datosPersonales["ESTADO"] || '').toUpperCase().trim();
    const estaActivo = (activoVal === '' || activoVal === 'TRUE' || activoVal === 'VERDADERO' || activoVal === 'SI' || activoVal === 'SÍ' || activoVal === '1');

    const tieneHojaDatos = Boolean(st.datosHojas && st.datosHojas["DATOS"]);
    const alumnoPayload = tieneHojaDatos
      ? {
          dni,
          apellido: apellido || '',
          nombre: nombre || '',
          sexo: sexo || null,
          fecha_nacimiento: fechaNac || null,
          activo: estaActivo,
          oculto: estaOculto,
          updated_at: ahoraIso
        }
      : {
          dni,
          apellido: apellido || '',
          nombre: nombre || '',
          activo: estaActivo,
          oculto: estaOculto,
          updated_at: ahoraIso
        };
    alumnosMap.set(dni, alumnoPayload);

    matriculasMap.set(`${planilla.id}|${dni}`, {
      planilla_id: planilla.id,
      alumno_dni: dni,
      numero_orden: orden++,
      activo: estaActivo,
      oculto: estaOculto
    });

    if (st.datosHojas) {
      for (const hojaNombre of sheetOrder) {
        if (!hojaNombre) continue;
        const valoresHoja = st.datosHojas[hojaNombre];
        if (valoresHoja && typeof valoresHoja === 'object') {
          const copiaValores = { ...valoresHoja };
          delete copiaValores._rowIndex;

          calificacionesMap.set(`${planilla.id}|${dni}|${hojaNombre}`, {
            planilla_id: planilla.id,
            alumno_dni: dni,
            nombre_hoja: hojaNombre,
            valores: copiaValores,
            updated_by: 'sync_sheets_tiempo_real',
            updated_at: ahoraIso
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // DETECCIÓN Y ACTUALIZACIÓN DIRECTA DE CAMBIO DE DNI (Mismo Apellido y Nombre)
  // Si en Google Sheets se modificó el DNI de un alumno ya existente en esta planilla,
  // se actualiza su DNI en 'alumnos' conservando todas sus notas, historial y matrículas
  // mediante la cascada automática ON UPDATE CASCADE de PostgreSQL.
  // -------------------------------------------------------------------------
  const normNom = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  try {
    const matActuales = await supabaseRest(`alumno_planillas?select=alumno_dni,alumnos(dni,apellido,nombre)&planilla_id=eq.${planilla.id}`);
    if (matActuales && matActuales.length > 0) {
      const actualesPorNombre = new Map();
      matActuales.forEach(m => {
        const al = m.alumnos;
        if (!al || !al.dni) return;
        const clave = normNom(`${al.apellido}|${al.nombre}`);
        if (clave) actualesPorNombre.set(clave, String(al.dni).trim());
      });

      for (const [dniHoja, alPayload] of alumnosMap.entries()) {
        const claveHoja = normNom(`${alPayload.apellido}|${alPayload.nombre}`);
        if (!claveHoja) continue;

        const dniViejo = actualesPorNombre.get(claveHoja);
        if (dniViejo && dniViejo !== dniHoja) {
          console.log(`[SyncWatcher] ${planilla.nombre}: Detectado cambio de DNI para ${alPayload.apellido}, ${alPayload.nombre}: ${dniViejo} ➔ ${dniHoja}`);

          const existeNuevo = await supabaseRest(`alumnos?select=dni&dni=eq.${dniHoja}&limit=1`);
          if (!existeNuevo || existeNuevo.length === 0) {
            await supabaseRest(`alumnos?dni=eq.${dniViejo}`, {
              method: 'PATCH',
              body: {
                dni: dniHoja,
                apellido: alPayload.apellido,
                nombre: alPayload.nombre,
                updated_at: ahoraIso
              }
            });
            console.log(`[SyncWatcher] DNI actualizado correctamente en DB: ${dniViejo} ➔ ${dniHoja}`);
          } else {
            // Unificar si ya existía
            try {
              const matsViejo = await supabaseRest(`alumno_planillas?select=planilla_id&alumno_dni=eq.${dniViejo}`);
              for (const mv of (matsViejo || [])) {
                const tieneMatNuevo = await supabaseRest(`alumno_planillas?select=id&planilla_id=eq.${mv.planilla_id}&alumno_dni=eq.${dniHoja}&limit=1`);
                if (!tieneMatNuevo || tieneMatNuevo.length === 0) {
                  await supabaseRest(`alumno_planillas?planilla_id=eq.${mv.planilla_id}&alumno_dni=eq.${dniViejo}`, {
                    method: 'PATCH',
                    body: { alumno_dni: dniHoja }
                  });
                }
              }

              const califsViejo = await supabaseRest(`calificaciones?select=id,planilla_id,nombre_hoja,valores&alumno_dni=eq.${dniViejo}`);
              for (const cv of (califsViejo || [])) {
                const tieneCalifNuevo = await supabaseRest(`calificaciones?select=id&planilla_id=eq.${cv.planilla_id}&alumno_dni=eq.${dniHoja}&nombre_hoja=eq.${encodeURIComponent(cv.nombre_hoja)}&limit=1`);
                if (!tieneCalifNuevo || tieneCalifNuevo.length === 0) {
                  const valsActualizados = cv.valores && typeof cv.valores === 'object'
                    ? { ...cv.valores, DNI: dniHoja }
                    : cv.valores;
                  await supabaseRest(`calificaciones?id=eq.${cv.id}`, {
                    method: 'PATCH',
                    body: { alumno_dni: dniHoja, valores: valsActualizados }
                  });
                }
              }

              await supabaseRest(`calificaciones?alumno_dni=eq.${dniViejo}`, { method: 'DELETE' });
              await supabaseRest(`alumno_planillas?alumno_dni=eq.${dniViejo}`, { method: 'DELETE' });
              await supabaseRest(`alumnos?dni=eq.${dniViejo}`, { method: 'DELETE' });
            } catch (eMerge) {
              console.warn(`[SyncWatcher] Aviso unificando DNI previo:`, eMerge.message);
            }
          }

          // Actualizar campo DNI en el JSONB si contiene el dni viejo
          try {
            const califsAfectadas = await supabaseRest(`calificaciones?select=id,valores&alumno_dni=eq.${dniHoja}`);
            for (const c of (califsAfectadas || [])) {
              if (c.valores && typeof c.valores === 'object' && c.valores.DNI === dniViejo) {
                await supabaseRest(`calificaciones?id=eq.${c.id}`, {
                  method: 'PATCH',
                  body: { valores: { ...c.valores, DNI: dniHoja } }
                });
              }
            }
          } catch (eJsonb) {
            console.warn('[SyncWatcher] Aviso actualizando DNI en JSONB:', eJsonb.message);
          }
        }
      }
    }
  } catch (eDniCheck) {
    console.warn(`[SyncWatcher] Aviso en verificación de cambio de DNI en ${planilla.nombre}:`, eDniCheck.message);
  }

  if (alumnosMap.size > 0) {
    await supabaseRest('alumnos?on_conflict=dni', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: Array.from(alumnosMap.values())
    });
  }

  if (matriculasMap.size > 0) {
    await supabaseRest('alumno_planillas?on_conflict=planilla_id,alumno_dni', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: Array.from(matriculasMap.values())
    });
  }

  if (calificacionesMap.size > 0) {
    const califsArr = Array.from(calificacionesMap.values());
    for (let i = 0; i < califsArr.length; i += 250) {
      await supabaseRest('calificaciones?on_conflict=planilla_id,alumno_dni,nombre_hoja', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: califsArr.slice(i, i + 250)
      });
    }
  }

  // 4. Si la planilla sincronizada es de materias especiales, propagar hacia curso regular
  if (/ESP|ESPECIAL/i.test(planilla.nombre)) {
    try {
      await propagarNotasEspecialesDesdeWatcher(planilla, students);
    } catch (eProp) {
      console.warn(`⚠️ Aviso propagando notas especiales de ${planilla.nombre}:`, eProp.message);
    }
  }
}


// =========================================================================
// CONSOLIDACIÓN Y PROPAGACIÓN DE NOTAS ESPECIALES (WATCHER)
// =========================================================================

function parsePlanillaInfo(nombre) {
  const norm = String(nombre || '').toUpperCase().trim();
  const esSegundo = /2\s*(?:DO)?\s*CUATRIMESTRE/i.test(norm);
  const sinCuatri = norm.replace(/[12]\s*(?:RO|DO|ER|TO)?\s*CUATRIMESTRE/gi, '');
  const m = sinCuatri.match(/([1-7])\s*(?:RO|DO|TO|MO|VO|°)?\s*([A-L])(?:\b|$)/i);
  let materia = null;
  if (/INGL[EÉ]S/i.test(norm)) materia = 'INGLES';
  else if (/F[IÍ]SICA/i.test(norm)) materia = 'ED_FISICA';
  else if (/M[UÚ]SICA/i.test(norm)) materia = 'MUSICA';
  else if (/PL[AÁ]STICA|ART[IÍ]STICA/i.test(norm)) materia = 'PLASTICA';
  else if (/TECNOLOG[IÍ]A/i.test(norm)) materia = 'TECNOLOGIA';

  return {
    esSegundo: esSegundo ? 2 : 1,
    grado: m ? m[1] : null,
    seccion: m ? m[2] : null,
    materia,
    esEspecial: /ESP|ESPECIAL/i.test(norm)
  };
}

function extraerNotaFinalEspecial(valores) {
  if (!valores) return '';
  const b1 = Number(String(valores['1 Bimestre'] || valores['1er Bimestre'] || valores['1° Bimestre'] || '').replace(/,/g, '.'));
  const b2 = Number(String(valores['2 Bimestre'] || valores['2do Bimestre'] || valores['2° Bimestre'] || '').replace(/,/g, '.'));
  const validas = [b1, b2].filter(n => !isNaN(n) && n > 0);
  if (validas.length > 0) {
    const sumaCentavos = validas.reduce((a, b) => a + Math.round(b * 100), 0);
    return (Math.trunc(sumaCentavos / validas.length + 1e-9) / 100).toFixed(2);
  }
  const tieneClavesBimestre = Object.keys(valores).some(k => /BIMESTRE/i.test(k));
  if (tieneClavesBimestre) return '';
  const prom = valores['Promedio.'] || valores['Promedio'] || valores['PROMEDIO.'] || valores['PROMEDIO'] || valores['PROM'];
  if (prom !== undefined && prom !== null && String(prom).trim() !== '') {
    const n = Number(String(prom).replace(/,/g, '.'));
    if (!isNaN(n) && n > 0) return n.toFixed(2);
  }
  return '';
}

function mapearColumnaMateriaEspecial(headers, materia, nombreHoja) {
  if (!Array.isArray(headers) || !materia) return null;
  const hUpper = headers.map(h => ({ original: h, upper: String(h || '').toUpperCase() }));
  const esBoletin = /BOLETIN/i.test(nombreHoja || '');

  if (materia === 'INGLES') {
    if (esBoletin) {
      const c = hUpper.find(h => h.upper.includes('EXTRANJ') || h.upper.includes('INGL'));
      return c ? c.original : null;
    }
    const c = hUpper.find(h => h.upper.includes('INGL') || h.upper.includes('EXTRANJ'));
    return c ? c.original : null;
  }
  if (materia === 'ED_FISICA') {
    const c = hUpper.find(h => h.upper.includes('FÍS') || h.upper.includes('FIS'));
    return c ? c.original : null;
  }
  if (materia === 'MUSICA') {
    if (esBoletin) {
      const c = hUpper.find(h => h.upper.includes('ARTIST') || h.upper.includes('ARTÍST'));
      if (c) return c.original;
    }
    const c = hUpper.find(h => h.upper.includes('MUSI'));
    return c ? c.original : null;
  }
  if (materia === 'PLASTICA') {
    if (esBoletin) {
      const c = hUpper.find(h => h.upper.includes('ARTIST') || h.upper.includes('ARTÍST'));
      if (c) return c.original;
    }
    const c = hUpper.find(h => h.upper.includes('PLAST') || h.upper.includes('PLÁST') || h.upper.includes('ARTIST'));
    return c ? c.original : null;
  }
  return null;
}

async function propagarNotasEspecialesDesdeWatcher(planillaEspecial, students) {
  const infoEsp = parsePlanillaInfo(planillaEspecial.nombre);
  if (!infoEsp.esEspecial || !infoEsp.materia || !infoEsp.grado || !infoEsp.seccion) return;

  const regQuery = await supabaseRest(`planillas?nombre=not.ilike.*ESP*&nombre=ilike.*${infoEsp.grado}*&nombre=ilike.*${infoEsp.seccion}*&select=id,nombre`);
  const regPlanilla = (regQuery || []).find(p => {
    const ir = parsePlanillaInfo(p.nombre);
    return !ir.esEspecial && ir.grado === infoEsp.grado && ir.seccion === infoEsp.seccion && ir.esSegundo === infoEsp.esSegundo;
  });

  if (!regPlanilla) return;

  const regHojas = await supabaseRest(`planilla_hojas?planilla_id=eq.${regPlanilla.id}&select=id,nombre_hoja,all_headers`);
  if (!Array.isArray(regHojas) || regHojas.length === 0) return;

  const hojasDestino = [];
  regHojas.forEach(h => {
    const col = mapearColumnaMateriaEspecial(h.all_headers, infoEsp.materia, h.nombre_hoja);
    if (col) hojasDestino.push({ nombreHoja: h.nombre_hoja, columna: col });
  });

  if (hojasDestino.length === 0) return;

  const existentes = await supabaseRest(`calificaciones?planilla_id=eq.${regPlanilla.id}&select=alumno_dni,nombre_hoja,valores`);
  const mapaExistentes = new Map();
  (existentes || []).forEach(c => {
    mapaExistentes.set(`${String(c.alumno_dni).trim()}|${c.nombre_hoja}`, c.valores || {});
  });

  const upserts = [];
  const ahoraIso = new Date().toISOString();

  for (const st of (students || [])) {
    const dni = String(st.dni || '').trim();
    if (!dni) continue;

    const valoresEspecial = (st.datosHojas && (st.datosHojas['NOTAS_ÁREAS_ESPECIALES'] || Object.values(st.datosHojas)[0])) || {};
    const notaFinal = extraerNotaFinalEspecial(valoresEspecial);
    if (!notaFinal) continue;

    for (const dest of hojasDestino) {
      const key = `${dni}|${dest.nombreHoja}`;
      const valoresReg = { ...(mapaExistentes.get(key) || {}) };

      if (valoresReg[dest.columna] !== notaFinal) {
        valoresReg[dest.columna] = notaFinal;
        mapaExistentes.set(key, valoresReg);
        upserts.push({
          planilla_id: regPlanilla.id,
          alumno_dni: dni,
          nombre_hoja: dest.nombreHoja,
          valores: valoresReg,
          updated_by: 'sync_sheets_propagacion_especial',
          updated_at: ahoraIso
        });
      }
    }
  }

  if (upserts.length > 0) {
    await supabaseRest('calificaciones?on_conflict=planilla_id,alumno_dni,nombre_hoja', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: upserts
    });
  }
}

// Ciclo principal de escaneo y sincronización
async function ejecutarCicloSincronizacion(estado) {
  const timestampInicio = new Date();
  const horaLocal = timestampInicio.toLocaleTimeString('es-AR');

  if (!estado.enabled) {
    console.log(`[${horaLocal}] ⏹️ Sincronización DETENIDA por Kill-Switch (Pase a producción activado).`);
    return { skipped: true, reason: 'disabled' };
  }

  // Keep-alive defensivo para base de auditoría
  await pingAuditKeepAlive();

  process.stdout.write(`[${horaLocal}] 🔍 Buscando planillas modificadas en Google Drive... `);

  // Obtener todas las planillas registradas en Supabase
  const planillasSupabase = await supabaseRest('planillas?select=id,nombre,spreadsheet_id&activo=eq.true');
  const mapaPlanillasPorId = new Map(planillasSupabase.filter(p => p.spreadsheet_id).map(p => [p.spreadsheet_id, p]));

  // Buscar archivos modificados mediante Apps Script
  let modificadas = [];
  try {
    const resBusqueda = await invocarAppsScript('buscarPlanillasModificadasRecientes', [
      estado.lastSyncIso || null,
      50
    ]);
    if (resBusqueda && resBusqueda.success && Array.isArray(resBusqueda.planillas)) {
      modificadas = resBusqueda.planillas;
    }
  } catch (errBusqueda) {
    // Si la función global no estuviera disponible aún, usar el estado delta local
  }

  // Filtrar solo las que pertenecen a la escuela y que realmente hayan cambiado de timestamp
  const planillasAActualizar = [];
  for (const item of modificadas) {
    const planillaDb = mapaPlanillasPorId.get(item.spreadsheetId);
    if (!planillaDb) continue;

    const lastTsConocido = estado.sheetsState[item.spreadsheetId] || 0;
    if (item.lastUpdated > lastTsConocido) {
      planillasAActualizar.push({
        ...planillaDb,
        nuevoLastUpdated: item.lastUpdated
      });
    }
  }

  if (planillasAActualizar.length === 0) {
    console.log(`0 cambios detectados.`);
    estado.lastSyncIso = timestampInicio.toISOString();
    guardarEstado(estado);
    return { actualizadas: 0, exitosas: 0, fallidas: 0, totalDetectadas: 0 };
  }

  console.log(`⚡ ¡${planillasAActualizar.length} planilla(s) modificada(s) por docentes!`);

  let exitosas = 0;
  let fallidas = 0;
  for (let i = 0; i < planillasAActualizar.length; i++) {
    const p = planillasAActualizar[i];
    process.stdout.write(`   [${i + 1}/${planillasAActualizar.length}] Descargando "${p.nombre}"... `);

    try {
      const cursoData = await invocarAppsScript('cargarTodoElCurso', [
        p.spreadsheet_id,
        'misericordiaplanillas@gmail.com',
        { compact: true }
      ]);

      await sincronizarCursoASupabase(p, cursoData);
      estado.sheetsState[p.spreadsheet_id] = p.nuevoLastUpdated;
      estado.totalCursosSincronizados++;
      exitosas++;
      console.log(`✅ Sincronizado en Supabase (${(cursoData.students || []).length} alumnos).`);
    } catch (errSync) {
      fallidas++;
      console.log(`❌ Error: ${errSync.message}`);
    }
  }

  estado.lastSyncIso = timestampInicio.toISOString();
  guardarEstado(estado);
  console.log(`✨ Ciclo completado. Total acumulado: ${estado.totalCursosSincronizados} cursos sincronizados.`);
  return { actualizadas: exitosas, exitosas, fallidas, totalDetectadas: planillasAActualizar.length };
}

// Punto de entrada CLI
async function main() {
  const args = process.argv.slice(2);
  const estado = cargarEstado();

  // 1. Comando: --status
  if (args.includes('--status')) {
    console.log("\n=======================================================");
    console.log("📊 ESTADO DEL SINCRONIZADOR SHEETS ➔ SUPABASE");
    console.log("=======================================================");
    console.log(`  • Estado:                ${estado.enabled ? '🟢 ACTIVO (Monitoreando)' : '🔴 DETENIDO (Pase a producción)'}`);
    console.log(`  • Intervalo:             Cada ${estado.intervalSeconds || 60} segundos`);
    console.log(`  • Último escaneo:        ${estado.lastSyncIso || 'Aún no ejecutado'}`);
    console.log(`  • Planillas impactadas:  ${estado.totalCursosSincronizados || 0}`);
    console.log("=======================================================\n");
    return;
  }

  // 2. Comando: --stop (KILL-SWITCH PARA PASE A PRODUCCIÓN)
  if (args.includes('--stop') || args.includes('--disable')) {
    estado.enabled = false;
    guardarEstado(estado);
    console.log("\n🛑 =====================================================");
    console.log("   KILL-SWITCH ACTIVADO: Sincronización cancelada.");
    console.log("   Ninguna edición en Google Sheets impactará Supabase.");
    console.log("   A partir de este momento, Supabase es la fuente oficial.");
    console.log("=====================================================\n");
    return;
  }

  // 3. Comando: --start
  if (args.includes('--start') || args.includes('--enable')) {
    estado.enabled = true;
    guardarEstado(estado);
    console.log("\n🟢 Sincronizador reactivado exitosamente.");
    return;
  }

  // 4. Comando: --course=ID_O_NOMBRE
  const argCourse = args.find(a => a.startsWith('--course='));
  if (argCourse) {
    const val = argCourse.split('=')[1].trim();
    console.log(`🎯 Sincronizando planilla específica: "${val}"...`);
    let filter = `nombre.ilike.*${val}*,spreadsheet_id.eq.${val}`;
    if (!isNaN(val) && Number(val) > 0) {
      filter += `,id.eq.${val}`;
    }
    const planillas = await supabaseRest(`planillas?select=id,nombre,spreadsheet_id&or=(${filter})&limit=1`);
    if (!planillas || planillas.length === 0) {
      console.error(`❌ No se encontró la planilla "${val}" en Supabase.`);
      return;
    }
    const p = planillas[0];
    const cursoData = await invocarAppsScript('cargarTodoElCurso', [p.spreadsheet_id, 'misericordiaplanillas@gmail.com', { compact: true }]);
    await sincronizarCursoASupabase(p, cursoData);
    console.log(`✅ ¡Planilla "${p.nombre}" sincronizada con éxito en Supabase!`);
    return;
  }

  // 5. Comando: --all (Sincronizar todos los grados y áreas especiales existentes)
  if (args.includes('--all')) {
    console.log("🌐 Iniciando sincronización completa de TODOS los grados y áreas especiales existentes...");
    const todas = await supabaseRest('planillas?select=id,nombre,spreadsheet_id&activo=eq.true&order=nombre.asc&limit=1000');
    const validas = (todas || []).filter(p => p.spreadsheet_id && !/^RESET\b/i.test(p.nombre));
    validas.sort((a, b) => {
      const esEspA = /\bESP\b|ESPECIAL/i.test(a.nombre) ? 1 : 0;
      const esEspB = /\bESP\b|ESPECIAL/i.test(b.nombre) ? 1 : 0;
      if (esEspA !== esEspB) return esEspA - esEspB;
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    console.log(`📋 Total de planillas a sincronizar: ${validas.length} (Regulares primero, Áreas Especiales después)`);
    let completadas = 0;
    let exitosas = 0;
    let fallidas = 0;
    const CONCURRENCIA = 6;

    for (let i = 0; i < validas.length; i += CONCURRENCIA) {
      const lote = validas.slice(i, i + CONCURRENCIA);
      await Promise.all(lote.map(async (p) => {
        try {
          const cursoData = await invocarAppsScript('cargarTodoElCurso', [
            p.spreadsheet_id,
            'misericordiaplanillas@gmail.com',
            { compact: true }
          ]);
          await sincronizarCursoASupabase(p, cursoData);
          exitosas++;
          estado.totalCursosSincronizados = (estado.totalCursosSincronizados || 0) + 1;
          estado.sheetsState[p.spreadsheet_id] = Date.now();
          completadas++;
          console.log(`✅ [${completadas}/${validas.length}] ${p.nombre}`);
        } catch (err) {
          fallidas++;
          completadas++;
          console.warn(`❌ [${completadas}/${validas.length}] ${p.nombre}: ${err.message}`);
        }
      }));
      estado.lastSyncIso = new Date().toISOString();
      guardarEstado(estado);
    }

    console.log(`\n🏁 Sincronización masiva finalizada: ${exitosas} exitosas, ${fallidas} fallidas de ${validas.length}.`);
    return;
  }

  // 6. Comando: --once (Una sola pasada)
  if (args.includes('--once')) {
    console.log("🚀 Ejecutando una pasada única de sincronización...");
    const origen = process.env.GITHUB_ACTIONS ? 'AUTOMÁTICA (GitHub Actions)' : 'MANUAL (CLI)';
    if (!estado.lastSyncIso) {
      const ultimoRemoto = await obtenerUltimoEstadoSyncDesdeSupabase();
      if (ultimoRemoto && ultimoRemoto.fechaIso) {
        estado.lastSyncIso = ultimoRemoto.fechaIso;
      }
    }
    try {
      const resumen = await ejecutarCicloSincronizacion(estado) || { exitosas: 0, fallidas: 0, totalDetectadas: 0 };
      const exitosa = (resumen.fallidas || 0) === 0;
      await registrarResultadoSyncEnAuditoria({
        fechaIso: estado.lastSyncIso || new Date().toISOString(),
        exitosa,
        exitosas: resumen.exitosas || 0,
        fallidas: resumen.fallidas || 0,
        totalDetectadas: resumen.totalDetectadas || 0,
        origen,
        detalle: exitosa
          ? `Sincronización completada (${resumen.exitosas || 0} planillas actualizadas)`
          : `Completada con ${resumen.fallidas} error(es)`
      });
      if (!exitosa) process.exitCode = 1;
    } catch (errOnce) {
      await registrarResultadoSyncEnAuditoria({
        fechaIso: new Date().toISOString(),
        exitosa: false,
        exitosas: 0,
        fallidas: 1,
        totalDetectadas: 0,
        origen,
        detalle: errOnce.message
      });
      throw errOnce;
    }
    return;
  }

  // 6. Modo por defecto: Daemon continuo cada N segundos
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const intervalMs = (intervalArg ? parseInt(intervalArg.split('=')[1], 10) : (estado.intervalSeconds || 60)) * 1000;

  console.log("\n=======================================================");
  console.log("🔄 SINCRONIZADOR EN SEGUNDO PLANO ACTIVO");
  console.log(`   Escaneando Google Drive cada ${intervalMs / 1000}s`);
  console.log("   Presiona Ctrl+C para detener o ejecuta con --stop para corte");
  console.log("=======================================================\n");

  await ejecutarCicloSincronizacion(estado);
  setInterval(async () => {
    try {
      const estadoActual = cargarEstado();
      await ejecutarCicloSincronizacion(estadoActual);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString('es-AR')}] ⚠️ Error en ciclo:`, err.message);
    }
  }, intervalMs);
}

main().catch(err => {
  console.error("❌ Error fatal en sincronizador:", err);
});
