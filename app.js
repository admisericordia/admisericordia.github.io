// ==========================================
// INICIALIZACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = 'https://ehtezblqbttaxyyudzyy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodGV6YmxxYnR0YXh5eXVkenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDM4MjAsImV4cCI6MjEwNzQ3OTgyMH0.nqcJwBPHmr5q3Ng8bcEVnsop5-wvdAVpBagcqZVx3R8';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
}

// ==========================================
// BASE DE DATOS DEDICADA DE AUDITORÍA (auditoriamiser)
// ==========================================
const supabaseAuditoriaUrl = 'https://iqnmysppdoytbxipvfhr.supabase.co';
const supabaseAuditoriaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxbm15c3BwZG95dGJ4aXB2ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDcxODYsImV4cCI6MjEwNzcyMzE4Nn0.FUjjn_GfhIBbH-Et_CGyxrip5jqxTvj5yRWwKmerpec';
const supabaseAuditoriaClient = (typeof supabase !== 'undefined' && supabase.createClient)
    ? supabase.createClient(supabaseAuditoriaUrl, supabaseAuditoriaKey)
    : null;

function getAuditSupabaseClient() {
    return supabaseAuditoriaClient || supabaseClient;
}

// ==========================================
// MONITOR Y NOTIFICACIÓN SI SUPABASE QUEDA EN PAUSA
// ==========================================
function mostrarBannerSupabasePausada(fallos) {
    if (typeof document === 'undefined' || !Array.isArray(fallos) || fallos.length === 0) return;
    let banner = document.getElementById('banner-alerta-supabase-pausada');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'banner-alerta-supabase-pausada';
        banner.style.cssText = 'background:#b71c1c;color:#ffffff;padding:12px 16px;font-size:13.5px;line-height:1.45;box-shadow:0 4px 12px rgba(0,0,0,0.2);position:relative;z-index:2000;border-bottom:2px solid #ff8a80;';
        document.body.insertBefore(banner, document.body.firstChild);
    }

    const itemsHtml = fallos.map(f => (
        `<div style="margin-top:6px;padding:6px 10px;background:rgba(0,0,0,0.22);border-radius:6px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">` +
            `<span>⚠️ <b>${f.nombre}</b> (Ref: <code>${f.proyectoRef}</code> | Cuenta: <b>${f.cuenta}</b>) — <i>${f.estado}</i></span>` +
            `<a href="${f.dashboardUrl}" target="_blank" rel="noopener noreferrer" style="background:#ffffff;color:#b71c1c;padding:4px 10px;border-radius:4px;font-weight:700;text-decoration:none;font-size:12px;white-space:nowrap;">Abrir Panel y Restaurar</a>` +
        `</div>`
    )).join('');

    banner.innerHTML =
        `<div style="max-width:1100px;margin:0 auto;">` +
            `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">` +
                `<strong style="font-size:14px;display:flex;align-items:center;gap:6px;"><i class="material-icons" style="font-size:18px;">warning</i> ALERTA: Base de datos Supabase en pausa o sin respuesta</strong>` +
                `<button type="button" onclick="this.closest('#banner-alerta-supabase-pausada').remove()" style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:18px;line-height:1;" title="Cerrar aviso">&times;</button>` +
            `</div>` +
            itemsHtml +
        `</div>`;
}

async function verificarYNotificarEstadoSupabase() {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    const objetivos = [
        {
            nombre: 'Principal (Misericordia - Planillas y Notas)',
            proyectoRef: 'ehtezblqbttaxyyudzyy',
            cuenta: 'misericordiaplanillas@gmail.com',
            dashboardUrl: 'https://supabase.com/dashboard/project/ehtezblqbttaxyyudzyy',
            url: `${supabaseUrl}/rest/v1/planillas?select=id&limit=1`,
            key: supabaseKey
        },
        {
            nombre: 'Auditoría (auditoriamiser)',
            proyectoRef: 'iqnmysppdoytbxipvfhr',
            cuenta: 'victorojas2025@gmail.com',
            dashboardUrl: 'https://supabase.com/dashboard/project/iqnmysppdoytbxipvfhr',
            url: `${supabaseAuditoriaUrl}/rest/v1/auditoria?select=id&limit=1`,
            key: supabaseAuditoriaKey
        }
    ];

    const fallosDetectados = [];

    for (const obj of objetivos) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 9000);
            const resp = await fetch(obj.url, {
                method: 'GET',
                headers: {
                    apikey: obj.key,
                    Authorization: `Bearer ${obj.key}`
                },
                signal: controller.signal
            });
            clearTimeout(timer);

            if (resp.status === 540 || resp.status === 521 || resp.status === 503 || resp.status === 502) {
                fallosDetectados.push({
                    nombre: obj.nombre,
                    proyectoRef: obj.proyectoRef,
                    cuenta: obj.cuenta,
                    dashboardUrl: obj.dashboardUrl,
                    estado: `EN PAUSA / HTTP ${resp.status}`
                });
            }
        } catch (err) {
            if (navigator.onLine && err && err.name !== 'AbortError') {
                fallosDetectados.push({
                    nombre: obj.nombre,
                    proyectoRef: obj.proyectoRef,
                    cuenta: obj.cuenta,
                    dashboardUrl: obj.dashboardUrl,
                    estado: 'Inaccesible / Posible pausa por inactividad'
                });
            }
        }
    }

    if (fallosDetectados.length > 0) {
        mostrarBannerSupabasePausada(fallosDetectados);

        try {
            const yaNotificado = sessionStorage.getItem('alerta_supabase_pausada_enviada');
            if (!yaNotificado) {
                sessionStorage.setItem('alerta_supabase_pausada_enviada', '1');
                fetch(getRandomAppsScriptUrl(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        action: 'notificarAlertaSupabasePausada',
                        payload: {
                            origen: 'Aplicación Web (Detección automática al abrir)',
                            fallos: fallosDetectados
                        }
                    })
                }).catch(() => {});
            }
        } catch (_e) {}
    }
}

if (typeof window !== 'undefined') {
    window.verificarYNotificarEstadoSupabase = verificarYNotificarEstadoSupabase;
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(verificarYNotificarEstadoSupabase, 2000);
    });
}

// Detección de sesión SOLO si el usuario ingresó haciendo clic en el enlace del correo (Magic Link)
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const hasMagicLinkHash = window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('type=recovery')
    );
    if (event === 'SIGNED_IN' && hasMagicLinkHash && session && session.user) {
        const email = session.user.email;
        if (email) {
            emailProcesando = email;
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
            }
            if (typeof procesarRespuestaAcceso === 'function') {
                const esAdmin = email.toLowerCase() === 'misericordiaplanillas@gmail.com' ||
                                email.toLowerCase() === 'victorojas2025@gmail.com';
                const planillas = typeof cargarPlanillasDesdeSupabase === 'function'
                    ? await cargarPlanillasDesdeSupabase(email, esAdmin)
                    : [];
                procesarRespuestaAcceso({
                    acceso: true,
                    email: email,
                    esAdmin,
                    lista: planillas
                }, false);
            }
        }
    }
});

/*
// =========================================================================
// ⚙️ ADAPTADOR REST (MOCK) PARA GOOGLE APPS SCRIPT (DESACTIVADO)
// Permite que tu código siga usando `google.script.run` pero comunicándose
// mediante peticiones HTTP Fetch al servidor.
// =========================================================================
const APPS_SCRIPT_API_URLS = [
    "https://script.google.com/macros/s/AKfycby_SOVso62pE-AggkjhoaSRA1iQ6Gndr27YchudExl3pbFHvpxh4yGmd3FDfVGHBjrR/exec",
    "https://script.google.com/macros/s/AKfycbyAjxyFWJZTIqvYo2bfq1vNDlEaIMHrqo9Zqb96SnRHy4WWJrIa7XeUsIlDwo0N-JuZYA/exec",
    "https://script.google.com/macros/s/AKfycbzlzK4XbDRVcuvGF5f1pjaeSOrkhPLbfnTrc7morbQd8aQxmkiWLRRrXSZ1FbVuL9_2KQ/exec"
];
function getRandomAppsScriptUrl() {
    return APPS_SCRIPT_API_URLS[Math.floor(Math.random() * APPS_SCRIPT_API_URLS.length)];
}
const APPS_SCRIPT_API_URL = getRandomAppsScriptUrl();
const isNetlifyHost = typeof window !== 'undefined' && window.location && (
    (window.location.hostname && (window.location.hostname.endsWith('netlify.app') || window.location.hostname.includes('netlify'))) ||
    window.location.port === '8888'
);
let API_URL = window.APP_API_URL || (isNetlifyHost ? '/api' : APPS_SCRIPT_API_URL);
const NETWORK_RETRY_MAX = 3;
const COURSE_LOAD_TIMEOUT_MS = 120000;
// Authentication reads the index spreadsheet and can take longer on a cold
// Apps Script instance. Keep this slightly above the proxy timeout so the
// browser receives the proxy's diagnostic response instead of aborting first.
const AUTH_REQUEST_TIMEOUT_MS = 60000;
const SAVE_REQUEST_TIMEOUT_MS = 120000;
const COURSE_LOAD_RETRY_MAX = 2;
const NETWORK_RETRY_DELAY_MS = 3000;
const IDEMPOTENT_ACTIONS = new Set([
    'enviarCodigoPorCorreo',
    'saveStudentData',
    'saveStudentDataBatch',
    'saveStudentDataGridBatch',
    'procesarBoletinesFiltrados',
    'borrarBoletinesDeCarpeta',
    'migrarDatosCuatrimestreREST',
    'iniciarMigracionCuatrimestreAsync',
    'dispararNotificacionPush',
    'dispararNotificacionGrupoPush',
    'reserveGrade',
    'releaseGrade',
    'touchSession',
    'generarBoletinIndividualREST',
    'generarBoletinSegundoCuatrimestreREST',
    'generarBoletinAlumnoPorGrado',
    'borrarBoletinAlumnoPorGrado',
    'procesarBoletinesSegundoCuatrimestre',
    'procesarLoteBoletinesSegundoCuatrimestre',
    'procesarLoteBoletinesPrimerCuatrimestre',
    'cancelarProcesoBoletines'
]);
const pendingRequestQueue = [];
let isProcessingPendingQueue = false;
*/

// Precompiled Regexes for extraerGradoYSeccionGlobal to improve sorting performance
const REGEX_2DO_CUATRI = /(?:2\s*(?:º|°|DO)?\s*CUAT|SEGUNDO\s*CUAT)/i;
const REGEX_ORDINAL = /\b(\d+)\s*(?:RO|DO|TO|ER|MO)\b/i;
const REGEX_ESP_REPLACE = /\bESP\b/g;
const REGEX_SECCION_1 = /(?:^|\s)([A-Z])\s*$/;
const REGEX_SECCION_2 = /(?:^|\s)([A-Z])(?:\s|$)/g;
const REGEX_ESP_TEST = /\bESP\b/;
const REGEX_DIACRITICOS = /[\u0300-\u036f]/g;

function extraerGradoYSeccionGlobal(nombre) {
    const limpio = String(nombre || '')
        .normalize('NFD')
        .replace(REGEX_DIACRITICOS, '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();

    const esSegundoCuatri = REGEX_2DO_CUATRI.test(limpio) ? 1 : 0;

    const ordinalMatch = limpio.match(REGEX_ORDINAL);
    const grado = ordinalMatch ? Number(ordinalMatch[1]) : 99;

    let seccion = '';
    const sinEsp = limpio.replace(REGEX_ESP_REPLACE, '').trim();
    const token = sinEsp.match(REGEX_SECCION_1);
    if (token) {
        seccion = token[1];
    } else {
        const letra = sinEsp.match(REGEX_SECCION_2);
        seccion = letra && letra.length ? letra[letra.length - 1].trim() : '';
    }

    const esEsp = REGEX_ESP_TEST.test(limpio) ? 1 : 0;
    return { grado, seccion, esEsp, esSegundoCuatri };
}

function compararPlanillasParaDocente(a, b) {
    const nombreA = String(a && a.nombre ? a.nombre : (a && a.id ? a.id : '')).trim();
    const nombreB = String(b && b.nombre ? b.nombre : (b && b.id ? b.id : '')).trim();

    const infoA = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(nombreA) : {};
    const infoB = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(nombreB) : {};

    const getCategoria = (info, nombre) => {
        const esEsp = Boolean(info.esEsp || (typeof esPlanillaEspecialSeleccionada === 'function' && esPlanillaEspecialSeleccionada(nombre)));
        if (esEsp) return 2;
        const es2do = Boolean(info.esSegundoCuatri || (typeof esPlanillaSegundoCuatrimestreSeleccionada === 'function' && esPlanillaSegundoCuatrimestreSeleccionada(nombre)) || /CUATRIMESTRE/i.test(nombre));
        if (es2do) return 1;
        return 0;
    };

    const catA = getCategoria(infoA, nombreA);
    const catB = getCategoria(infoB, nombreB);

    if (catA !== catB) return catA - catB;

    // Categoría 2: Especiales (van al final de la lista)
    if (catA === 2) {
        const cuatriA = infoA.esSegundoCuatri || 0;
        const cuatriB = infoB.esSegundoCuatri || 0;
        if (cuatriA !== cuatriB) return cuatriA - cuatriB;
        if (infoA.grado !== infoB.grado) return (infoA.grado || 99) - (infoB.grado || 99);
        if (infoA.seccion !== infoB.seccion) return (infoA.seccion || '').localeCompare(infoB.seccion || '', 'es', { sensitivity: 'base' });
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    }

    // Categorías 0 y 1: Regulares (1° Cuatrimestre primero, luego los que contienen Cuatrimestre)
    // Ordenados alfabéticamente por grado (1°, 2°, 3°...) y luego por sección (A, B, C...)
    const gradoA = (Number.isInteger(infoA.grado) && infoA.grado !== 99) ? infoA.grado : 99;
    const gradoB = (Number.isInteger(infoB.grado) && infoB.grado !== 99) ? infoB.grado : 99;
    if (gradoA !== gradoB) return gradoA - gradoB;

    const seccionA = String(infoA.seccion || '').trim().toUpperCase();
    const seccionB = String(infoB.seccion || '').trim().toUpperCase();
    if (seccionA !== seccionB) return seccionA.localeCompare(seccionB, 'es', { sensitivity: 'base' });

    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
}

function obtenerGradoPlanillaParaPdf(nombrePlanilla) {
    const { grado, seccion } = extraerGradoYSeccionGlobal(nombrePlanilla);
    if (!Number.isInteger(grado) || grado < 1 || grado > 6) return '';
    return seccion ? `${grado}° ${seccion}` : `${grado}°`;
}

function construirTituloPdfHoja(tituloBase, nombreHoja, nombrePlanilla) {
    if (!String(nombreHoja || '').toUpperCase().includes('ESPECIAL')) return tituloBase;
    const gradoPlanilla = obtenerGradoPlanillaParaPdf(nombrePlanilla);
    return gradoPlanilla ? `${tituloBase} - ${gradoPlanilla}` : tituloBase;
}

function updateInternetStatusUI(isOnline, reason = '') {
    const indicador = document.getElementById('internet-status');
    const texto = document.getElementById('internet-status-text');
    if (indicador) {
        indicador.classList.toggle('online', !!isOnline);
        indicador.classList.toggle('offline', !isOnline);
        const icono = indicador.querySelector('i');
        if (icono) icono.textContent = isOnline ? 'wifi' : 'wifi_off';
        if (reason) {
            indicador.title = reason;
        } else {
            indicador.title = isOnline ? 'Estado de conexión' : 'Sin conexión';
        }
    }
    if (texto) {
        texto.textContent = isOnline ? 'Conectado' : 'Sin conexión';
    }
}

function handleConnectionFailure(reason = 'Sin conexión') {
    updateInternetStatusUI(false, reason);
}

function handleConnectionRecovered() {
    updateInternetStatusUI(true, 'Conexión restaurada');
}

function limpiarSesionGuardadaYMostrarLogin() {
    try {
        sessionStorage.removeItem('misericordia_sesion');
        sessionStorage.removeItem('misericordia_session');
        sessionStorage.removeItem('misericordia_planillas_cache');
        if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
            supabaseClient.auth.signOut().catch(() => {});
        }
        if (window.location.hash) {
            window.history.replaceState(null, null, window.location.pathname);
        }
    } catch (error) {
        console.warn('No se pudo limpiar la sesión guardada:', error);
    }
    emailProcesando = '';
    mostrarLoader(false);

    cursoCompleto = null;
    studentsByDni = new Map();
    currentSpreadsheetId = null;
    mapaPlanillas = {};
    mapaPlanillasSoloLectura = {};
    window.esUsuarioAdmin = false;
    window.puedeVerBoletinAlumno = false;

    ['section-selectors', 'panel-principal', 'panel-auditoria-global', 'save-button-container',
      'btn-abrir-planilla-directo', 'btn-logout', 'user-email-display', 'contenedor-boton-admin']
        .forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.style.display = 'none';
        });
    if (typeof limpiarFormularioCompleto === 'function') limpiarFormularioCompleto();
    if (selectPlanilla) {
        selectPlanilla.value = '';
        selectPlanilla.disabled = true;
    }
    if (selectHoja) {
        selectHoja.innerHTML = '<option value="" disabled selected>Seleccione una Hoja</option>';
        selectHoja.disabled = true;
    }
    if (selectAlumno) {
        selectAlumno.innerHTML = '<option value="" disabled selected>Seleccione un Alumno</option>';
        selectAlumno.disabled = true;
    }

    const sectionLogin = document.getElementById('section-login');
    if (sectionLogin) sectionLogin.style.display = 'block';
}

function isNetworkFailureReason(error) {
    const message = (error && (error.message || String(error))) || '';
    if (!navigator.onLine) return true;
    return /ERR_CONNECTION_TIMED_OUT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|Failed to load resource|Failed to fetch|net::ERR_|fetch\s+failed/i.test(message);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createRequestId() {
    return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function createOperationId() {
    return 'op-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

// Prunear datos: eliminar propiedades con cadenas vacías para reducir el tamaño (útil para caches grandes)
function pruneData(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => pruneData(item));
    }
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        // eliminar solo strings exactamente vacías
        if (v === "") continue;
        if (v && typeof v === 'object') {
            const p = pruneData(v);
            // si el objeto quedó vacío, omitimos la propiedad
            if (p && typeof p === 'object' && Object.keys(p).length === 0) continue;
            out[k] = p;
        } else {
            out[k] = v;
        }
    }
    return out;
}

// Estimación de tamaño y comprobación de cuota antes de escribir en storage
const _textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function estimateSizeOfString(str) {
    try {
        return _textEncoder ? _textEncoder.encode(str).length : String(str).length * 2;
    } catch (e) {
        return String(str).length * 2;
    }
}

async function getStorageEstimate() {
    try {
        if (navigator.storage && typeof navigator.storage.estimate === 'function') {
            const { usage, quota } = await navigator.storage.estimate();
            return { usage: usage || 0, quota: quota || 0 };
        }
    } catch (e) {
        // ignore
    }
    return null;
}

function hasEnoughQuota(sizeNeeded) {
    // devuelve una Promise<boolean>
    return new Promise(async (resolve) => {
        try {
            const est = await getStorageEstimate();
            if (!est || typeof est.quota !== 'number' || typeof est.usage !== 'number') return resolve(true);
            const free = est.quota - est.usage;
            // reservar un margen de 50KB
            return resolve(free > (sizeNeeded + 1024 * 50));
        } catch (e) {
            return resolve(true);
        }
    });
}

// Guardar en caché en la forma original (síncrona desde el llamante, pero con comprobaciones asíncronas internas)
let _cacheDebounceTimer = null;
function storeCompressedCacheDebounced(cacheKey, data) {
    if (_cacheDebounceTimer) clearTimeout(_cacheDebounceTimer);
    _cacheDebounceTimer = setTimeout(() => {
        storeCompressedCache(cacheKey, data);
    }, 2000);
}

function storeCompressedCache(cacheKey, data) {
    try {
        const pruned = pruneData(data);

        // Para claves de datos masivos preferir IndexedDB directamente
        if (String(cacheKey).startsWith('misericordia_data_')) {
            // intentar IndexedDB siempre primero para datos grandes
            saveToIndexedDB(cacheKey, pruned).then(function() {
                try { sessionStorage.setItem(cacheKey + '_indexeddb', '1'); } catch (e) { /* noop */ }
            }).catch(function(err) {
                console.warn('saveToIndexedDB falló, intentando sessionStorage como fallback', err);
                // intentar almacenar comprimido en sessionStorage si hay cuota
                tryStoreInSession(cacheKey, pruned);
            });
            return;
        }

        const json = JSON.stringify(pruned);
        let compressed = null;
        if (typeof LZString !== 'undefined' && typeof LZString.compressToUTF16 === 'function') {
            try { compressed = LZString.compressToUTF16(json); } catch (e) { compressed = null; }
        }
        const toStore = compressed || json;
        const bytesNeeded = estimateSizeOfString(toStore);

        // Comprobar cuota antes de intentar setItem para evitar excepción de "QuotaExceeded"
        hasEnoughQuota(bytesNeeded).then(has => {
            if (has) {
                try {
                    sessionStorage.setItem(cacheKey, toStore);
                    try { sessionStorage.removeItem(cacheKey + '_indexeddb'); } catch (e) {}
                    return;
                } catch (e) {
                    console.warn('sessionStorage.setItem falló (a pesar de estimación positiva):', e);
                    // Si falla por cualquier razón, intentar IndexedDB
                    saveToIndexedDB(cacheKey, pruned).then(function() {
                        try { sessionStorage.setItem(cacheKey + '_indexeddb', '1'); } catch (e) {}
                    }).catch(function(err) {
                        console.error('Guardar en IndexedDB falló también:', err);
                    });
                    return;
                }
            } else {
                // No hay cuota suficiente para sessionStorage: guardar en IndexedDB
                saveToIndexedDB(cacheKey, pruned).then(function() {
                    try { sessionStorage.setItem(cacheKey + '_indexeddb', '1'); } catch (e) { /* noop */ }
                }).catch(function(err) {
                    console.error('Guardar en IndexedDB falló también (sin cuota en sessionStorage):', err);
                });
                return;
            }
        }).catch(err => {
            // Si hubo algún error al estimar, intentar el flujo tradicional y tratar errores
            try {
                sessionStorage.setItem(cacheKey, toStore);
                try { sessionStorage.removeItem(cacheKey + '_indexeddb'); } catch (e) {}
                return;
            } catch (e) {
                console.warn('sessionStorage.setItem falló (fallback):', e);
                const isQuota = (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)) || /quota/i.test(String(e));
                if (isQuota) {
                    saveToIndexedDB(cacheKey, pruned).then(function() {
                        try { sessionStorage.setItem(cacheKey + '_indexeddb', '1'); } catch (e) {}
                    }).catch(function(err) {
                        console.error('Guardar en IndexedDB falló también:', err);
                    });
                    return;
                }
                console.warn('Error guardando caché:', e);
            }
        });
    } catch (e) {
        console.warn('Error guardando caché (sincrónico):', e);
    }
}

// Intentar guardar en sessionStorage como fallback
function tryStoreInSession(cacheKey, dataObj) {
    try {
        const json = JSON.stringify(dataObj);
        // Intentar comprimir primero para reducir tamaño
        if (typeof LZString !== 'undefined' && typeof LZString.compressToUTF16 === 'function') {
            try {
                const compressed = LZString.compressToUTF16(json);
                const bytes = estimateSizeOfString(compressed);
                return hasEnoughQuota(bytes).then(has => {
                    if (has) {
                        try { sessionStorage.setItem(cacheKey, compressed); return true; } catch (e) { /* continue */ }
                    }
                    // si no hay cuota suficiente, intentar sin comprimir (raro)
                    try { sessionStorage.setItem(cacheKey, json); return true; } catch (e) { console.warn('tryStoreInSession falló (sin espacio):', e); return false; }
                }).catch(err => {
                    // si la comprobación de cuota falla, intentar escribir directamente
                    try { sessionStorage.setItem(cacheKey, compressed); return true; } catch (e) { try { sessionStorage.setItem(cacheKey, json); return true; } catch (e2) { console.warn('tryStoreInSession falló:', e2); return false; } }
                });
            } catch (e) {
                // compresión falló, intentar sin comprimir
            }
        }

        // Si no hay LZString o compresión falló
        const bytes = estimateSizeOfString(json);
        return hasEnoughQuota(bytes).then(has => {
            if (has) {
                try { sessionStorage.setItem(cacheKey, json); return true; } catch (e) { console.warn('tryStoreInSession falló al guardar json:', e); return false; }
            }
            return false;
        }).catch(err => {
            try { sessionStorage.setItem(cacheKey, json); return true; } catch (e) { console.warn('tryStoreInSession falló (catch):', e); return false; }
        });
    } catch (e) {
        console.warn('tryStoreInSession falló (sincrónico):', e);
        return Promise.resolve(false);
    }
}

// Recuperar y parsear la cadena cacheada, soportando JSON sin comprimir o LZ-String compressed UTF16
function loadCachedData(cacheKey) {
    // Siempre devolver una Promise para simplificar llamantes
    return new Promise((resolve) => {
        try {
            const raw = sessionStorage.getItem(cacheKey);
            if (raw) {
                // detección simple: si empieza por { o [ lo tratamos como JSON sin comprimir
                try {
                    const firstChar = raw.trim()[0];
                    if (firstChar === '{' || firstChar === '[') {
                        resolve(JSON.parse(raw));
                        return;
                    }
                } catch (e) {
                    // continue to try decompress
                }

                if (typeof LZString !== 'undefined' && typeof LZString.decompressFromUTF16 === 'function') {
                    try {
                        const decompressed = LZString.decompressFromUTF16(raw);
                        if (decompressed) { resolve(JSON.parse(decompressed)); return; }
                    } catch (e) {
                        console.warn('Error descomprimiendo cache LZString:', e);
                    }
                }

                try { resolve(JSON.parse(raw)); return; } catch (e) { console.warn('No se pudo parsear cadena de caché:', e); }
            }
        } catch (e) {
            console.warn('Error leyendo sessionStorage en loadCachedData:', e);
        }

        // Si no hay raw en sessionStorage, verificar marcador de fallback a IndexedDB
        try {
            const marker = sessionStorage.getItem(cacheKey + '_indexeddb');
            if (marker) {
                loadFromIndexedDB(cacheKey).then(result => resolve(result)).catch(err => { console.warn('loadFromIndexedDB falló:', err); resolve(null); });
                return;
            }
        } catch (e) { /* noop */ }

        resolve(null);
    });
}

function isNetworkError(error) {
    return isNetworkFailureReason(error);
}

function shouldRetryRequest(error) {
    const status = Number(error && error.status);
    const message = (error && (error.message || String(error))) || '';
    if (!Number.isFinite(status) && !(error && error.name === 'AbortError')) {
        return true;
    }
    if (error && error.name === 'AbortError') return false;
    if ([400, 401, 403, 404, 422].includes(status)) return false;
    if (/Apps Script HTTP 404|Web App.*desplegado|APPS_SCRIPT_API_URL|no devolvió JSON|No se pudo comunicar con el servidor de Apps Script/i.test(message)) {
        return false;
    }
    return true;
}

// IndexedDB helpers (promesas simples) — singleton connection
let _idbInstance = null;
function openIDB() {
    if (_idbInstance) return Promise.resolve(_idbInstance);
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
        const req = indexedDB.open('admiser-cache', 1);
        req.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
        };
        req.onsuccess = function(e) { _idbInstance = e.target.result; resolve(_idbInstance); };
        req.onerror = function(e) { reject(e.target.error || new Error('openIDB error')); };
    });
}

function saveToIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
        openIDB().then(db => {
            const tx = db.transaction('data', 'readwrite');
            const store = tx.objectStore('data');
            const req = store.put(value, key);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error || new Error('put error')); };
        }).catch(reject);
    });
}

function loadFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        openIDB().then(db => {
            const tx = db.transaction('data', 'readonly');
            const store = tx.objectStore('data');
            const req = store.get(key);
            req.onsuccess = function(e) { resolve(e.target.result); };
            req.onerror = function(e) { reject(e.target.error || new Error('get error')); };
        }).catch(reject);
    });
}

function showNetworkStatusToast(html, classes = 'blue darken-2 rounded', displayLength = 4000) {
    if (typeof M !== 'undefined' && M && typeof M.toast === 'function') {
        M.toast({ html, classes, displayLength });
    }
}

/*
// =========================================================================
// ⚙️ PETICIONES HTTP Y MOCK DE google.script.run (DESACTIVADO PARA SUPABASE)
// =========================================================================
async function sendRequestToServer(action, args, operationId, targetEndpoint = null) {
    // Save synchronously so confirmation does not wait for the periodic RTDB worker.
    const requestId = createRequestId();
    const isCourseLoad = action === 'cargarTodoElCurso';
    const isSaveAction = [
        'saveStudentData',
        'saveStudentDataBatch',
        'saveStudentDataGridBatch'
    ].includes(action);
    const authAction = ['verificarOTPGetPlanillas', 'validarSesionActiva', 'enviarCodigoPorCorreo'].includes(action);
    const endpoint = targetEndpoint || API_URL;
    const controller = new AbortController();
    const requestTimeoutMs = isSaveAction
        ? SAVE_REQUEST_TIMEOUT_MS
        : (isCourseLoad ? COURSE_LOAD_TIMEOUT_MS : AUTH_REQUEST_TIMEOUT_MS);
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    const peticionHttp = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            ...(APPS_SCRIPT_API_URLS.includes(endpoint) ? {} : { 'X-Request-Id': requestId })
        },
        body: JSON.stringify({ action, payload: args, requestId, operationId: operationId || null }),
        ...(controller ? { signal: controller.signal } : {})
    };

    try {
        const res = await fetch(endpoint, peticionHttp);
        if (!res.ok) {
            // Solo conmutar a conexión directa si la ruta /api no existe en el servidor (404 en Live Server estático)
            if (res.status === 404 && !APPS_SCRIPT_API_URLS.includes(endpoint)) {
                console.warn('El proxy local /api no existe (404). Conmutando a conexión directa con Apps Script.');
                API_URL = getRandomAppsScriptUrl();
                return sendRequestToServer(action, args, operationId);
            }
            if (res.status >= 500) {
                handleConnectionFailure(`Servidor no disponible (${res.status})`);
            }
            let bodyText = '';
            try { bodyText = await res.text(); } catch (e) { bodyText = '<no body>'; }
            let bodyJson = null;
            try {
                bodyJson = JSON.parse(bodyText);
                detalle = bodyJson.message || bodyJson.error || bodyText;
                if (bodyJson.upstreamStatus) {
                    detalle += ` (Apps Script HTTP ${bodyJson.upstreamStatus})`;
                }
            } catch (e) {}
            const diagnostico = {
                status: res.status,
                statusText: res.statusText,
                detail: detalle,
                action,
                requestId,
                endpoint,
                upstreamDetails: bodyJson ? bodyJson.details : null
            };
            console.error('Error HTTP de la API:\n' + JSON.stringify(diagnostico, null, 2));
            const serverError = new Error(`Error del servidor: ${res.status} - ${detalle}`);
            serverError.status = res.status;
            throw serverError;
        }
        handleConnectionRecovered();
        const contentType = res.headers.get('content-type') || '';
        const responseText = await res.text();
        if (!/application\/json/i.test(contentType)) {
            if (!APPS_SCRIPT_API_URLS.includes(endpoint)) {
                console.warn('El endpoint del proxy devolvió HTML en lugar de JSON. Conmutando a conexión directa con Apps Script.');
                API_URL = getRandomAppsScriptUrl();
                return sendRequestToServer(action, args, operationId);
            }
            const preview = responseText.replace(/\s+/g, ' ').trim().slice(0, 180);
            const responseError = new Error('El proxy devolvió HTML en lugar de JSON. Ejecuta la aplicación con Netlify Dev (npx netlify dev). Respuesta: ' + preview);
            responseError.status = res.status;
            responseError.code = 'INVALID_RESPONSE_CONTENT_TYPE';
            throw responseError;
        }
        try {
            return JSON.parse(responseText);
        } catch (parseError) {
            const responseError = new Error('El proxy devolvió JSON inválido: ' + parseError.message);
            responseError.status = res.status;
            responseError.code = 'INVALID_RESPONSE_JSON';
            throw responseError;
        }
    } catch (err) {
        if (!APPS_SCRIPT_API_URLS.includes(endpoint) && !(err && err.name === 'AbortError') && isNetworkError(err)) {
            console.warn('Fallo de conexión con el proxy /api. Conmutando a conexión directa con Apps Script...');
            API_URL = getRandomAppsScriptUrl();
            return sendRequestToServer(action, args, operationId);
        }
        if (err && err.name === 'AbortError') {
            const timeoutError = new Error(`La acción ${action} superó el tiempo máximo de ${requestTimeoutMs / 1000} segundos.`);
            timeoutError.code = 'REQUEST_TIMEOUT';
            timeoutError.requestId = requestId;
            throw timeoutError;
        }
        handleConnectionFailure(err && err.message ? err.message : 'Error de conexión');
        throw err;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

function handleResponseData(data, handlers) {
    if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
        if (data.success) {
            const payload = data.hasOwnProperty('data') ? data.data : data;
            if (payload && typeof payload === 'object' && (payload.error === true || payload.success === false)) {
                const error = Object.assign(new Error(payload.message || payload.error), payload);
                if (handlers._onFailure) handlers._onFailure(error);
                return;
            }
            if (handlers._onSuccess) handlers._onSuccess(payload);
        } else {
            const error = Object.assign(new Error(data.message || 'Error del servidor'), data);
            if (handlers._onFailure) handlers._onFailure(error);
        }
    } else {
        if (handlers._onSuccess) handlers._onSuccess(data);
    }
}

async function executeNetworkRequest(request) {
    if (!navigator.onLine) return false;

    try {
        const data = await sendRequestToServer(request.action, request.args, request.operationId);
        handleResponseData(data, request.handlers);
        return true;
    } catch (err) {
        if (isNetworkError(err)) return false;
        const noReintentarAutenticacion =
            ['verificarOTPGetPlanillas', 'validarSesionActiva', 'enviarCodigoPorCorreo']
                .includes(request.action) &&
            Number(err && err.status) === 504;

        // Fallback de rescate híbrido silencioso para autenticación:
        // Si el proxy devolvió 504 y aún no intentamos el rescate directo,
        // intentamos una vez más de forma transparente comunicándonos directamente
        // con un nodo de Apps Script (evitando el límite de 25s de Netlify).
        if (noReintentarAutenticacion && !request.directRescueAttempted) {
            request.directRescueAttempted = true;
            console.warn(`[Fallback Rescate] El proxy devolvió 504 para ${request.action}. Reintentando silenciosamente directo contra Apps Script...`);
            const directUrl = getRandomAppsScriptUrl();
            try {
                const rescueData = await sendRequestToServer(request.action, request.args, request.operationId, directUrl);
                handleResponseData(rescueData, request.handlers);
                return true;
            } catch (rescueErr) {
                console.error(`[Fallback Rescate] El intento directo también falló:`, rescueErr);
                if (request.handlers._onFailure) {
                    request.handlers._onFailure(rescueErr instanceof Error ? rescueErr : new Error(String(rescueErr)));
                }
                return true;
            }
        }

        if (noReintentarAutenticacion || !shouldRetryRequest(err)) {
            if (request.handlers._onFailure) request.handlers._onFailure(err instanceof Error ? err : new Error(String(err)));
            return true;
        }

        const maxRetries = request.action === 'cargarTodoElCurso'
            ? COURSE_LOAD_RETRY_MAX
            : NETWORK_RETRY_MAX;
        if ([
            'saveStudentData',
            'saveStudentDataBatch',
            'saveStudentDataGridBatch'
        ].includes(request.action)) {
            if (request.handlers._onFailure) {
                request.handlers._onFailure(err instanceof Error ? err : new Error(String(err)));
            }
            return true;
        }
        if (request.attempts < maxRetries) {
            request.attempts += 1;
            const jitter = Math.floor(Math.random() * 2000);
            const exponentialDelay = NETWORK_RETRY_DELAY_MS * Math.pow(2, request.attempts - 1);
            await delay(exponentialDelay + jitter);
            return executeNetworkRequest(request);
        }

        if (request.handlers._onFailure) request.handlers._onFailure(err instanceof Error ? err : new Error(String(err)));
        return true;
    }
}

function queueNetworkRequest(request) {
    request.attempts = request.attempts || 0;
    pendingRequestQueue.push(request);
    if (pendingRequestQueue.length === 1) {
        showNetworkStatusToast('📥 Petición en cola. Se enviará cuando la conexión esté disponible.', 'orange darken-3 rounded', 5000);
    }
    processPendingRequests();
}

async function processPendingRequests() {
    if (isProcessingPendingQueue || pendingRequestQueue.length === 0 || !navigator.onLine) return;
    isProcessingPendingQueue = true;

    while (pendingRequestQueue.length > 0 && navigator.onLine) {
        const request = pendingRequestQueue[0];
        const completed = await executeNetworkRequest(request);
        if (completed === false) break;
        pendingRequestQueue.shift();
        await delay(200);
    }

    isProcessingPendingQueue = false;
}

if (typeof google === 'undefined') {
    window.google = {
        script: {
            run: (function makeRunner(handlers = {}) {
                return new Proxy({}, {
                    get: function(target, prop) {
                        if (prop === 'withSuccessHandler') return (fn) => makeRunner({ ...handlers, _onSuccess: fn });
                        if (prop === 'withFailureHandler') return (fn) => makeRunner({ ...handlers, _onFailure: fn });

                        return function(...args) {
                            let operationId = IDEMPOTENT_ACTIONS.has(prop) ? createOperationId() : null;
                            if (prop === 'saveStudentDataGridBatch') {
                                const suppliedOperationId = args[3];
                                if (typeof suppliedOperationId === 'string' &&
                                    /^[A-Za-z0-9_-]{8,120}$/.test(suppliedOperationId)) {
                                    operationId = suppliedOperationId;
                                } else {
                                    operationId = createOperationId();
                                    args[3] = operationId;
                                }
                            }
                            const request = {
                                action: prop,
                                args,
                                operationId,
                                handlers,
                                attempts: 0
                            };

                            const executeRequest = async () => {
                                if (!navigator.onLine) {
                                    queueNetworkRequest(request);
                                    return;
                                }

                                const completed = await executeNetworkRequest(request);
                                if (completed === false) {
                                    queueNetworkRequest(request);
                                }
                            };

                            executeRequest().catch(err => {
                                console.error('Error al ejecutar la petición:', err);
                                if (handlers._onFailure) handlers._onFailure(err instanceof Error ? err : new Error(JSON.stringify(err)));
                            });
                        };
                    }
                });
            })()
        }
    };
}
*/
function processPendingRequests() {}

// Variables globales del DOM
const selectPlanilla = document.getElementById('select-planilla'); 
const selectHoja = document.getElementById('select-hoja');
const selectAlumno = document.getElementById('select-alumno');
const loader = document.getElementById('loader');

const saveButtonContainer = document.getElementById('save-button-container');
const btnGuardar = document.getElementById('btn-guardar');
const btnSiguiente = document.getElementById('btn-siguiente');
const btnAnterior = document.getElementById('btn-anterior');
const contenedorOriginalGuardar = btnGuardar ? btnGuardar.parentElement : null;

// Variables de estado y memoria
let currentSpreadsheetId = null; 
let watchdogTimer = null;
let emailProcesando = ""; 

function normalizarCorreoCliente(correo) {
    return String(correo || '')
        .normalize('NFKC')
        .replace(/[\u0000-\u001F\u007F\u00A0\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, '')
        .replace(/^['"]+|['"]+$/g, '')
        .toLowerCase();
}
let cursoCompleto = null;
// 🚀 PERF: Índice O(1) por DNI — se construye en procesarTodoElCurso()
let studentsByDni = new Map();
let cambiosPendientes = false;
let mapaPlanillas = {}; 
let mapaPlanillasSoloLectura = {};
let ultimaGuardadoHojaActual = 0;
let ultimoPdfGenerado = null;
const hojasGuardando = new Set(); 
const cambiosGrillaEspecial = new Map();
let guardadoGrillaEspecialEnCurso = null;
let guardadoGrillaOperacionId = null;
const AUDIT_PAGE_SIZE = 50;
let hojasModificadasDelAlumno = new Set();
let HOJA_ACTUAL_SELECCIONADA = "";
let isGuardandoLote = false;
let _currentSession = { sessionId: null, gradeId: null, heartbeatTimer: null };

function actualizarModoSoloLectura() {
    if (!btnGuardar) return;
    btnGuardar.disabled = Boolean(window.planillaSoloLectura);
    if (window.planillaSoloLectura) {
        btnGuardar.textContent = 'Solo lectura';
        btnGuardar.classList.remove('orange', 'red');
        btnGuardar.classList.add('grey');
    }
}

// Funciones callable
let firebaseReserve = null;
let firebaseRelease = null;
let firebaseTouch = null;

const CONFIG_MATERIAS = [
    { key: 'DATOS', icono: 'person', nombre: 'Datos' },
    { key: 'ASISTENCIA', icono: 'event_available', nombre: 'Asistencia y Conducta' },
    { key: 'CONDUCTA', icono: 'event_available', nombre: 'Asistencia y Conducta' },
    { key: 'PLANILLAS_CALIF_MAT', icono: 'calculate', nombre: 'Planilla Matemática' },
    { key: 'PLANILLAS_CALIF_LENG', icono: 'menu_book', nombre: 'Planilla Lengua' },
    { key: 'PROMOCION', icono: 'assignment_turned_in', nombre: 'Planilla de Promoción' },
    { key: 'MAT', icono: 'calculate', nombre: 'Notas: Matemática' },
    { key: 'LENG', icono: 'menu_book', nombre: 'Notas: Lengua' },
    { key: 'SOCIALES', icono: 'public', nombre: 'Notas: Cs. Sociales' },
    { key: 'NATURALES', icono: 'science', nombre: 'Notas: Cs. Naturales' },
    { key: 'ESPECIALES', icono: 'palette', nombre: 'Notas: Áreas Especiales' },
    { key: 'BOLETIN', icono: 'receipt', nombre: 'Boletines de Calificaciones' }
];

function obtenerInfoHoja(name) {
    const upperName = name.toUpperCase();
    if (upperName === "SISTEMA_AUDITORIA") return { icono: 'security', nombre: "Auditoría de Cambios" };
    const config = CONFIG_MATERIAS.find(c => upperName.includes(c.key));
    if (config) return { icono: config.icono, nombre: config.nombre };
    return { icono: 'insert_drive_file', nombre: name.replace(/_/g, ' ') };
}

function obtenerValorCampo(datos, campo) {
    if (!datos || typeof datos !== 'object') return undefined;
    if (datos.hasOwnProperty(campo)) return datos[campo];
    const campoUpper = String(campo).toUpperCase().trim();
    for (const key of Object.keys(datos)) {
        if (String(key).toUpperCase().trim() === campoUpper) return datos[key];
    }
    return undefined;
}

function obtenerPesoSexo(sexo) {
    const value = String(sexo || '').toUpperCase().trim();
    if (value === 'V' || value === 'VARON' || value === 'VARÓN' || value === 'MASCULINO') return 1;
    if (value === 'M' || value === 'MUJER' || value === 'FEMENINO') return 2;
    return 3;
}

function compararAlumnosPorSexoYNombre(a, b) {
    const numA = (a.datosHojas && a.datosHojas["DATOS"] && (a.datosHojas["DATOS"]["NRO."] || a.datosHojas["DATOS"]["Nro."])) || a.numeroOrden;
    const numB = (b.datosHojas && b.datosHojas["DATOS"] && (b.datosHojas["DATOS"]["NRO."] || b.datosHojas["DATOS"]["Nro."])) || b.numeroOrden;
    if (numA && numB && !isNaN(Number(numA)) && !isNaN(Number(numB)) && Number(numA) !== Number(numB)) {
        return Number(numA) - Number(numB);
    }

    const datosA = (a.datosHojas && a.datosHojas["DATOS"]) ? a.datosHojas["DATOS"] : {};
    const datosB = (b.datosHojas && b.datosHojas["DATOS"]) ? b.datosHojas["DATOS"] : {};

    const pesoA = obtenerPesoSexo(obtenerValorCampo(datosA, "SEXO"));
    const pesoB = obtenerPesoSexo(obtenerValorCampo(datosB, "SEXO"));
    if (pesoA !== pesoB) return pesoA - pesoB;

    const apellidoA = String(obtenerValorCampo(datosA, "APELLIDO") || "").trim();
    const apellidoB = String(obtenerValorCampo(datosB, "APELLIDO") || "").trim();
    const compareApellido = apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' });
    if (compareApellido !== 0) return compareApellido;

    const nombreA = String(obtenerValorCampo(datosA, "NOMBRE") || "").trim();
    const nombreB = String(obtenerValorCampo(datosB, "NOMBRE") || "").trim();
    const compareNombre = nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    if (compareNombre !== 0) return compareNombre;

    const nombreCompletoA = String(a.nombreCompleto || "").trim();
    const nombreCompletoB = String(b.nombreCompleto || "").trim();
    const compareNombreCompleto = nombreCompletoA.localeCompare(nombreCompletoB, 'es', { sensitivity: 'base' });
    if (compareNombreCompleto !== 0) return compareNombreCompleto;

    return String(a.dni || "").localeCompare(String(b.dni || ""), 'es', { sensitivity: 'base' });
}

function obtenerHojaOrdenEspecial(data) {
    const hojas = data.sheetOrder || [];
    return hojas.find(nombreHoja => String(nombreHoja).toUpperCase().includes('ESPECIAL')) ||
        hojas.find(nombreHoja => {
        const upper = String(nombreHoja).toUpperCase();
        return upper !== 'DATOS' && upper !== 'SISTEMA_AUDITORIA' &&
            !upper.includes('BOLETIN');
        }) || null;
}

function obtenerNumeroOrdenEspecial(alumno, nombreHoja) {
    const datosHoja = nombreHoja && alumno.datosHojas ? alumno.datosHojas[nombreHoja] || {} : {};
    const valor = Object.keys(datosHoja).reduce((encontrado, clave) => {
        if (encontrado !== undefined) return encontrado;
        const claveNormalizada = String(clave)
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().replace(/[^A-Z0-9]/g, '');
        return ['NRO', 'NUMERO', 'NUMERODEORDEN', 'ORDEN'].includes(claveNormalizada)
            ? datosHoja[clave]
            : undefined;
    }, undefined);
    const texto = String(valor === undefined || valor === null ? '' : valor).replace(',', '.').trim();
    if (!texto) return Number.MAX_SAFE_INTEGER;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : Number.MAX_SAFE_INTEGER;
}

function ordenarAlumnosParaEspecial(data) {
    const hojaOrden = obtenerHojaOrdenEspecial(data);
    data.students.sort((a, b) => {
        const ordenA = obtenerNumeroOrdenEspecial(a, hojaOrden);
        const ordenB = obtenerNumeroOrdenEspecial(b, hojaOrden);
        return ordenA - ordenB;
    });
    return hojaOrden;
}

function esCampoDeNota(header, nombreHoja = '') {
    if (!header) return false;
    const h = String(header)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
    if (!h) return false;
    const hHoja = String(nombreHoja || '').toUpperCase();
    if (hHoja === 'DATOS' || hHoja.includes('ASISTENCIA') || hHoja.includes('AUDITORIA')) return false;

    const palabrasExcluidas = [
        'DNI', 'NRO', 'NUMERO', 'ORDEN', 'APELLIDO', 'NOMBRE', 'ALUMNO', 'SEXO', 'EDAD',
        'FECHA', 'ACTIVO', 'ESTADO', 'OCULTO', 'CONDUCTA', 'JUSTIFICA', 'INJUSTIFICA',
        'FALTA', 'ASISTENCIA', 'OBSERV', 'COMENT', 'RECOMEND', 'FIRMA', 'MAESTRA',
        'CURSO', 'DIVISION', 'GRADO', 'SECCION', 'TEL', 'CEL'
    ];
    if (palabrasExcluidas.some(p => h.includes(p))) return false;
    if (h.startsWith('_')) return false;
    return true;
}

function formatearNotaADosDecimales(valor) {
    if (valor === null || valor === undefined) return '';
    const str = String(valor).trim().replace(/,/g, '.');
    if (str === '') return '';
    const num = Number(str);
    if (isNaN(num)) return str;
    let n = num;
    if (n < 1 && n > 0) n = 1;
    if (n > 10) n = 10;
    return (Math.trunc(n * 100 + 1e-9) / 100).toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('offline', () => {
        handleConnectionFailure('Sin conexión a Internet');
        M.toast({
            html: '🔌 Sin conexión a Internet. Esperando red...', 
            classes: 'red darken-3 rounded', 
            displayLength: 5000
        });
        if (btnGuardar) btnGuardar.classList.add('pulse', 'orange');
    });

    window.addEventListener('online', () => {
        handleConnectionRecovered();
        if (btnGuardar) btnGuardar.classList.remove('pulse', 'orange');
        processPendingRequests();
    });

    window.addEventListener('error', (event) => {
        const message = (event && event.message) || '';
        const targetSrc = (event && event.target && event.target.src) ? String(event.target.src) : '';
        const esErrorRed = /ERR_CONNECTION_TIMED_OUT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|Failed to load resource|net::ERR_/i.test(message + ' ' + targetSrc);
        if (esErrorRed) {
            handleConnectionFailure('Fallo de conexión al servidor');
        }
    }, true);

    // Escuchar cambios de sesión en storage (otras pestañas/dispositivos)
    window.addEventListener('storage', (e) => {
        try {
            if (e.key === 'misericordia_sesion' || e.key === 'misericordia_session') {
                // Si la clave fue removida o vaciada, ocultar controles administrativos
                if (!e.newValue) {
                    window.esUsuarioAdmin = false;
                    if (typeof actualizarVisibilidadAdmin === 'function') actualizarVisibilidadAdmin();
                }
            }
        } catch (err) {
            console.warn('Error manejando evento storage:', err);
        }
    });

    try {
        const originalToast = M.toast;
        const TOAST_ICON_MAP = [
            { regex: /\b(correo|email)\b/i, icon: 'email' },
            { regex: /\b(código|contraseña|otp|clave)\b/i, icon: 'vpn_key' },
            { regex: /\b(guardando|guardado|guardados|guardá|guardé)\b/i, icon: 'save' },
            { regex: /\b(dashboard|gráficos|estadísticas|stats?)\b/i, icon: 'dashboard' },
            { regex: /\b(alumno ocultado|ocultado|ocultar|oculta)\b/i, icon: 'visibility_off' },
            { regex: /\b(error|no autorizado|no se encontró|problema|red|conexión)\b/i, icon: 'error_outline' },
            { regex: /\b(exitoso|correcto|actualizado|completado|enviado|listo|terminado)\b/i, icon: 'check_circle' },
            { regex: /\b(lista|inicio|fin)\b/i, icon: 'format_list_bulleted' },
            { regex: /\b(nuevo mensaje|mensaje en|sala general|grupo)\b/i, icon: 'chat' },
            { regex: /\b(firebase|base de datos|servidor)\b/i, icon: 'cloud_off' }
        ];

        function obtenerIconoToast(texto) {
            const textoLimpio = String(texto || '');
            for (const entrada of TOAST_ICON_MAP) {
                if (entrada.regex.test(textoLimpio)) return entrada.icon;
            }
            return 'info';
        }

        function aplicarIconoToast(options) {
            if (!options || typeof options.html !== 'string') return options;
            const contenedorTemporal = document.createElement('div');
            contenedorTemporal.innerHTML = options.html;
            const yaTieneIcono = contenedorTemporal.querySelector('.material-icons, .toast-icon, i') !== null;
            if (yaTieneIcono) return options;

            let textoLimpio = options.html.replace(/^(✅|❌|💾|⏳|🗑️)\s*/g, '').trim();
            const icon = options.icon || obtenerIconoToast(textoLimpio);
            
            if (!icon) {
                options.html = textoLimpio;
                return options;
            }
            options.html = `<i class="material-icons left toast-icon">${icon}</i>${textoLimpio}`;
            return options;
        }

        M.toast = function(options) {
            M.Toast.dismissAll();
            return originalToast.call(M, aplicarIconoToast(options));
        };

        const contenidoHojas = document.getElementById('contenido-hojas');
        if (contenidoHojas) {
            contenidoHojas.addEventListener('input', manejarCambioInputDelegado);
            contenidoHojas.addEventListener('change', manejarCambioInputDelegado);
            contenidoHojas.addEventListener('focusout', manejarCambioInputDelegado);
        }

        const btnTengoClave = document.getElementById('btn-tengo-clave');
        if(btnTengoClave) {
            btnTengoClave.addEventListener('click', () => {
                const emailInput = normalizarCorreoCliente(document.getElementById('email-profesor').value);
                if (emailInput === "") {
                    M.toast({html: 'Por favor, ingresa tu correo.', classes: 'orange darken-3'});
                    return;
                }
                emailProcesando = emailInput;
                document.getElementById('paso-correo').style.display = 'none';
                document.getElementById('paso-codigo').style.display = 'block';
                M.toast({html: 'Ingresa tu contraseña de 6 dígitos', classes: 'blue'});
            });
        }

        M.FormSelect.init(document.querySelectorAll('select'));
        M.Modal.init(document.querySelectorAll('.modal'));
        const triggerMenuInit = document.getElementById('btn-menu-acciones-trigger');
        if (triggerMenuInit && typeof M !== 'undefined' && M.Dropdown) {
            M.Dropdown.init(triggerMenuInit, {
                coverTrigger: false,
                constrainWidth: false,
                alignment: 'right',
                closeOnClick: true,
                container: document.body
            });
        }
        
        // Inject styles for the PDF button group (align and make responsive)
        if (!document.getElementById('pdf-button-group-styles')) {
            const style = document.createElement('style');
            style.id = 'pdf-button-group-styles';
            style.textContent = `
.pdf-button-group{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-bottom:8px;}
.pdf-button-group .btn-generar-boletin{min-width:220px;white-space:nowrap;}
.pdf-button-group .btn-pdf-icon{height:40px;width:40px;display:inline-flex;align-items:center;justify-content:center}
@media (max-width:760px){
  .pdf-button-group{justify-content:center;flex-wrap:wrap;gap:8px;padding:6px 0}
  .pdf-button-group .btn-generar-boletin{width:100%;order:2}
  .pdf-button-group .btn-pdf-icon{order:1}
}
            `;
            document.head.appendChild(style);
        }
        
        // Expose handler to toggle the boletín icon (closed/open eye) and invoke the view action
        window.handleVerBoletinClick = function(btn) {
            try {
                // If caller passed no button, try to locate it
                if (!btn) btn = document.getElementById('btn-generar-pdf-boletin');
                if (!btn) return;
                const icon = btn.querySelector('i.material-icons');
                const active = btn.getAttribute('data-boletin-active') === 'true';
                const newActive = !active;
                btn.setAttribute('data-boletin-active', newActive ? 'true' : 'false');
                btn.setAttribute('aria-pressed', newActive ? 'true' : 'false');
                if (icon) icon.textContent = newActive ? 'visibility' : 'visibility_off';
            } catch (e) {
                console.warn('handleVerBoletinClick error', e);
            }

            // Call the original action (safe-call)
            try {
                const result = verBoletinDelAlumno();
                // If it returns a promise, optionally toggle back when resolved (not requested), so keep state as is.
                return result;
            } catch (e) {
                console.error('Error ejecutando verBoletinDelAlumno:', e);
            }
        };

        document.getElementById('btn-logout').addEventListener('click', () => {
            if (cambiosPendientes) {
                M.toast({html: '⏳ Guardando cambios antes de salir...', classes: 'orange darken-3'});
                ejecutarGuardadoLote(cerrarSesionSegura);
            } else {
                cerrarSesionSegura();
            }
        });

        const btnEnviarCodigo = document.getElementById('btn-enviar-codigo');
        const btnVerificarCodigo = document.getElementById('btn-verificar-codigo');
        const btnVolverCorreo = document.getElementById('btn-volver-correo');
        
        if(btnEnviarCodigo) btnEnviarCodigo.addEventListener('click', solicitarOTP);
        if(btnVerificarCodigo) btnVerificarCodigo.addEventListener('click', verificarOTP);
        if(btnVolverCorreo) {
            btnVolverCorreo.addEventListener('click', function(e) {
                e.preventDefault(); 
                document.getElementById('paso-codigo').style.display = 'none';
                document.getElementById('paso-correo').style.display = 'block';
                document.getElementById('codigo-otp').value = '';
            });
        }

        actualizarVisibilidadAdmin();

        selectAlumno.addEventListener('change', function(e) {
            const nuevoDni = this.value;
            const dniAnterior = window.dniAlumnoActual;
            forzarSincronizacionAntesDeGuardar();
            if (cambiosPendientes || hojasModificadasDelAlumno.size > 0) {
                if (btnGuardar) {
                    btnGuardar.textContent = 'Guardando en segundo plano...';
                    btnGuardar.disabled = true;
                    btnGuardar.classList.remove('grey', 'red');
                    btnGuardar.classList.add('orange');
                }
                const hojasPendientes = new Set(hojasModificadasDelAlumno);
                ejecutarGuardadoLote(null, dniAnterior, hojasPendientes);
                hojasModificadasDelAlumno.clear();
                cambiosPendientes = false;
            }
            cargarDatosDeAlumno();
        });
        
        // Reset del icono de ver boletín cuando se cambia de hoja
        if (typeof selectHoja !== 'undefined' && selectHoja) {
            selectHoja.addEventListener('change', function() {
                try {
                    const btn = document.getElementById('btn-generar-pdf-boletin');
                    if (btn) {
                        btn.setAttribute('data-boletin-active', 'false');
                        btn.setAttribute('aria-pressed', 'false');
                        const icon = btn.querySelector('i.material-icons');
                        if (icon) icon.textContent = 'visibility_off';
                    }
                } catch (e) { console.warn('Error reseteando icono boletín al cambiar hoja', e); }
            });
        }
        
        btnGuardar.addEventListener('click', guardarDatosDeAlumno);
        btnSiguiente.addEventListener('click', irAlSiguienteAlumno);
        btnAnterior.addEventListener('click', irAlAnteriorAlumno);

    const btnAuditoriaGlobal = document.getElementById('btn-auditoria-global');
        if (btnAuditoriaGlobal) {
            btnAuditoriaGlobal.addEventListener('click', () => {
                    if (!window.esUsuarioAdmin) {
                        M.toast({html: 'No autorizado. Acceso reservado al superusuario.', classes: 'red darken-3'});
                        return;
                    }
                    
                    // 🚀 CORRECCIÓN: Limpiar caché para forzar siempre la descarga de datos nuevos
                    window.auditPages = {};
                    window.auditNextTokens = {};
                    window.currentAuditPage = 1;

                    document.getElementById('panel-auditoria-global').style.display = 'block';
                    document.getElementById('section-selectors').style.display = 'none';
                    document.getElementById('panel-principal').style.display = 'none'; 
                    inicializarPanelAuditoriaVisual(document.getElementById('render-auditoria'));
                });
        }
        const btnCerrarAuditoria = document.getElementById('btn-cerrar-auditoria');
        if (btnCerrarAuditoria) {
            btnCerrarAuditoria.addEventListener('click', () => {
                document.getElementById('panel-auditoria-global').style.display = 'none';
                document.getElementById('section-selectors').style.display = 'block';
                if (currentSpreadsheetId) {
                    document.getElementById('panel-principal').style.display = 'block';
                }
            });
        }

        const sesionGuardada = sessionStorage.getItem('misericordia_sesion');
        if (sesionGuardada) {
            emailProcesando = sesionGuardada;
            // Optimización Stale-While-Revalidate: si ya tenemos la respuesta de planillas cacheada,
            // renderizar la interfaz de inmediato sin mostrar spinner de bloqueo
            let cacheRenderizado = false;
            try {
                const planillasCacheadas = sessionStorage.getItem('misericordia_planillas_cache');
                if (planillasCacheadas) {
                    const respuestaCache = JSON.parse(planillasCacheadas);
                    if (respuestaCache && respuestaCache.acceso && Array.isArray(respuestaCache.lista)) {
                        procesarRespuestaAcceso(respuestaCache, false);
                        cacheRenderizado = true;
                    }
                }
            } catch (eCache) {
                console.warn("No se pudo restaurar caché de planillas:", eCache);
            }

            if (!cacheRenderizado) {
                mostrarLoader(true);
            }

            supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
                mostrarLoader(false);
                const emailActivo = (session && session.user) ? session.user.email : sesionGuardada;
                if (emailActivo) {
                    try {
                        const cachedUser = sessionStorage.getItem('misericordia_usuario_info');
                        if (cachedUser) window.usuarioActual = JSON.parse(cachedUser);
                    } catch(e) {}
                    obtenerUsuarioAutorizado(emailActivo).then(u => {
                        if (u) {
                            window.usuarioActual = u;
                            try { sessionStorage.setItem('misericordia_usuario_info', JSON.stringify(u)); } catch(e) {}
                        }
                    }).catch(() => {});
                    const esAdmin = (window.usuarioActual && (window.usuarioActual.es_admin === true || window.usuarioActual.esAdmin === true)) ||
                                    emailActivo.toLowerCase() === 'misericordiaplanillas@gmail.com' ||
                                    emailActivo.toLowerCase() === 'victorojas2025@gmail.com';
                    let listaPlanillas = [];
                    try {
                        const planillasCacheadas = sessionStorage.getItem('misericordia_planillas_cache');
                        if (planillasCacheadas) {
                            const parsed = JSON.parse(planillasCacheadas);
                            if (parsed && Array.isArray(parsed.lista) && parsed.lista.length > 0) {
                                listaPlanillas = parsed.lista;
                            }
                        }
                    } catch(e) {}

                    if (listaPlanillas.length === 0 && typeof cargarPlanillasDesdeSupabase === 'function') {
                        listaPlanillas = await cargarPlanillasDesdeSupabase(emailActivo, esAdmin);
                    }

                    procesarRespuestaAcceso({
                        acceso: true,
                        email: emailActivo,
                        esAdmin,
                        lista: listaPlanillas
                    }, false);
                } else {
                    limpiarSesionGuardadaYMostrarLogin();
                }
            }).catch(error => {
                console.warn("Aviso validando sesión con Supabase:", error);
                mostrarLoader(false);
                if (!cacheRenderizado) {
                    document.getElementById('section-login').style.display = 'block';
                }
            });
        } else {
            document.getElementById('section-login').style.display = 'block';
        }

        window.addEventListener('beforeunload', function (e) {
            if (cambiosPendientes) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?';
            }
        });

        document.addEventListener("visibilitychange", function() {
            setTimeout(() => {
                try {
                    const correoParaChat = sessionStorage.getItem('misericordia_sesion');
                    if (correoParaChat && typeof dbChat !== 'undefined' && dbChat) {
                        const correoKey = correoParaChat.toLowerCase().trim().replace(/\./g, ',');
                        
                        if (document.visibilityState === 'hidden') {
                            dbChat.ref('usuarios_online/' + correoKey).update({ online: true, mirando_app: false });
                        } else if (document.visibilityState === 'visible') {
                            dbChat.ref('usuarios_online/' + correoKey).update({ online: true, mirando_app: true });
                        }
                    }
                } catch(err) {
                    console.warn("Error en visibilitychange:", err);
                }
            }, 0);
        });

    } catch (e) {
        alert("Error crítico en la interfaz. Por favor revisa la consola: " + e.message);
        console.error(e);
    }
});

function cerrarSesionSegura() {
    const correoParaChat = sessionStorage.getItem('misericordia_sesion');
    if (correoParaChat) {
        try {
            const saved = sessionStorage.getItem('misericordia_session');
            if (saved) {
                const obj = JSON.parse(saved);
                if (obj && obj.sessionId && obj.gradeId) {
                    _currentSession.sessionId = obj.sessionId;
                    _currentSession.gradeId = obj.gradeId;
                    if (firebaseTouch) {
                        firebaseTouch({ sessionId: obj.sessionId }).then(() => {
                            startHeartbeat(obj.sessionId);
                        }).catch(() => {
                            sessionStorage.removeItem('misericordia_session');
                            _currentSession = { sessionId: null, gradeId: null, heartbeatTimer: null };
                        });
                    }
                }
            }
        } catch (e) { console.warn('No se pudo restaurar session desde storage', e); }

        try {
            if (window.firebase && firebase.app) {
                const functions = firebase.functions();
                firebaseReserve = functions.httpsCallable('reserveGrade');
                firebaseRelease = functions.httpsCallable('releaseGrade');
                firebaseTouch = functions.httpsCallable('touchSession');
            }
        } catch (e) {
            console.warn('Firebase functions no inicializadas: ', e);
        }
    }

    sessionStorage.removeItem('misericordia_sesion');
    sessionStorage.removeItem('misericordia_session');
    sessionStorage.removeItem('misericordia_planillas_cache');
    if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
        supabaseClient.auth.signOut().catch(() => {});
    }
    if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
    }
    if (typeof emailProcesando !== 'undefined') emailProcesando = "";
    mostrarLoader(false);
    cursoCompleto = null;
    studentsByDni = new Map();
    currentSpreadsheetId = null;
    
    window.esUsuarioAdmin = false;
    // Actualizar visibilidad de controles administrativos al cerrar sesión
    try { if (typeof actualizarVisibilidadAdmin === 'function') actualizarVisibilidadAdmin(); } catch(e) { console.warn('No se pudo actualizar visibilidad admin:', e); }

    try {
        const ocultarElemento = (id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        };

        ocultarElemento('panel-auditoria-global');
        ocultarElemento('section-selectors');
        ocultarElemento('btn-abrir-planilla-directo');
        ocultarElemento('panel-principal');
        ocultarElemento('save-button-container');
        ocultarElemento('contenedor-boton-admin');
        ocultarElemento('btn-logout');
        ocultarElemento('user-email-display');
        ocultarElemento('paso-codigo');

        const badge = document.getElementById('badge-hoja-activa');
        if (badge) {
            badge.style.setProperty('display', 'none', 'important');
            badge.textContent = "";
        }
        
        if (typeof selectPlanilla !== 'undefined' && selectPlanilla) {
            selectPlanilla.value = '';
            selectPlanilla.disabled = true;
        }

        if (typeof selectHoja !== 'undefined' && selectHoja) {
            selectHoja.innerHTML = '<option value="" disabled selected>Seleccione una Hoja</option>';
            if (typeof habilitarSelect === 'function') habilitarSelect(selectHoja, false);
        }
        
        if (typeof selectAlumno !== 'undefined' && selectAlumno) {
            selectAlumno.innerHTML = '<option value="" disabled selected>Seleccione un Alumno</option>';
            if (typeof habilitarSelect === 'function') habilitarSelect(selectAlumno, false);
        }
        
        const emailInput = document.getElementById('email-profesor');
        if (emailInput) emailInput.value = '';
        
        const codigoInput = document.getElementById('codigo-otp');
        if (codigoInput) codigoInput.value = '';
        
        const pasoCorreo = document.getElementById('paso-correo');
        if (pasoCorreo) pasoCorreo.style.display = 'block';
        
        const sectionLogin = document.getElementById('section-login');
        if (sectionLogin) sectionLogin.style.display = 'block';

        if (typeof M !== 'undefined') {
            M.toast({html: 'Sesión cerrada correctamente', classes: 'blue darken-2'});
        }

    } catch(errorVista) {
        console.error("Fallo visual detectado, forzando cierre global:", errorVista);
        window.location.reload();
    }
}



function initFirebaseFunctions() {
    try {
        if (window.firebase && firebase.app) {
            const functions = firebase.functions();
            firebaseReserve = functions.httpsCallable('reserveGrade');
            firebaseRelease = functions.httpsCallable('releaseGrade');
            firebaseTouch = functions.httpsCallable('touchSession');
            console.log('Firebase functions inicializadas');
        }
    } catch (e) {
        console.warn('Error initFirebaseFunctions', e);
    }
}
window.initFirebaseFunctions = initFirebaseFunctions;

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        if (_currentSession.sessionId && firebaseTouch) {
            firebaseTouch({ sessionId: _currentSession.sessionId }).then(() => {
                startHeartbeat(_currentSession.sessionId);
            }).catch(err => {
                console.warn('touchSession on visibility failed', err);
                sessionStorage.removeItem('misericordia_session');
                _currentSession = { sessionId: null, gradeId: null, heartbeatTimer: null };
            });
        }
    }
});



async function releaseGradeClient() {
    if (!_currentSession.sessionId || !_currentSession.gradeId) return;
    const sessionId = _currentSession.sessionId;
    const gradeId = _currentSession.gradeId;
    const userId = emailProcesando || sessionStorage.getItem('misericordia_sesion') || '';

    if (firebaseRelease) {
        try {
            await firebaseRelease({ sessionId, gradeId });
        } catch (e) {
            console.warn('firebaseRelease error, will attempt Apps Script release', e);
        }
    } else {
        try {
            await new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).releaseGrade(sessionId, userId, gradeId);
            });
        } catch (e) {
            console.warn('Apps Script releaseGrade failed', e);
        }
    }

    try { clearInterval(_currentSession.heartbeatTimer); } catch(e){}
    sessionStorage.removeItem('misericordia_session');
    _currentSession = { sessionId: null, gradeId: null, heartbeatTimer: null };
}

async function startHeartbeat(sessionId) {
    if (_currentSession.heartbeatTimer) clearInterval(_currentSession.heartbeatTimer);
    const userId = emailProcesando || sessionStorage.getItem('misericordia_sesion') || '';
    _currentSession.heartbeatTimer = setInterval(async () => {
        if (firebaseTouch) {
            try {
                await firebaseTouch({ sessionId });
                return;
            } catch (e) {
                console.warn('firebase touchSession failed, falling back to Apps Script', e);
            }
        }

        try {
            await new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).touchSession(sessionId, userId);
            });
        } catch (err) {
            console.warn('touchSession (Apps Script) failed', err);
        }
    }, 26000); 
}

// Funciones auxiliares para consulta robusta de usuarios en Supabase (app_adm_config)
async function obtenerUsuarioAutorizado(emailBuscado) {
    const emailNorm = normalizarCorreoCliente(emailBuscado);
    if (!emailNorm) return null;

    try {
        const { data, error } = await supabaseClient
            .from('app_adm_config')
            .select('*');

        if (error) {
            console.error("Error al consultar app_adm_config en Supabase:", error);
            throw new Error(`Error en base de datos: ${error.message || 'Sin acceso a tabla'}`);
        }

        if (!data || !Array.isArray(data)) {
            console.warn("app_adm_config no devolvió una lista válida:", data);
            return null;
        }

        if (data.length === 0) {
            console.warn("app_adm_config está vacía o las políticas RLS bloquean la lectura anónima.");
            throw new Error("La tabla de docentes está vacía o protegida por RLS en Supabase.");
        }

        const usuariosCoincidentes = data.filter(fila => {
            const correoFila = normalizarCorreoCliente(
                fila.email || 
                fila.Email || 
                fila.EMAIL || 
                fila.correo || 
                fila.Correo || 
                fila['E-mail'] || 
                ''
            );
            return correoFila === emailNorm;
        });

        if (usuariosCoincidentes.length === 0) return null;

        usuariosCoincidentes.sort((a, b) => {
            const cantA = (Array.isArray(a.planillas) && a.planillas.length > 0) ? 1 : 0;
            const cantB = (Array.isArray(b.planillas) && b.planillas.length > 0) ? 1 : 0;
            if (cantA !== cantB) return cantB - cantA;
            return (b.id || 0) - (a.id || 0);
        });

        return usuariosCoincidentes[0];
    } catch (e) {
        console.error("Excepción en obtenerUsuarioAutorizado:", e);
        throw e;
    }
}

function extraerClaveUsuario(usuario) {
    if (!usuario) return '';
    return String(
        usuario.clave || 
        usuario.Contraseña || 
        usuario.contrasena || 
        usuario['Contraseña'] || 
        usuario['contraseña'] || 
        usuario.password || 
        usuario.Password || 
        ''
    ).trim();
}

async function cargarPlanillasDesdeSupabase(emailUsuario, esAdmin) {
    const emailNorm = normalizarCorreoCliente(emailUsuario);
    const esSuperAdmin = esAdmin || 
                         emailNorm === "misericordiaplanillas@gmail.com" || 
                         emailNorm === "victorojas2025@gmail.com";

    // 1. Intento A: Tablas relacionales normalizadas (public.planillas y public.docente_planillas)
    try {
        if (esSuperAdmin) {
            const { data: todas, error: errTodas } = await supabaseClient
                .from('planillas')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (!errTodas && Array.isArray(todas) && todas.length > 0) {
                const lista = todas.map(p => ({
                    id: p.spreadsheet_id || p.enlace || String(p.id),
                    nombre: p.nombre,
                    soloLectura: false
                }));
                console.log(`[Admin] Planillas relacionales cargadas: ${lista.length}`);
                return lista;
            }
        } else {
            const { data: asignaciones, error: errAsig } = await supabaseClient
                .from('docente_planillas')
                .select(`
                    solo_lectura,
                    planillas (
                        id,
                        nombre,
                        spreadsheet_id,
                        enlace,
                        activo
                    )
                `)
                .eq('docente_email', emailNorm);

            if (!errAsig && Array.isArray(asignaciones) && asignaciones.length > 0) {
                const lista = asignaciones
                    .filter(a => a.planillas && a.planillas.activo !== false)
                    .map(a => ({
                        id: a.planillas.spreadsheet_id || a.planillas.enlace || String(a.planillas.id),
                        nombre: a.planillas.nombre,
                        soloLectura: Boolean(a.solo_lectura)
                    }));
                console.log(`[Docente] Planillas relacionales asignadas a ${emailUsuario}: ${lista.length}`);
                return lista;
            }
        }
    } catch (errRel) {
        console.warn("Aviso consultando tablas relacionales, probando planillas_config...", errRel);
    }

    // 2. Intento B (Fallback): Tabla plana planillas_config
    try {
        const { data, error } = await supabaseClient
            .from('planillas_config')
            .select('*');

        if (error) {
            console.error("Error al cargar planillas_config de Supabase:", error);
            return [];
        }

        if (!data || !Array.isArray(data)) return [];

        const planillas = [];

        data.forEach(item => {
            const nombre = String(item.nombre || item['Nombre del Archivo'] || '').trim();
            const enlace = String(item.enlace || item['Enlace'] || '').trim();
            let spreadsheetId = String(item.spreadsheet_id || '').trim();
            if (!spreadsheetId && enlace) {
                const match = enlace.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
                if (match) spreadsheetId = match[1];
            }
            if (!spreadsheetId) spreadsheetId = enlace;

            if (!nombre || !spreadsheetId) return;

            // Extraer docentes autorizados para esta planilla
            const usuariosTexto = String(item.usuarios || item['Usuarios con Acceso'] || '').toLowerCase();
            
            // Si es administrador o si el correo del docente figura en la lista de usuarios con acceso
            const tieneAcceso = esSuperAdmin || usuariosTexto.includes(emailNorm);

            if (tieneAcceso) {
                planillas.push({
                    id: spreadsheetId,
                    nombre: nombre,
                    soloLectura: false
                });
            }
        });

        console.log(`Planillas asignadas cargadas para ${emailUsuario}: ${planillas.length}`);
        return planillas;
    } catch (e) {
        console.error("Excepción en cargarPlanillasDesdeSupabase:", e);
        return [];
    }
}

async function solicitarOTP() {
    const emailInput = normalizarCorreoCliente(document.getElementById('email-profesor').value);
    if (emailInput === "") {
        M.toast({html: 'Por favor, ingresa tu correo.', classes: 'red darken-1'});
        return;
    }
    
    emailProcesando = emailInput; 
    const btn = document.getElementById('btn-enviar-codigo');
    btn.setAttribute('data-texto-original', btn.innerHTML);
    btn.innerHTML = '<i class="material-icons left">hourglass_empty</i>Enviando...';
    btn.disabled = true;

    try {
        // 1. Obtener el docente desde la tabla app_adm_config de Supabase
        const usuario = await obtenerUsuarioAutorizado(emailInput);

        if (!usuario) {
            btn.innerHTML = btn.getAttribute('data-texto-original');
            btn.disabled = false;
            M.toast({html: 'El correo no figura en el listado de docentes autorizados.', classes: 'red darken-3', displayLength: 5000});
            return;
        }

        const claveAsignada = extraerClaveUsuario(usuario);
        if (!claveAsignada) {
            btn.innerHTML = btn.getAttribute('data-texto-original');
            btn.disabled = false;
            M.toast({html: 'El docente figura pero no tiene contraseña asignada en la tabla.', classes: 'orange darken-3', displayLength: 5000});
            return;
        }

        // 2. Enviar el correo con la clave exacta de la base de datos
        let enviado = false;
        try {
            const resp = await fetch('/api/enviar-codigo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, codigo: claveAsignada })
            });
            const resJson = await resp.json().catch(() => ({}));
            if (resp.ok && resJson.exito) {
                enviado = true;
            }
        } catch (eServidor) {
            console.warn("Endpoint /api/enviar-codigo no disponible:", eServidor);
        }

        btn.innerHTML = btn.getAttribute('data-texto-original');
        btn.disabled = false;

        document.getElementById('paso-correo').style.display = 'none';
        document.getElementById('paso-codigo').style.display = 'block';

        if (enviado) {
            M.toast({html: 'Tu código de acceso ha sido enviado a tu correo.', classes: 'green darken-1'});
        } else {
            M.toast({html: 'Ingresa tu clave de acceso de 6 dígitos.', classes: 'blue darken-2', displayLength: 5000});
        }

    } catch (err) {
        console.error("Error en solicitarOTP:", err);
        btn.innerHTML = btn.getAttribute('data-texto-original');
        btn.disabled = false;
        M.toast({html: 'Error: ' + (err.message || 'Desconocido'), classes: 'red darken-1', displayLength: 6000});
    }
}

async function verificarOTP() {
    const codigoInput = document.getElementById('codigo-otp').value.trim();
    if (codigoInput.length !== 6) {
        M.toast({html: 'Ingresa los 6 dígitos de tu código', classes: 'orange darken-3'});
        return;
    }
    
    mostrarLoader(true);

    // 1. Intento A: Supabase Auth OTP (código de 6 dígitos enviado por correo)
    try {
        const { data: { session }, error: otpError } = await supabaseClient.auth.verifyOtp({
            email: emailProcesando,
            token: codigoInput,
            type: 'email'
        });

        if (!otpError && session && session.user) {
            const esAdmin = session.user.email.toLowerCase() === 'misericordiaplanillas@gmail.com' ||
                            session.user.email.toLowerCase() === 'victorojas2025@gmail.com';
            const planillas = await cargarPlanillasDesdeSupabase(session.user.email, esAdmin);
            procesarRespuestaAcceso({ 
                acceso: true, 
                email: session.user.email,
                esAdmin,
                lista: planillas
            });
            return;
        }
    } catch (eOtp) {
        console.warn("Intento verifyOtp no exitoso, verificando tabla app_adm_config...", eOtp);
    }

    // 2. Intento B: Verificación directa contra tabla 'app_adm_config' (la clave de 6 dígitos de Google Sheets)
    try {
        const usuario = await obtenerUsuarioAutorizado(emailProcesando);

        if (usuario) {
            const claveGuardada = extraerClaveUsuario(usuario);
            if (claveGuardada && claveGuardada === codigoInput) {
                mostrarLoader(false);
                M.toast({html: 'Contraseña correcta. Iniciando sesión...', classes: 'green darken-1'});
                window.usuarioActual = usuario;
                try { sessionStorage.setItem('misericordia_usuario_info', JSON.stringify(usuario)); } catch(e) {}
                const esAdmin = usuario.es_admin === true || 
                                emailProcesando.toLowerCase() === 'misericordiaplanillas@gmail.com' ||
                                emailProcesando.toLowerCase() === 'victorojas2025@gmail.com';
                
                let planillasAsignadas = [];
                if (Array.isArray(usuario.planillas) && usuario.planillas.length > 0) {
                    planillasAsignadas = usuario.planillas.map(p => ({
                        ...p,
                        id: p.id || p.spreadsheet_id || (p.planilla_id ? String(p.planilla_id) : '') || p.nombre,
                        soloLectura: Boolean(p.soloLectura || p.solo_lectura)
                    }));
                } else if (typeof usuario.planillas === 'string') {
                    try {
                        const parsed = JSON.parse(usuario.planillas);
                        if (Array.isArray(parsed)) {
                            planillasAsignadas = parsed.map(p => ({
                                ...p,
                                id: p.id || p.spreadsheet_id || (p.planilla_id ? String(p.planilla_id) : '') || p.nombre,
                                soloLectura: Boolean(p.soloLectura || p.solo_lectura)
                            }));
                        }
                    } catch(e){ planillasAsignadas = []; }
                }

                if (planillasAsignadas.length === 0) {
                    planillasAsignadas = await cargarPlanillasDesdeSupabase(emailProcesando, esAdmin);
                }

                procesarRespuestaAcceso({ 
                    acceso: true, 
                    email: emailProcesando,
                    esAdmin,
                    lista: planillasAsignadas
                });
                return;
            }
        }
    } catch (errDb) {
        console.warn("No se pudo consultar la tabla app_adm_config en Supabase:", errDb);
    }

    mostrarLoader(false);
    M.toast({html: 'Código o contraseña incorrectos.', classes: 'red darken-3'});
}

function procesarRespuestaAcceso(respuesta, mostrarNotificacion = true) {
    mostrarLoader(false);
    
    // Log detallado para depuración del proceso de autenticación eliminado por seguridad

    if (!respuesta || !respuesta.acceso) {
        limpiarSesionGuardadaYMostrarLogin();
        document.getElementById('section-login').style.display = 'block';
                 
        let msj = "Sesión inválida. Vuelve a ingresar.";
        if(respuesta && respuesta.motivo === "EXPIRADO") msj = "El código expiró (dura 10 min). Solicita otro.";
        if(respuesta && respuesta.motivo === "INCORRECTO") msj = "Código incorrecto.";
        if(respuesta && respuesta.motivo === "INTENTOS_AGOTADOS") msj = "Demasiados intentos. Espera 15 minutos antes de volver a probar.";
        if(respuesta && respuesta.motivo === "INTENTAR_MAS_TARDE") msj = "No se pudo validar el intento ahora. Espera unos segundos y vuelve a probar.";
        if(respuesta && respuesta.motivo === "VACIO") msj = "Por favor ingresa con tu correo.";
        if(respuesta && respuesta.motivo === "DENEGADO") {
            msj = "Ya no tienes planillas asignadas.";
            if (respuesta.detalle) msj = respuesta.detalle;
        }
        if(respuesta && respuesta.motivo === "ERROR_PLANILLAS") {
            msj = "⚠️ Error en configuración del sistema.";
            if (respuesta.detalle) msj = respuesta.detalle;
        }
        
        console.warn("Error de acceso:", respuesta);
        M.toast({html: msj, displayLength: 6000, classes: 'red darken-3'});
        return; 
    }

    const planillaSeleccionadaAntesDeActualizar = currentSpreadsheetId && selectPlanilla.value
        ? String(currentSpreadsheetId)
        : null;
    
    // Privilegios diferenciados:
    // - superusuario: puede abrir el generador de boletines del menú
    // - vista individual del boletín: puede verla Victor y el superusuario
    const emailActualNormalizado = normalizarCorreoCliente(respuesta.email);
    const esAdminGeneral = Boolean(respuesta.esAdmin) || 
                           emailActualNormalizado === "misericordiaplanillas@gmail.com" || 
                           emailActualNormalizado === "victorojas2025@gmail.com";
    const isSuperUsuario = esAdminGeneral;
    const puedeVerTodasLasPlanillas = isSuperUsuario || emailActualNormalizado === "victorojas2025@gmail.com";
    const puedeVerBoletinAlumno = emailActualNormalizado === "victorojas2025@gmail.com" || isSuperUsuario;
    window.esUsuarioAdmin = isSuperUsuario;
    window.puedeVerBoletinAlumno = puedeVerBoletinAlumno;

    const emailDisplay = document.getElementById('user-email-display');
    const emailText = document.getElementById('user-email-text');
    if (emailDisplay && emailText) {
        emailText.textContent = respuesta.email.toLowerCase();
        emailDisplay.style.display = 'block';
    }

    sessionStorage.setItem('misericordia_sesion', emailActualNormalizado);
    try {
        sessionStorage.setItem('misericordia_planillas_cache', JSON.stringify({
            acceso: true,
            email: emailActualNormalizado,
            esAdmin: isSuperUsuario,
            lista: respuesta.lista || []
        }));
    } catch (eStore) {
        console.warn("No se pudo cachear la lista de planillas:", eStore);
    }

    if ((!respuesta.lista || respuesta.lista.length === 0) && typeof cargarPlanillasDesdeSupabase === 'function') {
        cargarPlanillasDesdeSupabase(emailActualNormalizado, isSuperUsuario || puedeVerTodasLasPlanillas).then(listaCargada => {
            if (listaCargada && listaCargada.length > 0) {
                respuesta.lista = listaCargada;
                try {
                    sessionStorage.setItem('misericordia_planillas_cache', JSON.stringify({
                        acceso: true,
                        email: emailActualNormalizado,
                        esAdmin: isSuperUsuario,
                        lista: listaCargada
                    }));
                } catch(e) {}
                procesarRespuestaAcceso(respuesta, false);
            }
        });
    }

    document.getElementById('section-login').style.display = 'none';
    document.getElementById('section-selectors').style.display = 'block';
    document.getElementById('btn-logout').style.display = 'block'; 

    if (typeof actualizarVisibilidadAdmin === 'function') {
        actualizarVisibilidadAdmin();
    }

    selectPlanilla.value = '';
    selectPlanilla.setAttribute('autocomplete', 'off'); 
    mapaPlanillas = {};
    mapaPlanillasSoloLectura = {};
    window.planillaSoloLectura = false;
    actualizarModoSoloLectura();
    
    const instance = M.Autocomplete.getInstance(selectPlanilla);
    if (instance) instance.destroy();

    if (!document.getElementById('fix-autocomplete-css')) {
        const style = document.createElement('style');
        style.id = 'fix-autocomplete-css';
        style.innerHTML = `
            .lista-flexible {
                position: absolute; background: white; width: 100%; max-height: 250px; overflow-y: auto;
                z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border-radius: 0 0 8px 8px; margin-top: 45px; display: none;
            }
            .lista-flexible li { padding: 12px 16px; cursor: pointer; color: #1565c0; font-weight: 500; border-bottom: 1px solid #eee; }
            .lista-flexible li:hover { background-color: #e3f2fd; }
        `;
        document.head.appendChild(style);
    }

    let ulResultados = document.getElementById('ul-resultados-planillas');
    if (!ulResultados) {
        ulResultados = document.createElement('ul');
        ulResultados.id = 'ul-resultados-planillas';
        ulResultados.className = 'lista-flexible';
        selectPlanilla.parentNode.appendChild(ulResultados);
    }

    const normalizar = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const mesActual = new Date().getMonth() + 1;
    const mostrarSegundoCuatrimestre = mesActual >= 8;
    const reglasDirectivos = {
        "directivostm1ciclo@gmail.com": { gradoMin: 1, gradoMax: 3, seccionMin: "A", seccionMax: "F" },
        "directivostt1ciclo@gmail.com": { gradoMin: 1, gradoMax: 3, seccionMin: "G", seccionMax: "L" },
        "directivostm2ciclo@gmail.com": { gradoMin: 4, gradoMax: 6, seccionMin: "A", seccionMax: "F" },
        "directivostt2ciclo@gmail.com": { gradoMin: 4, gradoMax: 6, seccionMin: "G", seccionMax: "L" }
    };
    const reglaDirectivo = reglasDirectivos[emailActualNormalizado];
    const permitidaParaDirectivo = (nombre) => {
        if (!reglaDirectivo) return true;
        const nombreNormalizado = normalizar(nombre).toUpperCase().trim();
        const esPlanilla = nombreNormalizado.includes("PLANILLAS");
        if (!esPlanilla) return false;
        const gradoMatch = nombreNormalizado.match(/\b([1-6])\s*(?:(?:RO|DO|TO|ER|MO)\b|[\u00BA\u00B0])/);
        const seccionMatch = nombreNormalizado.match(/(?:^|\s)([A-L])\s*$/);
        if (!gradoMatch || !seccionMatch) return false;
        const grado = Number(gradoMatch[1]);
        const seccion = seccionMatch[1];
        return grado >= reglaDirectivo.gradoMin && grado <= reglaDirectivo.gradoMax &&
            seccion >= reglaDirectivo.seccionMin && seccion <= reglaDirectivo.seccionMax;
    };

    let planillasVisibles = [];
    if (puedeVerTodasLasPlanillas) {
        // Usuarios autorizados: cargar todas las planillas existentes sin filtrar por cuatrimestre
        planillasVisibles = respuesta.lista.slice();
    } else {
        planillasVisibles = respuesta.lista.filter(p => {
            if (!permitidaParaDirectivo(p.nombre)) return false;
            const nombreLimpio = normalizar(p.nombre);
            const incluyePlanillas = nombreLimpio.includes("planillas");
            const incluyeCuatrimestre = nombreLimpio.includes("cuatrimestre");
            const esSegundoCuatrimestre = /(?:2\s*(?:º|°|do)?\s*cuat|segundo\s*cuat)/i.test(nombreLimpio);
            const esPrimerCuatrimestre = /(?:^|[^0-9])(1|primero|1º|1ro|1ro\.?)\s*cuatrimestre/.test(nombreLimpio) || /primer\s+cuatrimestre/.test(nombreLimpio);

            if (incluyeCuatrimestre) {
                if (esSegundoCuatrimestre) return mostrarSegundoCuatrimestre;
                if (esPrimerCuatrimestre) return !mostrarSegundoCuatrimestre;
                return true;
            }

            return incluyePlanillas;
        });
    }

    const ordenarPlanillasPorNombre = (a, b) => {
        const nombreA = String(a && a.nombre ? a.nombre : '');
        const nombreB = String(b && b.nombre ? b.nombre : '');

        const hayPlanillasA = /^PLANILLAS\b/i.test(nombreA) ? 0 : 1;
        const hayPlanillasB = /^PLANILLAS\b/i.test(nombreB) ? 0 : 1;
        if (hayPlanillasA !== hayPlanillasB) return hayPlanillasA - hayPlanillasB;

        const infoA = extraerGradoYSeccionGlobal(nombreA);
        const infoB = extraerGradoYSeccionGlobal(nombreB);

        if (infoA.grado !== infoB.grado) return infoA.grado - infoB.grado;
        if (infoA.seccion !== infoB.seccion) return infoA.seccion.localeCompare(infoB.seccion, 'es', { sensitivity: 'base' });
        if (infoA.esSegundoCuatri !== infoB.esSegundoCuatri) return infoA.esSegundoCuatri - infoB.esSegundoCuatri;
        if (infoA.esEsp !== infoB.esEsp) return infoA.esEsp - infoB.esEsp;

        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    };

    planillasVisibles.sort(ordenarPlanillasPorNombre);

    // Pre-procesar nombres normalizados e información de grado/sección para búsquedas instantáneas
    const planillasProcesadas = planillasVisibles.map(p => {
        const idPlanilla = p.id || p.spreadsheet_id || (p.planilla_id ? String(p.planilla_id) : '') || p.nombre;
        const esSoloLectura = Boolean(p.soloLectura || p.solo_lectura);
        mapaPlanillas[p.nombre] = idPlanilla;
        mapaPlanillasSoloLectura[p.nombre] = esSoloLectura;
        return {
            original: {
                ...p,
                id: idPlanilla,
                soloLectura: esSoloLectura
            },
            nombreLimpio: normalizar(p.nombre),
            infoPlanilla: extraerGradoYSeccionGlobal(p.nombre)
        };
    });

    const planillaRestaurada = planillaSeleccionadaAntesDeActualizar
        ? planillasProcesadas.find(item => String(item.original.id) === planillaSeleccionadaAntesDeActualizar)
        : null;
    if (planillaRestaurada) {
        selectPlanilla.value = planillaRestaurada.original.nombre;
        window.currentPlanillaNombre = planillaRestaurada.original.nombre;
        currentSpreadsheetId = planillaRestaurada.original.id;
        window.planillaSoloLectura = Boolean(planillaRestaurada.original.soloLectura);
        actualizarModoSoloLectura();
    } else {
        selectPlanilla.value = '';
        window.currentPlanillaNombre = '';
        currentSpreadsheetId = null;
    }

    const btnAbrirDirecto = document.getElementById('btn-abrir-planilla-directo');
    if (btnAbrirDirecto) {
        btnAbrirDirecto.href = currentSpreadsheetId
            ? `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`
            : '#';
        btnAbrirDirecto.style.display = (window.esUsuarioAdmin && currentSpreadsheetId) ? 'inline-flex' : 'none';
    }

    const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mapOrdinalToken = (t) => {
        if (!t) return t;
        const limpio = t.replace(/[º°\.]/g, '');
        const m = limpio.match(/^([0-9]+)(?:er|ro|do|to|ta)?$/);
        if (m) return m[1];
        const ord = {
            'primero': '1', 'primer': '1',
            'segundo': '2', 'seg': '2',
            'tercero': '3',
            'cuarto': '4',
            'quinto': '5',
            'sexto': '6'
        };
        if (ord[limpio]) return ord[limpio];
        return limpio;
    };

    const renderizarLista = (filtro = "") => {
        ulResultados.innerHTML = '';
        const terminosRaw = normalizar(filtro).split(" ").filter(t => t !== "");
        const terminos = terminosRaw.map(mapOrdinalToken);

        const fragment = document.createDocumentFragment();
        let coincidencias = 0;

        for (let i = 0; i < planillasProcesadas.length; i++) {
            const item = planillasProcesadas[i];
            const p = item.original;
            const nombreLimpio = item.nombreLimpio;
            const infoPlanilla = item.infoPlanilla;

            const cumpleFiltro = terminos.every((termino, indiceTermino) => {
                if (!termino) return true;
                if (/^[0-9]+$/.test(termino)) {
                    const siguienteTermino = terminos[indiceTermino + 1];
                    if (siguienteTermino === 'cuatrimestre') {
                        return new RegExp(`\\b${escapeRegExp(termino)}\\s*CUATRIMESTRE\\b`, 'i').test(nombreLimpio);
                    }
                    return Number(termino) === Number(infoPlanilla.grado);
                }
                if (termino.length === 1 && isNaN(termino)) {
                    const regex = new RegExp(`\\b${escapeRegExp(termino)}\\b`);
                    return regex.test(nombreLimpio);
                }
                return nombreLimpio.includes(termino);
            });

            if (cumpleFiltro) { 
                coincidencias++;
                const li = document.createElement('li');
                li.textContent = p.nombre;
                
                li.onclick = async function() {
                    if (guardadoGrillaEspecialEnCurso && await guardadoGrillaEspecialEnCurso !== true) {
                        return;
                    }
                    if (cambiosGrillaEspecial.size > 0 && await guardarCambiosGrillaEspecial() !== true) {
                        return;
                    }
                    selectPlanilla.value = p.nombre;
                    window.currentPlanillaNombre = p.nombre;
                    ulResultados.style.display = 'none';
                    currentSpreadsheetId = mapaPlanillas[p.nombre] || p.id || p.spreadsheet_id || (p.planilla_id ? String(p.planilla_id) : '') || p.nombre;
                    window.planillaSoloLectura = Boolean(mapaPlanillasSoloLectura[p.nombre] || p.soloLectura || p.solo_lectura);
                    actualizarModoSoloLectura();

                    const btnAbrirDirecto = document.getElementById('btn-abrir-planilla-directo');
                    if (btnAbrirDirecto) {
                        btnAbrirDirecto.href = currentSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit` : '#';
                        btnAbrirDirecto.style.display = (window.esUsuarioAdmin && currentSpreadsheetId) ? 'inline-flex' : 'none';
                    }
                    if (typeof actualizarVisibilidadAdmin === 'function') actualizarVisibilidadAdmin();
                    if (currentSpreadsheetId) cargarHojasDePlanilla();
                };
                fragment.appendChild(li);
            }
        }

        if (coincidencias > 0) {
            ulResultados.appendChild(fragment);
            ulResultados.style.display = 'block';
        } else {
            ulResultados.style.display = 'none';
        }
    };
    
    // Registrar listeners una única vez para evitar acumulaciones
    if (!selectPlanilla._listenersRegistrados) {
        selectPlanilla._listenersRegistrados = true;
        selectPlanilla.addEventListener('input', function() {
            if (typeof selectPlanilla._renderizarActual === 'function') {
                selectPlanilla._renderizarActual(this.value);
            }
            if (cambiosGrillaEspecial.size === 0 && !guardadoGrillaEspecialEnCurso) {
                currentSpreadsheetId = null;
            }
            window.planillaSoloLectura = false;
            actualizarModoSoloLectura();
            if (typeof actualizarVisibilidadAdmin === 'function') actualizarVisibilidadAdmin();
            const btnAbrirDirecto = document.getElementById('btn-abrir-planilla-directo');
            if (btnAbrirDirecto) btnAbrirDirecto.style.display = 'none';
        });

        selectPlanilla.addEventListener('focus', function() {
            if (typeof selectPlanilla._renderizarActual === 'function') {
                selectPlanilla._renderizarActual(this.value);
            }
        });

        selectPlanilla.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const ulRes = document.getElementById('ul-resultados-planillas');
                const primerLi = ulRes ? ulRes.querySelector('li') : null;
                if (primerLi && ulRes.style.display !== 'none') {
                    primerLi.click();
                } else if (this.value && mapaPlanillas[this.value]) {
                    const nombre = this.value;
                    currentSpreadsheetId = mapaPlanillas[nombre] || nombre;
                    window.currentPlanillaNombre = nombre;
                    window.planillaSoloLectura = Boolean(mapaPlanillasSoloLectura[nombre]);
                    actualizarModoSoloLectura();
                    if (ulRes) ulRes.style.display = 'none';
                    cargarHojasDePlanilla();
                }
            }
        });

        selectPlanilla.addEventListener('change', function() {
            if (this.value && mapaPlanillas[this.value] && currentSpreadsheetId !== mapaPlanillas[this.value]) {
                const nombre = this.value;
                currentSpreadsheetId = mapaPlanillas[nombre] || nombre;
                window.currentPlanillaNombre = nombre;
                window.planillaSoloLectura = Boolean(mapaPlanillasSoloLectura[nombre]);
                actualizarModoSoloLectura();
                const ulRes = document.getElementById('ul-resultados-planillas');
                if (ulRes) ulRes.style.display = 'none';
                cargarHojasDePlanilla();
            }
        });

        document.addEventListener('click', function(e) {
            const ulRes = document.getElementById('ul-resultados-planillas');
            if (ulRes && e.target !== selectPlanilla && e.target !== ulRes) {
                ulRes.style.display = 'none';
            }
        });
    }

    // Vincular la función activa de renderizado
    selectPlanilla._renderizarActual = renderizarLista;

    selectPlanilla.disabled = false;
    if (mostrarNotificacion) {
        M.toast({html: '✅ Acceso correcto.', classes: 'green'});
    }
}

function toggleBloqueoNavegacion(bloquear) {
    const estado = bloquear ? true : false;
    if(btnSiguiente) btnSiguiente.disabled = estado;
    if(btnAnterior) btnAnterior.disabled = estado;
    const style = bloquear ? "0.5" : "1";
    if(btnSiguiente) btnSiguiente.style.opacity = style;
    if(btnAnterior) btnAnterior.style.opacity = style;
}

function esColumnaNoDeNota(header) {
    if (!header && header !== 0) return true;
    const raw = String(header).trim();
    if (!raw) return true;
    if (raw.startsWith('_')) return true;

    const h = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();

    if (h === 'N°' || h === 'Nº' || h === 'N.' || h === 'NO.' || h === 'NO' || h === '#' || h === 'N' || h === 'NRO' || h === 'NRO.') {
        return true;
    }

    const hLimpio = h.replace(/[\.\s_\-°º#\/]+/g, '');

    const noNotasExactas = new Set([
        'N', 'NO', 'NRO', 'NUMERO', 'ORDEN', 'NUMERODEORDEN', 'NRODEORDEN', 'ORDENNRO',
        'DNI', 'DOCUMENTO', 'LEGAJO', 'MATRICULA',
        'APELLIDO', 'NOMBRE', 'APELLIDOYNOMBRE', 'APELLIDOSYNOMBRES', 'ALUMNO', 'ESTUDIANTE',
        'SEXO', 'EDAD', 'GENERO', 'FECHA', 'FECHANACIMIENTO', 'FECHADENACIMIENTO', 'NACIMIENTO',
        'ACTIVO', 'ACTIVOS', 'ESTADO', 'OCULTO', 'CONDICION', 'SITUACION',
        'PROMEDIO', 'PROM', 'FINAL', 'TOTAL', 'CALIFICACIONFINAL', 'NOTAFINAL', 'PROMEDIOFINAL', 'DEF',
        'OBSERVACION', 'OBSERVACIONES', 'OBS', 'COMENTARIO', 'COMENTARIOS', 'RECOMENDACION', 'RECOMENDACIONES', 'FIRMA', 'FIRMAS',
        'ASISTENCIA', 'INASISTENCIA', 'PRESENTE', 'AUSENTE', 'JUSTIFICA', 'JUSTIFICADA', 'INJUSTIFICADA', 'CONDUCTA', 'FALTA', 'FALTAS',
        'CURSO', 'DIVISION', 'GRADO', 'SECCION', 'TURNO', 'CICLO', 'ANO', 'MAESTRA', 'DOCENTE', 'PROFESOR', 'PROFESORA'
    ]);
    if (noNotasExactas.has(hLimpio)) return true;

    const palabrasExcluidas = [
        'DNI', 'NRO', 'NUMERO', 'ORDEN', 'APELLIDO', 'NOMBRE', 'ALUMNO', 'ESTUDIANTE',
        'SEXO', 'EDAD', 'FECHA', 'ACTIVO', 'ESTADO', 'OCULTO', 'PROMEDIO', 'PROM', 'FINAL',
        'OBSERVACION', 'COMENTARIO', 'RECOMENDACION', 'FIRMA', 'TOTAL', 'AUSENTE', 'PRESENTE', 'INASISTENCIA',
        'ASISTENCIA', 'CONDUCTA', 'JUSTIFICA', 'FALTA', 'CURSO', 'DIVISION', 'GRADO', 'SECCION', 'TURNO', 'CICLO',
        'MAESTRA', 'DOCENTE', 'PROFESOR'
    ];

    if (palabrasExcluidas.some(p => h.includes(p) || hLimpio.includes(p))) return true;

    return false;
}

function esCabeceraNotaRequerida(header, nombreHoja = '') {
    if (!header && header !== 0) return false;

    const nombreHojaUpper = String(nombreHoja || '').toUpperCase();
    const esHojaNoNotas = nombreHojaUpper.includes('ASISTENCIA') || 
                          nombreHojaUpper.includes('CONDUCTA') || 
                          nombreHojaUpper === 'DATOS' || 
                          nombreHojaUpper.includes('BOLETIN') || 
                          nombreHojaUpper.includes('PROMOCION') ||
                          nombreHojaUpper === 'PLANILLAS_CALIF_MAT' ||
                          nombreHojaUpper === 'PLANILLAS_CALIF_LENG' ||
                          nombreHoja === 'SISTEMA_AUDITORIA';

    if (esHojaNoNotas) {
        return false;
    }

    if (esColumnaNoDeNota(header)) {
        return false;
    }

    return true;
}

function esCampoDeNota(header, nombreHoja = '') {
    return esCabeceraNotaRequerida(header, nombreHoja);
}

async function consultarCursoEnSupabase(identificadorPlanilla, correo) {
    // 1. Obtener registro de la planilla
        let planilla = null;
        let query = supabaseClient.from('planillas').select('*');
        if (!isNaN(identificadorPlanilla) && Number(identificadorPlanilla) > 0) {
            query = query.or(`id.eq.${identificadorPlanilla},spreadsheet_id.eq.${identificadorPlanilla}`);
        } else {
            query = query.or(`spreadsheet_id.eq.${identificadorPlanilla},enlace.eq.${identificadorPlanilla}`);
        }
        const { data: planillasEncontradas } = await query;
        if (planillasEncontradas && planillasEncontradas.length > 0) {
            planilla = planillasEncontradas[0];
        } else {
            const nombreSel = (selectPlanilla && selectPlanilla.value) || '';
            if (nombreSel) {
                const { data: porNombre } = await supabaseClient
                    .from('planillas')
                    .select('*')
                    .eq('nombre', nombreSel)
                    .limit(1);
                if (porNombre && porNombre.length > 0) planilla = porNombre[0];
            }
        }

        if (!planilla) {
            throw new Error(`No se encontró el curso "${selectPlanilla ? selectPlanilla.value : identificadorPlanilla}" en Supabase.`);
        }

        const planillaId = planilla.id;
        window.currentPlanillaDbId = planillaId;
        window.currentPlanillaNombre = planilla.nombre || (selectPlanilla ? selectPlanilla.value : '') || '';

        // 2. Obtener hojas y su configuración de columnas (planilla_hojas)
        let { data: hojas, error: errHojas } = await supabaseClient
            .from('planilla_hojas')
            .select('*')
            .eq('planilla_id', planillaId)
            .order('orden', { ascending: true });

        if (errHojas) console.warn("[Supabase] Aviso consultando planilla_hojas:", errHojas);

        // Fallback / Auto-recuperación de hojas si la planilla no las tiene inicializadas
        if (!hojas || hojas.length === 0) {
            try {
                const infoG = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(planilla.nombre) : null;
                if (infoG && infoG.grado && infoG.seccion) {
                    const { data: dbPlanillas } = await supabaseClient
                        .from('planillas')
                        .select('id, nombre')
                        .neq('id', planillaId);

                    const hermana = (dbPlanillas || []).find(p => {
                        const inf = extraerGradoYSeccionGlobal(p.nombre);
                        return inf && inf.grado === infoG.grado &&
                               String(inf.seccion).toUpperCase() === String(infoG.seccion).toUpperCase() &&
                               Boolean(inf.esEsp) === Boolean(infoG.esEsp);
                    });

                    if (hermana && hermana.id) {
                        const { data: hojasHermana } = await supabaseClient
                            .from('planilla_hojas')
                            .select('*')
                            .eq('planilla_id', hermana.id)
                            .order('orden', { ascending: true });

                        if (hojasHermana && hojasHermana.length > 0) {
                            console.log(`[Supabase Auto-Heal] Obtenidas ${hojasHermana.length} hojas desde planilla hermana ID ${hermana.id} (${hermana.nombre})`);
                            hojas = hojasHermana;

                            const hojasClonadas = hojasHermana.map(h => ({
                                planilla_id: planillaId,
                                nombre_hoja: h.nombre_hoja,
                                orden: h.orden,
                                all_headers: h.all_headers,
                                editable_fields: h.editable_fields,
                                es_especial: h.es_especial
                            }));
                            supabaseClient.from('planilla_hojas').insert(hojasClonadas).then(() => {
                                console.log(`[Supabase Auto-Heal] Hojas clonadas persistidas para planilla ID ${planillaId}`);
                            }).catch(e => console.warn('[Supabase Auto-Heal] Error guardando hojas clonadas:', e));
                        }
                    }
                }
            } catch (errHojasAuto) {
                console.warn('[Supabase Auto-Heal] Aviso recuperando hojas hermanas:', errHojasAuto);
            }
        }

        let sheetOrder = (hojas && hojas.length > 0)
            ? hojas.map(h => h.nombre_hoja)
            : ["DATOS", "MAT", "LENG", "SOCIALES", "NATURALES", "ESPECIALES", "BOLETIN"];

        const esEspecial = /ESP|ESPECIAL/i.test(planilla.nombre || '');
        const esSegundoCuatri = esPlanillaSegundoCuatrimestreSeleccionada(planilla.nombre);
        if (!esSegundoCuatri) {
            sheetOrder = sheetOrder.filter(h => !String(h).toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION'));
        } else if (!esEspecial && !sheetOrder.some(h => String(h).toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION'))) {
            sheetOrder.push('PLANILLA_PROMOCION');
        }

        // Determinar permisos granulares por área del usuario activo
        const emailActivoDocente = normalizarCorreoCliente(correo || (typeof emailProcesando !== 'undefined' ? emailProcesando : '') || sessionStorage.getItem('misericordia_sesion') || (window.usuarioActual && window.usuarioActual.email) || '');

        if (emailActivoDocente) {
            try {
                const { data: usuarioFresh } = await supabaseClient
                    .from('app_adm_config')
                    .select('*')
                    .or(`email.ilike.${emailActivoDocente},Email.ilike.${emailActivoDocente}`);
                if (usuarioFresh && usuarioFresh.length > 0) {
                    usuarioFresh.sort((a, b) => {
                        const cantA = (Array.isArray(a.planillas) && a.planillas.length > 0) ? 1 : 0;
                        const cantB = (Array.isArray(b.planillas) && b.planillas.length > 0) ? 1 : 0;
                        if (cantA !== cantB) return cantB - cantA;
                        return (b.id || 0) - (a.id || 0);
                    });
                    window.usuarioActual = usuarioFresh[0];
                    try { sessionStorage.setItem('misericordia_usuario_info', JSON.stringify(usuarioFresh[0])); } catch(e) {}
                }
            } catch(eFresh) {
                console.warn('[Supabase] Aviso refrescando usuario en tiempo real:', eFresh);
            }
        }

        const permisosDocente = obtenerPermisosDocenteParaPlanilla(planilla, emailActivoDocente);
        window.permisosPlanillaActual = permisosDocente;

        if (permisosDocente.soloLectura) {
            window.planillaSoloLectura = true;
        }

        const sheetConfigs = {};
        if (hojas && hojas.length > 0) {
            hojas.forEach(h => {
                let camposEditables = h.editable_fields || [];
                
                // Filtrar campos editables según permisos granulares de esta planilla
                if (!permisosDocente.soloLectura) {
                    camposEditables = filtrarCamposEditablesPorAreas(h.nombre_hoja, camposEditables, permisosDocente.areas, planilla.nombre);
                } else {
                    camposEditables = [];
                }

                sheetConfigs[h.nombre_hoja] = {
                    allHeaders: h.all_headers || [],
                    editableFields: camposEditables
                };
            });
        }

        // 3. Obtener alumnos matriculados en este curso (alumno_planillas + alumnos)
        let { data: matriculas, error: errMatriculas } = await supabaseClient
            .from('alumno_planillas')
            .select(`
                numero_orden,
                activo,
                oculto,
                alumno_dni,
                alumnos (
                    dni,
                    apellido,
                    nombre,
                    sexo,
                    fecha_nacimiento,
                    activo,
                    oculto
                )
            `)
            .eq('planilla_id', planillaId)
            .order('numero_orden', { ascending: true });

        if (errMatriculas) {
            throw new Error(`Error consultando alumnos: ${errMatriculas.message}`);
        }

        // Fallback / Auto-recuperación de alumnos si la planilla no tiene matrículas registradas
        if (!matriculas || matriculas.length === 0) {
            try {
                const infoG = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(planilla.nombre) : null;
                if (infoG && infoG.grado && infoG.seccion) {
                    const { data: dbPlanillas } = await supabaseClient
                        .from('planillas')
                        .select('id, nombre')
                        .neq('id', planillaId);

                    const hermana = (dbPlanillas || []).find(p => {
                        const inf = extraerGradoYSeccionGlobal(p.nombre);
                        return inf && inf.grado === infoG.grado &&
                               String(inf.seccion).toUpperCase() === String(infoG.seccion).toUpperCase();
                    });

                    if (hermana && hermana.id) {
                        const { data: matriculasHermana } = await supabaseClient
                            .from('alumno_planillas')
                            .select(`
                                numero_orden,
                                activo,
                                oculto,
                                alumno_dni,
                                alumnos (
                                    dni,
                                    apellido,
                                    nombre,
                                    sexo,
                                    fecha_nacimiento,
                                    activo,
                                    oculto
                                )
                            `)
                            .eq('planilla_id', hermana.id)
                            .order('numero_orden', { ascending: true });

                        if (matriculasHermana && matriculasHermana.length > 0) {
                            console.log(`[Supabase Auto-Heal] Obtenidos ${matriculasHermana.length} alumnos desde curso hermano ID ${hermana.id} (${hermana.nombre})`);
                            matriculas = matriculasHermana;

                            const alumnosAInsertar = matriculasHermana.map(m => ({
                                planilla_id: planillaId,
                                alumno_dni: m.alumno_dni || (m.alumnos && m.alumnos.dni),
                                numero_orden: m.numero_orden,
                                activo: m.activo !== false,
                                oculto: m.oculto === true
                            })).filter(a => a.alumno_dni);

                            if (alumnosAInsertar.length > 0) {
                                supabaseClient.from('alumno_planillas').insert(alumnosAInsertar).then(() => {
                                    console.log(`[Supabase Auto-Heal] Matrículas clonadas persistidas para planilla ID ${planillaId}`);
                                }).catch(e => console.warn('[Supabase Auto-Heal] Error guardando matrículas clonadas:', e));
                            }
                        }
                    }
                }
            } catch (errMatriculasAuto) {
                console.warn('[Supabase Auto-Heal] Aviso recuperando alumnos hermanos:', errMatriculasAuto);
            }
        }

        // 4. Obtener todas las calificaciones de este curso (calificaciones)
        const { data: listaCalifs, error: errCalifs } = await supabaseClient
            .from('calificaciones')
            .select('*')
            .eq('planilla_id', planillaId);

        if (errCalifs) console.warn("[Supabase] Aviso consultando calificaciones:", errCalifs);

        const mapaCalifsPorDni = {};
        if (Array.isArray(listaCalifs)) {
            listaCalifs.forEach(c => {
                const dni = String(c.alumno_dni || '').trim();
                if (!mapaCalifsPorDni[dni]) mapaCalifsPorDni[dni] = {};
                mapaCalifsPorDni[dni][c.nombre_hoja] = c.valores || {};
            });
        }

        
        // 4.1 Consolidación automática de Notas de Áreas Especiales desde las planillas de los profesores especiales
        if (!esEspecial) {
            try {
                const infoReg = parsePlanillaInfo(planilla.nombre);
                if (infoReg.grado && infoReg.seccion) {
                    const { data: todasEsp } = await supabaseClient
                        .from('planillas')
                        .select('id, nombre')
                        .ilike('nombre', '%ESP%')
                        .ilike('nombre', `%${infoReg.grado}%`)
                        .ilike('nombre', `%${infoReg.seccion}%`);

                    const espCorrespondientes = (todasEsp || []).filter(p => {
                        const info = parsePlanillaInfo(p.nombre);
                        return info.esEspecial && info.grado === infoReg.grado && info.seccion === infoReg.seccion && info.esSegundo === infoReg.esSegundo && info.materia;
                    });

                    if (espCorrespondientes.length > 0) {
                        const espIds = espCorrespondientes.map(p => p.id);
                        const { data: califsEspeciales } = await supabaseClient
                            .from('calificaciones')
                            .select('planilla_id, alumno_dni, valores')
                            .in('planilla_id', espIds)
                            .ilike('nombre_hoja', '%ESPECIALES%');

                        if (Array.isArray(califsEspeciales) && califsEspeciales.length > 0) {
                            const mapaMateriaPorPlanillaId = {};
                            espCorrespondientes.forEach(p => {
                                mapaMateriaPorPlanillaId[p.id] = parsePlanillaInfo(p.nombre).materia;
                            });

                            califsEspeciales.forEach(c => {
                                const dni = String(c.alumno_dni || '').trim();
                                const materia = mapaMateriaPorPlanillaId[c.planilla_id];
                                if (!dni || !materia) return;
                                const nota = extraerNotaFinalEspecial(c.valores);
                                if (!nota) return;

                                if (!mapaCalifsPorDni[dni]) mapaCalifsPorDni[dni] = {};

                                // 1. Integrar en NOTAS_ÁREAS_ESPECIALES
                                const nombreHojaEsp = sheetOrder.find(h => /NOTAS_.*ESPECIALES/i.test(h)) || 'NOTAS_ÁREAS_ESPECIALES';
                                if (!mapaCalifsPorDni[dni][nombreHojaEsp]) mapaCalifsPorDni[dni][nombreHojaEsp] = {};

                                const headersEsp = (sheetConfigs[nombreHojaEsp] && sheetConfigs[nombreHojaEsp].allHeaders) || [];
                                const colEsp = mapearColumnaMateriaEspecial(headersEsp, materia, nombreHojaEsp);
                                if (colEsp) {
                                    mapaCalifsPorDni[dni][nombreHojaEsp][colEsp] = nota;
                                }

                                // 2. Integrar en Boletines y Planillas Resumen
                                sheetOrder.forEach(hoja => {
                                    if (/BOLETIN/i.test(hoja)) {
                                        if (!mapaCalifsPorDni[dni][hoja]) mapaCalifsPorDni[dni][hoja] = {};
                                        const headersB = (sheetConfigs[hoja] && sheetConfigs[hoja].allHeaders) || [];
                                        const colB = mapearColumnaMateriaEspecial(headersB, materia, hoja);
                                        if (colB) {
                                            mapaCalifsPorDni[dni][hoja][colB] = nota;
                                        }
                                    } else if (/CALIF_LENG|CALIF_MAT/i.test(hoja)) {
                                        if (!mapaCalifsPorDni[dni][hoja]) mapaCalifsPorDni[dni][hoja] = {};
                                        const headersRes = (sheetConfigs[hoja] && sheetConfigs[hoja].allHeaders) || [];
                                        const colRes = mapearColumnaMateriaEspecial(headersRes, materia, hoja);
                                        if (colRes) {
                                            mapaCalifsPorDni[dni][hoja][colRes] = nota;
                                        }
                                    }
                                });
                            });
                            console.log(`[Supabase Especiales] ${califsEspeciales.length} notas de áreas especiales consolidadas en el curso ${planilla.nombre}.`);
                        }
                    }
                }
            } catch (errEsp) {
                console.warn('[Supabase Especiales] Aviso consolidando notas especiales:', errEsp);
            }
        }

        // 5. Formatear estudiantes
        const students = (matriculas || []).map((m, index) => {
            const al = m.alumnos || {};
            const dni = String(al.dni || '').trim();
            const apellido = String(al.apellido || '').trim();
            const nombre = String(al.nombre || '').trim();
            const nombreCompleto = (apellido && nombre) ? `${apellido}, ${nombre}` : (apellido || nombre || `Alumno ${dni}`);
            const numeroOrden = m.numero_orden || (index + 1);

            const califsAlumno = mapaCalifsPorDni[dni] || {};
            const extraDatosPersonales = (califsAlumno["DATOS"] && typeof califsAlumno["DATOS"] === 'object')
                ? califsAlumno["DATOS"]
                : {};
            const fechaNacVal = al.fecha_nacimiento || extraDatosPersonales["FECHA DE NAC"] || extraDatosPersonales["FECHA NACIMIENTO"] || '';

            const datosHoja = {
                ...extraDatosPersonales,
                "DNI": dni,
                "APELLIDO": apellido,
                "NOMBRE": nombre,
                "APELLIDO Y NOMBRE": nombreCompleto,
                "ALUMNO": nombreCompleto,
                "NRO.": String(numeroOrden),
                "Nro.": String(numeroOrden),
                "NRO": String(numeroOrden),
                "N°": String(numeroOrden),
                "Nº": String(numeroOrden),
                "NUMERO": String(numeroOrden),
                "NUMERO DE ORDEN": String(numeroOrden),
                "SEXO": al.sexo || extraDatosPersonales["SEXO"] || '',
                "FECHA NACIMIENTO": fechaNacVal,
                "FECHA DE NAC": fechaNacVal,
                "ACTIVOS": (m.activo !== false && al.activo !== false) ? 'TRUE' : 'FALSE',
                "ESTADO": (m.activo !== false && al.activo !== false) ? 'TRUE' : 'FALSE',
                "OCULTO": (m.oculto === true || al.oculto === true) ? 'SÍ' : 'NO',
                "_rowIndex": index + 2
            };

            const datosHojas = {
                "DATOS": datosHoja
            };

            sheetOrder.forEach(hojaNombre => {
                if (hojaNombre === "DATOS") return;
                const vals = califsAlumno[hojaNombre] || {};
                const valsFormateados = {};
                for (const [k, v] of Object.entries(vals)) {
                    if (esCampoDeNota(k, hojaNombre) && v !== '' && v !== null && v !== undefined && !isNaN(Number(String(v).replace(/,/g, '.')))) {
                        valsFormateados[k] = formatearNotaADosDecimales(v);
                    } else {
                        valsFormateados[k] = v;
                    }
                }
                const hojaObj = {
                    ...valsFormateados,
                    "DNI": dni,
                    "APELLIDO Y NOMBRE": nombreCompleto,
                    "NRO.": String(numeroOrden),
                    "Nro.": String(numeroOrden),
                    "NRO": String(numeroOrden),
                    "N°": String(numeroOrden),
                    "Nº": String(numeroOrden),
                    "NUMERO": String(numeroOrden),
                    "NUMERO DE ORDEN": String(numeroOrden),
                    "_rowIndex": index + 2
                };

                // Calcular promedio: si existen notas se calcula, si no existen notas queda estrictamente vacío
                const configH = sheetConfigs[hojaNombre];
                if (configH && Array.isArray(configH.allHeaders)) {
                    configH.allHeaders.forEach(hdr => {
                        const hUpper = String(hdr || '').toUpperCase();
                        if ((hUpper.includes('PROM') || hUpper.includes('FINAL')) && !hUpper.includes('GENERAL')) {
                            let sumaCentavos = 0, cant = 0;
                            configH.allHeaders.forEach(hCol => {
                                if (esCabeceraNotaRequerida(hCol, hojaNombre)) {
                                    const vNum = Number(String(hojaObj[hCol] || '').replace(/,/g, '.'));
                                    if (!isNaN(vNum) && vNum > 0) {
                                        sumaCentavos += Math.round(vNum * 100);
                                        cant++;
                                    }
                                }
                            });
                            if (cant > 0) {
                                hojaObj[hdr] = (Math.trunc(sumaCentavos / cant + 1e-9) / 100).toFixed(2);
                            } else {
                                // Sin notas ingresadas el promedio debe estar vacío, limpiando posibles "1.00" viejos
                                hojaObj[hdr] = "";
                            }
                        }
                    });
                }

                datosHojas[hojaNombre] = hojaObj;
            });

            return {
                dni,
                nombreCompleto,
                numeroOrden,
                datosHojas
            };
        });

        const cursoFormateado = {
            id: planilla.id,
            nombre: planilla.nombre || '',
            name: planilla.nombre || '',
            spreadsheet_id: planilla.spreadsheet_id || '',
            sheetOrder,
            sheets: sheetConfigs,
            students,
            lastUpdated: Date.now()
        };

        console.log(`[Supabase] Curso procesado: ${students.length} alumnos, ${sheetOrder.length} hojas.`);
        procesarTodoElCurso(cursoFormateado);
}

async function cargarCursoDesdeSupabase(identificadorPlanilla, correo) {
    const maxIntentos = 3; // Intento inicial + 2 reintentos
    let ultimoError = null;

    for (let intento = 1; intento <= maxIntentos; intento++) {
        try {
            console.log(`[Supabase] Cargando datos del curso (Intento ${intento}/${maxIntentos}): ${identificadorPlanilla}...`);
            if (intento > 1) {
                M.toast({
                    html: `🔄 Reintentando conexión con Supabase (${intento}/${maxIntentos})...`,
                    classes: 'blue darken-2',
                    displayLength: 2000
                });
            }

            await consultarCursoEnSupabase(identificadorPlanilla, correo);
            return; // Éxito
        } catch (err) {
            ultimoError = err;
            console.warn(`[Supabase] Intento ${intento}/${maxIntentos} falló:`, err);
            if (intento < maxIntentos) {
                // Pausa antes del siguiente reintento (1.2s antes del intento 2, 2.4s antes del intento 3)
                await new Promise(res => setTimeout(res, 1200 * intento));
            }
        }
    }

    // Si fallaron los 3 intentos (inicial + 2 reintentos), recién aquí intentar recuperar de caché local
    console.error("[Supabase] Todos los intentos de conexión fallaron:", ultimoError);
    let recuperadoCache = false;
    try {
        const cacheKey = 'misericordia_data_' + identificadorPlanilla;
        const datosCheados = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
        if (datosCheados) {
            const parseados = JSON.parse(datosCheados);
            if (parseados && parseados.students && parseados.students.length > 0) {
                M.toast({
                    html: '⚠️ Sin conexión con Supabase tras 3 intentos. Mostrando datos desde caché local.',
                    classes: 'orange darken-3',
                    displayLength: 5000
                });
                procesarTodoElCurso(parseados);
                recuperadoCache = true;
            }
        }
    } catch (eCache) {
        console.warn("No se pudo recuperar de caché:", eCache);
    }

    if (!recuperadoCache) {
        const esTimeout = String(ultimoError?.message || '').includes('Failed to fetch') || String(ultimoError?.message || '').includes('TIMED_OUT');
        const msgError = esTimeout
            ? 'No se pudo conectar con el servidor de Supabase tras 3 intentos (Tiempo de espera agotado). Verifica tu conexión a internet.'
            : `Error al cargar curso desde Supabase tras 3 intentos: ${ultimoError?.message || ultimoError}`;
        mostrarError({ message: msgError });
        selectPlanilla.disabled = false;
        mostrarLoader(false);
    }
}

async function cargarHojasDePlanilla(forzarRecarga = false) {
    if (!currentSpreadsheetId) {
        const nombreSel = (selectPlanilla && selectPlanilla.value) || '';
        if (nombreSel && mapaPlanillas[nombreSel]) {
            currentSpreadsheetId = mapaPlanillas[nombreSel];
        } else if (nombreSel) {
            currentSpreadsheetId = nombreSel;
        }
    }
    if (!currentSpreadsheetId) return;
    selectPlanilla.disabled = true;
    mostrarLoader(true);
    limpiarFormularioCompleto();

    HOJA_ACTUAL_SELECCIONADA = "";

    selectHoja.innerHTML = '<option value="" disabled selected>Seleccione una Hoja</option>';
    selectAlumno.innerHTML = '<option value="" disabled selected>Cargando alumnos...</option>';
    window.dniAlumnoActual = null;

    habilitarSelect(selectHoja, false);
    habilitarSelect(selectAlumno, false);

    let correoAEnviar = (typeof emailProcesando !== 'undefined' && emailProcesando !== "")
        ? emailProcesando
        : (sessionStorage.getItem('misericordia_sesion') || "");

    await cargarCursoDesdeSupabase(currentSpreadsheetId, correoAEnviar);
}
function actualizarBadgeVisual(nombreHoja) {
    const badge = document.getElementById('badge-hoja-activa');
    if (badge) {
        badge.textContent = "Editando: " + nombreHoja;
        badge.style.display = 'inline-block';
        let colorClass = "new badge grey darken-3";
        let h = nombreHoja.toUpperCase();
        if (h.includes("SOCIALES")) colorClass = "orange darken-3";
        else if (h.includes("LENG")) colorClass = "blue darken-3";
        else if (h.includes("MAT")) colorClass = "red darken-3";
        else if (h.includes("NATURALES")) colorClass = "green darken-3";
        badge.className = "new badge " + colorClass;
    }
}

function procesarTodoElCurso(data) {
    if (!sessionStorage.getItem('misericordia_sesion')) {
        mostrarLoader(false);
        return; 
    }

    mostrarLoader(false);
    if (data.error) { mostrarError(data); return; }
    if (data.courseFormat === 'compact-v1') {
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
        data = {
            ...data,
            sheets: sheetConfigs,
            students: (data.students || []).map(student => {
                const datosHojas = {};
                (student.sheets || []).forEach((compactRow, sheetIndex) => {
                    const sheet = compactSheets[sheetIndex];
                    if (!compactRow || !sheet || !sheet.name) return;
                    const values = compactRow[1] || [];
                    const row = {};
                    (sheet.allHeaders || []).forEach((header, columnIndex) => {
                        if (header) row[header] = values[columnIndex] == null ? '' : String(values[columnIndex]);
                    });
                    row._rowIndex = compactRow[0];
                    datosHojas[sheet.name] = row;
                });
                return {
                    dni: student.dni,
                    nombreCompleto: student.nombreCompleto,
                    datosHojas
                };
            })
        };
        delete data.courseFormat;
    }
    
    cursoCompleto = data; 
    _columnasNotasActivasPorHoja = null;
    // 🚀 PERF: Construir índice O(1) por DNI para evitar .find() lineales
    studentsByDni = new Map(data.students.map(s => [String(s.dni), s]));

    if (currentSpreadsheetId) {
        const cacheKey = 'misericordia_data_' + currentSpreadsheetId;
        try { storeCompressedCache(cacheKey, data); } catch(e) { console.warn('storeCompressedCache error:', e); }
    }
    
    let htmlAlumnos = '<option value="" disabled selected>Seleccione un alumno</option>';
    
    const esEspecialParaOrden = esPlanillaEspecialSeleccionada();
    if (esEspecialParaOrden) {
        ordenarAlumnosParaEspecial(data);
    } else {
        data.students.sort(compararAlumnosPorSexoYNombre);
    }
    const hojaOrdenEspecial = esEspecialParaOrden ? obtenerHojaOrdenEspecial(data) : null;

    let alumnosVisibles = 0;
    let primerDniVisible = null;
    let primerDniCualquiera = null;
    
    data.students.forEach(student => {
        const datos = student.datosHojas["DATOS"] || {};
        if (esEspecialParaOrden && obtenerNumeroOrdenEspecial(student, hojaOrdenEspecial) === Number.MAX_SAFE_INTEGER) {
            return;
        }
        const valorOculto = String(obtenerValorCampo(datos, "OCULTO") || "").toUpperCase().trim();
        const estaOculto = (valorOculto === "SÍ" || valorOculto === "SI" || valorOculto === "TRUE");
        
        let estaActivo = true;
        const valorActivos = obtenerValorCampo(datos, "ACTIVOS");
        const valorEstado = obtenerValorCampo(datos, "ESTADO");
        if (valorActivos !== undefined) {
            const val = String(valorActivos).toUpperCase().trim();
            estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
        } else if (valorEstado !== undefined) {
            const val = String(valorEstado).toUpperCase().trim();
            estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
        }
        
        if (!estaOculto) {
            const nro = student.numeroOrden || (datos && (datos["NRO."] || datos["Nro."])) || "";
            const sufijoInactivo = !estaActivo ? " (Inactivo)" : "";
            const etiqueta = nro ? `${nro} - ${student.nombreCompleto}${sufijoInactivo}` : `${student.nombreCompleto}${sufijoInactivo}`;
            htmlAlumnos += `<option value="${student.dni}">${etiqueta}</option>`;
            alumnosVisibles++;
            if (!primerDniVisible && estaActivo) primerDniVisible = student.dni;
            if (!primerDniCualquiera) primerDniCualquiera = student.dni;
        }
    });

    if (alumnosVisibles > 0) {
        selectAlumno.innerHTML = htmlAlumnos;
        selectAlumno.value = primerDniVisible || primerDniCualquiera;
    } else {
        selectAlumno.innerHTML = '<option value="" disabled selected>No hay alumnos visibles</option>';
    }
    
    selectPlanilla.disabled = false; 
    habilitarSelect(selectAlumno, true); 

    try {
        const currentGrade = selectPlanilla.value;
        if (_currentSession.sessionId && _currentSession.gradeId && _currentSession.gradeId !== currentGrade) {
            releaseGradeClient();
        }
    } catch (e) { console.warn('Error liberando sesión al cargar curso', e); }

    const panelPrincipal = document.getElementById('panel-principal');
    const sidebar = document.getElementById('sidebar-hojas');
    const contenido = document.getElementById('contenido-hojas');
    const esEspecial = esPlanillaEspecialSeleccionada();
    if (!esEspecial && btnGuardar && contenedorOriginalGuardar && btnGuardar.parentElement !== contenedorOriginalGuardar) {
        contenedorOriginalGuardar.appendChild(btnGuardar);
    }
    if (btnAnterior) btnAnterior.parentElement.style.display = esEspecial ? 'none' : '';
    if (btnSiguiente) btnSiguiente.parentElement.style.display = esEspecial ? 'none' : '';
    if (saveButtonContainer) {
        saveButtonContainer.style.display = esEspecial ? 'flex' : 'block';
        saveButtonContainer.style.justifyContent = esEspecial ? 'flex-end' : '';
    }
    if (btnGuardar && btnGuardar.parentElement) {
        btnGuardar.parentElement.classList.toggle('s12', esEspecial);
        btnGuardar.parentElement.classList.toggle('s4', !esEspecial);
        btnGuardar.parentElement.style.width = esEspecial ? 'auto' : '';
    }

    sidebar.innerHTML = '';
    contenido.innerHTML = '';
    panelPrincipal.style.display = 'block'; 

    const esSegundoCuatri = esPlanillaSegundoCuatrimestreSeleccionada(data.nombre || data.name);
    let sheetNames = Array.isArray(data.sheetOrder) ? data.sheetOrder : [];
    if (!esSegundoCuatri) {
        sheetNames = sheetNames.filter(h => !String(h).toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION'));
        data.sheetOrder = sheetNames;
    }
    
    sheetNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selectHoja.appendChild(option);

        const btnLateral = document.createElement('a');
        btnLateral.className = 'collection-item sidebar-item';
        btnLateral.setAttribute('data-hoja', name);

        if (HOJA_ACTUAL_SELECCIONADA === "") {
            if (index === 0) {
                btnLateral.classList.add('active');
                HOJA_ACTUAL_SELECCIONADA = name; 
            }
        } else {
            if (name === HOJA_ACTUAL_SELECCIONADA) {
                btnLateral.classList.add('active');
            } else {
                btnLateral.classList.remove('active');
            }
        }
        
        const infoHoja = obtenerInfoHoja(name);
        const icono = infoHoja.icono;
        const nombreLimpio = infoHoja.nombre;
        
        btnLateral.innerHTML = `
        <span style="display: flex; align-items: center; flex-grow: 1;">
          <i class="material-icons">${icono}</i>${nombreLimpio}
        </span>
        <i class="material-icons icono-alerta" style="color: #f57f17; font-size: 1.2rem; display: none; margin: 0;" title="Faltan notas por cargar">error_outline</i>
      `;

        const formDiv = document.createElement('div');
        formDiv.className = 'form-container-interno';
        formDiv.id = `form-${name.replace(/\s+/g, '_')}`;
        formDiv.style.display = index === 0 ? 'block' : 'none'; 

        btnLateral.addEventListener('click', function() {
            const esPlanillaPromocion = String(name || '').toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION');
            if (this.classList.contains('active')) {
                return;
            }
            const hojaAnterior = selectHoja.value;
            const idFormAnterior = hojaAnterior ? `form-${hojaAnterior.replace(/\s+/g, '_')}` : null;
            const formAnterior = idFormAnterior ? document.getElementById(idFormAnterior) : null;

            HOJA_ACTUAL_SELECCIONADA = name;
            const activeSidebar = document.querySelector('.sidebar-item.active');
            if (activeSidebar) activeSidebar.classList.remove('active');
            this.classList.add('active');

            if (formAnterior) formAnterior.style.display = 'none';
            contenido.style.display = '';
            formDiv.style.display = 'block';

            selectHoja.value = name;
            actualizarBadgeVisual(name);

            // Asegurar que el botón guardar esté en su contenedor estándar si veníamos de una grilla especial
            if (btnGuardar && contenedorOriginalGuardar && btnGuardar.parentElement !== contenedorOriginalGuardar) {
                contenedorOriginalGuardar.appendChild(btnGuardar);
            }

            if (name !== "SISTEMA_AUDITORIA" && window.dniAlumnoActual) {
                renderizarHojaEspecifica(name, window.dniAlumnoActual);
                actualizarContadorSidebar();
            }

            const saveButtonContainer = document.getElementById('save-button-container');
            if (name === "SISTEMA_AUDITORIA" || esPlanillaPromocion) {
                if (btnAnterior && btnAnterior.parentElement) btnAnterior.parentElement.style.display = 'none';
                if (btnSiguiente && btnSiguiente.parentElement) btnSiguiente.parentElement.style.display = 'none';
                if (saveButtonContainer) saveButtonContainer.style.display = 'none';
                if (name === "SISTEMA_AUDITORIA") inicializarPanelAuditoriaVisual(formDiv);
            } else {
                const esEspecialActual = esPlanillaEspecialSeleccionada();
                if (btnAnterior && btnAnterior.parentElement) {
                    btnAnterior.parentElement.style.display = esEspecialActual ? 'none' : '';
                }
                if (btnSiguiente && btnSiguiente.parentElement) {
                    btnSiguiente.parentElement.style.display = esEspecialActual ? 'none' : '';
                }
                if (btnGuardar && btnGuardar.parentElement) {
                    btnGuardar.parentElement.classList.toggle('s12', esEspecialActual);
                    btnGuardar.parentElement.classList.toggle('s4', !esEspecialActual);
                    btnGuardar.parentElement.style.width = esEspecialActual ? 'auto' : '';
                }
                if (saveButtonContainer) {
                    saveButtonContainer.style.display = esEspecialActual ? 'flex' : 'block';
                    saveButtonContainer.style.justifyContent = esEspecialActual ? 'flex-end' : '';
                }
            }

            if (name.toUpperCase().includes("BOLETIN")) {
                actualizarBoletinDesdeDOM(name);
            }
            actualizarEstadoHojasSidebar();
        });

        sidebar.appendChild(btnLateral);
        contenido.appendChild(formDiv);
    });

    const divContador = document.createElement('a');
    divContador.id = 'contador-alumnos-sidebar';
    divContador.className = 'collection-item sidebar-item';
    divContador.style.backgroundColor = '#f8f9fa';
    divContador.style.borderBottom = 'none';
    divContador.style.color = '#555';
    divContador.style.fontWeight = '600';
    divContador.style.justifyContent = 'flex-start';

    const nombrePlanillaAct = selectPlanilla.value.toUpperCase();
    const esMateriaEspecial = 
        nombrePlanillaAct.includes("ESP") || nombrePlanillaAct.includes("FÍSICA") || nombrePlanillaAct.includes("FISICA") || 
        nombrePlanillaAct.includes("PLÁSTICA") || nombrePlanillaAct.includes("PLASTICA") || 
        nombrePlanillaAct.includes("MÚSICA") || nombrePlanillaAct.includes("MUSICA") || 
        nombrePlanillaAct.includes("INGLÉS") || nombrePlanillaAct.includes("INGLES") || 
        nombrePlanillaAct.includes("ESPECIAL");

    if (esMateriaEspecial) {
        divContador.style.cursor = 'default';
        divContador.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 10px; width: 100%;">
                <i class="material-icons" style="color: #757575;">group</i>
                <span>Total: ${alumnosVisibles} alumnos</span>
            </span>
        `;
    } else {
        divContador.style.cursor = 'pointer';
        divContador.onclick = function() { visualizarDashboard(); };
        divContador.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 10px; width: 100%; justify-content: space-between;">
                <span style="display: inline-flex; align-items: center; gap: 10px;">
                    <i class="material-icons" style="color: #757575;">group</i>
                    <span id="texto-total-alumnos">Total: ${alumnosVisibles} alumnos</span>
                </span>
                <i class="material-icons" style="font-size: 1.2rem; color: #1565c0;" title="Ver Dashboard">bar_chart</i>
            </span>
        `;
    }

    sidebar.appendChild(divContador);
    if (sheetNames.length > 0) {
        selectHoja.value = sheetNames[0];
        actualizarBadgeVisual(sheetNames[0]);
    }
    
    const btnAgregarAlGrado = document.getElementById('btn-agregar-alumno-grado');
    if (btnAgregarAlGrado) {
        btnAgregarAlGrado.style.display = (typeof puedeAgregarAlumnoEnPlanillaActual === 'function' && puedeAgregarAlumnoEnPlanillaActual()) ? 'inline-flex' : 'none';
    }

    cargarDatosDeAlumno(); 
    actualizarContadorSidebar(); 
}

function esPlanillaEspecialSeleccionada(nombrePlanilla) {
    const nombre = String(nombrePlanilla || (selectPlanilla && selectPlanilla.value) || window.currentPlanillaNombre || '').toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nombre.includes('ESP') || nombre.includes('FISICA') ||
        nombre.includes('PLASTICA') || nombre.includes('MUSICA') ||
        nombre.includes('INGLES') || nombre.includes('ESPECIAL');
}

function esPlanillaSegundoCuatrimestreSeleccionada(nombrePlanilla) {
    const nombre = String(nombrePlanilla || (selectPlanilla && selectPlanilla.value) || window.currentPlanillaNombre || '').toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return /(?:2\s*(?:º|°|DO)?\s*CUAT|SEGUNDO\s*CUAT|CUATRIMESTRE\s*2|II\s*CUAT)/i.test(nombre);
}

function escaparHtmlGrilla(valor) {
    return String(valor === undefined || valor === null ? '' : valor)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function seleccionarAlumnoEnGrilla(formDiv, dni, fila) {
    if (!dni) return;
    selectAlumno.value = dni;
    window.dniAlumnoActual = dni;
    habilitarSelect(selectAlumno, true);
    if (typeof M !== 'undefined' && M.FormSelect) {
        // PERF: No destruimos ni reinicializamos FormSelect aquí, porque el DOM ya está generado
        // y solo estamos cambiando el valor seleccionado, lo cual se actualiza visualmente abajo.
    }
    const selectorVisible = selectAlumno.parentElement &&
        selectAlumno.parentElement.querySelector('input.select-dropdown');
    const opcionSeleccionada = selectAlumno.options[selectAlumno.selectedIndex];
    if (selectorVisible && opcionSeleccionada) {
        selectorVisible.value = opcionSeleccionada.textContent;
    }
    formDiv.querySelectorAll('.esp-grid tbody tr').forEach(row => {
        row.classList.toggle('esp-grid-row-active', row === fila);
    });
    actualizarEstadoHojasSidebar();
    const btnHist = document.getElementById('btn-historial-alumno-actual');
    if (btnHist) btnHist.style.display = window.esUsuarioAdmin ? 'inline-flex' : 'none';
}

function renderizarGrillaEspecial(formDiv, nombreHoja) {
    if (!document.getElementById('estilos-grilla-especial')) {
        const style = document.createElement('style');
        style.id = 'estilos-grilla-especial';
        style.textContent = `
            .esp-grid-wrapper { width: 100%; }
            .esp-grid-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 12px; color: #424242; }
            .esp-grid-toolbar span { color: #757575; }
            .esp-grid-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
            .esp-grid-save { display: flex; }
            .esp-grid-save #btn-guardar { width: auto !important; min-width: 150px; }
            .esp-grid-scroll { overflow-x: auto; max-height: 68vh; border: 1px solid #e0e0e0; border-radius: 8px; }
            .esp-grid { min-width: 760px; white-space: nowrap; }
            .esp-grid th { position: sticky; top: 0; z-index: 1; background: #0d47a1; color: white; font-weight: 600; }
            .esp-grid td, .esp-grid th { padding: 8px 10px; }
            .esp-grid-input { width: 78px !important; min-width: 78px; height: 2rem !important; margin: 0 !important; text-align: center; border-bottom: 1px solid #bdbdbd !important; }
            .esp-grid-input[readonly] { color: #616161; border-bottom-color: transparent !important; }
            .esp-grid-student { border: 0; background: transparent; color: #1565c0; cursor: pointer; font-weight: 600; text-align: left; padding: 0; }
            .esp-grid-row-active,
            .esp-grid-row-active > td { background-color: #d8f3e5 !important; }
            @media (max-width: 600px) {
                .esp-grid-toolbar { align-items: flex-start; gap: 6px; margin-bottom: 8px; }
                .esp-grid-toolbar strong { font-size: 0.95rem; }
                .esp-grid-toolbar > span:not(.esp-grid-actions) { font-size: 0.82rem; }
                .esp-grid-actions { width: 100%; margin-left: 0; justify-content: flex-end; gap: 6px; }
                .esp-grid-save #btn-guardar { min-width: 0; height: 36px; line-height: 36px; padding: 0 12px; font-size: 0.78rem; }
                .esp-grid-save #btn-guardar .material-icons { font-size: 17px; margin-right: 4px; }
                .esp-grid-pdf { width: 36px; height: 36px; line-height: 36px; }
                .esp-grid-pdf .material-icons { line-height: 36px; font-size: 19px; }
                .esp-grid-scroll { max-height: 64vh; -webkit-overflow-scrolling: touch; }
                .esp-grid-scroll { overflow-x: hidden; }
                .esp-grid { min-width: 0; width: 100%; display: block; font-size: 0.82rem; }
                .esp-grid thead { display: none; }
                .esp-grid tbody { display: block; }
                .esp-grid tr { display: block; margin: 8px; border: 1px solid #d5dfe8; border-radius: 8px; overflow: hidden; background: #fff; }
                .esp-grid td { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 38px; padding: 5px 8px; border-bottom: 1px solid #edf1f4; white-space: normal; }
                .esp-grid td:last-child { border-bottom: 0; }
                .esp-grid td::before { content: attr(data-label); flex: 0 0 42%; color: #546e7a; font-size: 0.72rem; font-weight: 700; }
                .esp-grid td:first-child { background: #eaf2fb; color: #0d47a1; font-weight: 700; }
                .esp-grid td:first-child::before { content: 'Nro.'; }
                .esp-grid td:nth-child(2) { background: #f7fbff; }
                .esp-grid td:nth-child(2)::before { content: 'Alumno'; }
                .esp-grid-input { flex: 1 1 auto; width: auto !important; min-width: 0; height: 2rem !important; margin: 0 !important; font-size: 0.9rem !important; text-align: right; }
                .esp-grid-student { flex: 1 1 auto; max-width: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; text-align: right; }
            }
        `;
        document.head.appendChild(style);
    }
    const sheetConfig = cursoCompleto.sheets[nombreHoja] || {};
    const headers = sheetConfig.allHeaders || [];
    const editableFields = sheetConfig.editableFields || [];
    const camposVisibles = headers.filter(header => {
        const upper = String(header || '').toUpperCase();
        const esCampoIdentificacion = ['NRO.', 'DNI', 'D.N.I', 'GRADO', 'SECCION', 'SECCIÓN',
            'APELLIDO', 'NOMBRE', 'ALUMNO', 'APELLIDO Y NOMBRE', 'ACTIVOS', 'ESTADO', 'OCULTO']
            .includes(upper) || upper.includes('GRADO') || upper.includes('SECCION') ||
            upper.includes('SECCIÓN') || upper.includes('DNI');
        return header && !esCampoIdentificacion && !upper.includes('FINAL');
    });
    const alumnos = cursoCompleto.students.filter(alumno => {
        const numeroOrden = obtenerNumeroOrdenEspecial(alumno, nombreHoja);
        if (numeroOrden === Number.MAX_SAFE_INTEGER) {
            return false;
        }
        const datos = alumno.datosHojas.DATOS || {};
        const oculto = String(obtenerValorCampo(datos, 'OCULTO') || '').toUpperCase();
        const estado = obtenerValorCampo(datos, 'ACTIVOS') !== undefined
            ? obtenerValorCampo(datos, 'ACTIVOS') : obtenerValorCampo(datos, 'ESTADO');
        const activo = estado === undefined || ['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(String(estado).toUpperCase());
        return !['SI', 'SÍ', 'TRUE'].includes(oculto) && activo;
    });
    const correo = (sessionStorage.getItem('misericordia_sesion') || emailProcesando || '').trim();
    let html = `<div class="esp-grid-wrapper">
        <div class="esp-grid-toolbar">
            <strong>Detalle de notas</strong>
            <span id="esp-grid-total-alumnos">${alumnos.length} alumnos</span>
            <span class="esp-grid-actions">
                ${correo ? `<button class="btn-floating waves-effect waves-light red darken-3 btn-pdf-icon esp-grid-pdf" title="Exportar grilla a PDF" aria-label="Exportar grilla a PDF" onclick="abrirModalPdf(this, '${escaparHtmlGrilla(nombreHoja)}')"><i class="material-icons">picture_as_pdf</i></button>` : ''}
                <span id="esp-grid-save-host" class="esp-grid-save"></span>
            </span>
        </div>
        <div class="esp-grid-scroll"><table class="highlight esp-grid"><thead><tr>
            <th>Nro.</th><th>Alumno (Apellido, Nombre)</th>`;
    camposVisibles.forEach(header => { html += `<th>${escaparHtmlGrilla(header)}</th>`; });
    html += '</tr></thead><tbody>';
    alumnos.forEach((alumno, index) => {
        const datos = alumno.datosHojas[nombreHoja] || {};
        const rowIndex = datos._rowIndex || '';
        html += `<tr data-grid-row-dni="${escaparHtmlGrilla(alumno.dni)}" data-grid-row-index="${escaparHtmlGrilla(rowIndex)}">
            <td data-label="Nro.">${index + 1}</td>
            <td data-label="Alumno"><button type="button" class="esp-grid-student" data-grid-dni="${escaparHtmlGrilla(alumno.dni)}">${escaparHtmlGrilla(alumno.nombreCompleto)}</button></td>`;
        camposVisibles.forEach(header => {
            let valor = datos[header] === undefined ? '' : datos[header];
            if (esCampoDeNota(header, nombreHoja) && valor !== '' && !isNaN(Number(String(valor).replace(/,/g, '.')))) {
                valor = formatearNotaADosDecimales(valor);
            }
            const headerUpper = String(header || '').toUpperCase();
            if ((headerUpper.includes('PROM') || headerUpper.includes('FINAL')) && (!valor || String(valor).trim() === '')) {
                let suma = 0, cant = 0;
                camposVisibles.forEach(hOther => {
                    const hOtherUp = String(hOther || '').toUpperCase();
                    if (!hOtherUp.includes('PROM') && !hOtherUp.includes('FINAL') &&
                        !hOtherUp.includes('DNI') && !hOtherUp.includes('NRO') &&
                        !hOtherUp.includes('APELLIDO') && !hOtherUp.includes('NOMBRE') &&
                        !hOtherUp.includes('ALUMNO') && !hOtherUp.includes('CONDUCTA') &&
                        !hOtherUp.includes('FECHA') && !hOtherUp.includes('JUSTIFICA')) {
                        const vNum = Number(String(datos[hOther] || '').replace(/,/g, '.'));
                        if (!isNaN(vNum) && vNum > 0) {
                            suma += vNum;
                            cant++;
                        }
                    }
                });
                if (cant > 0) {
                    valor = (Math.trunc((suma / cant) * 100 + 1e-9) / 100).toFixed(2);
                }
            }
            const editable = editableFields.includes(header);
            const id = `grid-${nombreHoja.replace(/[^a-zA-Z0-9]/g, '')}-${alumno.dni}-${header.replace(/[^a-zA-Z0-9]/g, '')}`;
            html += `<td data-label="${escaparHtmlGrilla(header)}"><input id="${escaparHtmlGrilla(id)}" type="text" value="${escaparHtmlGrilla(valor)}"
                data-header-name="${escaparHtmlGrilla(header)}" data-sheet-name="${escaparHtmlGrilla(nombreHoja)}"
                data-grid-dni="${escaparHtmlGrilla(alumno.dni)}" data-grid-row-index="${escaparHtmlGrilla(rowIndex)}"
                class="form-input-editable esp-grid-input" ${editable ? '' : 'readonly'}></td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    formDiv.innerHTML = html;
    const gridSaveHost = formDiv.querySelector('#esp-grid-save-host');
    if (gridSaveHost && btnGuardar) {
        gridSaveHost.appendChild(btnGuardar);
        if (saveButtonContainer) saveButtonContainer.style.display = 'none';
    }
    formDiv.querySelectorAll('.esp-grid tbody tr').forEach(row => {
        const dni = row.dataset.gridRowDni;
        const seleccionarFila = () => {
            seleccionarAlumnoEnGrilla(formDiv, dni, row);
            actualizarEstadoHojasSidebar();
        };
        row.addEventListener('click', seleccionarFila);
        row.querySelectorAll('.esp-grid-input').forEach(input => {
            input.addEventListener('focus', seleccionarFila);
            input.addEventListener('input', seleccionarFila);
        });
        calcularPromedioEnVivo(formDiv, row);
    });
    const selectedRow = formDiv.querySelector(`tr[data-grid-row-dni="${CSS.escape(String(selectAlumno.value))}"]`);
    if (selectedRow) selectedRow.classList.add('esp-grid-row-active');
}

function puedeEditarDatosIdentificacionAlumno() {
    const email = (sessionStorage.getItem('misericordia_sesion') || emailProcesando || '').toLowerCase().trim();
    if (!email) return false;

    // 1. Superusuarios y Administradores del sistema
    if (window.esUsuarioAdmin === true) return true;
    if (email === "misericordiaplanillas@gmail.com" || email === "victorojas2025@gmail.com") return true;

    // 2. Directivos escolares
    if (email.startsWith("directivos") || email.includes("directivo")) return true;

    // 2.1 Permisos en tiempo real de la planilla actual cargada (GRANULAR POR PLANILLA)
    if (window.permisosPlanillaActual) {
        if (window.permisosPlanillaActual.soloLectura) return false;
        const areasP = (Array.isArray(window.permisosPlanillaActual.areas) ? window.permisosPlanillaActual.areas : []).map(normalizarNombreArea);
        if (areasP.includes('DATOS')) {
            return true;
        }
        // Si no tiene DATOS en esta planilla, NO puede editar datos aunque tenga materias o TODAS
        return false;
    }

    // 3. Permisos en app_adm_config para la planilla activa
    let usuario = window.usuarioActual;
    if (!usuario) {
        try {
            const cached = sessionStorage.getItem('misericordia_usuario_info');
            if (cached) usuario = JSON.parse(cached);
        } catch(e) {}
    }
    if (usuario) {
        if (usuario.es_admin === true || usuario.esAdmin === true) return true;
        const rol = String(usuario.rol || usuario.Rol || usuario.cargo || usuario.Cargo || '').toLowerCase();
        if (rol.includes('admin') || rol.includes('directiv') || rol.includes('secretar')) return true;

        // 4. Permisos por área asignada específicamente en la planilla actual
        if (Array.isArray(usuario.planillas)) {
            const pAsig = usuario.planillas.find(p => 
                (typeof currentSpreadsheetId !== 'undefined' && currentSpreadsheetId && p.spreadsheet_id && p.spreadsheet_id === currentSpreadsheetId) ||
                (window.currentPlanillaDbId && p.planilla_id && Number(p.planilla_id) === Number(window.currentPlanillaDbId)) ||
                (window.currentPlanillaNombre && p.nombre && (String(p.nombre).trim().toUpperCase() === String(window.currentPlanillaNombre).trim().toUpperCase() || String(window.currentPlanillaNombre).includes(p.nombre)))
            );
            if (pAsig && Array.isArray(pAsig.areas)) {
                const areasP = pAsig.areas.map(normalizarNombreArea);
                if (areasP.includes('DATOS')) return true;
            }
        }
    }

    return false;
}

function renderizarHojaEspecifica(nombreHoja, dni) {
    if (nombreHoja === "SISTEMA_AUDITORIA") return;
    const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
    
    if (!formDiv || formDiv.innerHTML.trim() !== '') return; 

    // 🚀 PERF: O(1) lookup
    const alumno = studentsByDni.get(String(dni));
    if (!alumno) return;

    const sheetConfig = cursoCompleto.sheets[nombreHoja];
    const studentData = alumno.datosHojas[nombreHoja] || {};
    const headers = sheetConfig.allHeaders || [];
    const editableFields = sheetConfig.editableFields || [];

    if (esPlanillaEspecialSeleccionada() && nombreHoja !== 'DATOS') {
        renderizarGrillaEspecial(formDiv, nombreHoja);
        return;
    }

    let fieldsToHide = ["grado", "seccion", "oculto"];
    if (nombreHoja.toUpperCase() !== "DATOS") {
      fieldsToHide.push("apellido", "nombre");
    }
    const nombrePlanillaSeleccionada = selectPlanilla.value.toUpperCase() || "";

    if (nombrePlanillaSeleccionada.includes("PLÁSTICA") || nombrePlanillaSeleccionada.includes("PLASTICA")) {
        fieldsToHide.push("promedio música", "promedio musica", "prom. general", "promedio general");
    }

    let htmlContent = '<div class="row">';
    
    if (nombreHoja.toUpperCase() === "PLANILLAS_CALIF_MAT" || nombreHoja.toUpperCase() === "PLANILLAS_CALIF_LENG") {
        htmlContent += `
        <div class="col s12 center-align" style="margin-top: 40px; margin-bottom: 40px;">
            <i class="material-icons" style="font-size: 4rem; color: #c62828;">picture_as_pdf</i>
            <h5 style="color: #424242;">Planilla Oficial de Calificaciones</h5>
            <p style="color: #757575; max-width: 400px; margin: 10px auto;">Esta sección es de solo lectura y visualización.
            Haz clic en el botón inferior para abrir la planilla completa en formato PDF.</p>
            <button class="waves-effect waves-light btn-large red darken-3" onclick="abrirModalPdf(this, '${nombreHoja}')" style="margin-top: 20px;">
                <i class="material-icons left">download</i>Visualizar en PDF
            </button>
        </div></div>`;
        formDiv.innerHTML = htmlContent;
        return;
    }

    const esPlanillaPromocion = String(nombreHoja || '').toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION');
    if (esPlanillaPromocion) {
        htmlContent += `
        <div class="col s12 center-align" style="margin-top: 40px; margin-bottom: 40px;">
            <i class="material-icons" style="font-size: 4rem; color: #1565c0;">assignment_turned_in</i>
            <h5 style="color: #424242;">Planilla Oficial de Promoción Anual</h5>
            <p style="color: #757575; max-width: 450px; margin: 10px auto;">Esta sección consolida la promoción y calificaciones finales de los alumnos del curso.
            Haz clic en el botón inferior para abrir o exportar el documento oficial en formato PDF.</p>
            <button class="waves-effect waves-light btn-large blue darken-3" onclick="abrirModalPdf(this, '${nombreHoja}')" style="margin-top: 20px;">
                <i class="material-icons left">picture_as_pdf</i>Visualizar Planilla de Promoción
            </button>
        </div></div>`;
        formDiv.innerHTML = htmlContent;
        return;
    }

    // Mostrar icono de exportar y (si corresponde) botón de visualizar boletín en la misma línea
    // Determinar usuario actual para controlar visibilidad de controles
    const currentUserEmail = (sessionStorage.getItem('misericordia_sesion') || emailProcesando || '').toLowerCase().trim();

    htmlContent += `
    <div class="col s12 pdf-button-group">
    `;

    // Mostrar icono de exportar PDF solo si hay una sesión válida (usuario autenticado)
    if (currentUserEmail) {
        htmlContent += `
        <button class="btn-floating waves-effect waves-light red darken-3 btn-pdf-icon" title="Exportar hoja a PDF" onclick="abrirModalPdf(this, '${nombreHoja}')">
            <i class="material-icons">picture_as_pdf</i>
        </button>
        `;
    }

    if (nombreHoja.toUpperCase().includes("BOLETIN")) {
        // El ojo de vista individual del boletín lo pueden ver Victor y el superusuario,
        // pero el botón del menú de generación sigue reservado al superusuario.
        const isAllowedEye = Boolean(window.puedeVerBoletinAlumno) || (currentUserEmail === 'misericordiaplanillas@gmail.com');
        if (isAllowedEye) {
            htmlContent += `
        <button id="btn-generar-pdf-boletin" class="btn-floating waves-effect waves-light red darken-3 btn-pdf-icon" title="Visualizar boletín" onclick="handleVerBoletinClick(this)" aria-label="Visualizar boletín del alumno" data-boletin-active="false" aria-pressed="false">
            <i class="material-icons">visibility_off</i>
        </button>
    `;
        }
    }

    // Cerrar el contenedor flex pdf-button-group
    htmlContent += `</div>`;

    if (nombreHoja.toUpperCase() === "DATOS" && editableFields.length === 0) {
        htmlContent += `
        <div class="col s12" style="margin-bottom: 12px;">
            <div style="background: #e8f4fd; border-left: 4px solid #0288d1; padding: 10px 14px; border-radius: 6px; color: #01579b; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <i class="material-icons tiny">lock_outline</i>
                <span><strong>Área en solo lectura:</strong> Tu usuario tiene permisos habilitados para calificar sus materias correspondientes, pero no tiene asignado el permiso de edición de Datos del Alumno.</span>
            </div>
        </div>`;
    }

    headers.forEach(header => {
        if (!header || fieldsToHide.includes(String(header).toLowerCase())) return;
        const headerStr = String(header).trim();
        const headerUpper = headerStr.toUpperCase();
        if (headerUpper === "DNI" && nombreHoja !== "DATOS") return;
        
        let valor = studentData[header] !== undefined ? studentData[header] : "";
        if (esCampoDeNota(header, nombreHoja) && valor !== "" && !isNaN(Number(String(valor).replace(/,/g, '.')))) {
            valor = formatearNotaADosDecimales(valor);
        }
        let esEditable = editableFields.includes(header) && !window.planillaSoloLectura;

        const esCampoNumeroOrden = /^(NRO\.?|N°|Nº|NUMERO|NUMERO DE ORDEN|ORDEN)$/i.test(headerUpper.replace(/\s+/g, ' '));
        if (esCampoNumeroOrden) {
            const datosPersonales = (alumno.datosHojas && alumno.datosHojas["DATOS"]) || {};
            const num = obtenerValorCampo(datosPersonales, "NRO.") ??
                        obtenerValorCampo(datosPersonales, "NRO") ??
                        studentData[header] ??
                        alumno.numeroOrden;
            if (num !== undefined && num !== null && num !== "") {
                valor = String(num);
            }
            esEditable = false;
        }

        const esCampoIdentificacionProtegido = /^(DNI|D\.N\.I|APELLIDO|NOMBRE|APELLIDO Y NOMBRE|ALUMNO)$/i.test(headerUpper.replace(/\s+/g, ' '));
        if (esCampoIdentificacionProtegido && !puedeEditarDatosIdentificacionAlumno()) {
            esEditable = false;
        }

        if (nombreHoja.toUpperCase().includes("BOLETIN")) {
            esEditable = headerUpper === "MAESTRA" && !window.planillaSoloLectura;
            const esCampoCalificacionBoletin = !esEditable && (
                headerUpper === "LENGUA" ||
                headerUpper.includes("MATEMÁTICA") || headerUpper.includes("MATEMATICA") ||
                headerUpper.includes("SOCIALES") ||
                headerUpper.includes("NATURALES") || headerUpper.includes("TECNOLOGIA") || headerUpper.includes("TEGNOLOGIA") ||
                headerUpper.includes("ARTÍSTICA") || headerUpper.includes("ARTISTICA") ||
                headerUpper.includes("FÍSICA") || headerUpper.includes("FISICA") ||
                headerUpper.includes("EXTRANJERA") || headerUpper.includes("INGLÉS") || headerUpper.includes("INGLES") ||
                headerUpper.includes("CONDUCTA") ||
                headerUpper.includes("JUSTIFICA") ||
                headerUpper.includes("PROM") || headerUpper.includes("FINAL")
            );
            if (esCampoCalificacionBoletin) {
                const valorDesdeOrigen = obtenerValorBoletinDesdeDatosFuente(alumno, headerUpper);
                valor = (valorDesdeOrigen !== null && valorDesdeOrigen !== undefined) ? valorDesdeOrigen : "";
                alumno.datosHojas[nombreHoja] = alumno.datosHojas[nombreHoja] || {};
                try {
                    alumno.datosHojas[nombreHoja][headerStr] = valor;
                } catch (e) {}
            }
        }

        const idInput = `input-${headerStr.replace(/[^a-zA-Z0-9]/g, '_')}-${nombreHoja.replace(/\s+/g, '')}`;
        
        if (headerUpper === "ACTIVOS" || headerUpper === "ESTADO") {
            if (nombreHoja !== "DATOS") return;
            const isChecked = (String(valor).toUpperCase() === 'TRUE' || String(valor).toUpperCase() === 'VERDADERO' || String(valor).toUpperCase() === 'SI' || String(valor).toUpperCase() === 'SÍ' || valor === '1');
            htmlContent += `
            <div class="col s12 m6 l4" style="margin-top: 15px; margin-bottom: 15px;">
                <label>
                    <input type="checkbox" id="${idInput}" class="form-input-editable filled-in" data-header-name="${header}" data-sheet-name="${nombreHoja}" ${isChecked ? 'checked' : ''} ${!esEditable ? 'disabled' : ''}>
                    <span style="font-weight: bold; color: #1565c0; font-size: 1.1rem;">Estado: ${header}</span>
                </label>
            </div>`;
            const puedeAgregarAl = typeof puedeAgregarAlumnoEnPlanillaActual === 'function' && puedeAgregarAlumnoEnPlanillaActual();
            if (!window.planillaSoloLectura && (puedeAgregarAl || esEditable)) {
                htmlContent += `
                <div class="col s12 m6 l8 right-align" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
                    ${puedeAgregarAl ? `
                    <button type="button" class="btn waves-effect waves-light green darken-2" onclick="window.abrirModalAgregarAlumnoGrado && window.abrirModalAgregarAlumnoGrado()">
                        <i class="material-icons left">person_add</i>Agregar Alumno
                    </button>` : ''}
                    ${esEditable ? `
                    <button type="button" id="btn-ocultar-${idInput}" class="btn waves-effect waves-light red darken-3" onclick="eliminarAlumnoUI('${idInput}')" ${isChecked ? 'disabled' : ''}>
                        <i class="material-icons left">person_remove</i>Ocultar Alumno
                    </button>` : ''}
                </div>`;
            }
            return;
        }

        let atributoPlaceholder = headerUpper.includes("FECHA") ? ' placeholder="DD/MM/AAAA"' : "";
        let iconoCandado = "";
        if (esCampoIdentificacionProtegido && !puedeEditarDatosIdentificacionAlumno()) {
            iconoCandado = ' <i class="material-icons tiny" style="vertical-align: middle; color: #e65100; font-size: 0.95rem;" title="Campo de identificación protegido: Solo usuarios con permiso pueden modificarlo">lock</i>';
            if (!esEditable) {
                atributoPlaceholder += ' style="background-color: #f7f9fa !important; color: #546e7a !important; cursor: not-allowed;" title="Campo de identificación protegido: Solo usuarios con permiso pueden modificarlo"';
            }
        }
        const esHojaDatos = nombreHoja.toUpperCase() === "DATOS";
        const esNotaNum = typeof esCampoDeNota === 'function' && esCampoDeNota(header, nombreHoja);
        const atributoInputMode = esNotaNum ? ' inputmode="decimal"' : '';
        const colClass = esHojaDatos ? 'col s12 m6 l4' : 'col s6 m6 l4';
        let labelTextoVisual = String(header).replace(/\s*\r?\n\s*/g, ' ').trim();
        if (/^PROM(EDIO)?\.{0,3}$/i.test(labelTextoVisual)) {
            labelTextoVisual = 'Prom.';
        }

        htmlContent += `<div class="input-field ${colClass}">`;
        
        if (headerUpper.includes("CONDUCTA") && esEditable) {
            htmlContent += `<select id="${idInput}" data-header-name="${header}" data-sheet-name="${nombreHoja}" class="form-input-editable">
                <option value="" ${!valor ? 'selected' : ''}>- Sin asignar (Vacío) -</option>
                <option value="MB" ${String(valor).toUpperCase() === 'MB' ? 'selected' : ''}>MB - Muy Bueno</option>
                <option value="B" ${String(valor).toUpperCase() === 'B' ? 'selected' : ''}>B - Bueno</option>
                <option value="R" ${String(valor).toUpperCase() === 'R' ? 'selected' : ''}>R - Regular</option>
            </select>`;
        } else {
            if (esEditable) {
                htmlContent += `<input id="${idInput}" type="text" value="${valor}" data-header-name="${header}" data-sheet-name="${nombreHoja}" class="form-input-editable"${atributoInputMode} ${atributoPlaceholder}>`;
            } else {
                htmlContent += `<input id="${idInput}" type="text" value="${valor}" data-header-name="${header}" data-sheet-name="${nombreHoja}" readonly${atributoInputMode} ${atributoPlaceholder}>`;
            }
        }
        htmlContent += `<label for="${idInput}" class="active" title="${labelTextoVisual}">${labelTextoVisual}${iconoCandado}</label></div>`;
    });

    htmlContent += '</div>';
    formDiv.innerHTML = htmlContent;

    reiniciarEventosUICompleto();
    M.FormSelect.init(formDiv.querySelectorAll('select'));
    
    const cbActivo = formDiv.querySelector('input[type="checkbox"][data-header-name="ACTIVOS"], input[type="checkbox"][data-header-name="ESTADO"]');
    if(cbActivo) {
        cbActivo.addEventListener('change', () => {
            aplicarEstadoInactivoVisual();
            actualizarContadorSidebar();
        });
    }
    aplicarEstadoInactivoVisual();

    // Recalcular el promedio en vivo al renderizar, para que la hoja muestre
    // siempre el promedio actual de las notas (no el valor viejo hasta guardar).
    if (nombreHoja.toUpperCase() !== "DATOS" &&
        !nombreHoja.toUpperCase().includes("BOLETIN") &&
        !nombreHoja.toUpperCase().includes("AUDITORIA")) {
        calcularPromedioEnVivo(formDiv);
    }
}

function cargarDatosDeAlumno() {
    const dni = selectAlumno.value;
    const btnHist = document.getElementById('btn-historial-alumno-actual');
    if (btnHist) btnHist.style.display = (window.esUsuarioAdmin && dni) ? 'inline-flex' : 'none';
    const btnAgregarAlGrado = document.getElementById('btn-agregar-alumno-grado');
    if (btnAgregarAlGrado) {
        btnAgregarAlGrado.style.display = (typeof puedeAgregarAlumnoEnPlanillaActual === 'function' && puedeAgregarAlumnoEnPlanillaActual()) ? 'inline-flex' : 'none';
    }
    if (!dni || !cursoCompleto) return;
    window.dniAlumnoActual = dni;
    hojasModificadasDelAlumno.clear();

    if (btnGuardar && contenedorOriginalGuardar && btnGuardar.parentElement !== contenedorOriginalGuardar) {
        contenedorOriginalGuardar.appendChild(btnGuardar);
    }
    cursoCompleto.sheetOrder.forEach(nombreHoja => {
        if (nombreHoja !== "SISTEMA_AUDITORIA") {
            const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
            if (formDiv) formDiv.innerHTML = ''; 
        }
    });

    // Calcular en memoria los promedios de materias para el alumno actual si aún no están calculados
    const alumnoObj = studentsByDni.get(String(dni));
    if (alumnoObj && alumnoObj.datosHojas) {
        Object.keys(alumnoObj.datosHojas).forEach(nombreHoja => {
            const upper = nombreHoja.toUpperCase();
            if (upper.includes("DATOS") || upper.includes("BOLETIN") || upper.includes("AUDITORIA") ||
                upper.includes("ASISTENCIA") || upper.includes("CONDUCTA") || upper.includes("ESPECIAL")) {
                return;
            }
            const dHoja = alumnoObj.datosHojas[nombreHoja] || {};
            const headers = cursoCompleto.sheets[nombreHoja] ? cursoCompleto.sheets[nombreHoja].allHeaders : Object.keys(dHoja);
            const promHeaders = headers.filter(h => {
                const u = String(h || "").toUpperCase();
                return u.includes("PROM") || u.includes("FINAL") || u.includes("TOTAL");
            });
            if (promHeaders.length > 0) {
                let sumaCentavos = 0;
                let cantidadNotas = 0;
                const camposAContar = (cursoCompleto.sheets[nombreHoja] && cursoCompleto.sheets[nombreHoja].editableFields) ? cursoCompleto.sheets[nombreHoja].editableFields : headers;
                camposAContar.forEach(h => {
                    if (!esCabeceraNotaRequerida(h, nombreHoja)) return;
                    const v = String(dHoja[h] ?? "").trim().replace(/,/g, ".");
                    if (v !== "" && !isNaN(Number(v))) {
                        sumaCentavos += Math.round(Number(v) * 100);
                        cantidadNotas++;
                    }
                });
                if (cantidadNotas > 0) {
                    const promCalc = (Math.trunc(sumaCentavos / cantidadNotas + 1e-9) / 100).toFixed(2);
                    promHeaders.forEach(ph => {
                        dHoja[ph] = promCalc;
                    });
                } else {
                    promHeaders.forEach(ph => {
                        dHoja[ph] = "";
                    });
                }
            }
        });

        // Sincronizar también la hoja de boletín en memoria para el alumno actual
        const hojaBoletinNombreMem = obtenerNombreHojaBoletin();
        if (hojaBoletinNombreMem && alumnoObj.datosHojas[hojaBoletinNombreMem]) {
            const dBol = alumnoObj.datosHojas[hojaBoletinNombreMem];
            const headersBol = cursoCompleto.sheets[hojaBoletinNombreMem] ? cursoCompleto.sheets[hojaBoletinNombreMem].allHeaders : Object.keys(dBol);
            headersBol.forEach(h => {
                const hUpper = String(h || "").toUpperCase();
                if (hUpper === "MAESTRA" || hUpper.includes("DNI") || hUpper.includes("APELLIDO") || hUpper.includes("NOMBRE") || hUpper.includes("TURNO") || hUpper.includes("CICLO") || hUpper.includes("AÑO")) return;
                const valOrigen = obtenerValorBoletinDesdeDatosFuente(alumnoObj, hUpper);
                dBol[h] = (valOrigen !== null && valOrigen !== undefined) ? valOrigen : "";
            });
        }
    }

    const hojaActiva = selectHoja.value;
    if (hojaActiva && hojaActiva !== "SISTEMA_AUDITORIA") {
        const esBoletinActivo = hojaActiva.toUpperCase().includes("BOLETIN");
        // 🚀 PERF: Renderizado lazy. Ya no pre-renderizamos todas las hojas ocultas.
        // Los promedios se alimentarán de la memoria o se calcularán de forma diferida.
        renderizarHojaEspecifica(hojaActiva, dni);
        actualizarContadorSidebar();
        if (hojaActiva.toUpperCase().includes("BOLETIN")) {
            actualizarBoletinDesdeDOM(hojaActiva);
        }
    }

    const esEspecial = esPlanillaEspecialSeleccionada();
    if (btnAnterior && btnAnterior.parentElement) {
        btnAnterior.parentElement.style.display = esEspecial ? 'none' : '';
    }
    if (btnSiguiente && btnSiguiente.parentElement) {
        btnSiguiente.parentElement.style.display = esEspecial ? 'none' : '';
    }
    if (btnGuardar && btnGuardar.parentElement) {
        btnGuardar.parentElement.classList.toggle('s12', esEspecial);
        btnGuardar.parentElement.classList.toggle('s4', !esEspecial);
        btnGuardar.parentElement.style.width = esEspecial ? 'auto' : '';
    }
    if (saveButtonContainer) {
        saveButtonContainer.style.display = esEspecial ? 'flex' : 'block';
        saveButtonContainer.style.justifyContent = esEspecial ? 'flex-end' : '';
    }
    actualizarEstadoHojasSidebar();
    aplicarEstadoInactivoVisual();
}

function truncarPromedio(valorCrudo) {
    if (valorCrudo === null || valorCrudo === undefined || valorCrudo === '') return '';
    let num = (typeof valorCrudo === 'number') ? valorCrudo : Number(String(valorCrudo).replace(/,/g, '.'));
    if (!isFinite(num)) return String(valorCrudo);
    const trunc = Math.trunc(num * 100 + 1e-9) / 100;
    try { return Number(trunc).toFixed(2); } catch (e) { return String(trunc); }
}

function calcularPromedioEnVivo(formDiv, filaObjetivo = null) {
  let sumaCentavos = 0;
  let cantidadNotas = 0;
  const inputsPromedio = [];
  const inputsPromedioGeneral = [];
  let inputPromedioMusica = null;
    const contenedorCalculo = filaObjetivo || formDiv;
    const todosLosInputs = contenedorCalculo.querySelectorAll('input');

  todosLosInputs.forEach(campo => {
    const header = (campo.getAttribute('data-header-name') || "").toUpperCase();
    if (header.includes('MÚSICA') || header.includes('MUSICA')) {
      if (header.includes('PROM')) inputPromedioMusica = campo;
      return;
    }
    if (header.includes('PROM') || header.includes('FINAL')) {
      if (header.includes('GENERAL')) {
        inputsPromedioGeneral.push(campo);
      } else {
        inputsPromedio.push(campo);
      }
      return;
    }
    if (campo.type !== 'checkbox' &&
             !esColumnaNoDeNota(header)) {

      let valorCrudo = campo.value.trim().replace(/,/g, '.');

      if (valorCrudo !== '' && !isNaN(Number(valorCrudo))) {
        sumaCentavos += Math.round(Number(valorCrudo) * 100);
        cantidadNotas++;
      }
    }
  });

  if (inputsPromedio.length > 0 || inputsPromedioGeneral.length > 0) {
    const promedioNotas = cantidadNotas > 0
      ? (Math.trunc(sumaCentavos / cantidadNotas + 1e-9) / 100).toFixed(2)
      : "";
    const valoresParaPromedioGeneral = [];
    if (promedioNotas !== "") {
      const promedioNotasNumerico = Number(promedioNotas);
      if (Number.isFinite(promedioNotasNumerico)) {
        valoresParaPromedioGeneral.push(promedioNotasNumerico);
      }
    }
    if (inputPromedioMusica) {
      const valorMusica = Number(String(inputPromedioMusica.value || "").replace(/,/g, "."));
      if (Number.isFinite(valorMusica)) {
        valoresParaPromedioGeneral.push(valorMusica);
      }
    }

    const valorPromedioGeneral = valoresParaPromedioGeneral.length > 0
      ? (Math.trunc((valoresParaPromedioGeneral.reduce((suma, valor) => suma + valor, 0) / valoresParaPromedioGeneral.length) * 100 + 1e-9) / 100).toFixed(2)
      : "";

    inputsPromedio.forEach(inputPromedio => {
      inputPromedio.value = promedioNotas;
      inputPromedio.style.fontWeight = promedioNotas ? 'bold' : 'normal';
      inputPromedio.style.color = promedioNotas ? '#2e7d32' : 'inherit';

      // Mantener ambos cálculos visibles al cambiar de hoja sin enviarlos
      // como datos editables al guardado de la planilla.
      const hojaProm = inputPromedio.getAttribute('data-sheet-name');
      const headerProm = inputPromedio.getAttribute('data-header-name');
      const dniFila = inputPromedio.getAttribute('data-grid-dni') ||
                      (filaObjetivo && filaObjetivo.getAttribute('data-grid-row-dni')) ||
                      window.dniAlumnoActual;
      if (hojaProm && headerProm && dniFila && typeof cursoCompleto !== 'undefined' && cursoCompleto) {
        const estudianteProm = studentsByDni.get(String(dniFila));
        if (estudianteProm) {
          estudianteProm.datosHojas = estudianteProm.datosHojas || {};
          estudianteProm.datosHojas[hojaProm] = estudianteProm.datosHojas[hojaProm] || {};
          estudianteProm.datosHojas[hojaProm][headerProm] = promedioNotas;
        }
      }
    });

    inputsPromedioGeneral.forEach(inputPromedioGeneral => {
      inputPromedioGeneral.value = valorPromedioGeneral;
      inputPromedioGeneral.style.fontWeight = valorPromedioGeneral ? 'bold' : 'normal';
      inputPromedioGeneral.style.color = valorPromedioGeneral ? '#2e7d32' : 'inherit';

      const hojaProm = inputPromedioGeneral.getAttribute('data-sheet-name');
      const headerProm = inputPromedioGeneral.getAttribute('data-header-name');
      const dniFila = inputPromedioGeneral.getAttribute('data-grid-dni') ||
                      (filaObjetivo && filaObjetivo.getAttribute('data-grid-row-dni')) ||
                      window.dniAlumnoActual;
      if (hojaProm && headerProm && dniFila && typeof cursoCompleto !== 'undefined' && cursoCompleto) {
        const estudianteProm = studentsByDni.get(String(dniFila));
        if (estudianteProm) {
          estudianteProm.datosHojas = estudianteProm.datosHojas || {};
          estudianteProm.datosHojas[hojaProm] = estudianteProm.datosHojas[hojaProm] || {};
          estudianteProm.datosHojas[hojaProm][headerProm] = valorPromedioGeneral;
        }
      }
    });

    M.updateTextFields();
  }
}

function forzarSincronizacionAntesDeGuardar() {
    // For compatibility keep existing synchronous behavior but allow quick event loop flush
    const elementoActivo = document.activeElement;
    if (elementoActivo && elementoActivo.classList && elementoActivo.classList.contains('form-input-editable')) {
        manejarCambioInputDelegado({ target: elementoActivo, type: 'change' });
    }

    const editables = document.querySelectorAll('.form-input-editable');
    editables.forEach(input => {
        if (!input) return;
        if (typeof input._memoriaAnterior === 'undefined') {
            input._memoriaAnterior = input.type === 'checkbox' ? input.defaultChecked : input.defaultValue;
            return;
        }

        const estadoActual = input.type === 'checkbox' ? input.checked : input.value;
        if (estadoActual !== input._memoriaAnterior) {
            input._memoriaAnterior = estadoActual;
            cambiosPendientes = true;
            const hojaActualMemoria = input.getAttribute('data-sheet-name');
            if (hojaActualMemoria) hojasModificadasDelAlumno.add(hojaActualMemoria);
        }
    });

    sincronizarAlumnoActualConFormulario();

    // devolver una promesa resuelta en el próximo tick para permitir awaiting cuando sea necesario
    try {
        return new Promise(function(resolve) { setTimeout(resolve, 0); });
    } catch (e) { return Promise.resolve(); }
}

function manejarCambioInputDelegado(evento) {
    const input = evento.target;
    if (!input.classList.contains('form-input-editable')) return;
    const dniGrilla = input.getAttribute('data-grid-dni');
    const hojaGrilla = input.getAttribute('data-sheet-name');
    if (dniGrilla && hojaGrilla) {
        const claveGrilla = `${dniGrilla}::${hojaGrilla}`;
        const headerGrilla = input.getAttribute('data-header-name');
        const cambioGrilla = cambiosGrillaEspecial.get(claveGrilla) || {
            dni: dniGrilla,
            hoja: hojaGrilla,
            campos: new Set()
        };
        if (!(cambioGrilla.campos instanceof Set)) cambioGrilla.campos = new Set(cambioGrilla.campos || []);
        if (headerGrilla) cambioGrilla.campos.add(headerGrilla);
        cambiosGrillaEspecial.set(claveGrilla, cambioGrilla);
    }

    const header = (input.getAttribute('data-header-name') || "").toUpperCase();
    const hojaActual = input.getAttribute('data-sheet-name') || ""; 

    const esNota = input.type !== 'checkbox' &&
        hojaActual !== "DATOS" &&
        !hojaActual.toUpperCase().includes("BOLETIN") && 
        !header.includes("FECHA") &&
        !header.includes("DNI") &&
        !header.includes("CONDUCTA") &&
        !header.includes("JUSTIFICA");

    if (esNota) {
        let valor = input.value;
        valor = valor.replace(/,/g, '.');
        valor = valor.replace(/[^0-9.]/g, '');

        const partes = valor.split('.');
        if (partes.length > 2) {
            valor = partes[0] + '.' + partes[1];
        }
        if (partes.length === 2 && partes[1].length > 2) {
            valor = partes[0] + '.' + partes[1].substring(0, 2);
        }
        if (parseFloat(valor) > 10) {
            valor = "10";
        }
        if ((evento.type === 'change' || evento.type === 'focusout') && valor !== "") {
            const num = parseFloat(valor);
            if (!isNaN(num)) {
                let n = num;
                if (n < 1) {
                    n = 1;
                    M.toast({html: 'La nota mínima es 1', classes: 'orange darken-3', displayLength: 2000});
                } else if (n > 10) {
                    n = 10;
                }
                valor = (Math.trunc(n * 100 + 1e-9) / 100).toFixed(2);
            }
        }
        if (input.value !== valor) {
            input.value = valor;
        }

        // Recalcular el promedio en vivo apenas cambia una nota,
        // sin depender del guardado ni del bloque de sincronización.
        const formDivEnVivo = input.closest('.form-container-interno');
        if (formDivEnVivo) calcularPromedioEnVivo(formDivEnVivo, input.closest('tr'));
    } else if (header.includes("JUSTIFICA")) {
        let valor = input.value;
        valor = valor.replace(/[^0-9]/g, '');

        if (valor !== "") {
            let num = parseInt(valor, 10);
            if (num > 999) {
                valor = "999";
                M.toast({html: 'El límite máximo es 999', classes: 'orange darken-3', displayLength: 2000});
            }
        }
        if (input.value !== valor) {
            input.value = valor;
        }
    } 
    else if (hojaActual === "DATOS") {
        if (header.includes("DNI")) {
            let valor = input.value.replace(/[^0-9]/g, '');
            if (valor.length > 8) valor = valor.substring(0, 8);
            if (input.value !== valor) input.value = valor;
        } 
        else if (header.includes("TEL") || header.includes("CEL")) {
            let valor = input.value.replace(/[^0-9+]/g, '');
            if (valor.length > 12) valor = valor.substring(0, 12);
            if (input.value !== valor) input.value = valor;
        } 
        else if (header.includes("FECHA")) {
            if (evento.type === 'input') {
                let valor = input.value.replace(/[^0-9]/g, ''); 
                if (valor.length > 8) valor = valor.substring(0, 8); 

                if (valor.length >= 5) {
                    valor = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4, 8);
                } else if (valor.length >= 3) {
                    valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
                }
                
                if (input.value !== valor) input.value = valor;
            }
        }
        else if (header.includes("APELLIDO") || header.includes("NOMBRE")) {
            let valor = input.value.replace(/[0-9]/g, '');
            if (input.value !== valor) input.value = valor;
        }
    }

    if (header === "MAESTRA" && hojaActual.toUpperCase().includes("BOLETIN")) {
        let valor = input.value.replace(/[0-9]/g, '');
        if (input.value !== valor) input.value = valor;
        
        if (typeof cursoCompleto !== 'undefined' && cursoCompleto) {
            cursoCompleto.students.forEach(st => {
                if (st.datosHojas[hojaActual]) {
                    st.datosHojas[hojaActual]["MAESTRA"] = input.value;
                }
            });
        }
    }
    if (!input.hasOwnProperty('_memoriaAnterior')) {
        input._memoriaAnterior = input.type === 'checkbox' ? input.defaultChecked : input.defaultValue;
    }
    
    let estadoActual = input.type === 'checkbox' ? input.checked : input.value;

    const cambioDetectado = estadoActual !== input._memoriaAnterior;
    if (cambioDetectado) {
        input._memoriaAnterior = estadoActual; 

        cambiosPendientes = true;
        const hojaActualMemoria = input.getAttribute('data-sheet-name');
        if (hojaActualMemoria) hojasModificadasDelAlumno.add(hojaActualMemoria);

    // Persistir inmediatamente el cambio en el modelo en memoria para evitar pérdida
    try {
        if (typeof cursoCompleto !== 'undefined' && cursoCompleto && window.dniAlumnoActual) {
            const dniInput = input.getAttribute('data-grid-dni') || window.dniAlumnoActual;
            const alumnoMem = studentsByDni.get(String(dniInput));
            if (alumnoMem) {
                alumnoMem.datosHojas = alumnoMem.datosHojas || {};
                var hojaKey = input.getAttribute('data-sheet-name');
                var headerKey = input.getAttribute('data-header-name');
                if (hojaKey && headerKey) {
                    alumnoMem.datosHojas[hojaKey] = alumnoMem.datosHojas[hojaKey] || {};
                    if (input.type === 'checkbox') {
                        alumnoMem.datosHojas[hojaKey][headerKey] = input.checked ? true : false;
                    } else {
                        alumnoMem.datosHojas[hojaKey][headerKey] = input.value;
                    }
                }
            }
        }
    } catch (e) { /* ignore */ }

    if (!input.getAttribute('data-grid-dni') ||
        String(input.getAttribute('data-grid-dni')) === String(window.dniAlumnoActual)) {
        sincronizarAlumnoActualConFormulario();
    }

    btnGuardar.textContent = 'Cambios sin guardar';
    btnGuardar.classList.remove('grey');
    btnGuardar.classList.add('orange');
    btnGuardar.disabled = false;
    }

    // 🚀 PERF: Debounce para evitar recalcular sidebar y boletín en cada keystroke
    if (esNota || cambioDetectado) {
        _debouncedBoletinUpdate();
    }

    _debouncedSidebarUpdate();
}


// 🚀 PERF: Debounce wrappers para actualizaciones costosas durante edición
let _sidebarUpdateTimer = null;
function _debouncedSidebarUpdate() {
    if (_sidebarUpdateTimer) clearTimeout(_sidebarUpdateTimer);
    _sidebarUpdateTimer = setTimeout(() => {
        _columnasNotasActivasPorHoja = null;
        actualizarEstadoHojasSidebar();
    }, 300);
}
let _boletinUpdateTimer = null;
function _debouncedBoletinUpdate() {
    if (_boletinUpdateTimer) clearTimeout(_boletinUpdateTimer);
    _boletinUpdateTimer = setTimeout(function() {
        const nombreBoletinVivo = obtenerNombreHojaBoletin();
        if (nombreBoletinVivo) actualizarBoletinDesdeDOM(nombreBoletinVivo);
    }, 300);
}

function sincronizarAlumnoActualConFormulario() {
    const dni = window.dniAlumnoActual;
    if (!dni || !cursoCompleto) return;

    // 🚀 PERF: O(1) lookup en vez de .find() lineal
    const alumno = studentsByDni.get(String(dni));
    if (!alumno) return;

    alumno.datosHojas = alumno.datosHojas || {};

    // 🚀 PERF: Limitar query al contenedor activo en vez de todo el documento
    const contenedor = document.getElementById('contenido-hojas');
    (contenedor || document).querySelectorAll('input[data-header-name], select[data-header-name]').forEach(input => {
        const hoja = input.getAttribute('data-sheet-name');
        const headerName = input.getAttribute('data-header-name');
        if (!hoja || !headerName) return;
        const dniGrilla = input.getAttribute('data-grid-dni');
        if (dniGrilla && String(dniGrilla) !== String(dni)) return;

        alumno.datosHojas[hoja] = alumno.datosHojas[hoja] || {};
        if (input.type === 'checkbox') {
            alumno.datosHojas[hoja][headerName] = input.checked ? true : false;
        } else {
            alumno.datosHojas[hoja][headerName] = input.value;
        }
    });
}

function reiniciarEventosUICompleto() {
  if (typeof hojasModificadasDelAlumno !== 'undefined' && hojasModificadasDelAlumno.size > 0) {
    btnGuardar.textContent = 'Cambios sin guardar';
    btnGuardar.disabled = false;
    btnGuardar.classList.remove('grey');
    btnGuardar.classList.add('orange');
    cambiosPendientes = true;
  } else {
    btnGuardar.textContent = 'Guardado';
    btnGuardar.disabled = true;
    btnGuardar.classList.remove('orange', 'red');
    btnGuardar.classList.add('grey');
    cambiosPendientes = false;
  }

  aplicarValidacionNotasGlobal();
  
  const inputs = document.querySelectorAll('.form-input-editable');
  inputs.forEach(input => {
    if (!input.hasOwnProperty('_memoriaAnterior')) {
        input._memoriaAnterior = input.type === 'checkbox' ? input.defaultChecked : input.defaultValue;
    }
  });
}

function esCampoObligatorioDatos(header) {
    if (!header) return false;
    const h = String(header)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();

    if (!h) return false;

    // Solo los campos de identidad primaria del alumno son obligatorios
    return h === 'DNI' || h === 'D.N.I' || h === 'APELLIDO' || h === 'NOMBRE' || h === 'APELLIDO Y NOMBRE';
}

let _columnasNotasActivasPorHoja = null;

function obtenerColumnasNotasActivas(nombreHoja) {
    if (!_columnasNotasActivasPorHoja) {
        _columnasNotasActivasPorHoja = new Map();
    }
    if (_columnasNotasActivasPorHoja.has(nombreHoja)) {
        return _columnasNotasActivasPorHoja.get(nombreHoja);
    }

    const setActivas = new Set();
    if (!cursoCompleto || !Array.isArray(cursoCompleto.students)) {
        _columnasNotasActivasPorHoja.set(nombreHoja, setActivas);
        return setActivas;
    }

    const configHoja = cursoCompleto.sheets[nombreHoja] || {};
    const headers = (configHoja.editableFields && configHoja.editableFields.length > 0)
        ? configHoja.editableFields
        : (configHoja.allHeaders || []);

    headers.forEach(header => {
        if (!header || !esCabeceraNotaRequerida(header, nombreHoja)) return;
        const estaEnUso = cursoCompleto.students.some(st => {
            const d = (st.datosHojas && st.datosHojas[nombreHoja]) ? st.datosHojas[nombreHoja] : {};
            const val = d[header] !== undefined && d[header] !== null ? String(d[header]).trim() : "";
            return val !== "";
        });
        if (estaEnUso) {
            setActivas.add(header);
        }
    });

    _columnasNotasActivasPorHoja.set(nombreHoja, setActivas);
    return setActivas;
}

function actualizarEstadoHojasSidebar() {
    const dniActual = selectAlumno.value;
    // 🚀 PERF: O(1) lookup en vez de .find() lineal
    const alumno = cursoCompleto ? (studentsByDni.get(String(dniActual)) || null) : null;
    if (!alumno || !cursoCompleto) return;

    const estadoHojas = {};
    const sidebarItems = Array.from(document.querySelectorAll('.sidebar-item'));

    // 1. Evaluar cada hoja usando el modelo de datos en memoria
    sidebarItems.forEach(btnLateral => {
        const nombreHoja = btnLateral.getAttribute('data-hoja');
        if (!nombreHoja) return;
        
        // Ignorar hojas que no son de notas ni de asistencia/conducta:
        // DATOS (personales), BOLETINES (resumen), PLANILLA DE PROMOCIÓN (resumen), SISTEMA_AUDITORIA
        const hUpper = nombreHoja.toUpperCase().replace(/[\s_\-]+/g, '');
        const esHojaIgnorada = (
            hUpper === "DATOS" ||
            hUpper.includes("BOLETIN") ||
            hUpper.includes("PROMOCION") ||
            hUpper === "PLANILLASCALIFMAT" ||
            hUpper === "PLANILLASCALIFLENG" ||
            nombreHoja === "SISTEMA_AUDITORIA"
        );

        if (esHojaIgnorada) {
            estadoHojas[nombreHoja] = false;
            return;
        }

        const datosHoja = alumno.datosHojas[nombreHoja] || {};
        const configHoja = cursoCompleto.sheets[nombreHoja] || {};
        const camposAValidar = (configHoja.editableFields && configHoja.editableFields.length > 0)
            ? configHoja.editableFields
            : (configHoja.allHeaders && configHoja.allHeaders.length > 0
                ? configHoja.allHeaders
                : Object.keys(datosHoja));

        // Caso A: Asistencia y Conducta (debe marcar alerta si conducta o asistencias están vacías)
        const esHojaAsistenciaConducta = hUpper.includes("ASISTENCIA") || hUpper.includes("CONDUCTA");
        if (esHojaAsistenciaConducta) {
            let algunCampoAsistenciaVacio = false;
            let tieneCamposAsistencia = false;

            camposAValidar.forEach(header => {
                if (!header) return;
                const hNorm = String(header).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
                const esColIdentidad = esColumnaNoDeNota(header) &&
                    !hNorm.includes('ASIST') && !hNorm.includes('INASIST') &&
                    !hNorm.includes('JUSTIF') && !hNorm.includes('FALTA') &&
                    !hNorm.includes('PRESENTE') && !hNorm.includes('AUSENTE') &&
                    !hNorm.includes('CONDUCT');
                if (esColIdentidad) return;

                tieneCamposAsistencia = true;
                const val = datosHoja[header] !== undefined && datosHoja[header] !== null ? String(datosHoja[header]).trim() : "";
                if (val === "") {
                    algunCampoAsistenciaVacio = true;
                }
            });

            estadoHojas[nombreHoja] = Boolean(tieneCamposAsistencia && algunCampoAsistenciaVacio);
            return;
        }

        // Caso B: Hojas de materias/notas (Lengua, Matemática, Especiales, etc.)
        let totalCamposNota = 0;
        let camposCargados = 0;

        camposAValidar.forEach(header => {
            if (!header || !esCabeceraNotaRequerida(header, nombreHoja)) return;
            totalCamposNota++;
            const valorHoja = datosHoja[header] !== undefined && datosHoja[header] !== null ? String(datosHoja[header]).trim() : "";
            if (valorHoja !== "") {
                camposCargados++;
            }
        });

        // La marca (signo de exclamación) solo desaparece si TODOS los campos o ítems de notas del área están cargados
        if (totalCamposNota > 0) {
            estadoHojas[nombreHoja] = (camposCargados < totalCamposNota);
        } else {
            let totalEnValores = 0;
            let cargadosEnValores = 0;
            for (const [k, v] of Object.entries(datosHoja)) {
                if (esCabeceraNotaRequerida(k, nombreHoja)) {
                    totalEnValores++;
                    if (String(v || '').trim() !== '') {
                        cargadosEnValores++;
                    }
                }
            }
            if (totalEnValores > 0) {
                estadoHojas[nombreHoja] = (cargadosEnValores < totalEnValores);
            } else {
                estadoHojas[nombreHoja] = true;
            }
        }
    });

    // 2. Aplicar las clases CSS visuales a la barra lateral
    sidebarItems.forEach(btnLateral => {
        const nombreHoja = btnLateral.getAttribute('data-hoja');
        if (!nombreHoja) return;

        const incompleto = Boolean(estadoHojas[nombreHoja]);
        const iconoAlerta = btnLateral.querySelector('.icono-alerta');
        const hUpper = nombreHoja.toUpperCase().replace(/[\s_\-]+/g, '');
        const esAsistenciaConducta = hUpper.includes("ASISTENCIA") || hUpper.includes("CONDUCTA");

        if (incompleto) {
            btnLateral.classList.add('incompleta');
            btnLateral.setAttribute('title', esAsistenciaConducta ? 'Faltan datos de asistencia o conducta' : 'Faltan notas por cargar');
            if (iconoAlerta) iconoAlerta.style.display = 'inline-flex';
        } else {
            btnLateral.classList.remove('incompleta');
            btnLateral.removeAttribute('title');
            if (iconoAlerta) iconoAlerta.style.display = 'none';
        }
    });
}

function ejecutarGuardado(nombreHoja, accionSiguiente = null) {
    const dni = selectAlumno.value;
    if (!dni || !nombreHoja || !currentSpreadsheetId) return;
    
    if (typeof hojasGuardando !== 'undefined') {
        if (hojasGuardando.has(nombreHoja)) return;
        hojasGuardando.add(nombreHoja);
    }

    if (selectHoja.value === nombreHoja && btnGuardar) {
        btnGuardar.textContent = 'Guardando...';
        btnGuardar.disabled = true;
    }

    const dataObject = {};
    const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
    const inputsEditables = formDiv.querySelectorAll(
        esPlanillaEspecialSeleccionada() && nombreHoja !== 'DATOS'
            ? `.form-input-editable[data-grid-dni="${CSS.escape(String(dni))}"]`
            : '.form-input-editable'
    );
    
    inputsEditables.forEach(input => {
        const headerName = input.getAttribute('data-header-name');
        const headerUpper = (headerName || "").toUpperCase();

       if (!headerUpper.includes("PROM") && !headerUpper.includes("FINAL")) {
            if (input.type === 'checkbox') {
                dataObject[headerName] = input.checked ? true : false; 
            } else {
                let val = input.value;
                if (esCampoDeNota(headerName, nombreHoja) && typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.replace(/,/g, '.')))) {
                    val = formatearNotaADosDecimales(val);
                    input.value = val;
                }
                dataObject[headerName] = val;
            }
        }
    });

    if (window.forzarColumnaOculto) {
        dataObject["OCULTO"] = "SÍ";
    }
    window.forzarColumnaOculto = false; 

    // Optimizacion: Adjuntar _rowIndex
    // 🚀 PERF: O(1) lookup
    const alumnoActual = cursoCompleto ? (studentsByDni.get(String(dni)) || null) : null;
    if (alumnoActual && alumnoActual.datosHojas[nombreHoja] && alumnoActual.datosHojas[nombreHoja]._rowIndex) {
        dataObject._rowIndex = alumnoActual.datosHojas[nombreHoja]._rowIndex;
    } else if (inputsEditables.length && inputsEditables[0].dataset.gridRowIndex) {
        dataObject._rowIndex = inputsEditables[0].dataset.gridRowIndex;
    }

    clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(() => {
        if (navigator.onLine && selectHoja.value === nombreHoja && btnGuardar && btnGuardar.textContent === 'Guardando...') {
            cambiosPendientes = true;
            btnGuardar.textContent = 'Cambios sin guardar';
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('grey', 'red');
            btnGuardar.classList.add('orange');
            mostrarError({message: "Tiempo de espera del servidor agotado."});
            if (typeof hojasGuardando !== 'undefined') hojasGuardando.delete(nombreHoja);
        }
    }, 25000); 

    const correoAuditoria = sessionStorage.getItem('misericordia_sesion') || emailProcesando || "Usuario Desconocido";

    const marcarGuardadoPendiente = () => {
        cambiosPendientes = true;
        if (btnGuardar && selectHoja.value === nombreHoja) {
            btnGuardar.textContent = 'Cambios sin guardar';
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('grey', 'red');
            btnGuardar.classList.add('orange');
        }
    };

    google.script.run
        .withSuccessHandler(function(resultado) {
            clearTimeout(watchdogTimer);
            if (typeof hojasGuardando !== 'undefined') hojasGuardando.delete(nombreHoja);
            
            try {
            if (resultado && resultado.success) {
                if (typeof hojasModificadasDelAlumno !== 'undefined' && hojasModificadasDelAlumno.has(nombreHoja)) {
                    hojasModificadasDelAlumno.delete(nombreHoja);
                }
                cambiosPendientes = hojasModificadasDelAlumno.size > 0;
                if (resultado.updatedRow && cursoCompleto) {
                const estudiante = studentsByDni.get(String(dni));
                if (estudiante) {
                estudiante.datosHojas[nombreHoja] = resultado.updatedRow;
            if (nombreHoja.toUpperCase().includes("BOLETIN") && resultado.updatedRow["MAESTRA"] !== undefined) {
              const nuevoNombreMaestra = resultado.updatedRow["MAESTRA"];
              cursoCompleto.students.forEach(st => {
                if (st.datosHojas[nombreHoja]) {
                  st.datosHojas[nombreHoja]["MAESTRA"] = nuevoNombreMaestra;
                }
              });
            }
            const ap = resultado.updatedRow["APELLIDO"] || "";
            const nom = resultado.updatedRow["NOMBRE"] || "";
            if (ap !== "" || nom !== "") {
            const nuevoNombreCompleto = (ap !== "" && nom !== "") ? `${ap}, ${nom}` : (ap || nom);
            estudiante.nombreCompleto = nuevoNombreCompleto;
            
            const option = selectAlumno.querySelector(`option[value="${dni}"]`);
            if (option) {
            option.textContent = nuevoNombreCompleto;
            const instance = M.FormSelect.getInstance(selectAlumno);
            if (instance) instance.destroy();
            M.FormSelect.init(selectAlumno);
            }
            }
                            
                            const nuevoDni = String(resultado.updatedRow["DNI"] || "").trim();
                            if (nuevoDni !== "" && nuevoDni !== String(dni).trim()) {
                                estudiante.dni = nuevoDni;
                                const option = selectAlumno.querySelector(`option[value="${dni}"]`);
                                if (option) option.value = nuevoDni;
                                selectAlumno.value = nuevoDni;
                                window.dniAlumnoActual = nuevoDni;
                                habilitarSelect(selectAlumno, true);
                            }
                        }
                    }
                    
                    // 🚀 CORRECCIÓN AQUÍ: Evitar condición de carrera visual (Race Condition)
                    const esMismoAlumno = window.dniAlumnoActual === dni;
                    if (esMismoAlumno && resultado.promediosMultiples && formDiv) {
                        const todoVacio = evaluarBlanqueoPromedioPorHoja(nombreHoja);
                        Object.keys(resultado.promediosMultiples).forEach(nombreColumna => {
                            let valorAInsertar = todoVacio ? "" : resultado.promediosMultiples[nombreColumna];
                            actualizarPromedioEspecificoPorHoja(formDiv, nombreColumna, valorAInsertar);
                        });
                    }
                    
                    sincronizarAlumnoActualConFormulario();
                    if (window.dniAlumnoActual === dni) {
                        const nombreBoletin = obtenerNombreHojaBoletin();
                        if (nombreBoletin) actualizarBoletinDesdeDOM(nombreBoletin);
                    }
                    actualizarEstadoHojasSidebar();

                    if (currentSpreadsheetId && cursoCompleto) {
                        const cacheKey = 'misericordia_data_' + currentSpreadsheetId;
                        storeCompressedCacheDebounced(cacheKey, cursoCompleto);
                    }

                    if (selectHoja.value === nombreHoja) {
                        if (!cambiosPendientes) {
                            if (btnGuardar) {
                                btnGuardar.textContent = 'Guardado';
                                btnGuardar.disabled = true;
                                btnGuardar.classList.remove('orange', 'red');
                                btnGuardar.classList.add('grey');
                            }
                        } else {
                            if (btnGuardar) {
                                btnGuardar.textContent = 'Cambios sin guardar';
                                btnGuardar.disabled = false;
                                btnGuardar.classList.remove('grey');
                                btnGuardar.classList.add('orange');
                            }
                        }
                    } else {
                        M.toast({html: `💾 Guardado: ${nombreHoja}`, classes: 'green darken-2'});
                    }
                    
                    if (accionSiguiente) {
                        accionSiguiente();
                    }
                } else {
                    marcarGuardadoPendiente();
                    mostrarError(resultado || new Error('El servidor no confirmó el guardado.'));
                }
            } catch(error) {
                marcarGuardadoPendiente();
                mostrarError(error);
            }
        })
        .withFailureHandler(function(error) {
            clearTimeout(watchdogTimer);
            if (typeof hojasGuardando !== 'undefined') hojasGuardando.delete(nombreHoja);
            marcarGuardadoPendiente();
            mostrarError(error);
        })
        .saveStudentData(currentSpreadsheetId, nombreHoja, dni, dataObject, correoAuditoria);
}

function guardarDatosDeAlumno() {
    if (esPlanillaEspecialSeleccionada()) {
        guardarCambiosGrillaEspecial();
        return;
    }
    sincronizarAlumnoActualConFormulario();
    ejecutarGuardadoLote();
}

function guardarCambiosGrillaEspecial() {
    if (guardadoGrillaEspecialEnCurso) return guardadoGrillaEspecialEnCurso;
    if (cambiosGrillaEspecial.size === 0) return Promise.resolve(true);
    const spreadsheetId = currentSpreadsheetId;
    if (!spreadsheetId) {
        mostrarError(new Error('No se pudo identificar la planilla de la grilla pendiente. Selecciónala nuevamente antes de guardar.'));
        return Promise.resolve(false);
    }
    if (btnGuardar) {
        btnGuardar.textContent = 'Guardando grilla...';
        btnGuardar.disabled = true;
    }
    const estadoSelectorPlanilla = selectPlanilla.disabled;
    selectPlanilla.disabled = true;

    const cambiosPorAlumno = {};
    cambiosGrillaEspecial.forEach(({ dni, hoja, campos }) => {
        if (!cambiosPorAlumno[dni]) cambiosPorAlumno[dni] = {};
        const formDiv = document.getElementById(`form-${hoja.replace(/\s+/g, '_')}`);
        if (!formDiv) return;
        const fila = formDiv.querySelector(`tr[data-grid-row-dni="${CSS.escape(String(dni))}"]`);
        if (!fila) return;

        // Recalcular promedio en vivo de la fila para garantizar que esté actualizado
        calcularPromedioEnVivo(formDiv, fila);

        const clavesIdentificacion = new Set(['DNI', 'D.N.I', 'APELLIDO Y NOMBRE', 'APELLIDO', 'NOMBRE', 'NRO.', 'Nro.', 'NRO', 'N°', 'Nº', 'NUMERO', 'NUMERO DE ORDEN', 'GRADO', 'SECCION', 'TURNO', 'CICLO', 'AÑO', 'ACTIVOS', 'ESTADO', 'OCULTO', '_rowIndex']);

        const estudiante = cursoCompleto && studentsByDni.get(String(dni));
        const dataObject = {};

        // Preservar posibles campos extras de la materia que no sean de identificación
        if (estudiante && estudiante.datosHojas && estudiante.datosHojas[hoja]) {
            Object.keys(estudiante.datosHojas[hoja]).forEach(k => {
                if (!clavesIdentificacion.has(k) && !esColumnaNoDeNota(k)) {
                    dataObject[k] = estudiante.datosHojas[hoja][k];
                }
            });
        }

        // Leer todos los inputs de la fila (1 Bimestre, 2 Bimestre, etc., y Promedio.)
        fila.querySelectorAll('.esp-grid-input').forEach(input => {
            const header = input.getAttribute('data-header-name');
            if (header && !clavesIdentificacion.has(header)) {
                dataObject[header] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        // Asegurar cálculo de promedio dinámico: si no hay bimestres con nota, queda vacío
        const sheetConfig = cursoCompleto && cursoCompleto.sheets && cursoCompleto.sheets[hoja];
        const allHeaders = (sheetConfig && sheetConfig.allHeaders) || [];
        allHeaders.forEach(hdr => {
            const hUpper = String(hdr || '').toUpperCase();
            if ((hUpper.includes('PROM') || hUpper.includes('FINAL')) && !hUpper.includes('GENERAL')) {
                let sumaCentavos = 0, cant = 0;
                allHeaders.forEach(hCol => {
                    if (esCabeceraNotaRequerida(hCol, hoja)) {
                        const vNum = Number(String(dataObject[hCol] || '').replace(/,/g, '.'));
                        if (!isNaN(vNum) && vNum > 0) {
                            sumaCentavos += Math.round(vNum * 100);
                            cant++;
                        }
                    }
                });
                const promCalc = cant > 0
                    ? (Math.trunc(sumaCentavos / cant + 1e-9) / 100).toFixed(2)
                    : "";
                dataObject[hdr] = promCalc;
                const inputProm = fila.querySelector(`.esp-grid-input[data-header-name="${CSS.escape(hdr)}"]`);
                if (inputProm) {
                    inputProm.value = promCalc;
                    inputProm.style.fontWeight = promCalc ? 'bold' : 'normal';
                    inputProm.style.color = promCalc ? '#2e7d32' : 'inherit';
                }
            }
        });

        if (fila.dataset.gridRowIndex) dataObject._rowIndex = fila.dataset.gridRowIndex;
        cambiosPorAlumno[dni][hoja] = dataObject;
        if (estudiante) {
            estudiante.datosHojas[hoja] = Object.assign(estudiante.datosHojas[hoja] || {}, dataObject);
        }
    });

    const cambios = Object.keys(cambiosPorAlumno).map(dni => ({
        dni,
        dataBatch: cambiosPorAlumno[dni]
    }));
    const correo = sessionStorage.getItem('misericordia_sesion') || emailProcesando || '';
    const operationId = guardadoGrillaOperacionId || createOperationId();
    guardadoGrillaOperacionId = operationId;
    const promesaGuardado = Promise.resolve()
        .then(() => guardarCambiosGrillaConEndpointActual(cambios, correo, spreadsheetId, operationId))
        .finally(() => {
            selectPlanilla.disabled = estadoSelectorPlanilla;
            if (guardadoGrillaEspecialEnCurso === promesaGuardado) {
                guardadoGrillaEspecialEnCurso = null;
            }
        });
    guardadoGrillaEspecialEnCurso = promesaGuardado;
    return promesaGuardado;
}

function guardarCambiosGrillaConEndpointActual(cambios, correo, spreadsheetId, operationId) {
    const enviarLote = async () => {
        let planillaId = window.currentPlanillaDbId;
        let nomPlanillaGrilla = window.currentPlanillaNombre ||
            (cursoCompleto && (cursoCompleto.nombre || cursoCompleto.name)) ||
            (typeof selectPlanilla !== 'undefined' && selectPlanilla && selectPlanilla.value ? selectPlanilla.value.trim() : '') ||
            '';

        if (planillaId && !nomPlanillaGrilla) {
            try {
                const { data: pNom } = await supabaseClient.from('planillas').select('id, nombre').eq('id', planillaId).limit(1);
                if (pNom && pNom.length > 0 && pNom[0].nombre) {
                    nomPlanillaGrilla = pNom[0].nombre;
                    window.currentPlanillaNombre = nomPlanillaGrilla;
                }
            } catch(eN) {}
        }

        if (!planillaId || !nomPlanillaGrilla) {
            let query = supabaseClient.from('planillas').select('id, nombre, spreadsheet_id');
            const targetSp = spreadsheetId || currentSpreadsheetId;
            if (targetSp) {
                if (!isNaN(targetSp) && Number(targetSp) > 0) {
                    query = query.or(`id.eq.${targetSp},spreadsheet_id.eq.${targetSp}`);
                } else {
                    query = query.or(`spreadsheet_id.eq.${targetSp},enlace.eq.${targetSp}`);
                }
            } else if (nomPlanillaGrilla) {
                query = query.eq('nombre', nomPlanillaGrilla);
            }
            const { data: pData } = await query.limit(1);
            if (pData && pData.length > 0) {
                if (!planillaId) {
                    planillaId = pData[0].id;
                    window.currentPlanillaDbId = planillaId;
                }
                if (!nomPlanillaGrilla && pData[0].nombre) {
                    nomPlanillaGrilla = pData[0].nombre;
                    window.currentPlanillaNombre = nomPlanillaGrilla;
                }
            }
        }
        if (!planillaId) throw new Error("No se pudo identificar la planilla en Supabase.");

        // Pre-cargar valores anteriores reales desde Supabase para auditoría y restauración (before/after snapshot)
        const dnisLoteGrilla = Array.from(new Set(cambios.map(c => String(c.dni || '').trim()).filter(Boolean)));
        const mapaCalifAnterioresGrilla = new Map();
        if (dnisLoteGrilla.length > 0) {
            try {
                const { data: prevRowsGrilla } = await supabaseClient
                    .from('calificaciones')
                    .select('alumno_dni, nombre_hoja, valores')
                    .eq('planilla_id', planillaId)
                    .in('alumno_dni', dnisLoteGrilla);
                (prevRowsGrilla || []).forEach(r => {
                    mapaCalifAnterioresGrilla.set(`${String(r.alumno_dni).trim()}::${r.nombre_hoja}`, (r.valores && typeof r.valores === 'object') ? { ...r.valores } : {});
                });
            } catch (ePrevG) {
                console.warn('[Supabase] Aviso leyendo estado previo de grilla:', ePrevG);
            }
        }

        for (const cambio of cambios) {
            const dni = cambio.dni;
            for (const [hoja, valores] of Object.entries(cambio.dataBatch || {})) {
                const valoresAnteriores = mapaCalifAnterioresGrilla.get(`${String(dni).trim()}::${hoja}`) || {};
                const copia = Object.assign({}, valoresAnteriores, valores);
                delete copia._rowIndex;
                // Limpiar campos de identificación antes de guardar en calificaciones.valores
                const clavesAEliminar = ['DNI', 'D.N.I', 'APELLIDO Y NOMBRE', 'APELLIDO', 'NOMBRE', 'NRO.', 'Nro.', 'NRO', 'N°', 'Nº', 'NUMERO', 'NUMERO DE ORDEN', 'ACTIVOS', 'ESTADO', 'OCULTO'];
                clavesAEliminar.forEach(k => delete copia[k]);

                const { error: errCalif } = await supabaseClient.from('calificaciones').upsert({
                    planilla_id: planillaId,
                    alumno_dni: dni,
                    nombre_hoja: hoja,
                    valores: copia,
                    updated_by: correo,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });

                if (errCalif) throw errCalif;

                // Auditoría de cambios en grilla con snapshot completo (antes y después) para restauración
                try {
                    const diffs = [];
                    const camposModificados = {};
                    const todasClaves = new Set([...Object.keys(valoresAnteriores), ...Object.keys(copia)]);
                    todasClaves.forEach(campo => {
                        if (clavesAEliminar.includes(campo) || campo === '_rowIndex') return;
                        const viejo = valoresAnteriores[campo] !== undefined && valoresAnteriores[campo] !== null ? String(valoresAnteriores[campo]).trim() : '';
                        const nuevo = copia[campo] !== undefined && copia[campo] !== null ? String(copia[campo]).trim() : '';
                        if (viejo !== nuevo) {
                            diffs.push(`${campo}: "${viejo}" ➔ "${nuevo}"`);
                            camposModificados[campo] = { antes: viejo, despues: nuevo };
                        }
                    });
                    const textoLegible = diffs.length > 0
                        ? diffs.join(' | ')
                        : Object.entries(copia).map(([k, v]) => `${k}: ${v}`).join(' | ');
                    const snapshotStr = typeof window.codificarCambiosConSnapshot === 'function'
                        ? window.codificarCambiosConSnapshot(textoLegible, {
                            tipo: 'CALIFICACIONES',
                            planilla_id: planillaId,
                            nombre_planilla: nomPlanillaGrilla,
                            dni: String(dni).trim(),
                            hoja: hoja,
                            antes: valoresAnteriores,
                            despues: copia,
                            campos: camposModificados
                        })
                        : textoLegible;

                    await getAuditSupabaseClient().from('auditoria').insert({
                        usuario: correo,
                        planilla_id: String(planillaId || spreadsheetId || ''),
                        nombre_planilla: nomPlanillaGrilla,
                        hoja: hoja,
                        dni_alumno: dni,
                        cambios: snapshotStr
                    });
                } catch(eAud) {
                    console.warn('[Supabase Auditoría] Aviso registrando auditoría grilla:', eAud);
                }
            }
        }

        
        // Propagación automática hacia el curso regular si la planilla guardada corresponde a una materia especial
        try {
            await propagarLoteNotasEspecialesACursoRegular(nomPlanillaGrilla, cambios, correo);
        } catch(eProp) {
            console.warn('[Especiales] Aviso propagando notas especiales al curso regular:', eProp);
        }

        return {
            success: true,
            status: 'completed',
            alumnosGuardados: cambios.length,
            resultados: cambios.map(c => ({
                dni: c.dni,
                cacheLote: c.dataBatch
            }))
        };
    };

    const aplicarCambiosConfirmados = resultado => {
        const guardado = resultado && (resultado.status === 'completed' || resultado.status === 'written')
            ? resultado.resultado || resultado
            : resultado;
        if (!guardado || guardado.success !== true) {
            throw new Error((guardado && guardado.message) || 'No se pudo confirmar el guardado de la grilla.');
        }

        (guardado.resultados || []).forEach(item => {
            const estudiante = cursoCompleto && studentsByDni.get(String(item.dni));
            const cacheLote = item.cacheLote || (item.resultado && item.resultado.cacheLote);
            if (currentSpreadsheetId === spreadsheetId && estudiante && cacheLote) {
                Object.keys(cacheLote).forEach(nombreHoja => {
                    estudiante.datosHojas[nombreHoja] = Object.assign(
                        estudiante.datosHojas[nombreHoja] || {},
                        cacheLote[nombreHoja]
                    );
                });
            }
        });

        if (!(guardado.resultados || []).length && cursoCompleto && currentSpreadsheetId === spreadsheetId) {
            cambios.forEach(cambio => {
                const estudiante = studentsByDni.get(String(cambio.dni));
                if (!estudiante) return;
                Object.keys(cambio.dataBatch || {}).forEach(nombreHoja => {
                    estudiante.datosHojas[nombreHoja] = estudiante.datosHojas[nombreHoja] || {};
                    Object.keys(cambio.dataBatch[nombreHoja] || {}).forEach(campo => {
                        if (campo !== '_rowIndex') {
                            estudiante.datosHojas[nombreHoja][campo] = cambio.dataBatch[nombreHoja][campo];
                        }
                    });
                });
            });
        }

        cambios.forEach(cambio => {
            Object.keys(cambio.dataBatch || {}).forEach(nombreHoja => {
                const clave = `${cambio.dni}::${nombreHoja}`;
                const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
                const fila = formDiv && formDiv.querySelector(`tr[data-grid-row-dni="${CSS.escape(String(cambio.dni))}"]`);
                if (!fila) {
                    cambiosGrillaEspecial.delete(clave);
                    return;
                }
                const valoresEnviados = cambio.dataBatch[nombreHoja] || {};
                const camposEnviados = Object.keys(valoresEnviados).filter(campo => campo !== '_rowIndex');
                const cambiosCoinciden = camposEnviados.every(campo => {
                    const input = Array.from(fila.querySelectorAll('.esp-grid-input')).find(
                        elemento => elemento.getAttribute('data-header-name') === campo
                    );
                    if (!input) return true;
                    const valorActual = input.type === 'checkbox' ? input.checked : input.value;
                    return String(valorActual) === String(valoresEnviados[campo]);
                });
                if (cambiosCoinciden) {
                    cambiosGrillaEspecial.delete(clave);
                    fila.querySelectorAll('.esp-grid-input').forEach(inp => {
                        inp._memoriaAnterior = inp.type === 'checkbox' ? inp.checked : inp.value;
                    });
                }
            });
        });

        cambiosPendientes = cambiosGrillaEspecial.size > 0;
        if (cambiosPendientes) {
            guardadoGrillaOperacionId = null;
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Cambios sin guardar';
                btnGuardar.classList.remove('grey', 'red');
                btnGuardar.classList.add('orange');
            }
        } else {
            guardadoGrillaOperacionId = null;
            if (btnGuardar) {
                btnGuardar.textContent = 'Guardado';
                btnGuardar.disabled = true;
                btnGuardar.classList.remove('orange', 'red');
                btnGuardar.classList.add('grey');
            }
        }
        ultimaGuardadoHojaActual = Date.now();
        ultimoPdfGenerado = null;
        if (cursoCompleto) storeCompressedCacheDebounced('misericordia_data_' + spreadsheetId, cursoCompleto);
        M.toast({
            html: cambiosPendientes
                ? `✅ ${Number(guardado.alumnosGuardados) || cambios.length} alumno(s) guardado(s); hay ediciones posteriores pendientes`
                : `✅ ${Number(guardado.alumnosGuardados) || cambios.length} alumno(s) guardado(s)`,
            classes: cambiosPendientes ? 'orange darken-2' : 'green darken-2'
        });
        return !cambiosPendientes;
    };

    const marcarError = error => {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Cambios sin guardar';
            btnGuardar.classList.remove('grey', 'red');
            btnGuardar.classList.add('orange');
        }
        mostrarError(error);
        return false;
    };

    if (!Array.isArray(cambios) || cambios.length === 0) {
        return Promise.resolve(marcarError(new Error('No se encontraron filas de grilla para guardar.')));
    }

    return enviarLote()
        .catch(error => esRespuestaAmbigua(error)
            ? recuperarResultado()
            : Promise.reject(error))
        .then(aplicarCambiosConfirmados)
        .catch(marcarError);
}

async function guardarDatosLoteEnSupabase(dni, dataBatch, correoAuditoria) {
    let planillaId = window.currentPlanillaDbId;
    let nombrePlanillaActual = window.currentPlanillaNombre ||
        (cursoCompleto && (cursoCompleto.nombre || cursoCompleto.name)) ||
        (typeof selectPlanilla !== 'undefined' && selectPlanilla && selectPlanilla.value ? selectPlanilla.value.trim() : '') ||
        '';

    if (planillaId && !nombrePlanillaActual) {
        try {
            const { data: pNom } = await supabaseClient.from('planillas').select('id, nombre').eq('id', planillaId).limit(1);
            if (pNom && pNom.length > 0 && pNom[0].nombre) {
                nombrePlanillaActual = pNom[0].nombre;
                window.currentPlanillaNombre = nombrePlanillaActual;
            }
        } catch(eN) {}
    }

    if (!planillaId || !nombrePlanillaActual) {
        let query = supabaseClient.from('planillas').select('id, nombre, spreadsheet_id');
        if (currentSpreadsheetId) {
            if (!isNaN(currentSpreadsheetId) && Number(currentSpreadsheetId) > 0) {
                query = query.or(`id.eq.${currentSpreadsheetId},spreadsheet_id.eq.${currentSpreadsheetId}`);
            } else {
                query = query.or(`spreadsheet_id.eq.${currentSpreadsheetId},enlace.eq.${currentSpreadsheetId}`);
            }
        } else if (nombrePlanillaActual) {
            query = query.eq('nombre', nombrePlanillaActual);
        }
        const { data: pData } = await query.limit(1);
        if (pData && pData.length > 0) {
            if (!planillaId) {
                planillaId = pData[0].id;
                window.currentPlanillaDbId = planillaId;
            }
            if (!nombrePlanillaActual && pData[0].nombre) {
                nombrePlanillaActual = pData[0].nombre;
                window.currentPlanillaNombre = nombrePlanillaActual;
            }
        }
    }
    if (!planillaId) throw new Error("No se pudo identificar la planilla en Supabase.");

    for (const [nombreHoja, dataObject] of Object.entries(dataBatch)) {
        if (nombreHoja === "DATOS") {
            // 1. Leer estado previo real desde Supabase (alumnos y calificaciones DATOS) antes de sobrescribir
            let alumnoPrevioDb = null;
            let extrasPreviosDb = {};
            try {
                const [{ data: alPrev }, { data: calPrevDatos }] = await Promise.all([
                    supabaseClient.from('alumnos').select('dni, apellido, nombre, sexo, fecha_nacimiento, activo, oculto').eq('dni', dni).maybeSingle(),
                    supabaseClient.from('calificaciones').select('valores').eq('planilla_id', planillaId).eq('alumno_dni', dni).eq('nombre_hoja', 'DATOS').maybeSingle()
                ]);
                if (alPrev) alumnoPrevioDb = alPrev;
                if (calPrevDatos && calPrevDatos.valores && typeof calPrevDatos.valores === 'object') {
                    extrasPreviosDb = { ...calPrevDatos.valores };
                }
            } catch (ePrevDatos) {
                console.warn('[Supabase] Aviso leyendo estado previo de DATOS:', ePrevDatos);
            }

            const updateAlumno = {};
            if (puedeEditarDatosIdentificacionAlumno()) {
                if (dataObject["APELLIDO"] !== undefined) updateAlumno.apellido = dataObject["APELLIDO"];
                if (dataObject["NOMBRE"] !== undefined) updateAlumno.nombre = dataObject["NOMBRE"];
            }
            if (dataObject["SEXO"] !== undefined) updateAlumno.sexo = dataObject["SEXO"];
            if (dataObject["FECHA NACIMIENTO"] !== undefined) updateAlumno.fecha_nacimiento = dataObject["FECHA NACIMIENTO"];
            else if (dataObject["FECHA DE NAC"] !== undefined) updateAlumno.fecha_nacimiento = dataObject["FECHA DE NAC"];

            // Persistir campos adicionales de DATOS (Dirección, Lugar de nac., Progenitores, Bautismo, etc.) en calificaciones (nombre_hoja = 'DATOS')
            let extrasGuardar = { ...extrasPreviosDb };
            try {
                const clavesBaseDatos = new Set([
                    'DNI', 'D.N.I', 'APELLIDO', 'NOMBRE', 'APELLIDO Y NOMBRE', 'ALUMNO',
                    'NRO.', 'Nro.', 'NRO', 'N°', 'Nº', 'NUMERO', 'NUMERO DE ORDEN',
                    'SEXO', 'FECHA NACIMIENTO', 'FECHA DE NAC', 'ACTIVOS', 'ESTADO', 'OCULTO', '_rowIndex'
                ]);
                const estudianteDatos = cursoCompleto && studentsByDni.get(String(dni));
                const existentesDatos = (estudianteDatos && estudianteDatos.datosHojas && estudianteDatos.datosHojas['DATOS'])
                    ? { ...estudianteDatos.datosHojas['DATOS'] }
                    : {};
                const fusionDatos = Object.assign({}, extrasPreviosDb, existentesDatos, dataObject);
                extrasGuardar = {};
                for (const [kD, vD] of Object.entries(fusionDatos)) {
                    if (!clavesBaseDatos.has(kD) && vD !== undefined && vD !== null && String(vD).trim() !== '') {
                        extrasGuardar[kD] = String(vD).trim();
                    }
                }
                if (Object.keys(extrasGuardar).length > 0 || Object.keys(extrasPreviosDb).length > 0) {
                    await supabaseClient.from('calificaciones').upsert({
                        planilla_id: planillaId,
                        alumno_dni: dni,
                        nombre_hoja: 'DATOS',
                        valores: extrasGuardar,
                        updated_by: correoAuditoria,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });
                }
            } catch (eExtraDatos) {
                console.warn('[Supabase] Aviso guardando campos extra de DATOS:', eExtraDatos);
            }

            // Persistencia de estado ACTIVO / ESTADO en Supabase (alumnos y alumno_planillas)
            let nuevoEstadoActivo = undefined;
            if (dataObject["ACTIVOS"] !== undefined) {
                const v = dataObject["ACTIVOS"];
                nuevoEstadoActivo = (v === true || String(v).toUpperCase() === 'TRUE' || String(v).toUpperCase() === 'VERDADERO' || String(v).toUpperCase() === 'SI' || String(v).toUpperCase() === 'SÍ' || v === 1 || v === '1');
            } else if (dataObject["ESTADO"] !== undefined) {
                const v = dataObject["ESTADO"];
                nuevoEstadoActivo = (v === true || String(v).toUpperCase() === 'TRUE' || String(v).toUpperCase() === 'VERDADERO' || String(v).toUpperCase() === 'SI' || String(v).toUpperCase() === 'SÍ' || v === 1 || v === '1');
            }

            if (nuevoEstadoActivo !== undefined) {
                updateAlumno.activo = nuevoEstadoActivo;
                dataObject["ACTIVOS"] = nuevoEstadoActivo ? 'TRUE' : 'FALSE';
                dataObject["ESTADO"] = nuevoEstadoActivo ? 'TRUE' : 'FALSE';
                const { error: errMatActivo } = await supabaseClient
                    .from('alumno_planillas')
                    .update({ activo: nuevoEstadoActivo })
                    .eq('planilla_id', planillaId)
                    .eq('alumno_dni', dni);
                if (errMatActivo) console.warn("[Supabase] Error actualizando activo en alumno_planillas:", errMatActivo);
            }

            // Persistencia de estado OCULTO en Supabase (alumnos y alumno_planillas)
            let nuevoEstadoOculto = undefined;
            if (dataObject["OCULTO"] !== undefined) {
                const vOculto = String(dataObject["OCULTO"]).toUpperCase().trim();
                nuevoEstadoOculto = (vOculto === 'SÍ' || vOculto === 'SI' || vOculto === 'TRUE' || vOculto === 'VERDADERO');
                updateAlumno.oculto = nuevoEstadoOculto;
                dataObject["OCULTO"] = nuevoEstadoOculto ? 'SÍ' : 'NO';
                const { error: errMatOculto } = await supabaseClient
                    .from('alumno_planillas')
                    .update({ oculto: nuevoEstadoOculto })
                    .eq('planilla_id', planillaId)
                    .eq('alumno_dni', dni);
                if (errMatOculto) console.warn("[Supabase] Error actualizando oculto en alumno_planillas:", errMatOculto);
            }

            if (Object.keys(updateAlumno).length > 0) {
                updateAlumno.updated_at = new Date().toISOString();
                const { error: errAlum } = await supabaseClient.from('alumnos').update(updateAlumno).eq('dni', dni);
                if (errAlum) console.warn("[Supabase] Error actualizando datos en alumnos:", errAlum);
            }

            // Auditoría completa de cambios en DATOS con snapshot antes/después
            try {
                const antesDatos = Object.assign({}, extrasPreviosDb, {
                    APELLIDO: alumnoPrevioDb && alumnoPrevioDb.apellido != null ? String(alumnoPrevioDb.apellido) : '',
                    NOMBRE: alumnoPrevioDb && alumnoPrevioDb.nombre != null ? String(alumnoPrevioDb.nombre) : '',
                    SEXO: alumnoPrevioDb && alumnoPrevioDb.sexo != null ? String(alumnoPrevioDb.sexo) : '',
                    'FECHA NACIMIENTO': alumnoPrevioDb && alumnoPrevioDb.fecha_nacimiento != null ? String(alumnoPrevioDb.fecha_nacimiento) : '',
                    ACTIVOS: alumnoPrevioDb && alumnoPrevioDb.activo !== undefined ? (alumnoPrevioDb.activo ? 'TRUE' : 'FALSE') : 'TRUE',
                    OCULTO: alumnoPrevioDb && alumnoPrevioDb.oculto ? 'SÍ' : 'NO'
                });
                const despuesDatos = Object.assign({}, extrasGuardar, {
                    APELLIDO: updateAlumno.apellido !== undefined ? String(updateAlumno.apellido) : antesDatos.APELLIDO,
                    NOMBRE: updateAlumno.nombre !== undefined ? String(updateAlumno.nombre) : antesDatos.NOMBRE,
                    SEXO: updateAlumno.sexo !== undefined ? String(updateAlumno.sexo) : antesDatos.SEXO,
                    'FECHA NACIMIENTO': updateAlumno.fecha_nacimiento !== undefined ? String(updateAlumno.fecha_nacimiento) : antesDatos['FECHA NACIMIENTO'],
                    ACTIVOS: updateAlumno.activo !== undefined ? (updateAlumno.activo ? 'TRUE' : 'FALSE') : antesDatos.ACTIVOS,
                    OCULTO: updateAlumno.oculto !== undefined ? (updateAlumno.oculto ? 'SÍ' : 'NO') : antesDatos.OCULTO
                });

                const diffsDatos = [];
                const camposModificadosDatos = {};
                const todasClavesDatos = new Set([...Object.keys(antesDatos), ...Object.keys(despuesDatos)]);
                todasClavesDatos.forEach(campo => {
                    const viejo = antesDatos[campo] !== undefined && antesDatos[campo] !== null ? String(antesDatos[campo]).trim() : '';
                    const nuevo = despuesDatos[campo] !== undefined && despuesDatos[campo] !== null ? String(despuesDatos[campo]).trim() : '';
                    if (viejo !== nuevo) {
                        diffsDatos.push(`${campo}: "${viejo}" ➔ "${nuevo}"`);
                        camposModificadosDatos[campo] = { antes: viejo, despues: nuevo };
                    }
                });

                if (diffsDatos.length > 0) {
                    const textoLegibleDatos = diffsDatos.join(' | ');
                    const snapshotDatos = typeof window.codificarCambiosConSnapshot === 'function'
                        ? window.codificarCambiosConSnapshot(textoLegibleDatos, {
                            tipo: 'DATOS',
                            planilla_id: planillaId,
                            nombre_planilla: nombrePlanillaActual,
                            dni: String(dni).trim(),
                            hoja: 'DATOS',
                            antes: antesDatos,
                            despues: despuesDatos,
                            campos: camposModificadosDatos
                        })
                        : textoLegibleDatos;

                    await getAuditSupabaseClient().from('auditoria').insert({
                        usuario: correoAuditoria,
                        planilla_id: String(planillaId || currentSpreadsheetId || ''),
                        nombre_planilla: nombrePlanillaActual,
                        hoja: 'DATOS',
                        dni_alumno: dni,
                        cambios: snapshotDatos
                    });
                }
            } catch (eAud) {
                console.warn('[Supabase Auditoría] Aviso registrando auditoría en DATOS:', eAud);
            }

            if (puedeEditarDatosIdentificacionAlumno() && dataObject["DNI"] && String(dataObject["DNI"]).trim() !== String(dni).trim()) {
                const nuevoDni = String(dataObject["DNI"]).trim();
                await supabaseClient.from('alumnos').update({ dni: nuevoDni, updated_at: new Date().toISOString() }).eq('dni', dni);
                await supabaseClient.from('alumno_planillas').update({ alumno_dni: nuevoDni }).eq('planilla_id', planillaId).eq('alumno_dni', dni);
            }
        } else {
            // 1. Leer valores anteriores reales desde Supabase antes de que el upsert los sobrescriba
            let valoresAnterioresDb = null;
            try {
                const { data: califPrev } = await supabaseClient
                    .from('calificaciones')
                    .select('valores')
                    .eq('planilla_id', planillaId)
                    .eq('alumno_dni', dni)
                    .eq('nombre_hoja', nombreHoja)
                    .maybeSingle();
                if (califPrev && califPrev.valores && typeof califPrev.valores === 'object') {
                    valoresAnterioresDb = { ...califPrev.valores };
                }
            } catch (ePrevCalif) {
                console.warn('[Supabase] Aviso leyendo calificación previa:', ePrevCalif);
            }

            const estudiante = cursoCompleto && studentsByDni.get(String(dni));
            const valoresMemoria = (estudiante && estudiante.datosHojas && estudiante.datosHojas[nombreHoja])
                ? { ...estudiante.datosHojas[nombreHoja] }
                : {};
            const valoresExistentes = valoresAnterioresDb || valoresMemoria;
            const copia = Object.assign({}, valoresExistentes, valoresMemoria, dataObject);
            delete copia._rowIndex;
            // Limpiar campos de identificación antes de guardar en calificaciones.valores
            const clavesAEliminar = ['DNI', 'D.N.I', 'APELLIDO Y NOMBRE', 'APELLIDO', 'NOMBRE', 'NRO.', 'Nro.', 'NRO', 'N°', 'Nº', 'NUMERO', 'NUMERO DE ORDEN', 'ACTIVOS', 'ESTADO', 'OCULTO'];
            clavesAEliminar.forEach(k => delete copia[k]);

            // Formatear notas a 2 decimales para persistencia en Supabase
            let cantNotasIngresadas = 0;
            const camposPromedioHoja = [];
            for (const [k, v] of Object.entries(copia)) {
                const kUp = String(k || '').toUpperCase();
                if (kUp.includes('PROM') || kUp.includes('FINAL')) {
                    camposPromedioHoja.push(k);
                } else if (esCampoDeNota(k, nombreHoja) && typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v.replace(/,/g, '.')))) {
                    copia[k] = formatearNotaADosDecimales(v);
                    cantNotasIngresadas++;
                }
            }
            // Si el alumno no tiene notas ingresadas en esta materia, limpiar promedios residuales
            if (cantNotasIngresadas === 0) {
                camposPromedioHoja.forEach(ph => {
                    copia[ph] = "";
                });
            }

            const { error: errCalif } = await supabaseClient.from('calificaciones').upsert({
                planilla_id: planillaId,
                alumno_dni: dni,
                nombre_hoja: nombreHoja,
                valores: copia,
                updated_by: correoAuditoria,
                updated_at: new Date().toISOString()
            }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });

            if (errCalif) throw errCalif;

            // Auditoría de cambios en calificaciones con snapshot completo (antes y después) para restauración
            try {
                const baseComparacion = valoresAnterioresDb || {};
                const diffs = [];
                const camposModificados = {};
                const todasClaves = new Set([...Object.keys(baseComparacion), ...Object.keys(copia)]);
                todasClaves.forEach(campo => {
                    if (clavesAEliminar.includes(campo) || campo === '_rowIndex') return;
                    const viejo = baseComparacion[campo] !== undefined && baseComparacion[campo] !== null ? String(baseComparacion[campo]).trim() : '';
                    const nuevo = copia[campo] !== undefined && copia[campo] !== null ? String(copia[campo]).trim() : '';
                    if (viejo !== nuevo) {
                        diffs.push(`${campo}: "${viejo}" ➔ "${nuevo}"`);
                        camposModificados[campo] = { antes: viejo, despues: nuevo };
                    }
                });
                if (diffs.length > 0) {
                    const textoLegible = diffs.join(' | ');
                    const snapshotStr = typeof window.codificarCambiosConSnapshot === 'function'
                        ? window.codificarCambiosConSnapshot(textoLegible, {
                            tipo: 'CALIFICACIONES',
                            planilla_id: planillaId,
                            nombre_planilla: nombrePlanillaActual,
                            dni: String(dni).trim(),
                            hoja: nombreHoja,
                            antes: baseComparacion,
                            despues: copia,
                            campos: camposModificados
                        })
                        : textoLegible;

                    await getAuditSupabaseClient().from('auditoria').insert({
                        usuario: correoAuditoria,
                        planilla_id: String(planillaId || currentSpreadsheetId || ''),
                        nombre_planilla: nombrePlanillaActual,
                        hoja: nombreHoja,
                        dni_alumno: dni,
                        cambios: snapshotStr
                    });
                }
            } catch (eAud) {
                console.warn('[Supabase Auditoría] Aviso registrando auditoría en calificaciones:', eAud);
            }

            // Propagación automática hacia el curso regular si la planilla guardada corresponde a una materia especial
            try {
                await propagarLoteNotasEspecialesACursoRegular(nombrePlanillaActual, [{ alumno_dni: dni, valores: copia }], correoAuditoria);
            } catch(eProp) {
                console.warn('[Especiales] Aviso propagando calificaciones especiales al curso regular:', eProp);
            }
        }
    }

    return { success: true, cacheLote: dataBatch };
}

function guardarLoteDirectoPorHojas(dataBatch, dni, correoAuditoria) {
    return guardarDatosLoteEnSupabase(dni, dataBatch, correoAuditoria);
}

function ejecutarGuardadoLote(accionSiguiente = null, dniSeleccionado = null, hojasSeleccionadas = null) {
    if (typeof isGuardandoLote !== 'undefined' && isGuardandoLote && !hojasSeleccionadas) return;
    isGuardandoLote = true;
    const marcarGuardadoPendiente = () => {
        cambiosPendientes = true;
        if (btnGuardar) {
            btnGuardar.textContent = 'Cambios sin guardar';
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('grey', 'red');
            btnGuardar.classList.add('orange');
        }
    };
    const dni = dniSeleccionado || selectAlumno.value;
    if (!dni || !currentSpreadsheetId) { isGuardandoLote = false; return; }

    sincronizarAlumnoActualConFormulario();
    const hojasAProcesar = hojasSeleccionadas ? new Set(hojasSeleccionadas) : new Set(hojasModificadasDelAlumno);
    if (hojasAProcesar.size === 0) {
        cambiosPendientes = false;
        if (btnGuardar) {
            btnGuardar.textContent = 'Guardado';
            btnGuardar.disabled = true;
            btnGuardar.classList.remove('orange', 'red');
            btnGuardar.classList.add('grey');
        }
        isGuardandoLote = false;
        if (accionSiguiente) accionSiguiente();
        return;
    }

    if (btnGuardar) {
        btnGuardar.textContent = 'Guardando en Supabase...';
        btnGuardar.disabled = true;
    }

    const dataBatch = {};
    hojasAProcesar.forEach(nombreHoja => {
        const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
        if (!formDiv) return;

        const dataObject = {};
        const inputsEditables = formDiv.querySelectorAll(
            esPlanillaEspecialSeleccionada() && nombreHoja !== 'DATOS'
                ? `.form-input-editable[data-grid-dni="${CSS.escape(String(dni))}"]`
                : '.form-input-editable'
        );

        inputsEditables.forEach(input => {
            const headerName = input.getAttribute('data-header-name');
            if (headerName) {
                if (input.type === 'checkbox') {
                    dataObject[headerName] = input.checked ? true : false;
                } else {
                    let val = input.value;
                    if (esCampoDeNota(headerName, nombreHoja) && typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.replace(/,/g, '.')))) {
                        val = formatearNotaADosDecimales(val);
                        input.value = val;
                    }
                    dataObject[headerName] = val;
                }
            }
        });
        
        if (window.forzarColumnaOculto && nombreHoja === "DATOS") {
            dataObject["OCULTO"] = "SÍ";
        }
        
        // Optimizacion: Adjuntar _rowIndex
        const alumnoActual = cursoCompleto ? (studentsByDni.get(String(dni)) || null) : null;
        if (alumnoActual && alumnoActual.datosHojas[nombreHoja] && alumnoActual.datosHojas[nombreHoja]._rowIndex) {
            dataObject._rowIndex = alumnoActual.datosHojas[nombreHoja]._rowIndex;
        }
        
        dataBatch[nombreHoja] = dataObject;
    });

    window.forzarColumnaOculto = false;
    const correoAuditoria = sessionStorage.getItem('misericordia_sesion') || emailProcesando || "Usuario Desconocido";

    guardarDatosLoteEnSupabase(dni, dataBatch, correoAuditoria)
        .then(function(resultado) {
            isGuardandoLote = false;
            if (resultado && resultado.success) {
                if (cursoCompleto) {
                    const estudiante = studentsByDni.get(String(dni));
                    if (estudiante && resultado.cacheLote) {
                        let nuevoDni = null;
                        for (const hoja in resultado.cacheLote) {
                            estudiante.datosHojas[hoja] = Object.assign(
                                estudiante.datosHojas[hoja] || {},
                                resultado.cacheLote[hoja]
                            );
                            if (hoja.toUpperCase().includes("BOLETIN") && resultado.cacheLote[hoja]["MAESTRA"] !== undefined) {
                                const nuevoNombreMaestra = resultado.cacheLote[hoja]["MAESTRA"];
                                cursoCompleto.students.forEach(st => {
                                    if (st.datosHojas[hoja]) {
                                        st.datosHojas[hoja]["MAESTRA"] = nuevoNombreMaestra;
                                    }
                                });
                            }
                            
                            if (hoja === "DATOS") {
                                const dataRow = resultado.cacheLote[hoja];
                                const ap = dataRow["APELLIDO"] || "";
                                const nom = dataRow["NOMBRE"] || "";
                                if (ap !== "" || nom !== "") {
                                    const nuevoNombreCompleto = (ap !== "" && nom !== "") ? `${ap}, ${nom}` : (ap || nom);
                                    estudiante.nombreCompleto = nuevoNombreCompleto;
                                    
                                    const option = selectAlumno.querySelector(`option[value="${estudiante.dni}"]`);
                                    if (option) {
                                        option.textContent = nuevoNombreCompleto;
                                    }
                                }
                            }

                            if (resultado.cacheLote[hoja]["DNI"]) {
                                nuevoDni = String(resultado.cacheLote[hoja]["DNI"]).trim();
                            }
                        }
                        
                        const instanceSelect = M.FormSelect.getInstance(selectAlumno);
                        if (instanceSelect) instanceSelect.destroy();
                        M.FormSelect.init(selectAlumno);

                        if (nuevoDni && nuevoDni !== "" && nuevoDni !== String(dni).trim()) {
                            estudiante.dni = nuevoDni;
                            const option = selectAlumno.querySelector(`option[value="${dni}"]`);
                            if (option) option.value = nuevoDni;
                            selectAlumno.value = nuevoDni;
                            window.dniAlumnoActual = nuevoDni;
                            habilitarSelect(selectAlumno, true);
                        }
                    }
                }

                const esMismoAlumno = window.dniAlumnoActual === dni;
                if (esMismoAlumno) {
                    const nombreBoletin = obtenerNombreHojaBoletin();
                    if (nombreBoletin) actualizarBoletinDesdeDOM(nombreBoletin);
                }
                
                sincronizarAlumnoActualConFormulario();

                if (currentSpreadsheetId && cursoCompleto) {
                    const cacheKey = 'misericordia_data_' + currentSpreadsheetId;
                    storeCompressedCacheDebounced(cacheKey, cursoCompleto);
                }

                ultimaGuardadoHojaActual = Date.now();
                ultimoPdfGenerado = null;

                if (esMismoAlumno) {
                    actualizarEstadoHojasSidebar();
                    cambiosPendientes = false;
                    hojasModificadasDelAlumno.clear();

                    if (btnGuardar) {
                        btnGuardar.textContent = 'Guardado';
                        btnGuardar.disabled = true;
                        btnGuardar.classList.remove('orange', 'red');
                        btnGuardar.classList.add('grey');
                    }
                    M.toast({html: `✅ Datos guardados en Supabase`, classes: 'green darken-2'});
                } else {
                    M.toast({html: `✅ Datos del alumno anterior (${dni}) guardados en Supabase`, classes: 'green darken-2'});
                }

                if (accionSiguiente) accionSiguiente();
            } else {
                marcarGuardadoPendiente();
                mostrarError(resultado);
            }
        })
        .catch(function(error) {
            isGuardandoLote = false;
            marcarGuardadoPendiente();
            mostrarError(error);
        });
}

function evaluarBlanqueoPromedioPorHoja(nombreHoja) {
    const formDiv = document.getElementById(`form-${nombreHoja.replace(/\s+/g, '_')}`);
    if (!formDiv) return false;
    const editables = formDiv.querySelectorAll('.form-input-editable');
    if (editables.length === 0) return false;

    let hayDatos = false;
    editables.forEach(campo => { if (campo.value.trim() !== "") hayDatos = true; });

    if (!hayDatos) {
        formDiv.querySelectorAll('input').forEach(input => {
            const header = (input.getAttribute('data-header-name') || "").toUpperCase().trim();
            if (header.includes('PROM') || header.includes('FINAL')) {
                input.value = ""; input.style.fontWeight = 'normal'; input.style.color = 'inherit';
            }
        });
        M.updateTextFields();
    }
    return !hayDatos;
}

function actualizarPromedioEspecificoPorHoja(formDiv, headerName, valor) {
    formDiv.querySelectorAll('input').forEach(input => {
        const currentHeader = (input.getAttribute('data-header-name') || "").toUpperCase().trim();
        if (currentHeader === headerName.toUpperCase().trim()) {
            let valorASet = valor || "";
            if (valorASet !== "") {
                let cleaned = String(valorASet).replace(/\s/g,'').replace(/,/g, '.');
                let num = Number(cleaned);
                if (!isNaN(num)) {
                    valorASet = truncarPromedio(num);
                } else {
                    valorASet = String(valorASet);
                }
            }
            input.value = valorASet;
            input.style.fontWeight = valorASet ? 'bold' : 'normal';
            input.style.color = valorASet ? '#2e7d32' : 'inherit';
        }
    });
    M.updateTextFields();
}

function calcularPromedioBoletinDesdeCampos(inputsBoletin) {
    let suma = 0;
    let cantidad = 0;
    let totalAreas = 0;
    let todasAprobadas = true;
    inputsBoletin.forEach(input => {
        const header = (input.getAttribute('data-header-name') || '').toUpperCase();
        const headerSinAcentos = header.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const esNotaDeArea = headerSinAcentos === 'LENGUA' ||
            headerSinAcentos === 'MATEMATICA' ||
            headerSinAcentos.includes('CS.SOCIALES') ||
            headerSinAcentos.includes('CS.NATURALES') || headerSinAcentos.includes('NATURALES Y TEGNOLOGIA') ||
            headerSinAcentos.includes('EDUCACION ARTISTICA') ||
            headerSinAcentos.includes('EDUCACION FISICA') ||
            headerSinAcentos.includes('LENG. EXTRANJERA') || headerSinAcentos.includes('LENGUA EXTRANJERA');
        if (!esNotaDeArea) {
            return;
        }
        totalAreas++;
        const texto = String(input.value || '').trim().replace(/,/g, '.');
        if (texto === '') {
            todasAprobadas = false;
            return;
        }
        const valor = Number(texto);
        if (!Number.isFinite(valor) || valor < 6.0) {
            todasAprobadas = false;
            return;
        }
        suma += valor;
        cantidad++;
    });
    if (totalAreas < 7 || cantidad !== totalAreas || !todasAprobadas) return '';
    return (Math.trunc((suma / cantidad) * 1000 + 1e-9) / 1000).toFixed(3);
}

function obtenerValorBoletinDesdeDatosFuente(alumno, headerBol) {
    const headerUpper = String(headerBol || "").toUpperCase().trim();

    const limpiarAcentos = texto => String(texto || "").replace(/[ÁÉÍÓÚ]/g, letra => {
        return { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' }[letra] || letra;
    });

    const esColumnaPromedio = colUpper => {
        return colUpper.includes("PROM") || colUpper.includes("FINAL") || colUpper.includes("TOTAL") || colUpper.includes("CALIFIC");
    };

    const esHojaRelevante = hojaUpper => {
        if (hojaUpper.includes("BOLETIN") || hojaUpper === "SISTEMA_AUDITORIA") return false;
        if (headerUpper === "LENGUA") return hojaUpper.includes("LENG") && !hojaUpper.includes("EXTRANJERA");
        if (headerUpper.includes("MATEMÁTICA") || headerUpper.includes("MATEMATICA")) return hojaUpper.includes("MAT");
        if (headerUpper.includes("SOCIALES")) return hojaUpper.includes("SOCIALES");
        if (headerUpper.includes("NATURALES") || headerUpper.includes("TECNOLOGIA") || headerUpper.includes("TEGNOLOGIA")) return hojaUpper.includes("NATURALES");
        if (hojaUpper.includes("ESPECIALES")) return true;
        if (hojaUpper.includes("ASISTENCIA") || hojaUpper.includes("CONDUCTA")) return true;
        return false;
    };

    const esColumnaRelevante = (hojaUpper, colUpper) => {
        if (headerUpper === "LENGUA") {
            return hojaUpper.includes("LENG") && !hojaUpper.includes("EXTRANJERA") && esColumnaPromedio(colUpper);
        }

        if (headerUpper.includes("MATEMÁTICA") || headerUpper.includes("MATEMATICA")) {
            return hojaUpper.includes("MAT") && esColumnaPromedio(colUpper);
        }

        if (headerUpper.includes("SOCIALES")) {
            return hojaUpper.includes("SOCIALES") && esColumnaPromedio(colUpper);
        }

        if (headerUpper.includes("NATURALES") || headerUpper.includes("TECNOLOGIA") || headerUpper.includes("TEGNOLOGIA")) {
            return hojaUpper.includes("NATURALES") && esColumnaPromedio(colUpper);
        }

        if (hojaUpper.includes("ESPECIALES")) {
            const headerLimpio = limpiarAcentos(colUpper);
            if ((headerUpper.includes("ARTÍSTICA") || headerUpper.includes("ARTISTICA")) &&
                (headerLimpio.includes("ARTISTICA") || headerLimpio.includes("MUSICA") || headerLimpio.includes("PLASTICA"))) {
                return true;
            }
            if ((headerUpper.includes("FÍSICA") || headerUpper.includes("FISICA")) && headerLimpio.includes("FISICA")) {
                return true;
            }
            if ((headerUpper.includes("EXTRANJERA") || headerUpper.includes("INGLÉS") || headerUpper.includes("INGLES")) &&
                (headerLimpio.includes("EXTRANJERA") || headerLimpio.includes("INGLES"))) {
                return true;
            }
            return false;
        }

        if (hojaUpper.includes("ASISTENCIA") || hojaUpper.includes("CONDUCTA")) {
            if (headerUpper.includes("CONDUCTA") && colUpper.includes("CONDUCTA")) return true;
            if (headerUpper.includes("INJUSTIFICA") && colUpper.includes("INJUSTIFICA")) return true;
            if (headerUpper.includes("JUSTIFICA") && !headerUpper.includes("INJUSTIFICA") && colUpper.includes("JUSTIFICA") && !colUpper.includes("INJUSTIFICA")) return true;
            return false;
        }

        return false;
    };

    const valoresDom = {};
    const elementosDom = document.querySelectorAll('.form-container-interno input[data-header-name], .form-container-interno select[data-header-name]');

    elementosDom.forEach(elemento => {
        const hojaOrigen = String(elemento.getAttribute('data-sheet-name') || "").trim();
        if (!hojaOrigen) return;

        const hojaUpper = hojaOrigen.toUpperCase();
        if (!esHojaRelevante(hojaUpper)) return;

        const colUpper = String(elemento.getAttribute('data-header-name') || "").toUpperCase().trim();
        if (!esColumnaRelevante(hojaUpper, colUpper)) return;

        const rawValor = elemento.type === 'checkbox'
            ? (elemento.checked ? 'TRUE' : '')
            : (elemento.value !== undefined && elemento.value !== null ? String(elemento.value).trim() : '');

        if (!valoresDom[hojaOrigen]) valoresDom[hojaOrigen] = {};
        valoresDom[hojaOrigen][colUpper] = rawValor;
    });

    const hojasDelAlumno = Object.keys(alumno.datosHojas || {});

    for (const hoja of hojasDelAlumno) {
        const hojaUpper = hoja.toUpperCase();
        if (!esHojaRelevante(hojaUpper)) continue;

        const datosDomHoja = valoresDom[hoja] || {};
        for (const colUpper in datosDomHoja) {
            if (esColumnaRelevante(hojaUpper, colUpper)) {
                return datosDomHoja[colUpper];
            }
        }

        const datosOrigen = alumno.datosHojas[hoja] || {};

        // Si es una hoja de materia regular (Lengua, Matemática, Sociales, Naturales)
        // evaluar estrictamente las notas cargadas: si no tiene notas, el promedio es vacío.
        const esMateriaRegular = headerUpper === "LENGUA" ||
            headerUpper.includes("MATEMÁTICA") || headerUpper.includes("MATEMATICA") ||
            headerUpper.includes("SOCIALES") ||
            headerUpper.includes("NATURALES") || headerUpper.includes("TECNOLOGIA") || headerUpper.includes("TEGNOLOGIA");

        if (esMateriaRegular && !hojaUpper.includes("ESPECIAL") && !hojaUpper.includes("ASISTENCIA") && !hojaUpper.includes("CONDUCTA")) {
            let sumaCentavos = 0;
            let cantidadNotas = 0;
            const camposAContar = (typeof cursoCompleto !== "undefined" && cursoCompleto && cursoCompleto.sheets[hoja] && cursoCompleto.sheets[hoja].editableFields) 
                ? cursoCompleto.sheets[hoja].editableFields 
                : Object.keys(datosOrigen);
            
            for (const col of camposAContar) {
                if (datosOrigen[col] === undefined) continue;
                const colUpper = String(col || "").toUpperCase().trim();
                if (colUpper.includes("PROM") || colUpper.includes("FINAL") || colUpper.includes("TOTAL") ||
                    colUpper.includes("GRADO") || colUpper.includes("SECCION") ||
                    colUpper.includes("CONDUCTA") || colUpper.includes("FECHA") || colUpper.includes("DNI") ||
                    colUpper.includes("NRO") || colUpper.includes("JUSTIFICA") || colUpper.includes("ACTIVO") ||
                    colUpper.includes("ESTADO") || colUpper.includes("OCULTO") || colUpper.startsWith("_")) {
                    continue;
                }
                const v = String(datosOrigen[col] ?? "").trim().replace(/,/g, ".");
                if (v !== "" && !isNaN(Number(v))) {
                    sumaCentavos += Math.round(Number(v) * 100);
                    cantidadNotas++;
                }
            }
            if (cantidadNotas > 0) {
                const promedioCalculado = (Math.trunc(sumaCentavos / cantidadNotas + 1e-9) / 100).toFixed(2);
                return promedioCalculado;
            }
            return "";
        }

        for (const col in datosOrigen) {
            const colUpper = String(col || "").toUpperCase().trim();
            if (!esColumnaRelevante(hojaUpper, colUpper)) continue;

            const valorOrigenBruto = datosOrigen[col];
            const valorOrigen = valorOrigenBruto !== undefined && valorOrigenBruto !== null
                ? String(valorOrigenBruto).trim()
                : "";
            if (valorOrigen !== "") {
                return valorOrigen;
            }
        }
    }

    return "";
}

// 🚀 PERF: Consolidado — delega a actualizarEstadoHojasSidebar() que ya cubre la misma lógica
function aplicarValidacionNotasGlobal() {
  actualizarEstadoHojasSidebar();
}

async function irAlSiguienteAlumno() {
    const select = selectAlumno;
    const newIndex = select.selectedIndex + 1;
    if (newIndex >= 1 && newIndex < select.options.length) {
        await navegarConGuardadoEnSegundoPlano(1);
        return;
    }

    if (cambiosPendientes || hojasModificadasDelAlumno.size > 0) {
        if (btnGuardar) {
            btnGuardar.textContent = 'Guardando en segundo plano...';
            btnGuardar.disabled = true;
            btnGuardar.classList.remove('grey', 'red');
            btnGuardar.classList.add('orange');
        }
        ejecutarGuardadoLote(function() {
            if (btnGuardar) {
                btnGuardar.textContent = 'Guardado';
                btnGuardar.disabled = true;
                btnGuardar.classList.remove('orange', 'red');
                btnGuardar.classList.add('grey');
            }
            M.toast({html: 'Fin de lista', classes: 'blue'});
        });
    } else {
        M.toast({html: 'Fin de lista', classes: 'blue'});
    }
}

async function irAlAnteriorAlumno() { await navegarConGuardadoEnSegundoPlano(-1); }

async function navegarConGuardadoEnSegundoPlano(delta) {
    const seNavego = await navegarAlumno(delta);
    if (!seNavego) return;
}

async function navegarAlumno(delta) {
    forzarSincronizacionAntesDeGuardar();
    const select = selectAlumno;
    const newIndex = select.selectedIndex + delta;
    if (newIndex >= 1 && newIndex < select.options.length) {
        select.selectedIndex = newIndex;
        M.FormSelect.init(select);
        select.dispatchEvent(new Event('change'));
        return true;
    }

    M.toast({html: delta > 0 ? 'Fin de lista' : 'Inicio de lista', classes: 'blue'});
    return false;
}

function habilitarSelect(select, enable) {
    select.disabled = !enable;
    const instance = M.FormSelect.getInstance(select);
    if (instance) instance.destroy();
    M.FormSelect.init(select);
}

function limpiarFormularioCompleto() {
    const sidebar = document.getElementById('sidebar-hojas');
    const contenido = document.getElementById('contenido-hojas');
    if (sidebar) sidebar.innerHTML = '';
    if (contenido) contenido.innerHTML = '';
    const panelPrincipal = document.getElementById('panel-principal');
    if (panelPrincipal) panelPrincipal.style.display = 'none';
    saveButtonContainer.style.display = 'none';
    const btnAgregarAlGrado = document.getElementById('btn-agregar-alumno-grado');
    if (btnAgregarAlGrado) btnAgregarAlGrado.style.display = 'none';
}

function mostrarLoader(show) {
    loader.style.display = show ? 'block' : 'none';
    if (btnGuardar) btnGuardar.disabled = show;
}

function mostrarError(error) {
    clearTimeout(watchdogTimer); 
    const loaderEl = document.getElementById('loader');
    if(loaderEl) loaderEl.style.display = 'none';
    if (btnGuardar) {
        btnGuardar.textContent = 'Error';
        btnGuardar.classList.remove('grey', 'orange');
        btnGuardar.classList.add('red');
        btnGuardar.disabled = false; 
    }
    toggleBloqueoNavegacion(false);
    selectPlanilla.disabled = false; 
    M.toast({html: '❌ Error: ' + error.message, classes: 'red darken-3', displayLength: 4000});
}

let hojaActualPdf = "";
let btnPdfActual = null;

function abrirModalPdf(btnElement, nombreHoja) {
  hojaActualPdf = nombreHoja;
  btnPdfActual = btnElement;

  const nombreUpper = nombreHoja.toUpperCase();
  if (nombreUpper === "PLANILLAS_CALIF_MAT" || nombreUpper === "PLANILLAS_CALIF_LENG") {
    
    let faltanNotasGlobal = false;
    let nombresIncompletos = [];

    const hojasAValidar = cursoCompleto.sheetOrder.filter(h => {
      const hUp = h.toUpperCase().replace(/[\s_\-]+/g, '');
      return !hUp.includes("PLANILLAS_CALIF") && 
             !hUp.includes("PLANILLASCALIF") && 
             !hUp.includes("PROMOCION") && 
             h !== "SISTEMA_AUDITORIA" &&
             h !== "DATOS";
    });

    cursoCompleto.students.forEach(alumno => {
      const datos = alumno.datosHojas["DATOS"] || {};
      const valorOculto = String(datos["OCULTO"] || "").toUpperCase().trim();
      const estaOculto = (valorOculto === "SÍ" || valorOculto === "SI" || valorOculto === "TRUE");
      
      let estaActivo = true;
      if (datos.hasOwnProperty("ACTIVOS")) {
        const val = String(datos["ACTIVOS"]).toUpperCase().trim();
        estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
      } else if (datos.hasOwnProperty("ESTADO")) {
        const val = String(datos["ESTADO"]).toUpperCase().trim();
        estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
      }

      if (estaOculto || !estaActivo) return; 

      let alumnoIncompleto = false;

      hojasAValidar.forEach(hoja => {
        if (alumnoIncompleto) return; 
        
        const datosHoja = alumno.datosHojas[hoja] || {};
        const headers = cursoCompleto.sheets[hoja].allHeaders || [];
        const esHojaAsistencia = hoja.toUpperCase().includes('ASISTENCIA') || hoja.toUpperCase().includes('CONDUCTA');

        if (esHojaAsistencia) {
            const hConducta = headers.find(h => String(h || '').toUpperCase().includes('CONDUCTA'));
            if (hConducta && String(datosHoja[hConducta] || '').trim() === '') {
                alumnoIncompleto = true;
                faltanNotasGlobal = true;
            }
        } else {
            let tieneColumnas = false;
            let tieneNota = false;
            headers.forEach(header => {
                if (!header || !esCabeceraNotaRequerida(header, hoja)) return;
                tieneColumnas = true;
                if (String(datosHoja[header] || "").trim() !== "") {
                    tieneNota = true;
                }
            });

            if (tieneColumnas && !tieneNota) {
                alumnoIncompleto = true;
                faltanNotasGlobal = true;
            }
        }
      });

      if (alumnoIncompleto && nombresIncompletos.length < 4) {
        nombresIncompletos.push(alumno.nombreCompleto);
      }
    });

    if (faltanNotasGlobal) {
      const ulAlumnos = document.getElementById('lista-alumnos-incompletos');
      ulAlumnos.innerHTML = '';
      nombresIncompletos.forEach(nombre => {
        const li = document.createElement('li');
        li.textContent = nombre;
        li.style.marginBottom = "2px"; 
        ulAlumnos.appendChild(li);
      });

      document.getElementById('texto-otros-alumnos').style.display = nombresIncompletos.length >= 4 ? 'block' : 'none';

      const elemAdvertencia = document.getElementById('modal-advertencia-notas');
      const instanceAdvertencia = M.Modal.getInstance(elemAdvertencia);
      instanceAdvertencia.open();
      return; 
    }
  }

  mostrarModalOrientacion();
}

function mostrarModalOrientacion() {
  const elem = document.getElementById('modal-orientacion');
  const instance = M.Modal.getInstance(elem);
  instance.open();
}

function continuarAPdfConAdvertencia() {
  const elemAdvertencia = document.getElementById('modal-advertencia-notas');
  const instanceAdvertencia = M.Modal.getInstance(elemAdvertencia);
  instanceAdvertencia.close();
  
  mostrarModalOrientacion();
}

function confirmarDescargaPdf(orientacion) {
  const elem = document.getElementById('modal-orientacion');
  const instance = M.Modal.getInstance(elem);
  instance.close();
  
  const radioPapel = document.querySelector('input[name="opcion-tamano-papel"]:checked');
  const tamañoSeleccionado = radioPapel ? radioPapel.value : 'LEGAL';
  // Respetar estrictamente la orientación elegida por el usuario en el modal
  const orientacionFinal = orientacion || 'vertical';

  if (btnPdfActual && hojaActualPdf) {
    descargarPdfHoja(btnPdfActual, hojaActualPdf, orientacionFinal, tamañoSeleccionado);
  }
}

function abrirPdfPlanillaPromocion() {
    if (!currentSpreadsheetId) {
        M.toast({ html: 'Selecciona una planilla antes de abrir su PDF de promoción.', classes: 'orange darken-2' });
        return;
    }
    if (!esPlanillaSegundoCuatrimestreSeleccionada()) {
        M.toast({ html: 'La Planilla de Promoción solo está disponible para el 2° Cuatrimestre', classes: 'amber darken-3' });
        return;
    }

    const nombreProm = (cursoCompleto && cursoCompleto.sheetOrder && cursoCompleto.sheetOrder.find(h => h.toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION'))) || 'PLANILLA_PROMOCION';
    descargarPdfHoja(null, nombreProm, 'vertical', 'LEGAL');
}
window.abrirPdfPlanillaPromocion = abrirPdfPlanillaPromocion;

async function descargarPdfHoja(btnElement, nombreHoja, orientacion, tamañoPapel) {
  const nombreHojaVisible = String(nombreHoja || 'Planilla').trim();
    const nombreConfiguradoHoja = obtenerInfoHoja(nombreHojaVisible).nombre;
    const nombreBasePdf = `PLANILLA: ${String(nombreConfiguradoHoja || nombreHojaVisible)
        .replace(/^Notas:\s*/i, '')
        .trim()}`;
    const tituloPdf = construirTituloPdfHoja(nombreBasePdf, nombreHojaVisible, selectPlanilla.value);
    const esPlanillaCalificaciones = ['PLANILLAS_CALIF_MAT', 'PLANILLAS_CALIF_LENG']
      .includes(nombreHojaVisible.toUpperCase());
    const esPlanillaPromocion = String(nombreHojaVisible || '').toUpperCase().replace(/[\s_\-]+/g, '').includes('PROMOCION');

  // Abrir la pestaña durante el clic para evitar que el navegador bloquee el PDF.
  const printViewUrl = new URL('pdf-print-view.html', window.location.href);
    printViewUrl.searchParams.set('hoja', tituloPdf);
  printViewUrl.searchParams.set('papel', tamañoPapel || 'LEGAL');
  printViewUrl.searchParams.set('orientacion', (orientacion || 'vertical').toUpperCase());
    printViewUrl.searchParams.set('procesando', 'true');

  const loadingUrl = new URL('pdf-loading.html', window.location.href);
  loadingUrl.searchParams.set('hoja', tituloPdf);
  loadingUrl.searchParams.set('papel', tamañoPapel || 'LEGAL');
  loadingUrl.searchParams.set('orientacion', (orientacion || 'vertical').toUpperCase());

  const ventanaVisor = window.open(
    (esPlanillaCalificaciones || esPlanillaPromocion) ? loadingUrl.toString() : printViewUrl.toString(),
    '_blank'
  );
  if (!ventanaVisor) {
    M.toast({ html: '❌ El navegador bloqueó la ventana emergente. Habilita los popups e inténtalo nuevamente.', classes: 'red darken-3', displayLength: 6000 });
    return;
  }

    if (esPlanillaCalificaciones) {
      generarPdfCalificacionesConsolidadasJsPdf(btnElement, nombreHojaVisible, orientacion, tamañoPapel, ventanaVisor);
      return;
    }

    if (esPlanillaPromocion) {
      generarPdfPlanillaPromocionJsPdf(btnElement, nombreHojaVisible, orientacion || 'vertical', tamañoPapel || 'LEGAL', ventanaVisor);
      return;
    }

  // 2. Comprobar si jsPDF está disponible para generación 100% en memoria
  const jsPdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPdfLib || typeof jsPdfLib !== 'function') {
    console.warn("jsPDF no disponible en cliente, recurriendo a exportación en servidor...");
    generarPdfEnServidorFallback(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor);
    return;
  }

  try {
    M.toast({ html: '⚡ Generando PDF en memoria...', classes: 'blue darken-2', displayLength: 2000 });

    const cursoDatosPdf = cursoCompleto;
    if (!cursoDatosPdf || cursoDatosPdf.error || !Array.isArray(cursoDatosPdf.students)) {
        throw new Error('No se pudieron encontrar los datos del curso para generar el PDF.');
    }

    // Respetar estrictamente la orientación elegida en el modal ('horizontal' / 'vertical')
    const orientacionStr = String(orientacion || '').toLowerCase();
    const esLandscape = orientacionStr === 'horizontal' || orientacionStr === 'landscape';
    const formatPapel = String(tamañoPapel || 'LEGAL').toLowerCase() === 'a4' ? 'a4' : 'legal';

    const doc = new jsPdfLib({
      orientation: esLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: formatPapel
    });
        doc.setProperties({ title: tituloPdf, subject: nombreHojaVisible });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado institucional centrado
    doc.setFontSize(14);
    doc.setTextColor(13, 71, 161);
    doc.text(tituloPdf, pageWidth / 2, 32, { align: 'center' });

    // Obtener configuración de columnas y alumnos activos
    const sheetConfig = (cursoDatosPdf.sheets && cursoDatosPdf.sheets[nombreHoja]) || {};
    const headers = sheetConfig.allHeaders || [];

    const camposVisibles = headers.filter(header => {
      const upper = String(header || '').toUpperCase();
      const esIdentificacion = ['NRO.', 'DNI', 'D.N.I', 'GRADO', 'SECCION', 'SECCIÓN',
        'APELLIDO', 'NOMBRE', 'ALUMNO', 'APELLIDO Y NOMBRE', 'ACTIVOS', 'ESTADO', 'OCULTO']
        .includes(upper) || upper.includes('GRADO') || upper.includes('SECCION') || upper.includes('DNI');
      return header && !esIdentificacion;
    });

    const columns = [
      { header: 'N°', dataKey: 'nro' },
      { header: 'DNI', dataKey: 'dni' },
      { header: 'Apellido y Nombre', dataKey: 'alumno' }
    ];
        const etiquetasCabecerasPdf = {
            'CS.SOCIALES': 'CS.\nSOC.',
            'CS.SOC': 'CS.\nSOC.',
            'CS. NAT.': 'CS.\nNAT.',
            'CS.NATURALES': 'CS.\nNAT.',
            'CS.NATURALES Y TEGNOLOGIA': 'CS. NAT.\nY TEC.',
            'EDUCACION ARTISTICA': 'EDUC.\nART.',
            'EDUCACION FISICA': 'ED.\nFÍSICA',
            'ED. FISICA': 'ED.\nFÍSICA',
            'ED. MUSICA': 'ED.\nMÚSICA',
            'LENG. EXTRANJERA': 'LENG.\nEXTR.',
            'INGLES': 'INGLÉS',
            'INASISTENCIA JUSTIFICA': 'INAS.\nJUST.',
            'JUSTIFICADA': 'INAS.\nJUST.',
            'INASISTENCIA INJUSTIFICADA': 'INAS.\nINJUST.',
            'INJUSTIFICADA': 'INAS.\nINJUST.',
            'CONDUCTA': 'COND.',
            'ACTITUDINAL': 'ACTIT.',
            'ACTITUDINAL.': 'ACTIT.',
            'PROM': 'Prom.',
            'PROM.': 'Prom.',
            'PROMEDIO': 'Prom.',
            'PROMEDIO.': 'Prom.',
            'PROMEDIO..': 'Prom.',
            'PROMEDIO...': 'Prom.'
        };
        const normalizarCabeceraPdf = texto => String(texto || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
    camposVisibles.forEach(c => {
            const header = String(c);
            const claveNormalizada = normalizarCabeceraPdf(header);
            columns.push({
                header: etiquetasCabecerasPdf[claveNormalizada] || etiquetasCabecerasPdf[header.toUpperCase().trim()] || header,
                dataKey: `col_${c}`
            });
    });

    // Filtrar únicamente alumnos activos y visibles
    const alumnos = cursoDatosPdf.students.filter(st => {
      const datos = st.datosHojas && st.datosHojas.DATOS || {};
      const oculto = String(obtenerValorCampo(datos, 'OCULTO') || '').toUpperCase();
      const estado = obtenerValorCampo(datos, 'ACTIVOS') !== undefined
        ? obtenerValorCampo(datos, 'ACTIVOS') : obtenerValorCampo(datos, 'ESTADO');
      const activo = estado === undefined || ['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(String(estado).toUpperCase());
      return !['SI', 'SÍ', 'TRUE'].includes(oculto) && activo;
    });

    const rows = alumnos.map((st, idx) => {
      const datosHoja = (st.datosHojas && st.datosHojas[nombreHoja]) || {};
      const fila = {
        nro: idx + 1,
        dni: st.dni || '',
        alumno: st.nombreCompleto || st.dni
      };

      // Contar notas válidas de este alumno en esta área/materia
      let sumaCentavos = 0;
      let cantidadNotas = 0;
      const esHojaBoletinPdf = String(nombreHoja || '').toUpperCase().includes('BOLETIN');
      let totalAreasBoletin = 0;
      let areasCompletasBoletin = 0;
      let sumaBoletin = 0;

      camposVisibles.forEach(c => {
        if (esHojaBoletinPdf) {
          const hSinAcentos = String(c || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const esArea = hSinAcentos === 'LENGUA' ||
            hSinAcentos === 'MATEMATICA' ||
            hSinAcentos.includes('CS.SOCIALES') ||
            hSinAcentos.includes('CS.NATURALES') || hSinAcentos.includes('NATURALES Y TEGNOLOGIA') ||
            hSinAcentos.includes('EDUCACION ARTISTICA') ||
            hSinAcentos.includes('EDUCACION FISICA') ||
            hSinAcentos.includes('LENG. EXTRANJERA') || hSinAcentos.includes('LENGUA EXTRANJERA');
          if (esArea) {
            totalAreasBoletin++;
            const v = String(datosHoja[c] || '').trim().replace(/,/g, '.');
            const num = Number(v);
            if (v !== '' && !isNaN(num) && num >= 6.0) {
              areasCompletasBoletin++;
              sumaBoletin += num;
            }
          }
        } else if (esCabeceraNotaRequerida(c, nombreHoja)) {
          const v = String(datosHoja[c] || '').trim().replace(/,/g, '.');
          if (v !== '' && !isNaN(Number(v))) {
            sumaCentavos += Math.round(Number(v) * 100);
            cantidadNotas++;
          }
        }
      });

      const promedioCalculado = esHojaBoletinPdf
        ? (totalAreasBoletin >= 7 && areasCompletasBoletin === totalAreasBoletin
            ? (Math.trunc((sumaBoletin / areasCompletasBoletin) * 1000 + 1e-9) / 1000).toFixed(3)
            : '')
        : (cantidadNotas > 0
            ? (Math.trunc(sumaCentavos / cantidadNotas + 1e-9) / 100).toFixed(2)
            : '');

      camposVisibles.forEach(c => {
        const cUp = String(c || '').toUpperCase();
        let val = (datosHoja[c] !== undefined && datosHoja[c] !== null) ? String(datosHoja[c]).trim() : '';

        if (cUp.includes('PROM') || cUp.includes('FINAL')) {
          if (!cUp.includes('GENERAL')) {
            // El promedio de la materia solo se muestra si tiene notas ingresadas; de lo contrario queda vacío
            val = promedioCalculado;
            datosHoja[c] = val;
          } else {
            if (promedioCalculado === '' && (!val || val === '1' || val === '1.00')) {
              val = '';
              datosHoja[c] = '';
            }
          }
        } else if (esCampoDeNota(c, nombreHoja) && val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) {
          val = formatearNotaADosDecimales(val);
        }

        fila[`col_${c}`] = val;
      });
      return fila;
    });

    // Generar tabla autoajustable con autotable centrada simétricamente
    if (doc.autoTable) {
      // Ancho utilizable y márgenes simétricos para centrado perfecto
      const margenLateral = 28;
      const anchoDisponible = pageWidth - (margenLateral * 2);
            const fontSizeBase = camposVisibles.length > 15 ? 5.5 : (camposVisibles.length > 12 ? 6.5 : (camposVisibles.length > 8 ? 7.5 : 8));
            const cellPadding = camposVisibles.length > 15 ? 1.8 : (camposVisibles.length > 12 ? 2.5 : 3.5);
            const widths = columns.map(column => {
                const key = column.dataKey;
                const minWidth = key === 'nro' ? 14 : key === 'dni' ? 32 : key === 'alumno' ? (camposVisibles.length > 15 ? 70 : 85) : (camposVisibles.length > 15 ? 16 : (camposVisibles.length > 12 ? 22 : 30));
                const maxWidth = key === 'alumno' ? (camposVisibles.length > 15 ? 85 : 100) : 150;
                const medirLineaMasAncha = texto => String(texto || '').split(/\r?\n/)
                    .reduce((maximo, linea) => Math.max(maximo, doc.getTextWidth(linea)), 0);
                doc.setFontSize(fontSizeBase);
                doc.setFont('helvetica', 'bold');
                let textWidth = medirLineaMasAncha(column.header);
                doc.setFont('helvetica', 'normal');
                rows.forEach(row => {
                    textWidth = Math.max(textWidth, medirLineaMasAncha(row[key]));
                });
                return {
                    key,
                    min: minWidth,
                    preferred: Math.min(maxWidth, Math.max(minWidth, textWidth + cellPadding * 2 + 2))
                };
            });

            const minWidthTotal = widths.reduce((total, column) => total + column.min, 0);
            const preferredExtraTotal = widths.reduce((total, column) => total + column.preferred - column.min, 0);
            const extraAvailable = Math.max(0, anchoDisponible - minWidthTotal);
            const widthFactor = preferredExtraTotal > 0
                ? Math.min(1, extraAvailable / preferredExtraTotal)
                : 0;
            const fontScale = widthFactor < 0.55 ? 0.82 : widthFactor < 0.8 ? 0.9 : 1;
            const fontSize = Math.max(6, fontSizeBase * fontScale);
            const fontSizeCabecera = esLandscape
                ? Math.max(4.8, fontSize - 0.9)
                : Math.min(5, Math.max(4.8, fontSize - 0.9));
            const columnWidths = widths.map(column => column.min + (column.preferred - column.min) * widthFactor);
            const assignedWidth = columnWidths.reduce((total, width) => total + width, 0);
            const remainingWidth = Math.max(0, anchoDisponible - assignedWidth);
            if (remainingWidth > 0 && assignedWidth > 0) {
                for (let index = 0; index < columnWidths.length; index++) {
                    columnWidths[index] += remainingWidth * (widths[index].preferred / assignedWidth);
                }
            }

            const colStyles = {};
            columns.forEach((column, index) => {
                colStyles[column.dataKey] = {
                    cellWidth: columnWidths[index],
                    halign: column.dataKey === 'alumno' ? 'left' : 'center'
                };
            });

      doc.autoTable({
        columns: columns,
        body: rows,
        startY: 60,
                tableWidth: anchoDisponible,
        theme: 'grid',
        styles: {
                    fontSize: fontSize,
                    cellPadding: cellPadding,
          textColor: [33, 33, 33],
          lineColor: [180, 180, 180],
          lineWidth: 0.5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [13, 71, 161],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
                    fontSize: fontSizeCabecera,
          halign: 'center',
                    valign: 'middle',
                    overflow: 'linebreak'
        },
        columnStyles: colStyles,
        margin: { top: 60, left: margenLateral, right: margenLateral, bottom: 25 },
        didDrawPage: function(data) {
          // Pie de página centrado con número de página
          const str = `Página ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 12, { align: 'center' });
        }
      });
    }

    // Convertir el PDF a Blob en memoria (sin tocar Google Drive)
    const blobPdf = doc.output('blob');
    const blobUrl = URL.createObjectURL(blobPdf);

    // Abrir el visor PDF nativo para ofrecer sus controles de imprimir/descargar.
    ventanaVisor.location.replace(blobUrl);

    ultimoPdfGenerado = {
      key: `${currentSpreadsheetId}|${nombreHoja}`,
      timestamp: Date.now()
    };

    M.toast({ html: '✅ PDF listo para descargar o imprimir', classes: 'green darken-2' });
  } catch (errorGeneracion) {
    console.error("Error al generar PDF en cliente:", errorGeneracion);
    generarPdfEnServidorFallback(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor);
  }
}

function generarPdfCalificacionesConsolidadasJsPdf(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor) {
  const iconoOriginal = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="material-icons">hourglass_empty</i>';
  }

  const jsPdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPdfLib || typeof jsPdfLib !== 'function') {
    console.warn("jsPDF no disponible en cliente, recurriendo a servidor fallback...");
    generarPdfCalificacionesDirecto(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor);
    return;
  }

  try {
    M.toast({ html: '⚡ Generando planilla oficial desde base de datos...', classes: 'blue darken-2', displayLength: 2500 });

    const cursoDatosPdf = cursoCompleto;
    if (!cursoDatosPdf || !Array.isArray(cursoDatosPdf.students)) {
      throw new Error('No se encontraron los datos del curso para generar la planilla.');
    }

    // 1. Configurar documento (Landscape legal por defecto como en la planilla oficial)
    const orientacionStr = String(orientacion || 'horizontal').toLowerCase();
    const esLandscape = orientacionStr === 'horizontal' || orientacionStr === 'landscape';
    const formatPapel = String(tamañoPapel || 'LEGAL').toLowerCase() === 'a4' ? 'a4' : 'legal';

    const doc = new jsPdfLib({
      orientation: esLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: formatPapel
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margenLateral = 20;
    const anchoDisponible = pageWidth - (margenLateral * 2);

    // 2. Extraer Título Institucional
    const nombreCurso = String((selectPlanilla && selectPlanilla.value) || '').trim();
    const esSegundo = /(?:2\s*(?:º|°|DO)?\s*CUAT|SEGUNDO\s*CUAT)/i.test(nombreCurso);
    const textoCuatri = esSegundo ? 'SEGUNDO CUATRIMESTRE' : 'PRIMER CUATRIMESTRE';

    const infoG = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(nombreCurso) : {};
    let gradoSeccion = '';
    if (infoG.grado) gradoSeccion += `${infoG.grado}° `;
    if (infoG.seccion) gradoSeccion += infoG.seccion;
    if (!gradoSeccion) gradoSeccion = '4° A';

    const textoTitulo = `PLANILLA DE CALIFICACIONES    ${textoCuatri}    GRADO: ${gradoSeccion}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 46, 89);
    doc.text(textoTitulo, pageWidth / 2, 28, { align: 'center' });

    // Logo Institucional si está presente en el DOM
    const imgLogo = document.querySelector('img[src*="escudo"]');
    if (imgLogo && imgLogo.complete && imgLogo.naturalWidth > 0) {
      try {
        const textWidth = doc.getTextWidth(textoTitulo);
        const logoX = Math.min(pageWidth - margenLateral - 28, (pageWidth / 2) + (textWidth / 2) + 12);
        doc.addImage(imgLogo, 'PNG', logoX, 12, 17.3, 24);
      } catch (eLogo) {
        console.warn('Aviso: no se pudo dibujar el escudo en el PDF:', eLogo);
      }
    }

    // 3. Identificar hojas en cursoCompleto
    const sheetOrder = cursoDatosPdf.sheetOrder || [];
    const esHojaLengua = String(nombreHoja || '').toUpperCase().includes('LENG');

    const buscarHoja = (patron, excluidos = []) => {
      return sheetOrder.find(h => {
        const u = h.toUpperCase();
        if (excluidos.some(ex => u.includes(ex))) return false;
        return u.includes(patron);
      }) || '';
    };

    const hojaLeng = buscarHoja('LENG', ['EXTRANJERA', 'PLANILLA']);
    const hojaMat = buscarHoja('MAT', ['PLANILLA']);
    const hojaSoc = buscarHoja('SOCIAL', ['PLANILLA']);
    const hojaNat = buscarHoja('NATURAL', ['PLANILLA']);

    // Función auxiliar para obtener criterios válidos de una materia detallada
    const obtenerCriterios = (nombreHojaMateria, fallbackCriterios) => {
      const cfg = (cursoDatosPdf.sheets && cursoDatosPdf.sheets[nombreHojaMateria]) || {};
      const headers = cfg.allHeaders || [];
      const crits = headers.filter(h => {
        const u = String(h || '').toUpperCase().trim();
        const esId = ['NRO.', 'DNI', 'D.N.I', 'GRADO', 'SECCION', 'SECCIÓN', 'APELLIDO', 'NOMBRE', 'ALUMNO', 'APELLIDO Y NOMBRE', 'ACTIVOS', 'ESTADO', 'OCULTO', '_ROWINDEX'].includes(u) || u.includes('DNI');
        const esProm = u.includes('PROM') || u.includes('FINAL');
        return h && !esId && !esProm;
      });
      return crits.length > 0 ? crits : fallbackCriterios;
    };

    const criteriosLengua = obtenerCriterios(hojaLeng, ['Lect.', 'Evas', 'Cómp. L.', 'Ev. Es', 'Actitudinal']);
    const criteriosSociales = obtenerCriterios(hojaSoc, ['Oral', 'Esc.', 'Actitudinal']);
    const criteriosMatematica = obtenerCriterios(hojaMat, ['Oral', 'Esc.', 'Actitudinal']);
    const criteriosNaturales = obtenerCriterios(hojaNat, ['Oral', 'Esc.', 'Actitudinal']);

    // Definición de columnas de datos
    let colsDef = [];

    if (esHojaLengua) {
      criteriosLengua.forEach(crit => {
        colsDef.push({ id: `leng_${crit}`, label: crit, esPromedio: false, esDetalle: true, hoja: hojaLeng, header: crit });
      });
      colsDef.push({ id: 'leng_prom', label: 'PROMEDIO', esPromedio: true, esDetalle: true, hoja: hojaLeng, esFinDeGrupo: true });
      colsDef.push({ id: 'mat_prom', label: 'MATEMÁTICA', esPromedio: true, esDetalle: false, hoja: hojaMat, esFinDeGrupo: true });
      criteriosSociales.forEach(crit => {
        colsDef.push({ id: `soc_${crit}`, label: crit, esPromedio: false, esDetalle: true, hoja: hojaSoc, header: crit });
      });
      colsDef.push({ id: 'soc_prom', label: 'PROMEDIO', esPromedio: true, esDetalle: true, hoja: hojaSoc, esFinDeGrupo: true });
      colsDef.push({ id: 'nat_prom', label: 'CS. NAT.', esPromedio: true, esDetalle: false, hoja: hojaNat, esFinDeGrupo: true });
    } else {
      colsDef.push({ id: 'leng_prom', label: 'LENGUA', esPromedio: true, esDetalle: false, hoja: hojaLeng, esFinDeGrupo: true });
      criteriosMatematica.forEach(crit => {
        colsDef.push({ id: `mat_${crit}`, label: crit, esPromedio: false, esDetalle: true, hoja: hojaMat, header: crit });
      });
      colsDef.push({ id: 'mat_prom', label: 'PROMEDIO', esPromedio: true, esDetalle: true, hoja: hojaMat, esFinDeGrupo: true });
      colsDef.push({ id: 'soc_prom', label: 'CS.SOC', esPromedio: true, esDetalle: false, hoja: hojaSoc, esFinDeGrupo: true });
      criteriosNaturales.forEach(crit => {
        colsDef.push({ id: `nat_${crit}`, label: crit, esPromedio: false, esDetalle: true, hoja: hojaNat, header: crit });
      });
      colsDef.push({ id: 'nat_prom', label: 'PROMEDIO', esPromedio: true, esDetalle: true, hoja: hojaNat, esFinDeGrupo: true });
    }

    colsDef.push({ id: 'esp_fisica', label: 'Ed. Física', esPromedio: false, tipoEspecial: 'ED_FISICA' });
    colsDef.push({ id: 'esp_musica', label: 'Ed.Mus', esPromedio: false, tipoEspecial: 'ED_MUSICA' });
    colsDef.push({ id: 'esp_ingles', label: 'Inglés', esPromedio: false, tipoEspecial: 'INGLES' });
    colsDef.push({ id: 'asist_conducta', label: 'Conducta', esPromedio: false, tipoEspecial: 'CONDUCTA' });
    colsDef.push({ id: 'asist_just', label: 'Justificada', esPromedio: false, tipoEspecial: 'JUSTIFICADA' });
    colsDef.push({ id: 'asist_injust', label: 'Injustificada', esPromedio: false, tipoEspecial: 'INJUSTIFICADA' });

    // Armar Header Multi-fila
    const filaHead1 = [
      { content: 'Nro.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'APELLIDO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'NOMBRE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    ];

    const filaHead2 = [];
    const indicesColumnasPromedio = new Set();
    const columnasConBordeGrueso = new Set();

    // Columna 2 (NOMBRE) tiene división gruesa
    columnasConBordeGrueso.add(2);

    let colIndexActual = 3;

    if (esHojaLengua) {
      const cantLeng = criteriosLengua.length + 1;
      filaHead1.push({ content: 'LENGUA', colSpan: cantLeng, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } });
      criteriosLengua.forEach(crit => {
        filaHead2.push({ content: crit, rotated: true, title: crit, styles: { halign: 'center', valign: 'bottom' } });
        colIndexActual++;
      });
      filaHead2.push({ content: 'PROMEDIO', rotated: true, title: 'PROMEDIO', isRed: true, styles: { halign: 'center', valign: 'bottom', textColor: [211, 47, 47] } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      filaHead1.push({ content: 'MATEMÁTICA', rowSpan: 2, rotated: true, title: 'MATEMÁTICA', styles: { halign: 'center', valign: 'bottom', fontStyle: 'bold' } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      const cantSoc = criteriosSociales.length + 1;
      filaHead1.push({ content: 'CS.SOC', colSpan: cantSoc, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } });
      criteriosSociales.forEach(crit => {
        filaHead2.push({ content: crit, rotated: true, title: crit, styles: { halign: 'center', valign: 'bottom' } });
        colIndexActual++;
      });
      filaHead2.push({ content: 'PROMEDIO', rotated: true, title: 'PROMEDIO', isRed: true, styles: { halign: 'center', valign: 'bottom', textColor: [211, 47, 47] } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      filaHead1.push({ content: 'CS. NAT.', rowSpan: 2, rotated: true, title: 'CS. NAT.', styles: { halign: 'center', valign: 'bottom', fontStyle: 'bold' } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;
    } else {
      filaHead1.push({ content: 'LENGUA', rowSpan: 2, rotated: true, title: 'LENGUA', styles: { halign: 'center', valign: 'bottom', fontStyle: 'bold' } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      const cantMat = criteriosMatematica.length + 1;
      filaHead1.push({ content: 'MATEMÁTICA', colSpan: cantMat, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } });
      criteriosMatematica.forEach(crit => {
        filaHead2.push({ content: crit, rotated: true, title: crit, styles: { halign: 'center', valign: 'bottom' } });
        colIndexActual++;
      });
      filaHead2.push({ content: 'PROMEDIO', rotated: true, title: 'PROMEDIO', isRed: true, styles: { halign: 'center', valign: 'bottom', textColor: [211, 47, 47] } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      filaHead1.push({ content: 'CS.SOC', rowSpan: 2, rotated: true, title: 'CS.SOC', styles: { halign: 'center', valign: 'bottom', fontStyle: 'bold' } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;

      const cantNat = criteriosNaturales.length + 1;
      filaHead1.push({ content: 'CS. NAT.', colSpan: cantNat, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } });
      criteriosNaturales.forEach(crit => {
        filaHead2.push({ content: crit, rotated: true, title: crit, styles: { halign: 'center', valign: 'bottom' } });
        colIndexActual++;
      });
      filaHead2.push({ content: 'PROMEDIO', rotated: true, title: 'PROMEDIO', isRed: true, styles: { halign: 'center', valign: 'bottom', textColor: [211, 47, 47] } });
      indicesColumnasPromedio.add(colIndexActual);
      columnasConBordeGrueso.add(colIndexActual);
      colIndexActual++;
    }

    const finales = [
      { label: 'Ed. Física', id: 'Ed. Física' },
      { label: 'Ed.Mus', id: 'Ed.Mus' },
      { label: 'Inglés', id: 'Inglés' },
      { label: 'Conducta', id: 'Conducta' },
      { label: 'Justificada', id: 'Justificada' },
      { label: 'Injustificada', id: 'Injustificada' }
    ];
    finales.forEach(f => {
      filaHead1.push({ content: f.label, rowSpan: 2, rotated: true, title: f.label, styles: { halign: 'center', valign: 'bottom' } });
      colIndexActual++;
    });

    const head = [filaHead1, filaHead2];

    // Helper para cálculo estricto de promedio de una materia en un alumno
    const calcularPromedioEstricto = (alumno, nombreHojaMateria) => {
      if (!alumno || !nombreHojaMateria || !alumno.datosHojas) return '';
      const datosHoja = alumno.datosHojas[nombreHojaMateria] || {};
      const cfg = (cursoDatosPdf.sheets && cursoDatosPdf.sheets[nombreHojaMateria]) || {};
      const headers = cfg.allHeaders || Object.keys(datosHoja);

      let sumaCentavos = 0;
      let cantidad = 0;
      headers.forEach(h => {
        if (esCabeceraNotaRequerida(h, nombreHojaMateria)) {
          const raw = String(datosHoja[h] || '').trim().replace(/,/g, '.');
          if (raw !== '' && !isNaN(Number(raw))) {
            const num = Number(raw);
            if (num > 0) {
              sumaCentavos += Math.round(num * 100);
              cantidad++;
            }
          }
        }
      });

      if (cantidad === 0) return '';
      return (Math.trunc(sumaCentavos / cantidad + 1e-9) / 100).toFixed(2);
    };

    // Helper para resolver columnas especiales y asistencia
    const resolverEspecial = (alumno, tipo) => {
      if (!alumno || !alumno.datosHojas) return '';
      const todasHojas = Object.keys(alumno.datosHojas);

      const buscarEnHojas = (patronesHoja, patronesCol, excluirCol = []) => {
        for (const h of todasHojas) {
          const hUp = h.toUpperCase();
          if (hUp.includes('BOLETIN') || hUp === 'DATOS') continue;
          if (patronesHoja.some(p => hUp.includes(p))) {
            const datosH = alumno.datosHojas[h] || {};
            for (const col of Object.keys(datosH)) {
              const colUp = col.toUpperCase().trim();
              if (excluirCol.some(ex => colUp.includes(ex))) continue;
              if (patronesCol.some(p => colUp.includes(p))) {
                const val = String(datosH[col] || '').trim();
                if (val !== '') return val;
              }
            }
          }
        }
        return '';
      };

      if (tipo === 'ED_FISICA') {
        const val = buscarEnHojas(['FISICA', 'FÍSICA', 'ESPECIAL'], ['FISICA', 'FÍSICA']);
        return (val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) ? formatearNotaADosDecimales(val) : val;
      }
      if (tipo === 'ED_MUSICA') {
        const val = buscarEnHojas(['MUSICA', 'MÚSICA', 'ARTISTICA', 'ARTÍSTICA', 'PLASTICA', 'ESPECIAL'], ['MUSICA', 'MÚSICA', 'ARTISTICA', 'ARTÍSTICA', 'PLASTICA']);
        return (val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) ? formatearNotaADosDecimales(val) : val;
      }
      if (tipo === 'INGLES') {
        const val = buscarEnHojas(['INGLES', 'INGLÉS', 'EXTRANJERA', 'ESPECIAL'], ['INGLES', 'INGLÉS', 'EXTRANJERA']);
        return (val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) ? formatearNotaADosDecimales(val) : val;
      }
      if (tipo === 'CONDUCTA') {
        return buscarEnHojas(['ASISTENCIA', 'CONDUCTA'], ['CONDUCTA']);
      }
      if (tipo === 'JUSTIFICADA') {
        return buscarEnHojas(['ASISTENCIA', 'CONDUCTA'], ['JUSTIFICA'], ['INJUSTIFICA']);
      }
      if (tipo === 'INJUSTIFICADA') {
        return buscarEnHojas(['ASISTENCIA', 'CONDUCTA'], ['INJUSTIFICA']);
      }
      return '';
    };

    // 4. Filtrar y ordenar alumnos activos
    const alumnos = cursoDatosPdf.students.filter(st => {
      const datos = (st.datosHojas && st.datosHojas.DATOS) || {};
      const oculto = String(obtenerValorCampo(datos, 'OCULTO') || '').toUpperCase();
      const estado = obtenerValorCampo(datos, 'ACTIVOS') !== undefined
        ? obtenerValorCampo(datos, 'ACTIVOS') : obtenerValorCampo(datos, 'ESTADO');
      const activo = estado === undefined || ['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(String(estado).toUpperCase());
      return !['SI', 'SÍ', 'TRUE'].includes(oculto) && activo;
    });

    if (typeof compararAlumnosPorSexoYNombre === 'function') {
      alumnos.sort(compararAlumnosPorSexoYNombre);
    }

    // 5. Construir filas de datos
    const bodyRows = alumnos.map((st, idx) => {
      const datosDatos = (st.datosHojas && st.datosHojas.DATOS) || {};
      const numOrden = st.numeroOrden || (idx + 1);

      let apellido = String(obtenerValorCampo(datosDatos, 'APELLIDO') || '').trim();
      let nombre = String(obtenerValorCampo(datosDatos, 'NOMBRE') || '').trim();

      if (!apellido && st.nombreCompleto) {
        const partes = st.nombreCompleto.split(',');
        apellido = partes[0] ? partes[0].trim() : st.nombreCompleto;
        nombre = partes[1] ? partes[1].trim() : '';
      }

      const fila = [
        String(numOrden),
        apellido.toUpperCase(),
        nombre
      ];

      colsDef.forEach(col => {
        let valorCelda = '';
        if (col.esDetalle && col.header) {
          const datosHoja = (st.datosHojas && st.datosHojas[col.hoja]) || {};
          let v = datosHoja[col.header];
          if ((v === undefined || v === null || String(v).trim() === '') && st.datosHojas[nombreHoja]) {
            v = st.datosHojas[nombreHoja][col.header];
          }
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            const vStr = String(v).trim();
            valorCelda = !isNaN(Number(vStr.replace(/,/g, '.'))) ? formatearNotaADosDecimales(vStr) : vStr;
          }
        } else if (col.esPromedio) {
          valorCelda = calcularPromedioEstricto(st, col.hoja);
        } else if (col.tipoEspecial) {
          valorCelda = resolverEspecial(st, col.tipoEspecial);
        }
        fila.push(valorCelda);
      });

      return fila;
    });

    // 6. Configurar anchos de columna
    const totalCols = 3 + colsDef.length;
    const anchoNro = 22;
    const anchoApellido = esLandscape && formatPapel === 'legal' ? 115 : 95;
    const anchoNombre = esLandscape && formatPapel === 'legal' ? 105 : 90;
    const anchoFijo = anchoNro + anchoApellido + anchoNombre;
    const cantColsNotas = colsDef.length;
    const anchoNota = Math.max(26, (anchoDisponible - anchoFijo) / cantColsNotas);

    const columnStyles = {
      0: { cellWidth: anchoNro, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: anchoApellido, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: anchoNombre, halign: 'left' }
    };

    for (let c = 3; c < totalCols; c++) {
      columnStyles[c] = { cellWidth: anchoNota, halign: 'center' };
    }

    // 7. Generar AutoTable
    doc.autoTable({
      head: head,
      body: bodyRows,
      startY: 44,
      tableWidth: anchoDisponible,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 48
      },
      columnStyles: columnStyles,
      margin: { top: 44, left: margenLateral, right: margenLateral, bottom: 20 },
      didParseCell: function(data) {
        if (data.section === 'head') {
          if (data.cell.raw && data.cell.raw.rotated) {
            data.cell.text = [''];
          }
        } else if (data.section === 'body') {
          if (indicesColumnasPromedio.has(data.column.index)) {
            data.cell.styles.textColor = [211, 47, 47];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'head' && data.cell.raw && data.cell.raw.rotated) {
          const raw = data.cell.raw;
          const title = String(raw.title || raw.content || '');
          if (title) {
            doc.saveGraphicsState();
            const isRed = Boolean(raw.isRed);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', isRed ? 'bold' : 'normal');
            if (isRed) {
              doc.setTextColor(211, 47, 47);
            } else {
              doc.setTextColor(0, 0, 0);
            }
            const x = data.cell.x + (data.cell.width / 2) + 2.2;
            const y = data.cell.y + data.cell.height - 4;
            doc.text(title, x, y, { angle: 90 });
            doc.restoreGraphicsState();
          }
        }

        if (columnasConBordeGrueso.has(data.column.index)) {
          doc.saveGraphicsState();
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.2);
          doc.line(
            data.cell.x + data.cell.width,
            data.cell.y,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
          doc.restoreGraphicsState();
        }
      },
      didDrawPage: function(data) {
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });

    // 8. Visualización instantánea en memoria
    const blobPdf = doc.output('blob');
    const blobUrl = URL.createObjectURL(blobPdf);

    if (ventanaVisor && !ventanaVisor.closed) {
      ventanaVisor.location.replace(blobUrl);
    } else {
      window.open(blobUrl, '_blank');
    }

    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }

    M.toast({ html: '✅ Planilla oficial generada con éxito', classes: 'green darken-2' });
  } catch (errorGen) {
    console.error("Error generando planilla consolidada en memoria:", errorGen);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }
    M.toast({ html: '❌ Error: ' + (errorGen.message || errorGen), classes: 'red darken-3', displayLength: 6000 });
    generarPdfCalificacionesDirecto(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor);
  }
}

async function generarPdfPlanillaPromocionJsPdf(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor) {
  const iconoOriginal = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="material-icons">hourglass_empty</i>';
  }

  const jsPdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPdfLib || typeof jsPdfLib !== 'function') {
    console.warn("jsPDF no disponible en cliente, recurriendo a servidor fallback...");
    if (typeof generarPdfEnServidorFallback === 'function') {
      generarPdfEnServidorFallback(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaVisor);
    }
    return;
  }

  try {
    M.toast({ html: '⚡ Generando planilla de promoción anual (ambos cuatrimestres)...', classes: 'blue darken-2', displayLength: 2500 });

    const cursoDatosPdf = cursoCompleto;
    if (!cursoDatosPdf || !Array.isArray(cursoDatosPdf.students)) {
      throw new Error('No se encontraron los datos del curso para generar la planilla de promoción.');
    }

    // 1. Configurar documento (Portrait Legal estricto conforme al formato oficial ministerial)
    const doc = new jsPdfLib({
      orientation: 'portrait',
      unit: 'pt',
      format: 'legal'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 612 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // 1008 pt
    const margenLateral = 16;
    const anchoDisponible = pageWidth - (margenLateral * 2); // 580 pt

    // 2. Extraer Título Institucional, Grado, Sección, Turno y Año
    const nombreCurso = String((selectPlanilla && selectPlanilla.value) || '').trim();
    const infoG = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(nombreCurso) : {};
    
    const añoMatch = nombreCurso.match(/\b(202\d)\b/) || String(new Date().getFullYear()).match(/\b(202\d)\b/);
    const añoTexto = añoMatch ? añoMatch[1] : String(new Date().getFullYear());
    
    let gradoTexto = '';
    if (infoG.grado && infoG.grado !== 99) gradoTexto = `${infoG.grado}°`;
    else gradoTexto = '4°';

    const seccionTexto = infoG.seccion || 'A';
    const turnoTexto = (seccionTexto.toUpperCase() >= 'G') ? 'TARDE' : 'MAÑANA';

    // Línea 1: PLANILLA DE PROMOCIÓN AÑO    [AÑO]
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`PLANILLA DE PROMOCIÓN AÑO    ${añoTexto}`, pageWidth / 2, 18, { align: 'center' });

    // Línea 2: ESCUELA Nº 101 "Ntra. Sra. de la Misericordia"
    doc.setFontSize(10);
    const textoEscuela = 'ESCUELA Nº 101 "Ntra. Sra. de la Misericordia"';
    doc.text(textoEscuela, pageWidth / 2, 30, { align: 'center' });

    // Escudo Institucional (a la derecha del nombre de la escuela, tal como en el formato ministerial)
    const imgLogo = document.querySelector('img[src*="escudo"]');
    if (imgLogo && imgLogo.complete && imgLogo.naturalWidth > 0) {
      try {
        const textWidthEsc = doc.getTextWidth(textoEscuela);
        const logoX = (pageWidth / 2) + (textWidthEsc / 2) + 12;
        doc.addImage(imgLogo, 'PNG', logoX, 15, 14.4, 20);
      } catch (eLogo) {
        console.warn('Aviso: no se pudo dibujar el escudo en el PDF:', eLogo);
      }
    }

    // Línea 3: GRADO: 4°    SECCIÓN: "A"    TURNO: MAÑANA    AÑO: 2026
    doc.setFontSize(8.5);
    const subEncabezado = `GRADO: ${gradoTexto}    SECCIÓN: "${seccionTexto}"    TURNO: ${turnoTexto}    AÑO: ${añoTexto}`;
    doc.text(subEncabezado, pageWidth / 2, 42, { align: 'center' });

    // 3. Consultar datos del cuatrimestre hermano en Supabase para consolidar el año completo
    let mapaCalifsHermano = {};
    let sheetConfigsHermano = {};
    let sheetOrderHermano = [];
    let planillaHermana = null;
    let hermanoDbId = null;

    try {
      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        // Consultar directamente las planillas en Supabase para obtener el ID numérico real
        const { data: dbPlanillas } = await supabaseClient
          .from('planillas')
          .select('id, nombre, spreadsheet_id');

        if (Array.isArray(dbPlanillas)) {
          const planillaActualDbId = window.currentPlanillaDbId;
          const planillaActualSpreadsheetId = String(currentSpreadsheetId || '');

          planillaHermana = dbPlanillas.find(p => {
            // Evitar coincidir con la planilla actual
            if (planillaActualDbId && Number(p.id) === Number(planillaActualDbId)) return false;
            if (planillaActualSpreadsheetId && (String(p.spreadsheet_id) === planillaActualSpreadsheetId || String(p.id) === planillaActualSpreadsheetId)) return false;

            const infoP = extraerGradoYSeccionGlobal(p.nombre);
            return infoP.grado === infoG.grado &&
                   String(infoP.seccion).toUpperCase() === String(infoG.seccion).toUpperCase() &&
                   infoP.esSegundoCuatri !== infoG.esSegundoCuatri &&
                   !infoP.esEsp;
          });

          if (planillaHermana && planillaHermana.id) {
            hermanoDbId = planillaHermana.id;
          }
        }
      }

      if (hermanoDbId && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const [respHojas, respCalifs] = await Promise.all([
          supabaseClient
            .from('planilla_hojas')
            .select('*')
            .eq('planilla_id', hermanoDbId)
            .order('orden', { ascending: true }),
          supabaseClient
            .from('calificaciones')
            .select('*')
            .eq('planilla_id', hermanoDbId)
        ]);

        if (Array.isArray(respHojas.data)) {
          sheetOrderHermano = respHojas.data.map(h => h.nombre_hoja);
          respHojas.data.forEach(h => {
            sheetConfigsHermano[h.nombre_hoja] = {
              allHeaders: h.all_headers || [],
              editableFields: h.editable_fields || []
            };
          });
        }

        if (Array.isArray(respCalifs.data)) {
          respCalifs.data.forEach(c => {
            const rawDni = String(c.alumno_dni || '').trim();
            const cleanDni = rawDni.replace(/[^0-9]/g, '');
            const vals = c.valores || {};
            if (!mapaCalifsHermano[rawDni]) mapaCalifsHermano[rawDni] = {};
            mapaCalifsHermano[rawDni][c.nombre_hoja] = vals;
            if (cleanDni && cleanDni !== rawDni) {
              if (!mapaCalifsHermano[cleanDni]) mapaCalifsHermano[cleanDni] = {};
              mapaCalifsHermano[cleanDni][c.nombre_hoja] = vals;
            }
          });
        }
      }
    } catch (errHermano) {
      console.warn("Aviso: no se pudieron cargar calificaciones del cuatrimestre hermano:", errHermano);
    }

    // Identificar cuál conjunto corresponde al 1er Cuatrimestre y cuál al 2do Cuatrimestre
    const esCursoActualSegundoCuatri = infoG.esSegundoCuatri === 1;

    // Helper: cálculo estricto de promedio de un área en un objeto de hoja
    const calcularPromedioEstrictoHoja = (datosHoja, cfgHoja, nombreHoja) => {
      if (!datosHoja) return '';
      const headers = (cfgHoja && cfgHoja.allHeaders && cfgHoja.allHeaders.length > 0)
        ? cfgHoja.allHeaders
        : Object.keys(datosHoja);
      let sumaCentavos = 0;
      let cantidad = 0;
      headers.forEach(h => {
        if (typeof esCabeceraNotaRequerida === 'function' ? esCabeceraNotaRequerida(h, nombreHoja) : true) {
          const raw = String(datosHoja[h] || '').trim().replace(/,/g, '.');
          if (raw !== '' && !isNaN(Number(raw))) {
            const num = Number(raw);
            if (num > 0) {
              sumaCentavos += Math.round(num * 100);
              cantidad++;
            }
          }
        }
      });

      if (cantidad > 0) {
        return (Math.trunc(sumaCentavos / cantidad + 1e-9) / 100).toFixed(2);
      }

      // Fallback a columna PROMEDIO si no hay columnas individuales evaluadas
      for (const [k, v] of Object.entries(datosHoja)) {
        const kUp = String(k).toUpperCase().trim();
        if ((kUp.includes('PROM') || kUp.includes('FINAL')) && !kUp.includes('GENERAL')) {
          const raw = String(v || '').trim().replace(/,/g, '.');
          if (raw !== '' && !isNaN(Number(raw)) && Number(raw) > 0) {
            return (Math.trunc(Number(raw) * 100 + 1e-9) / 100).toFixed(2);
          }
        }
      }
      return '';
    };

    // Helper: buscar hoja y obtener su promedio
    const obtenerPromedioMateria = (datosHojas, sheetConfigs, sheetOrderList, patron, excluidos = []) => {
      if (!datosHojas) return '';
      const nombreHojaMateria = (sheetOrderList || []).find(h => {
        const u = h.toUpperCase();
        if (excluidos.some(ex => u.includes(ex))) return false;
        return u.includes(patron);
      }) || '';

      if (nombreHojaMateria && datosHojas[nombreHojaMateria]) {
        return calcularPromedioEstrictoHoja(datosHojas[nombreHojaMateria], (sheetConfigs && sheetConfigs[nombreHojaMateria]) || {}, nombreHojaMateria);
      }

      // Buscar directamente en las claves existentes de datosHojas
      const claveDirecta = Object.keys(datosHojas).find(h => {
        const u = h.toUpperCase();
        if (excluidos.some(ex => u.includes(ex))) return false;
        return u.includes(patron);
      });
      if (claveDirecta && datosHojas[claveDirecta]) {
        return calcularPromedioEstrictoHoja(datosHojas[claveDirecta], (sheetConfigs && sheetConfigs[claveDirecta]) || {}, claveDirecta);
      }
      return '';
    };

    // Helper: resolver campos de áreas especiales (Ed. Física, Artística, Inglés)
    const obtenerNotaEspecial = (datosHojas, tipo) => {
      if (!datosHojas) return '';
      const todasHojas = Object.keys(datosHojas);

      const buscarEnHojas = (patronesHoja, patronesCol, excluirCol = []) => {
        for (const h of todasHojas) {
          const hUp = h.toUpperCase();
          if (hUp.includes('BOLETIN') || hUp === 'DATOS') continue;
          if (patronesHoja.some(p => hUp.includes(p))) {
            const datosH = datosHojas[h] || {};
            for (const col of Object.keys(datosH)) {
              const colUp = col.toUpperCase().trim();
              if (excluirCol.some(ex => colUp.includes(ex))) continue;
              if (patronesCol.some(p => colUp.includes(p))) {
                const val = String(datosH[col] || '').trim();
                if (val !== '') return val;
              }
            }
          }
        }
        return '';
      };

      if (tipo === 'ED_FISICA') {
        const val = buscarEnHojas(['FISICA', 'FÍSICA', 'ESPECIAL'], ['FISICA', 'FÍSICA', 'ED. FISICA', 'ED. FÍSICA']);
        return (val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) ? formatearNotaADosDecimales(val) : val;
      }
      if (tipo === 'ED_ARTISTICA') {
        const valDirecto = buscarEnHojas(['ARTISTICA', 'ARTÍSTICA', 'ESPECIAL'], ['ARTISTICA', 'ARTÍSTICA']);
        if (valDirecto !== '' && !isNaN(Number(valDirecto.replace(/,/g, '.')))) return formatearNotaADosDecimales(valDirecto);

        // Promedio entre Música y Plástica
        const valMusica = buscarEnHojas(['MUSICA', 'MÚSICA', 'ESPECIAL'], ['MUSICA', 'MÚSICA']);
        const valPlastica = buscarEnHojas(['PLASTICA', 'PLÁSTICA', 'ESPECIAL'], ['PLASTICA', 'PLÁSTICA']);
        const numMus = Number(String(valMusica).replace(/,/g, '.'));
        const numPlas = Number(String(valPlastica).replace(/,/g, '.'));
        const musValido = !isNaN(numMus) && numMus > 0;
        const plasValido = !isNaN(numPlas) && numPlas > 0;

        if (musValido && plasValido) {
          return truncarPromedio((numMus + numPlas) / 2);
        } else if (musValido) {
          return truncarPromedio(numMus);
        } else if (plasValido) {
          return truncarPromedio(numPlas);
        }
        return valDirecto || '';
      }
      if (tipo === 'INGLES') {
        const val = buscarEnHojas(['INGLES', 'INGLÉS', 'EXTRANJERA', 'ESPECIAL'], ['INGLES', 'INGLÉS', 'EXTRANJERA', 'IDIOMA']);
        return (val !== '' && !isNaN(Number(val.replace(/,/g, '.')))) ? formatearNotaADosDecimales(val) : val;
      }
      return '';
    };

    // Helper: obtener inasistencias y conducta
    const obtenerInasistencia = (datosHojas, tipo) => {
      if (!datosHojas) return '';
      const todasHojas = Object.keys(datosHojas);
      for (const h of todasHojas) {
        const hUp = h.toUpperCase();
        if (tipo !== 'CONDUCTA' && tipo !== 'CONDICION' && hUp.includes('BOLETIN')) continue;
        if (hUp.includes('ASISTENCIA') || hUp.includes('CONDUCTA') || hUp.includes('CALIF') || hUp.includes('BOLETIN') || hUp === 'DATOS') {
          const datosH = datosHojas[h] || {};
          for (const col of Object.keys(datosH)) {
            const colUp = col.toUpperCase().trim();
            if (tipo === 'JUSTIFICADA' && ((colUp.includes('JUSTIFICA') && !colUp.includes('INJUSTIFICA')) || colUp === 'J')) {
              const val = String(datosH[col] || '').trim();
              if (val !== '') return val;
            }
            if (tipo === 'INJUSTIFICADA' && (colUp.includes('INJUSTIFICA') || colUp === 'I')) {
              const val = String(datosH[col] || '').trim();
              if (val !== '') return val;
            }
            if (tipo === 'CONDUCTA' && colUp.includes('CONDUCTA')) {
              const val = String(datosH[col] || '').trim();
              if (val !== '') return val;
            }
            if (tipo === 'CONDICION' && (colUp.includes('CONDICION') || colUp.includes('CONDICIÓN') || colUp === 'COND')) {
              const val = String(datosH[col] || '').trim();
              if (val !== '') return val;
            }
            if (tipo === 'OBSERVACIONES' && (colUp.includes('OBSERVACION') || colUp.includes('OBSERVACIONES') || colUp === 'OBS')) {
              const val = String(datosH[col] || '').trim();
              if (val !== '') return val;
            }
          }
        }
      }
      return '';
    };

    // FÓRMULA OFICIAL DE PROMOCIÓN PARA CADA ÁREA:
    // =IF(OR(prom materia 1 cuatrimestre < 6, prom. materia 2 cuatriestre < 6), "", promedio anual)
    // Donde promedio anual es promedio(prom1 + prom2) truncado a 2 decimales
    const calcularNotaPromocionArea = (p1Str, p2Str) => {
      const s1 = String(p1Str || '').trim().replace(/,/g, '.');
      const s2 = String(p2Str || '').trim().replace(/,/g, '.');

      // Si no hay ninguna nota en ninguno de los cuatrimestres (área no evaluada o no cursada)
      if (s1 === '' && s2 === '') {
        return { nota: '', desaprobada: false, evaluada: false };
      }
      // Si solo se ingresó nota en un cuatrimestre y falta el otro
      if (s1 === '' || s2 === '') {
        return { nota: '', desaprobada: true, evaluada: true };
      }

      const num1 = Number(s1);
      const num2 = Number(s2);
      if (isNaN(num1) || isNaN(num2)) {
        return { nota: '', desaprobada: true, evaluada: true };
      }

      // Si cualquiera de los dos cuatrimestres es menor a 6, NO aparece la nota final (queda vacío "")
      if (num1 < 6.0 || num2 < 6.0) {
        return { nota: '', desaprobada: true, evaluada: true };
      }

      // Ambos cuatrimestres aprobados (>= 6.00): promedio anual truncado a 2 decimales
      const prom = (num1 + num2) / 2;
      const notaFinal = (Math.trunc(prom * 100 + 1e-9) / 100).toFixed(2);
      return { nota: notaFinal, desaprobada: false, evaluada: true };
    };

    // FÓRMULA OFICIAL 2: Suma total de inasistencias de los 2 cuatrimestres
    const sumarInasistencias = (a1, a2) => {
      const s1 = String(a1 !== undefined && a1 !== null ? a1 : '').trim();
      const s2 = String(a2 !== undefined && a2 !== null ? a2 : '').trim();
      if (s1 === '' && s2 === '') return '';
      const n1 = parseInt(s1, 10);
      const n2 = parseInt(s2, 10);
      const v1 = !isNaN(n1) ? n1 : 0;
      const v2 = !isNaN(n2) ? n2 : 0;
      return String(v1 + v2);
    };

    // 4. Filtrar alumnos activos
    const alumnos = cursoDatosPdf.students.filter(st => {
      const datos = (st.datosHojas && st.datosHojas.DATOS) || {};
      const oculto = String(obtenerValorCampo(datos, 'OCULTO') || '').toUpperCase();
      const estado = obtenerValorCampo(datos, 'ACTIVOS') !== undefined
        ? obtenerValorCampo(datos, 'ACTIVOS') : obtenerValorCampo(datos, 'ESTADO');
      const activo = estado === undefined || ['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(String(estado).toUpperCase());
      return !['SI', 'SÍ', 'TRUE'].includes(oculto) && activo;
    });

    const hayVaronesConV = alumnos.some(a => String(a.datosHojas?.DATOS?.SEXO || '').toUpperCase().trim() === 'V');

    // 5. Pre-calcular notas, inasistencias, conducta y promedio anual para cada alumno
    const alumnosCalculados = alumnos.map((st) => {
      const datosDatos = (st.datosHojas && st.datosHojas.DATOS) || {};
      const dni = String(st.dni || obtenerValorCampo(datosDatos, 'DNI') || '').trim();

      let apellido = String(obtenerValorCampo(datosDatos, 'APELLIDO') || '').trim();
      let nombre = String(obtenerValorCampo(datosDatos, 'NOMBRE') || '').trim();

      if (!apellido && st.nombreCompleto) {
        const partes = st.nombreCompleto.split(',');
        apellido = partes[0] ? partes[0].trim() : st.nombreCompleto;
        nombre = partes[1] ? partes[1].trim() : '';
      }

      const apellidoNombre = nombre ? `${apellido.toUpperCase()}, ${nombre}` : apellido.toUpperCase();

      // Datos del 1er y 2do cuatrimestre
      const dniLimpio = dni.replace(/[^0-9]/g, '');
      const cHermano = mapaCalifsHermano[dni] || mapaCalifsHermano[dniLimpio] || {};
      const c1 = esCursoActualSegundoCuatri ? cHermano : (st.datosHojas || {});
      const c2 = esCursoActualSegundoCuatri ? (st.datosHojas || {}) : cHermano;
      const cfg1 = esCursoActualSegundoCuatri ? sheetConfigsHermano : cursoDatosPdf.sheets;
      const cfg2 = esCursoActualSegundoCuatri ? cursoDatosPdf.sheets : sheetConfigsHermano;
      const order1 = esCursoActualSegundoCuatri ? sheetOrderHermano : cursoDatosPdf.sheetOrder;
      const order2 = esCursoActualSegundoCuatri ? cursoDatosPdf.sheetOrder : sheetOrderHermano;

      // 1. Lengua
      const p1Leng = obtenerPromedioMateria(c1, cfg1, order1, 'LENG', ['EXTRANJERA', 'PLANILLA']);
      const p2Leng = obtenerPromedioMateria(c2, cfg2, order2, 'LENG', ['EXTRANJERA', 'PLANILLA']);
      const resLeng = calcularNotaPromocionArea(p1Leng, p2Leng);

      // 2. Matemática
      const p1Mat = obtenerPromedioMateria(c1, cfg1, order1, 'MAT', ['PLANILLA']);
      const p2Mat = obtenerPromedioMateria(c2, cfg2, order2, 'MAT', ['PLANILLA']);
      const resMat = calcularNotaPromocionArea(p1Mat, p2Mat);

      // 3. Cs. Sociales
      const p1Soc = obtenerPromedioMateria(c1, cfg1, order1, 'SOCIAL', ['PLANILLA']);
      const p2Soc = obtenerPromedioMateria(c2, cfg2, order2, 'SOCIAL', ['PLANILLA']);
      const resSoc = calcularNotaPromocionArea(p1Soc, p2Soc);

      // 4. Cs. Naturales
      const p1Nat = obtenerPromedioMateria(c1, cfg1, order1, 'NATURAL', ['PLANILLA']);
      const p2Nat = obtenerPromedioMateria(c2, cfg2, order2, 'NATURAL', ['PLANILLA']);
      const resNat = calcularNotaPromocionArea(p1Nat, p2Nat);

      // 5. Ed. Física
      const p1Ef = obtenerNotaEspecial(c1, 'ED_FISICA');
      const p2Ef = obtenerNotaEspecial(c2, 'ED_FISICA');
      const resEf = calcularNotaPromocionArea(p1Ef, p2Ef);

      // 6. Ed. Artística
      const p1Art = obtenerNotaEspecial(c1, 'ED_ARTISTICA');
      const p2Art = obtenerNotaEspecial(c2, 'ED_ARTISTICA');
      const resArt = calcularNotaPromocionArea(p1Art, p2Art);

      // 7. Lengua Extranjera
      const p1Ing = obtenerNotaEspecial(c1, 'INGLES');
      const p2Ing = obtenerNotaEspecial(c2, 'INGLES');
      const resIng = calcularNotaPromocionArea(p1Ing, p2Ing);

      // Inasistencias (suma total de los 2 cuatrimestres)
      const j1 = obtenerInasistencia(c1, 'JUSTIFICADA');
      const j2 = obtenerInasistencia(c2, 'JUSTIFICADA');
      const asistJ = sumarInasistencias(j1, j2);

      const i1 = obtenerInasistencia(c1, 'INJUSTIFICADA');
      const i2 = obtenerInasistencia(c2, 'INJUSTIFICADA');
      const asistI = sumarInasistencias(i1, i2);

      const numJ = parseInt(asistJ, 10) || 0;
      const numI = parseInt(asistI, 10) || 0;
      const totalInasistencias = numJ + numI;

      // Conducta y Observaciones: La conducta corresponde estrictamente a la obtenida en el 2do Cuatrimestre
      const cond = obtenerInasistencia(c2, 'CONDUCTA') || obtenerInasistencia(c2, 'CONDICION') || '';
      const obs = obtenerInasistencia(c2, 'OBSERVACIONES') || obtenerInasistencia(c1, 'OBSERVACIONES') || (datosDatos.OBSERVACIONES || '');

      const condUpper = String(cond || '').toUpperCase().trim();
      let pesoConducta = 0;
      if (condUpper.includes('MB') || condUpper === 'MUY BUENO') pesoConducta = 3;
      else if (condUpper.includes('B') || condUpper === 'BUENO') pesoConducta = 2;
      else if (condUpper.includes('R') || condUpper === 'REGULAR') pesoConducta = 1;

      // Áreas evaluadas y conteo de materias desaprobadas (donde p1 < 6 o p2 < 6)
      const areasResultados = [resLeng, resMat, resSoc, resNat, resEf, resArt, resIng];
      const cantDesaprobadas = areasResultados.filter(a => a.desaprobada).length;

      // Notas que aparecen en la planilla de promoción
      const notasAreasValidas = areasResultados
        .map(a => a.nota)
        .filter(n => n !== '')
        .map(n => Number(String(n).replace(/,/g, '.')));

      // FÓRMULA OFICIAL 3: Promedio Anual (promedio de todas las áreas de la planilla de promoción truncado a 3 decimales)
      let promGeneral = '';
      let promAnualNum = -1;

      if (cantDesaprobadas === 0 && notasAreasValidas.length > 0) {
        const suma = notasAreasValidas.reduce((acc, curr) => acc + curr, 0);
        const prom = suma / notasAreasValidas.length;
        // Truncado a 3 decimales exactos
        promGeneral = (Math.trunc(prom * 1000 + 1e-9) / 1000).toFixed(3);
        promAnualNum = Math.trunc(prom * 1000 + 1e-9) / 1000;
      }

      // Clasificación por Sexo
      const sexoRaw = String(datosDatos.SEXO || '').toUpperCase().trim();
      let esVaron = false;
      if (sexoRaw === 'V' || sexoRaw === 'VARON' || sexoRaw === 'VARÓN') {
        esVaron = true;
      } else if (sexoRaw === 'F' || sexoRaw === 'FEMENINO') {
        esVaron = false;
      } else if (sexoRaw === 'M') {
        esVaron = !hayVaronesConV;
      }

      return {
        st,
        apellido,
        nombre,
        apellidoNombre,
        dni,
        notLeng: resLeng.nota,
        notMat: resMat.nota,
        notSoc: resSoc.nota,
        notNat: resNat.nota,
        notEf: resEf.nota,
        notArt: resArt.nota,
        notIng: resIng.nota,
        asistJ,
        asistI,
        totalInasistencias,
        cond,
        pesoConducta,
        promGeneral,
        promAnualNum,
        cantDesaprobadas,
        esVaron,
        obs
      };
    });

    // 6. Ordenar alumnos:
    // Los alumnos CON promedio anual van primero (ordenados por mérito: mayor promedio, inasistencias, conducta).
    // Los alumnos SIN promedio anual van al final, ordenados estrictamente por Apellido y Nombre.
    alumnosCalculados.sort((a, b) => {
      const aTieneProm = a.promAnualNum >= 0;
      const bTieneProm = b.promAnualNum >= 0;

      // 1. Los que tienen promedio anual van siempre antes que los que no tienen
      if (aTieneProm && !bTieneProm) return -1;
      if (!aTieneProm && bTieneProm) return 1;

      // 2. Si ambos tienen promedio anual: se ordenan por mérito
      if (aTieneProm && bTieneProm) {
        // Mayor Promedio Anual primero
        if (b.promAnualNum !== a.promAnualNum) {
          return b.promAnualNum - a.promAnualNum;
        }
        // Menor Inasistencia
        if (a.totalInasistencias !== b.totalInasistencias) {
          return a.totalInasistencias - b.totalInasistencias;
        }
        // Mejor Conducta (MB > B > R)
        if (a.pesoConducta !== b.pesoConducta) {
          return b.pesoConducta - a.pesoConducta;
        }
      }

      // 3. Alumnos SIN promedio anual (o empate total): ordenados estrictamente por Apellido y Nombre
      const compAp = (a.apellido || '').localeCompare(b.apellido || '', 'es', { sensitivity: 'base' });
      if (compAp !== 0) return compAp;
      return (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
    });

    // 7. Estadísticas de promoción
    let aprobadosV = 0, aprobadosM = 0;
    let compV = 0, compM = 0;
    let desapV = 0, desapM = 0;

    // 8. Construir filas de datos
    const minFilas = 30;
    const totalFilas = Math.max(minFilas, alumnosCalculados.length);
    const bodyRows = [];

    for (let i = 0; i < totalFilas; i++) {
      if (i < alumnosCalculados.length) {
        const al = alumnosCalculados[i];
        const numOrden = i + 1;

        if (al.cantDesaprobadas === 0) {
          if (al.esVaron) aprobadosV++; else aprobadosM++;
        } else if (al.cantDesaprobadas <= 2) {
          if (al.esVaron) compV++; else compM++;
        } else {
          if (al.esVaron) desapV++; else desapM++;
        }

        bodyRows.push([
          String(numOrden),
          al.apellidoNombre,
          al.notLeng,
          al.notMat,
          al.notSoc,
          al.notNat,
          al.notEf,
          al.notArt,
          al.notIng,
          al.asistJ,
          al.asistI,
          al.cond,
          al.promGeneral,
          al.obs
        ]);
      } else {
        // Fila en blanco numerada (preserva formato oficial de 30 renglones)
        bodyRows.push([
          String(i + 1),
          '', '', '', '', '', '', '', '', '', '', '', '', ''
        ]);
      }
    }

    // Totales estadísticos y porcentajes
    const aprobadosT = aprobadosV + aprobadosM;
    const compT = compV + compM;
    const desapT = desapV + desapM;
    const totalAlumnos = alumnos.length;

    const porcAprob = totalAlumnos > 0 ? (aprobadosT / totalAlumnos * 100).toFixed(1) + '%' : '0%';
    const porcComp = totalAlumnos > 0 ? (compT / totalAlumnos * 100).toFixed(1) + '%' : '0%';
    const porcDesap = totalAlumnos > 0 ? (desapT / totalAlumnos * 100).toFixed(1) + '%' : '0%';

    // 7. Estructura de Encabezados de Tabla Principal
    const filaHead1 = [
      { content: 'N°\nORDEN', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 6.5 } },
      { content: 'APELLIDO Y NOMBRE', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 7.5 } },
      { content: 'LENGUA', rowSpan: 2, rotated: true, title: 'LENGUA', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'MATEMÁTICA', rowSpan: 2, rotated: true, title: 'MATEMÁTICA', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'CS. SOCIALES', rowSpan: 2, rotated: true, title: 'CS. SOCIALES', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'CS. NATURALES', rowSpan: 2, rotated: true, title: 'CS. NATURALES', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'ED. FÍSICA', rowSpan: 2, rotated: true, title: 'ED. FÍSICA', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'ED. ARTÍSTICA', rowSpan: 2, rotated: true, title: 'ED. ARTÍSTICA', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'LENGUA EXTRANJERA', rowSpan: 2, rotated: true, title: 'LENGUA EXTRANJERA', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'INASIST.', colSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: 'COND.', rowSpan: 2, rotated: true, title: 'COND.', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'PROM. ANUAL', rowSpan: 2, rotated: true, title: 'PROM. ANUAL', styles: { halign: 'center', valign: 'bottom' } },
      { content: 'OBSERVACIONES', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 7.5 } }
    ];

    const filaHead2 = [
      { content: 'J', styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: 'I', styles: { halign: 'center', valign: 'middle', fontSize: 7 } }
    ];

    const columnStyles = {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 175, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 25, halign: 'center' },
      8: { cellWidth: 25, halign: 'center' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' },
      12: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      13: { cellWidth: 132, halign: 'left' }
    };

    // 8. Dibujar Tabla Principal
    doc.autoTable({
      head: [filaHead1, filaHead2],
      body: bodyRows,
      startY: 46,
      tableWidth: anchoDisponible,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 52
      },
      columnStyles: columnStyles,
      margin: { top: 46, left: margenLateral, right: margenLateral, bottom: 20 },
      didParseCell: function(data) {
        if (data.section === 'head') {
          if (data.cell.raw && data.cell.raw.rotated) {
            data.cell.text = [''];
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'head' && data.cell.raw && data.cell.raw.rotated) {
          const raw = data.cell.raw;
          const title = String(raw.title || raw.content || '');
          if (title) {
            doc.saveGraphicsState();
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            const x = data.cell.x + (data.cell.width / 2) + 2.2;
            const y = data.cell.y + data.cell.height - 4;
            doc.text(title, x, y, { angle: 90 });
            doc.restoreGraphicsState();
          }
        }
      }
    });

    // 9. Dibujar Cuadro de Resumen Estadístico (Footer Summary Table)
    const yCuadroResumen = doc.lastAutoTable.finalY + 12;
    const anchoResumen = 480;
    const xResumen = (pageWidth - anchoResumen) / 2;

    const headResumen1 = [
      { content: 'APROBADOS', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [245, 245, 245] } },
      { content: 'PERIODO COMPENSACIÓN', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [245, 245, 245] } },
      { content: 'DESAPROBADOS', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [245, 245, 245] } }
    ];

    const headResumen2 = [
      'V', 'M', 'T', '%',
      'V', 'M', 'T', '%',
      'V', 'M', 'T', '%'
    ];

    const bodyResumen = [
      [
        String(aprobadosV), String(aprobadosM), String(aprobadosT), porcAprob,
        String(compV), String(compM), String(compT), porcComp,
        String(desapV), String(desapM), String(desapT), porcDesap
      ]
    ];

    doc.autoTable({
      head: [headResumen1, headResumen2],
      body: bodyResumen,
      startY: yCuadroResumen,
      tableWidth: anchoResumen,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      margin: { left: xResumen, right: xResumen }
    });

    // 10. Bloque de Firmas y Fecha
    const yFirmas = doc.lastAutoTable.finalY + 36;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    // Firma Maestro (Izquierda)
    const xFirma1Inicio = margenLateral + 20;
    const xFirma1Fin = margenLateral + 210;
    doc.line(xFirma1Inicio, yFirmas, xFirma1Fin, yFirmas);
    doc.text('FIRMA Y ACLARACIÓN DEL MAESTRO', (xFirma1Inicio + xFirma1Fin) / 2, yFirmas + 11, { align: 'center' });
    doc.text('LUGAR Y FECHA: ............................................', xFirma1Inicio, yFirmas + 28);

    // Firma Director (Derecha)
    const xFirma2Inicio = pageWidth - margenLateral - 210;
    const xFirma2Fin = pageWidth - margenLateral - 20;
    doc.line(xFirma2Inicio, yFirmas, xFirma2Fin, yFirmas);
    doc.text('V° B° DIRECTOR', (xFirma2Inicio + xFirma2Fin) / 2, yFirmas + 11, { align: 'center' });

    // 11. Visualización instantánea en memoria
    const blobPdf = doc.output('blob');
    const blobUrl = URL.createObjectURL(blobPdf);

    if (ventanaVisor && !ventanaVisor.closed) {
      ventanaVisor.location.replace(blobUrl);
    } else {
      window.open(blobUrl, '_blank');
    }

    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }

    M.toast({ html: '✅ Planilla de promoción generada con éxito', classes: 'green darken-2' });
  } catch (errorGen) {
    console.error("Error generando planilla de promoción en memoria:", errorGen);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }
    M.toast({ html: '❌ Error: ' + (errorGen.message || errorGen), classes: 'red darken-3', displayLength: 6000 });
  }
}

function generarPdfCalificacionesDirecto(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaCarga) {
  const email = sessionStorage.getItem('misericordia_sesion') || '';
  const iconoOriginal = btnElement ? btnElement.innerHTML : '';
  
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="material-icons">hourglass_empty</i>';
  }

  const payload = {
    action: 'solicitarPdfHoja',
    payload: [currentSpreadsheetId, nombreHoja, orientacion, tamañoPapel, email, true],
    operationId: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
  };

  (async () => {
    let intentos = 0;
    let exito = false;
    let ultimoError = null;
    
    while (intentos < 3 && !exito) {
      try {
        // En lugar de usar el proxy (API_URL) que tiene timeout de 10s, 
        // disparamos directo a los nodos de Google (que permiten hasta 6 minutos).
        const nodoUrl = getRandomAppsScriptUrl(); 
        
        const response = await fetch(nodoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        
        const envelope = await response.json();
        const res = envelope && Object.prototype.hasOwnProperty.call(envelope, 'data') ? envelope.data : envelope;
        
        if (!res || !res.success || !res.pdfBase64) {
          throw new Error((res && (res.message || res.error)) || 'No se pudo generar el PDF en el servidor.');
        }
        
        const binarioPdf = atob(res.pdfBase64);
        const bytesPdf = new Uint8Array(binarioPdf.length);
        for (let i = 0; i < binarioPdf.length; i++) {
          bytesPdf[i] = binarioPdf.charCodeAt(i);
        }
        const blobPdf = new Blob([bytesPdf], { type: res.mimeType || 'application/pdf' });
        const urlPdfTemporal = URL.createObjectURL(blobPdf);
        
        if (ventanaCarga && !ventanaCarga.closed) {
          ventanaCarga.location.replace(urlPdfTemporal);
        } else {
          window.open(urlPdfTemporal, '_blank');
        }
        M.toast({ html: '✓ PDF listo para visualizar', classes: 'green' });
        exito = true;
      } catch (e) {
        ultimoError = e;
        intentos++;
        if (intentos < 3) {
          console.warn(`Intento ${intentos} fallido. Reintentando con otro nodo...`, e);
          M.toast({ html: `Fallo en un nodo. Reintentando (${intentos}/3)...`, classes: 'orange' });
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    if (!exito) {
      if (ventanaCarga && !ventanaCarga.closed) ventanaCarga.close();
      M.toast({ html: '❌ ' + (ultimoError.message || ultimoError), classes: 'red darken-3', displayLength: 6000 });
    }

    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }
  })();
}

function generarPdfEnServidorFallback(btnElement, nombreHoja, orientacion, tamañoPapel, ventanaCarga, abrirPdfDriveDirectamente = false) {
  const iconoOriginal = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="material-icons">hourglass_empty</i>';
  }

  const finalizarPdf = () => {
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = iconoOriginal;
    }
  };

  const mostrarErrorPdf = (mensaje) => {
    finalizarPdf();
    if (ventanaCarga && !ventanaCarga.closed) ventanaCarga.close();
    M.toast({ html: "❌ " + mensaje, classes: 'red darken-3', displayLength: 6000 });
  };

  const payload = {
    action: 'solicitarPdfHoja',
    payload: [
      currentSpreadsheetId,
      nombreHoja,
      orientacion,
      tamañoPapel,
      sessionStorage.getItem('misericordia_sesion') || '',
      true
    ]
  };

  fetchAppsScriptConReintento({
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }, undefined, API_URL)
    .then(response => response.json())
    .then(envelope => {
      const res = envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
        ? envelope.data
        : envelope;
              if (abrirPdfDriveDirectamente) {
                if (!res || !res.success || !res.fileId || !res.url) {
                  throw new Error((res && (res.message || res.error)) || 'No se recibió el PDF generado en Drive.');
                }
                const urlDrive = new URL(res.url);
                const patronArchivoDrive = /^\/file\/d\/([A-Za-z0-9_-]+)\/view\/?$/;
                const coincidenciaArchivo = urlDrive.pathname.match(patronArchivoDrive);
                if (urlDrive.origin !== 'https://drive.google.com' ||
                    !coincidenciaArchivo ||
                    coincidenciaArchivo[1] !== String(res.fileId)) {
                  throw new Error('Apps Script devolvió un enlace de Drive no válido.');
                }

                finalizarPdf();
                if (ventanaCarga && !ventanaCarga.closed) {
                  ventanaCarga.location.replace(urlDrive.href);
                } else {
                  window.open(urlDrive.href, '_blank');
                }
                M.toast({ html: '✓ PDF de Drive listo para visualizar', classes: 'green' });
                return;
              }
              if (!res || !res.success || !res.pdfBase64) {
          throw new Error((res && (res.message || res.error)) || 'No se pudo generar el PDF.');
        }

            const binarioPdf = atob(res.pdfBase64);
            const bytesPdf = Uint8Array.from(binarioPdf, caracter => caracter.charCodeAt(0));
            const blobPdf = new Blob([bytesPdf], { type: res.mimeType || 'application/pdf' });
            const urlPdfTemporal = URL.createObjectURL(blobPdf);
              finalizarPdf();
              if (ventanaCarga && !ventanaCarga.closed) {
                        ventanaCarga.location.replace(urlPdfTemporal);
              } else {
                        window.open(urlPdfTemporal, '_blank');
              }
            M.toast({ html: '✓ PDF listo para descargar o imprimir', classes: 'green' });
    })
    .catch(error => {
      mostrarErrorPdf('Fallo en la generación de respaldo: ' + (error.message || error));
    });
}

async function verBoletinDelAlumno() {
    const dni = document.getElementById('select-alumno')?.value; 
    if (!dni) {
        M.toast({html: 'Selecciona un alumno primero', classes: 'orange'});
        return;
    }

    const selectPlanilla = document.getElementById('select-planilla');
    const nombrePlanilla = String(window.currentPlanillaNombre || (selectPlanilla ? selectPlanilla.value : '') || '').trim();
    const infoPlanilla = extraerGradoYSeccionGlobal(nombrePlanilla);
    const grado = infoPlanilla.grado;
    const seccion = infoPlanilla.seccion;
    const esSegundo = infoPlanilla.esSegundoCuatri === 1;
    const cuatri = esSegundo ? '2º Cuat.' : '1º Cuat.';

    const btnPdf = document.getElementById('btn-generar-pdf-boletin');
    const textoOriginal = btnPdf ? btnPdf.innerHTML : '';
    if (btnPdf) btnPdf.innerHTML = '<i class="material-icons">hourglass_empty</i>';

    const ventanaCarga = window.open('pdf-loading.html?hoja=Bolet%C3%ADn%20Alumno', '_blank');

    try {
        // Generar el boletín en tiempo real con jsPDF desde Supabase para reflejar siempre las notas y reglas vigentes
        M.toast({html: '⏳ Generando boletín del alumno...', classes: 'blue darken-2', displayLength: 3000});

        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            throw new Error('La biblioteca jsPDF no está cargada.');
        }

        const datos = await obtenerDatosCompletosBoletines(grado, seccion, esSegundo, dni);
        if (!datos.alumnos || datos.alumnos.length === 0) {
            throw new Error(`No se encontraron calificaciones para el alumno DNI ${dni}.`);
        }

        const al = datos.alumnos[0];
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const formatoSeleccionado = (document.getElementById('select-formato-boletin')?.value) || 'sobreimpresion';
        const esDiptico = formatoSeleccionado === 'oficial_diptico';
        const esSobreimpresion = formatoSeleccionado === 'sobreimpresion';
        const escudoData = esSobreimpresion ? null : obtenerImagenEscudoBase64();

        // Dibujar libreta oficial
        dibujarPlantillaOficialLibreta(doc, al, escudoData, formatoSeleccionado, cuatri);
        if (esDiptico) {
            doc.addPage('a4', 'landscape');
            dibujarCaratulaExamenes(doc, al, escudoData);
        }

        // Formato exacto solicitado: Boletín_57063456_VAZQUEZ, BELLA MAILY.pdf
        const dniAlumno = String(al.dni || dni).trim();
        const apeAlumno = String(al.apellido || '').trim().toUpperCase();
        const nomAlumno = String(al.nombre || '').trim().toUpperCase();
        const nombreCompletoFormateado = (apeAlumno && nomAlumno)
            ? `${apeAlumno}, ${nomAlumno}`
            : (String(al.nombreCompleto || '').trim().toUpperCase() || 'ALUMNO');

        const nombrePdfAlumno = `Boletín_${dniAlumno}_${nombreCompletoFormateado}.pdf`;

        // Generar Blob para visualización inmediata en el navegador
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        if (btnPdf) btnPdf.innerHTML = textoOriginal;
        if (ventanaCarga && !ventanaCarga.closed) {
            ventanaCarga.location.replace(blobUrl);
        } else {
            window.open(blobUrl, '_blank');
        }

        M.toast({html: `✓ Visualizando boletín de ${nombreCompletoFormateado}`, classes: 'green darken-2'});

        // 3. Subir en segundo plano a Google Drive con el nombre requerido
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        sendRequestToServer('guardarBoletinPdfDrive', {
            grado,
            seccion,
            cuatri,
            nombreArchivo: nombrePdfAlumno,
            pdfBase64,
            dni: al.dni,
            spreadsheetId: datos.spreadsheetId || currentSpreadsheetId
        }).then(r => {
            console.log('[VerBoletin] Guardado en Google Drive en segundo plano:', r);
        }).catch(err => {
            console.warn('[VerBoletin] No se pudo sincronizar con Drive:', err);
        });

    } catch (error) {
        if (btnPdf) btnPdf.innerHTML = textoOriginal;
        if (ventanaCarga && !ventanaCarga.closed) ventanaCarga.close();
        const msg = error && error.message ? error.message : String(error);
        console.error('Error visualizando boletín:', error);
        M.toast({html: '❌ ' + msg, classes: 'red darken-3', displayLength: 6000});
    }
}

function aplicarEstadoInactivoVisual() {
    const contenidoHojas = document.getElementById('contenido-hojas');
    if (!contenidoHojas) return;

    let estaActivo = true;
    let btnOcultar = null;

    let cbActivo = document.querySelector('input[type="checkbox"][data-header-name="ACTIVOS"]') || 
                   document.querySelector('input[type="checkbox"][data-header-name="ESTADO"]');

    if (cbActivo) {
        estaActivo = cbActivo.checked;
        btnOcultar = document.getElementById(`btn-ocultar-${cbActivo.id}`);
    } else {
        const selectAlumno = document.getElementById('select-alumno');
        const dniActual = selectAlumno ? selectAlumno.value : null;

        if (typeof cursoCompleto !== 'undefined' && cursoCompleto && dniActual) {
            const estudiante = studentsByDni.get(String(dniActual));
            if (estudiante) {
                const datos = estudiante.datosHojas["DATOS"] || {};
                if (datos.hasOwnProperty("ACTIVOS")) {
                    const val = String(datos["ACTIVOS"]).toUpperCase().trim();
                    estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
                } else if (datos.hasOwnProperty("ESTADO")) {
                    const val = String(datos["ESTADO"]).toUpperCase().trim();
                    estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
                }
            }
        }
    }

    if (!estaActivo) {
        contenidoHojas.style.backgroundColor = '#bdbdbd';
        contenidoHojas.style.border = '2px solid #757575';
        if (btnOcultar) btnOcultar.disabled = false; 

        document.querySelectorAll('.form-input-editable').forEach(input => {
            if (input.type !== 'checkbox') {
                input.disabled = true;
                input.style.color = '#616161';
                input.style.borderBottom = '1px dashed #757575';
            }
        });
    } else {
        contenidoHojas.style.backgroundColor = '';
        contenidoHojas.style.border = '';
        if (btnOcultar) btnOcultar.disabled = true; 

        document.querySelectorAll('.form-input-editable').forEach(input => {
            if (input.type !== 'checkbox') {
                input.disabled = false;
                input.style.color = '';
                input.style.borderBottom = '';
            }
        });
    }
}

function actualizarContadorSidebar() {
    const select = document.getElementById('select-alumno');
    const divContador = document.getElementById('contador-alumnos-sidebar');
    if (!select || !divContador || !cursoCompleto) return;

    if (esPlanillaEspecialSeleccionada()) {
        const filasGrilla = document.querySelectorAll('.esp-grid tbody tr').length;
        const textoGrilla = document.getElementById('esp-grid-total-alumnos');
        if (textoGrilla) textoGrilla.textContent = `${filasGrilla} alumnos`;

        const textoTotalEspecial = divContador.querySelector('#texto-total-alumnos');
        if (textoTotalEspecial) {
            textoTotalEspecial.textContent = `Total: ${filasGrilla} alumnos`;
        } else {
            divContador.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 10px; width: 100%;">
                    <i class="material-icons" style="color: #757575;">group</i>
                    <span id="texto-total-alumnos">Total: ${filasGrilla} alumnos</span>
                </span>
            `;
        }
        return;
    }
    
    let cantidadActivos = 0;
    const dniActual = window.dniAlumnoActual;
    
    const cbDOM = document.querySelector('input[type="checkbox"][data-header-name="ACTIVOS"]') || 
                  document.querySelector('input[type="checkbox"][data-header-name="ESTADO"]');

    for (let i = 0; i < select.options.length; i++) {
        const dni = select.options[i].value;
        if (dni === "") continue; 

        if (dni === dniActual && cbDOM) {
            if (cbDOM.checked) cantidadActivos++;
        } else {
            const estudiante = studentsByDni.get(String(dni));
            if (estudiante) {
                const datos = estudiante.datosHojas["DATOS"] || {};
                
                const valorOculto = String(datos["OCULTO"] || "").toUpperCase().trim();
                const estaOculto = (valorOculto === "SÍ" || valorOculto === "SI" || valorOculto === "TRUE");
                if (estaOculto) continue;
                
                let estaActivo = true;
                if (datos.hasOwnProperty("ACTIVOS")) {
                    const val = String(datos["ACTIVOS"]).toUpperCase().trim();
                    estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
                } else if (datos.hasOwnProperty("ESTADO")) {
                    const val = String(datos["ESTADO"]).toUpperCase().trim();
                    estaActivo = (val === 'TRUE' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === '1');
                }
                
                if (estaActivo) cantidadActivos++;
            }
        }
    }

    // Solo actualizamos el texto si existe el span interior (caso normal), si no, reescribimos manteniendo la estructura
    const textoTotal = divContador.querySelector('#texto-total-alumnos');
    if (textoTotal) {
        textoTotal.textContent = `Total: ${cantidadActivos} alumnos`;
    } else {
        divContador.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 10px; width: 100%;">
                <i class="material-icons" style="color: #757575;">group</i>
                <span>Total: ${cantidadActivos} alumnos</span>
            </span>
        `;
    }
}

function eliminarAlumnoUI(idCheckbox) {
    if(!confirm("¿Seguro que deseas ocultar a este alumno? Ya no aparecerá en la lista al recargar la página.")) return;

    btnGuardar.textContent = 'Ocultando...';
    window.forzarColumnaOculto = true;
    if (typeof hojasModificadasDelAlumno !== 'undefined') {
        hojasModificadasDelAlumno.add("DATOS");
    }

    ejecutarGuardadoLote(() => {
        const select = document.getElementById('select-alumno');
        const dniActual = window.dniAlumnoActual; 
        let nextIndex = select.selectedIndex;
        const option = select.querySelector(`option[value="${dniActual}"]`);
        
        if(option) option.remove();
        habilitarSelect(select, true);

        if (select.options.length > 1) {
            if (nextIndex >= select.options.length) nextIndex = select.options.length - 1;
            if (nextIndex < 1) nextIndex = 1;
            select.selectedIndex = nextIndex;
            select.dispatchEvent(new Event('change')); 
            setTimeout(() => { actualizarContadorSidebar(); }, 400);
        } else {
            limpiarFormularioCompleto();
            M.toast({html: 'No hay más alumnos en esta lista', classes: 'blue'});
        }
        M.toast({html: '🗑️ Alumno ocultado definitivamente de la vista', classes: 'grey darken-3'});
    });
}

function inicializarPanelAuditoriaVisual(formDiv) {
  formDiv.innerHTML = `
    <div class="row" style="margin-bottom: 0;">
      <div class="col s12">
        <h5 style="color: #1565c0; font-weight: bold; margin-bottom: 20px; font-size: 1.5rem;">Historial de Auditoría</h5>
        <div class="row" style="margin-bottom: 10px;">
          <div class="input-field col s12 m6">
            <i class="material-icons prefix">search</i>
            <input type="text" id="buscar-auditoria-planilla" placeholder="Escribe el nombre...">
            <label for="buscar-auditoria-planilla" class="active">Buscar por Planilla</label>
          </div>
          <div class="input-field col s12 m6">
            <i class="material-icons prefix">date_range</i>
            <input type="date" id="buscar-auditoria-fecha">
            <label for="buscar-auditoria-fecha" class="active">Filtrar por Fecha</label>
          </div>
        </div>
      </div>
      <div class="col s12 auditoria-scroll-x" style="max-height: 450px; overflow-y: auto; padding: 0;">
        <table class="striped highlight auditoria-table">
          <thead>
            <tr style="background-color: #1565c0; color: white;">
              <th style="padding: 10px; font-size:0.85rem; min-width: 140px;">Fecha / Hora</th>
              <th style="font-size:0.85rem; min-width: 180px;">Usuario</th>
              <th style="font-size:0.85rem; min-width: 180px;">Planilla</th>
              <th style="font-size:0.85rem; min-width: 130px;">Hoja</th>
              <th style="font-size:0.85rem; min-width: 90px;">DNI</th>
              <th style="font-size:0.85rem; min-width: 300px;">Cambios Realizados</th>
            </tr>
          </thead>
          <tbody id="tabla-logs-cuerpo">
            <tr><td colspan="6" class="center-align">Conectando con Supabase...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="col s12" style="margin-top: 15px; background: #e3f2fd; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px;">
        <button id="btn-prev-page" class="btn-small blue darken-2 waves-effect waves-light" disabled><i class="material-icons">chevron_left</i></button>
        <span id="page-indicator" style="font-weight: bold; color: #1565c0; text-align: center;">Cargando...</span>
        <button id="btn-next-page" class="btn-small blue darken-2 waves-effect waves-light" disabled><i class="material-icons">chevron_right</i></button>
      </div>
    </div>
  `;
  
  // Verificar permiso admin en cliente antes de solicitar logs
  if (!window.esUsuarioAdmin) {
    const tbody = document.getElementById('tabla-logs-cuerpo');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="center-align red-text">Acceso denegado: requiere superusuario.</td></tr>';
    document.getElementById('page-indicator').textContent = "0 registros";
    return;
  }
  // Server-side pagination: request one page at a time.
  const email = sessionStorage.getItem('misericordia_sesion') || '';
  const pageSize = Number(window.AUDIT_PAGE_SIZE || AUDIT_PAGE_SIZE || 50);
  window.AUDIT_PAGE_SIZE = pageSize;

  // local cache of pages: {1: [...], 2: [...]}
  window.auditPages = window.auditPages || {};
  window.auditNextTokens = window.auditNextTokens || {};
  window.currentAuditPage = 1;

  function renderAuditPage(logs, pageIndex, hasNext) {
    const tbody = document.getElementById('tabla-logs-cuerpo');
        const registrosValidos = Array.isArray(logs) ? logs.map(log => {
            if (!log || typeof log !== 'object') return null;
            const fechaValor = log.fecha_hora || log.fecha || log.timestamp || '';
            const fecha = typeof fechaValor === 'number' ? new Date(fechaValor) : new Date(String(fechaValor));
            const usuario = String(log.usuario || log.email || log.userEmail || 'Usuario desconocido').trim();
            return !isNaN(fecha.getTime()) ? Object.assign({}, log, {
                usuario: usuario,
                fecha_hora: fecha.toISOString()
            }) : null;
        }).filter(Boolean) : [];

    // 🚀 CORRECCIÓN: Forzar ordenamiento visual cronológico estricto (Más reciente primero)
    registrosValidos.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

    if (registrosValidos.length === 0) {
            const mensajeVacio = Array.isArray(logs) && logs.length > 0
                ? 'Los registros recibidos no tienen una fecha válida.'
                : 'No hay registros de auditoría.';
            tbody.innerHTML = `<tr><td colspan="6" class="center-align" style="color: #666;">${mensajeVacio}</td></tr>`;
      document.getElementById('page-indicator').textContent = `Página ${pageIndex} (0 registros)`;
      document.getElementById('btn-prev-page').disabled = pageIndex === 1;
      document.getElementById('btn-next-page').disabled = !hasNext;
      return;
    }

    // apply client-side filters (search and date) only to current page
    const terminoPlanilla = document.getElementById('buscar-auditoria-planilla').value.toUpperCase().trim();
    const terminoFecha = document.getElementById('buscar-auditoria-fecha').value;

    const filtered = registrosValidos.filter(log => {
      const textoBusqueda = String((log.nombre_planilla || '') + ' ' + (log.usuario || '') + ' ' + (log.hoja || '') + ' ' + (log.dni_alumno || '') + ' ' + (log.cambios || '')).toUpperCase();
      let coincidePlanilla = true;
      if (terminoPlanilla.length > 0) {
        coincidePlanilla = textoBusqueda.includes(terminoPlanilla);
      }

      let coincideFecha = true;
      if (terminoFecha && log.fecha_hora) {
                const fechaLog = new Date(log.fecha_hora).toISOString().split('T')[0];
        coincideFecha = fechaLog === terminoFecha;
      } else if (terminoFecha && !log.fecha_hora) {
        coincideFecha = false;
      }

      return coincidePlanilla && coincideFecha;
    });

    let html = '';
    filtered.forEach(log => {
      let fechaStr = log.fecha_hora ? new Date(log.fecha_hora).toLocaleString('es-AR') : '-';
      let nombrePlanilla = log.nombre_planilla || (log.planilla_id ? `ID: ${log.planilla_id}` : '-');
      let cambiosLimpio = typeof window.limpiarTextoCambiosAuditoria === 'function'
        ? window.limpiarTextoCambiosAuditoria(log.cambios)
        : String(log.cambios || '-').split('\n@@SNAPSHOT@@')[0];
      let dniSolo = String(log.dni_alumno || '').split(' ')[0].trim();

      html += `
        <tr>
          <td style="font-size: 0.85rem; white-space: nowrap; padding: 8px;">${fechaStr}</td>
          <td style="font-size: 0.85rem;">${log.usuario || '-'}</td>
          <td style="font-size: 0.85rem; font-weight: 600; color: #1565c0;">${nombrePlanilla}</td>
          <td><span class="chip blue lighten-5 blue-text" style="height: 20px; line-height: 20px; margin: 0; font-size:0.8rem;">${log.hoja || '-'}</span></td>
          <td style="font-size: 0.85rem;">
            ${dniSolo && dniSolo !== '-' ? `<a href="javascript:void(0)" onclick="window.abrirHistorialAlumnoPorDni && window.abrirHistorialAlumnoPorDni('${dniSolo}', '${String(nombrePlanilla).replace(/'/g, "\\'")}')" style="font-weight:700; color:#4527a0; text-decoration:underline;" title="Abrir historial y restaurar notas de este alumno">${log.dni_alumno}</a>` : (log.dni_alumno || '-')}
          </td>
          <td style="font-size: 0.85rem; max-width: 350px; word-wrap: break-word; color: #e65100; font-family: monospace;">${cambiosLimpio || '-'}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    document.getElementById('page-indicator').textContent = `Página ${pageIndex} (${filtered.length} registros)`;
    document.getElementById('btn-prev-page').disabled = pageIndex === 1;
    document.getElementById('btn-next-page').disabled = !hasNext;
  }

  async function loadAuditPage(pageIndex) {
    const emailLocal = email;
    const safePageSize = Number(window.AUDIT_PAGE_SIZE || AUDIT_PAGE_SIZE || 50);
    if (!emailLocal) {
      const tbody = document.getElementById('tabla-logs-cuerpo');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="center-align red-text">Acceso denegado: requiere superusuario.</td></tr>';
      const pageInd = document.getElementById('page-indicator');
      if (pageInd) pageInd.textContent = "0 registros";
      return;
    }

    // Si ya tenemos la página en caché, renderizar de inmediato
    if (window.auditPages[pageIndex]) {
      const hasNext = !!window.auditNextTokens[pageIndex];
      renderAuditPage(window.auditPages[pageIndex], pageIndex, hasNext);
      window.currentAuditPage = pageIndex;
      return;
    }

    const tbody = document.getElementById('tabla-logs-cuerpo');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="center-align">Cargando registros desde Supabase...</td></tr>';

    try {
      const desde = (pageIndex - 1) * safePageSize;
      const hasta = desde + safePageSize - 1;

      let logs = [];
      let totalCount = 0;
      let tieneMas = false;

      // 1. Intentar consultar la tabla dedicada 'auditoria' en la base de datos de auditoría
      let consultaAuditoria = await getAuditSupabaseClient()
        .from('auditoria')
        .select('*', { count: 'exact' })
        .order('fecha_hora', { ascending: false })
        .range(desde, hasta);

      if (!consultaAuditoria.error && Array.isArray(consultaAuditoria.data) && consultaAuditoria.data.length > 0) {
        logs = consultaAuditoria.data.map(log => ({
          idRegistro: log.id,
          fecha_hora: log.fecha_hora || log.created_at,
          usuario: log.usuario || 'Usuario desconocido',
          planilla_id: log.planilla_id || '',
          nombre_planilla: log.nombre_planilla || '',
          hoja: log.hoja || '-',
          dni_alumno: log.dni_alumno || '-',
          cambios: log.cambios || 'Sin detalle de cambios'
        }));
        totalCount = consultaAuditoria.count || logs.length;
        tieneMas = hasta + 1 < totalCount;
      } else {
        // 2. Fallback: Si 'auditoria' aún no se creó o está vacía, consultar últimas actualizaciones de 'calificaciones'
        const consultaCalif = await supabaseClient
          .from('calificaciones')
          .select('id, planilla_id, alumno_dni, nombre_hoja, updated_by, updated_at, planillas(nombre, spreadsheet_id), alumnos(apellido, nombre)', { count: 'exact' })
          .not('updated_at', 'is', null)
          .order('updated_at', { ascending: false })
          .range(desde, hasta);

        if (!consultaCalif.error && Array.isArray(consultaCalif.data) && consultaCalif.data.length > 0) {
          logs = consultaCalif.data.map(item => {
            const nomPlanilla = (item.planillas && item.planillas.nombre)
              ? item.planillas.nombre
              : (item.planilla_id ? `Planilla ID: ${item.planilla_id}` : '-');
            const nomAlumno = (item.alumnos && (item.alumnos.apellido || item.alumnos.nombre))
              ? `${item.alumnos.apellido || ''}, ${item.alumnos.nombre || ''}`.trim()
              : '';
            const spId = (item.planillas && item.planillas.spreadsheet_id)
              ? item.planillas.spreadsheet_id
              : item.planilla_id;
            return {
              idRegistro: item.id,
              fecha_hora: item.updated_at,
              usuario: item.updated_by || 'Sistema',
              planilla_id: spId,
              nombre_planilla: nomPlanilla,
              hoja: item.nombre_hoja || '-',
              dni_alumno: item.alumno_dni + (nomAlumno ? ` (${nomAlumno})` : ''),
              cambios: 'Calificaciones registradas / actualizadas en Supabase'
            };
          });
          totalCount = consultaCalif.count || logs.length;
          tieneMas = hasta + 1 < totalCount;
        } else if (consultaAuditoria.error && consultaCalif.error) {
          throw new Error(consultaAuditoria.error.message || consultaCalif.error.message);
        }
      }

      window.auditPages[pageIndex] = logs;
      window.auditNextTokens[pageIndex] = tieneMas ? 'page_' + (pageIndex + 1) : null;
      window.currentAuditPage = pageIndex;

      renderAuditPage(logs, pageIndex, tieneMas);
    } catch (err) {
      console.error('[Supabase] Error cargando auditoría:', err);
      const msjReal = err && err.message ? err.message : String(err);
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="center-align red-text">Error al cargar registros: ${msjReal}</td></tr>`;
      const pageInd = document.getElementById('page-indicator');
      if (pageInd) pageInd.textContent = "0 registros";
    }
  }

  // initialize page 1
  loadAuditPage(1);

  // wire search and date inputs to re-render current page with filters
  document.getElementById('buscar-auditoria-planilla').addEventListener('input', function() { renderAuditPage(window.auditPages[window.currentAuditPage] || [], window.currentAuditPage, !!window.auditNextTokens[window.currentAuditPage]); });
  document.getElementById('buscar-auditoria-fecha').addEventListener('change', function() { renderAuditPage(window.auditPages[window.currentAuditPage] || [], window.currentAuditPage, !!window.auditNextTokens[window.currentAuditPage]); });

  document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (window.currentAuditPage > 1) loadAuditPage(window.currentAuditPage - 1);
  });

  document.getElementById('btn-next-page').addEventListener('click', () => {
    loadAuditPage(window.currentAuditPage + 1);
  });
}



function renderizarPaginaActual() {
  const tbody = document.getElementById('tabla-logs-cuerpo');
  const itemsPerPage = 50;
  const totalItems = window.filteredLogs.length;

  if (totalItems === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="center-align">No hay registros que coincidan con la búsqueda.</td></tr>';
    document.getElementById('page-indicator').textContent = "Página 0 de 0 (0 registros)";
    document.getElementById('btn-prev-page').disabled = true;
    document.getElementById('btn-next-page').disabled = true;
    return;
  }

  const maxPage = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (window.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageLogs = window.filteredLogs.slice(startIndex, endIndex);

  let html = "";
  pageLogs.forEach(log => {
    let fechaStr = log.fecha_hora ? new Date(log.fecha_hora).toLocaleString('es-AR') : "-";
    let nombrePlanilla = log.nombre_planilla || (log.planilla_id ? `ID: ${log.planilla_id}` : '-');
    let cambiosLimpio = typeof window.limpiarTextoCambiosAuditoria === 'function'
      ? window.limpiarTextoCambiosAuditoria(log.cambios)
      : String(log.cambios || '-').split('\n@@SNAPSHOT@@')[0];

    html += `
      <tr>
        <td style="font-size: 0.85rem; white-space: nowrap; padding: 8px;">${fechaStr}</td>
        <td style="font-size: 0.85rem;">${log.usuario || "-"}</td>
        <td style="font-size: 0.85rem; font-weight: 600; color: #1565c0;">${nombrePlanilla}</td>
        <td><span class="chip blue lighten-5 blue-text" style="height: 20px; line-height: 20px; margin: 0; font-size:0.8rem;">${log.hoja || "-"}</span></td>
        <td style="font-size: 0.85rem;">${log.dni_alumno || "-"}</td>
        <td style="font-size: 0.85rem; max-width: 350px; word-wrap: break-word; color: #e65100; font-family: monospace;">${cambiosLimpio || "-"}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;

  document.getElementById('page-indicator').textContent = `Página ${window.currentPage} de ${maxPage} (${totalItems} registros)`;
  document.getElementById('btn-prev-page').disabled = window.currentPage === 1;
  document.getElementById('btn-next-page').disabled = window.currentPage === maxPage;
}

function obtenerNombreHojaBoletin() {
    if (typeof cursoCompleto !== 'undefined' && cursoCompleto && cursoCompleto.sheets) {
        for (const nombreHoja in cursoCompleto.sheets) {
            if (String(nombreHoja).toUpperCase().includes("BOLETIN")) return nombreHoja;
        }
    }
    return null;
}

function actualizarBoletinDesdeDOM(hojaActiva = null) {
    const hojaSolicitada = hojaActiva || selectHoja.value;
    const hoja = hojaSolicitada && hojaSolicitada.toUpperCase().includes("BOLETIN")
        ? hojaSolicitada
        : obtenerNombreHojaBoletin();
    if (!hoja) return;

    const formBoletin = document.getElementById(`form-${hoja.replace(/\s+/g, '_')}`);
    if (!formBoletin) return;

    const inputsBoletin = formBoletin.querySelectorAll('input[data-header-name], select[data-header-name]');
    const alumnoActual = cursoCompleto && cursoCompleto.students
        ? (studentsByDni.get(String(selectAlumno.value)) || null)
        : null;

    // Usar los datos ya cargados del curso aunque la hoja de origen todavía no
    // haya sido renderizada en el DOM.
    const datosOrigenRapidos = [];
    if (alumnoActual && alumnoActual.datosHojas) {
        Object.keys(alumnoActual.datosHojas).forEach(nombreHoja => {
            const nombreHojaUpper = String(nombreHoja).toUpperCase();
            if (nombreHojaUpper.includes("DATOS") ||
                nombreHojaUpper.includes("AUDITORIA") ||
                nombreHojaUpper.includes("BOLETIN")) return;

            const datosHoja = alumnoActual.datosHojas[nombreHoja] || {};
            Object.keys(datosHoja).forEach(header => {
                const valor = String(datosHoja[header] ?? '').trim();
                if (!valor && !String(header).toUpperCase().includes('PROM')) return;
                if (String(header).startsWith('_')) return;
                datosOrigenRapidos.push({
                    formOrigen: nombreHojaUpper,
                    headerOrigen: String(header).toUpperCase(),
                    valor
                });
            });
        });
    }

    // Los valores del DOM tienen prioridad porque pueden contener una nota
    // modificada aún no guardada.
    const todosLosElementosDOM = document.querySelectorAll('.form-container-interno:not([id*=BOLETIN]):not([id*=AUDITORIA]) input[data-header-name], .form-container-interno:not([id*=BOLETIN]):not([id*=AUDITORIA]) select[data-header-name]');
    todosLosElementosDOM.forEach(elemento => {
        const contenedor = elemento.closest('.form-container-interno');
        if (!contenedor) return;
        const valor = String(elemento.value ?? '').trim();
        // Solo almacenar si hay un valor, para hacer la búsqueda más rápida
        const headerDOM = (elemento.getAttribute('data-header-name') || '').toUpperCase();
        if (!valor && !headerDOM.includes('PROM')) return;
        datosOrigenRapidos.push({
            formOrigen: contenedor.id.toUpperCase(),
            headerOrigen: headerDOM,
            valor
        });
    });

    let selectsActualizados = false;
    inputsBoletin.forEach(inputBol => {
        const headerBol = (inputBol.getAttribute('data-header-name') || "").toUpperCase();
        let valorEncontrado = null;
        const debeSincronizar = headerBol.includes("PROM") ||
            headerBol.includes("FINAL") ||
            headerBol === "LENGUA" ||
            headerBol.includes("MATEMÁTICA") ||
            headerBol.includes("MATEMATICA") ||
            headerBol.includes("SOCIALES") ||
            headerBol.includes("NATURALES") ||
            headerBol.includes("TECNOLOGIA") ||
            headerBol.includes("TEGNOLOGIA") ||
            headerBol.includes("ARTÍSTICA") ||
            headerBol.includes("ARTISTICA") ||
            headerBol.includes("FÍSICA") ||
            headerBol.includes("FISICA") ||
            headerBol.includes("EXTRANJERA") ||
            headerBol.includes("INGLÉS") ||
            headerBol.includes("INGLES") ||
            headerBol.includes("CONDUCTA") ||
            headerBol.includes("INJUSTIFICA") ||
            (headerBol.includes("JUSTIFICA") && !headerBol.includes("INJUSTIFICA"));

        for (const origen of datosOrigenRapidos) {
            if (origen.formOrigen.includes("DATOS") || origen.formOrigen.includes("AUDITORIA") || origen.formOrigen.includes("BOLETIN")) continue;

            if (headerBol === "LENGUA" && origen.formOrigen.includes("LENG") && !origen.formOrigen.includes("EXTRANJERA")) {
                if (origen.headerOrigen.includes("PROM") || origen.headerOrigen.includes("FINAL") || origen.headerOrigen.includes("TOTAL") || origen.headerOrigen.includes("CALIFIC")) {
                    valorEncontrado = origen.valor; 
                }
            }
            else if ((headerBol.includes("MATEMÁTICA") || headerBol.includes("MATEMATICA")) && origen.formOrigen.includes("MAT")) {
                if (origen.headerOrigen.includes("PROM") || origen.headerOrigen.includes("FINAL") || origen.headerOrigen.includes("TOTAL") || origen.headerOrigen.includes("CALIFIC")) {
                    valorEncontrado = origen.valor;
                }
            }
            else if (headerBol.includes("SOCIALES") && origen.formOrigen.includes("SOCIALES")) {
                if (origen.headerOrigen.includes("PROM") || origen.headerOrigen.includes("FINAL") || origen.headerOrigen.includes("TOTAL") || origen.headerOrigen.includes("CALIFIC")) {
                    valorEncontrado = origen.valor;
                }
            }
            else if ((headerBol.includes("NATURALES") || headerBol.includes("TECNOLOGIA") || headerBol.includes("TEGNOLOGIA")) && origen.formOrigen.includes("NATURALES")) {
                if (origen.headerOrigen.includes("PROM") || origen.headerOrigen.includes("FINAL") || origen.headerOrigen.includes("TOTAL") || origen.headerOrigen.includes("CALIFIC")) {
                    valorEncontrado = origen.valor;
                }
            }
            else if (origen.formOrigen.includes("ESPECIALES")) {
                let headerLimpio = origen.headerOrigen.replace(/Á/g, "A").replace(/É/g, "E").replace(/Í/g, "I").replace(/Ó/g, "O").replace(/Ú/g, "U");
                if ((headerBol.includes("ARTÍSTICA") || headerBol.includes("ARTISTICA")) &&
                    (headerLimpio.includes("ARTISTICA") || headerLimpio.includes("MUSICA") || headerLimpio.includes("PLASTICA"))) {
                    valorEncontrado = origen.valor;
                }
                else if ((headerBol.includes("FÍSICA") || headerBol.includes("FISICA")) && headerLimpio.includes("FISICA")) {
                    valorEncontrado = origen.valor;
                }
                else if ((headerBol.includes("EXTRANJERA") || headerBol.includes("INGLÉS") || headerBol.includes("INGLES")) &&
                    (headerLimpio.includes("EXTRANJERA") || headerLimpio.includes("INGLES"))) {
                    valorEncontrado = origen.valor;
                }
            }
            else if (origen.formOrigen.includes("ASISTENCIA") || origen.formOrigen.includes("CONDUCTA")) {
                if (headerBol.includes("CONDUCTA") && origen.headerOrigen.includes("CONDUCTA")) {
                    valorEncontrado = origen.valor;
                }
                else if (headerBol.includes("INJUSTIFICA") && origen.headerOrigen.includes("INJUSTIFICA")) {
                    valorEncontrado = origen.valor;
                }
                else if (headerBol.includes("JUSTIFICA") && !headerBol.includes("INJUSTIFICA") && origen.headerOrigen.includes("JUSTIFICA") && !origen.headerOrigen.includes("INJUSTIFICA")) {
                    valorEncontrado = origen.valor;
                }
            }
        }

        if (debeSincronizar && alumnoActual) {
            // Resolver de nuevo desde el origen evita conservar promedios viejos en memoria.
            valorEncontrado = obtenerValorBoletinDesdeDatosFuente(alumnoActual, headerBol);
        }

        if (debeSincronizar) {
            const valorAnterior = inputBol.value;
            const esPromedioBoletin = headerBol.includes('PROM') || headerBol.includes('FINAL');
            if (esPromedioBoletin) {
                // Se recalcula al final de todas las materias
            } else {
                if (valorEncontrado === null) {
                    // Fallback a cálculo desde alumno si la hoja aún no se renderizó en DOM
                    if (alumnoActual) {
                        const fallbackVal = obtenerValorBoletinDesdeDatosFuente(alumnoActual, headerBol);
                        valorEncontrado = (fallbackVal !== null && fallbackVal !== undefined) ? fallbackVal : "";
                    }
                }
                inputBol.value = (valorEncontrado !== null && valorEncontrado !== undefined) ? valorEncontrado : '';
            }
            inputBol.style.fontWeight = inputBol.value ? 'bold' : 'normal';
            inputBol.style.color = inputBol.value ? '#2e7d32' : 'inherit';
            if (inputBol.tagName === 'SELECT' && valorAnterior !== inputBol.value) selectsActualizados = true;

            // Sincronizar también en el modelo en memoria del alumno
            if (alumnoActual && alumnoActual.datosHojas && alumnoActual.datosHojas[hoja]) {
                const headerNameOriginal = inputBol.getAttribute('data-header-name');
                if (headerNameOriginal) {
                    alumnoActual.datosHojas[hoja][headerNameOriginal] = inputBol.value;
                }
            }
        }
    });

    // Recalcular promedios generales del boletín tras actualizar todas las materias
    inputsBoletin.forEach(inputBol => {
        const headerBol = (inputBol.getAttribute('data-header-name') || "").toUpperCase();
        if (headerBol.includes('PROM') || headerBol.includes('FINAL')) {
            const promBol = calcularPromedioBoletinDesdeCampos(inputsBoletin);
            inputBol.value = promBol;
            inputBol.style.fontWeight = promBol ? 'bold' : 'normal';
            inputBol.style.color = promBol ? '#2e7d32' : 'inherit';
            if (alumnoActual && alumnoActual.datosHojas && alumnoActual.datosHojas[hoja]) {
                const headerNameOriginal = inputBol.getAttribute('data-header-name');
                if (headerNameOriginal) {
                    alumnoActual.datosHojas[hoja][headerNameOriginal] = promBol;
                }
            }
        }
    });

    if (selectsActualizados) {
        M.FormSelect.init(formBoletin.querySelectorAll('select'));
    }
    M.updateTextFields();
    actualizarEstadoHojasSidebar();
}

let chartsReady = false;
window.dashboardLoading = false;
window.dashboardRequestId = null;
window.dashboardCompletedRequestId = null;

function visualizarDashboard() {
    if (!currentSpreadsheetId) {
        M.toast({html: 'Primero selecciona una planilla.', classes: 'orange'});
        return;
    }

    const nombrePlanillaAct = (selectPlanilla && selectPlanilla.value ? selectPlanilla.value : '').toUpperCase();
    const esMateriaEspecial = 
        nombrePlanillaAct.includes("ESP") || nombrePlanillaAct.includes("FÍSICA") || nombrePlanillaAct.includes("FISICA") || 
        nombrePlanillaAct.includes("PLÁSTICA") || nombrePlanillaAct.includes("PLASTICA") || 
        nombrePlanillaAct.includes("MÚSICA") || nombrePlanillaAct.includes("MUSICA") || 
        nombrePlanillaAct.includes("INGLÉS") || nombrePlanillaAct.includes("INGLES") || 
        nombrePlanillaAct.includes("ESPECIAL");

    if (esMateriaEspecial) {
        M.toast({html: 'El Dashboard no está disponible para áreas especiales.', classes: 'orange darken-3'});
        return;
    }

    if (!cursoCompleto || !Array.isArray(cursoCompleto.students) || cursoCompleto.students.length === 0) {
        M.toast({html: 'Los datos del curso aún se están cargando. Aguarde un momento...', classes: 'orange'});
        return;
    }

    if (chartsReady && typeof google !== 'undefined' && google.visualization) {
        iniciarExtraccionDashboard();
        return;
    }
    
    // Iniciar dashboard inmediatamente (cálculo de datos en memoria)
    iniciarExtraccionDashboard();

    // Cargar Google Charts en segundo plano si no está listo
    if (typeof google !== 'undefined' && google.charts) {
        try {
            google.charts.load('current', {'packages':['corechart', 'bar']});
            google.charts.setOnLoadCallback(() => {
                chartsReady = true;
                if (window.ultimoResultadoDashboard && window.dashboardRequestId) {
                    dibujarResultadosDashboard(window.ultimoResultadoDashboard, window.dashboardRequestId, true);
                }
            });
        } catch (eG) {
            console.warn('Error iniciando google.charts:', eG);
        }
        return;
    }

    if (!document.getElementById('google-charts-script')) {
        const script = document.createElement('script');
        script.id = 'google-charts-script';
        script.src = "https://www.gstatic.com/charts/loader.js";

        script.onload = () => {
            if (typeof google !== 'undefined' && google.charts) {
                try {
                    google.charts.load('current', {'packages':['corechart', 'bar']});
                    google.charts.setOnLoadCallback(() => {
                        chartsReady = true;
                        if (window.ultimoResultadoDashboard && window.dashboardRequestId) {
                            dibujarResultadosDashboard(window.ultimoResultadoDashboard, window.dashboardRequestId, true);
                        }
                    });
                } catch (eG) {
                    console.warn('Error inicializando google.charts tras load:', eG);
                }
            }
        };

        document.head.appendChild(script);
    }
}

function calcularDatosDashboardEnCliente(curso) {
    if (!curso || !Array.isArray(curso.students)) {
        return {
            success: false,
            message: 'No hay datos cargados para este curso.'
        };
    }

    const PassingGrade = 6;

    // 1. Filtrar alumnos activos y visibles
    const alumnos = curso.students.filter(st => {
        const datos = (st.datosHojas && st.datosHojas.DATOS) || {};
        const oculto = String(obtenerValorCampo(datos, 'OCULTO') || '').toUpperCase().trim();
        const estado = obtenerValorCampo(datos, 'ACTIVOS') !== undefined
            ? obtenerValorCampo(datos, 'ACTIVOS') : obtenerValorCampo(datos, 'ESTADO');
        const activo = estado === undefined || ['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(String(estado).toUpperCase().trim());
        const dni = String(st.dni || '').trim();
        return !['SI', 'SÍ', 'TRUE'].includes(oculto) && activo && dni !== '' && dni !== '0' && dni !== '00000000';
    });

    if (alumnos.length === 0) {
        return {
            success: true,
            kpis: {
                totalAlumnos: 0,
                materiaCritica: 'No hay alumnos válidos',
                desaprobadoGeneral: '0%'
            },
            chartMaterias: [['Materia', 'Aprobados', 'Desaprobados']],
            tablaTop10: [],
            listaDesaprobados: []
        };
    }

    // 2. Determinar hoja de boletín
    let hojaNotas = null;
    const sheetOrder = Array.isArray(curso.sheetOrder) ? curso.sheetOrder : Object.keys(curso.sheets || {});
    
    if (typeof selectHoja !== 'undefined' && selectHoja && selectHoja.value && String(selectHoja.value).toUpperCase().includes('BOLETIN')) {
        hojaNotas = selectHoja.value;
    }
    if (!hojaNotas && typeof obtenerNombreHojaBoletin === 'function') {
        hojaNotas = obtenerNombreHojaBoletin();
    }
    if (!hojaNotas) {
        hojaNotas = sheetOrder.find(h => String(h).toUpperCase().includes('BOLETIN'));
    }
    if (!hojaNotas && curso.sheets) {
        hojaNotas = Object.keys(curso.sheets).find(h => String(h).toUpperCase().includes('BOLETIN'));
    }

    // 3. Determinar hoja de asistencia
    let hojaAsis = sheetOrder.find(h => {
        const u = String(h).toUpperCase();
        return u.includes('ASISTENCIA') || u.includes('CONDUCTA');
    });
    if (!hojaAsis && curso.sheets) {
        hojaAsis = Object.keys(curso.sheets).find(h => {
            const u = String(h).toUpperCase();
            return u.includes('ASISTENCIA') || u.includes('CONDUCTA');
        });
    }

    // 4. Determinar columnas de materias y columna de promedio general
    const normalizarCabecera = h => String(h || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[._-]/g, '');

    const bloqueadosFijos = [
        "NRO.", "APELLIDO", "NOMBRE", "DNI", "ALUMNO", "PROMEDIO", "FINAL", "PROM.1°", "PROM.2°",
        "OBSERVACIONES", "SITUACIÓN", "SITUACION", "TURNO", "AÑO", "CICLO", "GRADO",
        "SECCIÓN", "SECCION", "AUSENTE", "AUSENTES", "FALTA", "FALTAS", "INASISTENCIA", "INASISTENCIAS",
        "JUSTIFICADA", "INJUSTIFICADA", "CONDUCTA"
    ];

    let headersNotas = [];
    if (hojaNotas && curso.sheets && curso.sheets[hojaNotas] && Array.isArray(curso.sheets[hojaNotas].allHeaders) && curso.sheets[hojaNotas].allHeaders.length > 0) {
        headersNotas = curso.sheets[hojaNotas].allHeaders;
    } else if (hojaNotas && alumnos.length > 0 && alumnos[0].datosHojas && alumnos[0].datosHojas[hojaNotas]) {
        headersNotas = Object.keys(alumnos[0].datosHojas[hojaNotas]);
    }

    let colPromedioHeader = null;
    for (const h of headersNotas) {
        const hNorm = normalizarCabecera(h);
        if (/^PROM(?:EDIO)?[12][°º]?$/.test(hNorm) || /^PROM(?:EDIO)?[12]$/.test(hNorm) || hNorm === 'PROMEDIO' || hNorm === 'PROMEDIOFINAL' || hNorm === 'PROM') {
            colPromedioHeader = h;
            break;
        }
    }
    if (!colPromedioHeader) {
        for (const h of headersNotas) {
            const hUpper = String(h || '').toUpperCase().trim();
            if ((hUpper.includes('PROM') || hUpper.includes('FINAL')) && !hUpper.includes('LENG') && !hUpper.includes('MAT')) {
                colPromedioHeader = h;
                break;
            }
        }
    }

    const materiasColumns = [];
    const estadisticasMaterias = {};

    headersNotas.forEach(h => {
        if (!h || String(h).startsWith('_')) return;
        const hUpper = String(h).toUpperCase().trim();
        const hNorm = normalizarCabecera(h);
        const esPromedioGeneral = (h === colPromedioHeader) ||
            /^PROM(?:EDIO)?[12][°º]?$/.test(hNorm) ||
            /^PROM(?:EDIO)?[12]$/.test(hNorm);
        const esBloqueado = bloqueadosFijos.some(b => hUpper.includes(b)) || esPromedioGeneral;
        if (!esBloqueado) {
            materiasColumns.push(h);
            estadisticasMaterias[h] = { aprobados: 0, desaprobados: 0, total: 0 };
        }
    });

    // Si no se detectaron materias en la hoja de boletín, usar materias estándar
    if (materiasColumns.length === 0) {
        const materiasPorDefecto = [
            "LENGUA", "MATEMÁTICA", "CIENCIAS SOCIALES", "CIENCIAS NATURALES",
            "EDUCACIÓN FÍSICA", "EDUCACIÓN ARTÍSTICA", "LENGUA EXTRANJERA"
        ];
        materiasPorDefecto.forEach(m => {
            materiasColumns.push(m);
            estadisticasMaterias[m] = { aprobados: 0, desaprobados: 0, total: 0 };
        });
    }

    // 5. Procesar calificaciones y asistencias de los alumnos
    const listaEstudiantesParaTop = [];
    const alumnosDesaprobados = [];
    let totalConPromedio = 0;
    let totalDesaprobadosProm = 0;

    alumnos.forEach(st => {
        const datosBol = (hojaNotas && st.datosHojas && st.datosHojas[hojaNotas]) || {};

        // Inasistencias
        let faltas = 0;
        const datosAsis = (hojaAsis && st.datosHojas && st.datosHojas[hojaAsis]) || {};
        let faltasJ = 0;
        let faltasI = 0;
        let faltasTotal = null;

        for (const [col, val] of Object.entries(datosAsis)) {
            const cUpper = String(col || '').toUpperCase().trim();
            if (cUpper.includes('DNI') || cUpper.includes('NOMBRE') || cUpper.includes('APELLIDO') || cUpper.includes('CONDUCTA')) continue;
            const valNum = parseFloat(String(val || '').replace(',', '.')) || 0;
            if (cUpper.includes('INJUSTIFICADA')) {
                faltasI = valNum;
            } else if (cUpper.includes('JUSTIFICADA')) {
                faltasJ = valNum;
            } else if (cUpper === 'INASISTENCIAS' || cUpper === 'TOTAL INASISTENCIAS' || cUpper === 'TOTAL FALTAS' || cUpper === 'FALTAS') {
                faltasTotal = valNum;
            }
        }
        if (faltasTotal !== null) {
            faltas = faltasTotal;
        } else {
            faltas = faltasJ + faltasI;
        }

        if (faltas === 0 && datosBol) {
            let bJ = 0, bI = 0, bTot = null;
            for (const [col, val] of Object.entries(datosBol)) {
                const cUpper = String(col || '').toUpperCase().trim();
                if (cUpper.includes('INJUSTIFICADA')) bI = parseFloat(String(val || '').replace(',', '.')) || 0;
                else if (cUpper.includes('JUSTIFICADA')) bJ = parseFloat(String(val || '').replace(',', '.')) || 0;
                else if (cUpper === 'INASISTENCIAS' || cUpper === 'TOTAL INASISTENCIAS' || cUpper === 'FALTAS') bTot = parseFloat(String(val || '').replace(',', '.')) || 0;
            }
            if (bTot !== null) faltas = bTot;
            else if (bJ + bI > 0) faltas = bJ + bI;
        }

        // Promedio general
        let promedioGeneral = 0;
        if (colPromedioHeader && datosBol[colPromedioHeader] !== undefined && datosBol[colPromedioHeader] !== null && String(datosBol[colPromedioHeader]).trim() !== '') {
            const pVal = parseFloat(String(datosBol[colPromedioHeader]).replace(',', '.'));
            if (!isNaN(pVal) && pVal > 0) {
                promedioGeneral = pVal;
            }
        }

        // Notas por materia
        let sumaNotasAlumno = 0;
        let countNotasAlumno = 0;

        materiasColumns.forEach(materia => {
            let notaStr = (datosBol[materia] !== undefined && datosBol[materia] !== null && String(datosBol[materia]).trim() !== '')
                ? String(datosBol[materia]).trim()
                : '';

            if (!notaStr && typeof obtenerValorBoletinDesdeDatosFuente === 'function') {
                const valFuente = obtenerValorBoletinDesdeDatosFuente(st, materia);
                if (valFuente !== null && valFuente !== undefined && String(valFuente).trim() !== '') {
                    notaStr = String(valFuente).trim();
                }
            }

            if (!notaStr) return;
            const nota = parseFloat(notaStr.replace(',', '.'));
            if (isNaN(nota)) return;

            sumaNotasAlumno += nota;
            countNotasAlumno++;

            if (!estadisticasMaterias[materia]) {
                estadisticasMaterias[materia] = { aprobados: 0, desaprobados: 0, total: 0 };
            }
            estadisticasMaterias[materia].total++;
            if (nota >= PassingGrade) {
                estadisticasMaterias[materia].aprobados++;
            } else {
                estadisticasMaterias[materia].desaprobados++;
                alumnosDesaprobados.push({
                    nombre: st.nombreCompleto,
                    materia: materia,
                    nota: nota
                });
            }
        });

        if (promedioGeneral === 0 && countNotasAlumno > 0) {
            promedioGeneral = sumaNotasAlumno / countNotasAlumno;
        }

        if (promedioGeneral > 0) {
            totalConPromedio++;
            if (promedioGeneral < PassingGrade) {
                totalDesaprobadosProm++;
            }
        }

        listaEstudiantesParaTop.push({
            nombre: st.nombreCompleto,
            promedio: promedioGeneral,
            faltas: faltas
        });
    });

    // Ordenar desaprobados: materia ASC, alumno ASC
    alumnosDesaprobados.sort((a, b) => {
        if (a.materia === b.materia) return a.nombre.localeCompare(b.nombre);
        return a.materia.localeCompare(b.materia);
    });

    // Ordenar cuadro de honor: promedio DESC, faltas ASC, nombre ASC
    listaEstudiantesParaTop.sort((a, b) => {
        if (b.promedio !== a.promedio) return b.promedio - a.promedio;
        if (a.faltas !== b.faltas) return a.faltas - b.faltas;
        return a.nombre.localeCompare(b.nombre);
    });

    // Construir matriz para gráfico de Google Charts
    const rawChartsMaterias = [['Materia', 'Aprobados', 'Desaprobados']];
    let materiaMasCritica = { nombre: 'N/A', porcDesap: 0 };

    for (const nombreMateria in estadisticasMaterias) {
        const estad = estadisticasMaterias[nombreMateria];
        if (estad.total === 0) continue;

        rawChartsMaterias.push([nombreMateria, estad.aprobados, estad.desaprobados]);

        const porcDesap = (estad.desaprobados / estad.total) * 100;
        if (porcDesap > materiaMasCritica.porcDesap) {
            materiaMasCritica = { nombre: nombreMateria, porcDesap: porcDesap };
        }
    }

    let porcDesaprobadosGeneral = '0%';
    if (totalConPromedio > 0) {
        porcDesaprobadosGeneral = ((totalDesaprobadosProm / totalConPromedio) * 100).toFixed(1) + '%';
    }

    let textoMateriaCritica = 'No hay materia crítica';
    if (materiaMasCritica.porcDesap > 0) {
        textoMateriaCritica = `${materiaMasCritica.nombre} (${materiaMasCritica.porcDesap.toFixed(0)}%)`;
    }

    return {
        success: true,
        kpis: {
            totalAlumnos: alumnos.length,
            materiaCritica: textoMateriaCritica,
            desaprobadoGeneral: porcDesaprobadosGeneral
        },
        chartMaterias: rawChartsMaterias,
        tablaTop10: listaEstudiantesParaTop.slice(0, 10),
        listaDesaprobados: alumnosDesaprobados
    };
}

function iniciarExtraccionDashboard() {
  if (window.dashboardLoading) return;

  window.dashboardLoading = true;
  window.dashboardRequestId = Math.random().toString(36).slice(2);
  const currentRequestId = window.dashboardRequestId;

  document.getElementById('tbody-desaprobados').innerHTML = '<tr><td colspan="3" class="center-align grey-text">Analizando notas...</td></tr>';
  
  const modalElem = document.getElementById('modal-dashboard');
  if (!modalElem) {
      window.dashboardLoading = false;
      M.toast({html: 'No se encontró el modal de dashboard.', classes: 'red darken-3'});
      return;
  }

  let instance = M.Modal.getInstance(modalElem);
  if (!instance) instance = M.Modal.init(modalElem);
  instance.open();
  
  M.toast({html: 'Calculando estadísticas del grado...', classes: 'blue'});
  
  document.getElementById('chart_aprobados_materias').innerHTML = '<div class="progress blue lighten-4"><div class="indeterminate blue"></div></div>';
  document.getElementById('tbody-top10').innerHTML = '<tr><td colspan="4" class="center-align grey-text">Cargando cuadro de honor...</td></tr>';

  setTimeout(() => {
    try {
      if (!cursoCompleto || !Array.isArray(cursoCompleto.students) || cursoCompleto.students.length === 0) {
        throw new Error('Los datos del curso aún no se han cargado. Seleccione una planilla y espere a que termine la carga.');
      }
      const respuesta = calcularDatosDashboardEnCliente(cursoCompleto);
      window.ultimoResultadoDashboard = respuesta;
      dibujarResultadosDashboard(respuesta, currentRequestId);
    } catch (error) {
      window.dashboardLoading = false;
      document.getElementById('tbody-top10').innerHTML = '<tr><td colspan="4" class="center-align red-text">Error al calcular cuadro de honor.</td></tr>';
      document.getElementById('tbody-desaprobados').innerHTML = '<tr><td colspan="3" class="center-align red-text">Error al calcular materias desaprobadas.</td></tr>';
      document.getElementById('chart_aprobados_materias').innerHTML = '<div class="center red-text" style="padding-top: 40px;">No se pudieron calcular los gráficos.</div>';
      M.toast({html: '❌ Error generando dashboard: ' + (error.message || error), classes: 'red darken-3'});
    }
  }, 60);
}

function dibujarResultadosDashboard(respuesta, requestId, forzarRedibujado = false) {
  window.dashboardLoading = false;
  if (requestId !== window.dashboardRequestId) return;
  if (!forzarRedibujado && window.dashboardCompletedRequestId === requestId) return;
  window.dashboardCompletedRequestId = requestId;

  if (!respuesta.success) {
    const instance = M.Modal.getInstance(document.getElementById('modal-dashboard'));
    if(instance) instance.close();
    M.toast({html: '❌ Error: ' + respuesta.message, classes: 'red darken-3'});
    return;
  }

  document.getElementById('kpi-total-alumnos').textContent = respuesta.kpis.totalAlumnos;
  document.getElementById('kpi-materia-critica').textContent = respuesta.kpis.materiaCritica;
  document.getElementById('kpi-desaprobado-general').textContent = respuesta.kpis.desaprobadoGeneral;

  const datosChart = Array.isArray(respuesta.chartMaterias) ? respuesta.chartMaterias : [];
  if (datosChart.length < 2) {
    document.getElementById('chart_aprobados_materias').innerHTML = '<div class="center grey-text" style="padding-top: 90px;">Sin datos para graficar.</div>';
  } else {
    try {
      if (typeof google !== 'undefined' && google.visualization && google.visualization.arrayToDataTable) {
        const filasNormalizadas = datosChart.slice(1).filter(Array.isArray).map((fila) => {
          const nombreMateria = fila[0] == null ? 'Sin nombre' : String(fila[0]);
          const aprobados = Number(fila[1]);
          const desaprobados = Number(fila[2]);
          return [nombreMateria, Number.isFinite(aprobados) ? aprobados : 0, Number.isFinite(desaprobados) ? desaprobados : 0];
        });

        const dataChart = google.visualization.arrayToDataTable([
          ['Materia', 'Aprobados', 'Desaprobados'],
          ...filasNormalizadas
        ]);

        const options = {
          isStacked: 'percent', 
          height: 420, 
          legend: { position: 'top', maxLines: 2 },
          vAxis: { minValue: 0, ticks: [0, .25, .5, .75, 1], textStyle: { fontSize: 10 } }, 
          hAxis: { textStyle: { fontSize: 10, bold: true } }, 
          colors: ['#43a047', '#e53935'], 
          chartArea: { width: '85%', height: '70%' }, 
          animation: { startup: true, duration: 800, easing: 'out' } 
        };

        const chart = new google.visualization.ColumnChart(document.getElementById('chart_aprobados_materias'));
        chart.draw(dataChart, options);
      } else {
        document.getElementById('chart_aprobados_materias').innerHTML = '<div class="center grey-text" style="padding-top: 90px;">Cargando motor de gráficos...</div>';
      }
    } catch (eChart) {
      console.warn("Error dibujando gráfico:", eChart);
      document.getElementById('chart_aprobados_materias').innerHTML = '<div class="center grey-text" style="padding-top: 90px;">No se pudo renderizar el gráfico.</div>';
    }
  }

  const tbody = document.getElementById('tbody-top10');
  tbody.innerHTML = ''; 

  if (respuesta.tablaTop10.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="center-align grey-text">No hay alumnos válidos para el cuadro de honor.</td></tr>';
  } else {
    respuesta.tablaTop10.forEach((estudiante, index) => {
      const row = document.createElement('tr');
      
      let puestoHTML = `<b>${index + 1}º</b>`;
      if (index === 0) puestoHTML = `<b>1º</b>`;
      if (index === 1) puestoHTML = `<b>2º</b>`;
      if (index === 2) puestoHTML = `<b>3º</b>`;

      let strPromedio = estudiante.promedio.toString();
      let partesProm = strPromedio.split('.');
      const promedioFormateado = partesProm.length > 1 
          ? partesProm[0] + '.' + partesProm[1].substring(0, 3) 
          : partesProm[0];
      
      let celdaFaltasStyle = "text-align: center;";
      if (index > 0 && estudiante.promedio === respuesta.tablaTop10[index-1].promedio) {
         celdaFaltasStyle += "color: #e53935; font-weight: 700; background-color: #ffebee;"; 
      } else if (index < respuesta.tablaTop10.length - 1 && estudiante.promedio === respuesta.tablaTop10[index+1].promedio) {
         celdaFaltasStyle += "color: #43a047; font-weight: 700; background-color: #e8f5e9;";
      }

      row.innerHTML = `
        <td class="center-align" style="font-size: 1.1rem;">${puestoHTML}</td>
        <td style="font-weight: 500;">${estudiante.nombre}</td>
        <td class="center-align" style="font-family: 'Courier New', monospace; font-weight: 700; font-size: 1.1rem; color: #1565c0;">${promedioFormateado}</td>
        <td style="${celdaFaltasStyle}">${estudiante.faltas} faltas</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  const tbodyDesaprobados = document.getElementById('tbody-desaprobados');
  tbodyDesaprobados.innerHTML = ''; 

  if (respuesta.listaDesaprobados.length === 0) {
    tbodyDesaprobados.innerHTML = '<tr><td colspan="3" class="center-align" style="color: #2e7d32; font-weight: bold; padding: 20px;">¡Excelente! Ningún alumno tiene materias desaprobadas.</td></tr>';
  } else {
    respuesta.listaDesaprobados.forEach(registro => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: 500;">${registro.nombre}</td>
        <td><span class="chip red lighten-5 red-text text-darken-4" style="font-weight: bold; margin: 0;">${registro.materia}</span></td>
        <td class="center-align" style="font-family: 'Courier New', monospace; font-weight: 900; font-size: 1.1rem; color: #c62828;">${truncarPromedio(registro.nota)}</td>
      `;
      tbodyDesaprobados.appendChild(row);
    });
  }
  M.toast({html: '✅ Dashboard actualizado.', classes: 'green'});
}

document.addEventListener('DOMContentLoaded', function() {
  const modalBoletinesEl = document.getElementById('modal-boletines');
  if (modalBoletinesEl) {
      M.Modal.init(modalBoletinesEl);
      
      const btnAbrir = document.getElementById('btn-abrir-boletines');
      if (btnAbrir) {
          btnAbrir.addEventListener('click', (e) => {
              e.preventDefault();
              const correoSesion = (sessionStorage.getItem('misericordia_sesion') || '').trim();
              const tienePermisoBoletines = Boolean(window.esUsuarioAdmin) || correoSesion.toLowerCase() === 'misericordiaplanillas@gmail.com';
              if (!correoSesion) {
                  M.toast({html: 'Debes iniciar sesión para ver los boletines.', classes: 'red darken-3'});
                  return;
              }
              if (!tienePermisoBoletines) {
                  M.toast({html: 'No autorizado para generar boletines.', classes: 'red darken-3'});
                  return;
              }
              let instance = M.Modal.getInstance(modalBoletinesEl);
              if (!instance) instance = M.Modal.init(modalBoletinesEl);
              if (instance) instance.open();
              M.FormSelect.init(modalBoletinesEl.querySelectorAll('select'));
          });
      }
  }
});

// Controla la visibilidad de botones administrativos (auditoría y generación de boletines)
function actualizarVisibilidadAdmin() {
    try {
        const SUPER_EMAIL = 'misericordiaplanillas@gmail.com';
        const btnBuscadorAlumnos = document.getElementById('btn-abrir-buscador-alumnos');
        const itemBuscadorAlumnos = document.getElementById('item-menu-buscador-alumnos');
        const btnAuditoria = document.getElementById('btn-auditoria-global');
        const btnBoletines = document.getElementById('btn-abrir-boletines');
        const btnMigracion = document.getElementById('btn-abrir-migracion');
        const btnPaseGrado = document.getElementById('btn-abrir-pase-grado');
        const itemPaseGrado = document.getElementById('item-menu-pase-grado');
        const btnPromocion = document.getElementById('btn-abrir-promocion');
        const btnAbrirDirecto = document.getElementById('btn-abrir-planilla-directo');

        const currentEmail = (sessionStorage.getItem('misericordia_sesion') || '').toLowerCase().trim();
        const isCurrentSuper = currentEmail === SUPER_EMAIL;
        const esAdminVisible = Boolean(window.esUsuarioAdmin) || isCurrentSuper;

        const debeMostrarAuditoria = isCurrentSuper;
        const debeMostrarBoletines = esAdminVisible;

        const tienePlanillaSeleccionada = Boolean(currentSpreadsheetId);
        const puedeMostrarPromocion = tienePlanillaSeleccionada && !esPlanillaEspecialSeleccionada() && esPlanillaSegundoCuatrimestreSeleccionada();

        const contenedorAdmin = document.getElementById('contenedor-boton-admin');
        const itemAuditoria = document.getElementById('item-menu-auditoria');
        const itemBoletines = document.getElementById('item-menu-boletines');
        const itemMigracion = document.getElementById('item-menu-migracion');
        const itemSyncSheets = document.getElementById('item-menu-sync-sheets');
        const itemPermisos = document.getElementById('item-menu-permisos');
        const itemPromocion = document.getElementById('item-menu-promocion');
        const dividerMenu = document.querySelector('#dropdown-menu-acciones .divider');

        if (btnBuscadorAlumnos) btnBuscadorAlumnos.style.display = debeMostrarBoletines ? 'flex' : 'none';
        if (itemBuscadorAlumnos) itemBuscadorAlumnos.style.display = debeMostrarBoletines ? 'block' : 'none';

        if (btnAuditoria) btnAuditoria.style.display = debeMostrarAuditoria ? 'flex' : 'none';
        if (itemAuditoria) itemAuditoria.style.display = debeMostrarAuditoria ? 'block' : 'none';

        if (btnBoletines) btnBoletines.style.display = debeMostrarBoletines ? 'flex' : 'none';
        if (itemBoletines) itemBoletines.style.display = debeMostrarBoletines ? 'block' : 'none';

        if (btnMigracion) btnMigracion.style.display = debeMostrarBoletines ? 'flex' : 'none';
        if (itemMigracion) itemMigracion.style.display = debeMostrarBoletines ? 'block' : 'none';

        if (itemSyncSheets) itemSyncSheets.style.display = debeMostrarBoletines ? 'block' : 'none';
        if (itemPermisos) itemPermisos.style.display = debeMostrarBoletines ? 'block' : 'none';

        if (btnPaseGrado) btnPaseGrado.style.display = debeMostrarBoletines ? 'flex' : 'none';
        if (itemPaseGrado) itemPaseGrado.style.display = debeMostrarBoletines ? 'block' : 'none';

        if (btnPromocion) btnPromocion.style.display = puedeMostrarPromocion ? 'flex' : 'none';
        if (itemPromocion) itemPromocion.style.display = puedeMostrarPromocion ? 'block' : 'none';

        if (dividerMenu) {
            dividerMenu.style.display = ((debeMostrarAuditoria || debeMostrarBoletines) && puedeMostrarPromocion) ? 'block' : 'none';
        }

        const esSuperusuarioConPlanilla = Boolean(window.esUsuarioAdmin) && tienePlanillaSeleccionada;
        window.currentSpreadsheetId = currentSpreadsheetId;
        if (btnAbrirDirecto) {
            btnAbrirDirecto.style.display = esSuperusuarioConPlanilla ? 'inline-flex' : 'none';
            btnAbrirDirecto.href = tienePlanillaSeleccionada ? `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit` : '#';
            btnAbrirDirecto.title = tienePlanillaSeleccionada ? 'Abrir planilla seleccionada' : 'Selecciona una planilla';
            btnAbrirDirecto.setAttribute('aria-label', tienePlanillaSeleccionada ? 'Abrir planilla seleccionada' : 'Selecciona una planilla');
        }
        const btnSyncPlanillaActual = document.getElementById('btn-sync-planilla-actual');
        if (btnSyncPlanillaActual) {
            btnSyncPlanillaActual.style.display = esSuperusuarioConPlanilla ? 'inline-flex' : 'none';
        }
        const btnHistorialAlumnoActual = document.getElementById('btn-historial-alumno-actual');
        if (btnHistorialAlumnoActual) {
            const tieneAlumnoSel = Boolean((typeof selectAlumno !== 'undefined' && selectAlumno && selectAlumno.value) || window.dniAlumnoActual);
            btnHistorialAlumnoActual.style.display = (esSuperusuarioConPlanilla && tieneAlumnoSel) ? 'inline-flex' : 'none';
        }
        const btnAgregarAlumnoGrado = document.getElementById('btn-agregar-alumno-grado');
        if (btnAgregarAlumnoGrado) {
            btnAgregarAlumnoGrado.style.display = (tienePlanillaSeleccionada && typeof puedeAgregarAlumnoEnPlanillaActual === 'function' && puedeAgregarAlumnoEnPlanillaActual()) ? 'inline-flex' : 'none';
        }

        const hayOpcionesVisibles = Boolean(debeMostrarAuditoria || debeMostrarBoletines || puedeMostrarPromocion);
        if (contenedorAdmin) contenedorAdmin.style.display = hayOpcionesVisibles ? 'flex' : 'none';

        const triggerMenu = document.getElementById('btn-menu-acciones-trigger');
        if (triggerMenu && typeof M !== 'undefined' && M.Dropdown) {
            M.Dropdown.init(triggerMenu, {
                coverTrigger: false,
                constrainWidth: false,
                alignment: 'right',
                closeOnClick: true,
                container: document.body
            });
        }

        // Si se cierra la sesión del superusuario, asegurarse de cerrar paneles abiertos
        if (!debeMostrarAuditoria && !debeMostrarBoletines) {
            try {
                const panelAuditoria = document.getElementById('panel-auditoria-global');
                if (panelAuditoria) panelAuditoria.style.display = 'none';
                const modalBoletines = document.getElementById('modal-boletines');
                if (modalBoletines && M && M.Modal) {
                    const instance = M.Modal.getInstance(modalBoletines);
                    if (instance && instance.isOpen) instance.close();
                }
                const modalBuscador = document.getElementById('modal-buscador-alumnos');
                if (modalBuscador && M && M.Modal) {
                    const instBuscador = M.Modal.getInstance(modalBuscador);
                    if (instBuscador && instBuscador.isOpen) instBuscador.close();
                }
            } catch (e) { /* noop */ }
        }

    } catch (err) {
        console.warn('actualizarVisibilidadAdmin fallo:', err);
    }
}

// =========================================================================
// MOTOR DE GENERACIÓN POR LOTES REST - ÚNICA VERSIÓN LIMPIA Y DESEMPAQUETADA
// =========================================================================
let estadoProgresoBoletines = { generados: 0, total: 0 };
let contextoCancelacionBoletines = null;
let abortarGeneracionBoletines = false;

function cancelarProcesoBoletinesUI() {
    abortarGeneracionBoletines = true;
    const boton = document.getElementById('btn-cancelar-boletines');
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<i class="material-icons left">hourglass_empty</i>Cancelando...';
    }
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = 'Cancelando generación de boletines...';
}

function reiniciarProgresoBoletines() {
    estadoProgresoBoletines = { generados: 0, total: 0 };
    abortarGeneracionBoletines = false;
}

function actualizarProgresoBoletines(progreso) {
    const contenedor = document.getElementById('boletines-progress');
    const barra = document.getElementById('boletines-progress-bar');
    const etiqueta = document.getElementById('boletines-progress-percent');
    const estado = document.getElementById('boletines-progress-status');
    const track = contenedor ? contenedor.querySelector('[role="progressbar"]') : null;
    if (!contenedor || !barra || !etiqueta || !estado) return;

    const totalRecibido = Number(progreso.total);
    const generadosRecibidos = Math.max(0, Number(progreso.generados) || 0);
    estadoProgresoBoletines.generados = Math.max(estadoProgresoBoletines.generados, generadosRecibidos);
    if (Number.isFinite(totalRecibido) && totalRecibido > 0) {
        estadoProgresoBoletines.total = Math.max(estadoProgresoBoletines.total, totalRecibido);
    }
    const total = estadoProgresoBoletines.total;
    const generados = estadoProgresoBoletines.generados;
    const porcentaje = Number.isFinite(total) && total > 0
        ? Math.min(100, Math.round((generados / total) * 100))
        : 0;
    contenedor.style.display = 'block';
    barra.style.width = `${porcentaje}%`;
    etiqueta.textContent = `${porcentaje}%`;
    const textoEstado = progreso.estado || `Generando boletines: ${generados}/${total || '?'}`;
    estado.textContent = String(textoEstado).replace(/\d+\/(?:\d+|\?)/g, `${generados}/${total || '?'}`);
    if (track) track.setAttribute('aria-valuenow', String(porcentaje));
}

function normalizarTextoBoletin(txt) {
  return String(txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function formatearNotaBoletin(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const str = String(valor).trim().replace(/,/g, '.');
  const num = Number(str);
  if (!isNaN(num) && num > 0) return truncarPromedio(num);
  return String(valor).trim();
}

function resolverPlanillaSupabaseParaBoletin(planillas, grado, seccion, esSegundo) {
  const gBuscado = String(grado).trim().replace(/[^0-9]/g, '');
  const sBuscada = String(seccion).trim().toUpperCase().replace(/[^A-Z]/g, '');

  const normales = (planillas || []).filter(p => !/\bESP\b|ESPECIAL|INGL|MÚS|MUS|PLÁST|PLAST|ED\.?\s*FÍS|ED\.?\s*FIS/i.test(p.nombre || ''));

  return normales.find(p => {
    const u = (p.nombre || '').toUpperCase();
    const pEsSegundo = /(?:2(?:\s*(?:º|°|DO))?\s*CUAT|SEGUNDO\s*CUAT)/i.test(u);
    if (Boolean(esSegundo) !== Boolean(pEsSegundo)) return false;
    const mGrado = u.match(/(?:^|\s)(\d+)(?:º|°|RO|DO|TO|ER|MO)?\s+([A-L])(?:\s|$)/);
    return mGrado && mGrado[1] === gBuscado && mGrado[2] === sBuscada;
  });
}

function extraerValorBoletin(datosObj, candidatos) {
  if (!datosObj) return '';
  const keys = Object.keys(datosObj);
  for (const cand of candidatos) {
    const normCand = normalizarTextoBoletin(cand);
    const foundKey = keys.find(k => normalizarTextoBoletin(k) === normCand);
    if (foundKey && datosObj[foundKey] !== undefined && datosObj[foundKey] !== null && String(datosObj[foundKey]).trim() !== '') {
      return String(datosObj[foundKey]).trim();
    }
  }
  for (const cand of candidatos) {
    const normCand = normalizarTextoBoletin(cand);
    const foundKey = keys.find(k => normalizarTextoBoletin(k).includes(normCand));
    if (foundKey && datosObj[foundKey] !== undefined && datosObj[foundKey] !== null && String(datosObj[foundKey]).trim() !== '') {
      return String(datosObj[foundKey]).trim();
    }
  }
  return '';
}

function extraerValorMateriaBoletin(alumnoCalifs, nombreHojaBoletin, candidatosBoletin, nombreHojaMateria, candidatosHojaMateria) {
  const hojaB = (alumnoCalifs && alumnoCalifs[nombreHojaBoletin]) || {};
  const valB = extraerValorBoletin(hojaB, candidatosBoletin);
  if (valB !== '' && !isNaN(Number(String(valB).replace(/,/g, '.')))) {
    return truncarPromedio(valB);
  }
  if (valB !== '') return valB;

  if (alumnoCalifs && nombreHojaMateria) {
    const todasHojas = Object.keys(alumnoCalifs);
    const hojaReal = todasHojas.find(h => normalizarTextoBoletin(h).includes(normalizarTextoBoletin(nombreHojaMateria)));
    if (hojaReal && alumnoCalifs[hojaReal]) {
      const valM = extraerValorBoletin(alumnoCalifs[hojaReal], candidatosHojaMateria || ['PROMEDIO.', 'PROMEDIO', 'PROM', 'FINAL', 'NOTA']);
      if (valM !== '' && !isNaN(Number(String(valM).replace(/,/g, '.')))) {
        return truncarPromedio(valM);
      }
      if (valM !== '') return valM;
    }
  }
  return '';
}

async function obtenerDatosCompletosBoletines(grado, seccion, esSegundo, dniFiltro) {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    throw new Error('El cliente de Supabase no está disponible.');
  }

  const { data: todasPlanillas, error: errPlanillas } = await supabaseClient
    .from('planillas')
    .select('id, nombre, spreadsheet_id');

  if (errPlanillas || !Array.isArray(todasPlanillas)) {
    throw new Error('Error consultando planillas en Supabase: ' + (errPlanillas?.message || 'Error'));
  }

  const planillaPrincipal = resolverPlanillaSupabaseParaBoletin(todasPlanillas, grado, seccion, esSegundo);
  if (!planillaPrincipal) {
    const textoEtapa = esSegundo ? '2º Cuatrimestre' : '1º Cuatrimestre';
    throw new Error(`No se encontró la planilla de ${grado}° "${seccion}" (${textoEtapa}) en la base de datos.`);
  }

  let planillaHermana = null;
  if (esSegundo) {
    planillaHermana = resolverPlanillaSupabaseParaBoletin(todasPlanillas, grado, seccion, false);
    if (!planillaHermana) {
      console.warn(`[Boletines] Aviso: No se encontró planilla del 1º Cuatrimestre para ${grado}° "${seccion}".`);
    }
  }

  const { data: matriculas, error: errMatriculas } = await supabaseClient
    .from('alumno_planillas')
    .select(`
      numero_orden,
      activo,
      oculto,
      alumnos (
        dni,
        apellido,
        nombre,
        sexo,
        fecha_nacimiento,
        activo,
        oculto
      )
    `)
    .eq('planilla_id', planillaPrincipal.id)
    .order('numero_orden', { ascending: true });

  if (errMatriculas || !Array.isArray(matriculas)) {
    throw new Error('Error consultando alumnos de la planilla: ' + (errMatriculas?.message || 'Error'));
  }

  let alumnosActivos = matriculas.filter(m => {
    const al = m.alumnos || {};
    return m.activo !== false && al.activo !== false && m.oculto !== true && al.oculto !== true;
  });

  if (dniFiltro) {
    const cleanDni = String(dniFiltro).replace(/[^0-9]/g, '');
    alumnosActivos = alumnosActivos.filter(m => {
      const d = String(m.alumnos?.dni || '').replace(/[^0-9]/g, '');
      return d === cleanDni;
    });
    if (alumnosActivos.length === 0) {
      throw new Error(`No se encontró al alumno con DNI ${dniFiltro} en ${grado}° "${seccion}".`);
    }
  }

  if (alumnosActivos.length === 0) {
    throw new Error(`No hay alumnos activos para generar boletines en ${grado}° "${seccion}".`);
  }

  const { data: califsPrincipal, error: errCalifs1 } = await supabaseClient
    .from('calificaciones')
    .select('alumno_dni, nombre_hoja, valores')
    .eq('planilla_id', planillaPrincipal.id);

  if (errCalifs1) console.warn('[Boletines] Error leyendo calificaciones principales:', errCalifs1);

  const mapaCalifsPrincipal = {};
  (califsPrincipal || []).forEach(c => {
    const d = String(c.alumno_dni || '').replace(/[^0-9]/g, '');
    if (!mapaCalifsPrincipal[d]) mapaCalifsPrincipal[d] = {};
    mapaCalifsPrincipal[d][c.nombre_hoja] = c.valores || {};
  });

  const mapaCalifsHermana = {};
  if (esSegundo && planillaHermana) {
    const { data: califsHermana } = await supabaseClient
      .from('calificaciones')
      .select('alumno_dni, nombre_hoja, valores')
      .eq('planilla_id', planillaHermana.id);

    (califsHermana || []).forEach(c => {
      const d = String(c.alumno_dni || '').replace(/[^0-9]/g, '');
      if (!mapaCalifsHermana[d]) mapaCalifsHermana[d] = {};
      mapaCalifsHermana[d][c.nombre_hoja] = c.valores || {};
    });
  }

  const listaAlumnos = alumnosActivos.map((m, idx) => {
    const al = m.alumnos || {};
    const dni = String(al.dni || '').trim();
    const cleanDni = dni.replace(/[^0-9]/g, '');
    const apellido = String(al.apellido || '').trim();
    const nombre = String(al.nombre || '').trim();
    const orden = m.numero_orden || (idx + 1);

    const cp = mapaCalifsPrincipal[cleanDni] || mapaCalifsPrincipal[dni] || {};
    const ch = mapaCalifsHermana[cleanDni] || mapaCalifsHermana[dni] || {};

    const hojaBoletin1 = esSegundo ? (ch['BOLETINES_CALIFICACIONES'] || {}) : (cp['BOLETINES_CALIFICACIONES'] || {});
    const hojaBoletin2 = esSegundo ? (cp['BOLETINES_CALIFICACIONES_2DO'] || {}) : {};
    const hojaAsist1 = esSegundo ? (ch['ASISTENCIA_CONDUCTA'] || {}) : (cp['ASISTENCIA_CONDUCTA'] || {});
    const hojaAsist2 = esSegundo ? (cp['ASISTENCIA_CONDUCTA'] || {}) : {};

    const año = hojaBoletin1.AÑO || hojaBoletin2.AÑO || String(new Date().getFullYear());
    const gNum = parseInt(grado, 10) || 1;
    const ciclo = hojaBoletin1.CICLO || (gNum <= 3 ? '1°' : (gNum <= 5 ? '2°' : '3°'));
    const turno = hojaBoletin1.TURNO || (seccion.toUpperCase() >= 'G' ? 'TARDE' : 'MAÑANA');
    const maestra = hojaBoletin1.MAESTRA || hojaBoletin2.MAESTRA || '';

    const fuenteCalifs1 = esSegundo ? ch : cp;
    const p1Leng = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['LENGUA', 'LENG'], 'LENG', ['PROMEDIO.', 'PROMEDIO', 'LENGUA', 'LENG']);
    const p1Mat = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['MATEMÁTICA', 'MATEMATICA', 'MAT'], 'MAT', ['PROMEDIO.', 'PROMEDIO', 'MATEMATICA', 'MAT']);
    const p1Soc = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['CS.SOCIALES', 'CS SOCIALES', 'CIENCIAS SOCIALES', 'SOCIALES'], 'SOCIAL', ['PROMEDIO.', 'PROMEDIO', 'SOCIALES']);
    const p1Nat = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['CS.NATURALES Y TEGNOLOGIA', 'CS.NATURALES', 'NATURALES'], 'NATURAL', ['PROMEDIO.', 'PROMEDIO', 'NATURALES']);
    const p1Art = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['EDUCACIÓN ARTISTICA', 'EDUCACION ARTISTICA', 'ARTISTICA'], 'ESPECIAL', ['Ed.Artistica', 'ARTISTICA', 'Ed.Musica', 'PLASTICA']);
    const p1Fis = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['EDUCACION FÍSICA', 'EDUCACION FISICA', 'FISICA'], 'ESPECIAL', ['Ed. Física', 'Ed. Fisica', 'FISICA']);
    const p1Ext = extraerValorMateriaBoletin(fuenteCalifs1, 'BOLETINES_CALIFICACIONES', ['LENG. EXTRANJERA', 'LENGUA EXTRANJERA', 'INGLES'], 'ESPECIAL', ['Ingles', 'INGLES', 'EXTRANJERA']);

    const injus1 = extraerValorBoletin(hojaBoletin1, ['INASISTENCIA JUSTIFICA', 'INASISTENCIA JUSTIFICADA', 'JUSTIFICADA']) ||
                   extraerValorBoletin(hojaAsist1, ['Justificada', 'JUSTIFICADA']) || '0';
    const inin1 = extraerValorBoletin(hojaBoletin1, ['INASISTENCIA INJUSTIFICADA', 'INJUSTIFICADA']) ||
                  extraerValorBoletin(hojaAsist1, ['Injustificada', 'INJUSTIFICADA']) || '0';
    const totFaltas1 = (parseInt(injus1, 10) || 0) + (parseInt(inin1, 10) || 0);
    const cond1 = extraerValorBoletin(hojaBoletin1, ['CONDUCTA']) || extraerValorBoletin(hojaAsist1, ['Conducta', 'CONDUCTA']) || 'MB';

    const notas1Validas = [p1Leng, p1Mat, p1Soc, p1Nat, p1Art, p1Fis, p1Ext]
      .map(n => Number(String(n || '').trim().replace(/,/g, '.')))
      .filter(n => !isNaN(n) && n >= 6.0);
    const prom1 = notas1Validas.length === 7
      ? truncarPromedio(notas1Validas.reduce((a, b) => a + b, 0) / 7)
      : '';

    if (!esSegundo) {
      return {
        dni,
        orden,
        apellido,
        nombre,
        nombreCompleto: apellido && nombre ? `${apellido}, ${nombre}` : (apellido || nombre || dni),
        grado,
        seccion,
        turno,
        ciclo,
        maestra,
        año,
        p1Leng,
        p1Mat,
        p1Soc,
        p1Nat,
        p1Art,
        p1Fis,
        p1Ext,
        injus1,
        inin1,
        totFaltas1: String(totFaltas1),
        cond1,
        prom1
      };
    }

    const p2Leng = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['LENGUA', 'LENG'], 'LENG', ['PROMEDIO.', 'PROMEDIO', 'LENGUA']);
    const p2Mat = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['MATEMÁTICA', 'MATEMATICA', 'MAT'], 'MAT', ['PROMEDIO.', 'PROMEDIO', 'MATEMATICA']);
    const p2Soc = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['CS.SOCIALES', 'CS SOCIALES', 'CIENCIAS SOCIALES', 'SOCIALES'], 'SOCIAL', ['PROMEDIO.', 'PROMEDIO', 'SOCIALES']);
    const p2Nat = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['CS.NATURALES Y TEGNOLOGIA', 'CS.NATURALES', 'NATURALES'], 'NATURAL', ['PROMEDIO.', 'PROMEDIO', 'NATURALES']);
    const p2Art = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['EDUCACIÓN ARTISTICA', 'EDUCACION ARTISTICA', 'ARTISTICA'], 'ESPECIAL', ['Ed.Artistica', 'ARTISTICA', 'Ed.Musica', 'PLASTICA']);
    const p2Fis = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['EDUCACION FÍSICA', 'EDUCACION FISICA', 'FISICA'], 'ESPECIAL', ['Ed. Física', 'Ed. Fisica', 'FISICA']);
    const p2Ext = extraerValorMateriaBoletin(cp, 'BOLETINES_CALIFICACIONES_2DO', ['LENG. EXTRANJERA', 'LENGUA EXTRANJERA', 'INGLES'], 'ESPECIAL', ['Ingles', 'INGLES', 'EXTRANJERA']);

    const injus2 = extraerValorBoletin(hojaBoletin2, ['INASISTENCIA JUSTIFICA', 'INASISTENCIA JUSTIFICADA', 'JUSTIFICADA']) ||
                   extraerValorBoletin(hojaAsist2, ['Justificada', 'JUSTIFICADA']) || '0';
    const inin2 = extraerValorBoletin(hojaBoletin2, ['INASISTENCIA INJUSTIFICADA', 'INJUSTIFICADA']) ||
                  extraerValorBoletin(hojaAsist2, ['Injustificada', 'INJUSTIFICADA']) || '0';
    const totFaltas2 = (parseInt(injus2, 10) || 0) + (parseInt(inin2, 10) || 0);
    const cond2 = extraerValorBoletin(hojaBoletin2, ['CONDUCTA']) || extraerValorBoletin(hojaAsist2, ['Conducta', 'CONDUCTA']) || cond1 || 'MB';

    const coloqLeng = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO LENGUA', 'DIC LENGUA', 'PRO3LENG', 'PR3LENG']));
    const coloqMat = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO MATEMATICA', 'DIC MATEMATICA', 'PRO3MAT', 'PR3MAT']));
    const coloqSoc = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO CS SOCIALES', 'DIC CS SOCIALES', 'PRO3CSS', 'PR3CSS']));
    const coloqNat = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO CS NATURALES', 'DIC CS NATURALES', 'PRO3CSN', 'PR3CSN']));
    const coloqArt = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO ARTISTICA', 'DIC ARTISTICA', 'PRO3ART', 'PR3ART']));
    const coloqFis = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO FISICA', 'DIC FISICA', 'PRO3FIS', 'PR3FIS']));
    const coloqExt = formatearNotaBoletin(extraerValorBoletin(hojaBoletin2, ['COLOQUIO INGLES', 'DIC INGLES', 'PRO3EXT', 'PR3EXT']));

    const calcFinal = (n1Str, n2Str, coloqStr) => {
      const v1 = Number(String(n1Str || '').replace(/,/g, '.'));
      const v2 = Number(String(n2Str || '').replace(/,/g, '.'));
      const vC = Number(String(coloqStr || '').replace(/,/g, '.'));
      if (!isNaN(vC) && vC >= 6.0) return truncarPromedio(vC);
      if (!isNaN(v1) && !isNaN(v2) && v1 >= 6.0 && v2 >= 6.0) {
        return truncarPromedio((v1 + v2) / 2);
      }
      return '';
    };

    const calcPromedioMateria = (n1Str, n2Str) => {
      if (n1Str === null || n1Str === undefined || String(n1Str).trim() === '' ||
          n2Str === null || n2Str === undefined || String(n2Str).trim() === '') {
        return '';
      }
      const v1 = Number(String(n1Str).trim().replace(/,/g, '.'));
      const v2 = Number(String(n2Str).trim().replace(/,/g, '.'));
      // Por reglamento (igual que en Planilla de Promoción), si alguno de los 2 cuatrimestres es < 6, no se carga el promedio
      if (!isNaN(v1) && !isNaN(v2) && v1 >= 6.0 && v2 >= 6.0) {
        return truncarPromedio((v1 + v2) / 2);
      }
      return '';
    };

    // El promedio de cada área en el boletín debe coincidir estrictamente con la Planilla de Promoción:
    // solo se carga si ambos cuatrimestres están aprobados (>= 6.00).
    const obtenerPromedioMateria = (_candidatosDb, n1Str, n2Str) => {
      return calcPromedioMateria(n1Str, n2Str);
    };

    const obtenerFinalMateria = (candidatosDb, n1Str, n2Str, coloqStr) => {
      const enDb = extraerValorBoletin(hojaBoletin2, candidatosDb);
      if (enDb && !isNaN(Number(String(enDb).replace(/,/g, '.')))) {
        return truncarPromedio(enDb);
      }
      return calcFinal(n1Str, n2Str, coloqStr);
    };

    const promLeng = obtenerPromedioMateria(['PROMEDIO LENGUA', 'PROM LENGUA', 'PROM. LENGUA', 'PROMLENG', 'PRO3LENG'], p1Leng, p2Leng);
    const promMat = obtenerPromedioMateria(['PROMEDIO MATEMATICA', 'PROM MATEMATICA', 'PROM. MAT', 'PROMMAT', 'PRO3MAT'], p1Mat, p2Mat);
    const promSoc = obtenerPromedioMateria(['PROMEDIO CS SOCIALES', 'PROM CS SOCIALES', 'PROM. SOC', 'PROMSOC', 'PRO3CSS'], p1Soc, p2Soc);
    const promNat = obtenerPromedioMateria(['PROMEDIO CS NATURALES', 'PROM CS NATURALES', 'PROM. NAT', 'PROMNAT', 'PRO3CSN'], p1Nat, p2Nat);
    const promArt = obtenerPromedioMateria(['PROMEDIO ARTISTICA', 'PROM ARTISTICA', 'PROM. ART', 'PROMART', 'PRO3ART'], p1Art, p2Art);
    const promFis = obtenerPromedioMateria(['PROMEDIO FISICA', 'PROM FISICA', 'PROM. FIS', 'PROMFIS', 'PRO3FIS'], p1Fis, p2Fis);
    const promExt = obtenerPromedioMateria(['PROMEDIO INGLES', 'PROM INGLES', 'PROM. EXT', 'PROMOEXT', 'PROMEST', 'PRO3EXT'], p1Ext, p2Ext);

    const finalLeng = obtenerFinalMateria(['FINAL LENGUA', 'NOTA FINAL LENGUA', 'DEFLENG'], p1Leng, p2Leng, coloqLeng);
    const finalMat = obtenerFinalMateria(['FINAL MATEMATICA', 'NOTA FINAL MATEMATICA', 'DEFMAT'], p1Mat, p2Mat, coloqMat);
    const finalSoc = obtenerFinalMateria(['FINAL CS SOCIALES', 'NOTA FINAL CS SOCIALES', 'DEFSOC'], p1Soc, p2Soc, coloqSoc);
    const finalNat = obtenerFinalMateria(['FINAL CS NATURALES', 'NOTA FINAL CS NATURALES', 'DEFNAT'], p1Nat, p2Nat, coloqNat);
    const finalArt = obtenerFinalMateria(['FINAL ARTISTICA', 'NOTA FINAL ARTISTICA', 'DEFART'], p1Art, p2Art, coloqArt);
    const finalFis = obtenerFinalMateria(['FINAL FISICA', 'NOTA FINAL FISICA', 'DEFFIS'], p1Fis, p2Fis, coloqFis);
    const finalExt = obtenerFinalMateria(['FINAL INGLES', 'NOTA FINAL INGLES', 'DEFEXT'], p1Ext, p2Ext, coloqExt);

    const injus3 = '0';
    const inin3 = '0';
    const totFaltas3 = 0;
    const totJustAnual = (parseInt(injus1, 10) || 0) + (parseInt(injus2, 10) || 0) + (parseInt(injus3, 10) || 0);
    const totIninAnual = (parseInt(inin1, 10) || 0) + (parseInt(inin2, 10) || 0) + (parseInt(inin3, 10) || 0);
    const totalFaltaAnual = totJustAnual + totIninAnual;

    const materiasFinales = [finalLeng, finalMat, finalSoc, finalNat, finalArt, finalFis, finalExt];
    const todasAprobadas = materiasFinales.every(n => {
      const num = Number(String(n).replace(/,/g, '.'));
      return !isNaN(num) && num >= 6.0;
    });

    // El Promedio Anual en el Boletín SOLO aparece si aparece en la Planilla de Promoción
    // (es decir, cuando las 7 áreas están aprobadas con >= 6.00 en ambos cuatrimestres).
    let proAnual = '';
    const promediosMaterias = [promLeng, promMat, promSoc, promNat, promArt, promFis, promExt]
      .map(n => Number(String(n || '').trim().replace(/,/g, '.')))
      .filter(n => !isNaN(n) && n >= 6.0);

    if (promediosMaterias.length === 7) {
      const promGeneral = promediosMaterias.reduce((a, b) => a + b, 0) / 7;
      proAnual = (Math.trunc(promGeneral * 1000 + 1e-9) / 1000).toFixed(3);
    }

    const situacionFinal = todasAprobadas
      ? 'PROMOVIDO/A AL GRADO INMEDIATO SUPERIOR'
      : 'EN INSTANCIA COMPENSATORIA (COLOQUIO)';

    return {
      dni,
      orden,
      apellido,
      nombre,
      nombreCompleto: apellido && nombre ? `${apellido}, ${nombre}` : (apellido || nombre || dni),
      grado,
      seccion,
      turno,
      ciclo,
      maestra,
      año,
      p1Leng, p1Mat, p1Soc, p1Nat, p1Art, p1Fis, p1Ext,
      injus1, inin1, totFaltas1: String(totFaltas1), cond1, prom1,
      p2Leng, p2Mat, p2Soc, p2Nat, p2Art, p2Fis, p2Ext,
      injus2, inin2, totFaltas2: String(totFaltas2), cond2,
      coloqLeng, coloqMat, coloqSoc, coloqNat, coloqArt, coloqFis, coloqExt,
      promLeng, promMat, promSoc, promNat, promArt, promFis, promExt,
      finalLeng, finalMat, finalSoc, finalNat, finalArt, finalFis, finalExt,
      injus3, inin3, totFaltas3: String(totFaltas3),
      totJustAnual: String(totJustAnual),
      totIninAnual: String(totIninAnual),
      totalFaltaAnual: String(totalFaltaAnual),
      proAnual,
      situacionFinal
    };
  });

  return {
    grado,
    seccion,
    esSegundo,
    alumnos: listaAlumnos,
    spreadsheetId: planillaPrincipal.spreadsheet_id || null,
    nombrePlanilla: planillaPrincipal.nombre || ''
  };
}

// =========================================================================
// ⚙️ CONFIGURACIÓN DE NODOS APPS SCRIPT Y ENDPOINT API
// =========================================================================
const APPS_SCRIPT_API_URLS = [
    "https://script.google.com/macros/s/AKfycbyAjxyFWJZTIqvYo2bfq1vNDlEaIMHrqo9Zqb96SnRHy4WWJrIa7XeUsIlDwo0N-JuZYA/exec",
    "https://script.google.com/macros/s/AKfycby_SOVso62pE-AggkjhoaSRA1iQ6Gndr27YchudExl3pbFHvpxh4yGmd3FDfVGHBjrR/exec",
    "https://script.google.com/macros/s/AKfycbzlzK4XbDRVcuvGF5f1pjaeSOrkhPLbfnTrc7morbQd8aQxmkiWLRRrXSZ1FbVuL9_2KQ/exec"
];

function getRandomAppsScriptUrl() {
    return APPS_SCRIPT_API_URLS[Math.floor(Math.random() * APPS_SCRIPT_API_URLS.length)];
}

const isNetlifyHost = typeof window !== 'undefined' && window.location && (
    (window.location.hostname && (window.location.hostname.endsWith('netlify.app') || window.location.hostname.includes('netlify'))) ||
    window.location.port === '8888'
);

let API_URL = (typeof window !== 'undefined' && window.APP_API_URL) ? window.APP_API_URL : (isNetlifyHost ? '/api' : getRandomAppsScriptUrl());
if (typeof window !== 'undefined') {
    window.API_URL = API_URL;
    window.APPS_SCRIPT_API_URLS = APPS_SCRIPT_API_URLS;
}
if (typeof window !== 'undefined') {
    window.obtenerDatosCompletosBoletines = obtenerDatosCompletosBoletines;
    window.compararAlumnosPorSexoYNombre = compararAlumnosPorSexoYNombre;
    window.resolverPlanillaSupabaseParaBoletin = resolverPlanillaSupabaseParaBoletin;
    window.supabaseClient = supabaseClient;
}

const IDEMPOTENT_ACTIONS = new Set([
    'enviarCodigoPorCorreo',
    'saveStudentData',
    'saveStudentDataBatch',
    'saveStudentDataGridBatch',
    'procesarBoletinesFiltrados',
    'borrarBoletinesDeCarpeta',
    'guardarBoletinPdfDrive',
    'guardarBoletinesPdfDriveBatch',
    'obtenerCarpetaBoletinesUrl',
    'migrarDatosCuatrimestreREST',
    'iniciarMigracionCuatrimestreAsync',
    'dispararNotificacionPush',
    'dispararNotificacionGrupoPush',
    'reserveGrade',
    'releaseGrade',
    'touchSession',
    'generarBoletinIndividualREST',
    'generarBoletinSegundoCuatrimestreREST',
    'generarBoletinAlumnoPorGrado',
    'borrarBoletinAlumnoPorGrado',
    'procesarBoletinesSegundoCuatrimestre',
    'procesarLoteBoletinesSegundoCuatrimestre',
    'procesarLoteBoletinesPrimerCuatrimestre',
    'cancelarProcesoBoletines'
]);
if (typeof window !== 'undefined') {
    window.IDEMPOTENT_ACTIONS = IDEMPOTENT_ACTIONS;
}

async function fetchAppsScriptConReintento(opciones, maxIntentos, endpoint = API_URL) {
    if (opciones && typeof opciones.body === 'string') {
        const requestBody = JSON.parse(opciones.body);
        if (requestBody && IDEMPOTENT_ACTIONS.has(requestBody.action)) {
            requestBody.operationId = requestBody.operationId || createOperationId();
            opciones.body = JSON.stringify(requestBody);
        }
    }
    let ultimoError;
    const intentos = maxIntentos || 3;
    for (let intento = 1; intento <= intentos; intento++) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            const error = new Error('No hay conexión a Internet. Conéctate y vuelve a intentar.');
            error.code = 'NETWORK_OFFLINE';
            throw error;
        }
        try {
            const response = await fetch(endpoint, opciones);
            if (response.status === 502) {
                let endpointEsMismoOrigen = false;
                try {
                    endpointEsMismoOrigen = new URL(endpoint, window.location.href).origin === window.location.origin;
                } catch (error) {
                    console.warn('No se pudo determinar el origen del proxy:', error);
                }
                if (endpointEsMismoOrigen) {
                    const errorPayload = await response.clone().json().catch(() => null);
                    if (errorPayload && typeof errorPayload.code === 'string' &&
                        errorPayload.code.indexOf('UPSTREAM_') === 0) {
                        return response;
                    }
                }
            }
            if (response.ok || ![404, 502, 503, 504].includes(response.status) || intento === intentos) return response;
            ultimoError = new Error(`Apps Script HTTP ${response.status}`);
        } catch (error) {
            ultimoError = error;
            if (intento === intentos) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1500 * intento));
    }
    throw ultimoError || new Error('No se pudo comunicar con Apps Script.');
}

const ESCUDO_OFICIAL_BASE64 = "data:image/png;base64,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";

function obtenerImagenEscudoBase64() {
  if (typeof ESCUDO_OFICIAL_BASE64 === "string" && ESCUDO_OFICIAL_BASE64.length > 100) {
    return ESCUDO_OFICIAL_BASE64;
  }
  try {
    const img = document.querySelector('img[src*="escudo"]') || document.querySelector('nav img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[Boletines] No se pudo obtener el escudo en base64:', err);
    return null;
  }
}

// ================================================================
// CONSTANTES Y GEOMETRÍA OFICIAL DE LA LIBRETA A4 (MODELO MINISTERIAL)
// ================================================================
const LIBRETA_MARGIN_LEFT = 10;
const LIBRETA_COL_WIDTHS = [
  14, // 0: Espacio Curricular
  19, // 1: LENGUA
  19, // 2: MATEMÁTICA
  24, // 3: CIENCIAS SOCIALES, FORMACIÓN ÉTICA Y CIUDADANA
  24, // 4: CIENCIAS NATURALES Y TECNOLOGÍA
  20, // 5: EDUCACIÓN ARTÍSTICA
  20, // 6: EDUCACIÓN FÍSICA
  20, // 7: LENGUA EXTRANJERA
  12, // 8: Inasistencia Justificada
  12, // 9: Inasistencia Injustificada
  17, // 10: Conducta
  25, // 11: Maestro
  25, // 12: Directivo
  26  // 13: Tutor
]; // Suma = 277 mm. Ancho A4 Landscape = 297 mm. Margen derecho = 10 mm.

const LIBRETA_COL_X = [LIBRETA_MARGIN_LEFT];
const LIBRETA_COL_CENTERS = [];
for (let i = 0; i < LIBRETA_COL_WIDTHS.length; i++) {
  LIBRETA_COL_CENTERS.push(LIBRETA_COL_X[i] + LIBRETA_COL_WIDTHS[i] / 2);
  LIBRETA_COL_X.push(LIBRETA_COL_X[i] + LIBRETA_COL_WIDTHS[i]);
}

const LIBRETA_Y_TABLE_TOP = 42;
const LIBRETA_Y_HEADER_BOTTOM = 72;
const LIBRETA_Y_ROW2 = 88;
const LIBRETA_Y_ROW3 = 104;
const LIBRETA_Y_ROW4 = 120;
const LIBRETA_Y_ROW5 = 136;
const LIBRETA_Y_TABLE_BOTTOM = 152;

function dibujarPlantillaOficialLibreta(doc, alumno, escudoData, modo, cuatri) {
  const esSobreimpresion = modo === 'sobreimpresion';
  const esSegundo = /(^|[^0-9])2(?:º|°|\.)?\s*(?:Cuat\.?|Cuatrimestre)/i.test(cuatri);
  const esCompleto = modo === 'oficial_hoja' || modo === 'oficial_diptico' || modo === 'completo';

  // Si no es sobreimpresión, dibujamos la grilla completa oficial (Página 1 de PDF 2)
  if (!esSobreimpresion) {
    // 1. Título oficial
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text('BOLETÍN DE CALIFICACIONES', 148.5, 17, { align: 'center' });

    // 2. Escudo oficial en la esquina superior derecha
    if (escudoData) {
      try {
        doc.addImage(escudoData, 'PNG', 253.5, 11, 21.2, 29.4);
      } catch (e) {
        console.warn('Escudo no se pudo estampar:', e);
      }
    }

    // 3. Ficha del Alumno (Fila 1 y Fila 2)
    doc.setFontSize(8.5);
    // Fila 1 (y = 25)
    doc.setFont('helvetica', 'bold');
    doc.text('ALUMNO/A:', 10, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.nombreCompleto || '').toUpperCase(), 32, 25);

    doc.setFont('helvetica', 'bold');
    doc.text('DNI Nº:', 125, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.dni || '-'), 140, 25);

    doc.setFont('helvetica', 'bold');
    doc.text('AÑO LECTIVO:', 200, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.año || new Date().getFullYear()), 226, 25);

    // Fila 2 (y = 33)
    doc.setFont('helvetica', 'bold');
    doc.text('GRADO:', 10, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(`${alumno.grado}°`, 25, 33);

    doc.setFont('helvetica', 'bold');
    doc.text('DIVISIÓN:', 50, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.seccion || ''), 67, 33);

    doc.setFont('helvetica', 'bold');
    doc.text('TURNO:', 125, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.turno || 'MAÑANA'), 140, 33);

    doc.setFont('helvetica', 'bold');
    doc.text('CICLO:', 200, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.ciclo || ''), 214, 33);

    // 4. Estructura de la Grilla (Líneas y bordes con grosor oficial)
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);

    // Borde exterior
    doc.rect(LIBRETA_MARGIN_LEFT, LIBRETA_Y_TABLE_TOP, 277, LIBRETA_Y_TABLE_BOTTOM - LIBRETA_Y_TABLE_TOP);

    // Líneas horizontales de separación de filas
    doc.line(LIBRETA_MARGIN_LEFT, LIBRETA_Y_HEADER_BOTTOM, LIBRETA_MARGIN_LEFT + 277, LIBRETA_Y_HEADER_BOTTOM);
    doc.line(LIBRETA_MARGIN_LEFT, LIBRETA_Y_ROW2, LIBRETA_MARGIN_LEFT + 277, LIBRETA_Y_ROW2);
    doc.line(LIBRETA_MARGIN_LEFT, LIBRETA_Y_ROW3, LIBRETA_MARGIN_LEFT + 277, LIBRETA_Y_ROW3);
    doc.line(LIBRETA_MARGIN_LEFT, LIBRETA_Y_ROW4, LIBRETA_MARGIN_LEFT + 277, LIBRETA_Y_ROW4);
    doc.line(LIBRETA_MARGIN_LEFT, LIBRETA_Y_ROW5, LIBRETA_MARGIN_LEFT + 277, LIBRETA_Y_ROW5);

    // Líneas verticales de columnas
    for (let i = 1; i < LIBRETA_COL_X.length - 1; i++) {
      doc.line(LIBRETA_COL_X[i], LIBRETA_Y_TABLE_TOP, LIBRETA_COL_X[i], LIBRETA_Y_TABLE_BOTTOM);
    }

    // 5. Encabezados de Columna
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);

    doc.text('Espacio\nCurricular', LIBRETA_COL_CENTERS[0], 55, { align: 'center' });
    doc.text('LENGUA', LIBRETA_COL_CENTERS[1], 56, { align: 'center' });
    doc.text('MATEMÁTICA', LIBRETA_COL_CENTERS[2], 56, { align: 'center' });
    doc.text('CIENCIAS\nSOCIALES,\nFORMACIÓN\nÉTICA Y\nCIUDADANA', LIBRETA_COL_CENTERS[3], 49, { align: 'center' });
    doc.text('CIENCIAS\nNATURALES Y\nTECNOLOGÍA', LIBRETA_COL_CENTERS[4], 53, { align: 'center' });
    doc.text('EDUCACIÓN\nARTÍSTICA', LIBRETA_COL_CENTERS[5], 54, { align: 'center' });
    doc.text('EDUCACIÓN\nFÍSICA', LIBRETA_COL_CENTERS[6], 54, { align: 'center' });
    doc.text('LENGUA\nEXTRANJERA', LIBRETA_COL_CENTERS[7], 54, { align: 'center' });

    doc.setFontSize(5.5);
    doc.text('Inasistencia\nJustificada', LIBRETA_COL_CENTERS[8], 54, { align: 'center' });
    doc.text('Inasistencia\nInjustificada', LIBRETA_COL_CENTERS[9], 54, { align: 'center' });

    doc.setFontSize(7.5);
    doc.text('Conducta', LIBRETA_COL_CENTERS[10], 56, { align: 'center' });
    doc.text('Maestro', LIBRETA_COL_CENTERS[11], 56, { align: 'center' });
    doc.text('Directivo', LIBRETA_COL_CENTERS[12], 56, { align: 'center' });
    doc.text('Tutor', LIBRETA_COL_CENTERS[13], 56, { align: 'center' });

    // 6. Nombres de Fila en Columna 0
    doc.setFontSize(7.5);
    doc.text('1º Cuat.', LIBRETA_COL_CENTERS[0], 81, { align: 'center' });
    doc.text('2º Cuat.', LIBRETA_COL_CENTERS[0], 97, { align: 'center' });
    doc.text('Promedio', LIBRETA_COL_CENTERS[0], 113, { align: 'center' });
    doc.text('Febrero', LIBRETA_COL_CENTERS[0], 129, { align: 'center' });
    doc.text('Nota Final', LIBRETA_COL_CENTERS[0], 145, { align: 'center' });

    // Texto TOTAL en celda de inasistencias de la última fila (solo en 2º Cuatrimestre)
    if (esSegundo) {
      doc.setFontSize(6.5);
      doc.text('TOTAL', (LIBRETA_COL_X[8] + LIBRETA_COL_X[9]) / 2, 145, { align: 'center' });
    }

    // 7. Pie de libreta (Promedio anual y Observaciones)
    const todosPromediosCompletos = Boolean(
      esSegundo &&
      alumno.p1Leng && alumno.p1Mat && alumno.p1Soc && alumno.p1Nat && alumno.p1Art && alumno.p1Fis && alumno.p1Ext &&
      alumno.p2Leng && alumno.p2Mat && alumno.p2Soc && alumno.p2Nat && alumno.p2Art && alumno.p2Fis && alumno.p2Ext &&
      alumno.promLeng && alumno.promMat && alumno.promSoc && alumno.promNat && alumno.promArt && alumno.promFis && alumno.promExt &&
      alumno.proAnual
    );
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PROMEDIO ANUAL:', 10, 163);
    doc.setFont('helvetica', 'normal');
    if (!todosPromediosCompletos) {
      doc.text('___________________', 42, 163);
    }
    doc.setFont('helvetica', 'bold');
    doc.text('MAESTRA:', 175, 163);
    doc.setFont('helvetica', 'normal');
    doc.text(String(alumno.maestra || ''), 196, 163);

    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES:', 10, 175);
    doc.setFont('helvetica', 'normal');
    doc.text('________________________________________________________________________________________________________________________________', 42, 175);
  }

  // IMPRESIÓN DE DATOS Y CALIFICACIONES (Posicionamiento matemático exacto)
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  // Fila 1: 1º Cuatrimestre (y = 81)
  // Si es sobreimpresión del 2º Cuatrimestre, NO imprimimos fila 1 porque ya está en la hoja física
  if (!esSobreimpresion || !esSegundo) {
    if (alumno.p1Leng) doc.text(String(alumno.p1Leng), LIBRETA_COL_CENTERS[1], 81, { align: 'center' });
    if (alumno.p1Mat) doc.text(String(alumno.p1Mat), LIBRETA_COL_CENTERS[2], 81, { align: 'center' });
    if (alumno.p1Soc) doc.text(String(alumno.p1Soc), LIBRETA_COL_CENTERS[3], 81, { align: 'center' });
    if (alumno.p1Nat) doc.text(String(alumno.p1Nat), LIBRETA_COL_CENTERS[4], 81, { align: 'center' });
    if (alumno.p1Art) doc.text(String(alumno.p1Art), LIBRETA_COL_CENTERS[5], 81, { align: 'center' });
    if (alumno.p1Fis) doc.text(String(alumno.p1Fis), LIBRETA_COL_CENTERS[6], 81, { align: 'center' });
    if (alumno.p1Ext) doc.text(String(alumno.p1Ext), LIBRETA_COL_CENTERS[7], 81, { align: 'center' });
    if (alumno.injus1) doc.text(String(alumno.injus1), LIBRETA_COL_CENTERS[8], 81, { align: 'center' });
    if (alumno.inin1) doc.text(String(alumno.inin1), LIBRETA_COL_CENTERS[9], 81, { align: 'center' });
    if (alumno.cond1) doc.text(String(alumno.cond1), LIBRETA_COL_CENTERS[10], 81, { align: 'center' });
  }

  // Filas 2, 3, 4, 5 (2º Cuatrimestre y Finales):
  // Únicamente se imprimen cuando se genera el 2º Cuatrimestre
  if (esSegundo) {
    const cond2do = alumno.cond2 || "";

    // Fila 2: 2º Cuat. (y = 97)
    // <<pro2leng>> <<pro2mat>> <<pro2css>> <<pro2csn>> <<pro2art>> <<pro2fis>> <<pro2ext>> <<injus2>> <<inin2>> <<pro2ond>>
    if (alumno.p2Leng) doc.text(String(alumno.p2Leng), LIBRETA_COL_CENTERS[1], 97, { align: 'center' });
    if (alumno.p2Mat) doc.text(String(alumno.p2Mat), LIBRETA_COL_CENTERS[2], 97, { align: 'center' });
    if (alumno.p2Soc) doc.text(String(alumno.p2Soc), LIBRETA_COL_CENTERS[3], 97, { align: 'center' });
    if (alumno.p2Nat) doc.text(String(alumno.p2Nat), LIBRETA_COL_CENTERS[4], 97, { align: 'center' });
    if (alumno.p2Art) doc.text(String(alumno.p2Art), LIBRETA_COL_CENTERS[5], 97, { align: 'center' });
    if (alumno.p2Fis) doc.text(String(alumno.p2Fis), LIBRETA_COL_CENTERS[6], 97, { align: 'center' });
    if (alumno.p2Ext) doc.text(String(alumno.p2Ext), LIBRETA_COL_CENTERS[7], 97, { align: 'center' });
    if (alumno.injus2) doc.text(String(alumno.injus2), LIBRETA_COL_CENTERS[8], 97, { align: 'center' });
    if (alumno.inin2) doc.text(String(alumno.inin2), LIBRETA_COL_CENTERS[9], 97, { align: 'center' });
    if (cond2do) doc.text(String(cond2do), LIBRETA_COL_CENTERS[10], 97, { align: 'center' });

    // Fila 3: Promedio entre 1º y 2º Cuatrimestre (y = 113)
    // Se imprime el promedio de cada área únicamente si aparecen las notas de 1º y 2º Cuatrimestre en esa área
    if (alumno.p1Leng && alumno.p2Leng && alumno.promLeng) doc.text(String(alumno.promLeng), LIBRETA_COL_CENTERS[1], 113, { align: 'center' });
    if (alumno.p1Mat && alumno.p2Mat && alumno.promMat) doc.text(String(alumno.promMat), LIBRETA_COL_CENTERS[2], 113, { align: 'center' });
    if (alumno.p1Soc && alumno.p2Soc && alumno.promSoc) doc.text(String(alumno.promSoc), LIBRETA_COL_CENTERS[3], 113, { align: 'center' });
    if (alumno.p1Nat && alumno.p2Nat && alumno.promNat) doc.text(String(alumno.promNat), LIBRETA_COL_CENTERS[4], 113, { align: 'center' });
    if (alumno.p1Art && alumno.p2Art && alumno.promArt) doc.text(String(alumno.promArt), LIBRETA_COL_CENTERS[5], 113, { align: 'center' });
    if (alumno.p1Fis && alumno.p2Fis && alumno.promFis) doc.text(String(alumno.promFis), LIBRETA_COL_CENTERS[6], 113, { align: 'center' });
    if (alumno.p1Ext && alumno.p2Ext && alumno.promExt) doc.text(String(alumno.promExt), LIBRETA_COL_CENTERS[7], 113, { align: 'center' });

    // Fila 4: Febrero / Calificación Diciembre (y = 129)
    // <<prfleng>> <<profmat>> <<profcss>> <<profcsn>> <<profart>> <<proffis>> <<profext>>
    if (alumno.coloqLeng) doc.text(String(alumno.coloqLeng), LIBRETA_COL_CENTERS[1], 129, { align: 'center' });
    if (alumno.coloqMat) doc.text(String(alumno.coloqMat), LIBRETA_COL_CENTERS[2], 129, { align: 'center' });
    if (alumno.coloqSoc) doc.text(String(alumno.coloqSoc), LIBRETA_COL_CENTERS[3], 129, { align: 'center' });
    if (alumno.coloqNat) doc.text(String(alumno.coloqNat), LIBRETA_COL_CENTERS[4], 129, { align: 'center' });
    if (alumno.coloqArt) doc.text(String(alumno.coloqArt), LIBRETA_COL_CENTERS[5], 129, { align: 'center' });
    if (alumno.coloqFis) doc.text(String(alumno.coloqFis), LIBRETA_COL_CENTERS[6], 129, { align: 'center' });
    if (alumno.coloqExt) doc.text(String(alumno.coloqExt), LIBRETA_COL_CENTERS[7], 129, { align: 'center' });

    // Fila 5: Nota Final Definitiva + Total Inasistencias + Conducta Final (y = 145)
    // <<notaleng>> <<notamat>> <<notacss>> <<notacsn>> <<notaar>> <<notafis>> <<notaext>> <<TOTALFALTA>> <<pro2cond>>
    if (alumno.finalLeng) doc.text(String(alumno.finalLeng), LIBRETA_COL_CENTERS[1], 145, { align: 'center' });
    if (alumno.finalMat) doc.text(String(alumno.finalMat), LIBRETA_COL_CENTERS[2], 145, { align: 'center' });
    if (alumno.finalSoc) doc.text(String(alumno.finalSoc), LIBRETA_COL_CENTERS[3], 145, { align: 'center' });
    if (alumno.finalNat) doc.text(String(alumno.finalNat), LIBRETA_COL_CENTERS[4], 145, { align: 'center' });
    if (alumno.finalArt) doc.text(String(alumno.finalArt), LIBRETA_COL_CENTERS[5], 145, { align: 'center' });
    if (alumno.finalFis) doc.text(String(alumno.finalFis), LIBRETA_COL_CENTERS[6], 145, { align: 'center' });
    if (alumno.finalExt) doc.text(String(alumno.finalExt), LIBRETA_COL_CENTERS[7], 145, { align: 'center' });
    if (alumno.totalFaltaAnual) doc.text(String(alumno.totalFaltaAnual), LIBRETA_COL_CENTERS[9], 145, { align: 'center' });
    if (cond2do) doc.text(String(cond2do), LIBRETA_COL_CENTERS[10], 145, { align: 'center' });

    // PROMEDIO ANUAL (y = 163): Solo se muestra cuando están completos todos los promedios de todas las áreas de ambos cuatrimestres
    const puedeMostrarPromedioAnual = Boolean(
      alumno.p1Leng && alumno.p1Mat && alumno.p1Soc && alumno.p1Nat && alumno.p1Art && alumno.p1Fis && alumno.p1Ext &&
      alumno.p2Leng && alumno.p2Mat && alumno.p2Soc && alumno.p2Nat && alumno.p2Art && alumno.p2Fis && alumno.p2Ext &&
      alumno.promLeng && alumno.promMat && alumno.promSoc && alumno.promNat && alumno.promArt && alumno.promFis && alumno.promExt &&
      alumno.proAnual
    );
    if (puedeMostrarPromedioAnual) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(alumno.proAnual), 48, 163);
      doc.setFont('helvetica', 'normal');
    }
  }
}

function dibujarCaratulaExamenes(doc, alumno, escudoData) {
  // Página 2 de PDF 2: Carátula y Exámenes (A4 Landscape)
  doc.setTextColor(20, 20, 20);
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);

  // MITAD IZQUIERDA: Tabla de EXÁMENES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('EXÁMENES', 75, 27, { align: 'center' });

  const exLeft = 10;
  const exTop = 32;
  const exW = 126;
  const exCols = [32, 46, 24, 24]; // Asignatura, Condición, Fecha, Calificación (Total: 126 mm)
  const exHeaderH = 10;
  const exRowH = 9.5;
  const numRows = 11;
  const exTotalH = exHeaderH + (numRows * exRowH);

  // Marco de la tabla
  doc.rect(exLeft, exTop, exW, exTotalH);
  doc.line(exLeft, exTop + exHeaderH, exLeft + exW, exTop + exHeaderH);

  // Líneas verticales de columnas
  let curX = exLeft;
  for (let i = 0; i < exCols.length - 1; i++) {
    curX += exCols[i];
    doc.line(curX, exTop, curX, exTop + exTotalH);
  }

  // Líneas horizontales de filas
  for (let r = 1; r <= numRows; r++) {
    doc.line(exLeft, exTop + exHeaderH + (r * exRowH), exLeft + exW, exTop + exHeaderH + (r * exRowH));
  }

  // Encabezados de tabla de exámenes
  doc.setFontSize(7.5);
  doc.text('Asignatura', exLeft + exCols[0] / 2, exTop + 6.5, { align: 'center' });
  doc.text('Condición (regular/previo)', exLeft + exCols[0] + exCols[1] / 2, exTop + 6.5, { align: 'center' });
  doc.text('Fecha', exLeft + exCols[0] + exCols[1] + exCols[2] / 2, exTop + 6.5, { align: 'center' });
  doc.text('Calificación', exLeft + exCols[0] + exCols[1] + exCols[2] + exCols[3] / 2, exTop + 6.5, { align: 'center' });

  // MITAD DERECHA: Carátula Oficial
  const carX = 221;

  if (escudoData) {
    try {
      doc.addImage(escudoData, 'PNG', carX - 11.25, 15, 22.5, 31.2);
    } catch (e) {
      console.warn('Escudo carátula error:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BOLETÍN DE CALIFICACIONES', carX, 52, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('ESCUELA Nº 160 "NUESTRA SRA. DE LA MISERICORDIA"', carX, 60, { align: 'center' });

  doc.setFontSize(8);
  doc.text('ALUMNO', carX, 74, { align: 'center' });
  doc.setFontSize(9);
  doc.text(String(alumno.nombreCompleto || '').toUpperCase(), carX, 81, { align: 'center' });
  doc.line(carX - 45, 83, carX + 45, 83);

  doc.setFontSize(8);
  doc.text('DNI Nº', carX, 94, { align: 'center' });
  doc.setFontSize(9);
  doc.text(String(alumno.dni || '-'), carX, 101, { align: 'center' });
  doc.line(carX - 25, 103, carX + 25, 103);

  // Recuadro CURSO - DIVISIÓN - TURNO
  const boxW = 96;
  const boxH = 20;
  const boxLeft = carX - (boxW / 2);
  const boxTop = 112;
  doc.rect(boxLeft, boxTop, boxW, boxH);
  doc.line(boxLeft + 32, boxTop, boxLeft + 32, boxTop + boxH);
  doc.line(boxLeft + 64, boxTop, boxLeft + 64, boxTop + boxH);
  doc.line(boxLeft, boxTop + 8, boxLeft + boxW, boxTop + 8);

  doc.setFontSize(7.5);
  doc.text('CURSO', boxLeft + 16, boxTop + 5.5, { align: 'center' });
  doc.text('DIVISIÓN', boxLeft + 48, boxTop + 5.5, { align: 'center' });
  doc.text('TURNO', boxLeft + 80, boxTop + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${alumno.grado}°`, boxLeft + 16, boxTop + 15, { align: 'center' });
  doc.text(String(alumno.seccion || ''), boxLeft + 48, boxTop + 15, { align: 'center' });
  doc.text(String(alumno.turno || 'MAÑANA'), boxLeft + 80, boxTop + 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AÑO LECTIVO', carX, 142, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(String(alumno.año || new Date().getFullYear()), carX, 149, { align: 'center' });
}

// Helper activo para comunicarse con Apps Script (Google Drive y acciones del backend)
async function sendRequestToServer(action, payload) {
  const response = await fetchAppsScriptConReintento({
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: action,
      payload: payload
    })
  }, 3, API_URL);

  if (!response.ok) {
    throw new Error('Error en el servidor (' + response.status + '): ' + response.statusText);
  }

  const envelope = await response.json();
  const res = envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
    ? envelope.data
    : envelope;
  return res;
}

async function generarBoletinesPdfDesdeSupabase({ cuatri, grado, seccion, dni, actualizarProgreso }) {
  if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
    throw new Error('La biblioteca jsPDF no está cargada en la aplicación.');
  }

  const esSegundo = /(^|[^0-9])2(?:º|°|\.)?\s*(?:Cuat\.?|Cuatrimestre)/i.test(cuatri);
  const formatoSeleccionado = (document.getElementById('select-formato-boletin')?.value) || 'sobreimpresion';
  const esDiptico = formatoSeleccionado === 'oficial_diptico';
  const esSobreimpresion = formatoSeleccionado === 'sobreimpresion';

  actualizarProgreso({
    generados: 0,
    total: 0,
    estado: 'Consultando base de datos Supabase...'
  });

  const datos = await obtenerDatosCompletosBoletines(grado, seccion, esSegundo, dni);

  if (!datos.alumnos || datos.alumnos.length === 0) {
    throw new Error(`No se encontraron alumnos para emitir boletines en ${grado}° "${seccion}".`);
  }

  const { jsPDF } = window.jspdf;
  const escudoData = esSobreimpresion ? null : obtenerImagenEscudoBase64();
  const totalAlumnos = datos.alumnos.length;
  const fechaIso = new Date().toISOString().split('T')[0];
  const prefijo = esSobreimpresion ? 'Sobreimpresion' : (esDiptico ? 'LibretaCompleta' : 'LibretaOficial');
  const sufijoCuatri = esSegundo ? '2doCuat' : '1erCuat';

  // Si se solicitó la generación individual para un alumno específico
  if (dni && totalAlumnos === 1) {
    const al = datos.alumnos[0];
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    dibujarPlantillaOficialLibreta(doc, al, escudoData, formatoSeleccionado, cuatri);
    if (esDiptico) {
      doc.addPage('a4', 'landscape');
      dibujarCaratulaExamenes(doc, al, escudoData);
    }

    const dniAlumno = String(al.dni || '').trim();
    const apeAlumno = String(al.apellido || '').trim().toUpperCase();
    const nomAlumno = String(al.nombre || '').trim().toUpperCase();
    const nombreCompletoFormateado = (apeAlumno && nomAlumno)
      ? `${apeAlumno}, ${nomAlumno}`
      : (String(al.nombreCompleto || '').trim().toUpperCase() || 'ALUMNO');

    const nombreArchivo = `Boletín_${dniAlumno}_${nombreCompletoFormateado}.pdf`;

    doc.save(nombreArchivo);

    actualizarProgreso({
      generados: 1,
      total: 1,
      estado: 'Guardando boletín en Google Drive...'
    });

    let folderUrl = null;
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const driveResp = await sendRequestToServer('guardarBoletinPdfDrive', {
        grado,
        seccion,
        cuatri,
        nombreArchivo,
        pdfBase64,
        dni: al.dni,
        spreadsheetId: datos.spreadsheetId
      });
      if (driveResp && driveResp.folderUrl) {
        folderUrl = driveResp.folderUrl;
      }
    } catch (errDrive) {
      console.warn('[Boletines] No se pudo guardar en Drive:', errDrive);
    }

    return {
      success: true,
      generados: 1,
      nombreArchivo,
      folderUrl,
      message: `Boletín individual (${prefijo}) de ${al.nombreCompleto} generado y descargado.` +
        (folderUrl ? ' Guardado en Google Drive.' : '')
    };
  }

  // Generación para el curso completo (separado por alumno en cada PDF)
  if (typeof JSZip === 'undefined') {
    throw new Error('La biblioteca JSZip no está disponible para empaquetar los PDFs individuales.');
  }

  const zip = new JSZip();
  const archivosParaDrive = [];

  for (let i = 0; i < totalAlumnos; i++) {
    if (abortarGeneracionBoletines) {
      throw new Error('Generación cancelada por el usuario.');
    }

    const al = datos.alumnos[i];
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Página 1: Calificaciones de la libreta oficial
    dibujarPlantillaOficialLibreta(doc, al, escudoData, formatoSeleccionado, cuatri);

    // Página 2 (Opcional): Si eligió díptico completo con carátula y exámenes
    if (esDiptico) {
      doc.addPage('a4', 'landscape');
      dibujarCaratulaExamenes(doc, al, escudoData);
    }

    const dniAlumno = String(al.dni || '').trim();
    const apeAlumno = String(al.apellido || '').trim().toUpperCase();
    const nomAlumno = String(al.nombre || '').trim().toUpperCase();
    const nombreCompletoFormateado = (apeAlumno && nomAlumno)
      ? `${apeAlumno}, ${nomAlumno}`
      : (String(al.nombreCompleto || '').trim().toUpperCase() || 'ALUMNO');

    const nombrePdfAlumno = `Boletín_${dniAlumno}_${nombreCompletoFormateado}.pdf`;

    const pdfBlob = doc.output('blob');
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    zip.file(nombrePdfAlumno, pdfBlob);
    archivosParaDrive.push({
      nombreArchivo: nombrePdfAlumno,
      pdfBase64,
      dni: al.dni
    });

    actualizarProgreso({
      generados: i + 1,
      total: totalAlumnos,
      estado: `Generando boletín individual (${i + 1}/${totalAlumnos}): ${al.nombreCompleto}`
    });

    if (totalAlumnos > 1) {
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }

  // Subir lote de boletines a Google Drive
  actualizarProgreso({
    generados: totalAlumnos,
    total: totalAlumnos,
    estado: `Subiendo ${archivosParaDrive.length} boletines a Google Drive...`
  });

  let folderUrl = null;
  try {
    const driveResp = await sendRequestToServer('guardarBoletinesPdfDriveBatch', {
      grado,
      seccion,
      cuatri,
      archivos: archivosParaDrive,
      spreadsheetId: datos.spreadsheetId
    });
    if (driveResp && driveResp.folderUrl) {
      folderUrl = driveResp.folderUrl;
    }
  } catch (errDrive) {
    console.warn('[Boletines] Error subiendo boletines a Drive:', errDrive);
  }

  // Empaquetar y descargar ZIP con todos los PDFs individuales
  actualizarProgreso({
    generados: totalAlumnos,
    total: totalAlumnos,
    estado: `Empaquetando archivo ZIP con los ${totalAlumnos} boletines individuales...`
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const nombreZip = `Boletines_${grado}${seccion}_${sufijoCuatri}_Individuales_${fechaIso}.zip`;
  const zipUrl = URL.createObjectURL(zipBlob);
  const linkDescarga = document.createElement('a');
  linkDescarga.href = zipUrl;
  linkDescarga.download = nombreZip;
  document.body.appendChild(linkDescarga);
  linkDescarga.click();
  setTimeout(() => {
    document.body.removeChild(linkDescarga);
    URL.revokeObjectURL(zipUrl);
  }, 1000);

  return {
    success: true,
    generados: totalAlumnos,
    nombreArchivo: nombreZip,
    folderUrl,
    message: `Se generaron ${totalAlumnos} boletines individuales descargados en "${nombreZip}"` +
      (folderUrl ? ' y respaldados en la carpeta de Google Drive.' : '.')
  };
}

window.iniciarGeneracion = async function() {
  const cuatriSelect = document.getElementById('select-cuatri');
  const gradoInput = document.getElementById('input-grado');
  const seccionInput = document.getElementById('input-seccion');
  const dniInput = document.getElementById('input-dni');

  if (!cuatriSelect || !gradoInput || !seccionInput || !dniInput) {
    M.toast({html: '❌ Error interno: Inputs no encontrados.', classes: 'red'});
    return;
  }

  const cuatri = cuatriSelect.value;
  const grado = gradoInput.value.trim();
  const seccion = seccionInput.value.trim().toUpperCase();
  const dni = dniInput.value.trim();

  if (!grado || !seccion) {
    M.toast({html: '⚠️ Por favor, completa el Grado y la Sección', classes: 'orange darken-3'});
    return;
  }

  const btnGenerar = document.getElementById('btn-iniciar');
  if (btnGenerar) {
    btnGenerar.disabled = true;
    btnGenerar.innerHTML = '<i class="material-icons left">hourglass_empty</i>Generando PDF...';
  }
  document.getElementById('loader-boletines').style.display = 'block';
  const botonCancelar = document.getElementById('btn-cancelar-boletines');
  if (botonCancelar) {
    botonCancelar.style.display = 'block';
    botonCancelar.disabled = false;
    botonCancelar.innerHTML = '<i class="material-icons left">cancel</i>Cancelar proceso';
  }
  document.getElementById('status-text').textContent = dni ? 'Generando boletín individual...' : 'Consultando alumnos en Supabase...';
  reiniciarProgresoBoletines();

  // Limpiar enlace anterior de Drive si existía
  const driveContainerId = 'drive-folder-link-container';
  let driveContainer = document.getElementById(driveContainerId);
  if (driveContainer) driveContainer.innerHTML = '';

  try {
    const resultado = await generarBoletinesPdfDesdeSupabase({
      cuatri,
      grado,
      seccion,
      dni,
      actualizarProgreso: (estado) => {
        const status = document.getElementById('status-text');
        if (status) status.textContent = estado.estado || estado;
        actualizarProgresoBoletines(estado);
      }
    });

    if (btnGenerar) {
      btnGenerar.disabled = false;
      btnGenerar.innerHTML = '<i class="material-icons left">play_arrow</i>Generar Boletines';
    }
    document.getElementById('loader-boletines').style.display = 'none';
    if (botonCancelar) botonCancelar.style.display = 'none';

    document.getElementById('status-text').textContent = resultado.message;
    actualizarProgresoBoletines({
      generados: resultado.generados,
      total: resultado.generados,
      estado: resultado.message
    });

    if (resultado.folderUrl) {
      if (!driveContainer) {
        driveContainer = document.createElement('div');
        driveContainer.id = driveContainerId;
        driveContainer.style.marginTop = '12px';
        driveContainer.style.textAlign = 'center';
        const statusElem = document.getElementById('status-text');
        if (statusElem && statusElem.parentNode) {
          statusElem.parentNode.appendChild(driveContainer);
        }
      }
      driveContainer.innerHTML = `
        <a href="${resultado.folderUrl}" target="_blank" rel="noopener noreferrer" class="btn waves-effect waves-light green darken-2" style="font-weight: 500; border-radius: 6px; margin-top: 8px;">
          <i class="material-icons left">folder_shared</i>Abrir Carpeta en Google Drive
        </a>
      `;
    }

    M.toast({
      html: '✅ ' + resultado.message,
      classes: 'green darken-2',
      displayLength: 7000
    });
  } catch (error) {
    if (btnGenerar) {
      btnGenerar.disabled = false;
      btnGenerar.innerHTML = '<i class="material-icons left">play_arrow</i>Generar Boletines';
    }
    document.getElementById('loader-boletines').style.display = 'none';
    if (botonCancelar) botonCancelar.style.display = 'none';
    const errorMessage = error && error.message ? error.message : String(error);
    document.getElementById('status-text').textContent = 'Error: ' + errorMessage;
    console.error('❌ Error generando boletines:', error);
    M.toast({
      html: '❌ ' + errorMessage,
      classes: 'red darken-3',
      displayLength: 7000
    });
  }
};

window.confirmarBorrado = async function() {
  const cuatriSelect = document.getElementById('select-cuatri');
  const gradoInput = document.getElementById('input-grado');
  const seccionInput = document.getElementById('input-seccion');

  const cuatri = cuatriSelect ? cuatriSelect.value : '';
  const grado = gradoInput ? gradoInput.value.trim() : '';
  const seccion = seccionInput ? seccionInput.value.trim().toUpperCase() : '';

  if (!grado || !seccion) {
    M.toast({html: '⚠️ Por favor, selecciona el Grado y la Sección para borrar sus boletines.', classes: 'orange darken-3'});
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar de Google Drive todos los boletines de ${grado}° "${seccion}" correspondientes a "${cuatri}"?`);
  if (!confirmacion) return;

  M.toast({html: '⏳ Eliminando boletines en Google Drive...', classes: 'blue darken-2'});
  try {
    const res = await sendRequestToServer('borrarBoletinesDeCarpeta', {
      cuatri,
      grado,
      seccion,
      userEmail: (window.usuarioActual?.email || sessionStorage.getItem('misericordia_sesion') || window.currentUserEmail || 'misericordiaplanillas@gmail.com').toLowerCase().trim()
    });

    if (res && res.success) {
      M.toast({
        html: `🗑️ ${res.message || 'Boletines eliminados de Google Drive.'}`,
        classes: 'green darken-2',
        displayLength: 6000
      });
      const driveContainer = document.getElementById('drive-folder-link-container');
      if (driveContainer) driveContainer.innerHTML = '';
    } else {
      M.toast({
        html: `⚠️ ${res?.message || 'No se pudieron eliminar los boletines.'}`,
        classes: 'orange darken-3',
        displayLength: 6000
      });
    }
  } catch (err) {
    console.error('Error al borrar boletines:', err);
    M.toast({
      html: `❌ Error al borrar boletines: ${err.message || err}`,
      classes: 'red darken-3',
      displayLength: 6000
    });
  }
};
// ================================================================
// CARGADOR DINÁMICO DE MIGRACIÓN Y PASE DE GRADO
// ================================================================
function abrirModuloPaseGrado(modo) {
    modo = modo || 'pase-grado';
    if (!window.esUsuarioAdmin) {
        M.toast({html: 'No autorizado. Requiere privilegios de superusuario.', classes: 'red darken-3'});
        return;
    }

    const modalExistente = document.getElementById('modal-migracion');
    if (modalExistente && typeof window.iniciarModuloMigracion === 'function') {
        const inst = M.Modal.getInstance(modalExistente) || M.Modal.init(modalExistente);
        inst.open();
        if (typeof window.cambiarModoMigracionPrincipal === 'function') {
            window.cambiarModoMigracionPrincipal(modo);
        }
    } else {
        M.toast({html: 'Cargando módulo...', classes: 'blue darken-2', displayLength: 1500});
        const script = document.createElement('script');
        script.src = 'migracion.js?v=' + Date.now();
        script.onload = () => {
            if (typeof iniciarModuloMigracion === 'function') {
                iniciarModuloMigracion(modo);
            }
        };
        script.onerror = () => {
            M.toast({html: '❌ Error al cargar migracion.js.', classes: 'red darken-3'});
        };
        document.body.appendChild(script);
    }
}
window.abrirModuloPaseGrado = abrirModuloPaseGrado;

document.addEventListener('DOMContentLoaded', function() {
    const btnMigracion = document.getElementById('btn-abrir-migracion');
    if (btnMigracion) {
        btnMigracion.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModuloPaseGrado('cuatrimestre');
        });
    }

    const btnPaseGrado = document.getElementById('btn-abrir-pase-grado');
    if (btnPaseGrado) {
        btnPaseGrado.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModuloPaseGrado('pase-grado');
        });
    }

    const btnSyncSheets = document.getElementById('btn-abrir-sync-sheets');
    if (btnSyncSheets) {
        btnSyncSheets.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModuloPaseGrado('sync-sheets');
        });
    }
});

if (typeof window.sincronizarPlanillaActualRapido !== 'function') {
    window.sincronizarPlanillaActualRapido = function() {
        const script = document.createElement('script');
        script.src = 'migracion.js?v=' + Date.now();
        script.onload = () => {
            if (typeof window.sincronizarPlanillaActualRapido === 'function') {
                window.sincronizarPlanillaActualRapido();
            }
        };
        script.onerror = () => {
            M.toast({ html: '❌ Error al cargar el módulo de sincronización.', classes: 'red darken-3' });
        };
        document.body.appendChild(script);
    };
}

// ================================================================
// SISTEMA DE PERMISOS GRANULARES POR ÁREA Y GESTOR ADMIN
// ================================================================

function normalizarNombreArea(area) {
    const a = String(area || '').toUpperCase().trim();
    if (a.includes('DATO') || a.includes('ALUMNO')) return 'DATOS';
    if (a.includes('ASIST') || a.includes('CONDUCT')) return 'ASISTENCIA';
    if (a.includes('FISICA') || a.includes('FÍSICA')) return 'ED_FISICA';
    if (a.includes('MUSICA') || a.includes('MÚSICA')) return 'MUSICA';
    if (a.includes('PLASTICA') || a.includes('PLÁSTICA')) return 'PLASTICA';
    if (a.includes('INGLES') || a.includes('INGLÉS')) return 'INGLES';
    if (a.includes('TECNOLOGIA') || a.includes('COMPUTACION')) return 'TECNOLOGIA';
    if (a.includes('LENG')) return 'LENGUA';
    if (a.includes('MAT')) return 'MATEMATICA';
    if (a.includes('SOC')) return 'CS_SOCIALES';
    if (a.includes('NAT')) return 'CS_NATURALES';
    return a;
}

function obtenerPermisosDocenteParaPlanilla(planilla, emailDocente) {
    const emailNorm = normalizarCorreoCliente(emailDocente);
    const esAdmin = window.esUsuarioAdmin === true ||
                    emailNorm === "misericordiaplanillas@gmail.com" ||
                    emailNorm === "victorojas2025@gmail.com" ||
                    emailNorm.includes("directivo");

    if (esAdmin) {
        return { tieneTodas: true, areas: ['TODAS', 'DATOS'], soloLectura: false };
    }

    const planillasUsuario = (window.usuarioActual && Array.isArray(window.usuarioActual.planillas)) 
        ? window.usuarioActual.planillas 
        : [];

    const planillaId = planilla ? planilla.id : null;
    const planillaNombre = String((planilla && planilla.nombre) || '').toUpperCase();
    const planillaSheetId = planilla ? planilla.spreadsheet_id : null;

    // Priorizar coincidencia exacta de spreadsheet_id, luego planilla_id, luego nombre
    const asignacion = planillasUsuario.find(p => 
        (planillaSheetId && p.spreadsheet_id && p.spreadsheet_id === planillaSheetId) ||
        (planillaId && p.planilla_id && Number(p.planilla_id) === Number(planillaId)) ||
        (p.nombre && planillaNombre && (String(p.nombre).trim().toUpperCase() === planillaNombre.trim() || planillaNombre.includes(String(p.nombre).toUpperCase())))
    );

    if (asignacion) {
        const areasRaw = Array.isArray(asignacion.areas) && asignacion.areas.length > 0 ? asignacion.areas : ['TODAS'];
        const areas = areasRaw.map(normalizarNombreArea);
        return {
            tieneTodas: areas.includes('TODAS') || areas.includes('TODAS_MATERIAS'),
            areas: areas,
            soloLectura: Boolean(asignacion.solo_lectura)
        };
    }

    // Si es docente especial (su nombre de planilla incluye ESP), verificar disciplina
    const matchEsp = planillaNombre.match(/ESPs+(MÚSICA|MUSICA|ED.FÍSICA|ED.FISICA|INGLES|INGLÉS|PLASTICA|PLÁSTICA)/i);
    if (matchEsp) {
        const disc = normalizarNombreArea(matchEsp[1]);
        return {
            tieneTodas: false,
            areas: [disc],
            soloLectura: false
        };
    }

    return { tieneTodas: true, areas: ['TODAS'], soloLectura: false };
}

function filtrarCamposEditablesPorAreas(nombreHoja, editableFields, areasPermitidas, planillaNombre) {
    if (!Array.isArray(editableFields) || editableFields.length === 0) return [];

    const hojaUpper = String(nombreHoja || '').toUpperCase();
    const planUpper = String(planillaNombre || '').toUpperCase();
    const areasNorm = (Array.isArray(areasPermitidas) ? areasPermitidas : []).map(normalizarNombreArea);

    const emailActivo = (sessionStorage.getItem('misericordia_sesion') || emailProcesando || '').toLowerCase().trim();
    const esAdminODirectivo = window.esUsuarioAdmin === true ||
                              emailActivo === "misericordiaplanillas@gmail.com" ||
                              emailActivo === "victorojas2025@gmail.com" ||
                              emailActivo.includes("directivo");

    // 1. Hoja DATOS (Datos de Alumnos: Identificación, Domicilio, Tutor, etc.)
    if (hojaUpper.includes('DATOS')) {
        if (esAdminODirectivo) return editableFields;
        return areasNorm.includes('DATOS') ? editableFields : [];
    }

    // Si es administrador o directivo, tiene acceso completo a todas las materias
    if (esAdminODirectivo) return editableFields;

    // Si el docente tiene habilitadas todas las materias curriculares
    const tieneTodasMaterias = areasNorm.includes('TODAS') || areasNorm.includes('TODAS_MATERIAS');
    if (tieneTodasMaterias) return editableFields;

    // 2. Hojas de materias individuales regulares
    if (hojaUpper.includes('LENG') && !hojaUpper.includes('BOLETIN')) {
        return areasNorm.includes('LENGUA') ? editableFields : [];
    }
    if (hojaUpper.includes('MAT') && !hojaUpper.includes('BOLETIN')) {
        return areasNorm.includes('MATEMATICA') ? editableFields : [];
    }
    if ((hojaUpper.includes('CS.SOCIALES') || hojaUpper.includes('SOCIALES') || hojaUpper.includes('CSS')) && !hojaUpper.includes('BOLETIN')) {
        return areasNorm.includes('CS_SOCIALES') ? editableFields : [];
    }
    if ((hojaUpper.includes('CS.NATURALES') || hojaUpper.includes('NATURALES') || hojaUpper.includes('CSN')) && !hojaUpper.includes('BOLETIN')) {
        return areasNorm.includes('CS_NATURALES') ? editableFields : [];
    }

    // 3. Planillas dedicadas de materias especiales (ej: PLANILLAS ESP INGLES 6TO I)
    // No tienen división de áreas: la planilla completa es para esa materia especial (solo lectura o escritura)
    if (planUpper.includes('ESP') || planUpper.includes('ESPECIAL')) {
        return editableFields;
    }

    // 4. Hoja NOTAS_ÁREAS_ESPECIALES en cursos regulares
    if (hojaUpper.includes('NOTAS_ÁREAS_ESPECIALES') || hojaUpper.includes('NOTAS_AREAS_ESPECIALES')) {
        return editableFields.filter(header => {
            const h = String(header || '').toUpperCase();
            if (h.includes('FÍSICA') || h.includes('FISICA')) return areasNorm.includes('ED_FISICA');
            if (h.includes('MÚSICA') || h.includes('MUSICA')) return areasNorm.includes('MUSICA');
            if (h.includes('INGLES') || h.includes('INGLÉS')) return areasNorm.includes('INGLES');
            if (h.includes('PLASTICA') || h.includes('PLÁSTICA') || h.includes('ARTISTICA')) return areasNorm.includes('PLASTICA');
            if (h.includes('TECNOLOGIA') || h.includes('COMPUTACION')) return areasNorm.includes('TECNOLOGIA');
            return false;
        });
    }

    // 5. Datos identificatorios, asistencia y conducta
    if (hojaUpper.includes('DATOS')) {
        return areasNorm.includes('DATOS') ? editableFields : [];
    }
    if (hojaUpper.includes('ASISTENCIA') || hojaUpper.includes('CONDUCTA')) {
        if (esAdminODirectivo) return editableFields;
        return (areasNorm.includes('ASISTENCIA') || areasNorm.includes('TODAS')) ? editableFields : [];
    }
    if (hojaUpper.includes('ASISTENCIA') || hojaUpper.includes('CONDUCTA')) {
        const esDocenteEspecialPuro = !areasNorm.some(a => ['LENGUA', 'MATEMATICA', 'CS_SOCIALES', 'CS_NATURALES', 'DATOS'].includes(a));
        if (esDocenteEspecialPuro) return []; // Los especiales no modifican asistencia
        return editableFields;
    }

    // 5. Boletines consolidados (BOLETINES_CALIFICACIONES o BOLETINES_CALIFICACIONES_2DO)
    if (hojaUpper.includes('BOLETIN')) {
        return editableFields.filter(header => {
            const h = String(header || '').toUpperCase();
            if (h.includes('LENGUA') || h.includes('LENG.') || h.includes('LECT')) return areasNorm.includes('LENGUA');
            if (h.includes('MATEMÁTICA') || h.includes('MATEMATICA') || h.includes('CÁLC') || h.includes('PROB')) return areasNorm.includes('MATEMATICA');
            if (h.includes('CS.SOCIALES') || h.includes('SOCIALES') || h.includes('CSS')) return areasNorm.includes('CS_SOCIALES');
            if (h.includes('CS.NATURALES') || h.includes('NATURALES') || h.includes('CSN')) return areasNorm.includes('CS_NATURALES');
            if (h.includes('FÍSICA') || h.includes('FISICA')) return areasNorm.includes('ED_FISICA');
            if (h.includes('EXTRANJERA') || h.includes('INGLES') || h.includes('INGLÉS')) return areasNorm.includes('INGLES');
            if (h.includes('ARTISTICA') || h.includes('ARTÍSTICA')) {
                return areasNorm.includes('MUSICA') || areasNorm.includes('PLASTICA');
            }
            if (h.includes('MÚSICA') || h.includes('MUSICA')) return areasNorm.includes('MUSICA');
            if (h.includes('PLASTICA') || h.includes('PLÁSTICA')) return areasNorm.includes('PLASTICA');
            if (h.includes('TECNOLOGIA')) return areasNorm.includes('TECNOLOGIA');
            return false;
        });
    }

    return editableFields;
}

// -------------------------------------------------------------
// CONTROLADOR DE UI: MODAL GESTOR DE PERMISOS DE DOCENTES (ADMIN)
// -------------------------------------------------------------
window.docenteSeleccionadoPermisos = null;
window.planillasDocentePermisos = [];


// =========================================================================
// CONSOLIDACIÓN Y PROPAGACIÓN DE NOTAS DE MATERIAS ESPECIALES
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

async function propagarLoteNotasEspecialesACursoRegular(nombrePlanillaEspecial, cambiosOItems, correo) {
    if (!nombrePlanillaEspecial || !Array.isArray(cambiosOItems) || cambiosOItems.length === 0) return;
    const infoEsp = parsePlanillaInfo(nombrePlanillaEspecial);
    if (!infoEsp.esEspecial || !infoEsp.materia || !infoEsp.grado || !infoEsp.seccion) return;

    try {
        // 1. Buscar la planilla regular de este grado, sección y cuatrimestre
        const { data: regCandidates } = await supabaseClient
            .from('planillas')
            .select('id, nombre')
            .not('nombre', 'ilike', '%ESP%')
            .ilike('nombre', `%${infoEsp.grado}%`)
            .ilike('nombre', `%${infoEsp.seccion}%`);

        const regPlanilla = (regCandidates || []).find(p => {
            const info = parsePlanillaInfo(p.nombre);
            return !info.esEspecial && info.grado === infoEsp.grado && info.seccion === infoEsp.seccion && info.esSegundo === infoEsp.esSegundo;
        });

        if (!regPlanilla) return;

        // 2. Obtener hojas de la planilla regular
        const { data: regHojas } = await supabaseClient
            .from('planilla_hojas')
            .select('*')
            .eq('planilla_id', regPlanilla.id);

        if (!Array.isArray(regHojas) || regHojas.length === 0) return;

        const hojasDestino = [];
        regHojas.forEach(h => {
            const col = mapearColumnaMateriaEspecial(h.all_headers, infoEsp.materia, h.nombre_hoja);
            if (col) {
                hojasDestino.push({
                    nombreHoja: h.nombre_hoja,
                    columna: col
                });
            }
        });

        if (hojasDestino.length === 0) return;

        // 3. Procesar cada alumno actualizado
        for (const item of cambiosOItems) {
            const dni = String(item.dni || item.alumno_dni || '').trim();
            if (!dni) continue;

            let valoresEspecial = null;
            if (item.dataBatch) {
                const hojaKey = Object.keys(item.dataBatch).find(k => /ESPECIAL/i.test(k)) || Object.keys(item.dataBatch)[0];
                valoresEspecial = item.dataBatch[hojaKey];
            } else if (item.valores) {
                valoresEspecial = item.valores;
            }

            if (!valoresEspecial) continue;
            const notaFinal = extraerNotaFinalEspecial(valoresEspecial);

            for (const dest of hojasDestino) {
                const { data: cExistente } = await supabaseClient
                    .from('calificaciones')
                    .select('valores')
                    .eq('planilla_id', regPlanilla.id)
                    .eq('alumno_dni', dni)
                    .eq('nombre_hoja', dest.nombreHoja)
                    .limit(1);

                const valoresAntesReg = (cExistente && cExistente[0] && cExistente[0].valores) ? { ...cExistente[0].valores } : {};
                const viejoVal = valoresAntesReg[dest.columna] !== undefined && valoresAntesReg[dest.columna] !== null
                    ? String(valoresAntesReg[dest.columna]).trim()
                    : '';
                const nuevoVal = notaFinal !== undefined && notaFinal !== null ? String(notaFinal).trim() : '';
                const valoresReg = { ...valoresAntesReg, [dest.columna]: notaFinal };

                await supabaseClient.from('calificaciones').upsert({
                    planilla_id: regPlanilla.id,
                    alumno_dni: dni,
                    nombre_hoja: dest.nombreHoja,
                    valores: valoresReg,
                    updated_by: correo || 'propagacion_automatica_especial',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });

                if (viejoVal !== nuevoVal && !/BOLETIN/i.test(dest.nombreHoja)) {
                    try {
                        const textoLegibleProp = `${dest.columna}: "${viejoVal}" ➔ "${nuevoVal}"`;
                        const snapshotProp = typeof window.codificarCambiosConSnapshot === 'function'
                            ? window.codificarCambiosConSnapshot(textoLegibleProp, {
                                tipo: 'CALIFICACIONES',
                                planilla_id: regPlanilla.id,
                                nombre_planilla: regPlanilla.nombre,
                                dni: dni,
                                hoja: dest.nombreHoja,
                                antes: valoresAntesReg,
                                despues: valoresReg,
                                campos: { [dest.columna]: { antes: viejoVal, despues: nuevoVal } }
                            })
                            : textoLegibleProp;
                        await getAuditSupabaseClient().from('auditoria').insert({
                            usuario: correo || 'propagacion_automatica_especial',
                            planilla_id: String(regPlanilla.id),
                            nombre_planilla: regPlanilla.nombre,
                            hoja: dest.nombreHoja,
                            dni_alumno: dni,
                            cambios: snapshotProp
                        });
                    } catch (eAudProp) {
                        console.warn('[Supabase Especiales] Aviso registrando auditoría de propagación:', eAudProp);
                    }
                }
            }
        }
        console.log(`[Supabase Especiales] Propagadas ${cambiosOItems.length} notas de ${infoEsp.materia} desde ${nombrePlanillaEspecial} hacia ${regPlanilla.nombre}.`);
    } catch (errProp) {
        console.warn('[Supabase Especiales] Aviso propagando notas especiales al curso regular:', errProp);
    }
}


window.abrirModalPermisosDocentes = async function() {
    if (!window.esUsuarioAdmin) {
        M.toast({ html: 'Solo los administradores pueden gestionar permisos.', classes: 'red darken-2' });
        return;
    }

    const select = document.getElementById('select-docente-permisos');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Cargando lista de docentes...</option>';
    document.getElementById('contenedor-edicion-permisos').style.display = 'none';
    document.getElementById('badge-tipo-usuario').style.display = 'none';
    document.getElementById('btn-guardar-permisos-docente').disabled = true;

    const modalElem = document.getElementById('modal-permisos-usuarios');
    const modalInst = M.Modal.getInstance(modalElem) || M.Modal.init(modalElem);
    modalInst.open();

    try {
        const [resUsuarios, resDocPlanillas] = await Promise.all([
            supabaseClient.from('app_adm_config').select('*').order('id', { ascending: true }),
            supabaseClient.from('docente_planillas').select('docente_email, solo_lectura, planillas(id, nombre, spreadsheet_id, activo)')
        ]);

        if (resUsuarios.error) throw resUsuarios.error;

        const usuariosRaw = resUsuarios.data || [];
        const docentePlanillasRaw = resDocPlanillas.data || [];

        // Agrupar asignaciones existentes de docente_planillas por correo
        const asignacionesPorDocente = new Map();
        docentePlanillasRaw.forEach(dp => {
            const e = normalizarCorreoCliente(dp.docente_email);
            if (!e || !dp.planillas || dp.planillas.activo === false) return;
            if (!asignacionesPorDocente.has(e)) asignacionesPorDocente.set(e, []);
            asignacionesPorDocente.get(e).push({
                id: dp.planillas.spreadsheet_id || String(dp.planillas.id),
                planilla_id: dp.planillas.id,
                nombre: dp.planillas.nombre,
                spreadsheet_id: dp.planillas.spreadsheet_id,
                solo_lectura: Boolean(dp.solo_lectura),
                soloLectura: Boolean(dp.solo_lectura),
                areas: ['TODAS']
            });
        });

        // Deduplicar usuarios por email y consolidar sus planillas de todas las filas en app_adm_config
        const columnasClavePosibles = ['clave', 'Contraseña', 'contrasena', 'contraseña', 'password', 'Password'];
        const usuariosMap = new Map();
        usuariosRaw.forEach(u => {
            const emailNorm = normalizarCorreoCliente(u.email || u.Email || '');
            if (!emailNorm) return;

            const claveFila = extraerClaveUsuario(u);
            const columnaClaveDetectada = columnasClavePosibles.find(col => Object.prototype.hasOwnProperty.call(u, col)) || 'clave';

            let planillasUsuario = [];
            if (Array.isArray(u.planillas)) {
                planillasUsuario = u.planillas;
            } else if (typeof u.planillas === 'string') {
                try { planillasUsuario = JSON.parse(u.planillas); } catch(e) { planillasUsuario = []; }
            }

            if (!usuariosMap.has(emailNorm)) {
                usuariosMap.set(emailNorm, {
                    id: u.id,
                    email: emailNorm,
                    es_admin: Boolean(u.es_admin),
                    clave: claveFila,
                    claveColumna: columnaClaveDetectada,
                    planillas: [...planillasUsuario]
                });
            } else {
                const existente = usuariosMap.get(emailNorm);
                if (u.es_admin) existente.es_admin = true;
                if (!existente.clave && claveFila) {
                    existente.clave = claveFila;
                    existente.claveColumna = columnaClaveDetectada;
                }
                if (planillasUsuario.length > 0) {
                    if (existente.planillas.length === 0) {
                        existente.planillas = [...planillasUsuario];
                    } else {
                        planillasUsuario.forEach(p => {
                            const yaExiste = existente.planillas.some(ep => 
                                (ep.planilla_id && p.planilla_id && ep.planilla_id === p.planilla_id) ||
                                (ep.nombre && p.nombre && ep.nombre === p.nombre)
                            );
                            if (!yaExiste) existente.planillas.push(p);
                        });
                    }
                }
            }
        });

        // Complementar con asignaciones existentes en docente_planillas si hiciera falta
        usuariosMap.forEach((u, email) => {
            const desdeDocentePlanillas = asignacionesPorDocente.get(email) || [];
            if (u.planillas.length === 0 && desdeDocentePlanillas.length > 0) {
                u.planillas = [...desdeDocentePlanillas];
            } else if (desdeDocentePlanillas.length > 0) {
                desdeDocentePlanillas.forEach(dp => {
                    const yaExiste = u.planillas.some(ep => 
                        (ep.planilla_id && dp.planilla_id && ep.planilla_id === dp.planilla_id) ||
                        (ep.nombre && dp.nombre && ep.nombre === dp.nombre)
                    );
                    if (!yaExiste) u.planillas.push(dp);
                });
            }

            // Normalizar las planillas para que siempre tengan campos consistentes
            u.planillas = u.planillas.map(p => ({
                ...p,
                id: p.id || p.spreadsheet_id || (p.planilla_id ? String(p.planilla_id) : '') || p.nombre,
                planilla_id: p.planilla_id || p.id,
                solo_lectura: Boolean(p.solo_lectura || p.soloLectura),
                soloLectura: Boolean(p.solo_lectura || p.soloLectura),
                areas: Array.isArray(p.areas) && p.areas.length > 0 ? p.areas : ['TODAS']
            }));
        });

        const listaUsuariosDeduplicados = Array.from(usuariosMap.values()).sort((a, b) => a.email.localeCompare(b.email));

        window.listaDocentesConfigCache = listaUsuariosDeduplicados;

        select.innerHTML = '<option value="" disabled selected>-- Elige un docente o usuario (' + listaUsuariosDeduplicados.length + ') --</option>';

        listaUsuariosDeduplicados.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.email;
            const cantPlanillas = u.planillas.length;
            const rolTxt = u.es_admin ? ' (Administrador)' : (cantPlanillas > 0 ? ' (' + cantPlanillas + ' planillas)' : '');
            opt.textContent = u.email + rolTxt;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="" disabled>Error cargando usuarios: ' + err.message + '</option>';
    }
};

window.abiertosEditoresMaterias = new Set();

function esUsuarioPlanillasEspeciales(usuario, planillas) {
    if (!usuario) return false;
    const planes = Array.isArray(planillas) ? planillas : (Array.isArray(usuario.planillas) ? usuario.planillas : []);
    if (planes.length > 0) {
        return planes.every(p => esPlanillaEspecialSeleccionada(p.nombre));
    }
    const emailNorm = String(usuario.email || usuario.Email || '').toLowerCase();
    const areas = Array.isArray(usuario.areas) ? usuario.areas : [];
    return areas.includes('ESPECIALES') || emailNorm.includes('miss') || emailNorm.includes('ingles') || emailNorm.includes('musica') || emailNorm.includes('fisica');
}

window.cargarDocenteEnGestorPermisos = function(email) {
    if (!email || !window.listaDocentesConfigCache) return;

    const usuario = window.listaDocentesConfigCache.find(u => u.email === email);
    if (!usuario) return;

    window.docenteSeleccionadoPermisos = usuario;
    window.planillasDocentePermisos = Array.isArray(usuario.planillas) ? JSON.parse(JSON.stringify(usuario.planillas)) : [];
    if (window.planillasDocentePermisos.length > 0) {
        window.planillasDocentePermisos.sort(compararPlanillasParaDocente);
    }
    window.abiertosEditoresMaterias = new Set();

    const inputClave = document.getElementById('input-clave-docente-permisos');
    const badgeClave = document.getElementById('badge-estado-clave-docente');
    const btnToggleClave = document.getElementById('btn-toggle-visibilidad-clave');
    if (inputClave) {
        inputClave.type = 'text';
        inputClave.value = usuario.clave || '';
    }
    if (btnToggleClave) {
        btnToggleClave.innerHTML = '<i class="material-icons" style="font-size: 18px;">visibility_off</i>';
    }
    if (badgeClave) {
        badgeClave.textContent = usuario.clave ? 'Clave actual cargada' : 'Sin clave configurada';
        badgeClave.style.color = usuario.clave ? '#5b21b6' : '#c2410c';
    }

    const badge = document.getElementById('badge-tipo-usuario');
    const esDocenteEspecial = esUsuarioPlanillasEspeciales(usuario, window.planillasDocentePermisos);
    const panelAsignacionRapida = document.getElementById('panel-asignacion-rapida-masiva');

    if (panelAsignacionRapida) {
        panelAsignacionRapida.style.display = esDocenteEspecial ? 'none' : 'block';
    }

    if (usuario.es_admin) {
        badge.style.display = 'block';
        badge.style.background = '#e8f5e9';
        badge.style.color = '#2e7d32';
        badge.innerHTML = '<i class="material-icons tiny">verified_user</i> Administrador General';
    } else if (esDocenteEspecial) {
        badge.style.display = 'block';
        badge.style.background = '#e0f2f1';
        badge.style.color = '#004d40';
        badge.innerHTML = '<i class="material-icons tiny">star</i> Materias Especiales';
    } else {
        badge.style.display = 'block';
        badge.style.background = '#e3f2fd';
        badge.style.color = '#1565c0';
        badge.innerHTML = '<i class="material-icons tiny">person</i> Docente de Grado';
    }

    // Configurar Checkboxes del panel rápido superior según las áreas más comunes
    const areasDocente = new Set();
    window.planillasDocentePermisos.forEach(p => {
        (p.areas || []).forEach(a => areasDocente.add(normalizarNombreArea(a)));
    });

    const esTodas = areasDocente.has('TODAS') || (areasDocente.size === 0 && window.planillasDocentePermisos.length === 0);
    if (document.getElementById('chk-area-todas')) document.getElementById('chk-area-todas').checked = esTodas;
    if (document.getElementById('chk-area-datos')) document.getElementById('chk-area-datos').checked = areasDocente.has('DATOS');
    if (document.getElementById('chk-area-asistencia')) document.getElementById('chk-area-asistencia').checked = esTodas || areasDocente.has('ASISTENCIA');
    if (document.getElementById('chk-area-lengua')) document.getElementById('chk-area-lengua').checked = esTodas || areasDocente.has('LENGUA');
    if (document.getElementById('chk-area-matematica')) document.getElementById('chk-area-matematica').checked = esTodas || areasDocente.has('MATEMATICA');
    if (document.getElementById('chk-area-sociales')) document.getElementById('chk-area-sociales').checked = esTodas || areasDocente.has('CS_SOCIALES');
    if (document.getElementById('chk-area-naturales')) document.getElementById('chk-area-naturales').checked = esTodas || areasDocente.has('CS_NATURALES');
    
    const tieneEsp = esTodas || areasDocente.has('ESPECIALES');
    if (document.getElementById('chk-area-ed-fisica')) document.getElementById('chk-area-ed-fisica').checked = tieneEsp || areasDocente.has('ED_FISICA');
    if (document.getElementById('chk-area-musica')) document.getElementById('chk-area-musica').checked = tieneEsp || areasDocente.has('MUSICA');
    if (document.getElementById('chk-area-plastica')) document.getElementById('chk-area-plastica').checked = tieneEsp || areasDocente.has('PLASTICA');
    if (document.getElementById('chk-area-ingles')) document.getElementById('chk-area-ingles').checked = tieneEsp || areasDocente.has('INGLES');
    if (document.getElementById('chk-area-tecnologia')) document.getElementById('chk-area-tecnologia').checked = tieneEsp || areasDocente.has('TECNOLOGIA');

    window.toggleTodasLasAreas(esTodas);
    window.renderizarTablaPlanillasDocente();

    document.getElementById('contenedor-edicion-permisos').style.display = 'block';
    document.getElementById('btn-guardar-permisos-docente').disabled = false;
};

window.toggleTodasLasAreas = function(isTodas) {
    const individuales = document.querySelectorAll('.chk-area-individual');
    individuales.forEach(chk => {
        if (chk.id === 'chk-area-datos') return; // El permiso de datos se mantiene independiente
        if (isTodas) {
            chk.checked = true;
            chk.disabled = true;
        } else {
            chk.disabled = false;
        }
    });
};

window.renderizarTablaPlanillasDocente = function() {
    const tbody = document.getElementById('tbody-planillas-docente');
    if (!tbody) return;

    if (Array.isArray(window.planillasDocentePermisos) && window.planillasDocentePermisos.length > 0) {
        window.planillasDocentePermisos.sort(compararPlanillasParaDocente);
    }

    const panelAsignacionRapida = document.getElementById('panel-asignacion-rapida-masiva');
    if (panelAsignacionRapida && window.docenteSeleccionadoPermisos) {
        const esDocenteEspecial = typeof esUsuarioPlanillasEspeciales === 'function'
            ? esUsuarioPlanillasEspeciales(window.docenteSeleccionadoPermisos, window.planillasDocentePermisos)
            : false;
        panelAsignacionRapida.style.display = esDocenteEspecial ? 'none' : 'block';
    }

    if (!window.planillasDocentePermisos || window.planillasDocentePermisos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="center-align grey-text" style="padding: 32px;">Sin planillas asignadas. Haz clic en "Asignar Nuevo Grado/Planilla" para agregar una.</td></tr>';
        return;
    }

    const materiasDisponibles = [
        { key: 'LENGUA', label: 'Lengua', icon: '📝' },
        { key: 'MATEMATICA', label: 'Matemática', icon: '🔢' },
        { key: 'CS_SOCIALES', label: 'Cs. Sociales', icon: '🌍' },
        { key: 'CS_NATURALES', label: 'Cs. Naturales', icon: '🔬' },
        { key: 'ED_FISICA', label: 'Ed. Física', icon: '🏃' },
        { key: 'MUSICA', label: 'Música', icon: '🎵' },
        { key: 'PLASTICA', label: 'Plástica', icon: '🎨' },
        { key: 'INGLES', label: 'Inglés', icon: '🌐' },
        { key: 'TECNOLOGIA', label: 'Tecnología', icon: '💻' }
    ];

    tbody.innerHTML = '';
    window.planillasDocentePermisos.forEach((p, idx) => {
        p.areas = Array.isArray(p.areas) && p.areas.length > 0 ? p.areas : ['TODAS'];
        const areasNorm = p.areas.map(normalizarNombreArea);
        const tieneDatos = areasNorm.includes('DATOS');
        const tieneTodas = areasNorm.includes('TODAS') || areasNorm.includes('TODAS_MATERIAS');
        const tieneAsistencia = tieneTodas || areasNorm.includes('ASISTENCIA');

        let resumenMateriasHtml = '';
        if (tieneDatos) {
            resumenMateriasHtml += '<span class="chip green lighten-4 green-text text-darken-4" style="font-size: 11.5px; height: 22px; line-height: 22px; margin: 1px 3px; padding: 0 8px; font-weight: 700; border: 1px solid #a5d6a7;">👤 Datos</span>';
        }
        if (tieneAsistencia) {
            resumenMateriasHtml += '<span class="chip amber lighten-4 amber-text text-darken-4" style="font-size: 11.5px; height: 22px; line-height: 22px; margin: 1px 3px; padding: 0 8px; font-weight: 700; border: 1px solid #ffe082;">📅 Asistencia y Conducta</span>';
        }
        if (tieneTodas) {
            resumenMateriasHtml += '<span class="chip purple lighten-5 purple-text text-darken-3" style="font-size: 11.5px; height: 22px; line-height: 22px; margin: 1px 3px; padding: 0 8px; border: 1px solid #d1c4e9;">🌟 Todas las materias</span>';
        } else {
            const materiasActivas = materiasDisponibles.filter(m => areasNorm.includes(m.key));
            if (materiasActivas.length === 0 && !tieneDatos) {
                resumenMateriasHtml = '<span class="grey-text" style="font-size: 11.5px; font-style: italic;">Sin áreas seleccionadas</span>';
            } else {
                resumenMateriasHtml += materiasActivas.map(m => 
                    `<span class="chip blue lighten-5 blue-text text-darken-4" style="font-size: 11px; height: 22px; line-height: 22px; margin: 1px 3px; padding: 0 8px; border: 1px solid #bbdefb;">${m.icon} ${m.label}</span>`
                ).join('');
            }
        }

        const editorAbierto = Boolean(window.abiertosEditoresMaterias && window.abiertosEditoresMaterias.has(idx));

        const esEspecial = esPlanillaEspecialSeleccionada(p.nombre);

        const tr = document.createElement('tr');
        tr.style.background = editorAbierto ? '#fbf8fd' : (esEspecial ? '#f9fbfb' : '');

        const celdaDatosHtml = esEspecial
            ? `<span style="color: #9e9e9e; font-size: 12.5px; font-style: italic;">—</span>`
            : `<label style="cursor: pointer; margin: 0; display: inline-flex; align-items: center; white-space: nowrap;">
                    <input type="checkbox" class="filled-in" ${tieneDatos ? 'checked' : ''} onchange="window.cambiarDatosPlanillaDocente(${idx}, this.checked)" />
                    <span style="font-size: 12.5px; font-weight: bold; white-space: nowrap; color: ${tieneDatos ? '#1b5e20' : '#757575'};">
                        ${tieneDatos ? '✓ Datos Habilitado' : '✕ Sin Datos'}
                    </span>
                </label>`;

        const celdaMateriasHtml = esEspecial
            ? `<div style="display: flex; align-items: center; gap: 8px;">
                    <span class="chip teal lighten-5 teal-text text-darken-4" style="font-size: 11.5px; height: 24px; line-height: 24px; margin: 0; padding: 0 10px; font-weight: 600; border: 1px solid #b2dfdb;">
                        <i class="material-icons tiny left" style="margin-right: 4px; font-size: 14px;">auto_stories</i> Planilla Especial (Sin áreas)
                    </span>
               </div>`
            : `<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center;">${resumenMateriasHtml}</div>
                    <button type="button" class="btn-flat btn-small purple-text text-darken-3 waves-effect" onclick="window.toggleEditorMateriasPlanilla(${idx})" style="padding: 0 10px; height: 26px; line-height: 26px; font-size: 11.5px; border: 1px solid #ce93d8; border-radius: 4px; text-transform: none; white-space: nowrap;">
                        <i class="material-icons tiny left" style="margin-right: 3px;">tune</i> ${editorAbierto ? 'Ocultar ▲' : 'Configurar Áreas / Materias ▾'}
                    </button>
               </div>`;

        tr.innerHTML = `
            <td style="padding: 10px 14px; font-weight: 600; color: #263238; font-size: 13.5px;">
                ${p.nombre || ('Planilla ID: ' + p.planilla_id)}
                ${esEspecial ? '<span class="new badge teal darken-1" data-badge-caption="" style="margin-left: 8px; font-size: 10px; font-weight: 600; border-radius: 4px;">Especial</span>' : ''}
            </td>
            <td style="padding: 10px 14px; text-align: center; white-space: nowrap;">
                ${celdaDatosHtml}
            </td>
            <td style="padding: 10px 14px;">
                ${celdaMateriasHtml}
            </td>
            <td style="padding: 10px 14px; text-align: center; white-space: nowrap;">
                <label style="cursor: pointer; margin: 0; display: inline-flex; align-items: center; white-space: nowrap;">
                    <input type="checkbox" class="filled-in" ${p.solo_lectura ? 'checked' : ''} onchange="window.cambiarSoloLecturaPlanillaDocente(${idx}, this.checked); window.renderizarTablaPlanillasDocente();" />
                    <span style="font-size: 12px; font-weight: bold; white-space: nowrap; color: ${p.solo_lectura ? '#c62828' : '#2e7d32'};">
                        ${p.solo_lectura ? '🔒 Solo lectura' : '✏️ Lectura/Escritura'}
                    </span>
                </label>
            </td>
            <td style="padding: 10px 14px; text-align: center;">
                <button type="button" class="btn-flat btn-floating btn-small waves-effect red-text" onclick="window.eliminarPlanillaDocente(${idx})" title="Desasignar este grado">
                    <i class="material-icons" style="font-size: 1.25rem;">delete</i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);

        // Sub-fila desplegable solo para planillas regulares (las especiales no tienen áreas)
        if (editorAbierto && !esEspecial) {
            const trEditor = document.createElement('tr');
            trEditor.id = `fila-editor-materias-${idx}`;
            trEditor.style.background = '#f3e5f5';

            let checkboxesHtml = `
                <label class="chk-pill-label" style="background: #f3e5f5; border-color: #ab47bc; margin: 3px 6px;">
                    <input type="checkbox" class="filled-in" ${tieneTodas ? 'checked' : ''} onchange="window.cambiarMateriaPlanillaDocente(${idx}, 'TODAS', this.checked)" />
                    <span style="font-weight: bold; color: #4a148c; font-size: 12px;">🌟 Todas las Materias</span>
                </label>
                <label class="chk-pill-label" style="background: #e8f5e9; border-color: #81c784; margin: 3px 6px;">
                    <input type="checkbox" class="filled-in" ${tieneDatos ? 'checked' : ''} onchange="window.cambiarMateriaPlanillaDocente(${idx}, 'DATOS', this.checked)" />
                    <span style="font-weight: 700; color: #1b5e20; font-size: 12px;">👤 Área de Datos (Alumnos)</span>
                </label>
                <label class="chk-pill-label" style="background: #fff8e1; border-color: #ffe082; margin: 3px 6px;">
                    <input type="checkbox" class="filled-in" ${tieneAsistencia ? 'checked' : ''} onchange="window.cambiarMateriaPlanillaDocente(${idx}, 'ASISTENCIA', this.checked)" />
                    <span style="font-weight: 700; color: #f57f17; font-size: 12px;">📅 Asistencia y Conducta</span>
                </label>
            `;

            materiasDisponibles.forEach(m => {
                const checked = tieneTodas || areasNorm.includes(m.key);
                checkboxesHtml += `
                    <label class="chk-pill-label" style="margin: 3px 6px;">
                        <input type="checkbox" class="filled-in" ${checked ? 'checked' : ''} ${tieneTodas ? 'disabled' : ''} onchange="window.cambiarMateriaPlanillaDocente(${idx}, '${m.key}', this.checked)" />
                        <span style="font-size: 12px; color: #263238;">${m.icon} ${m.label}</span>
                    </label>
                `;
            });

            trEditor.innerHTML = `
                <td colspan="5" style="padding: 12px 20px; border-top: 1px dashed #ab47bc; border-bottom: 2px solid #ce93d8;">
                    <div style="font-size: 12.5px; font-weight: bold; color: #4a148c; margin-bottom: 8px;">
                        ✏️ Selecciona qué áreas y materias puede editar el docente en <u>${p.nombre}</u>:
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                        ${checkboxesHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(trEditor);
        }
    });
};

window.cambiarDatosPlanillaDocente = function(idx, tieneDatos) {
    const p = window.planillasDocentePermisos[idx];
    if (!p) return;
    p.areas = Array.isArray(p.areas) && p.areas.length > 0 ? p.areas : ['TODAS'];

    if (tieneDatos) {
        if (!p.areas.includes('DATOS')) {
            p.areas.push('DATOS');
        }
    } else {
        p.areas = p.areas.filter(a => a !== 'DATOS');
        if (p.areas.includes('TODAS')) {
            p.areas = ['TODAS_MATERIAS'];
        }
    }
    window.renderizarTablaPlanillasDocente();
};

window.cambiarMateriaPlanillaDocente = function(idx, materia, checked) {
    const p = window.planillasDocentePermisos[idx];
    if (!p) return;
    p.areas = Array.isArray(p.areas) && p.areas.length > 0 ? p.areas : ['TODAS'];

    if (materia === 'DATOS') {
        window.cambiarDatosPlanillaDocente(idx, checked);
        return;
    }
    if (materia === 'ASISTENCIA') {
        const tieneDatos = p.areas.includes('DATOS');
        if (checked) {
            if (!p.areas.includes('ASISTENCIA')) p.areas.push('ASISTENCIA');
        } else {
            p.areas = p.areas.filter(a => normalizarNombreArea(a) !== 'ASISTENCIA');
            if (p.areas.includes('TODAS') || p.areas.includes('TODAS_MATERIAS')) {
                const todasLasMaterias = ['LENGUA', 'MATEMATICA', 'CS_SOCIALES', 'CS_NATURALES', 'ED_FISICA', 'MUSICA', 'PLASTICA', 'INGLES', 'TECNOLOGIA'];
                p.areas = [...todasLasMaterias];
                if (tieneDatos) p.areas.push('DATOS');
            }
        }
        window.renderizarTablaPlanillasDocente();
        return;
    }

    const tieneDatos = p.areas.includes('DATOS');

    if (materia === 'TODAS') {
        if (checked) {
            p.areas = tieneDatos ? ['TODAS', 'DATOS'] : ['TODAS'];
        } else {
            p.areas = tieneDatos ? ['DATOS'] : [];
        }
    } else {
        if (p.areas.includes('TODAS') || p.areas.includes('TODAS_MATERIAS')) {
            const todasLasMaterias = ['LENGUA', 'MATEMATICA', 'CS_SOCIALES', 'CS_NATURALES', 'ED_FISICA', 'MUSICA', 'PLASTICA', 'INGLES', 'TECNOLOGIA'];
            p.areas = [...todasLasMaterias];
            if (tieneDatos) p.areas.push('DATOS');
        }

        if (checked) {
            if (!p.areas.includes(materia)) p.areas.push(materia);
        } else {
            p.areas = p.areas.filter(a => a !== materia);
        }
    }
    window.renderizarTablaPlanillasDocente();
};

window.toggleEditorMateriasPlanilla = function(idx) {
    window.abiertosEditoresMaterias = window.abiertosEditoresMaterias || new Set();
    if (window.abiertosEditoresMaterias.has(idx)) {
        window.abiertosEditoresMaterias.delete(idx);
    } else {
        window.abiertosEditoresMaterias.add(idx);
    }
    window.renderizarTablaPlanillasDocente();
};

window.aplicarAreasMasivasATodasLasPlanillas = function() {
    if (!window.planillasDocentePermisos || window.planillasDocentePermisos.length === 0) {
        M.toast({ html: 'No hay planillas asignadas a este docente.', classes: 'orange darken-2' });
        return;
    }

    let areasSeleccionadas = [];
    if (document.getElementById('chk-area-todas')?.checked) {
        areasSeleccionadas = ['TODAS'];
    } else {
        if (document.getElementById('chk-area-lengua')?.checked) areasSeleccionadas.push('LENGUA');
        if (document.getElementById('chk-area-matematica')?.checked) areasSeleccionadas.push('MATEMATICA');
        if (document.getElementById('chk-area-sociales')?.checked) areasSeleccionadas.push('CS_SOCIALES');
        if (document.getElementById('chk-area-naturales')?.checked) areasSeleccionadas.push('CS_NATURALES');
        if (document.getElementById('chk-area-ed-fisica')?.checked) areasSeleccionadas.push('ED_FISICA');
        if (document.getElementById('chk-area-musica')?.checked) areasSeleccionadas.push('MUSICA');
        if (document.getElementById('chk-area-plastica')?.checked) areasSeleccionadas.push('PLASTICA');
        if (document.getElementById('chk-area-ingles')?.checked) areasSeleccionadas.push('INGLES');
        if (document.getElementById('chk-area-tecnologia')?.checked) areasSeleccionadas.push('TECNOLOGIA');
    }

    const incluyeDatos = document.getElementById('chk-area-datos')?.checked;
    if (incluyeDatos) {
        areasSeleccionadas.push('DATOS');
    }
    const incluyeAsist = document.getElementById('chk-area-asistencia')?.checked;
    if (incluyeAsist) {
        areasSeleccionadas.push('ASISTENCIA');
    }

    if (areasSeleccionadas.length === 0) {
        areasSeleccionadas = ['TODAS'];
    }

    window.planillasDocentePermisos.forEach(p => {
        if (!esPlanillaEspecialSeleccionada(p.nombre)) {
            p.areas = [...areasSeleccionadas];
        } else {
            p.areas = ['TODAS'];
        }
    });

    window.renderizarTablaPlanillasDocente();
    M.toast({ html: '⚡ Áreas aplicadas a todas las planillas de este docente.', classes: 'purple darken-2' });
};

window.cambiarSoloLecturaPlanillaDocente = function(idx, soloLectura) {
    if (window.planillasDocentePermisos[idx]) {
        window.planillasDocentePermisos[idx].solo_lectura = soloLectura;
        window.planillasDocentePermisos[idx].soloLectura = soloLectura;
    }
};

window.cambiarSoloLecturaPorCuatrimestreDocente = function(cuatrimestre, soloLectura) {
    if (!Array.isArray(window.planillasDocentePermisos) || window.planillasDocentePermisos.length === 0) {
        M.toast({ html: 'No hay planillas asignadas a este docente.', classes: 'orange darken-2' });
        return;
    }

    let modificadas = 0;
    window.planillasDocentePermisos.forEach(p => {
        const es2do = esPlanillaSegundoCuatrimestreSeleccionada(p.nombre);
        const match = (cuatrimestre === 2) ? es2do : !es2do;
        if (match) {
            p.solo_lectura = Boolean(soloLectura);
            p.soloLectura = Boolean(soloLectura);
            modificadas++;
        }
    });

    window.renderizarTablaPlanillasDocente();
    const accion = soloLectura ? 'bloqueadas en Solo Lectura' : 'habilitadas para Lectura/Escritura';
    M.toast({
        html: `🔒 ${modificadas} planillas del ${cuatrimestre}° Cuatrimestre ${accion}. Pulsa "Guardar Permisos" para confirmar.`,
        classes: 'teal darken-2',
        displayLength: 4000
    });
};

window.bloquearCuatrimestreGlobal = async function(cuatrimestre, soloLectura) {
    const cuatriTxt = cuatrimestre === 1 ? '1° Cuatrimestre' : '2° Cuatrimestre';
    const estadoTxt = soloLectura ? 'SOLO LECTURA' : 'LECTURA Y ESCRITURA (Editable)';
    const confirmMsg = `¿Estás seguro de que deseas poner TODAS las planillas del ${cuatriTxt} en ${estadoTxt} para TODOS los docentes del colegio?\n\nEsta acción actualizará las asignaciones de todos los docentes en la base de datos.`;
    if (!confirm(confirmMsg)) return;

    M.toast({ html: `⏳ Actualizando ${cuatriTxt} para todos los docentes...`, classes: 'blue darken-2', displayLength: 3000 });

    try {
        const { data: todosUsuarios, error } = await supabaseClient
            .from('app_adm_config')
            .select('*');

        if (error) throw error;
        if (!todosUsuarios || todosUsuarios.length === 0) {
            M.toast({ html: 'No se encontraron usuarios en la configuración.', classes: 'orange darken-2' });
            return;
        }

        let totalDocentesModificados = 0;
        let totalPlanillasModificadas = 0;

        for (const u of todosUsuarios) {
            let planes = u.planillas;
            if (typeof planes === 'string') {
                try { planes = JSON.parse(planes); } catch(e) { planes = []; }
            }
            if (!Array.isArray(planes) || planes.length === 0) continue;

            let cambio = false;
            planes.forEach(p => {
                const es2do = esPlanillaSegundoCuatrimestreSeleccionada(p.nombre);
                const match = (cuatrimestre === 2) ? es2do : !es2do;
                if (match) {
                    if (Boolean(p.soloLectura || p.solo_lectura) !== Boolean(soloLectura)) {
                        p.soloLectura = Boolean(soloLectura);
                        p.solo_lectura = Boolean(soloLectura);
                        cambio = true;
                        totalPlanillasModificadas++;
                    }
                }
            });

            if (cambio) {
                totalDocentesModificados++;
                await supabaseClient
                    .from('app_adm_config')
                    .update({ planillas: planes })
                    .eq('id', u.id);
            }
        }

        // Si hay un docente seleccionado actualmente en el modal, refrescarlo
        if (window.docenteSeleccionadoPermisos && window.docenteSeleccionadoPermisos.email) {
            await window.cargarDocenteEnGestorPermisos(window.docenteSeleccionadoPermisos.email);
        }

        M.toast({
            html: `✅ ${cuatriTxt} actualizado a ${estadoTxt}: ${totalPlanillasModificadas} planillas en ${totalDocentesModificados} docentes.`,
            classes: 'green darken-2',
            displayLength: 6000
        });
    } catch(err) {
        console.error('Error en bloquearCuatrimestreGlobal:', err);
        M.toast({ html: '❌ Error actualizando planillas: ' + err.message, classes: 'red darken-3' });
    }
};

window.eliminarPlanillaDocente = function(idx) {
    window.planillasDocentePermisos.splice(idx, 1);
    if (window.abiertosEditoresMaterias) window.abiertosEditoresMaterias.delete(idx);
    window.renderizarTablaPlanillasDocente();
};

window.abrirAsignadorNuevaPlanilla = function() {
    const fila = document.getElementById('fila-agregar-planilla');
    if (fila) fila.style.display = 'block';
};

window.confirmarAgregarPlanillaDocente = async function() {
    const grado = document.getElementById('select-nuevo-grado').value;
    const seccion = document.getElementById('select-nueva-seccion').value;

    try {
        const { data: planillas, error } = await supabaseClient
            .from('planillas')
            .select('id, nombre, spreadsheet_id, activo')
            .or(`nombre.ilike.*Planillas* ${grado}*${seccion}*,nombre.ilike.*Planillas 2 Cuatrimestre* ${grado}*${seccion}*,nombre.ilike.*Planillas ESP* ${grado}*${seccion}*`)
            .eq('activo', true);

        if (error) throw error;
        if (!planillas || planillas.length === 0) {
            M.toast({ html: 'No se encontraron planillas activas para ' + grado + '° ' + seccion, classes: 'orange darken-2' });
            return;
        }

        let agregadas = 0;
        planillas.forEach(p => {
            const yaExiste = window.planillasDocentePermisos.some(exist => 
                (exist.planilla_id && exist.planilla_id === p.id) ||
                (exist.spreadsheet_id && p.spreadsheet_id && exist.spreadsheet_id === p.spreadsheet_id)
            );
            if (!yaExiste) {
                const idVal = p.spreadsheet_id || String(p.id);
                window.planillasDocentePermisos.push({
                    id: idVal,
                    planilla_id: p.id,
                    nombre: p.nombre,
                    spreadsheet_id: p.spreadsheet_id,
                    grado: grado,
                    seccion: seccion,
                    solo_lectura: false,
                    soloLectura: false,
                    areas: ['TODAS']
                });
                agregadas++;
            }
        });

        document.getElementById('fila-agregar-planilla').style.display = 'none';
        window.renderizarTablaPlanillasDocente();
        M.toast({ html: 'Se asignaron ' + agregadas + ' planillas de ' + grado + '° ' + seccion + ' al docente.', classes: 'green darken-2' });
    } catch (err) {
        M.toast({ html: 'Error al buscar planilla: ' + err.message, classes: 'red darken-2' });
    }
};

window.toggleVisibilidadClaveDocentePermisos = function() {
    const input = document.getElementById('input-clave-docente-permisos');
    const btn = document.getElementById('btn-toggle-visibilidad-clave');
    if (!input) return;
    const esTexto = input.type === 'text';
    input.type = esTexto ? 'password' : 'text';
    if (btn) {
        btn.innerHTML = `<i class="material-icons" style="font-size: 18px;">${esTexto ? 'visibility' : 'visibility_off'}</i>`;
    }
};

window.generarClaveAleatoriaDocentePermisos = function() {
    const input = document.getElementById('input-clave-docente-permisos');
    const badgeClave = document.getElementById('badge-estado-clave-docente');
    if (!input) return;
    const nuevaClave = String(Math.floor(100000 + Math.random() * 900000));
    input.type = 'text';
    input.value = nuevaClave;
    const btnToggle = document.getElementById('btn-toggle-visibilidad-clave');
    if (btnToggle) {
        btnToggle.innerHTML = '<i class="material-icons" style="font-size: 18px;">visibility_off</i>';
    }
    if (badgeClave) {
        badgeClave.textContent = 'Sin guardar (pulsa Actualizar Clave)';
        badgeClave.style.color = '#b45309';
    }
};

window.guardarClaveDocentePermisos = async function() {
    if (!window.docenteSeleccionadoPermisos) return;

    const input = document.getElementById('input-clave-docente-permisos');
    const badgeClave = document.getElementById('badge-estado-clave-docente');
    const btn = document.getElementById('btn-guardar-clave-docente');
    const nuevaClave = String((input && input.value) || '').trim();

    if (!nuevaClave) {
        M.toast({ html: 'Ingresa una contraseña válida antes de guardar.', classes: 'orange darken-3' });
        if (input) input.focus();
        return;
    }

    const emailDocente = window.docenteSeleccionadoPermisos.email;
    const columnaClave = window.docenteSeleccionadoPermisos.claveColumna || 'clave';
    const htmlOriginal = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="material-icons left tiny" style="margin-right: 4px;">hourglass_empty</i> Guardando...';
    }

    try {
        const updatePayload = {};
        updatePayload[columnaClave] = nuevaClave;

        const { error } = await supabaseClient
            .from('app_adm_config')
            .update(updatePayload)
            .or(`email.ilike.${emailDocente},Email.ilike.${emailDocente}`);

        if (error) throw error;

        window.docenteSeleccionadoPermisos.clave = nuevaClave;
        if (Array.isArray(window.listaDocentesConfigCache)) {
            const cached = window.listaDocentesConfigCache.find(u => u.email === emailDocente);
            if (cached) cached.clave = nuevaClave;
        }
        if (badgeClave) {
            badgeClave.textContent = '✅ Clave actualizada';
            badgeClave.style.color = '#15803d';
        }
        M.toast({ html: `✅ Contraseña actualizada para ${emailDocente}`, classes: 'green darken-2', displayLength: 3500 });
    } catch (err) {
        console.error('Error actualizando contraseña del docente:', err);
        M.toast({ html: '❌ Error al actualizar la contraseña: ' + err.message, classes: 'red darken-3' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = htmlOriginal;
        }
    }
};

window.guardarPermisosDocenteDesdeUI = async function() {
    if (!window.docenteSeleccionadoPermisos) return;

    const btn = document.getElementById('btn-guardar-permisos-docente');
    btn.disabled = true;
    btn.innerHTML = '<i class="material-icons left">hourglass_empty</i> Guardando...';

    try {
        const emailDocente = window.docenteSeleccionadoPermisos.email;

        // Cada planilla en window.planillasDocentePermisos mantiene sus áreas individuales específicas
        window.planillasDocentePermisos.forEach(p => {
            if (esPlanillaEspecialSeleccionada(p.nombre) || !Array.isArray(p.areas) || p.areas.length === 0) {
                p.areas = ['TODAS'];
            }
            p.solo_lectura = Boolean(p.solo_lectura || p.soloLectura);
            p.soloLectura = Boolean(p.solo_lectura);
        });

        // 1. Guardar en app_adm_config para todas las filas del docente
        const { error: errApp } = await supabaseClient
            .from('app_adm_config')
            .update({ planillas: window.planillasDocentePermisos })
            .or(`email.ilike.${emailDocente},Email.ilike.${emailDocente}`);

        if (errApp) throw errApp;

        // 2. Sincronizar en docente_planillas
        await supabaseClient
            .from('docente_planillas')
            .delete()
            .eq('docente_email', emailDocente);

        if (window.planillasDocentePermisos.length > 0) {
            const filasInsertar = window.planillasDocentePermisos.map(p => ({
                docente_email: emailDocente,
                planilla_id: p.planilla_id,
                solo_lectura: Boolean(p.solo_lectura)
            }));

            await supabaseClient
                .from('docente_planillas')
                .insert(filasInsertar);
        }

        // Actualizar cache local
        window.docenteSeleccionadoPermisos.planillas = window.planillasDocentePermisos;
        if (window.usuarioActual && normalizarCorreoCliente(window.usuarioActual.email) === normalizarCorreoCliente(emailDocente)) {
            window.usuarioActual.planillas = window.planillasDocentePermisos;
            try { sessionStorage.setItem('misericordia_usuario_info', JSON.stringify(window.usuarioActual)); } catch(e) {}
        }

        M.toast({ html: '✅ Permisos guardados con éxito para ' + emailDocente + '. Puedes seleccionar otro docente o seguir editando.', classes: 'green darken-2', displayLength: 4000 });

        // Actualizar el texto del option en el selector de docentes
        const select = document.getElementById('select-docente-permisos');
        if (select) {
            const opt = select.querySelector(`option[value="${emailDocente}"]`);
            if (opt) {
                const cant = window.planillasDocentePermisos.length;
                const rolTxt = window.docenteSeleccionadoPermisos.es_admin ? ' (Administrador)' : (cant > 0 ? ` (${cant} planillas)` : '');
                opt.textContent = emailDocente + rolTxt;
            }
        }

        // El modal NO se cierra para permitir seguir asignando permisos a otros usuarios sin interrupciones

    } catch (errGuardar) {
        M.toast({ html: '❌ Error al guardar permisos: ' + errGuardar.message, classes: 'red darken-2' });
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="material-icons left">check</i> ¡Guardado!';
        setTimeout(() => {
            btn.innerHTML = '<i class="material-icons left">save</i> Guardar Permisos';
        }, 2000);
    }
};

// =========================================================================
// BUSCADOR GENERAL DE ALUMNOS (EXCLUSIVO ADMINISTRADOR)
// =========================================================================

window._padronAlumnosAdminCache = null;
window._cargandoPadronAlumnosPromise = null;
let _debounceBuscadorAlumnosTimer = null;

function esAdministradorAutorizadoBuscador() {
    const correoSesion = (sessionStorage.getItem('misericordia_sesion') || '').toLowerCase().trim();
    return Boolean(window.esUsuarioAdmin) ||
           correoSesion === 'misericordiaplanillas@gmail.com' ||
           correoSesion === 'victorojas2025@gmail.com';
}

function normalizarTextoBuscador(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function escaparHtmlBuscador(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function fetchPaginadoSupabase( constructorQuery, pageSize = 1000 ) {
    const acumulado = [];
    let desde = 0;
    while (true) {
        let data = null, error = null;
        // Reintentar hasta 3 veces ante "statement timeout" (código 57014) u otros cortes transitorios
        for (let intento = 1; intento <= 3; intento++) {
            ({ data, error } = await constructorQuery().range(desde, desde + pageSize - 1));
            const esTimeout = error && (error.code === '57014' || /statement timeout|fetch failed|network/i.test(error.message || ''));
            if (!esTimeout) break;
            await new Promise(r => setTimeout(r, 600 * intento));
        }
        if (error) throw error;
        if (!Array.isArray(data) || data.length === 0) break;
        acumulado.push(...data);
        if (data.length < pageSize) break;
        desde += pageSize;
    }
    return acumulado;
}

async function cargarPadronCompletoAlumnosAdmin(forzarRecarga = false) {
    if (!esAdministradorAutorizadoBuscador()) {
        throw new Error('Acceso denegado: función exclusiva para administradores.');
    }
    if (!forzarRecarga && Array.isArray(window._padronAlumnosAdminCache) && window._padronAlumnosAdminCache.length > 0) {
        return window._padronAlumnosAdminCache;
    }
    if (!forzarRecarga && window._cargandoPadronAlumnosPromise) {
        return window._cargandoPadronAlumnosPromise;
    }

    window._cargandoPadronAlumnosPromise = (async () => {
        try {
            const [alumnosRaw, planillasRaw, califsDatosRaw] = await Promise.all([
                fetchPaginadoSupabase(() => supabaseClient.from('alumnos').select('*').order('id', { ascending: true })),
                fetchPaginadoSupabase(() => supabaseClient.from('planillas').select('id, nombre, spreadsheet_id, activo').eq('activo', true).order('id', { ascending: true })),
                fetchPaginadoSupabase(() => supabaseClient.from('calificaciones').select('planilla_id, alumno_dni, valores').eq('nombre_hoja', 'DATOS').order('id', { ascending: true }))
            ]);

            const mapaPlanillasPorId = new Map();
            const idsPlanillasRegulares = [];

            (planillasRaw || []).forEach(p => {
                const info = typeof parsePlanillaInfo === 'function'
                    ? parsePlanillaInfo(p.nombre)
                    : { esEspecial: /ESP|ESPECIAL/i.test(p.nombre), esSegundo: /2\s*CUATRIMESTRE/i.test(p.nombre) ? 2 : 1 };
                const infoGlobal = typeof extraerGradoYSeccionGlobal === 'function'
                    ? extraerGradoYSeccionGlobal(p.nombre)
                    : { grado: Number(info.grado) || 99, seccion: info.seccion || '', esEsp: info.esEspecial ? 1 : 0, esSegundoCuatri: info.esSegundo === 2 ? 1 : 0 };

                const esEspecial = Boolean(info.esEspecial || infoGlobal.esEsp || /ESP|PLASTICA|PLÁSTICA|MUSICA|MÚSICA|FISICA|FÍSICA|INGLES|INGLÉS|TECNOLOG/i.test(p.nombre));
                const gradoStr = info.grado || (infoGlobal.grado && infoGlobal.grado < 99 ? String(infoGlobal.grado) : '');
                const seccionStr = String(info.seccion || infoGlobal.seccion || '').toUpperCase().trim();
                const esSegundo = Boolean(info.esSegundo === 2 || infoGlobal.esSegundoCuatri === 1);

                mapaPlanillasPorId.set(p.id, {
                    id: p.id,
                    nombre: p.nombre,
                    spreadsheet_id: p.spreadsheet_id,
                    esEspecial,
                    esSegundo,
                    grado: gradoStr,
                    seccion: seccionStr
                });

                if (!esEspecial) {
                    idsPlanillasRegulares.push(p.id);
                }
            });

            let matriculasRegulares = [];
            if (idsPlanillasRegulares.length > 0) {
                matriculasRegulares = await fetchPaginadoSupabase(() =>
                    supabaseClient
                        .from('alumno_planillas')
                        .select('planilla_id, alumno_dni, numero_orden, activo, oculto')
                        .in('planilla_id', idsPlanillasRegulares)
                        .order('id', { ascending: true })
                );
            }

            // Consolidar datos extra de hoja DATOS por DNI
            const extrasPorDni = new Map();
            (califsDatosRaw || []).forEach(row => {
                const dni = String(row.alumno_dni || '').trim();
                if (!dni || !row.valores || typeof row.valores !== 'object') return;
                const actual = extrasPorDni.get(dni) || {};
                for (const [k, v] of Object.entries(row.valores)) {
                    if (v !== undefined && v !== null && String(v).trim() !== '') {
                        actual[k] = String(v).trim();
                    }
                }
                extrasPorDni.set(dni, actual);
            });

            // Agrupar cursos regulares por DNI
            const cursosPorDni = new Map();
            (matriculasRegulares || []).forEach(m => {
                const dni = String(m.alumno_dni || '').trim();
                const pl = mapaPlanillasPorId.get(m.planilla_id);
                if (!dni || !pl) return;
                if (!cursosPorDni.get(dni)) {
                    cursosPorDni.set(dni, []);
                }
                cursosPorDni.get(dni).push({
                    planilla_id: pl.id,
                    nombrePlanilla: pl.nombre,
                    spreadsheet_id: pl.spreadsheet_id,
                    grado: pl.grado,
                    seccion: pl.seccion,
                    esSegundo: pl.esSegundo,
                    numero_orden: m.numero_orden,
                    activo: m.activo,
                    oculto: m.oculto
                });
            });

            const padron = (alumnosRaw || []).map(al => {
                const dni = String(al.dni || '').trim();
                const apellido = String(al.apellido || '').trim();
                const nombre = String(al.nombre || '').trim();
                const nombreCompleto = (apellido && nombre) ? `${apellido}, ${nombre}` : (apellido || nombre || `Alumno ${dni}`);
                const extra = extrasPorDni.get(dni) || {};
                const listaCursos = cursosPorDni.get(dni) || [];

                // Preferir curso de 2do cuatrimestre si existe, o 1er cuatrimestre
                const curso2do = listaCursos.find(c => c.esSegundo && c.grado);
                const curso1ro = listaCursos.find(c => !c.esSegundo && c.grado);
                const cursoPrincipal = curso2do || curso1ro || listaCursos[0] || null;

                const grado = String((cursoPrincipal && cursoPrincipal.grado) || extra['GRADO'] || '').replace(/[^1-7]/g, '');
                const seccion = String((cursoPrincipal && cursoPrincipal.seccion) || extra['SECCION'] || extra['SECCIÓN'] || '').toUpperCase().trim();
                const numeroOrden = (cursoPrincipal && cursoPrincipal.numero_orden) || '';
                const sexoRaw = String(al.sexo || extra['SEXO'] || '').toUpperCase().trim();
                const fechaNacimiento = String(al.fecha_nacimiento || extra['FECHA DE NAC'] || extra['FECHA NACIMIENTO'] || extra['FECHA DE NACIMIENTO'] || '').trim();
                const activo = (cursoPrincipal ? cursoPrincipal.activo !== false : true) && al.activo !== false;
                const oculto = Boolean((cursoPrincipal && cursoPrincipal.oculto === true) || al.oculto === true);

                const gradoLabel = grado ? `${grado}° Grado${seccion ? ' "' + seccion + '"' : ''}` : 'Sin grado asignado';
                const textoBusqueda = normalizarTextoBuscador(
                    `${dni} ${apellido} ${nombre} ${nombreCompleto} ${grado} ${seccion} ${grado}${seccion} ${grado}ro ${grado}do ${grado}to ${grado}° ${grado} grado`
                );

                return {
                    dni,
                    dniSinPuntos: dni.replace(/\D/g, ''),
                    apellido,
                    nombre,
                    nombreCompleto,
                    apellidoNorm: normalizarTextoBuscador(apellido),
                    nombreNorm: normalizarTextoBuscador(nombre),
                    nombreCompletoNorm: normalizarTextoBuscador(`${apellido} ${nombre}`),
                    grado,
                    seccion,
                    gradoLabel,
                    numeroOrden,
                    sexo: sexoRaw,
                    fechaNacimiento,
                    activo,
                    oculto,
                    cursoPrincipal,
                    listaCursos,
                    extraDatos: extra,
                    textoBusqueda
                };
            });

            // Ordenar por grado, sección, número de orden y apellido
            padron.sort((a, b) => {
                const gA = Number(a.grado) || 99;
                const gB = Number(b.grado) || 99;
                if (gA !== gB) return gA - gB;
                if (a.seccion !== b.seccion) return a.seccion.localeCompare(b.seccion, 'es');
                const ordA = Number(a.numeroOrden) || 999;
                const ordB = Number(b.numeroOrden) || 999;
                if (ordA !== ordB) return ordA - ordB;
                return a.nombreCompleto.localeCompare(b.nombreCompleto, 'es');
            });

            window._padronAlumnosAdminCache = padron;
            const badgeTotal = document.getElementById('badge-padron-total-alumnos');
            if (badgeTotal) {
                badgeTotal.textContent = `Padrón cargado: ${padron.length} alumnos`;
            }
            return padron;
        } finally {
            window._cargandoPadronAlumnosPromise = null;
        }
    })();

    return window._cargandoPadronAlumnosPromise;
}

window.abrirBuscadorAlumnos = async function() {
    if (!esAdministradorAutorizadoBuscador()) {
        if (typeof M !== 'undefined' && M.toast) {
            M.toast({ html: 'Acceso restringido: esta función solo está disponible para el administrador.', classes: 'red darken-3' });
        }
        return;
    }

    const modalEl = document.getElementById('modal-buscador-alumnos');
    if (!modalEl) return;

    let instance = M.Modal.getInstance(modalEl);
    if (!instance) {
        instance = M.Modal.init(modalEl, { dismissible: true });
    }
    instance.open();

    const inputTexto = document.getElementById('input-buscador-alumnos-texto');
    if (inputTexto) {
        setTimeout(() => inputTexto.focus(), 120);
    }

    const contenedor = document.getElementById('contenedor-resultados-buscador-alumnos');
    const contador = document.getElementById('texto-contador-buscador-alumnos');

    if (!window._padronAlumnosAdminCache) {
        if (contador) contador.textContent = 'Cargando padrón general de alumnos desde Supabase...';
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="center-align" style="padding: 40px 20px; color: #0369a1;">
                    <div class="preloader-wrapper small active" style="margin-bottom: 12px;">
                        <div class="spinner-layer spinner-blue-only">
                            <div class="circle-clipper left"><div class="circle"></div></div>
                            <div class="gap-patch"><div class="circle"></div></div>
                            <div class="circle-clipper right"><div class="circle"></div></div>
                        </div>
                    </div>
                    <p style="margin: 0; font-weight: 600;">Sincronizando padrón de alumnos y fichas personales...</p>
                </div>
            `;
        }
        try {
            const padron = await cargarPadronCompletoAlumnosAdmin(false);
            if (contador) {
                contador.textContent = `Padrón listo (${padron.length} alumnos). Ingresa un DNI, apellido, nombre o selecciona un grado para buscar.`;
            }
            const tieneFiltro = Boolean(
                (inputTexto && inputTexto.value.trim()) ||
                (document.getElementById('select-buscador-alumnos-grado')?.value) ||
                (document.getElementById('select-buscador-alumnos-seccion')?.value)
            );
            if (tieneFiltro) {
                window.ejecutarBusquedaAlumnosAdmin();
            } else if (contenedor) {
                contenedor.innerHTML = `
                    <div class="center-align" style="padding: 40px 20px; color: #64748b;">
                        <i class="material-icons" style="font-size: 3.2rem; color: #0284c7; display: block; margin-bottom: 8px;">manage_search</i>
                        <p style="margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b;">Padrón de ${padron.length} alumnos disponible</p>
                        <p style="margin: 4px 0 0 0; font-size: 0.88rem;">Escribe cualquier DNI, apellido, nombre o selecciona un grado para ver todas las posibles coincidencias y sus datos personales.</p>
                    </div>
                `;
            }
        } catch (err) {
            if (contador) contador.textContent = 'Error al cargar el padrón de alumnos.';
            if (contenedor) {
                contenedor.innerHTML = `<div class="center-align red-text" style="padding: 30px;">Error cargando alumnos: ${escaparHtmlBuscador(err.message)}</div>`;
            }
        }
    } else {
        const badgeTotal = document.getElementById('badge-padron-total-alumnos');
        if (badgeTotal) {
            badgeTotal.textContent = `Padrón cargado: ${window._padronAlumnosAdminCache.length} alumnos`;
        }
    }
};

window.recargarPadronBuscadorAlumnos = async function() {
    if (!esAdministradorAutorizadoBuscador()) return;
    window._padronAlumnosAdminCache = null;
    const contador = document.getElementById('texto-contador-buscador-alumnos');
    if (contador) contador.textContent = 'Actualizando padrón desde la base de datos...';
    try {
        await cargarPadronCompletoAlumnosAdmin(true);
        M.toast({ html: '✅ Padrón de alumnos actualizado.', classes: 'green darken-2', displayLength: 2200 });
        window.ejecutarBusquedaAlumnosAdmin();
    } catch (err) {
        M.toast({ html: '❌ Error al actualizar padrón: ' + err.message, classes: 'red darken-2' });
    }
};

window.limpiarFiltrosBuscadorAlumnos = function() {
    if (!esAdministradorAutorizadoBuscador()) return;
    const inputTexto = document.getElementById('input-buscador-alumnos-texto');
    const selectGrado = document.getElementById('select-buscador-alumnos-grado');
    const selectSeccion = document.getElementById('select-buscador-alumnos-seccion');
    if (inputTexto) inputTexto.value = '';
    if (selectGrado) selectGrado.value = '';
    if (selectSeccion) selectSeccion.value = '';

    const contador = document.getElementById('texto-contador-buscador-alumnos');
    const contenedor = document.getElementById('contenedor-resultados-buscador-alumnos');
    const total = Array.isArray(window._padronAlumnosAdminCache) ? window._padronAlumnosAdminCache.length : 0;
    if (contador) {
        contador.textContent = total > 0
            ? `Padrón listo (${total} alumnos). Ingresa un DNI, apellido, nombre o selecciona un grado para buscar.`
            : 'Ingresa un DNI, apellido, nombre o selecciona un grado para buscar.';
    }
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="center-align" style="padding: 40px 20px; color: #64748b;">
                <i class="material-icons" style="font-size: 3.2rem; color: #94a3b8; display: block; margin-bottom: 8px;">manage_search</i>
                <p style="margin: 0; font-size: 1rem; font-weight: 500; color: #334155;">Filtros limpiados</p>
                <p style="margin: 4px 0 0 0; font-size: 0.88rem;">Escribe un DNI, apellido, nombre o selecciona un grado para ver las coincidencias.</p>
            </div>
        `;
    }
    if (inputTexto) inputTexto.focus();
};

window.filtrarBuscadorAlumnosEnVivo = function() {
    if (!esAdministradorAutorizadoBuscador()) return;
    clearTimeout(_debounceBuscadorAlumnosTimer);
    _debounceBuscadorAlumnosTimer = setTimeout(() => {
        window.ejecutarBusquedaAlumnosAdmin();
    }, 180);
};

window.ejecutarBusquedaAlumnosAdmin = async function() {
    if (!esAdministradorAutorizadoBuscador()) {
        if (typeof M !== 'undefined' && M.toast) {
            M.toast({ html: 'Acceso restringido: solo para el administrador.', classes: 'red darken-3' });
        }
        return;
    }

    const inputTexto = document.getElementById('input-buscador-alumnos-texto');
    const selectGrado = document.getElementById('select-buscador-alumnos-grado');
    const selectSeccion = document.getElementById('select-buscador-alumnos-seccion');
    const contador = document.getElementById('texto-contador-buscador-alumnos');
    const contenedor = document.getElementById('contenedor-resultados-buscador-alumnos');

    const rawQuery = inputTexto ? inputTexto.value.trim() : '';
    const filtroGradoSelect = selectGrado ? selectGrado.value.trim() : '';
    const filtroSeccionSelect = selectSeccion ? selectSeccion.value.trim().toUpperCase() : '';

    if (!rawQuery && !filtroGradoSelect && !filtroSeccionSelect) {
        if (contador) {
            contador.textContent = 'Ingresa un DNI, apellido, nombre o selecciona un grado para buscar.';
        }
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="center-align" style="padding: 40px 20px; color: #64748b;">
                    <i class="material-icons" style="font-size: 3.2rem; color: #94a3b8; display: block; margin-bottom: 8px;">manage_search</i>
                    <p style="margin: 0; font-size: 1rem; font-weight: 500; color: #334155;">Buscador General de Alumnos</p>
                    <p style="margin: 4px 0 0 0; font-size: 0.88rem;">Escribe un DNI, apellido, nombre o selecciona un grado para ver todas las coincidencias y sus datos personales.</p>
                </div>
            `;
        }
        return;
    }

    let padron = window._padronAlumnosAdminCache;
    if (!Array.isArray(padron)) {
        try {
            if (contador) contador.textContent = 'Cargando padrón de alumnos...';
            padron = await cargarPadronCompletoAlumnosAdmin(false);
        } catch (err) {
            if (contador) contador.textContent = 'Error al consultar alumnos.';
            return;
        }
    }

    const queryNorm = normalizarTextoBuscador(rawQuery);
    const querySoloDigitos = rawQuery.replace(/[.\-\s]/g, '');
    const esBusquedaSoloDni = /^\d{2,10}$/.test(querySoloDigitos);
    const esUnSoloDigitoGrado = /^[1-6]$/.test(queryNorm);

    // Detectar si el texto libre incluye expresión de grado/sección (ej: "3ro b", "2° d", "4to grado", "1 a")
    let gradoExplicitoEnTexto = null;
    let seccionExplicitaEnTexto = null;
    let tokensRestantes = [];

    if (queryNorm && !esBusquedaSoloDni) {
        const matchGradoSec = queryNorm.match(/^(?:grado\s*)?([1-6])(?:\s*(?:ro|do|to|er|mo|°|º|grado))?(?:\s+([a-l]))?$/i);
        if (matchGradoSec) {
            gradoExplicitoEnTexto = matchGradoSec[1];
            if (matchGradoSec[2]) seccionExplicitaEnTexto = matchGradoSec[2].toUpperCase();
        } else {
            tokensRestantes = queryNorm.split(' ').filter(Boolean);
        }
    }

    const coincidencias = padron.filter(alumno => {
        if (filtroGradoSelect && alumno.grado !== filtroGradoSelect) return false;
        if (filtroSeccionSelect && alumno.seccion !== filtroSeccionSelect) return false;

        if (!queryNorm) return true;

        if (esBusquedaSoloDni) {
            return alumno.dniSinPuntos.includes(querySoloDigitos) || alumno.dni.toLowerCase().includes(queryNorm);
        }

        if (esUnSoloDigitoGrado) {
            return alumno.grado === queryNorm;
        }

        if (gradoExplicitoEnTexto) {
            if (alumno.grado !== gradoExplicitoEnTexto) return false;
            if (seccionExplicitaEnTexto && alumno.seccion !== seccionExplicitaEnTexto) return false;
            return true;
        }

        // Búsqueda general por tokens (Apellido, Nombre, DNI parcial, Grado/Sección combinados)
        return tokensRestantes.every(token => {
            const mGradoToken = token.match(/^([1-6])(?:ro|do|to|er|°|º)$/i);
            if (mGradoToken) {
                return alumno.grado === mGradoToken[1];
            }
            if (/^\d{2,}$/.test(token)) {
                return alumno.dniSinPuntos.includes(token);
            }
            return alumno.textoBusqueda.includes(token);
        });
    });

    renderizarResultadosBuscadorAlumnos(coincidencias, rawQuery, filtroGradoSelect, filtroSeccionSelect);
};

function renderizarResultadosBuscadorAlumnos(coincidencias, rawQuery, filtroGrado, filtroSeccion) {
    const contador = document.getElementById('texto-contador-buscador-alumnos');
    const contenedor = document.getElementById('contenedor-resultados-buscador-alumnos');
    if (!contenedor) return;

    const totalCoincidencias = coincidencias.length;
    if (contador) {
        if (totalCoincidencias === 0) {
            contador.innerHTML = `<span style="color: #b91c1c;">No se encontraron coincidencias para los criterios ingresados.</span>`;
        } else {
            contador.innerHTML = `<span style="color: #0369a1;">Se ${totalCoincidencias === 1 ? 'encontró 1 coincidencia' : `encontraron ${totalCoincidencias} coincidencias`}</span>`;
        }
    }

    if (totalCoincidencias === 0) {
        contenedor.innerHTML = `
            <div class="center-align" style="padding: 40px 20px; color: #64748b;">
                <i class="material-icons" style="font-size: 3rem; color: #cbd5e1; display: block; margin-bottom: 8px;">search_off</i>
                <p style="margin: 0; font-size: 1rem; font-weight: 600; color: #334155;">Sin coincidencias</p>
                <p style="margin: 4px 0 0 0; font-size: 0.86rem;">Verifica el DNI, apellido, nombre o grado ingresado.</p>
            </div>
        `;
        return;
    }

    const ordenCamposHojaDatos = [
        'DNI', 'APELLIDO', 'NOMBRE', 'GRADO', 'SECCION', 'SEXO',
        'FECHA DE NAC', 'LUGAR DE NAC.', 'DIRECCIÓN',
        'LUGAR DE BAUTISMO', 'FECHA DE BAUTISMO',
        'APELLIDO Y NOMBRE PROGENITOR A', 'DNI PROG A', 'TELF. CELULAR PROG A', 'TELF. FIJO PROG A', 'PROFESIÓN PROG A', 'LUGAR DE TRABAJO PROG A', 'HORARIO PROG A',
        'APELLIDO Y NOMBRE PROGENITOR B', 'DNI PROG B', 'TELF. CELULAR PROG B', 'TELF. FIJO PROG B', 'PROFESIÓN PROG B', 'LUGAR DE TRABAJO PROG B', 'HORARIO PROG B',
        'APELLIDO Y NOMBRE AUXILIAR', 'DNI AUXILIAR', 'TELF. CELULAR AUXILIAR', 'TELF. FIJO AUXILIAR',
        'ACTIVOS', 'OBSERVACIONES', 'OCULTO'
    ];

    const htmlCards = coincidencias.map((al, idx) => {
        const extra = al.extraDatos || {};
        const sexoTexto = al.sexo === 'V' || al.sexo === 'MASCULINO'
            ? 'Varón (V)'
            : (al.sexo === 'M' || al.sexo === 'FEMENINO' ? 'Mujer (M)' : (al.sexo || 'No especificado'));
        const estadoBadge = al.activo
            ? `<span style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">Activo</span>`
            : `<span style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">Inactivo</span>`;
        const ocultoBadge = al.oculto
            ? `<span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">Oculto</span>`
            : '';

        const lugarNac = extra['LUGAR DE NAC.'] || extra['LUGAR DE NACIMIENTO'] || '';
        const direccion = extra['DIRECCIÓN'] || extra['DIRECCION'] || '';
        const lugarBautismo = extra['LUGAR DE BAUTISMO'] || '';
        const fechaBautismo = extra['FECHA DE BAUTISMO'] || '';
        const observaciones = extra['OBSERVACIONES'] || '';

        const progANombre = extra['APELLIDO Y NOMBRE PROGENITOR A'] || '';
        const progADni = extra['DNI PROG A'] || '';
        const progACel = extra['TELF. CELULAR PROG A'] || '';
        const progAFijo = extra['TELF. FIJO PROG A'] || '';
        const progAProf = extra['PROFESIÓN PROG A'] || '';
        const progATrab = extra['LUGAR DE TRABAJO PROG A'] || '';
        const progAHor = extra['HORARIO PROG A'] || '';
        const tieneProgA = Boolean(progANombre || progADni || progACel || progAFijo || progAProf || progATrab || progAHor);

        const progBNombre = extra['APELLIDO Y NOMBRE PROGENITOR B'] || '';
        const progBDni = extra['DNI PROG B'] || '';
        const progBCel = extra['TELF. CELULAR PROG B'] || '';
        const progBFijo = extra['TELF. FIJO PROG B'] || '';
        const progBProf = extra['PROFESIÓN PROG B'] || '';
        const progBTrab = extra['LUGAR DE TRABAJO PROG B'] || '';
        const progBHor = extra['HORARIO PROG B'] || '';
        const tieneProgB = Boolean(progBNombre || progBDni || progBCel || progBFijo || progBProf || progBTrab || progBHor);

        const auxNombre = extra['APELLIDO Y NOMBRE AUXILIAR'] || '';
        const auxDni = extra['DNI AUXILIAR'] || '';
        const auxCel = extra['TELF. CELULAR AUXILIAR'] || '';
        const auxFijo = extra['TELF. FIJO AUXILIAR'] || '';
        const tieneAux = Boolean(auxNombre || auxDni || auxCel || auxFijo);

        // Construir objeto consolidado de todos los campos de la hoja DATOS
        const fichaCompletaMap = {
            'DNI': al.dni || '-',
            'APELLIDO': al.apellido || '-',
            'NOMBRE': al.nombre || '-',
            'GRADO': al.grado ? `${al.grado}°` : '-',
            'SECCION': al.seccion || '-',
            'Nro. de Orden': al.numeroOrden ? String(al.numeroOrden) : '-',
            'SEXO': sexoTexto,
            'FECHA DE NAC': al.fechaNacimiento || '-',
            'LUGAR DE NAC.': lugarNac || '-',
            'DIRECCIÓN': direccion || '-',
            'LUGAR DE BAUTISMO': lugarBautismo || '-',
            'FECHA DE BAUTISMO': fechaBautismo || '-',
            'APELLIDO Y NOMBRE PROGENITOR A': progANombre || '-',
            'DNI PROG A': progADni || '-',
            'TELF. CELULAR PROG A': progACel || '-',
            'TELF. FIJO PROG A': progAFijo || '-',
            'PROFESIÓN PROG A': progAProf || '-',
            'LUGAR DE TRABAJO PROG A': progATrab || '-',
            'HORARIO PROG A': progAHor || '-',
            'APELLIDO Y NOMBRE PROGENITOR B': progBNombre || '-',
            'DNI PROG B': progBDni || '-',
            'TELF. CELULAR PROG B': progBCel || '-',
            'TELF. FIJO PROG B': progBFijo || '-',
            'PROFESIÓN PROG B': progBProf || '-',
            'LUGAR DE TRABAJO PROG B': progBTrab || '-',
            'HORARIO PROG B': progBHor || '-',
            'APELLIDO Y NOMBRE AUXILIAR': auxNombre || '-',
            'DNI AUXILIAR': auxDni || '-',
            'TELF. CELULAR AUXILIAR': auxCel || '-',
            'TELF. FIJO AUXILIAR': auxFijo || '-',
            'ACTIVOS': al.activo ? 'SÍ' : 'NO',
            'OBSERVACIONES': observaciones || '-',
            'OCULTO': al.oculto ? 'SÍ' : 'NO'
        };

        const nombrePlanillaDestino = al.cursoPrincipal ? al.cursoPrincipal.nombrePlanilla : '';
        const idDetalleCompleto = `ficha-completa-alumno-${idx}`;

        let htmlFamilia = '';
        if (tieneProgA || tieneProgB || tieneAux) {
            htmlFamilia = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                        <i class="material-icons tiny">family_restroom</i> Datos Familiares y de Contacto
                    </div>
                    <div class="buscador-datos-grid" style="margin-top: 4px;">
                        ${tieneProgA ? `
                            <div class="buscador-dato-item" style="background: #f0f9ff; border-color: #bae6fd;">
                                <span class="buscador-dato-label" style="color: #0369a1;">Progenitor / Tutor A</span>
                                <span class="buscador-dato-valor">${escaparHtmlBuscador(progANombre || 'Sin nombre')}</span>
                                <div style="font-size: 0.78rem; color: #334155; margin-top: 3px; line-height: 1.35;">
                                    ${progADni ? `<div><strong>DNI:</strong> ${escaparHtmlBuscador(progADni)}</div>` : ''}
                                    ${progACel ? `<div><strong>Celular:</strong> ${escaparHtmlBuscador(progACel)}</div>` : ''}
                                    ${progAFijo ? `<div><strong>Tel. Fijo:</strong> ${escaparHtmlBuscador(progAFijo)}</div>` : ''}
                                    ${progAProf ? `<div><strong>Profesión:</strong> ${escaparHtmlBuscador(progAProf)}</div>` : ''}
                                    ${progATrab ? `<div><strong>Trabajo:</strong> ${escaparHtmlBuscador(progATrab)}</div>` : ''}
                                    ${progAHor ? `<div><strong>Horario:</strong> ${escaparHtmlBuscador(progAHor)}</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        ${tieneProgB ? `
                            <div class="buscador-dato-item" style="background: #f0f9ff; border-color: #bae6fd;">
                                <span class="buscador-dato-label" style="color: #0369a1;">Progenitor / Tutor B</span>
                                <span class="buscador-dato-valor">${escaparHtmlBuscador(progBNombre || 'Sin nombre')}</span>
                                <div style="font-size: 0.78rem; color: #334155; margin-top: 3px; line-height: 1.35;">
                                    ${progBDni ? `<div><strong>DNI:</strong> ${escaparHtmlBuscador(progBDni)}</div>` : ''}
                                    ${progBCel ? `<div><strong>Celular:</strong> ${escaparHtmlBuscador(progBCel)}</div>` : ''}
                                    ${progBFijo ? `<div><strong>Tel. Fijo:</strong> ${escaparHtmlBuscador(progBFijo)}</div>` : ''}
                                    ${progBProf ? `<div><strong>Profesión:</strong> ${escaparHtmlBuscador(progBProf)}</div>` : ''}
                                    ${progBTrab ? `<div><strong>Trabajo:</strong> ${escaparHtmlBuscador(progBTrab)}</div>` : ''}
                                    ${progBHor ? `<div><strong>Horario:</strong> ${escaparHtmlBuscador(progBHor)}</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        ${tieneAux ? `
                            <div class="buscador-dato-item" style="background: #f0fdf4; border-color: #bbf7d0;">
                                <span class="buscador-dato-label" style="color: #15803d;">Contacto Auxiliar</span>
                                <span class="buscador-dato-valor">${escaparHtmlBuscador(auxNombre || 'Sin nombre')}</span>
                                <div style="font-size: 0.78rem; color: #334155; margin-top: 3px; line-height: 1.35;">
                                    ${auxDni ? `<div><strong>DNI:</strong> ${escaparHtmlBuscador(auxDni)}</div>` : ''}
                                    ${auxCel ? `<div><strong>Celular:</strong> ${escaparHtmlBuscador(auxCel)}</div>` : ''}
                                    ${auxFijo ? `<div><strong>Tel. Fijo:</strong> ${escaparHtmlBuscador(auxFijo)}</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        const htmlFichaCompleta = Object.entries(fichaCompletaMap).map(([campo, val]) => `
            <div class="buscador-dato-item" style="padding: 6px 10px;">
                <span class="buscador-dato-label">${escaparHtmlBuscador(campo)}</span>
                <span class="buscador-dato-valor" style="font-weight: ${val === '-' ? '400' : '600'}; color: ${val === '-' ? '#94a3b8' : '#0f172a'};">${escaparHtmlBuscador(val)}</span>
            </div>
        `).join('');

        return `
            <div class="buscador-alumno-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0;">
                            <i class="material-icons" style="font-size: 1.3rem;">person</i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span style="font-size: 1.05rem; font-weight: 700; color: #0f172a;">${escaparHtmlBuscador(al.nombreCompleto)}</span>
                                <span style="background: #0284c7; color: #ffffff; padding: 2px 10px; border-radius: 999px; font-size: 0.76rem; font-weight: 700;">
                                    ${escaparHtmlBuscador(al.gradoLabel)}
                                </span>
                                ${al.numeroOrden ? `<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600;">Orden #${escaparHtmlBuscador(al.numeroOrden)}</span>` : ''}
                                ${estadoBadge}
                                ${ocultoBadge}
                            </div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                                DNI: <strong style="color: #1e293b;">${escaparHtmlBuscador(al.dni || 'Sin DNI')}</strong>
                                ${nombrePlanillaDestino ? ` · Planilla: <span style="color: #334155;">${escaparHtmlBuscador(nombrePlanillaDestino)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <button
                            type="button"
                            class="btn-small waves-effect waves-light blue-grey lighten-5"
                            style="color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; height: 30px; line-height: 28px; padding: 0 10px; text-transform: none; font-size: 0.78rem; box-shadow: none;"
                            onclick="window.copiarDniBuscadorAlumno('${escaparHtmlBuscador(al.dni)}')"
                            title="Copiar DNI al portapapeles"
                        >
                            <i class="material-icons left tiny" style="margin-right: 4px; font-size: 0.95rem;">content_copy</i> Copiar DNI
                        </button>
                        <button
                            type="button"
                            class="btn-small waves-effect waves-light blue-grey lighten-5"
                            style="color: #0369a1; border: 1px solid #bae6fd; border-radius: 8px; height: 30px; line-height: 28px; padding: 0 10px; text-transform: none; font-size: 0.78rem; box-shadow: none;"
                            onclick="const el = document.getElementById('${idDetalleCompleto}'); if(el){ el.style.display = el.style.display === 'none' ? 'block' : 'none'; }"
                        >
                            <i class="material-icons left tiny" style="margin-right: 4px; font-size: 0.95rem;">badge</i> Ficha Completa
                        </button>
                        <button
                            type="button"
                            class="btn-small waves-effect waves-light deep-purple lighten-5"
                            style="color: #4527a0; border: 1px solid #d1c4e9; border-radius: 8px; height: 30px; line-height: 28px; padding: 0 10px; text-transform: none; font-size: 0.78rem; font-weight: 600; box-shadow: none;"
                            onclick="window.abrirHistorialAlumnoPorDni && window.abrirHistorialAlumnoPorDni('${escaparHtmlBuscador(al.dni)}', '${escaparHtmlBuscador(nombrePlanillaDestino)}')"
                            title="Ver historial de cambios por fecha y restaurar notas o datos de este alumno"
                        >
                            <i class="material-icons left tiny" style="margin-right: 4px; font-size: 0.95rem;">history</i> Historial / Restaurar
                        </button>
                        ${nombrePlanillaDestino ? `
                            <button
                                type="button"
                                class="btn-small waves-effect waves-light light-blue darken-3"
                                style="border-radius: 8px; height: 30px; line-height: 30px; padding: 0 12px; text-transform: none; font-size: 0.78rem; font-weight: 600;"
                                onclick="window.irAAlumnoDesdeBuscador('${escaparHtmlBuscador(nombrePlanillaDestino)}', '${escaparHtmlBuscador(al.dni)}')"
                                title="Abrir planilla y seleccionar este alumno"
                            >
                                <i class="material-icons left tiny" style="margin-right: 4px; font-size: 0.95rem;">open_in_new</i> Ver en Planilla
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Datos Personales Principales -->
                <div class="buscador-datos-grid">
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">DNI</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(al.dni || 'No registrado')}</span>
                    </div>
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">Apellido</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(al.apellido || '-')}</span>
                    </div>
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">Nombre</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(al.nombre || '-')}</span>
                    </div>
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">Grado y División</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(al.gradoLabel)}</span>
                    </div>
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">Sexo</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(sexoTexto)}</span>
                    </div>
                    <div class="buscador-dato-item">
                        <span class="buscador-dato-label">Fecha de Nacimiento</span>
                        <span class="buscador-dato-valor">${escaparHtmlBuscador(al.fechaNacimiento || 'No registrada')}</span>
                    </div>
                    ${lugarNac ? `
                        <div class="buscador-dato-item">
                            <span class="buscador-dato-label">Lugar de Nacimiento</span>
                            <span class="buscador-dato-valor">${escaparHtmlBuscador(lugarNac)}</span>
                        </div>
                    ` : ''}
                    ${direccion ? `
                        <div class="buscador-dato-item">
                            <span class="buscador-dato-label">Dirección / Domicilio</span>
                            <span class="buscador-dato-valor">${escaparHtmlBuscador(direccion)}</span>
                        </div>
                    ` : ''}
                    ${(lugarBautismo || fechaBautismo) ? `
                        <div class="buscador-dato-item">
                            <span class="buscador-dato-label">Bautismo</span>
                            <span class="buscador-dato-valor">${escaparHtmlBuscador([lugarBautismo, fechaBautismo].filter(Boolean).join(' - '))}</span>
                        </div>
                    ` : ''}
                    ${observaciones ? `
                        <div class="buscador-dato-item">
                            <span class="buscador-dato-label">Observaciones</span>
                            <span class="buscador-dato-valor">${escaparHtmlBuscador(observaciones)}</span>
                        </div>
                    ` : ''}
                </div>

                ${htmlFamilia}

                <!-- Ficha Completa Desplegable (Todos los campos de DATOS) -->
                <div id="${idDetalleCompleto}" style="display: none; margin-top: 12px; padding-top: 10px; border-top: 1px solid #cbd5e1;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;">
                        Ficha Personal Completa (Hoja DATOS)
                    </div>
                    <div class="buscador-datos-grid">
                        ${htmlFichaCompleta}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = htmlCards;
}

window.copiarDniBuscadorAlumno = function(dni) {
    if (!dni) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(dni)).then(() => {
            M.toast({ html: `📋 DNI ${dni} copiado al portapapeles`, classes: 'blue darken-2', displayLength: 2000 });
        }).catch(() => {});
    }
};

window.irAAlumnoDesdeBuscador = function(nombrePlanilla, dniAlumno) {
    if (!esAdministradorAutorizadoBuscador() || !nombrePlanilla) return;

    const modalEl = document.getElementById('modal-buscador-alumnos');
    if (modalEl && typeof M !== 'undefined' && M.Modal) {
        const inst = M.Modal.getInstance(modalEl);
        if (inst) inst.close();
    }

    const inputPlanilla = document.getElementById('select-planilla');
    if (inputPlanilla) {
        inputPlanilla.value = nombrePlanilla;
        if (typeof manejarSeleccionDePlanilla === 'function') {
            manejarSeleccionDePlanilla(nombrePlanilla);
        } else {
            inputPlanilla.dispatchEvent(new Event('change'));
        }

        // Esperar a que cargue la planilla y seleccionar automáticamente al alumno en la hoja DATOS
        let intentos = 0;
        const timerSel = setInterval(() => {
            intentos++;
            const selAl = document.getElementById('select-alumno');
            if (selAl && !selAl.disabled && selAl.options.length > 1) {
                const opt = Array.from(selAl.options).find(o => String(o.value).trim() === String(dniAlumno).trim());
                if (opt) {
                    clearInterval(timerSel);
                    selAl.value = opt.value;
                    if (typeof M !== 'undefined' && M.FormSelect) {
                        M.FormSelect.init(selAl);
                    }
                    if (typeof cargarDatosDeAlumno === 'function') {
                        cargarDatosDeAlumno();
                    } else {
                        selAl.dispatchEvent(new Event('change'));
                    }
                    M.toast({ html: `👤 Alumno cargado en ${nombrePlanilla}`, classes: 'green darken-2', displayLength: 2500 });
                }
            }
            if (intentos > 40) clearInterval(timerSel);
        }, 250);
    }
};

// =========================================================================
// EXPORTACIÓN A EXCEL (.XLSX) E IMPRESIÓN DE LISTAS DE TODOS LOS GRADOS
// =========================================================================

function escaparXmlExcel(valor) {
    return String(valor == null ? '' : valor)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function obtenerLetraColumnaExcel(colIdxZeroBased) {
    let n = colIdxZeroBased + 1;
    let str = '';
    while (n > 0) {
        const rem = (n - 1) % 26;
        str = String.fromCharCode(65 + rem) + str;
        n = Math.floor((n - 1) / 26);
    }
    return str;
}

function agruparAlumnosPorGradoYSeccion(padron, filtroGrado = '', filtroSeccion = '') {
    const mapaCursos = new Map();
    (padron || []).forEach(al => {
        if (al.oculto) return;
        const g = String(al.grado || '').trim();
        const s = String(al.seccion || '').trim().toUpperCase();
        if (filtroGrado && g !== filtroGrado) return;
        if (filtroSeccion && s !== filtroSeccion) return;
        const clave = `${g || '99'}_${s || 'Z'}`;
        if (!mapaCursos.has(clave)) {
            mapaCursos.set(clave, {
                grado: g,
                seccion: s,
                tituloCurso: g ? `${g}° GRADO - DIVISIÓN "${s || '-'}"` : 'SIN GRADO ASIGNADO',
                alumnos: []
            });
        }
        mapaCursos.get(clave).alumnos.push(al);
    });

    const cursosOrdenados = Array.from(mapaCursos.values()).sort((a, b) => {
        const gA = Number(a.grado) || 99;
        const gB = Number(b.grado) || 99;
        if (gA !== gB) return gA - gB;
        return a.seccion.localeCompare(b.seccion, 'es');
    });

    cursosOrdenados.forEach(c => {
        c.alumnos.sort((a, b) => {
            const ordA = Number(a.numeroOrden) || 999;
            const ordB = Number(b.numeroOrden) || 999;
            if (ordA !== ordB) return ordA - ordB;
            return a.nombreCompleto.localeCompare(b.nombreCompleto, 'es');
        });
    });

    return cursosOrdenados;
}

function generarNombreHojaExcelUnico(baseNombre, usadosSet) {
    let limpio = String(baseNombre || 'Hoja')
        .replace(/[:\\/?*\[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!limpio) limpio = 'Hoja';
    limpio = limpio.slice(0, 31).trim();

    let candidato = limpio;
    let contador = 2;
    while (usadosSet.has(candidato.toLowerCase())) {
        const sufijo = ` (${contador})`;
        candidato = `${limpio.slice(0, Math.max(1, 31 - sufijo.length)).trim()}${sufijo}`;
        contador++;
    }
    usadosSet.add(candidato.toLowerCase());
    return candidato;
}

function construirXmlHojaExcel(cursosDelBloque, tituloPrincipal) {
    let filaNum = 1;
    const filasXml = [];
    const mergesXml = [];

    // Fila 1: Título Institucional Principal (Estilo 1)
    filasXml.push(
        `<row r="${filaNum}" ht="26" customHeight="1">` +
        `<c r="A${filaNum}" s="1" t="inlineStr"><is><t>${escaparXmlExcel(tituloPrincipal)}</t></is></c>` +
        `<c r="B${filaNum}" s="1"/><c r="C${filaNum}" s="1"/><c r="D${filaNum}" s="1"/><c r="E${filaNum}" s="1"/><c r="F${filaNum}" s="1"/><c r="G${filaNum}" s="1"/>` +
        `</row>`
    );
    mergesXml.push(`<mergeCell ref="A${filaNum}:G${filaNum}"/>`);
    filaNum += 2;

    const encabezados = ['N°', 'GRADO', 'DIVISIÓN', 'APELLIDO', 'NOMBRE', 'APELLIDO Y NOMBRE', 'DNI'];

    cursosDelBloque.forEach(curso => {
        // Banda de encabezado del curso (Estilo 2)
        const subtitulo = `${curso.tituloCurso}  (Total: ${curso.alumnos.length} alumnos)`;
        filasXml.push(
            `<row r="${filaNum}" ht="22" customHeight="1">` +
            `<c r="A${filaNum}" s="2" t="inlineStr"><is><t>${escaparXmlExcel(subtitulo)}</t></is></c>` +
            `<c r="B${filaNum}" s="2"/><c r="C${filaNum}" s="2"/><c r="D${filaNum}" s="2"/><c r="E${filaNum}" s="2"/><c r="F${filaNum}" s="2"/><c r="G${filaNum}" s="2"/>` +
            `</row>`
        );
        mergesXml.push(`<mergeCell ref="A${filaNum}:G${filaNum}"/>`);
        filaNum++;

        // Encabezados de columnas de la tabla (Estilo 3)
        let celdasHeader = '';
        encabezados.forEach((hTexto, colIdx) => {
            const colLetra = obtenerLetraColumnaExcel(colIdx);
            celdasHeader += `<c r="${colLetra}${filaNum}" s="3" t="inlineStr"><is><t>${escaparXmlExcel(hTexto)}</t></is></c>`;
        });
        filasXml.push(`<row r="${filaNum}" ht="20" customHeight="1">${celdasHeader}</row>`);
        filaNum++;

        // Filas de alumnos (Estilo 4 = centrado con bordes, Estilo 5 = texto izquierda con bordes)
        curso.alumnos.forEach((al, idx) => {
            const nro = al.numeroOrden ? String(al.numeroOrden) : String(idx + 1);
            const gradoTxt = al.grado ? `${al.grado}°` : '-';
            const secTxt = al.seccion || '-';
            const apellidoTxt = al.apellido || '';
            const nombreTxt = al.nombre || '';
            const apNomTxt = al.nombreCompleto || `${apellidoTxt}, ${nombreTxt}`;
            const dniTxt = al.dni || '';

            const valoresFila = [
                { val: nro, style: 4 },
                { val: gradoTxt, style: 4 },
                { val: secTxt, style: 4 },
                { val: apellidoTxt, style: 5 },
                { val: nombreTxt, style: 5 },
                { val: apNomTxt, style: 5 },
                { val: dniTxt, style: 4 }
            ];

            let celdasAlumno = '';
            valoresFila.forEach((item, colIdx) => {
                const colLetra = obtenerLetraColumnaExcel(colIdx);
                celdasAlumno += `<c r="${colLetra}${filaNum}" s="${item.style}" t="inlineStr"><is><t>${escaparXmlExcel(item.val)}</t></is></c>`;
            });
            filasXml.push(`<row r="${filaNum}" ht="18" customHeight="1">${celdasAlumno}</row>`);
            filaNum++;
        });

        // Fila vacía de separación entre cursos
        filaNum++;
    });

    const mergeBlock = mergesXml.length > 0
        ? `<mergeCells count="${mergesXml.length}">${mergesXml.join('')}</mergeCells>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="7" customWidth="1"/>
    <col min="2" max="2" width="10" customWidth="1"/>
    <col min="3" max="3" width="11" customWidth="1"/>
    <col min="4" max="4" width="26" customWidth="1"/>
    <col min="5" max="5" width="26" customWidth="1"/>
    <col min="6" max="6" width="38" customWidth="1"/>
    <col min="7" max="7" width="16" customWidth="1"/>
  </cols>
  <sheetData>${filasXml.join('')}</sheetData>
  ${mergeBlock}
</worksheet>`;
}

window.descargarListasAlumnosExcel = async function() {
    if (!esAdministradorAutorizadoBuscador()) {
        if (typeof M !== 'undefined' && M.toast) {
            M.toast({ html: 'Acceso restringido: solo para el administrador.', classes: 'red darken-3' });
        }
        return;
    }

    const btn = document.getElementById('btn-descargar-excel-alumnos');
    const htmlOriginal = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="material-icons left tiny">hourglass_empty</i> Generando Excel...';
    }

    try {
        const padron = await cargarPadronCompletoAlumnosAdmin(false);
        const filtroGrado = (document.getElementById('select-buscador-alumnos-grado')?.value || '').trim();
        const filtroSeccion = (document.getElementById('select-buscador-alumnos-seccion')?.value || '').trim().toUpperCase();

        const cursos = agruparAlumnosPorGradoYSeccion(padron, filtroGrado, filtroSeccion);
        if (cursos.length === 0) {
            M.toast({ html: 'No hay alumnos para exportar con el filtro seleccionado.', classes: 'orange darken-3' });
            return;
        }

        // Preparar hojas del libro Excel (.xlsx)
        const hojasLibro = [];
        const nombresHojasUsados = new Set();
        const etiquetaAlcance = filtroGrado
            ? `${filtroGrado}° GRADO${filtroSeccion ? ' - DIVISIÓN ' + filtroSeccion : ''}`
            : 'TODOS LOS GRADOS (1° A 6°)';

        // Si hay más de un curso, incluir primero la hoja resumen general
        if (cursos.length > 1) {
            const nombreResumen = generarNombreHojaExcelUnico(
                filtroGrado ? `Grado ${filtroGrado}` : 'Todos los Grados',
                nombresHojasUsados
            );
            hojasLibro.push({
                nombreHoja: nombreResumen,
                xml: construirXmlHojaExcel(cursos, `COLEGIO NUESTRA SEÑORA DE LA MISERICORDIA - NÓMINA DE ALUMNOS (${etiquetaAlcance})`)
            });
        }

        // Una hoja individual por cada grado y sección
        cursos.forEach(curso => {
            const etiquetaCurso = curso.grado
                ? `${curso.grado}° ${curso.seccion || '-'}`
                : `Sin grado ${curso.seccion || ''}`.trim();
            const nombreHoja = generarNombreHojaExcelUnico(etiquetaCurso, nombresHojasUsados);
            hojasLibro.push({
                nombreHoja,
                xml: construirXmlHojaExcel([curso], `COLEGIO NUESTRA SEÑORA DE LA MISERICORDIA - ${curso.tituloCurso}`)
            });
        });

        if (typeof JSZip === 'undefined') {
            throw new Error('La librería JSZip no está cargada para empaquetar el archivo .xlsx.');
        }

        const zip = new JSZip();

        // 1. [Content_Types].xml
        const overridesSheets = hojasLibro.map((_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        ).join('');
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overridesSheets}
</Types>`);

        // 2. _rels/.rels
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

        // 3. xl/workbook.xml
        const sheetsEntries = hojasLibro.map((h, i) =>
            `<sheet name="${escaparXmlExcel(h.nombreHoja)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
        ).join('');
        zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetsEntries}</sheets>
</workbook>`);

        // 4. xl/_rels/workbook.xml.rels
        const relsEntries = hojasLibro.map((_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
        ).join('');
        const stylesRelId = hojasLibro.length + 1;
        zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsEntries}
  <Relationship Id="rId${stylesRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

        // 5. xl/styles.xml (Estilos con encabezados institucionales y bordes de tabla Excel)
        zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="10"/><color rgb="FF000000"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF0D47A1"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0D47A1"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0F2FE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0284C7"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`);

        // 6. xl/worksheets/sheetN.xml
        hojasLibro.forEach((h, i) => {
            zip.file(`xl/worksheets/sheet${i + 1}.xml`, h.xml);
        });

        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const fechaStr = new Date().toISOString().slice(0, 10);
        const sufijoArchivo = filtroGrado
            ? `_Grado_${filtroGrado}${filtroSeccion ? '_' + filtroSeccion : ''}`
            : '_Todos_Los_Grados';
        const nombreArchivo = `Listas_Alumnos_Misericordia${sufijoArchivo}_${fechaStr}.xlsx`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 600);

        M.toast({ html: `✅ Archivo Excel descargado: ${nombreArchivo}`, classes: 'green darken-2', displayLength: 3500 });
    } catch (err) {
        console.error('Error generando Excel de alumnos:', err);
        M.toast({ html: '❌ Error al generar Excel: ' + err.message, classes: 'red darken-3' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = htmlOriginal;
        }
    }
};

const COLUMNAS_IMPRESION_ALUMNOS = [
    {
        id: 'nro',
        label: 'N°',
        width: '42px',
        align: 'center',
        defaultChecked: true,
        getValue: (al, idx) => (al.numeroOrden ? String(al.numeroOrden) : String(idx + 1))
    },
    {
        id: 'grado',
        label: 'GRADO',
        width: '60px',
        align: 'center',
        defaultChecked: true,
        getValue: (al) => (al.grado ? `${al.grado}°` : '-')
    },
    {
        id: 'seccion',
        label: 'DIVISIÓN',
        width: '70px',
        align: 'center',
        defaultChecked: true,
        getValue: (al) => (al.seccion || '-')
    },
    {
        id: 'apellido',
        label: 'APELLIDO',
        width: 'auto',
        align: 'left',
        defaultChecked: true,
        getValue: (al) => (al.apellido || '')
    },
    {
        id: 'nombre',
        label: 'NOMBRE',
        width: 'auto',
        align: 'left',
        defaultChecked: true,
        getValue: (al) => (al.nombre || '')
    },
    {
        id: 'nombreCompleto',
        label: 'APELLIDO Y NOMBRE',
        width: 'auto',
        align: 'left',
        bold: true,
        defaultChecked: true,
        getValue: (al) => (al.nombreCompleto || '')
    },
    {
        id: 'dni',
        label: 'DNI',
        width: '100px',
        align: 'center',
        mono: true,
        defaultChecked: true,
        getValue: (al) => (al.dni || '')
    },
    {
        id: 'sexo',
        label: 'SEXO',
        width: '55px',
        align: 'center',
        defaultChecked: false,
        getValue: (al) => (al.sexo || '-')
    },
    {
        id: 'fechaNacimiento',
        label: 'FECHA NAC.',
        width: '92px',
        align: 'center',
        defaultChecked: false,
        getValue: (al) => (al.fechaNacimiento || '-')
    }
];

let ultimaSeleccionColumnasImpresion = null;

function abrirSelectorColumnasImpresionAlumnos(onConfirmar) {
    const existente = document.getElementById('overlay-selector-columnas-impresion');
    if (existente) existente.remove();

    const seleccionInicial = new Set(
        Array.isArray(ultimaSeleccionColumnasImpresion) && ultimaSeleccionColumnasImpresion.length > 0
            ? ultimaSeleccionColumnasImpresion
            : COLUMNAS_IMPRESION_ALUMNOS.filter(c => c.defaultChecked).map(c => c.id)
    );

    const overlay = document.createElement('div');
    overlay.id = 'overlay-selector-columnas-impresion';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,0.58);display:flex;align-items:center;justify-content:center;padding:16px;';

    const checkboxesHtml = COLUMNAS_IMPRESION_ALUMNOS.map(col => {
        const checkedAttr = seleccionInicial.has(col.id) ? 'checked' : '';
        return `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;user-select:none;">
                <input type="checkbox" class="chk-col-impresion" value="${col.id}" ${checkedAttr} style="position:static;opacity:1;pointer-events:auto;width:16px;height:16px;accent-color:#0284c7;margin:0;" />
                <span style="font-size:13.5px;font-weight:600;color:#0f172a;">${escaparHtmlBuscador(col.label)}</span>
            </label>
        `;
    }).join('');

    overlay.innerHTML = `
        <div style="background:#ffffff;border-radius:12px;max-width:460px;width:100%;box-shadow:0 20px 40px rgba(15,23,42,0.28);overflow:hidden;border:1px solid #cbd5e1;">
            <div style="background:#0f172a;color:#ffffff;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;">
                    <i class="material-icons" style="font-size:20px;color:#38bdf8;">view_column</i>
                    Columnas a incluir en la impresión
                </div>
                <button type="button" id="btn-cerrar-col-impresion" style="background:transparent;border:none;color:#cbd5e1;cursor:pointer;font-size:20px;line-height:1;">&times;</button>
            </div>
            <div style="padding:16px 18px;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#475569;">
                    Selecciona qué columnas deseas que aparezcan en cada hoja (una hoja por cada grado y sección):
                </p>
                <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                    <button type="button" id="btn-col-todas" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;">Todas</button>
                    <button type="button" id="btn-col-basicas" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;">Básicas (N°, Apellido y Nombre, DNI)</button>
                    <button type="button" id="btn-col-ninguna" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;">Ninguna</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:290px;overflow-y:auto;">
                    ${checkboxesHtml}
                </div>
            </div>
            <div style="padding:12px 18px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;">
                <button type="button" id="btn-cancelar-col-impresion" style="background:#ffffff;color:#475569;border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
                <button type="button" id="btn-confirmar-col-impresion" style="background:#0284c7;color:#ffffff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                    <i class="material-icons" style="font-size:17px;">print</i> Generar lista
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const cerrar = () => {
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
    };
    const onKeyDown = (e) => {
        if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', onKeyDown);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar();
    });
    overlay.querySelector('#btn-cerrar-col-impresion').addEventListener('click', cerrar);
    overlay.querySelector('#btn-cancelar-col-impresion').addEventListener('click', cerrar);

    const checkboxes = Array.from(overlay.querySelectorAll('.chk-col-impresion'));
    overlay.querySelector('#btn-col-todas').addEventListener('click', () => {
        checkboxes.forEach(chk => { chk.checked = true; });
    });
    overlay.querySelector('#btn-col-ninguna').addEventListener('click', () => {
        checkboxes.forEach(chk => { chk.checked = false; });
    });
    overlay.querySelector('#btn-col-basicas').addEventListener('click', () => {
        const basicas = new Set(['nro', 'nombreCompleto', 'dni']);
        checkboxes.forEach(chk => { chk.checked = basicas.has(chk.value); });
    });

    overlay.querySelector('#btn-confirmar-col-impresion').addEventListener('click', () => {
        const idsSeleccionados = checkboxes.filter(chk => chk.checked).map(chk => chk.value);
        if (idsSeleccionados.length === 0) {
            if (typeof M !== 'undefined' && M.toast) {
                M.toast({ html: 'Selecciona al menos una columna para imprimir.', classes: 'orange darken-3' });
            }
            return;
        }
        ultimaSeleccionColumnasImpresion = idsSeleccionados;
        cerrar();
        onConfirmar(idsSeleccionados);
    });
}

window.imprimirListasAlumnosPorGrado = function() {
    if (!esAdministradorAutorizadoBuscador()) {
        if (typeof M !== 'undefined' && M.toast) {
            M.toast({ html: 'Acceso restringido: solo para el administrador.', classes: 'red darken-3' });
        }
        return;
    }

    abrirSelectorColumnasImpresionAlumnos((idsSeleccionados) => {
        generarVistaImpresionListasAlumnos(idsSeleccionados);
    });
};

async function generarVistaImpresionListasAlumnos(idsColumnasSeleccionadas) {
    const columnasActivas = COLUMNAS_IMPRESION_ALUMNOS.filter(c => idsColumnasSeleccionadas.includes(c.id));
    if (columnasActivas.length === 0) return;

    const btn = document.getElementById('btn-imprimir-listas-alumnos');
    const htmlOriginal = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="material-icons left tiny">hourglass_empty</i> Preparando...';
    }

    try {
        const padron = await cargarPadronCompletoAlumnosAdmin(false);
        const filtroGrado = (document.getElementById('select-buscador-alumnos-grado')?.value || '').trim();
        const filtroSeccion = (document.getElementById('select-buscador-alumnos-seccion')?.value || '').trim().toUpperCase();

        const cursos = agruparAlumnosPorGradoYSeccion(padron, filtroGrado, filtroSeccion);
        if (cursos.length === 0) {
            M.toast({ html: 'No hay alumnos para imprimir con el filtro seleccionado.', classes: 'orange darken-3' });
            return;
        }

        const totalAlumnosImprimir = cursos.reduce((acc, c) => acc + c.alumnos.length, 0);
        const tituloAlcance = filtroGrado
            ? `${filtroGrado}° Grado${filtroSeccion ? ' - División "' + filtroSeccion + '"' : ' (Todas las divisiones)'}`
            : 'Todos los Grados (1° a 6° Grado)';

        const encabezadosHtml = columnasActivas.map(col => {
            const widthStyle = col.width && col.width !== 'auto' ? `width: ${col.width};` : '';
            return `<th style="${widthStyle}">${escaparHtmlBuscador(col.label)}</th>`;
        }).join('');

        const bloquesHtml = cursos.map((curso, cIdx) => {
            const cantAlumnos = Math.max(1, curso.alumnos.length);
            let fontSizePx = cantAlumnos <= 24 ? 13 : (cantAlumnos <= 31 ? 12 : 11);
            if (columnasActivas.length >= 8 && fontSizePx > 11) {
                fontSizePx -= 1;
            }
            fontSizePx = Math.max(11, Math.min(13, fontSizePx));
            const altoFilaMm = (266 / cantAlumnos).toFixed(2);

            const filasHtml = curso.alumnos.map((al, idx) => {
                const celdasHtml = columnasActivas.map(col => {
                    const cls = col.align === 'center' ? ' class="col-center"' : '';
                    const estilos = [];
                    if (col.bold) estilos.push('font-weight: 600');
                    if (col.mono) estilos.push('font-family: monospace; font-weight: 600');
                    const styleAttr = estilos.length > 0 ? ` style="${estilos.join('; ')};"` : '';
                    return `<td${cls}${styleAttr}>${escaparHtmlBuscador(col.getValue(al, idx))}</td>`;
                }).join('');
                return `<tr>${celdasHtml}</tr>`;
            }).join('');

            return `
                <div class="curso-bloque ${cIdx > 0 ? 'salto-pagina' : ''}" style="--print-font-size: ${fontSizePx}px; --print-row-height: ${altoFilaMm}mm;">
                    <div class="curso-header">
                        <span>COLEGIO NUESTRA SEÑORA DE LA MISERICORDIA · ${escaparHtmlBuscador(curso.tituloCurso)}</span>
                        <span>Total: ${curso.alumnos.length} alumnos</span>
                    </div>
                    <table class="excel-table">
                        <thead>
                            <tr>${encabezadosHtml}</tr>
                        </thead>
                        <tbody>
                            ${filasHtml}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

        const ventanaImpresion = window.open('', '_blank');
        if (!ventanaImpresion) {
            M.toast({ html: 'Permite las ventanas emergentes en tu navegador para poder imprimir.', classes: 'orange darken-3' });
            return;
        }

        ventanaImpresion.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Listas de Alumnos - ${escaparHtmlBuscador(tituloAlcance)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      margin: 0;
      padding: 18px 24px;
      color: #0f172a;
      background: #f8fafc;
    }
    .toolbar-no-print {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    }
    .toolbar-no-print button {
      background: #0284c7;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
    }
    .toolbar-no-print button.btn-cerrar {
      background: #475569;
    }
    .curso-bloque {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 24px;
    }
    .curso-header {
      background: #e0f2fe;
      color: #0d47a1;
      border: 1px solid #94a3b8;
      border-bottom: none;
      padding: 8px 12px;
      font-weight: 700;
      font-size: 13.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.excel-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table.excel-table th {
      background: #0284c7;
      color: #ffffff;
      font-weight: 700;
      text-align: center;
      padding: 6px 8px;
      border: 1px solid #64748b;
      letter-spacing: 0.03em;
    }
    table.excel-table td {
      padding: 5px 8px;
      border: 1px solid #94a3b8;
      color: #0f172a;
    }
    table.excel-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .col-center {
      text-align: center;
    }
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
        margin: 0;
      }
      .toolbar-no-print {
        display: none !important;
      }
      .curso-bloque {
        width: 100%;
        height: 284mm;
        display: flex;
        flex-direction: column;
        border: none;
        border-radius: 0;
        padding: 0;
        margin-bottom: 0;
      }
      .salto-pagina {
        break-before: page;
        page-break-before: always;
      }
      .curso-header {
        background: #f1f5f9 !important;
        color: #000000 !important;
        padding: 5px 10px;
        font-size: 13px;
        flex-shrink: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table.excel-table {
        width: 100%;
        flex: 1;
        height: 100%;
        font-size: var(--print-font-size, 12px);
      }
      table.excel-table thead {
        display: table-header-group;
      }
      table.excel-table tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      table.excel-table tbody tr {
        height: var(--print-row-height, auto);
      }
      table.excel-table th {
        background: #e2e8f0 !important;
        color: #000000 !important;
        padding: 4px 6px;
        font-size: var(--print-font-size, 12px);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table.excel-table td {
        padding: 2px 6px;
        line-height: 1.15;
        font-size: var(--print-font-size, 12px);
      }
    }
  </style>
</head>
<body>
  <div class="toolbar-no-print">
    <div>
      <strong>Listas de Alumnos (${escaparHtmlBuscador(tituloAlcance)})</strong>
      <span style="margin-left: 12px; font-size: 13px; color: #cbd5e1;">${cursos.length} cursos · ${totalAlumnosImprimir} alumnos</span>
    </div>
    <div>
      <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      <button class="btn-cerrar" onclick="window.close()">Cerrar</button>
    </div>
  </div>
  ${bloquesHtml}
</body>
</html>`);
        ventanaImpresion.document.close();
    } catch (err) {
        console.error('Error preparando impresión de listas:', err);
        M.toast({ html: '❌ Error al preparar la impresión: ' + err.message, classes: 'red darken-3' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = htmlOriginal;
        }
    }
};

// =========================================================================
// SISTEMA DE HISTORIAL DE VERSIONES Y RESTAURACIÓN HACIA ATRÁS POR ALUMNO (OPCIÓN A)
// =========================================================================

const SEPARADOR_SNAPSHOT_AUDITORIA = '\n@@SNAPSHOT@@';

window.codificarCambiosConSnapshot = function(textoLegible, snapshotObj) {
    const baseTexto = String(textoLegible || '').split(SEPARADOR_SNAPSHOT_AUDITORIA)[0].trim();
    if (!snapshotObj || typeof snapshotObj !== 'object') return baseTexto;
    try {
        return `${baseTexto}${SEPARADOR_SNAPSHOT_AUDITORIA}${JSON.stringify(snapshotObj)}`;
    } catch (e) {
        return baseTexto;
    }
};

window.limpiarTextoCambiosAuditoria = function(rawCambios) {
    return String(rawCambios || '').split(SEPARADOR_SNAPSHOT_AUDITORIA)[0].trim();
};

function normalizarNombreCampoDatosHistorial(clave) {
    const k = String(clave || '').trim();
    const kLow = k.toLowerCase();
    if (kLow === 'apellido') return 'APELLIDO';
    if (kLow === 'nombre') return 'NOMBRE';
    if (kLow === 'sexo') return 'SEXO';
    if (kLow === 'fecha_nacimiento') return 'FECHA NACIMIENTO';
    if (kLow === 'activo') return 'ACTIVOS';
    if (kLow === 'oculto') return 'OCULTO';
    return k;
}

window.parsearRegistroAuditoria = function(log) {
    const raw = String((log && log.cambios) || '');
    const partes = raw.split(SEPARADOR_SNAPSHOT_AUDITORIA);
    const textoLegible = (partes[0] || '').trim();
    const hoja = String((log && log.hoja) || '').trim();
    const esHojaDatos = hoja.toUpperCase() === 'DATOS';

    if (partes.length > 1 && partes[1]) {
        try {
            const parsed = JSON.parse(partes[1]);
            if (parsed && typeof parsed === 'object') {
                return {
                    textoLegible,
                    tieneSnapshotCompleto: true,
                    tipo: parsed.tipo || (esHojaDatos ? 'DATOS' : 'CALIFICACIONES'),
                    antes: (parsed.antes && typeof parsed.antes === 'object') ? parsed.antes : {},
                    despues: (parsed.despues && typeof parsed.despues === 'object') ? parsed.despues : {},
                    campos: (parsed.campos && typeof parsed.campos === 'object') ? parsed.campos : {}
                };
            }
        } catch (e) {}
    }

    // Fallback retrocompatible para registros de auditoría previos sin @@SNAPSHOT@@
    const antes = {};
    const despues = {};
    const campos = {};
    const segmentos = textoLegible.split(/\s*\|\s*/);

    segmentos.forEach(seg => {
        const s = seg.trim();
        if (!s) return;

        // Formato 1: Campo: "viejo" ➔ "nuevo" (o ->)
        const mFlecha = s.match(/^([^:]+):\s*"([^"]*)"\s*(?:➔|->|→)\s*"([^"]*)"$/);
        if (mFlecha) {
            const rawCampo = mFlecha[1].trim();
            const campo = esHojaDatos ? normalizarNombreCampoDatosHistorial(rawCampo) : rawCampo;
            const vViejo = mFlecha[2].trim();
            const vNuevo = mFlecha[3].trim();
            antes[campo] = vViejo;
            despues[campo] = vNuevo;
            campos[campo] = { antes: vViejo, despues: vNuevo };
            return;
        }

        // Formato 2: Campo: valor
        const idxDosPuntos = s.indexOf(':');
        if (idxDosPuntos > 0) {
            const rawCampo = s.slice(0, idxDosPuntos).trim();
            const campo = esHojaDatos ? normalizarNombreCampoDatosHistorial(rawCampo) : rawCampo;
            let val = s.slice(idxDosPuntos + 1).trim();
            if (esHojaDatos && campo === 'ACTIVOS') {
                const up = val.toUpperCase();
                val = (up === 'TRUE' || up === 'SÍ' || up === 'SI' || up === '1') ? 'TRUE' : 'FALSE';
            }
            despues[campo] = val;
            campos[campo] = { antes: undefined, despues: val };
        }
    });

    return {
        textoLegible,
        tieneSnapshotCompleto: false,
        tipo: esHojaDatos ? 'DATOS' : 'CALIFICACIONES',
        antes,
        despues,
        campos
    };
};

let _estadoHistorialAlumnoModal = {
    dni: '',
    nombreCompleto: '',
    nombrePlanillaContexto: '',
    planillaIdContexto: null,
    alumnoDb: null,
    calificacionesActuales: [],
    logsAuditoria: []
};

function formatearEtiquetaHojaHistorial(nombreHoja) {
    const h = String(nombreHoja || '').trim();
    if (!h) return 'Sin hoja';
    if (typeof obtenerInfoHoja === 'function') {
        const info = obtenerInfoHoja(h);
        if (info && info.nombre && info.nombre !== h) {
            return `${info.nombre} (${h})`;
        }
    }
    return h;
}

window.abrirHistorialAlumnoActual = function() {
    if (!window.esUsuarioAdmin) {
        M.toast({ html: 'Acceso restringido: solo el Administrador puede restaurar notas o datos.', classes: 'red darken-3' });
        return;
    }
    const dni = (typeof selectAlumno !== 'undefined' && selectAlumno && selectAlumno.value)
        ? String(selectAlumno.value).trim()
        : String(window.dniAlumnoActual || '').trim();
    if (!dni) {
        M.toast({ html: 'Selecciona primero un alumno en la planilla.', classes: 'orange darken-3' });
        return;
    }
    const nomPlanilla = (typeof selectPlanilla !== 'undefined' && selectPlanilla && selectPlanilla.value)
        ? selectPlanilla.value.trim()
        : (window.currentPlanillaNombre || '');
    window.abrirHistorialAlumnoPorDni(dni, nomPlanilla);
};

window.abrirHistorialAlumnoPorDni = async function(dniInput, nombrePlanillaSugerida = '') {
    if (!window.esUsuarioAdmin) {
        M.toast({ html: 'Acceso restringido: solo el Administrador puede restaurar notas o datos.', classes: 'red darken-3' });
        return;
    }
    const dni = String(dniInput || '').trim();
    if (!dni) return;

    const modalEl = document.getElementById('modal-historial-alumno');
    if (!modalEl) return;

    if (typeof M !== 'undefined' && M.Modal) {
        let inst = M.Modal.getInstance(modalEl);
        if (!inst) {
            inst = M.Modal.init(modalEl, { dismissible: true });
        }
        inst.open();
    } else {
        modalEl.style.display = 'block';
    }

    const nomPlanilla = nombrePlanillaSugerida ||
        (typeof selectPlanilla !== 'undefined' && selectPlanilla && selectPlanilla.value ? selectPlanilla.value.trim() : '') ||
        window.currentPlanillaNombre || '';

    _estadoHistorialAlumnoModal.dni = dni;
    _estadoHistorialAlumnoModal.nombrePlanillaContexto = nomPlanilla;
    _estadoHistorialAlumnoModal.planillaIdContexto = window.currentPlanillaDbId || null;

    await window.recargarHistorialAlumnoActual();
};

window.recargarHistorialAlumnoActual = async function() {
    const dni = _estadoHistorialAlumnoModal.dni;
    if (!dni) return;

    const contTimeline = document.getElementById('contenedor-timeline-historial-alumno');
    const contEstadoActual = document.getElementById('contenedor-estado-actual-alumno');
    const tituloEl = document.getElementById('historial-alumno-titulo');
    const subtituloEl = document.getElementById('historial-alumno-subtitulo');

    if (contTimeline) {
        contTimeline.innerHTML = `
            <div class="center-align" style="padding: 40px 20px; color: #4527a0;">
                <div class="preloader-wrapper small active">
                    <div class="spinner-layer spinner-blue-only">
                        <div class="circle-clipper left"><div class="circle"></div></div>
                        <div class="gap-patch"><div class="circle"></div></div>
                        <div class="circle-clipper right"><div class="circle"></div></div>
                    </div>
                </div>
                <p style="margin-top: 12px; font-weight: 600;">Consultando historial de cambios y estado actual del alumno (DNI ${escaparHtmlBuscador(dni)})...</p>
            </div>
        `;
    }

    try {
        const incluirTodasPlanillas = document.getElementById('chk-historial-todas-planillas')?.checked !== false;

        // 1. Consultar datos actuales del alumno en 'alumnos' y todas sus 'calificaciones' actuales en Supabase
        const [resAlumno, resCalifs, resAuditoria] = await Promise.all([
            supabaseClient.from('alumnos').select('*').eq('dni', dni).maybeSingle(),
            supabaseClient.from('calificaciones').select('id, planilla_id, alumno_dni, nombre_hoja, valores, updated_by, updated_at, planillas(id, nombre, spreadsheet_id)').eq('alumno_dni', dni).order('updated_at', { ascending: false }),
            getAuditSupabaseClient().from('auditoria').select('*').ilike('dni_alumno', `${dni}%`).order('fecha_hora', { ascending: false }).limit(300)
        ]);

        const alDb = resAlumno.data || null;
        const estudianteMem = (typeof cursoCompleto !== 'undefined' && cursoCompleto && studentsByDni) ? studentsByDni.get(String(dni)) : null;
        const nombreCompleto = alDb
            ? `${alDb.apellido || ''}${alDb.apellido && alDb.nombre ? ', ' : ''}${alDb.nombre || ''}`.trim()
            : (estudianteMem ? estudianteMem.nombreCompleto : `DNI ${dni}`);

        _estadoHistorialAlumnoModal.nombreCompleto = nombreCompleto || `DNI ${dni}`;
        _estadoHistorialAlumnoModal.alumnoDb = alDb;
        _estadoHistorialAlumnoModal.calificacionesActuales = Array.isArray(resCalifs.data) ? resCalifs.data : [];

        let logs = Array.isArray(resAuditoria.data) ? resAuditoria.data : [];
        if (!incluirTodasPlanillas && _estadoHistorialAlumnoModal.nombrePlanillaContexto) {
            const nomCtxUpper = _estadoHistorialAlumnoModal.nombrePlanillaContexto.toUpperCase().trim();
            logs = logs.filter(l => String(l.nombre_planilla || '').toUpperCase().trim() === nomCtxUpper);
        }
        _estadoHistorialAlumnoModal.logsAuditoria = logs;

        if (tituloEl) {
            tituloEl.textContent = `${_estadoHistorialAlumnoModal.nombreCompleto} (DNI: ${dni})`;
        }
        if (subtituloEl) {
            subtituloEl.innerHTML = `Planilla activa: <strong>${escaparHtmlBuscador(_estadoHistorialAlumnoModal.nombrePlanillaContexto || 'Todas las planillas del alumno')}</strong> · Selecciona una fecha para restaurar hacia atrás notas o datos personales.`;
        }

        // 2. Poblar el selector de materias/hojas disponibles para este alumno
        const selectHojaFiltro = document.getElementById('select-historial-alumno-hoja');
        if (selectHojaFiltro) {
            const valorPrevio = selectHojaFiltro.value;
            const hojasSet = new Set(['DATOS']);
            if (typeof cursoCompleto !== 'undefined' && cursoCompleto && Array.isArray(cursoCompleto.sheetOrder)) {
                cursoCompleto.sheetOrder.forEach(h => {
                    if (h && h !== 'SISTEMA_AUDITORIA' && !String(h).toUpperCase().includes('BOLETIN') && !String(h).toUpperCase().includes('PROMOCION')) {
                        hojasSet.add(h);
                    }
                });
            }
            _estadoHistorialAlumnoModal.calificacionesActuales.forEach(c => {
                if (c.nombre_hoja && !String(c.nombre_hoja).toUpperCase().includes('BOLETIN')) {
                    hojasSet.add(c.nombre_hoja);
                }
            });
            logs.forEach(l => {
                if (l.hoja && l.hoja !== '-') hojasSet.add(l.hoja);
            });

            let opcionesHtml = '<option value="">📋 Todas las materias y datos del alumno</option>';
            Array.from(hojasSet).forEach(h => {
                opcionesHtml += `<option value="${escaparHtmlBuscador(h)}">${escaparHtmlBuscador(formatearEtiquetaHojaHistorial(h))}</option>`;
            });
            selectHojaFiltro.innerHTML = opcionesHtml;

            if (valorPrevio && hojasSet.has(valorPrevio)) {
                selectHojaFiltro.value = valorPrevio;
            }
        }

        window.filtrarTimelineHistorialAlumno();
    } catch (err) {
        console.error('[Historial Alumno] Error cargando historial:', err);
        if (contTimeline) {
            contTimeline.innerHTML = `<div class="card-panel red lighten-5 red-text text-darken-4">Error al cargar el historial del alumno: ${escaparHtmlBuscador(err.message || String(err))}</div>`;
        }
        if (contEstadoActual) contEstadoActual.innerHTML = '';
    }
};

function renderizarResumenEstadoActualAlumno(filtroHoja) {
    const contEstadoActual = document.getElementById('contenedor-estado-actual-alumno');
    if (!contEstadoActual) return;

    const dni = _estadoHistorialAlumnoModal.dni;
    const alDb = _estadoHistorialAlumnoModal.alumnoDb;
    const califs = _estadoHistorialAlumnoModal.calificacionesActuales || [];
    const hojaReferencia = filtroHoja || (typeof selectHoja !== 'undefined' && selectHoja && selectHoja.value && selectHoja.value !== 'SISTEMA_AUDITORIA' ? selectHoja.value : 'DATOS');

    if (String(hojaReferencia).toUpperCase() === 'DATOS') {
        const califDatos = califs.find(c => String(c.nombre_hoja).toUpperCase() === 'DATOS');
        const extras = (califDatos && califDatos.valores) ? califDatos.valores : {};
        const items = [
            { k: 'APELLIDO', v: alDb ? alDb.apellido : '-' },
            { k: 'NOMBRE', v: alDb ? alDb.nombre : '-' },
            { k: 'SEXO', v: alDb ? alDb.sexo : '-' },
            { k: 'FECHA NAC.', v: alDb ? alDb.fecha_nacimiento : '-' },
            { k: 'ACTIVO', v: alDb && alDb.activo === false ? 'Inactivo' : 'Activo' }
        ];
        Object.entries(extras).slice(0, 4).forEach(([k, v]) => {
            if (v) items.push({ k, v });
        });
        contEstadoActual.innerHTML = `
            <div style="background: #ede7f6; border: 1px solid #d1c4e9; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 0.82rem; color: #311b92; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i class="material-icons tiny">verified</i> Estado Actual en Base de Datos (DATOS):
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${items.map(it => `<span style="background:#fff; border:1px solid #b39ddb; border-radius:6px; padding:2px 8px; font-size:0.78rem; color:#1e293b;"><b>${escaparHtmlBuscador(it.k)}:</b> ${escaparHtmlBuscador(it.v || '-')}</span>`).join('')}
                </div>
            </div>
        `;
        return;
    }

    // Buscar calificación actual de esa hoja (priorizando la planilla en contexto)
    const nomPlanillaCtx = (_estadoHistorialAlumnoModal.nombrePlanillaContexto || '').toUpperCase().trim();
    let califHoja = califs.find(c =>
        String(c.nombre_hoja).toUpperCase() === String(hojaReferencia).toUpperCase() &&
        (!nomPlanillaCtx || String(c.planillas?.nombre || '').toUpperCase().trim() === nomPlanillaCtx)
    );
    if (!califHoja) {
        califHoja = califs.find(c => String(c.nombre_hoja).toUpperCase() === String(hojaReferencia).toUpperCase());
    }

    if (!califHoja || !califHoja.valores || Object.keys(califHoja.valores).length === 0) {
        contEstadoActual.innerHTML = `
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 14px; font-size: 0.82rem; color: #475569;">
                ℹ️ <b>Estado Actual (${escaparHtmlBuscador(formatearEtiquetaHojaHistorial(hojaReferencia))}):</b> Sin calificaciones cargadas actualmente en esta hoja.
            </div>
        `;
        return;
    }

    const pares = Object.entries(califHoja.valores).filter(([k, v]) => k !== '_rowIndex' && String(v ?? '').trim() !== '');
    contEstadoActual.innerHTML = `
        <div style="background: #ede7f6; border: 1px solid #d1c4e9; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 0.82rem; color: #311b92; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <i class="material-icons tiny">verified</i> Valores Actuales en ${escaparHtmlBuscador(formatearEtiquetaHojaHistorial(hojaReferencia))}:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${pares.length > 0
                    ? pares.map(([k, v]) => `<span style="background:#fff; border:1px solid #b39ddb; border-radius:6px; padding:2px 8px; font-size:0.78rem; color:#1e293b;"><b>${escaparHtmlBuscador(k)}:</b> <code style="font-weight:700; color:#4527a0;">${escaparHtmlBuscador(v)}</code></span>`).join('')
                    : '<span style="font-size:0.78rem; color:#64748b;">Todas las casillas en blanco</span>'}
            </div>
        </div>
    `;
}

function obtenerValorActualCampoAlumno(hoja, campo, nombrePlanillaLog) {
    const hojaUp = String(hoja || '').toUpperCase().trim();
    const alDb = _estadoHistorialAlumnoModal.alumnoDb;
    const califs = _estadoHistorialAlumnoModal.calificacionesActuales || [];

    if (hojaUp === 'DATOS') {
        const cNorm = normalizarNombreCampoDatosHistorial(campo);
        if (cNorm === 'APELLIDO') return alDb && alDb.apellido != null ? String(alDb.apellido) : '';
        if (cNorm === 'NOMBRE') return alDb && alDb.nombre != null ? String(alDb.nombre) : '';
        if (cNorm === 'SEXO') return alDb && alDb.sexo != null ? String(alDb.sexo) : '';
        if (cNorm === 'FECHA NACIMIENTO') return alDb && alDb.fecha_nacimiento != null ? String(alDb.fecha_nacimiento) : '';
        if (cNorm === 'ACTIVOS') return alDb && alDb.activo === false ? 'FALSE' : 'TRUE';
        if (cNorm === 'OCULTO') return alDb && alDb.oculto ? 'SÍ' : 'NO';
        const calDatos = califs.find(c => String(c.nombre_hoja).toUpperCase() === 'DATOS');
        return (calDatos && calDatos.valores && calDatos.valores[campo] != null) ? String(calDatos.valores[campo]) : '';
    }

    const nomPlanillaUp = String(nombrePlanillaLog || _estadoHistorialAlumnoModal.nombrePlanillaContexto || '').toUpperCase().trim();
    let calif = califs.find(c =>
        String(c.nombre_hoja || '').toUpperCase().trim() === hojaUp &&
        (!nomPlanillaUp || String(c.planillas?.nombre || '').toUpperCase().trim() === nomPlanillaUp)
    );
    if (!calif) {
        calif = califs.find(c => String(c.nombre_hoja || '').toUpperCase().trim() === hojaUp);
    }
    if (calif && calif.valores && calif.valores[campo] !== undefined && calif.valores[campo] !== null) {
        return String(calif.valores[campo]);
    }
    return '';
}

window.filtrarTimelineHistorialAlumno = function() {
    const contTimeline = document.getElementById('contenedor-timeline-historial-alumno');
    const footerContador = document.getElementById('historial-alumno-contador-footer');
    if (!contTimeline) return;

    const filtroHoja = (document.getElementById('select-historial-alumno-hoja')?.value || '').trim();
    const filtroFecha = (document.getElementById('input-historial-alumno-fecha')?.value || '').trim();

    renderizarResumenEstadoActualAlumno(filtroHoja);

    const todosLogs = _estadoHistorialAlumnoModal.logsAuditoria || [];
    const logsFiltrados = todosLogs.filter(log => {
        if (filtroHoja && String(log.hoja || '').toUpperCase().trim() !== filtroHoja.toUpperCase()) {
            return false;
        }
        if (filtroFecha) {
            const rawFecha = log.fecha_hora || log.created_at;
            if (!rawFecha) return false;
            const d = new Date(rawFecha);
            if (isNaN(d.getTime())) return false;
            const yyyyMmDd = d.toISOString().slice(0, 10);
            const localYyyyMmDd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (yyyyMmDd !== filtroFecha && localYyyyMmDd !== filtroFecha) return false;
        }
        return true;
    });

    if (footerContador) {
        footerContador.innerHTML = `<i class="material-icons tiny" style="color: #5e35b1;">restore</i> Mostrando <strong>${logsFiltrados.length}</strong> versión(es) histórica(s) registrada(s) para este alumno.`;
    }

    if (logsFiltrados.length === 0) {
        // Si no hay eventos en auditoría aún para ese filtro, mostrar las calificaciones actuales con opción de crear punto de restauración
        const califsHoja = (_estadoHistorialAlumnoModal.calificacionesActuales || []).filter(c =>
            !filtroHoja || String(c.nombre_hoja || '').toUpperCase().trim() === filtroHoja.toUpperCase()
        );
        const resumenCalifsHtml = califsHoja.length > 0
            ? `<div style="margin-top: 14px; text-align: left; max-width: 720px; margin-left: auto; margin-right: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px;">
                <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem; margin-bottom: 8px;">📌 Último estado registrado en Supabase para este alumno:</div>
                ${califsHoja.slice(0, 8).map(c => {
                    const fechaUpd = c.updated_at ? new Date(c.updated_at).toLocaleString('es-AR') : '-';
                    const vals = Object.entries(c.valores || {}).filter(([k, v]) => k !== '_rowIndex' && String(v ?? '').trim() !== '').map(([k, v]) => `<b>${escaparHtmlBuscador(k)}:</b> ${escaparHtmlBuscador(v)}`).join(' · ');
                    return `<div style="font-size: 0.8rem; padding: 5px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="color: #4527a0; font-weight: 700;">${escaparHtmlBuscador(c.planillas?.nombre || '')} — ${escaparHtmlBuscador(c.nombre_hoja)}:</span>
                        <span style="color: #334155;"> ${vals || 'Sin notas'}</span>
                        <span style="color: #64748b; font-size: 0.74rem;"> (${escaparHtmlBuscador(fechaUpd)})</span>
                    </div>`;
                }).join('')}
               </div>`
            : '';

        contTimeline.innerHTML = `
            <div class="center-align" style="padding: 30px 20px; color: #475569;">
                <i class="material-icons" style="font-size: 2.8rem; color: #7e57c2; display: block; margin-bottom: 8px;">history_toggle_off</i>
                <p style="margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b;">Aún no hay modificaciones históricas registradas con este filtro</p>
                <p style="margin: 6px auto 12px auto; font-size: 0.85rem; max-width: 620px; color: #64748b;">
                    Cada vez que se modifique una nota o dato personal de este alumno (por ejemplo, si tiene 10 en Matemática y luego se cambia a 9), aparecerá aquí la fecha exacta con el botón para restaurar el valor anterior. También puedes guardar una copia de seguridad preventiva ahora mismo con el botón superior <strong>"Guardar Punto de Restauración Actual"</strong>.
                </p>
                ${resumenCalifsHtml}
            </div>
        `;
        return;
    }

    const cardsHtml = logsFiltrados.map((log, idx) => {
        const parsed = window.parsearRegistroAuditoria(log);
        const fechaRaw = log.fecha_hora || log.created_at;
        const fechaObj = fechaRaw ? new Date(fechaRaw) : null;
        const fechaFormateada = (fechaObj && !isNaN(fechaObj.getTime()))
            ? fechaObj.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '-';
        const nombrePlanilla = log.nombre_planilla || _estadoHistorialAlumnoModal.nombrePlanillaContexto || (log.planilla_id ? `Planilla ID ${log.planilla_id}` : '-');
        const hoja = log.hoja || 'DATOS';
        const etiquetaHoja = formatearEtiquetaHojaHistorial(hoja);
        const esRestauracion = parsed.textoLegible.includes('RESTAURACIÓN') || parsed.textoLegible.includes('PUNTO DE RESTAURACIÓN');

        const entradasCampos = Object.entries(parsed.campos || {});
        const tieneEstadoAnterior = Object.keys(parsed.antes || {}).length > 0;
        const tieneEstadoDespues = Object.keys(parsed.despues || {}).length > 0;

        const filasDiffHtml = entradasCampos.length > 0
            ? entradasCampos.map(([campo, infoCambio]) => {
                const valAntes = infoCambio.antes !== undefined && infoCambio.antes !== null ? String(infoCambio.antes) : null;
                const valDespues = infoCambio.despues !== undefined && infoCambio.despues !== null ? String(infoCambio.despues) : '';
                const valActual = obtenerValorActualCampoAlumno(hoja, campo, nombrePlanilla);
                const campoEsc = escaparHtmlBuscador(campo).replace(/'/g, "\\'");

                return `
                    <div class="historial-diff-row">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-weight: 700; color: #0f172a; font-size: 0.86rem; min-width: 110px;">${escaparHtmlBuscador(campo)}:</span>
                            ${valAntes !== null
                                ? `<span class="historial-val-viejo" title="Valor que tenía antes de este cambio">${valAntes !== '' ? escaparHtmlBuscador(valAntes) : '(En blanco)'}</span>
                                   <i class="material-icons tiny" style="color: #64748b;">arrow_forward</i>`
                                : ''}
                            <span class="historial-val-nuevo" title="Valor guardado en esta fecha">${valDespues !== '' ? escaparHtmlBuscador(valDespues) : '(En blanco)'}</span>
                            <span style="font-size: 0.75rem; color: #64748b; margin-left: 4px;">
                                (Valor hoy en BD: <strong style="color: #311b92;">${valActual !== '' ? escaparHtmlBuscador(valActual) : 'En blanco'}</strong>)
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            ${valAntes !== null ? `
                                <button
                                    type="button"
                                    class="btn-small waves-effect waves-light orange darken-3"
                                    style="height: 27px; line-height: 27px; padding: 0 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 600; text-transform: none;"
                                    onclick="window.restaurarCampoIndividualAlumno(${Number(log.id)}, '${campoEsc}', 'antes')"
                                    title="Volver únicamente el campo ${escaparHtmlBuscador(campo)} al valor que tenía antes de este cambio (${valAntes !== '' ? escaparHtmlBuscador(valAntes) : 'En blanco'})"
                                >
                                    ⏪ Volver "${escaparHtmlBuscador(campo)}" a ${valAntes !== '' ? escaparHtmlBuscador(valAntes) : 'Vacío'}
                                </button>
                            ` : ''}
                            <button
                                type="button"
                                class="btn-small waves-effect waves-light deep-purple darken-1"
                                style="height: 27px; line-height: 27px; padding: 0 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 600; text-transform: none;"
                                onclick="window.restaurarCampoIndividualAlumno(${Number(log.id)}, '${campoEsc}', 'despues')"
                                title="Restaurar el campo ${escaparHtmlBuscador(campo)} al valor de esta fecha (${valDespues !== '' ? escaparHtmlBuscador(valDespues) : 'En blanco'})"
                            >
                                📌 Aplicar ${valDespues !== '' ? escaparHtmlBuscador(valDespues) : 'Vacío'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div style="font-family: monospace; font-size: 0.84rem; color: #334155; padding: 6px 10px; background: #f8fafc; border-radius: 6px;">${escaparHtmlBuscador(parsed.textoLegible || 'Sin detalle de campos')}</div>`;

        return `
            <div class="historial-timeline-card ${esRestauracion ? 'es-restauracion' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background: #311b92; color: #ffffff; padding: 3px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="material-icons tiny" style="font-size: 0.9rem;">event</i> ${escaparHtmlBuscador(fechaFormateada)}
                        </span>
                        <span style="background: #ede7f6; color: #4527a0; border: 1px solid #d1c4e9; padding: 2px 10px; border-radius: 999px; font-size: 0.76rem; font-weight: 700;">
                            ${escaparHtmlBuscador(etiquetaHoja)}
                        </span>
                        <span style="font-size: 0.78rem; color: #1565c0; font-weight: 600;">
                            ${escaparHtmlBuscador(nombrePlanilla)}
                        </span>
                    </div>
                    <div style="font-size: 0.76rem; color: #64748b; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="material-icons tiny">person</i> ${escaparHtmlBuscador(log.usuario || 'Usuario')}
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    ${filasDiffHtml}
                </div>

                <div style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                    ${tieneEstadoAnterior ? `
                        <button
                            type="button"
                            class="btn-small waves-effect waves-light amber darken-4"
                            style="border-radius: 8px; text-transform: none; font-weight: 700; font-size: 0.78rem; height: 32px; line-height: 32px; padding: 0 14px; display: inline-flex; align-items: center; gap: 5px;"
                            onclick="window.restaurarVersionAlumnoDesdeAuditoria(${Number(log.id)}, 'antes')"
                            title="Deshacer todo este cambio y restaurar la hoja completa a como estaba ANTES de esta fecha"
                        >
                            <i class="material-icons tiny">undo</i> Deshacer este cambio (Volver al estado anterior)
                        </button>
                    ` : ''}
                    ${tieneEstadoDespues ? `
                        <button
                            type="button"
                            class="btn-small waves-effect waves-light teal darken-2"
                            style="border-radius: 8px; text-transform: none; font-weight: 700; font-size: 0.78rem; height: 32px; line-height: 32px; padding: 0 14px; display: inline-flex; align-items: center; gap: 5px;"
                            onclick="window.restaurarVersionAlumnoDesdeAuditoria(${Number(log.id)}, 'despues')"
                            title="Restaurar todas las notas/datos de esta hoja a los valores registrados en esta fecha (${escaparHtmlBuscador(fechaFormateada)})"
                        >
                            <i class="material-icons tiny">restore</i> Restaurar al estado de esta fecha
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    contTimeline.innerHTML = cardsHtml;
};

function recalcularPromediosEnObjetoCalificaciones(nombreHoja, valoresObj) {
    const copia = { ...(valoresObj || {}) };
    const hojaUp = String(nombreHoja || '').toUpperCase().trim();
    if (hojaUp === 'DATOS' || hojaUp.includes('BOLETIN') || hojaUp.includes('ASISTENCIA') || hojaUp.includes('CONDUCTA')) {
        return copia;
    }

    // Caso 1: Planilla de Área Especial (1 Bimestre / 2 Bimestre -> Promedio.)
    const tieneBimestres = Object.keys(copia).some(k => /BIMESTRE/i.test(k));
    if (tieneBimestres && typeof extraerNotaFinalEspecial === 'function') {
        const promEsp = extraerNotaFinalEspecial(copia);
        Object.keys(copia).forEach(k => {
            if (/PROM/i.test(k) || /FINAL/i.test(k)) {
                copia[k] = promEsp;
            }
        });
        return copia;
    }

    // Caso 2: Materia regular (Lengua, Matemática, Cs. Sociales, Cs. Naturales)
    if (hojaUp.includes('ESPECIAL')) {
        return copia;
    }

    const clavesProm = Object.keys(copia).filter(k => {
        const u = String(k || '').toUpperCase();
        return u.includes('PROM') || u.includes('FINAL') || u.includes('TOTAL');
    });
    if (clavesProm.length === 0) {
        clavesProm.push('Promedio.');
    }

    let sumaCentavos = 0;
    let cantidadNotas = 0;
    Object.entries(copia).forEach(([campo, val]) => {
        const u = String(campo || '').toUpperCase();
        if (u.includes('PROM') || u.includes('FINAL') || u.includes('TOTAL') || u.includes('NRO') || u === '_ROWINDEX' || esColumnaNoDeNota(campo)) return;
        const limpio = String(val ?? '').trim().replace(/,/g, '.');
        if (limpio !== '' && !isNaN(Number(limpio))) {
            const num = Number(limpio);
            if (num >= 1 && num <= 10) {
                sumaCentavos += Math.round(num * 100);
                cantidadNotas++;
            }
        }
    });

    const nuevoPromedio = cantidadNotas > 0
        ? (Math.trunc(sumaCentavos / cantidadNotas + 1e-9) / 100).toFixed(2)
        : '';
    clavesProm.forEach(pk => {
        copia[pk] = nuevoPromedio;
    });
    return copia;
}

async function resolverPlanillaIdParaRestauracion(log) {
    const rawId = String(log.planilla_id || '').trim();
    if (rawId && !isNaN(Number(rawId)) && Number(rawId) > 0) {
        return { id: Number(rawId), nombre: log.nombre_planilla || _estadoHistorialAlumnoModal.nombrePlanillaContexto || '' };
    }
    const nombreBuscar = log.nombre_planilla || _estadoHistorialAlumnoModal.nombrePlanillaContexto || '';
    if (nombreBuscar) {
        const { data: pRow } = await supabaseClient.from('planillas').select('id, nombre').eq('nombre', nombreBuscar).maybeSingle();
        if (pRow && pRow.id) return { id: pRow.id, nombre: pRow.nombre };
    }
    if (window.currentPlanillaDbId) {
        return { id: window.currentPlanillaDbId, nombre: window.currentPlanillaNombre || nombreBuscar };
    }
    throw new Error('No se pudo identificar la planilla en Supabase para aplicar la restauración.');
}

async function aplicarRestauracionEnSupabaseYMemoria({ dni, planillaId, nombrePlanilla, hoja, valoresObjetivo, descripcionAccion }) {
    const correoAdmin = sessionStorage.getItem('misericordia_sesion') || emailProcesando || 'Administrador';
    const hojaUp = String(hoja || '').toUpperCase().trim();

    if (hojaUp === 'DATOS') {
        // 1. Leer estado actual en Supabase antes de restaurar
        const [{ data: alActual }, { data: calDatosActual }] = await Promise.all([
            supabaseClient.from('alumnos').select('*').eq('dni', dni).maybeSingle(),
            supabaseClient.from('calificaciones').select('valores').eq('planilla_id', planillaId).eq('alumno_dni', dni).eq('nombre_hoja', 'DATOS').maybeSingle()
        ]);
        const extrasActuales = (calDatosActual && calDatosActual.valores) ? { ...calDatosActual.valores } : {};
        const antesRestauracion = Object.assign({}, extrasActuales, {
            APELLIDO: alActual?.apellido || '',
            NOMBRE: alActual?.nombre || '',
            SEXO: alActual?.sexo || '',
            'FECHA NACIMIENTO': alActual?.fecha_nacimiento || '',
            ACTIVOS: alActual?.activo === false ? 'FALSE' : 'TRUE',
            OCULTO: alActual?.oculto ? 'SÍ' : 'NO'
        });

        const fusionDatos = Object.assign({}, antesRestauracion, valoresObjetivo);
        const updateAlumno = {
            updated_at: new Date().toISOString()
        };
        if (fusionDatos.APELLIDO !== undefined) updateAlumno.apellido = String(fusionDatos.APELLIDO).trim();
        if (fusionDatos.NOMBRE !== undefined) updateAlumno.nombre = String(fusionDatos.NOMBRE).trim();
        if (fusionDatos.SEXO !== undefined) updateAlumno.sexo = String(fusionDatos.SEXO).trim();
        if (fusionDatos['FECHA NACIMIENTO'] !== undefined) updateAlumno.fecha_nacimiento = String(fusionDatos['FECHA NACIMIENTO']).trim();
        if (fusionDatos.ACTIVOS !== undefined) {
            const vAct = String(fusionDatos.ACTIVOS).toUpperCase().trim();
            updateAlumno.activo = (vAct === 'TRUE' || vAct === 'SÍ' || vAct === 'SI' || vAct === '1');
        }
        if (fusionDatos.OCULTO !== undefined) {
            const vOc = String(fusionDatos.OCULTO).toUpperCase().trim();
            updateAlumno.oculto = (vOc === 'SÍ' || vOc === 'SI' || vOc === 'TRUE');
        }

        const { error: errUpdAl } = await supabaseClient.from('alumnos').update(updateAlumno).eq('dni', dni);
        if (errUpdAl) throw errUpdAl;

        if (planillaId) {
            await supabaseClient.from('alumno_planillas').update({
                activo: updateAlumno.activo !== undefined ? updateAlumno.activo : true,
                oculto: updateAlumno.oculto !== undefined ? updateAlumno.oculto : false
            }).eq('planilla_id', planillaId).eq('alumno_dni', dni);
        }

        const clavesBase = new Set(['DNI', 'D.N.I', 'APELLIDO', 'NOMBRE', 'APELLIDO Y NOMBRE', 'ALUMNO', 'NRO.', 'Nro.', 'NRO', 'SEXO', 'FECHA NACIMIENTO', 'FECHA DE NAC', 'ACTIVOS', 'ESTADO', 'OCULTO', '_rowIndex']);
        const nuevosExtras = {};
        Object.entries(fusionDatos).forEach(([k, v]) => {
            if (!clavesBase.has(k) && v !== undefined && v !== null && String(v).trim() !== '') {
                nuevosExtras[k] = String(v).trim();
            }
        });
        if (planillaId) {
            await supabaseClient.from('calificaciones').upsert({
                planilla_id: planillaId,
                alumno_dni: dni,
                nombre_hoja: 'DATOS',
                valores: nuevosExtras,
                updated_by: correoAdmin,
                updated_at: new Date().toISOString()
            }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });
        }

        // Registrar auditoría de la restauración
        const diffs = [];
        const camposMod = {};
        Object.keys(fusionDatos).forEach(k => {
            const vA = String(antesRestauracion[k] ?? '').trim();
            const vD = String(fusionDatos[k] ?? '').trim();
            if (vA !== vD) {
                diffs.push(`${k}: "${vA}" ➔ "${vD}"`);
                camposMod[k] = { antes: vA, despues: vD };
            }
        });
        const textoAud = `🔄 RESTAURACIÓN (${descripcionAccion}): ${diffs.join(' | ') || 'Datos restaurados'}`;
        await getAuditSupabaseClient().from('auditoria').insert({
            usuario: correoAdmin,
            planilla_id: String(planillaId || ''),
            nombre_planilla: nombrePlanilla,
            hoja: 'DATOS',
            dni_alumno: dni,
            cambios: window.codificarCambiosConSnapshot(textoAud, {
                tipo: 'DATOS',
                planilla_id: planillaId,
                nombre_planilla: nombrePlanilla,
                dni,
                hoja: 'DATOS',
                antes: antesRestauracion,
                despues: fusionDatos,
                campos: camposMod
            })
        });

        // Actualizar en memoria si el alumno está cargado en el curso activo
        if (typeof cursoCompleto !== 'undefined' && cursoCompleto && studentsByDni) {
            const est = studentsByDni.get(String(dni));
            if (est) {
                est.datosHojas = est.datosHojas || {};
                est.datosHojas['DATOS'] = Object.assign(est.datosHojas['DATOS'] || {}, fusionDatos);
                if (updateAlumno.apellido || updateAlumno.nombre) {
                    est.nombreCompleto = `${updateAlumno.apellido || ''}${updateAlumno.apellido && updateAlumno.nombre ? ', ' : ''}${updateAlumno.nombre || ''}`.trim();
                }
            }
        }
    } else {
        // Restauración de Hoja de Calificaciones / Materia / Asistencia / Área Especial
        const { data: calActual } = await supabaseClient
            .from('calificaciones')
            .select('valores')
            .eq('planilla_id', planillaId)
            .eq('alumno_dni', dni)
            .eq('nombre_hoja', hoja)
            .maybeSingle();

        const valoresAntes = (calActual && calActual.valores && typeof calActual.valores === 'object')
            ? { ...calActual.valores }
            : {};

        const valoresConPromedio = recalcularPromediosEnObjetoCalificaciones(hoja, valoresObjetivo);
        delete valoresConPromedio._rowIndex;

        const { error: errUpsert } = await supabaseClient.from('calificaciones').upsert({
            planilla_id: planillaId,
            alumno_dni: dni,
            nombre_hoja: hoja,
            valores: valoresConPromedio,
            updated_by: correoAdmin,
            updated_at: new Date().toISOString()
        }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });

        if (errUpsert) throw errUpsert;

        // Si es planilla de área especial, propagar automáticamente al curso regular
        if (typeof propagarLoteNotasEspecialesACursoRegular === 'function' && esPlanillaEspecialSeleccionada(nombrePlanilla)) {
            await propagarLoteNotasEspecialesACursoRegular(nombrePlanilla, [{ alumno_dni: dni, valores: valoresConPromedio }], correoAdmin);
        }

        // Registrar auditoría de la restauración
        const diffs = [];
        const camposMod = {};
        const todasClaves = new Set([...Object.keys(valoresAntes), ...Object.keys(valoresConPromedio)]);
        todasClaves.forEach(k => {
            if (k === '_rowIndex') return;
            const vA = String(valoresAntes[k] ?? '').trim();
            const vD = String(valoresConPromedio[k] ?? '').trim();
            if (vA !== vD) {
                diffs.push(`${k}: "${vA}" ➔ "${vD}"`);
                camposMod[k] = { antes: vA, despues: vD };
            }
        });

        const textoAud = `🔄 RESTAURACIÓN (${descripcionAccion}): ${diffs.join(' | ') || 'Valores restaurados'}`;
        await getAuditSupabaseClient().from('auditoria').insert({
            usuario: correoAdmin,
            planilla_id: String(planillaId || ''),
            nombre_planilla: nombrePlanilla,
            hoja: hoja,
            dni_alumno: dni,
            cambios: window.codificarCambiosConSnapshot(textoAud, {
                tipo: 'CALIFICACIONES',
                planilla_id: planillaId,
                nombre_planilla: nombrePlanilla,
                dni,
                hoja,
                antes: valoresAntes,
                despues: valoresConPromedio,
                campos: camposMod
            })
        });

        // Actualizar en memoria y en el DOM si esta planilla está abierta
        if (typeof cursoCompleto !== 'undefined' && cursoCompleto && studentsByDni) {
            const est = studentsByDni.get(String(dni));
            if (est) {
                est.datosHojas = est.datosHojas || {};
                const rowIndexPrev = est.datosHojas[hoja] ? est.datosHojas[hoja]._rowIndex : undefined;
                est.datosHojas[hoja] = Object.assign({}, valoresConPromedio);
                if (rowIndexPrev !== undefined) est.datosHojas[hoja]._rowIndex = rowIndexPrev;
            }
        }
    }

    // Refrescar la vista del formulario en segundo plano si el alumno está seleccionado actualmente
    if (typeof cursoCompleto !== 'undefined' && cursoCompleto && String(window.dniAlumnoActual) === String(dni)) {
        if (currentSpreadsheetId) {
            storeCompressedCacheDebounced('misericordia_data_' + currentSpreadsheetId, cursoCompleto);
        }
        const hojaActivaDom = (typeof selectHoja !== 'undefined' && selectHoja) ? selectHoja.value : '';
        if (hojaActivaDom && hojaActivaDom !== 'SISTEMA_AUDITORIA') {
            renderizarHojaEspecifica(hojaActivaDom, dni);
        }
        const nombreBoletin = obtenerNombreHojaBoletin();
        if (nombreBoletin) actualizarBoletinDesdeDOM(nombreBoletin);
        actualizarEstadoHojasSidebar();
    }

    // Invalidar caché del panel de auditoría global para que refleje la restauración
    window.auditPages = {};
    window.auditNextTokens = {};
}

window.restaurarVersionAlumnoDesdeAuditoria = async function(logId, modo = 'despues') {
    if (!window.esUsuarioAdmin) return;
    const log = (_estadoHistorialAlumnoModal.logsAuditoria || []).find(l => Number(l.id) === Number(logId));
    if (!log) {
        M.toast({ html: 'No se encontró el registro histórico seleccionado.', classes: 'red darken-3' });
        return;
    }

    const parsed = window.parsearRegistroAuditoria(log);
    const fechaStr = log.fecha_hora ? new Date(log.fecha_hora).toLocaleString('es-AR') : '';
    const hoja = log.hoja || 'DATOS';
    const dni = _estadoHistorialAlumnoModal.dni || String(log.dni_alumno || '').split(' ')[0].trim();

    const snapshotElegido = modo === 'antes' ? parsed.antes : parsed.despues;
    if (!snapshotElegido || Object.keys(snapshotElegido).length === 0) {
        M.toast({ html: 'Este registro no contiene valores para ese estado.', classes: 'orange darken-3' });
        return;
    }

    const resumenValores = Object.entries(snapshotElegido)
        .filter(([k]) => k !== '_rowIndex')
        .map(([k, v]) => `${k}: ${v !== '' ? v : '(Vacío)'}`)
        .join(', ');

    const msgConfirm = modo === 'antes'
        ? `¿Confirmas DESHACER el cambio del ${fechaStr} en "${hoja}" y restaurar los valores anteriores?\n\nValores que se restaurarán:\n${resumenValores}`
        : `¿Confirmas RESTAURAR "${hoja}" al estado del ${fechaStr}?\n\nValores que se aplicarán:\n${resumenValores}`;

    if (!confirm(msgConfirm)) return;

    try {
        M.toast({ html: '⏳ Restaurando valores en Supabase...', classes: 'deep-purple darken-2', displayLength: 2000 });
        const { id: planillaId, nombre: nombrePlanilla } = await resolverPlanillaIdParaRestauracion(log);

        // Si el registro provenía del fallback (solo campos parciales), fusionar con los valores actuales de la hoja
        let valoresObjetivo = { ...snapshotElegido };
        if (!parsed.tieneSnapshotCompleto && String(hoja).toUpperCase() !== 'DATOS') {
            const { data: calAct } = await supabaseClient
                .from('calificaciones')
                .select('valores')
                .eq('planilla_id', planillaId)
                .eq('alumno_dni', dni)
                .eq('nombre_hoja', hoja)
                .maybeSingle();
            const actuales = (calAct && calAct.valores) ? { ...calAct.valores } : {};
            valoresObjetivo = Object.assign({}, actuales, snapshotElegido);
        }

        await aplicarRestauracionEnSupabaseYMemoria({
            dni,
            planillaId,
            nombrePlanilla,
            hoja,
            valoresObjetivo,
            descripcionAccion: modo === 'antes' ? `Estado previo a ${fechaStr}` : `Estado del ${fechaStr}`
        });

        M.toast({ html: `✅ Notas/datos de "${hoja}" restaurados correctamente en Supabase`, classes: 'green darken-2', displayLength: 4000 });
        await window.recargarHistorialAlumnoActual();
    } catch (err) {
        console.error('[Restauración Alumno] Error:', err);
        M.toast({ html: '❌ Error al restaurar: ' + (err.message || String(err)), classes: 'red darken-3', displayLength: 5000 });
    }
};

window.restaurarCampoIndividualAlumno = async function(logId, nombreCampo, modo = 'antes') {
    if (!window.esUsuarioAdmin) return;
    const log = (_estadoHistorialAlumnoModal.logsAuditoria || []).find(l => Number(l.id) === Number(logId));
    if (!log) return;

    const parsed = window.parsearRegistroAuditoria(log);
    const infoCampo = parsed.campos ? parsed.campos[nombreCampo] : null;
    const valorRestaurar = modo === 'antes'
        ? (infoCampo && infoCampo.antes !== undefined ? infoCampo.antes : parsed.antes?.[nombreCampo])
        : (infoCampo && infoCampo.despues !== undefined ? infoCampo.despues : parsed.despues?.[nombreCampo]);

    if (valorRestaurar === undefined) {
        M.toast({ html: 'No hay valor registrado para restaurar ese campo.', classes: 'orange darken-3' });
        return;
    }

    const hoja = log.hoja || 'DATOS';
    const dni = _estadoHistorialAlumnoModal.dni || String(log.dni_alumno || '').split(' ')[0].trim();
    const fechaStr = log.fecha_hora ? new Date(log.fecha_hora).toLocaleString('es-AR') : '';

    if (!confirm(`¿Restaurar el campo "${nombreCampo}" en "${hoja}" al valor "${valorRestaurar !== '' ? valorRestaurar : '(En blanco)'}" (según registro del ${fechaStr})?`)) {
        return;
    }

    try {
        const { id: planillaId, nombre: nombrePlanilla } = await resolverPlanillaIdParaRestauracion(log);
        let valoresObjetivo = {};

        if (String(hoja).toUpperCase() === 'DATOS') {
            valoresObjetivo[nombreCampo] = valorRestaurar;
        } else {
            const { data: calAct } = await supabaseClient
                .from('calificaciones')
                .select('valores')
                .eq('planilla_id', planillaId)
                .eq('alumno_dni', dni)
                .eq('nombre_hoja', hoja)
                .maybeSingle();
            valoresObjetivo = (calAct && calAct.valores) ? { ...calAct.valores } : {};
            valoresObjetivo[nombreCampo] = valorRestaurar;
        }

        await aplicarRestauracionEnSupabaseYMemoria({
            dni,
            planillaId,
            nombrePlanilla,
            hoja,
            valoresObjetivo,
            descripcionAccion: `Campo ${nombreCampo} -> "${valorRestaurar}" (${fechaStr})`
        });

        M.toast({ html: `✅ Campo "${nombreCampo}" restaurado a "${valorRestaurar !== '' ? valorRestaurar : 'Vacío'}"`, classes: 'green darken-2', displayLength: 3500 });
        await window.recargarHistorialAlumnoActual();
    } catch (err) {
        console.error('[Restaurar Campo Individual] Error:', err);
        M.toast({ html: '❌ Error al restaurar el campo: ' + (err.message || String(err)), classes: 'red darken-3' });
    }
};

window.crearSnapshotManualAlumnoActual = async function() {
    if (!window.esUsuarioAdmin) return;
    const dni = _estadoHistorialAlumnoModal.dni;
    if (!dni) return;

    const btn = document.getElementById('btn-crear-snapshot-alumno');
    const htmlOrig = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="material-icons left tiny">hourglass_empty</i> Guardando copia...';
    }

    try {
        const correoAdmin = sessionStorage.getItem('misericordia_sesion') || emailProcesando || 'Administrador';
        const nomPlanillaCtx = _estadoHistorialAlumnoModal.nombrePlanillaContexto || window.currentPlanillaNombre || '';
        const califs = (_estadoHistorialAlumnoModal.calificacionesActuales || []).filter(c =>
            !nomPlanillaCtx || String(c.planillas?.nombre || '').toUpperCase().trim() === nomPlanillaCtx.toUpperCase().trim()
        );
        const listaGuardar = califs.length > 0 ? califs : (_estadoHistorialAlumnoModal.calificacionesActuales || []);

        const registrosInsertar = [];
        const alDb = _estadoHistorialAlumnoModal.alumnoDb;
        if (alDb) {
            const datosSnap = {
                APELLIDO: alDb.apellido || '',
                NOMBRE: alDb.nombre || '',
                SEXO: alDb.sexo || '',
                'FECHA NACIMIENTO': alDb.fecha_nacimiento || '',
                ACTIVOS: alDb.activo === false ? 'FALSE' : 'TRUE',
                OCULTO: alDb.oculto ? 'SÍ' : 'NO'
            };
            const camposDatos = {};
            Object.entries(datosSnap).forEach(([k, v]) => {
                camposDatos[k] = { antes: String(v), despues: String(v) };
            });
            registrosInsertar.push({
                usuario: correoAdmin,
                planilla_id: String(window.currentPlanillaDbId || ''),
                nombre_planilla: nomPlanillaCtx || 'FICHA GENERAL',
                hoja: 'DATOS',
                dni_alumno: dni,
                cambios: window.codificarCambiosConSnapshot(
                    `📸 PUNTO DE RESTAURACIÓN MANUAL (DATOS): ${alDb.apellido || ''}, ${alDb.nombre || ''}`,
                    {
                        tipo: 'DATOS',
                        planilla_id: window.currentPlanillaDbId || null,
                        nombre_planilla: nomPlanillaCtx || 'FICHA GENERAL',
                        dni,
                        hoja: 'DATOS',
                        antes: datosSnap,
                        despues: datosSnap,
                        campos: camposDatos
                    }
                )
            });
        }

        listaGuardar.forEach(c => {
            if (!c.valores || Object.keys(c.valores).length === 0) return;
            if (String(c.nombre_hoja).toUpperCase().includes('BOLETIN')) return;
            const camposHoja = {};
            const resumen = [];
            Object.entries(c.valores).forEach(([k, v]) => {
                if (k === '_rowIndex') return;
                const valStr = String(v ?? '').trim();
                if (valStr !== '') {
                    camposHoja[k] = { antes: valStr, despues: valStr };
                    resumen.push(`${k}: "${valStr}"`);
                }
            });
            if (resumen.length === 0) return;
            const nomPl = c.planillas?.nombre || nomPlanillaCtx || '';
            registrosInsertar.push({
                usuario: correoAdmin,
                planilla_id: String(c.planilla_id || ''),
                nombre_planilla: nomPl,
                hoja: c.nombre_hoja,
                dni_alumno: dni,
                cambios: window.codificarCambiosConSnapshot(
                    `📸 PUNTO DE RESTAURACIÓN MANUAL: ${resumen.join(' | ')}`,
                    {
                        tipo: 'CALIFICACIONES',
                        planilla_id: c.planilla_id,
                        nombre_planilla: nomPl,
                        dni,
                        hoja: c.nombre_hoja,
                        antes: c.valores,
                        despues: c.valores,
                        campos: camposHoja
                    }
                )
            });
        });

        if (registrosInsertar.length === 0) {
            M.toast({ html: 'No hay calificaciones ni datos cargados para crear un punto de restauración.', classes: 'orange darken-3' });
            return;
        }

        const { error: errIns } = await getAuditSupabaseClient().from('auditoria').insert(registrosInsertar);
        if (errIns) throw errIns;

        M.toast({ html: `📸 Punto de restauración guardado (${registrosInsertar.length} hojas respaldadas)`, classes: 'green darken-2', displayLength: 3500 });
        await window.recargarHistorialAlumnoActual();
    } catch (err) {
        console.error('[Snapshot Manual] Error:', err);
        M.toast({ html: '❌ Error guardando punto de restauración: ' + (err.message || String(err)), classes: 'red darken-3' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = htmlOrig;
        }
    }
};

// =========================================================================
// GESTIÓN DE ALTA DE ALUMNOS EN EL GRADO (DOCENTE DEL GRADO / ADMIN)
// =========================================================================

let _eventosModalAgregarAlumnoInicializados = false;
let _timerDebounceVerificarDni = null;
let _ultimoDniVerificadoConflicto = null;
let _conflictoOtroGradoActual = null;

function extraerAnioLectivoPlanilla(planilla) {
    if (planilla && (planilla.anio_lectivo || planilla.anio)) {
        const n = Number(planilla.anio_lectivo || planilla.anio);
        if (Number.isFinite(n) && n >= 2000) return n;
    }
    const nombre = String((planilla && planilla.nombre) || '');
    const matchNombre = nombre.match(/\b(20\d{2})\b/);
    if (matchNombre) return Number(matchNombre[1]);
    if (planilla && planilla.created_at) {
        const fecha = new Date(planilla.created_at);
        if (!isNaN(fecha.getTime())) return fecha.getFullYear();
    }
    return new Date().getFullYear();
}

function obtenerGradoYSeccionPlanilla(planilla) {
    const inf = typeof extraerGradoYSeccionGlobal === 'function'
        ? extraerGradoYSeccionGlobal(planilla && planilla.nombre)
        : { grado: 99, seccion: '' };
    const gradoCol = planilla && planilla.grado != null && Number(planilla.grado) > 0
        ? Number(planilla.grado)
        : (inf && inf.grado && inf.grado < 99 ? Number(inf.grado) : null);
    const seccionCol = planilla && planilla.seccion
        ? String(planilla.seccion).toUpperCase().trim()
        : (inf && inf.seccion ? String(inf.seccion).toUpperCase().trim() : '');
    return { grado: gradoCol, seccion: seccionCol };
}

function actualizarBloqueoConflictoOtroGrado(conflicto) {
    _conflictoOtroGradoActual = conflicto || null;
    const btnSubmit = document.getElementById('btn-confirmar-agregar-alumno');
    if (btnSubmit) {
        btnSubmit.disabled = Boolean(conflicto);
    }
}

async function verificarConflictoDniOtroGrado(dniLimpio, planillaIdActual, nombrePlanillaActual) {
    const [{ data: matriculasExistentes }, { data: planillaActualDb }] = await Promise.all([
        supabaseClient
            .from('alumno_planillas')
            .select('id, planilla_id, activo, oculto, planillas(id, nombre, grado, seccion, cuatrimestre, activo, created_at)')
            .eq('alumno_dni', dniLimpio),
        planillaIdActual
            ? supabaseClient
                .from('planillas')
                .select('id, nombre, grado, seccion, created_at')
                .eq('id', planillaIdActual)
                .maybeSingle()
            : Promise.resolve({ data: null })
    ]);

    const refActual = planillaActualDb || { id: planillaIdActual, nombre: nombrePlanillaActual };
    const anioActual = extraerAnioLectivoPlanilla(refActual);
    const gsActual = obtenerGradoYSeccionPlanilla(refActual);

    const conflictosPorGrado = new Map();
    (matriculasExistentes || []).forEach(m => {
        if (m.activo === false || m.oculto === true) return;
        const p = m.planillas;
        if (!p || p.activo === false) return;
        if (extraerAnioLectivoPlanilla(p) !== anioActual) return;
        if (planillaIdActual && Number(p.id) === Number(planillaIdActual)) return;

        const gsOtro = obtenerGradoYSeccionPlanilla(p);
        const esMismoGradoYSeccion = Boolean(
            gsActual.grado && gsActual.seccion &&
            gsOtro.grado && gsOtro.seccion &&
            Number(gsActual.grado) === Number(gsOtro.grado) &&
            gsActual.seccion === gsOtro.seccion
        );
        if (esMismoGradoYSeccion) return;

        const clave = (gsOtro.grado && gsOtro.seccion)
            ? `${gsOtro.grado}|${gsOtro.seccion}`
            : `ID_${p.id}`;
        const esEspecial = /ESP|ESPECIAL/i.test(p.nombre || '');
        const existente = conflictosPorGrado.get(clave);
        if (!existente || (existente.esEspecial && !esEspecial)) {
            const etiqueta = (gsOtro.grado && gsOtro.seccion)
                ? `${gsOtro.grado}° Grado "${gsOtro.seccion}"`
                : (p.nombre || `Planilla #${p.id}`);
            conflictosPorGrado.set(clave, {
                etiqueta,
                nombrePlanilla: p.nombre || '',
                esEspecial
            });
        }
    });

    if (conflictosPorGrado.size === 0) {
        return null;
    }

    return {
        dni: dniLimpio,
        anioLectivo: anioActual,
        grados: Array.from(conflictosPorGrado.values())
    };
}

function puedeAgregarAlumnoEnPlanillaActual() {
    if (!cursoCompleto || !currentSpreadsheetId) return false;
    if (window.planillaSoloLectura) return false;

    // 1. En planillas dedicadas de áreas especiales (ESP Inglés, Ed. Física, Música, Plástica, etc.) NO se agregan alumnos
    const nombrePlanilla = window.currentPlanillaNombre || (typeof selectPlanilla !== 'undefined' && selectPlanilla && selectPlanilla.value) || '';
    if (typeof esPlanillaEspecialSeleccionada === 'function' && esPlanillaEspecialSeleccionada(nombrePlanilla)) {
        return false;
    }

    const email = (sessionStorage.getItem('misericordia_sesion') || (typeof emailProcesando !== 'undefined' ? emailProcesando : '') || '').toLowerCase().trim();
    if (!email) return false;

    // 2. Superusuarios, Administradores y Directivos pueden agregar alumnos en planillas regulares de grado
    if (window.esUsuarioAdmin === true) return true;
    if (email === 'misericordiaplanillas@gmail.com' || email === 'victorojas2025@gmail.com') return true;
    if (email.startsWith('directivos') || email.includes('directivo')) return true;

    // 3. Verificar que el usuario NO sea un profesor de áreas especiales
    let usuario = window.usuarioActual;
    if (!usuario) {
        try {
            const cached = sessionStorage.getItem('misericordia_usuario_info');
            if (cached) usuario = JSON.parse(cached);
        } catch (e) {}
    }

    if (usuario) {
        if (usuario.es_admin === true || usuario.esAdmin === true) return true;
        if (typeof esUsuarioPlanillasEspeciales === 'function' && esUsuarioPlanillasEspeciales(usuario)) {
            return false;
        }
    }

    // 4. Si existen permisos granulares cargados para la planilla actual, exigir al menos un área de docente de grado regular
    // (Si solo tiene áreas especiales como ED_FISICA, MUSICA, PLASTICA, INGLES, TECNOLOGIA, no puede agregar alumnos)
    if (window.permisosPlanillaActual && Array.isArray(window.permisosPlanillaActual.areas)) {
        const areasNorm = window.permisosPlanillaActual.areas.map(normalizarNombreArea);
        const tieneAreaDeGradoRegular = areasNorm.some(a =>
            ['TODAS', 'TODAS_MATERIAS', 'DATOS', 'LENGUA', 'MATEMATICA', 'CS_SOCIALES', 'CS_NATURALES', 'ASISTENCIA'].includes(a)
        );
        if (!tieneAreaDeGradoRegular) {
            return false;
        }
    }

    return true;
}
window.puedeAgregarAlumnoEnPlanillaActual = puedeAgregarAlumnoEnPlanillaActual;

function limpiarEstadoCampoNuevoAlumno(inputEl, errorId) {
    if (inputEl) {
        inputEl.setAttribute('aria-invalid', 'false');
        if (typeof inputEl.setCustomValidity === 'function') {
            inputEl.setCustomValidity('');
        }
    }
    const errEl = errorId ? document.getElementById(errorId) : null;
    if (errEl) {
        errEl.style.display = 'none';
    }
}

function mostrarErrorCampoNuevoAlumno(inputEl, errorId, mensajePersonalizado) {
    if (inputEl) {
        inputEl.setAttribute('aria-invalid', 'true');
        if (typeof inputEl.setCustomValidity === 'function') {
            inputEl.setCustomValidity(mensajePersonalizado || 'Campo inválido');
        }
    }
    const errEl = errorId ? document.getElementById(errorId) : null;
    if (errEl) {
        if (mensajePersonalizado) {
            errEl.innerHTML = `<i class="material-icons tiny">error</i> ${escaparHtmlBuscador(mensajePersonalizado)}`;
        }
        errEl.style.display = 'inline-flex';
    }
}

function mostrarBannerEstadoNuevoAlumno(tipo, htmlMensaje) {
    const banner = document.getElementById('estado-verificacion-nuevo-alumno');
    if (!banner) return;
    if (!htmlMensaje) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
    }
    const estilos = {
        info: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
        success: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
        warning: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
        error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
    };
    const st = estilos[tipo] || estilos.info;
    banner.style.backgroundColor = st.bg;
    banner.style.color = st.color;
    banner.style.border = `1px solid ${st.border}`;
    banner.style.display = 'block';
    banner.innerHTML = htmlMensaje;
}

function inicializarEventosFormularioNuevoAlumno() {
    if (_eventosModalAgregarAlumnoInicializados) return;
    const form = document.getElementById('form-agregar-alumno-grado');
    if (!form) return;

    const inputDni = document.getElementById('input-nuevo-alumno-dni');
    const inputApellido = document.getElementById('input-nuevo-alumno-apellido');
    const inputNombre = document.getElementById('input-nuevo-alumno-nombre');
    const radioV = document.getElementById('radio-nuevo-alumno-sexo-v');
    const radioM = document.getElementById('radio-nuevo-alumno-sexo-m');

    if (inputDni) {
        inputDni.addEventListener('input', () => {
            const limpio = inputDni.value.replace(/[^0-9]/g, '').slice(0, 10);
            if (inputDni.value !== limpio) inputDni.value = limpio;
            limpiarEstadoCampoNuevoAlumno(inputDni, 'error-nuevo-alumno-dni');
            actualizarBloqueoConflictoOtroGrado(null);
            _ultimoDniVerificadoConflicto = null;
            if (_timerDebounceVerificarDni) {
                clearTimeout(_timerDebounceVerificarDni);
                _timerDebounceVerificarDni = null;
            }
            if (limpio.length < 6) {
                mostrarBannerEstadoNuevoAlumno(null, '');
    actualizarBloqueoConflictoOtroGrado(null);
    _ultimoDniVerificadoConflicto = null;
    if (_timerDebounceVerificarDni) {
        clearTimeout(_timerDebounceVerificarDni);
        _timerDebounceVerificarDni = null;
    }
                return;
            }
            if (limpio.length >= 7) {
                _timerDebounceVerificarDni = setTimeout(() => {
                    _timerDebounceVerificarDni = null;
                    window.verificarDniExistenteNuevoAlumno(limpio);
                }, 260);
            }
        });
        inputDni.addEventListener('blur', () => {
            const val = inputDni.value.trim();
            if (_timerDebounceVerificarDni) {
                clearTimeout(_timerDebounceVerificarDni);
                _timerDebounceVerificarDni = null;
            }
            if (!val) return;
            if (!/^[0-9]{6,10}$/.test(val)) {
                mostrarErrorCampoNuevoAlumno(inputDni, 'error-nuevo-alumno-dni', 'Ingresa un DNI válido de 6 a 10 números.');
            } else {
                limpiarEstadoCampoNuevoAlumno(inputDni, 'error-nuevo-alumno-dni');
                if (_ultimoDniVerificadoConflicto !== val) {
                    window.verificarDniExistenteNuevoAlumno(val);
                }
            }
        });
    }

    if (inputApellido) {
        inputApellido.addEventListener('input', () => {
            limpiarEstadoCampoNuevoAlumno(inputApellido, 'error-nuevo-alumno-apellido');
        });
        inputApellido.addEventListener('blur', () => {
            if (inputApellido.dataset.touched === '1' && !inputApellido.value.trim()) {
                mostrarErrorCampoNuevoAlumno(inputApellido, 'error-nuevo-alumno-apellido', 'Ingresa el apellido del alumno.');
            }
            if (inputApellido.value.trim()) inputApellido.dataset.touched = '1';
        });
    }

    if (inputNombre) {
        inputNombre.addEventListener('input', () => {
            limpiarEstadoCampoNuevoAlumno(inputNombre, 'error-nuevo-alumno-nombre');
        });
        inputNombre.addEventListener('blur', () => {
            if (inputNombre.dataset.touched === '1' && !inputNombre.value.trim()) {
                mostrarErrorCampoNuevoAlumno(inputNombre, 'error-nuevo-alumno-nombre', 'Ingresa el nombre del alumno.');
            }
            if (inputNombre.value.trim()) inputNombre.dataset.touched = '1';
        });
    }

    [radioV, radioM].forEach(r => {
        if (r) {
            r.addEventListener('change', () => {
                limpiarEstadoCampoNuevoAlumno(radioV, 'error-nuevo-alumno-sexo');
            });
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.guardarNuevoAlumnoEnGrado();
    });

    _eventosModalAgregarAlumnoInicializados = true;
}

window.abrirModalAgregarAlumnoGrado = function() {
    if (!cursoCompleto || !currentSpreadsheetId) {
        M.toast({ html: 'Selecciona primero una planilla de grado.', classes: 'orange darken-3' });
        return;
    }
    if (window.planillaSoloLectura) {
        M.toast({ html: 'Esta planilla se encuentra en modo Solo Lectura.', classes: 'red darken-3' });
        return;
    }
    if (!puedeAgregarAlumnoEnPlanillaActual()) {
        M.toast({ html: 'Acceso restringido: los profesores de áreas especiales no pueden agregar alumnos al grado.', classes: 'red darken-3' });
        return;
    }

    inicializarEventosFormularioNuevoAlumno();

    const modalEl = document.getElementById('modal-agregar-alumno-grado');
    if (!modalEl) return;

    const form = document.getElementById('form-agregar-alumno-grado');
    if (form) form.reset();

    ['input-nuevo-alumno-dni', 'input-nuevo-alumno-apellido', 'input-nuevo-alumno-nombre'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.dataset.touched = '0';
            el.setAttribute('aria-invalid', 'false');
            if (typeof el.setCustomValidity === 'function') el.setCustomValidity('');
        }
    });
    ['error-nuevo-alumno-dni', 'error-nuevo-alumno-apellido', 'error-nuevo-alumno-nombre', 'error-nuevo-alumno-sexo'].forEach(id => {
        const err = document.getElementById(id);
        if (err) err.style.display = 'none';
    });
    mostrarBannerEstadoNuevoAlumno(null, '');
    actualizarBloqueoConflictoOtroGrado(null);
    _ultimoDniVerificadoConflicto = null;
    if (_timerDebounceVerificarDni) {
        clearTimeout(_timerDebounceVerificarDni);
        _timerDebounceVerificarDni = null;
    }

    const detailsEl = document.getElementById('details-datos-extra-nuevo-alumno');
    if (detailsEl) detailsEl.open = false;

    const nombrePlanilla = window.currentPlanillaNombre || (selectPlanilla && selectPlanilla.value) || '';
    const infoG = typeof extraerGradoYSeccionGlobal === 'function' ? extraerGradoYSeccionGlobal(nombrePlanilla) : null;
    const badgeGrado = document.getElementById('badge-grado-agregar-alumno');
    if (badgeGrado) {
        if (infoG && infoG.grado && infoG.grado < 99) {
            badgeGrado.textContent = `${infoG.grado}° Grado "${infoG.seccion || ''}" (${nombrePlanilla})`;
        } else {
            badgeGrado.textContent = nombrePlanilla || 'Grado actual';
        }
    }

    let instance = (typeof M !== 'undefined' && M.Modal) ? M.Modal.getInstance(modalEl) : null;
    if (!instance && typeof M !== 'undefined' && M.Modal) {
        instance = M.Modal.init(modalEl, { dismissible: true });
    }
    if (instance) {
        instance.open();
    } else {
        modalEl.style.display = 'block';
    }

    setTimeout(() => {
        const inputDni = document.getElementById('input-nuevo-alumno-dni');
        if (inputDni) inputDni.focus();
    }, 120);
};

window.verificarDniExistenteNuevoAlumno = async function(dniInput) {
    const dniLimpio = String(dniInput || '').replace(/[^0-9]/g, '').trim();
    if (!dniLimpio || dniLimpio.length < 6) return;

    try {
        _ultimoDniVerificadoConflicto = dniLimpio;
        const planillaIdActual = window.currentPlanillaDbId || (cursoCompleto && cursoCompleto.id) || null;
        const nombrePlanillaActual = window.currentPlanillaNombre || (cursoCompleto && cursoCompleto.nombre) || (selectPlanilla && selectPlanilla.value) || '';

        // 1. Verificar si ya está en la planilla abierta en memoria
        const existenteEnCurso = (cursoCompleto && studentsByDni) ? studentsByDni.get(dniLimpio) : null;
        if (existenteEnCurso) {
            const datosH = (existenteEnCurso.datosHojas && existenteEnCurso.datosHojas['DATOS']) || {};
            const ocultoVal = String(datosH['OCULTO'] || '').toUpperCase().trim();
            const activoVal = String(datosH['ACTIVOS'] || datosH['ESTADO'] || 'TRUE').toUpperCase().trim();
            const estaOculto = (ocultoVal === 'SÍ' || ocultoVal === 'SI' || ocultoVal === 'TRUE');
            const estaActivo = (activoVal === 'TRUE' || activoVal === 'VERDADERO' || activoVal === 'SI' || activoVal === 'SÍ' || activoVal === '1');

            if (!estaOculto && estaActivo) {
                mostrarBannerEstadoNuevoAlumno(
                    'warning',
                    `⚠️ El alumno con DNI <strong>${escaparHtmlBuscador(dniLimpio)}</strong> (<strong>${escaparHtmlBuscador(existenteEnCurso.nombreCompleto)}</strong>) ya figura activo en este grado. Si confirmas el formulario, se actualizarán sus datos personales.`
                );
            } else {
                mostrarBannerEstadoNuevoAlumno(
                    'info',
                    `ℹ️ El alumno <strong>${escaparHtmlBuscador(existenteEnCurso.nombreCompleto)}</strong> estaba marcado como inactivo/oculto en este grado. Al confirmar se reactivará y volverá a aparecer en la lista.`
                );
            }
        }

        // 2. Consultar en Supabase: padrón 'alumnos', ficha 'DATOS' y matrículas activas en otros grados del mismo año lectivo
        const [{ data: alDb }, { data: califsDatosList }, conflictoOtroGrado] = await Promise.all([
            supabaseClient
                .from('alumnos')
                .select('dni, apellido, nombre, sexo, fecha_nacimiento, activo, oculto')
                .eq('dni', dniLimpio)
                .maybeSingle(),
            supabaseClient
                .from('calificaciones')
                .select('valores, updated_at')
                .eq('alumno_dni', dniLimpio)
                .eq('nombre_hoja', 'DATOS')
                .order('updated_at', { ascending: false })
                .limit(3),
            verificarConflictoDniOtroGrado(dniLimpio, planillaIdActual, nombrePlanillaActual)
        ]);

        // Evitar aplicar resultados desactualizados si el usuario siguió escribiendo otro DNI
        const inputDniActual = document.getElementById('input-nuevo-alumno-dni');
        if (inputDniActual && inputDniActual.value.replace(/[^0-9]/g, '').trim() !== dniLimpio) {
            return;
        }

        // Consolidar valores previos de hoja DATOS si existen en Supabase o en memoria
        const datosPreviosConsolidados = {};
        if (Array.isArray(califsDatosList)) {
            for (let i = califsDatosList.length - 1; i >= 0; i--) {
                const row = califsDatosList[i];
                if (row && row.valores && typeof row.valores === 'object') {
                    Object.entries(row.valores).forEach(([k, v]) => {
                        if (v !== undefined && v !== null && String(v).trim() !== '') {
                            datosPreviosConsolidados[k] = String(v).trim();
                        }
                    });
                }
            }
        }
        if (existenteEnCurso && existenteEnCurso.datosHojas && existenteEnCurso.datosHojas['DATOS']) {
            Object.entries(existenteEnCurso.datosHojas['DATOS']).forEach(([k, v]) => {
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    datosPreviosConsolidados[k] = String(v).trim();
                }
            });
        }

        if (alDb || Object.keys(datosPreviosConsolidados).length > 0) {
            const inputApellido = document.getElementById('input-nuevo-alumno-apellido');
            const inputNombre = document.getElementById('input-nuevo-alumno-nombre');
            const inputFechaNac = document.getElementById('input-nuevo-alumno-fecha-nac');
            const radioV = document.getElementById('radio-nuevo-alumno-sexo-v');
            const radioM = document.getElementById('radio-nuevo-alumno-sexo-m');

            const apVal = (alDb && alDb.apellido) || datosPreviosConsolidados['APELLIDO'] || '';
            const nomVal = (alDb && alDb.nombre) || datosPreviosConsolidados['NOMBRE'] || '';
            const fnacVal = (alDb && alDb.fecha_nacimiento) || datosPreviosConsolidados['FECHA DE NAC'] || datosPreviosConsolidados['FECHA NACIMIENTO'] || '';

            if (inputApellido && !inputApellido.value.trim() && apVal) {
                inputApellido.value = String(apVal).trim();
                limpiarEstadoCampoNuevoAlumno(inputApellido, 'error-nuevo-alumno-apellido');
            }
            if (inputNombre && !inputNombre.value.trim() && nomVal) {
                inputNombre.value = String(nomVal).trim();
                limpiarEstadoCampoNuevoAlumno(inputNombre, 'error-nuevo-alumno-nombre');
            }
            if (inputFechaNac && !inputFechaNac.value.trim() && fnacVal) {
                inputFechaNac.value = String(fnacVal).trim();
            }

            const sexoUp = String((alDb && alDb.sexo) || datosPreviosConsolidados['SEXO'] || '').toUpperCase().trim();
            if ((sexoUp === 'V' || sexoUp.startsWith('VAR') || sexoUp.startsWith('MASC')) && radioV && (!radioV.checked && !radioM?.checked)) {
                radioV.checked = true;
                limpiarEstadoCampoNuevoAlumno(radioV, 'error-nuevo-alumno-sexo');
            } else if ((sexoUp === 'M' || sexoUp.startsWith('MUJ') || sexoUp.startsWith('FEM') || sexoUp === 'F') && radioM && (!radioV?.checked && !radioM.checked)) {
                radioM.checked = true;
                limpiarEstadoCampoNuevoAlumno(radioV, 'error-nuevo-alumno-sexo');
            }

            // Autocompletar todos los campos del área de DATOS (Progenitor A, Progenitor B, Auxiliar, Bautismo, Dirección, etc.)
            const formModal = document.getElementById('form-agregar-alumno-grado');
            if (formModal) {
                formModal.querySelectorAll('input[data-datos-key]').forEach(inp => {
                    const key = inp.getAttribute('data-datos-key');
                    if (!key || inp.value.trim() !== '') return;
                    const valPrev = datosPreviosConsolidados[key];
                    if (valPrev !== undefined && valPrev !== null && String(valPrev).trim() !== '') {
                        inp.value = String(valPrev).trim();
                    }
                });
            }

            const nombreAlumnoConflicto = [apVal, nomVal].filter(Boolean).join(', ') || (existenteEnCurso && existenteEnCurso.nombreCompleto) || `DNI ${dniLimpio}`;
            if (conflictoOtroGrado) {
                const listaGradosHtml = conflictoOtroGrado.grados.map(g => escaparHtmlBuscador(g.etiqueta)).join(', ');
                const listaGradosTexto = conflictoOtroGrado.grados.map(g => g.etiqueta).join(', ');
                actualizarBloqueoConflictoOtroGrado(conflictoOtroGrado);
                mostrarErrorCampoNuevoAlumno(
                    document.getElementById('input-nuevo-alumno-dni'),
                    'error-nuevo-alumno-dni',
                    `Este DNI ya figura activo en ${listaGradosTexto} (Ciclo Lectivo ${conflictoOtroGrado.anioLectivo}).`
                );
                mostrarBannerEstadoNuevoAlumno(
                    'error',
                    `⛔ <strong>No se puede agregar este alumno:</strong> <strong>${escaparHtmlBuscador(nombreAlumnoConflicto)}</strong> (DNI <strong>${escaparHtmlBuscador(dniLimpio)}</strong>) ya se encuentra activo en <strong>${listaGradosHtml}</strong> del ciclo lectivo <strong>${conflictoOtroGrado.anioLectivo}</strong>.<br>Para incorporarlo a este grado, primero debe ser <strong>inactivado o eliminado</strong> del otro grado.`
                );
            } else {
                actualizarBloqueoConflictoOtroGrado(null);
                if (!existenteEnCurso && (apVal || nomVal)) {
                    mostrarBannerEstadoNuevoAlumno(
                        'info',
                        `ℹ️ Se encontró a <strong>${escaparHtmlBuscador(apVal + (apVal && nomVal ? ', ' : '') + nomVal)}</strong> en el padrón del colegio y se autocompletó toda su ficha personal y familiar para incorporarlo a este grado.`
                    );
                }
            }
        } else if (conflictoOtroGrado) {
            const listaGradosHtml = conflictoOtroGrado.grados.map(g => escaparHtmlBuscador(g.etiqueta)).join(', ');
            const listaGradosTexto = conflictoOtroGrado.grados.map(g => g.etiqueta).join(', ');
            actualizarBloqueoConflictoOtroGrado(conflictoOtroGrado);
            mostrarErrorCampoNuevoAlumno(
                document.getElementById('input-nuevo-alumno-dni'),
                'error-nuevo-alumno-dni',
                `Este DNI ya figura activo en ${listaGradosTexto} (Ciclo Lectivo ${conflictoOtroGrado.anioLectivo}).`
            );
            mostrarBannerEstadoNuevoAlumno(
                'error',
                `⛔ <strong>No se puede agregar este alumno:</strong> el DNI <strong>${escaparHtmlBuscador(dniLimpio)}</strong> ya se encuentra activo en <strong>${listaGradosHtml}</strong> del ciclo lectivo <strong>${conflictoOtroGrado.anioLectivo}</strong>.<br>Para incorporarlo a este grado, primero debe ser <strong>inactivado o eliminado</strong> del otro grado.`
            );
        } else {
            actualizarBloqueoConflictoOtroGrado(null);
            if (!existenteEnCurso) {
                mostrarBannerEstadoNuevoAlumno(null, '');
            }
        }
    } catch (err) {
        console.warn('[Agregar Alumno] Aviso consultando DNI existente:', err);
    }
};

async function obtenerPlanillasHermanasDelGrado(planillaIdActual, nombrePlanillaActual) {
    const idsSet = new Set();
    const planillasEncontradas = [];

    if (planillaIdActual) {
        idsSet.add(Number(planillaIdActual));
    }

    try {
        const infoActual = typeof extraerGradoYSeccionGlobal === 'function'
            ? extraerGradoYSeccionGlobal(nombrePlanillaActual)
            : null;
        const gradoObjetivo = infoActual && infoActual.grado && infoActual.grado < 99 ? Number(infoActual.grado) : null;
        const seccionObjetivo = infoActual && infoActual.seccion ? String(infoActual.seccion).toUpperCase().trim() : '';

        const { data: todasPlanillas } = await supabaseClient
            .from('planillas')
            .select('id, nombre, spreadsheet_id, activo')
            .eq('activo', true);

        if (Array.isArray(todasPlanillas)) {
            todasPlanillas.forEach(p => {
                if (Number(p.id) === Number(planillaIdActual)) {
                    planillasEncontradas.push(p);
                    idsSet.add(Number(p.id));
                    return;
                }
                if (gradoObjetivo && seccionObjetivo && typeof extraerGradoYSeccionGlobal === 'function') {
                    const inf = extraerGradoYSeccionGlobal(p.nombre);
                    if (inf && Number(inf.grado) === gradoObjetivo && String(inf.seccion || '').toUpperCase().trim() === seccionObjetivo) {
                        if (!idsSet.has(Number(p.id))) {
                            idsSet.add(Number(p.id));
                            planillasEncontradas.push(p);
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.warn('[Agregar Alumno] Aviso buscando planillas hermanas del grado:', err);
    }

    if (planillasEncontradas.length === 0 && planillaIdActual) {
        planillasEncontradas.push({
            id: Number(planillaIdActual),
            nombre: nombrePlanillaActual || '',
            spreadsheet_id: currentSpreadsheetId || ''
        });
    }

    return planillasEncontradas;
}

window.guardarNuevoAlumnoEnGrado = async function() {
    if (!cursoCompleto || !currentSpreadsheetId) {
        M.toast({ html: 'No hay una planilla activa seleccionada.', classes: 'red darken-3' });
        return;
    }
    if (window.planillaSoloLectura) {
        M.toast({ html: 'Esta planilla está en modo Solo Lectura.', classes: 'red darken-3' });
        return;
    }
    if (!puedeAgregarAlumnoEnPlanillaActual()) {
        M.toast({ html: 'Acceso restringido: los profesores de áreas especiales no pueden agregar alumnos al grado.', classes: 'red darken-3' });
        return;
    }

    const inputDni = document.getElementById('input-nuevo-alumno-dni');
    const inputApellido = document.getElementById('input-nuevo-alumno-apellido');
    const inputNombre = document.getElementById('input-nuevo-alumno-nombre');
    const inputFechaNac = document.getElementById('input-nuevo-alumno-fecha-nac');
    const radioV = document.getElementById('radio-nuevo-alumno-sexo-v');
    const radioM = document.getElementById('radio-nuevo-alumno-sexo-m');

    const dniLimpio = String(inputDni?.value || '').replace(/[^0-9]/g, '').trim();
    const apellidoLimpio = String(inputApellido?.value || '').trim().toUpperCase();
    const nombreLimpio = String(inputNombre?.value || '').trim().toUpperCase();
    const sexoSeleccionado = radioV?.checked ? 'V' : (radioM?.checked ? 'M' : '');
    const fechaNacLimpia = String(inputFechaNac?.value || '').trim();

    // Validación con redirección de foco al primer campo con error
    let primerCampoInvalido = null;

    if (!/^[0-9]{6,10}$/.test(dniLimpio)) {
        mostrarErrorCampoNuevoAlumno(inputDni, 'error-nuevo-alumno-dni', 'Ingresa un DNI válido de 6 a 10 números.');
        if (!primerCampoInvalido) primerCampoInvalido = inputDni;
    } else {
        limpiarEstadoCampoNuevoAlumno(inputDni, 'error-nuevo-alumno-dni');
    }

    if (!apellidoLimpio) {
        mostrarErrorCampoNuevoAlumno(inputApellido, 'error-nuevo-alumno-apellido', 'Ingresa el apellido del alumno.');
        if (!primerCampoInvalido) primerCampoInvalido = inputApellido;
    } else {
        limpiarEstadoCampoNuevoAlumno(inputApellido, 'error-nuevo-alumno-apellido');
    }

    if (!nombreLimpio) {
        mostrarErrorCampoNuevoAlumno(inputNombre, 'error-nuevo-alumno-nombre', 'Ingresa el nombre del alumno.');
        if (!primerCampoInvalido) primerCampoInvalido = inputNombre;
    } else {
        limpiarEstadoCampoNuevoAlumno(inputNombre, 'error-nuevo-alumno-nombre');
    }

    if (!sexoSeleccionado) {
        mostrarErrorCampoNuevoAlumno(radioV, 'error-nuevo-alumno-sexo', 'Selecciona el sexo del alumno para calcular su número de orden.');
        if (!primerCampoInvalido) primerCampoInvalido = radioV;
    } else {
        limpiarEstadoCampoNuevoAlumno(radioV, 'error-nuevo-alumno-sexo');
    }

    if (primerCampoInvalido) {
        primerCampoInvalido.focus();
        return;
    }

    const btnSubmit = document.getElementById('btn-confirmar-agregar-alumno');
    const htmlBtnOriginal = btnSubmit ? btnSubmit.innerHTML : '';
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="material-icons left">hourglass_empty</i><span>Guardando alumno...</span>';
    }

    try {
        const planillaIdActual = window.currentPlanillaDbId || cursoCompleto.id;
        const nombrePlanillaActual = window.currentPlanillaNombre || cursoCompleto.nombre || (selectPlanilla && selectPlanilla.value) || '';
        const correoAuditoria = sessionStorage.getItem('misericordia_sesion') || emailProcesando || 'Docente';
        const ahoraIso = new Date().toISOString();

        // 0. Bloqueo obligatorio si el DNI ya figura activo en otro grado del mismo año lectivo
        const conflictoOtroGrado = await verificarConflictoDniOtroGrado(dniLimpio, planillaIdActual, nombrePlanillaActual);
        if (conflictoOtroGrado) {
            const listaGradosHtml = conflictoOtroGrado.grados.map(g => escaparHtmlBuscador(g.etiqueta)).join(', ');
            const listaGradosTexto = conflictoOtroGrado.grados.map(g => g.etiqueta).join(', ');
            mostrarErrorCampoNuevoAlumno(
                inputDni,
                'error-nuevo-alumno-dni',
                `Este DNI ya figura activo en ${listaGradosTexto} (Ciclo Lectivo ${conflictoOtroGrado.anioLectivo}).`
            );
            mostrarBannerEstadoNuevoAlumno(
                'error',
                `⛔ <strong>No se puede agregar este alumno:</strong> el DNI <strong>${escaparHtmlBuscador(dniLimpio)}</strong> ya se encuentra activo en <strong>${listaGradosHtml}</strong> del ciclo lectivo <strong>${conflictoOtroGrado.anioLectivo}</strong>.<br>Para incorporarlo a este grado, primero debe ser <strong>inactivado o eliminado</strong> del otro grado.`
            );
            M.toast({
                html: `⛔ El alumno ya figura activo en ${listaGradosTexto} (${conflictoOtroGrado.anioLectivo}). Debe ser inactivado o eliminado allí primero.`,
                classes: 'red darken-3',
                displayLength: 5500
            });
            actualizarBloqueoConflictoOtroGrado(conflictoOtroGrado);
            if (inputDni) inputDni.focus();
            return;
        }

        // 1. Crear o actualizar registro en tabla 'alumnos'
        const payloadAlumno = {
            dni: dniLimpio,
            apellido: apellidoLimpio,
            nombre: nombreLimpio,
            sexo: sexoSeleccionado,
            activo: true,
            oculto: false,
            updated_at: ahoraIso
        };
        if (fechaNacLimpia) {
            payloadAlumno.fecha_nacimiento = fechaNacLimpia;
        }

        const { error: errUpsertAlumno } = await supabaseClient
            .from('alumnos')
            .upsert(payloadAlumno, { onConflict: 'dni' });

        if (errUpsertAlumno) {
            throw new Error(`Error al registrar el alumno en la base de datos: ${errUpsertAlumno.message}`);
        }

        // 2. Identificar todas las planillas de este mismo Grado y Sección (1° Cuat., 2° Cuat. y Áreas Especiales)
        const planillasDelGrado = await obtenerPlanillasHermanasDelGrado(planillaIdActual, nombrePlanillaActual);
        const idsPlanillasDelGrado = planillasDelGrado.map(p => Number(p.id)).filter(Boolean);

        // 3. Matricular al alumno en todas las planillas de este grado y sección
        const filasMatricula = idsPlanillasDelGrado.map(pid => ({
            planilla_id: pid,
            alumno_dni: dniLimpio,
            activo: true,
            oculto: false
        }));

        if (filasMatricula.length > 0) {
            const { error: errMatricula } = await supabaseClient
                .from('alumno_planillas')
                .upsert(filasMatricula, { onConflict: 'planilla_id,alumno_dni' });

            if (errMatricula) {
                throw new Error(`Error al matricular el alumno en el grado: ${errMatricula.message}`);
            }
        }

        // 4. Reordenar reglamentariamente la nómina activa del grado (Varones A-Z primero, Mujeres A-Z después)
        let nuevoNumeroOrdenAsignado = 1;
        try {
            const { data: matriculasGrado } = await supabaseClient
                .from('alumno_planillas')
                .select('alumno_dni, activo, oculto, alumnos(dni, apellido, nombre, sexo)')
                .eq('planilla_id', planillaIdActual);

            const activosParaOrden = (matriculasGrado || [])
                .filter(m => m.activo !== false && m.oculto !== true)
                .map(m => {
                    const al = m.alumnos || {};
                    const esNuevo = String(m.alumno_dni).trim() === dniLimpio;
                    return {
                        dni: String(m.alumno_dni || '').trim(),
                        apellido: esNuevo ? apellidoLimpio : String(al.apellido || '').trim(),
                        nombre: esNuevo ? nombreLimpio : String(al.nombre || '').trim(),
                        sexo: esNuevo ? sexoSeleccionado : String(al.sexo || '').trim()
                    };
                });

            activosParaOrden.sort((a, b) => {
                const pesoA = obtenerPesoSexo(a.sexo);
                const pesoB = obtenerPesoSexo(b.sexo);
                if (pesoA !== pesoB) return pesoA - pesoB;
                const cmpAp = a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' });
                if (cmpAp !== 0) return cmpAp;
                const cmpNom = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
                if (cmpNom !== 0) return cmpNom;
                return a.dni.localeCompare(b.dni, 'es', { sensitivity: 'base' });
            });

            await Promise.all(
                activosParaOrden.map((item, idx) => {
                    const nro = idx + 1;
                    if (item.dni === dniLimpio) nuevoNumeroOrdenAsignado = nro;
                    return supabaseClient
                        .from('alumno_planillas')
                        .update({ numero_orden: nro })
                        .in('planilla_id', idsPlanillasDelGrado)
                        .eq('alumno_dni', item.dni);
                })
            );
        } catch (errOrden) {
            console.warn('[Agregar Alumno] Aviso reordenando números de orden:', errOrden);
        }

        // 5. Guardar todos los campos de la ficha DATOS (Nacimiento, Bautismo, Dirección, Progenitor A, Progenitor B, Auxiliar, Observaciones)
        const infoGrado = typeof extraerGradoYSeccionGlobal === 'function'
            ? extraerGradoYSeccionGlobal(nombrePlanillaActual)
            : null;
        const extrasDatos = {};
        if (infoGrado && infoGrado.grado && infoGrado.grado < 99) {
            extrasDatos['GRADO'] = `${infoGrado.grado}°`;
        }
        if (infoGrado && infoGrado.seccion) {
            extrasDatos['SECCION'] = String(infoGrado.seccion).toUpperCase().trim();
        }
        if (fechaNacLimpia) {
            extrasDatos['FECHA DE NAC'] = fechaNacLimpia;
        }

        const formModal = document.getElementById('form-agregar-alumno-grado');
        if (formModal) {
            formModal.querySelectorAll('input[data-datos-key]').forEach(inp => {
                const claveDatos = inp.getAttribute('data-datos-key');
                const valorCampo = String(inp.value || '').trim();
                if (claveDatos && valorCampo !== '') {
                    extrasDatos[claveDatos] = valorCampo;
                }
            });
        }

        const planillasRegularesGrado = planillasDelGrado.filter(p => !/ESP|ESPECIAL/i.test(p.nombre || ''));
        const idsParaDatos = planillasRegularesGrado.length > 0
            ? planillasRegularesGrado.map(p => Number(p.id))
            : [Number(planillaIdActual)];

        if (Object.keys(extrasDatos).length > 0) {
            for (const pidDatos of idsParaDatos) {
                try {
                    const { data: prevCalDatos } = await supabaseClient
                        .from('calificaciones')
                        .select('valores')
                        .eq('planilla_id', pidDatos)
                        .eq('alumno_dni', dniLimpio)
                        .eq('nombre_hoja', 'DATOS')
                        .maybeSingle();

                    const valoresFusionados = Object.assign(
                        {},
                        (prevCalDatos && prevCalDatos.valores) ? prevCalDatos.valores : {},
                        extrasDatos
                    );

                    await supabaseClient.from('calificaciones').upsert({
                        planilla_id: pidDatos,
                        alumno_dni: dniLimpio,
                        nombre_hoja: 'DATOS',
                        valores: valoresFusionados,
                        updated_by: correoAuditoria,
                        updated_at: ahoraIso
                    }, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });
                } catch (eDatosExtra) {
                    console.warn('[Agregar Alumno] Aviso guardando datos extra en DATOS:', eDatosExtra);
                }
            }
        }

        // 6. Registrar en Auditoría con snapshot completo de todos los campos de DATOS
        try {
            const resumenAlta = `➕ ALTA DE ALUMNO EN GRADO: ${apellidoLimpio}, ${nombreLimpio} (DNI: ${dniLimpio} | Sexo: ${sexoSeleccionado} | Orden #${nuevoNumeroOrdenAsignado})`;
            const snapshotDespues = Object.assign({}, extrasDatos, {
                APELLIDO: apellidoLimpio,
                NOMBRE: nombreLimpio,
                SEXO: sexoSeleccionado,
                'FECHA NACIMIENTO': fechaNacLimpia || '',
                ACTIVOS: 'TRUE',
                OCULTO: 'NO'
            });
            const camposSnapshot = {
                APELLIDO: { antes: '', despues: apellidoLimpio },
                NOMBRE: { antes: '', despues: nombreLimpio },
                SEXO: { antes: '', despues: sexoSeleccionado },
                ACTIVOS: { antes: 'FALSE', despues: 'TRUE' }
            };
            Object.entries(extrasDatos).forEach(([k, v]) => {
                camposSnapshot[k] = { antes: '', despues: String(v) };
            });

            const snapshotCodificado = typeof window.codificarCambiosConSnapshot === 'function'
                ? window.codificarCambiosConSnapshot(resumenAlta, {
                    tipo: 'DATOS',
                    planilla_id: planillaIdActual,
                    nombre_planilla: nombrePlanillaActual,
                    dni: dniLimpio,
                    hoja: 'DATOS',
                    antes: {},
                    despues: snapshotDespues,
                    campos: camposSnapshot
                })
                : resumenAlta;

            await getAuditSupabaseClient().from('auditoria').insert({
                usuario: correoAuditoria,
                planilla_id: String(planillaIdActual || currentSpreadsheetId || ''),
                nombre_planilla: nombrePlanillaActual,
                hoja: 'DATOS',
                dni_alumno: dniLimpio,
                cambios: snapshotCodificado
            });
        } catch (errAud) {
            console.warn('[Agregar Alumno] Aviso registrando auditoría de alta:', errAud);
        }

        // 7. Limpiar cachés locales de las planillas del grado y padrón general
        window._padronAlumnosAdminCache = null;
        planillasDelGrado.forEach(p => {
            ['misericordia_data_' + p.spreadsheet_id, 'misericordia_data_' + p.id, 'misericordia_data_' + p.nombre].forEach(k => {
                try { sessionStorage.removeItem(k); } catch (e) {}
                try { localStorage.removeItem(k); } catch (e) {}
            });
        });

        // 8. Cerrar el modal
        const modalEl = document.getElementById('modal-agregar-alumno-grado');
        if (modalEl && typeof M !== 'undefined' && M.Modal) {
            const inst = M.Modal.getInstance(modalEl);
            if (inst) inst.close();
        } else if (modalEl) {
            modalEl.style.display = 'none';
        }

        // 9. Recargar el curso activo desde Supabase y seleccionar automáticamente al alumno recién agregado
        const hojaActivaPrevia = (typeof selectHoja !== 'undefined' && selectHoja && selectHoja.value) ? selectHoja.value : 'DATOS';
        HOJA_ACTUAL_SELECCIONADA = hojaActivaPrevia;

        await consultarCursoEnSupabase(currentSpreadsheetId, correoAuditoria);

        if (selectAlumno) {
            const optNuevo = Array.from(selectAlumno.options).find(o => String(o.value).trim() === dniLimpio);
            if (optNuevo) {
                selectAlumno.value = dniLimpio;
                window.dniAlumnoActual = dniLimpio;
                habilitarSelect(selectAlumno, true);
                cargarDatosDeAlumno();
                actualizarContadorSidebar();
            }
        }

        M.toast({
            html: `✅ Alumno ${apellidoLimpio}, ${nombreLimpio} (Orden #${nuevoNumeroOrdenAsignado}) agregado al grado exitosamente.`,
            classes: 'green darken-2',
            displayLength: 4500
        });
    } catch (err) {
        console.error('[Agregar Alumno] Error al guardar nuevo alumno:', err);
        mostrarBannerEstadoNuevoAlumno('error', `❌ ${escaparHtmlBuscador(err.message || String(err))}`);
        M.toast({ html: '❌ ' + (err.message || 'Error al agregar el alumno'), classes: 'red darken-3', displayLength: 5000 });
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = Boolean(_conflictoOtroGradoActual);
            btnSubmit.innerHTML = htmlBtnOriginal;
        }
    }
};


