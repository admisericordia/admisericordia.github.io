// ================================================================
// ARCHIVO: migracion.js
// Panel Unificado:
// 1. Migración Cuatrimestral (1º a 2º Cuatrimestre)
// 2. Pase de Grado y Promoción Anual (Promoción, Repitencia y Atraso)
// ================================================================

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizarTextoPase(str) {
    return String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

function obtenerPesoSexoPase(sexo) {
    const val = normalizarTextoPase(sexo);
    if (val === 'V' || val === 'VARON' || val === 'MASCULINO') return 1;
    if (val === 'M' || val === 'MUJER' || val === 'FEMENINO' || val === 'F') return 2;
    return 3;
}

function compararAlumnosParaNuevoOrden(a, b) {
    const pesoA = obtenerPesoSexoPase(a.sexo || a.genero);
    const pesoB = obtenerPesoSexoPase(b.sexo || b.genero);
    if (pesoA !== pesoB) return pesoA - pesoB;

    const apeA = String(a.apellido || '').trim();
    const apeB = String(b.apellido || '').trim();
    const compApe = apeA.localeCompare(apeB, 'es', { sensitivity: 'base' });
    if (compApe !== 0) return compApe;

    const nomA = String(a.nombre || '').trim();
    const nomB = String(b.nombre || '').trim();
    return nomA.localeCompare(nomB, 'es', { sensitivity: 'base' });
}

function iniciarModuloMigracion(modoInicial) {
    modoInicial = modoInicial || 'cuatrimestre';

    const modalExistente = document.getElementById('modal-migracion');
    if (modalExistente && document.getElementById('panel-modo-pase-grado') && document.getElementById('sync-alcance-select')) {
        const inst = M.Modal.getInstance(modalExistente) || M.Modal.init(modalExistente);
        inst.open();
        if (typeof window.cambiarModoMigracionPrincipal === 'function') {
            window.cambiarModoMigracionPrincipal(modoInicial);
        }
        return;
    }

    if (modalExistente) {
        try {
            const inst = M.Modal.getInstance(modalExistente);
            if (inst) inst.destroy();
        } catch (e) {}
        modalExistente.remove();
    }

    if (!document.getElementById('modal-migracion')) {
        const modalHTML = `
        <style>
            #modal-migracion.modal {
                border-radius: 14px; max-width: 980px; width: 95%;
                max-height: 96vh !important; height: 96vh !important;
                overflow: hidden;
            }
            #modal-migracion.modal.open {
                display: flex !important; flex-direction: column;
                position: fixed !important; top: 2vh !important; left: 0 !important; right: 0 !important;
                margin: 0 auto !important; transform: none !important;
            }
            #modal-migracion .modal-content { padding: 18px 22px 10px 22px; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow-y: auto; }
            #modal-migracion .modal-footer { position: sticky; bottom: 0; background: #fff; z-index: 12; border-top: 1px solid #e0e0e0; padding: 10px 22px; flex-shrink: 0; }

            .modo-main-tab {
                border: none; background: transparent; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; color: #555; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px;
            }
            .modo-main-tab.active {
                background: #4a148c; color: white; box-shadow: 0 2px 6px rgba(74, 20, 140, 0.25);
            }
            .modo-main-tab.tab-pase.active {
                background: #1565c0; color: white; box-shadow: 0 2px 6px rgba(21, 101, 192, 0.25);
            }
            .modo-main-tab.tab-sync.active {
                background: #00796b; color: white; box-shadow: 0 2px 6px rgba(0, 121, 107, 0.25);
            }

            .stat-chip {
                display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 14px; font-size: 0.75rem; font-weight: 700; gap: 4px;
            }
            .stat-chip.total { background: #e0f2fe; color: #0369a1; }
            .stat-chip.promovidos { background: #dcfce7; color: #15803d; }
            .stat-chip.repitentes { background: #fee2e2; color: #b91c1c; }
            .stat-chip.coloquio { background: #fef3c7; color: #b45309; }

            .tabla-pase th {
                background: #f8fafc; color: #334155; font-size: 0.74rem; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 6;
            }
            .tabla-pase td {
                padding: 6px 8px; font-size: 0.78rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;
            }
            .tabla-pase tr:hover { background: #f8fafc; }

            .badge-situacion {
                display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
            }
            .badge-promovido { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .badge-repite { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .badge-coloquio { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

            .select-accion-pase {
                display: block; width: 100%; height: 30px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; padding: 0 4px; font-weight: 600;
            }
            .select-seccion-pase {
                display: block; width: 65px; height: 30px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; padding: 0 4px; font-weight: 600; text-align: center;
            }

            .tracker-container { display: flex; justify-content: space-between; position: relative; margin: 4px 0 8px 0; padding: 0 8px; flex-shrink: 0; }
            .tracker-step { display: flex; flex-direction: column; align-items: center; z-index: 2; position: relative; width: 52px; }
            .tracker-icon { width: 22px; height: 22px; border-radius: 50%; background: #e0e0e0; color: white; display: flex; justify-content: center; align-items: center; font-size: 11px; font-weight: bold; margin-bottom: 4px; transition: background 0.3s; }
            .tracker-step.active .tracker-icon { background: #4caf50; }
            .tracker-label { font-size: 0.56rem; color: #555; text-align: center; font-weight: 600; line-height: 1.05; }
            .tracker-line { position: absolute; top: 11px; left: 30px; right: 30px; height: 2px; background: #e0e0e0; z-index: 1; }
            .tracker-progress { position: absolute; top: 11px; left: 30px; height: 2px; background: #1976d2; z-index: 1; transition: width 0.4s ease; width: 0%; }
            .progress-text { text-align: right; font-size: 0.72rem; font-weight: bold; color: #555; margin-top: -2px; margin-bottom: 2px; flex-shrink: 0; }

            .diag-card { display: flex; border-radius: 6px; margin-bottom: 8px; overflow: hidden; border: 1px solid #ddd; background: #fff; }
            .diag-side { width: 85px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-weight: bold; font-size: 0.75rem; line-height: 1.2; border-right: 1px solid #ddd; }
            .diag-content { flex: 1; padding: 8px 12px; font-size: 0.8rem; color: #333; display: flex; align-items: flex-start; gap: 8px; }
            .diag-icon { font-size: 18px; margin-top: 2px; }
            .diag-title { font-weight: 700; font-size: 0.75rem; margin-bottom: 2px; display: block; text-transform: uppercase; }
            .tech-detail { display: none; margin-top: 6px; font-family: monospace; font-size: 0.7rem; color: #d32f2f; background: #ffebee; padding: 3px 6px; border-radius: 4px; }
            .show-tech .tech-detail { display: block; }
            .card-success { background: #e8f5e9; border-color: #c8e6c9; }
            .card-success .diag-side { background: #dcedc8; color: #2e7d32; border-right-color: #c8e6c9; }
            .card-warning { background: #fff8e1; border-color: #ffecb3; }
            .card-warning .diag-side { background: #ffecb3; color: #f57f17; border-right-color: #ffe082; }
            .card-error { background: #ffebee; border-color: #ffcdd2; }
            .card-error .diag-side { background: #ffcdd2; color: #c62828; border-right-color: #ef9a9a; }
            .filter-btn { padding: 0 10px; height: 26px; line-height: 26px; font-size: 0.7rem; border-radius: 13px; border: 1px solid #ccc; background: white; color: #555; cursor: pointer; font-weight: 600; }
            .filter-btn.active { background: #4a148c; color: white; border-color: #4a148c; }
        </style>

        <div id="modal-migracion" class="modal">
            <div class="modal-content">
                <!-- Barra Superior de Modos -->
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px; flex-shrink: 0;">
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="modo-main-tab active" id="tab-btn-cuatrimestre" data-mode="cuatrimestre">
                            <i class="material-icons" style="font-size:18px;">sync_alt</i>1º a 2º Cuatrimestre
                        </button>
                        <button type="button" class="modo-main-tab tab-pase" id="tab-btn-pase-grado" data-mode="pase-grado">
                            <i class="material-icons" style="font-size:18px;">school</i>Pase de Grado Anual
                        </button>
                        <button type="button" class="modo-main-tab tab-sync" id="tab-btn-sync-sheets" data-mode="sync-sheets">
                            <i class="material-icons" style="font-size:18px;">cloud_sync</i>Sincronización Sheets
                        </button>
                    </div>
                    <button type="button" class="modal-close btn-flat" style="padding:0 8px; color:#888;"><i class="material-icons">close</i></button>
                </div>

                <!-- ======================================================== -->
                <!-- SECCIÓN 1: MIGRACIÓN CUATRIMESTRAL (EXISTENTE)           -->
                <!-- ======================================================== -->
                <div id="panel-modo-cuatrimestre" style="display:block;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h6 style="color: #4a148c; font-weight: 700; margin: 0; display:flex; align-items:center; gap: 8px;">
                            <i class="material-icons">sync_alt</i>Migración Masiva Cuatrimestral
                        </h6>
                        <label style="display:flex; align-items:center; cursor:pointer; background: #f3e5f5; padding: 4px 10px; border-radius: 20px;">
                            <span style="font-size:0.8rem; color: #4a148c; font-weight: 600; margin-right: 6px;">Modo Simulación</span>
                            <input type="checkbox" id="migracion-dryrun" class="filled-in" />
                            <span></span>
                        </label>
                    </div>

                    <div id="regular-controls" class="migration-panel" style="margin-bottom: 12px; background: #fafafa; padding: 10px 8px 0 8px; border-radius: 8px; border: 1px solid #eeeeee;">
                        <div class="row" style="margin-bottom: 0;">
                            <div class="input-field col s6" style="margin-top: 0;">
                                <select id="migracion-grado">
                                    <option value="" disabled selected>Seleccione</option>
                                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                    <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                                </select>
                                <label>Grado (Obligatorio)</label>
                            </div>
                            <div class="input-field col s6" style="margin-top: 0;">
                                <select id="migracion-seccion">
                                    <option value="" selected>Todas las secciones</option>
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                                    <option value="D">D</option><option value="E">E</option><option value="F">F</option>
                                    <option value="G">G</option><option value="H">H</option><option value="I">I</option>
                                    <option value="J">J</option><option value="K">K</option><option value="L">L</option>
                                </select>
                                <label>Sección (Opcional)</label>
                            </div>
                            <div class="input-field col s12" style="margin-top: 0;">
                                <select id="migracion-materia-especial">
                                    <option value="" selected>Sin materia especial</option>
                                </select>
                                <label>Materia especial (Opcional)</label>
                            </div>
                            <div class="col s12"><p style="color: #e65100; font-size: 0.72rem; margin-top: -8px; margin-bottom: 8px;">*Copia alumnos, permisos y protecciones del 1er Cuatrimestre al 2do Cuatrimestre dentro del mismo año lectivo.</p></div>
                        </div>
                    </div>

                    <div id="tracker-container" style="display:none; flex-shrink: 0;">
                        <div style="font-weight: bold; color: #333; font-size: 0.85rem;">Status Tracker</div>
                        <div class="progress-text" id="tracker-text">0% Complete</div>
                        <div class="tracker-container">
                            <div class="tracker-line"></div>
                            <div class="tracker-progress" id="tracker-bar"></div>
                            <div class="tracker-step" id="step-0"><div class="tracker-icon">✓</div><div class="tracker-label">Conectando<br>Origen</div></div>
                            <div class="tracker-step" id="step-1"><div class="tracker-icon">✓</div><div class="tracker-label">Preparando<br>Datos</div></div>
                            <div class="tracker-step" id="step-2"><div class="tracker-icon">✓</div><div class="tracker-label">Sincronizando<br>Permisos</div></div>
                            <div class="tracker-step" id="step-3"><div class="tracker-icon">✓</div><div class="tracker-label">Clonando<br>Candados</div></div>
                            <div class="tracker-step" id="step-4"><div class="tracker-icon">✓</div><div class="tracker-label">Validando<br>Sistema</div></div>
                        </div>
                    </div>

                    <div id="resultados-container" style="display:none; display: flex; flex-direction: column; gap: 10px; margin-top: 3px;">
                        <div style="display:flex; gap:8px; border-bottom:1px solid #ddd; padding-bottom:6px; margin-bottom:0;">
                            <button type="button" class="tab-migracion active" data-tab="consola" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #4a148c; background: #4a148c; color: white; font-weight: 700; font-size: 0.78rem; cursor:pointer; min-width: 120px;">Consola</button>
                            <button type="button" class="tab-migracion" data-tab="detalle" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #d0d0d0; background: #fff; color: #444; font-weight: 700; font-size: 0.78rem; cursor:pointer; min-width: 120px;">Detalle</button>
                        </div>

                        <div id="tech-controls" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top: 6px; padding-bottom: 6px; flex-shrink: 0;">
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button class="filter-btn active" data-filter="all">Ver Todo</button>
                                <button class="filter-btn" data-filter="success">Solo Éxitos</button>
                                <button class="filter-btn" data-filter="warning">Solo Atención</button>
                            </div>
                            <div class="switch" style="transform: scale(0.85); transform-origin: right;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: #555;">
                                    Detalles Técnicos
                                    <input type="checkbox" id="toggle-tech">
                                    <span class="lever"></span>
                                </label>
                            </div>
                        </div>

                        <div id="panel-consola" class="panel-migracion" style="display:block;">
                            <div style="display:flex; flex-direction:column;">
                                <div style="background: #263238; border-radius: 6px 6px 0 0; padding: 6px 10px; display: flex; align-items: center; gap: 6px;">
                                    <i class="material-icons" style="color:white; font-size: 16px;">terminal</i>
                                    <span style="color:white; font-size: 0.8rem; font-weight: 600;">Consola de Diagnóstico</span>
                                </div>
                                <div id="consola-logs" style="background: #f5f5f5; border: 1px solid #cfd8dc; border-top: none; border-radius: 0 0 6px 6px; overflow-y: auto; padding: 8px; max-height: 220px; min-height: 120px;"></div>
                            </div>
                        </div>

                        <div id="panel-detalle" class="panel-migracion" style="display:none;">
                            <div style="border: 1px solid #e0e0e0; border-radius: 6px; max-height: 220px; overflow-y: auto; background: #fff;">
                                <table class="striped" style="width:100%; border-collapse:collapse; font-size:0.8rem; margin:0;">
                                    <thead style="background: #f5f5f5; position: sticky; top: 0; z-index: 5;">
                                        <tr>
                                            <th style="padding: 6px 10px;">Origen</th>
                                            <th style="padding: 6px 10px;">Destino</th>
                                            <th style="text-align:right; padding: 6px 10px;">Filas</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-auditoria-body">
                                        <tr><td colspan="3" style="text-align:center; color:#888; padding: 15px;">Esperando ejecución...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ======================================================== -->
                <!-- SECCIÓN 2: PASE DE GRADO Y PROMOCIÓN ANUAL               -->
                <!-- ======================================================== -->
                <div id="panel-modo-pase-grado" style="display:none;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                        <div>
                            <h6 style="color: #1565c0; font-weight: 700; margin: 0; display:flex; align-items:center; gap: 8px;">
                                <i class="material-icons">school</i>Promoción, Repitencia y Atraso de Alumnos
                            </h6>
                            <p style="font-size: 0.72rem; color: #64748b; margin: 2px 0 0 0;">
                                Pasa a los promovidos al grado siguiente, retiene a repitentes o atrasa de grado reordenando por Varones y Mujeres.
                            </p>
                        </div>
                    </div>

                    <!-- Filtros de Origen -->
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px 6px 14px; margin-bottom:10px;">
                        <div class="row" style="margin-bottom:0; display:flex; align-items:center; flex-wrap:wrap;">
                            <div class="input-field col s3" style="margin-top:0;">
                                <select id="pase-grado-origen">
                                    <option value="1">1° Grado</option>
                                    <option value="2" selected>2° Grado</option>
                                    <option value="3">3° Grado</option>
                                    <option value="4">4° Grado</option>
                                    <option value="5">5° Grado</option>
                                    <option value="6">6° Grado</option>
                                </select>
                                <label style="font-weight:700;">Grado Actual</label>
                            </div>
                            <div class="input-field col s3" style="margin-top:0;">
                                <select id="pase-seccion-origen">
                                    <option value="A">Sección A</option><option value="B">Sección B</option><option value="C">Sección C</option>
                                    <option value="D">Sección D</option><option value="E">Sección E</option><option value="F">Sección F</option>
                                    <option value="G" selected>Sección G</option><option value="H">Sección H</option><option value="I">Sección I</option>
                                    <option value="J">Sección J</option><option value="K">Sección K</option><option value="L">Sección L</option>
                                </select>
                                <label style="font-weight:700;">División Actual</label>
                            </div>
                            <div class="col s6" style="display:flex; gap:8px; justify-content:flex-end; margin-bottom:8px;">
                                <button id="btn-cargar-alumnos-pase" type="button" class="btn waves-effect waves-light blue darken-3" style="font-size:0.75rem; font-weight:700; height:36px; line-height:36px; border-radius:6px;">
                                    <i class="material-icons left" style="line-height:36px;">search</i>Cargar Alumnos y Notas
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Resumen KPIs y Acciones en Lote -->
                    <div id="pase-kpi-container" style="display:none; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px;">
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <span class="stat-chip total">Total: <b id="stat-total">0</b></span>
                                <span class="stat-chip promovidos">Promovidos: <b id="stat-promovidos">0</b></span>
                                <span class="stat-chip repitentes">Repitentes: <b id="stat-repitentes">0</b></span>
                                <span class="stat-chip coloquio">Coloquio: <b id="stat-coloquio">0</b></span>
                            </div>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <button type="button" id="btn-auto-asignar-pase" class="btn-flat waves-effect" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.72rem; height:28px; line-height:28px; border-radius:4px; padding:0 10px;">
                                    <i class="material-icons left" style="font-size:16px; margin-right:4px; line-height:28px;">auto_awesome</i>Auto-Asignar por Situación
                                </button>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <span style="font-size:0.72rem; font-weight:600; color:#555;">Div. Destino Masiva:</span>
                                    <select id="select-seccion-masiva" style="display:inline-block; width:52px; height:28px; font-size:0.75rem; border:1px solid #cbd5e1; border-radius:4px; padding:0 2px;">
                                        <option value="">--</option>
                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option>
                                        <option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option><option value="K">K</option><option value="L">L</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla de Alumnos con Destinos -->
                    <div id="pase-tabla-wrapper" style="display:none; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#fff; max-height: calc(96vh - 360px); overflow-y:auto;">
                        <table class="tabla-pase striped" style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th style="width:30px; text-align:center;">
                                        <label><input type="checkbox" id="check-todos-pase" checked="checked" class="filled-in" /><span></span></label>
                                    </th>
                                    <th style="width:40px; text-align:center;">Ord.</th>
                                    <th style="width:85px;">DNI</th>
                                    <th>Alumno</th>
                                    <th style="width:50px; text-align:center;">Sexo</th>
                                    <th style="width:65px; text-align:center;">Prom.</th>
                                    <th style="width:130px; text-align:center;">Situación</th>
                                    <th style="width:180px;">Acción Destino</th>
                                    <th style="width:75px; text-align:center;">Div.</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-pase-body">
                                <tr><td colspan="9" style="text-align:center; padding:20px; color:#94a3b8;">Presiona "Cargar Alumnos y Notas" para comenzar.</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Consola / Vista Previa de Simulación -->
                    <div id="pase-consola-container" style="display:none; margin-top:10px;">
                        <div style="background:#1e293b; color:#f8fafc; border-radius:6px 6px 0 0; padding:6px 12px; font-size:0.75rem; font-weight:700; display:flex; justify-content:space-between; align-items:center;">
                            <span><i class="material-icons left" style="font-size:16px;">preview</i>Vista Previa de Nuevas Nóminas Reordenadas</span>
                            <span id="pase-consola-resumen" style="color:#94a3b8; font-size:0.7rem;"></span>
                        </div>
                        <div id="pase-consola-content" style="background:#0f172a; color:#e2e8f0; font-family:monospace; font-size:0.75rem; padding:10px 12px; border-radius:0 0 6px 6px; max-height:180px; overflow-y:auto; line-height:1.4;">
                        </div>
                    </div>
                </div>

                <!-- ======================================================== -->
                <!-- SECCIÓN 3: SINCRONIZACIÓN EN TIEMPO REAL Y KILL-SWITCH   -->
                <!-- ======================================================== -->
                <div id="panel-modo-sync-sheets" style="display:none;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <h6 style="color: #00796b; font-weight: 700; margin: 0; display:flex; align-items:center; gap: 8px;">
                            <i class="material-icons">cloud_sync</i>Sincronización de Notas (Google Sheets ➔ Supabase)
                        </h6>
                        <span id="sync-planilla-actual-badge" style="font-size:0.75rem; font-weight:700; background:#e0f2f1; color:#00695c; padding:4px 10px; border-radius:14px; border:1px solid #b2dfdb;">
                            Planilla actual: Ninguna seleccionada
                        </span>
                    </div>

                    <div style="background:#f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.8rem; color: #166534; line-height: 1.4;">
                        <div style="font-weight: 700; margin-bottom: 2px; display:flex; align-items:center; gap:6px;">
                            <i class="material-icons" style="font-size:17px;">info</i>Actualización Directa de Notas y Alumnos desde Google Sheets
                        </div>
                        Selecciona qué planillas deseas sincronizar desde Google Sheets hacia la base de datos Supabase y presiona <strong>SINCRONIZAR AHORA</strong>. Al finalizar, las notas actualizadas se mostrarán de inmediato en pantalla.
                    </div>

                    <!-- Panel Selector de Alcance de Sincronización -->
                    <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px 14px; margin-bottom:12px;">
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:10px; align-items:end;">
                            <div>
                                <label style="display:block; font-size:0.72rem; font-weight:700; color:#334155; text-transform:uppercase; margin-bottom:4px;">Alcance a Sincronizar</label>
                                <select id="sync-alcance-select" class="browser-default" style="height:34px; font-size:0.82rem; font-weight:600; border:1px solid #94a3b8; border-radius:6px; padding:0 8px; background:#fff; width:100%;">
                                    <option value="todas" selected>🌐 Todos los grados y áreas especiales existentes (Completa)</option>
                                    <option value="todas_2do">📅 Todos los grados y áreas especiales (2° Cuatrimestre)</option>
                                    <option value="todas_1ro">📅 Todos los grados y áreas especiales (1° Cuatrimestre)</option>
                                    <option value="grado">🏫 Filtrar por Grado / División / Cuatrimestre específico</option>
                                    <option value="actual">📌 Solo la planilla abierta actualmente en pantalla</option>
                                </select>
                            </div>
                            <div id="sync-wrap-grado">
                                <label style="display:block; font-size:0.72rem; font-weight:700; color:#334155; text-transform:uppercase; margin-bottom:4px;">Grado</label>
                                <select id="sync-grado-select" class="browser-default" style="height:34px; font-size:0.82rem; font-weight:600; border:1px solid #94a3b8; border-radius:6px; padding:0 8px; background:#fff; width:100%;">
                                    <option value="TODOS">Todos los grados (1° a 6°)</option>
                                    <option value="1">1° Grado</option>
                                    <option value="2">2° Grado</option>
                                    <option value="3">3° Grado</option>
                                    <option value="4">4° Grado</option>
                                    <option value="5">5° Grado</option>
                                    <option value="6" selected>6° Grado</option>
                                </select>
                            </div>
                            <div id="sync-wrap-seccion">
                                <label style="display:block; font-size:0.72rem; font-weight:700; color:#334155; text-transform:uppercase; margin-bottom:4px;">División / Sección</label>
                                <select id="sync-seccion-select" class="browser-default" style="height:34px; font-size:0.82rem; font-weight:600; border:1px solid #94a3b8; border-radius:6px; padding:0 8px; background:#fff; width:100%;">
                                    <option value="TODAS" selected>Todas las divisiones (A - L)</option>
                                    <option value="A">División A</option><option value="B">División B</option><option value="C">División C</option>
                                    <option value="D">División D</option><option value="E">División E</option><option value="F">División F</option>
                                    <option value="G">División G</option><option value="H">División H</option><option value="I">División I</option>
                                    <option value="J">División J</option><option value="K">División K</option><option value="L">División L</option>
                                </select>
                            </div>
                            <div id="sync-wrap-cuatri">
                                <label style="display:block; font-size:0.72rem; font-weight:700; color:#334155; text-transform:uppercase; margin-bottom:4px;">Cuatrimestre</label>
                                <select id="sync-cuatri-select" class="browser-default" style="height:34px; font-size:0.82rem; font-weight:600; border:1px solid #94a3b8; border-radius:6px; padding:0 8px; background:#fff; width:100%;">
                                    <option value="2" selected>2° Cuatrimestre</option>
                                    <option value="1">1° Cuatrimestre</option>
                                    <option value="AMBOS">Ambos Cuatrimestres</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-top:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                            <label style="display:inline-flex; align-items:center; cursor:pointer; color:#1e293b; font-size:0.78rem; font-weight:600;">
                                <input type="checkbox" id="sync-incluir-especiales" class="filled-in" checked="checked" />
                                <span>Incluir y consolidar también planillas de Áreas Especiales (Ed. Física, Música, Plástica, Inglés)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Barra de Progreso en Vivo -->
                    <div id="sync-progress-wrapper" style="display:none; margin-bottom:10px; background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.76rem; font-weight:700; color:#0f766e; margin-bottom:4px;">
                            <span id="sync-progress-label">Sincronizando planillas...</span>
                            <span id="sync-progress-pct">0%</span>
                        </div>
                        <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                            <div id="sync-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #0d9488, #10b981); transition:width 0.25s ease;"></div>
                        </div>
                    </div>

                    <!-- Tarjetas de Estado -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin-bottom: 12px;">
                        <div style="background:#fff; border: 1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:0.68rem; font-weight:700; color:#64748b; text-transform:uppercase;">Estado Sincronizador</div>
                            <div id="sync-ui-status" style="font-size:0.9rem; font-weight:800; color:#15803d; margin-top:3px;">🟢 ACTIVO (Tiempo Real)</div>
                        </div>
                        <div style="background:#fff; border: 1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:0.68rem; font-weight:700; color:#64748b; text-transform:uppercase;">Última Sincronización</div>
                            <div id="sync-ui-last-time" style="font-size:0.82rem; font-weight:700; color:#0f172a; margin-top:3px;">Consultando...</div>
                        </div>
                        <div style="background:#fff; border: 1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:0.68rem; font-weight:700; color:#64748b; text-transform:uppercase;">Planillas Sincronizadas</div>
                            <div id="sync-ui-count" style="font-size:1.05rem; font-weight:800; color:#0369a1; margin-top:3px;">0</div>
                        </div>
                    </div>

                    <!-- Consola de Ejecución en Vivo -->
                    <div style="background:#1e293b; color:#f8fafc; border-radius:6px 6px 0 0; padding:6px 12px; font-size:0.75rem; font-weight:700; display:flex; justify-content:space-between; align-items:center;">
                        <span><i class="material-icons left" style="font-size:16px;">terminal</i>Consola de Sincronización</span>
                        <span id="sync-consola-resumen" style="color:#94a3b8; font-size:0.7rem;">Listo</span>
                    </div>
                    <div id="sync-consola-content" style="background:#0f172a; color:#e2e8f0; font-family:monospace; font-size:0.75rem; padding:10px 12px; border-radius:0 0 6px 6px; max-height:165px; overflow-y:auto; line-height:1.45; white-space:pre-wrap;">> Sistema sincronizador listo. Selecciona el alcance y presiona "SINCRONIZAR AHORA".</div>
                </div>
            </div>
            
<!-- Modal Footer con botones contextuados -->
            <div class="modal-footer" style="border-top: 1px solid #e0e0e0; padding: 10px 22px; flex-shrink: 0; background: #fff; display:flex; justify-content:space-between; align-items:center;">
                <!-- Footer para Cuatrimestre -->
                <div id="footer-cuatrimestre" style="width:100%;">
                    <button id="btn-ejecutar-migracion" class="waves-effect waves-light btn purple darken-4" style="width: 100%; font-weight: bold; letter-spacing: 0.5px; height: 38px; line-height: 38px;">
                        <i class="material-icons left">flash_on</i>EJECUTAR MIGRACIÓN CUATRIMESTRAL
                    </button>
                </div>

                <!-- Footer para Pase de Grado -->
                <div id="footer-pase-grado" style="display:none; width:100%; display:none; justify-content:flex-end; gap:10px;">
                    <button id="btn-simular-pase" type="button" class="btn waves-effect waves-light blue-grey darken-3" style="font-weight:700; font-size:0.78rem; height:38px; line-height:38px; border-radius:6px;">
                        <i class="material-icons left">science</i>Simular Pase (Dry-Run)
                    </button>
                    <button id="btn-ejecutar-pase" type="button" class="btn waves-effect waves-light green darken-3" style="font-weight:700; font-size:0.78rem; height:38px; line-height:38px; border-radius:6px;">
                        <i class="material-icons left">send</i>APLICAR PASE DE GRADO DEFINITIVO
                    </button>
                </div>
                <!-- Footer para Sincronización -->
                <div id="footer-sync-sheets" style="display:none; width:100%; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <button id="btn-kill-switch-sync" type="button" class="btn waves-effect waves-light red darken-3" style="font-weight:700; font-size:0.75rem; height:36px; line-height:36px; border-radius:6px;">
                        <i class="material-icons left">cancel</i>🛑 PASE A PRODUCCIÓN (KILL-SWITCH)
                    </button>
                    <button id="btn-sync-ahora-manual" type="button" class="btn waves-effect waves-light teal darken-2" style="font-weight:700; font-size:0.75rem; height:36px; line-height:36px; border-radius:6px;">
                        <i class="material-icons left">sync</i>SINCRONIZAR AHORA
                    </button>
                </div>

            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modalEl = document.getElementById('modal-migracion');
    const isMobile = window.innerWidth <= 768;
    modalEl.style.height = isMobile ? '88vh' : '96vh';
    modalEl.style.maxHeight = isMobile ? '88vh' : '96vh';
    modalEl.style.width = '95%';
    const instance = M.Modal.init(modalEl);
    try { M.FormSelect.init(modalEl.querySelectorAll('select')); } catch (e) {}

    // ================================================================
    // CONTROL DE PESTAÑAS PRINCIPALES (CUATRIMESTRE VS PASE DE GRADO VS SYNC)
    // ================================================================
    function actualizarSelectoresAlcanceSync() {
        const selectAlcance = document.getElementById('sync-alcance-select');
        const wrapGrado = document.getElementById('sync-wrap-grado');
        const wrapSeccion = document.getElementById('sync-wrap-seccion');
        const wrapCuatri = document.getElementById('sync-wrap-cuatri');
        if (!selectAlcance) return;
        const val = selectAlcance.value;
        const mostrarFiltros = (val === 'grado');
        if (wrapGrado) wrapGrado.style.display = mostrarFiltros ? 'block' : 'none';
        if (wrapSeccion) wrapSeccion.style.display = mostrarFiltros ? 'block' : 'none';
        if (wrapCuatri) wrapCuatri.style.display = mostrarFiltros ? 'block' : 'none';
    }

    function sincronizarContextoPlanillaAbiertaEnUI() {
        const badgeActual = document.getElementById('sync-planilla-actual-badge');
        const selectAlcance = document.getElementById('sync-alcance-select');
        const selectGrado = document.getElementById('sync-grado-select');
        const selectSeccion = document.getElementById('sync-seccion-select');
        const selectCuatri = document.getElementById('sync-cuatri-select');

        const inputPlanilla = document.getElementById('select-planilla');
        const nombreActual = String(window.currentPlanillaNombre || (inputPlanilla && inputPlanilla.value) || '').trim();

        if (badgeActual) {
            if (nombreActual) {
                badgeActual.textContent = `Planilla abierta: ${nombreActual}`;
                badgeActual.style.background = '#dcfce7';
                badgeActual.style.color = '#166534';
                badgeActual.style.borderColor = '#bbf7d0';
            } else {
                badgeActual.textContent = 'Planilla actual: Ninguna seleccionada';
                badgeActual.style.background = '#f1f5f9';
                badgeActual.style.color = '#475569';
                badgeActual.style.borderColor = '#cbd5e1';
            }
        }

        if (nombreActual) {
            const norm = nombreActual.toUpperCase();
            const es2do = /2\s*(?:º|°|DO)?\s*CUAT|SEGUNDO\s*CUAT/i.test(norm);
            const sinCuat = norm.replace(/[12]\s*(?:RO|DO|ER|TO|º|°)?\s*CUATRIMESTRE/gi, '');
            const mGrado = sinCuat.match(/\b([1-6])\s*(?:RO|DO|TO|ER|MO|º|°)?\b/i);
            const sinEsp = sinCuat.replace(/\bESP\b/gi, '').trim();
            const mSec = sinEsp.match(/(?:^|\s)([A-L])(?:\s|$)/i);

            if (selectGrado && mGrado) selectGrado.value = mGrado[1];
            if (selectSeccion && mSec) selectSeccion.value = mSec[1].toUpperCase();
            if (selectCuatri) selectCuatri.value = es2do ? '2' : '1';
        } else if (selectAlcance && selectAlcance.value === 'actual') {
            selectAlcance.value = 'todas';
        }
        actualizarSelectoresAlcanceSync();
    }

    const selectAlcanceInit = document.getElementById('sync-alcance-select');
    if (selectAlcanceInit) {
        selectAlcanceInit.addEventListener('change', () => {
            selectAlcanceInit.dataset.userChanged = '1';
            actualizarSelectoresAlcanceSync();
        });
    }

    function cambiarModoMigracionPrincipal(modo) {
        const tabCuatri = document.getElementById('tab-btn-cuatrimestre');
        const tabPase = document.getElementById('tab-btn-pase-grado');
        const tabSync = document.getElementById('tab-btn-sync-sheets');
        const panelCuatri = document.getElementById('panel-modo-cuatrimestre');
        const panelPase = document.getElementById('panel-modo-pase-grado');
        const panelSync = document.getElementById('panel-modo-sync-sheets');
        const footerCuatri = document.getElementById('footer-cuatrimestre');
        const footerPase = document.getElementById('footer-pase-grado');
        const footerSync = document.getElementById('footer-sync-sheets');

        if (modo === 'sync-sheets') {
            if (tabCuatri) tabCuatri.classList.remove('active');
            if (tabPase) tabPase.classList.remove('active');
            if (tabSync) tabSync.classList.add('active');
            if (panelCuatri) panelCuatri.style.display = 'none';
            if (panelPase) panelPase.style.display = 'none';
            if (panelSync) panelSync.style.display = 'block';
            if (footerCuatri) footerCuatri.style.display = 'none';
            if (footerPase) footerPase.style.display = 'none';
            if (footerSync) footerSync.style.display = 'flex';
            sincronizarContextoPlanillaAbiertaEnUI();
            actualizarEstadoSyncUI();
        } else if (modo === 'pase-grado') {
            if (tabCuatri) tabCuatri.classList.remove('active');
            if (tabSync) tabSync.classList.remove('active');
            if (tabPase) tabPase.classList.add('active');
            if (panelCuatri) panelCuatri.style.display = 'none';
            if (panelSync) panelSync.style.display = 'none';
            if (panelPase) panelPase.style.display = 'block';
            if (footerCuatri) footerCuatri.style.display = 'none';
            if (footerSync) footerSync.style.display = 'none';
            if (footerPase) footerPase.style.display = 'flex';
        } else {
            if (tabPase) tabPase.classList.remove('active');
            if (tabSync) tabSync.classList.remove('active');
            if (tabCuatri) tabCuatri.classList.add('active');
            if (panelPase) panelPase.style.display = 'none';
            if (panelSync) panelSync.style.display = 'none';
            if (panelCuatri) panelCuatri.style.display = 'block';
            if (footerPase) footerPase.style.display = 'none';
            if (footerSync) footerSync.style.display = 'none';
            if (footerCuatri) footerCuatri.style.display = 'block';
        }
    }
    window.cambiarModoMigracionPrincipal = cambiarModoMigracionPrincipal;

    document.getElementById('tab-btn-cuatrimestre').addEventListener('click', () => cambiarModoMigracionPrincipal('cuatrimestre'));
    document.getElementById('tab-btn-pase-grado').addEventListener('click', () => cambiarModoMigracionPrincipal('pase-grado'));

    // Activar modo inicial solicitado
    cambiarModoMigracionPrincipal(modoInicial);

    // ================================================================
    // LÓGICA DE PASE DE GRADO Y PROMOCIÓN ANUAL
    // ================================================================
    let listaAlumnosPaseActual = [];
    let gradoPaseOrigen = '';
    let seccionPaseOrigen = '';

    const btnCargarPase = document.getElementById('btn-cargar-alumnos-pase');
    const tablaPaseBody = document.getElementById('tabla-pase-body');
    const kpiContainer = document.getElementById('pase-kpi-container');
    const tablaWrapper = document.getElementById('pase-tabla-wrapper');
    const consolaPaseContainer = document.getElementById('pase-consola-container');
    const consolaPaseContent = document.getElementById('pase-consola-content');
    const btnAutoAsignar = document.getElementById('btn-auto-asignar-pase');
    const selectSeccionMasiva = document.getElementById('select-seccion-masiva');
    const checkTodosPase = document.getElementById('check-todos-pase');
    const btnSimularPase = document.getElementById('btn-simular-pase');
    const btnEjecutarPase = document.getElementById('btn-ejecutar-pase');

    async function cargarAlumnosParaPase() {
        const gradoEl = document.getElementById('pase-grado-origen');
        const seccionEl = document.getElementById('pase-seccion-origen');
        gradoPaseOrigen = String(gradoEl?.value || '2').trim();
        seccionPaseOrigen = String(seccionEl?.value || 'G').trim().toUpperCase();

        btnCargarPase.disabled = true;
        btnCargarPase.innerHTML = '<i class="material-icons left">loop</i>Cargando...';
        tablaPaseBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:25px; color:#64748b;"><i class="material-icons" style="animation:spin 1s infinite linear; vertical-align:middle; margin-right:6px;">sync</i>Consultando base de datos y boletines de ' + gradoPaseOrigen + '° "' + seccionPaseOrigen + '"...</td></tr>';
        kpiContainer.style.display = 'none';
        tablaWrapper.style.display = 'block';
        consolaPaseContainer.style.display = 'none';

        try {
            let datos = null;
            if (typeof window.obtenerDatosCompletosBoletines === 'function') {
                try {
                    // Intenta primero 2do cuatrimestre, si no 1er cuatrimestre
                    datos = await window.obtenerDatosCompletosBoletines(gradoPaseOrigen, seccionPaseOrigen, true);
                } catch (e2) {
                    datos = await window.obtenerDatosCompletosBoletines(gradoPaseOrigen, seccionPaseOrigen, false);
                }
            }

            // Si no estuvo disponible o falló, consultar directamente por Supabase REST
            if (!datos || !datos.alumnos || datos.alumnos.length === 0) {
                datos = await cargarAlumnosDirectoDesdeSupabase(gradoPaseOrigen, seccionPaseOrigen);
            }

            listaAlumnosPaseActual = (datos && Array.isArray(datos.alumnos)) ? datos.alumnos : [];

            if (listaAlumnosPaseActual.length === 0) {
                tablaPaseBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:25px; color:#b91c1c;">No se encontraron alumnos matriculados en ' + gradoPaseOrigen + '° "' + seccionPaseOrigen + '".</td></tr>';
                btnCargarPase.disabled = false;
                btnCargarPase.innerHTML = '<i class="material-icons left">search</i>Cargar Alumnos y Notas';
                return;
            }

            renderTablaPase();
            actualizarEstadisticasPase();
            kpiContainer.style.display = 'block';
            M.toast({ html: '✅ Se cargaron ' + listaAlumnosPaseActual.length + ' alumnos de ' + gradoPaseOrigen + '° "' + seccionPaseOrigen + '".', classes: 'green darken-2' });

        } catch (err) {
            console.error('[PaseDeGrado] Error cargando alumnos:', err);
            tablaPaseBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:25px; color:#b91c1c;">Error: ' + escapeHtml(err.message) + '</td></tr>';
            M.toast({ html: '❌ Error al cargar: ' + err.message, classes: 'red darken-3' });
        } finally {
            btnCargarPase.disabled = false;
            btnCargarPase.innerHTML = '<i class="material-icons left">search</i>Cargar Alumnos y Notas';
        }
    }

    async function cargarAlumnosDirectoDesdeSupabase(grado, seccion) {
        const client = window.supabaseClient;
        if (!client) throw new Error('Cliente de Supabase no disponible.');

        const sufijos = { '1': '1RO', '2': '2DO', '3': '3RO', '4': '4TO', '5': '5TO', '6': '6TO' };
        const suf = sufijos[grado] || (grado + '°');
        const nombreBuscado = 'PLANILLAS ' + suf + ' ' + seccion;

        const { data: planillas, error: pErr } = await client
            .from('planillas')
            .select('id, nombre');

        if (pErr || !planillas || planillas.length === 0) {
            throw new Error('No se encontraron planillas en la base de datos: ' + (pErr?.message || 'Error'));
        }

        const resolver = (typeof window.resolverPlanillaSupabaseParaBoletin === 'function')
            ? window.resolverPlanillaSupabaseParaBoletin
            : (plList, g, s, es2) => {
                const reg = new RegExp('\\b(' + g + '(?:RO|DO|TO|ER|MO|°)?)\\s+' + s + '\\b', 'i');
                return plList.filter(p => !/ESP/i.test(p.nombre)).find(p => reg.test(p.nombre) && (es2 ? /CUAT/i.test(p.nombre) : !/CUAT/i.test(p.nombre)));
            };

        const planillaRegular = resolver(planillas, grado, seccion, true) || resolver(planillas, grado, seccion, false);

        if (!planillaRegular) {
            throw new Error('No se encontró la planilla regular para ' + grado + '° ' + seccion);
        }

        const planillaId = planillaRegular.id;
        const { data: matriculas, error: mErr } = await client
            .from('alumno_planillas')
            .select('numero_orden, activo, alumnos(dni, apellido, nombre, sexo)')
            .eq('planilla_id', planillaId)
            .eq('activo', true)
            .order('numero_orden', { ascending: true });

        if (mErr) throw mErr;

        const alumnosFormateados = (matriculas || []).map(m => {
            const al = m.alumnos || {};
            const dni = String(al.dni || '').trim();
            const apellido = String(al.apellido || '').trim();
            const nombre = String(al.nombre || '').trim();
            return {
                dni: dni,
                orden: m.numero_orden,
                apellido: apellido,
                nombre: nombre,
                nombreCompleto: (apellido && nombre) ? apellido + ', ' + nombre : (apellido || nombre || dni),
                sexo: al.sexo || '',
                proAnual: '0.00',
                situacionFinal: 'PROMOVIDO/A AL GRADO INMEDIATO SUPERIOR'
            };
        });

        return { grado, seccion, alumnos: alumnosFormateados };
    }

    function renderTablaPase() {
        tablaPaseBody.innerHTML = '';
        const gradoNum = parseInt(gradoPaseOrigen, 10);
        const gradoSig = gradoNum < 6 ? (gradoNum + 1) : 6;
        const gradoAnt = gradoNum > 1 ? (gradoNum - 1) : 1;

        listaAlumnosPaseActual.forEach((al, index) => {
            const dni = String(al.dni || '').trim();
            const orden = al.orden || (index + 1);
            const nombreCompleto = al.nombreCompleto || (al.apellido + ', ' + al.nombre);
            const sexo = String(al.sexo || '').toUpperCase();
            const pesoSexo = obtenerPesoSexoPase(sexo);
            const iconoSexo = pesoSexo === 1 ? '👦' : (pesoSexo === 2 ? '👧' : '👤');
            const colorSexo = pesoSexo === 1 ? '#0284c7' : (pesoSexo === 2 ? '#db2777' : '#64748b');

            const sit = normalizarTextoPase(al.situacionFinal || '');
            let claseBadge = 'badge-promovido';
            let textoBadge = 'PROMOVIDO';
            let accionDefault = 'PROMOVER';

            if (sit.includes('COLOQUIO') || sit.includes('COMPENSATORIA') || sit.includes('PENDIENTE')) {
                claseBadge = 'badge-coloquio';
                textoBadge = 'COLOQUIO';
                accionDefault = 'REPETIR';
            } else if (sit.includes('NO PROMOVIDO') || sit.includes('REPITE')) {
                claseBadge = 'badge-repite';
                textoBadge = 'REPETIR';
                accionDefault = 'REPETIR';
            } else {
                claseBadge = 'badge-promovido';
                textoBadge = 'PROMOVIDO';
                accionDefault = gradoNum === 6 ? 'EGRESADO' : 'PROMOVER';
            }

            const tr = document.createElement('tr');
            tr.dataset.dni = dni;
            tr.innerHTML = `
                <td style="text-align:center;">
                    <label><input type="checkbox" class="check-alumno-pase filled-in" data-dni="${dni}" checked="checked" /><span></span></label>
                </td>
                <td style="text-align:center; font-weight:700; color:#64748b;">${orden}</td>
                <td style="font-family:monospace; font-size:0.75rem; color:#334155;">${dni}</td>
                <td>
                    <div style="font-weight:600; color:#1e293b;">${escapeHtml(nombreCompleto)}</div>
                </td>
                <td style="text-align:center;">
                    <span style="font-size:0.75rem; font-weight:700; color:${colorSexo};">${iconoSexo} ${sexo || '-'}</span>
                </td>
                <td style="text-align:center; font-weight:700; color:#0f172a;">${al.proAnual || '-'}</td>
                <td style="text-align:center;">
                    <span class="badge-situacion ${claseBadge}">${textoBadge}</span>
                </td>
                <td>
                    <select class="select-accion-pase" data-dni="${dni}">
                        ${gradoNum < 6 ? `<option value="PROMOVER" ${accionDefault === 'PROMOVER' ? 'selected' : ''}>🟢 Pasar a ${gradoSig}°</option>` : ''}
                        <option value="REPETIR" ${accionDefault === 'REPETIR' ? 'selected' : ''}>🔴 Repetir en ${gradoNum}°</option>
                        ${gradoNum > 1 ? `<option value="ATRASAR" ${accionDefault === 'ATRASAR' ? 'selected' : ''}>🟠 Atrasar a ${gradoAnt}°</option>` : ''}
                        ${gradoNum === 6 ? `<option value="EGRESADO" ${accionDefault === 'EGRESADO' ? 'selected' : ''}>🎓 Egresado (Fin Primaria)</option>` : ''}
                        <option value="BAJA">⚪ Baja / Traslado</option>
                    </select>
                </td>
                <td style="text-align:center;">
                    <select class="select-seccion-pase" data-dni="${dni}">
                        ${['A','B','C','D','E','F','G','H','I','J','K','L'].map(sec => `
                            <option value="${sec}" ${sec === seccionPaseOrigen ? 'selected' : ''}>${sec}</option>
                        `).join('')}
                    </select>
                </td>
            `;
            tablaPaseBody.appendChild(tr);
        });

        // Eventos en selectores para recalcular KPIs si cambia
        document.querySelectorAll('.select-accion-pase').forEach(sel => {
            sel.addEventListener('change', actualizarEstadisticasPase);
        });
    }

    function actualizarEstadisticasPase() {
        const rows = document.querySelectorAll('#tabla-pase-body tr[data-dni]');
        let total = rows.length;
        let prom = 0;
        let rep = 0;
        let col = 0;

        rows.forEach(tr => {
            const selAccion = tr.querySelector('.select-accion-pase');
            const accion = selAccion ? selAccion.value : '';
            if (accion === 'PROMOVER' || accion === 'EGRESADO') prom++;
            else if (accion === 'REPETIR' || accion === 'ATRASAR') rep++;
            else col++;
        });

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-promovidos').innerText = prom;
        document.getElementById('stat-repitentes').innerText = rep;
        document.getElementById('stat-coloquio').innerText = col;
    }

    // Auto-asignar masivo por situación
    btnAutoAsignar.addEventListener('click', () => {
        const gradoNum = parseInt(gradoPaseOrigen, 10);
        listaAlumnosPaseActual.forEach(al => {
            const dni = String(al.dni || '').trim();
            const tr = document.querySelector(`#tabla-pase-body tr[data-dni="${dni}"]`);
            if (!tr) return;

            const selAccion = tr.querySelector('.select-accion-pase');
            const sit = normalizarTextoPase(al.situacionFinal || '');
            if (sit.includes('NO PROMOVIDO') || sit.includes('REPITE') || sit.includes('COLOQUIO') || sit.includes('COMPENSATORIA')) {
                if (selAccion) selAccion.value = 'REPETIR';
            } else {
                if (selAccion) selAccion.value = gradoNum === 6 ? 'EGRESADO' : 'PROMOVER';
            }
        });
        actualizarEstadisticasPase();
        M.toast({ html: '⚡ Se aplicó la auto-asignación por situación académica.', classes: 'blue darken-2' });
    });

    // Cambiar división masiva
    selectSeccionMasiva.addEventListener('change', (e) => {
        const nuevaSec = e.target.value;
        if (!nuevaSec) return;
        document.querySelectorAll('#tabla-pase-body tr[data-dni]').forEach(tr => {
            const chk = tr.querySelector('.check-alumno-pase');
            if (chk && chk.checked) {
                const selSec = tr.querySelector('.select-seccion-pase');
                if (selSec) selSec.value = nuevaSec;
            }
        });
        M.toast({ html: 'División destino cambiada a "' + nuevaSec + '" para alumnos seleccionados.', classes: 'blue darken-2' });
    });

    // Checkbox maestro
    checkTodosPase.addEventListener('change', (e) => {
        const checked = e.target.checked;
        document.querySelectorAll('.check-alumno-pase').forEach(chk => { chk.checked = checked; });
    });

    btnCargarPase.addEventListener('click', cargarAlumnosParaPase);

    // ================================================================
    // OBTENCIÓN Y AGRUPACIÓN DE CANDIDATOS
    // ================================================================
    function recopilarCandidatosPase() {
        const gradoNum = parseInt(gradoPaseOrigen, 10);
        const candidatos = [];

        document.querySelectorAll('#tabla-pase-body tr[data-dni]').forEach(tr => {
            const chk = tr.querySelector('.check-alumno-pase');
            if (!chk || !chk.checked) return;

            const dni = tr.dataset.dni;
            const al = listaAlumnosPaseActual.find(a => String(a.dni || '').trim() === dni) || {};
            const accion = tr.querySelector('.select-accion-pase')?.value || 'PROMOVER';
            const seccionDestino = tr.querySelector('.select-seccion-pase')?.value || seccionPaseOrigen;

            let targetGrado = gradoNum;
            if (accion === 'PROMOVER') targetGrado = Math.min(6, gradoNum + 1);
            else if (accion === 'ATRASAR') targetGrado = Math.max(1, gradoNum - 1);
            else if (accion === 'REPETIR') targetGrado = gradoNum;

            candidatos.push({
                dni: dni,
                apellido: al.apellido || '',
                nombre: al.nombre || '',
                sexo: al.sexo || '',
                accion: accion,
                targetGrado: targetGrado,
                targetSeccion: seccionDestino,
                origenGrado: gradoNum,
                origenSeccion: seccionPaseOrigen
            });
        });

        return candidatos;
    }

    // ================================================================
    // SIMULACIÓN (DRY-RUN) DE PASE DE GRADO
    // ================================================================
    btnSimularPase.addEventListener('click', async () => {
        const candidatos = recopilarCandidatosPase();
        if (candidatos.length === 0) {
            M.toast({ html: '⚠️ No hay alumnos seleccionados para simular.', classes: 'orange darken-3' });
            return;
        }

        consolaPaseContainer.style.display = 'block';
        consolaPaseContent.innerHTML = '🧪 Iniciando simulación de ordenamiento por Varones y Mujeres...\n';

        // Agrupar por curso destino
        const gruposDestino = {};
        candidatos.forEach(c => {
            if (c.accion === 'EGRESADO' || c.accion === 'BAJA') {
                const key = c.accion;
                if (!gruposDestino[key]) gruposDestino[key] = [];
                gruposDestino[key].push(c);
            } else {
                const key = c.targetGrado + '° "' + c.targetSeccion + '"';
                if (!gruposDestino[key]) gruposDestino[key] = [];
                gruposDestino[key].push(c);
            }
        });

        let output = '';
        Object.keys(gruposDestino).sort().forEach(curso => {
            const lista = gruposDestino[curso];
            output += `\n=======================================================\n`;
            output += `📚 CURSO DESTINO: ${curso} (Total en lote: ${lista.length} alumnos)\n`;
            output += `=======================================================\n`;

            if (curso === 'EGRESADO' || curso === 'BAJA') {
                lista.forEach((al, idx) => {
                    output += `  [${al.accion}] ${al.dni} - ${al.apellido}, ${al.nombre}\n`;
                });
            } else {
                // Reordenar conforme a reglamento institucional
                lista.sort(compararAlumnosParaNuevoOrden);
                lista.forEach((al, idx) => {
                    const peso = obtenerPesoSexoPase(al.sexo);
                    const tagSexo = peso === 1 ? '[V]' : (peso === 2 ? '[M]' : '[?]');
                    output += `  ${idx + 1}. ${tagSexo} ${al.apellido}, ${al.nombre} (DNI: ${al.dni}) <- [${al.accion} desde ${al.origenGrado}° "${al.origenSeccion}"]\n`;
                });
            }
        });

        output += `\n✔ Simulación completada sin errores. Ningún dato fue modificado en la base de datos.\n`;
        consolaPaseContent.innerText = output;
        document.getElementById('pase-consola-resumen').innerText = candidatos.length + ' alumnos analizados en ' + Object.keys(gruposDestino).length + ' destino(s)';
        M.toast({ html: '🧪 Simulación completada. Revisa la vista previa de nóminas.', classes: 'blue-grey darken-3' });
    });

    // ================================================================
    // EJECUCIÓN DEFINITIVA DE PASE DE GRADO EN SUPABASE
    // ================================================================
    btnEjecutarPase.addEventListener('click', async () => {
        const candidatos = recopilarCandidatosPase();
        if (candidatos.length === 0) {
            M.toast({ html: '⚠️ No hay alumnos seleccionados.', classes: 'orange darken-3' });
            return;
        }

        const promCount = candidatos.filter(c => c.accion === 'PROMOVER').length;
        const repCount = candidatos.filter(c => c.accion === 'REPETIR').length;
        const atraCount = candidatos.filter(c => c.accion === 'ATRASAR').length;
        const egreCount = candidatos.filter(c => c.accion === 'EGRESADO').length;
        const bajaCount = candidatos.filter(c => c.accion === 'BAJA').length;

        const confirmMsg = `¿Confirmas el pase de grado definitivo para ${candidatos.length} alumno(s)?\n\n` +
            `• Promovidos a grado superior: ${promCount}\n` +
            `• Repitentes en el mismo grado: ${repCount}\n` +
            `• Atrasados a grado menor: ${atraCount}\n` +
            `• Egresados: ${egreCount}\n` +
            `• Bajas: ${bajaCount}\n\n` +
            `El sistema actualizará las matrículas en Supabase y reordenará las listas definitivas (Varones primero, Mujeres después).`;

        if (!window.confirm(confirmMsg)) return;

        btnEjecutarPase.disabled = true;
        btnSimularPase.disabled = true;
        btnEjecutarPase.innerHTML = '<i class="material-icons left">loop</i>APLICANDO PASE...';
        consolaPaseContainer.style.display = 'block';
        consolaPaseContent.innerHTML = '🚀 Iniciando actualización masiva de matrículas en Supabase...\n';

        try {
            const client = window.supabaseClient;
            if (!client) throw new Error('Cliente de Supabase no disponible.');

            // 1. Obtener todas las planillas de Supabase
            const { data: todasPlanillas, error: errPlan } = await client
                .from('planillas')
                .select('id, nombre');

            if (errPlan || !todasPlanillas) throw new Error('Error consultando planillas: ' + errPlan?.message);

            const resolverPlanillasCurso = (grado, seccion) => {
                const sufijos = { '1': '1RO', '2': '2DO', '3': '3RO', '4': '4TO', '5': '5TO', '6': '6TO' };
                const suf = sufijos[String(grado)] || (grado + '°');
                const reg = new RegExp('\\b(' + grado + '(?:RO|DO|TO|ER|MO|°)?|' + suf + ')\\s+' + seccion + '\\b', 'i');
                return todasPlanillas.filter(p => reg.test(p.nombre));
            };

            // Planillas del curso origen
            const planillasOrigen = resolverPlanillasCurso(gradoPaseOrigen, seccionPaseOrigen);
            const idsPlanillasOrigen = planillasOrigen.map(p => p.id);

            consolaPaseContent.innerHTML += `✔ Planillas de origen identificadas: ${planillasOrigen.length} hojas.\n`;

            // 2. Procesar cada alumno
            const cursosDestinoAfectados = new Set();

            for (const cand of candidatos) {
                // A. Desactivar en origen
                if (idsPlanillasOrigen.length > 0) {
                    await client
                        .from('alumno_planillas')
                        .update({ activo: false })
                        .in('planilla_id', idsPlanillasOrigen)
                        .eq('alumno_dni', cand.dni);
                }

                // B. Si es egresado o baja, desactivar en alumnos también
                if (cand.accion === 'EGRESADO' || cand.accion === 'BAJA') {
                    await client
                        .from('alumnos')
                        .update({ activo: false })
                        .eq('dni', cand.dni);
                    consolaPaseContent.innerHTML += `✔ Alumno ${cand.dni} (${cand.apellido}) registrado como ${cand.accion}.\n`;
                    continue;
                }

                // C. Si es PROMOVER, REPETIR o ATRASAR:
                const planillasDestino = resolverPlanillasCurso(cand.targetGrado, cand.targetSeccion);
                if (planillasDestino.length === 0) {
                    consolaPaseContent.innerHTML += `⚠️ Aviso: No se hallaron planillas para destino ${cand.targetGrado}° "${cand.targetSeccion}".\n`;
                    continue;
                }

                // Matricular en todas las planillas del curso destino (regular y materias especiales)
                for (const pDest of planillasDestino) {
                    await client
                        .from('alumno_planillas')
                        .upsert({
                            planilla_id: pDest.id,
                            alumno_dni: cand.dni,
                            activo: true,
                            oculto: false
                        }, { onConflict: 'planilla_id,alumno_dni' });
                }

                // Asegurar que el alumno esté activo
                await client
                    .from('alumnos')
                    .update({ activo: true, oculto: false })
                    .eq('dni', cand.dni);

                cursosDestinoAfectados.add(cand.targetGrado + '|' + cand.targetSeccion);
                consolaPaseContent.innerHTML += `✔ ${cand.dni} (${cand.apellido}) -> ${cand.accion} a ${cand.targetGrado}° "${cand.targetSeccion}" (${planillasDestino.length} planillas).\n`;
            }

            // 3. Reordenar y reasignar numero_orden reglamentario en todos los cursos destino afectados
            consolaPaseContent.innerHTML += `\n=======================================================\n`;
            consolaPaseContent.innerHTML += `⚖️ Reordenando nóminas destino (Varones A-Z primero, Mujeres A-Z después)...\n`;
            consolaPaseContent.innerHTML += `=======================================================\n`;

            for (const cursoKey of cursosDestinoAfectados) {
                const [cGrado, cSeccion] = cursoKey.split('|');
                const planillasCurso = resolverPlanillasCurso(cGrado, cSeccion);
                const regCurso = planillasCurso.find(p => !p.nombre.includes('ESP') && !p.nombre.includes('2 CUATRIMESTRE')) || planillasCurso[0];

                if (!regCurso) continue;

                // Obtener todos los alumnos activos del curso destino
                const { data: matriculasDest, error: errDestMat } = await client
                    .from('alumno_planillas')
                    .select('alumno_dni, alumnos(dni, apellido, nombre, sexo)')
                    .eq('planilla_id', regCurso.id)
                    .eq('activo', true);

                if (errDestMat || !matriculasDest) continue;

                const listaAlumnosDestino = matriculasDest.map(m => ({
                    dni: m.alumno_dni,
                    apellido: m.alumnos?.apellido || '',
                    nombre: m.alumnos?.nombre || '',
                    sexo: m.alumnos?.sexo || ''
                }));

                // Ordenamiento institucional
                listaAlumnosDestino.sort(compararAlumnosParaNuevoOrden);

                // Asignar y persistir nuevos números de orden secuenciales
                const idsTodasPlanillasCurso = planillasCurso.map(p => p.id);
                for (let i = 0; i < listaAlumnosDestino.length; i++) {
                    const nuevoOrden = i + 1;
                    const alDest = listaAlumnosDestino[i];

                    await client
                        .from('alumno_planillas')
                        .update({ numero_orden: nuevoOrden })
                        .in('planilla_id', idsTodasPlanillasCurso)
                        .eq('alumno_dni', alDest.dni);
                }

                consolaPaseContent.innerHTML += `✔ Curso ${cGrado}° "${cSeccion}": ${listaAlumnosDestino.length} alumnos ordenados reglamentariamente del 1 al ${listaAlumnosDestino.length}.\n`;
            }

            consolaPaseContent.innerHTML += `\n🎉 ¡Pase de grado completado con éxito total!\n`;
            M.toast({ html: '🎉 Pase de grado completado exitosamente.', classes: 'green darken-2' });

            // Recargar vista para reflejar cambios
            await cargarAlumnosParaPase();

        } catch (execErr) {
            console.error('[PaseDeGrado] Error crítico durante la ejecución:', execErr);
            consolaPaseContent.innerHTML += `\n❌ Error crítico: ${execErr.message}\n`;
            M.toast({ html: '❌ Error: ' + execErr.message, classes: 'red darken-3' });
        } finally {
            btnEjecutarPase.disabled = false;
            btnSimularPase.disabled = false;
            btnEjecutarPase.innerHTML = '<i class="material-icons left">send</i>APLICAR PASE DE GRADO DEFINITIVO';
        }
    });

    // ================================================================
    // LOGICA EXISTENTE DE MIGRACIÓN CUATRIMESTRAL (PRESERVADA 100%)
    // ================================================================
    const btnEjecutar = document.getElementById('btn-ejecutar-migracion');
    const consolaLogs = document.getElementById('consola-logs');
    const tablaBody = document.getElementById('tabla-auditoria-body');
    const selectMateriaEspecial = document.getElementById('migracion-materia-especial');
    let migracionEnCurso = false;
    let masterLogs = []; 
    let masterDetails = [];

    function poblarMateriasEspeciales(gradoSeleccionado) {
        const materias = typeof window.getSpecialSubjectsList === 'function' ? window.getSpecialSubjectsList() : [];
        const grado = Number(gradoSeleccionado);
        const getGrades = typeof window.getGradesForSubject === 'function' ? window.getGradesForSubject : null;
        const materiasDisponibles = Number.isInteger(grado) && grado > 0 && getGrades
            ? materias.filter(materia => getGrades(materia.id).includes(grado))
            : materias;

        if (!selectMateriaEspecial) return;
        selectMateriaEspecial.innerHTML = '<option value="">Sin materia especial</option>';
        materiasDisponibles.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = (materia.icon || '📚') + ' ' + materia.name;
            selectMateriaEspecial.appendChild(option);
        });

        if (typeof M !== 'undefined' && M.FormSelect) {
            const formSelectInstance = M.FormSelect.getInstance(selectMateriaEspecial);
            if (formSelectInstance) formSelectInstance.destroy();
            M.FormSelect.init(selectMateriaEspecial);
        }
    }

    const gradoSelect = document.getElementById('migracion-grado');
    poblarMateriasEspeciales(gradoSelect ? gradoSelect.value : '');
    if (gradoSelect) {
        gradoSelect.addEventListener('change', () => poblarMateriasEspeciales(gradoSelect.value));
    }

    function updateTracker(stepIndex, percent) {
        const dryRunMode = !!(document.getElementById('migracion-dryrun')?.checked);
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');
        const trackerBar = document.getElementById('tracker-bar');
        const trackerText = document.getElementById('tracker-text');
        const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));

        if (step2) step2.style.display = dryRunMode ? 'none' : '';
        if (step3) step3.style.display = dryRunMode ? 'none' : '';

        document.getElementById('tracker-container').style.display = 'block';
        document.getElementById('resultados-container').style.display = 'flex';
        trackerBar.dataset.percent = String(safePercent);
        trackerBar.style.width = safePercent + '%';
        trackerText.innerText = safePercent + '% Complete';
        for(let i=0; i<=4; i++) {
            const stepEl = document.getElementById('step-'+i);
            if (!stepEl) continue;
            if (dryRunMode && (i === 2 || i === 3)) continue;
            if(i <= stepIndex) stepEl.classList.add('active');
            else stepEl.classList.remove('active');
        }
    }

    function addLog(type, section, labelStr, title, message, techDetail) {
        if(type === 'success') {
            masterLogs = masterLogs.filter(l => !(l.sec === section && l.type !== 'success'));
        }
        masterLogs.push({ type, sec: section, label: labelStr, title, msg: message, detail: techDetail });
        renderLogs();
    }

    function renderLogs() {
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        consolaLogs.innerHTML = '';
        masterLogs.forEach(log => {
            if(activeFilter === 'success' && log.type !== 'success') return;
            if(activeFilter === 'warning' && (log.type === 'success')) return;

            let icon = 'info';
            if(log.type === 'success') icon = 'check_circle';
            if(log.type === 'warning') icon = 'warning';
            if(log.type === 'error') icon = 'cancel';

            const card = document.createElement('div');
            card.className = 'diag-card card-' + log.type;
            card.innerHTML = `
                <div class="diag-side">"${log.sec}"<br><span style="font-size:0.65rem; font-weight:800;">${log.label}</span></div>
                <div class="diag-content">
                    <i class="material-icons diag-icon">${icon}</i>
                    <div style="flex: 1;">
                        <span class="diag-title">${log.title}</span>
                        <span>${escapeHtml(log.msg)}</span>
                        ${log.detail ? `<div class="tech-detail">Motivo: ${escapeHtml(log.detail)}</div>` : ''}
                    </div>
                </div>
            `;
            consolaLogs.appendChild(card);
        });
        consolaLogs.scrollTop = consolaLogs.scrollHeight;
    }

    function renderTablaAuditoria() {
        tablaBody.innerHTML = '';
        if(masterDetails.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888; padding: 15px;">No se registraron planillas procesadas.</td></tr>';
            return;
        }

        const vistas = new Set();
        masterDetails.forEach(d => {
            const key = d.origen + '|' + d.destinoId;
            if (vistas.has(key)) return;
            vistas.add(key);
            
            const link = d.destinoId ? `<a href="https://docs.google.com/spreadsheets/d/${d.destinoId}/edit" target="_blank" style="margin-left:6px; color: #1976d2; font-weight: 600; display:inline-flex; align-items:center;"><i class="material-icons" style="font-size:14px; vertical-align:middle; margin-right:2px;">open_in_new</i>Abrir</a>` : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 6px 10px; border-bottom: 1px solid #f0f0f0;">${escapeHtml(d.origen)}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f0f0f0;">${escapeHtml(d.destinoName || d.destinoId)}${link}</td>
                <td style="text-align:right; padding: 6px 10px; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${d.filas}</td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    function cambiarPestaniaMigracion(tabName) {
        document.querySelectorAll('.tab-migracion').forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabName;
            tab.classList.toggle('active', isActive);
            tab.style.background = isActive ? '#4a148c' : '#fff';
            tab.style.color = isActive ? 'white' : '#444';
            tab.style.borderColor = isActive ? '#4a148c' : '#d0d0d0';
        });

        const panelConsola = document.getElementById('panel-consola');
        const panelDetalle = document.getElementById('panel-detalle');
        if (panelConsola) panelConsola.style.display = tabName === 'consola' ? 'block' : 'none';
        if (panelDetalle) panelDetalle.style.display = tabName === 'detalle' ? 'block' : 'none';
    }

    document.querySelectorAll('.tab-migracion').forEach(btn => {
        btn.addEventListener('click', () => cambiarPestaniaMigracion(btn.getAttribute('data-tab')));
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderLogs();
        });
    });

    document.getElementById('toggle-tech')?.addEventListener('change', (e) => {
        consolaLogs.classList.toggle('show-tech', e.target.checked);
    });

    btnEjecutar.addEventListener('click', async () => {
        if (migracionEnCurso) return;
        const gradoEl = document.getElementById('migracion-grado');
        const seccionEl = document.getElementById('migracion-seccion');
        const grado = gradoEl?.value;
        if (!grado) {
            M.toast({ html: '⚠️ El campo Grado es obligatorio.', classes: 'orange darken-3' });
            return;
        }

        const seccion = seccionEl?.value ? seccionEl.value.trim().toUpperCase() : '';
        const dryRun = !!(document.getElementById('migracion-dryrun')?.checked);
        const confirmTxt = dryRun
            ? `¿SIMULAR migración de ${grado}° ${seccion ? '"' + seccion + '"' : 'todas las secciones'} al 2do Cuatrimestre?`
            : `¿Migrar ${grado}° ${seccion ? '"' + seccion + '"' : 'todas las secciones'} al 2do Cuatrimestre?`;

        if (!window.confirm(confirmTxt)) return;

        migracionEnCurso = true;
        btnEjecutar.disabled = true;
        btnEjecutar.innerHTML = '<i class="material-icons left">loop</i>PROCESANDO...';
        masterLogs = [];
        masterDetails = [];
        renderLogs();
        renderTablaAuditoria();
        updateTracker(0, 10);

        try {
            const emailActual = sessionStorage.getItem('misericordia_sesion') || '';
            const items = seccion ? [{ grado, seccion }] : ['A','B','C','D','E','F','G','H','I','J','K','L'].map(s => ({ grado, seccion: s }));
            const APPS_SCRIPT_URL = (window.APPS_SCRIPT_API_URLS && window.APPS_SCRIPT_API_URLS[0]) || 'https://script.google.com/macros/s/AKfycbyAjxyFWJZTIqvYo2bfq1vNDlEaIMHrqo9Zqb96SnRHy4WWJrIa7XeUsIlDwo0N-JuZYA/exec';
            const API_URL = window.API_URL || window.APP_API_URL || APPS_SCRIPT_URL;

            let completadas = 0;
            for (const it of items) {
                const label = it.grado + '° ' + it.seccion;
                addLog('info', label, 'PROCESANDO', 'MIGRACIÓN CUATRIMESTRAL', 'Copiando datos, permisos y candados...', '');

                const payload = {
                    action: "migrarDatosCuatrimestreREST",
                    payload: {
                        migrationType: 'regular',
                        grado: it.grado,
                        seccion: it.seccion,
                        userEmail: emailActual,
                        options: { dryRun: dryRun, paso: 'completo' }
                    }
                };

                const resp = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
                const resData = await resp.json();
                const res = resData.data || resData;

                if (res && res.success !== false) {
                    addLog('success', label, 'ÉXITO', 'MIGRACIÓN COMPLETADA', res.message || 'Copiado exitosamente.', '');
                    if (res.details) masterDetails.push(...res.details);
                } else {
                    addLog('warning', label, 'ATENCIÓN', 'FALLO O SIN REGISTROS', res?.message || 'Sin datos para migrar.', '');
                }
                completadas++;
                updateTracker(4, Math.round((completadas / items.length) * 100));
            }

            renderTablaAuditoria();
            M.toast({ html: '✅ Proceso cuatrimestral finalizado.', classes: 'green darken-2' });

        } catch (err) {
            M.toast({ html: '❌ Error: ' + err.message, classes: 'red darken-3' });
        } finally {
            migracionEnCurso = false;
            btnEjecutar.disabled = false;
            btnEjecutar.innerHTML = '<i class="material-icons left">flash_on</i>EJECUTAR MIGRACIÓN';
        }
    });

    
    async function actualizarEstadoSyncUI() {
        const statusEl = document.getElementById('sync-ui-status');
        const timeEl = document.getElementById('sync-ui-last-time');
        const countEl = document.getElementById('sync-ui-count');
        const btnKill = document.getElementById('btn-kill-switch-sync');

        try {
            const res = await fetch('/api/sync-sheets/status').catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                const st = data.estado || {};
                if (statusEl) {
                    statusEl.innerText = st.enabled !== false ? '🟢 ACTIVO (Tiempo Real)' : '🔴 DETENIDO (Pase a producción)';
                    statusEl.style.color = st.enabled !== false ? '#15803d' : '#b91c1c';
                }
                if (btnKill) {
                    btnKill.innerHTML = st.enabled !== false 
                        ? '<i class="material-icons left">cancel</i>🛑 PASE A PRODUCCIÓN (KILL-SWITCH)' 
                        : '<i class="material-icons left">play_arrow</i>🟢 REACTIVAR SINCRONIZADOR';
                    btnKill.className = st.enabled !== false 
                        ? 'btn waves-effect waves-light red darken-3' 
                        : 'btn waves-effect waves-light green darken-3';
                }
                if (timeEl) {
                    timeEl.innerText = st.lastSyncIso ? new Date(st.lastSyncIso).toLocaleString('es-AR') : 'Aún no ejecutado';
                }
                if (countEl) {
                    countEl.innerText = String(st.totalCursosSincronizados || 0);
                }
            }
        } catch (e) {}
    }

    const btnTabSync = document.getElementById('tab-btn-sync-sheets');
    if (btnTabSync) {
        btnTabSync.addEventListener('click', () => cambiarModoMigracionPrincipal('sync-sheets'));
    }

    const btnKillSwitch = document.getElementById('btn-kill-switch-sync');
    if (btnKillSwitch) {
        btnKillSwitch.addEventListener('click', async () => {
            const statusEl = document.getElementById('sync-ui-status');
            const estaActivo = statusEl && statusEl.innerText.includes('ACTIVO');

            const msg = estaActivo
                ? '¿Confirmas el PASE A PRODUCCIÓN DEFINITIVO?\n\nAl activar el Kill-Switch, la sincronización automática desde Google Sheets se detendrá para siempre. Ninguna edición en Google Sheets impactará Supabase, protegiendo las notas cargadas en la web.'
                : '¿Deseas reactivar el sincronizador automático desde Google Sheets hacia Supabase?';

            if (!window.confirm(msg)) return;

            btnKillSwitch.disabled = true;
            try {
                const res = await fetch('/api/sync-sheets/toggle', { method: 'POST' });
                const data = await res.json();
                M.toast({ html: data.mensaje || 'Estado actualizado.', classes: data.enabled ? 'green darken-2' : 'orange darken-3' });
                await actualizarEstadoSyncUI();
                const consolaContent = document.getElementById('sync-consola-content');
                if (consolaContent) {
                    consolaContent.innerHTML += `\n> [${new Date().toLocaleTimeString('es-AR')}] ${data.mensaje}`;
                    consolaContent.scrollTop = consolaContent.scrollHeight;
                }
            } catch (err) {
                M.toast({ html: 'Error al cambiar estado: ' + err.message, classes: 'red darken-3' });
            } finally {
                btnKillSwitch.disabled = false;
            }
        });
    }

    const btnSyncManual = document.getElementById('btn-sync-ahora-manual');
    if (btnSyncManual) {
        btnSyncManual.addEventListener('click', async () => {
            await ejecutarSincronizacionManualSheetsUI();
        });
    }

    instance.open();
}

// ============================================================================
// MOTOR REAL DE SINCRONIZACIÓN GOOGLE SHEETS ➔ SUPABASE (EJECUCIÓN EN NAVEGADOR)
// ============================================================================
const APPS_SCRIPT_URLS_SYNC = [
    "https://script.google.com/macros/s/AKfycby_SOVso62pE-AggkjhoaSRA1iQ6Gndr27YchudExl3pbFHvpxh4yGmd3FDfVGHBjrR/exec",
    "https://script.google.com/macros/s/AKfycbyAjxyFWJZTIqvYo2bfq1vNDlEaIMHrqo9Zqb96SnRHy4WWJrIa7XeUsIlDwo0N-JuZYA/exec",
    "https://script.google.com/macros/s/AKfycbzlzK4XbDRVcuvGF5f1pjaeSOrkhPLbfnTrc7morbQd8aQxmkiWLRRrXSZ1FbVuL9_2KQ/exec"
];
let _rrIndexSync = 0;

async function fetchAppsScriptSyncConReintento(action, payload, intentos = 3) {
    let ultimoError = null;
    for (let i = 0; i < intentos; i++) {
        const url = APPS_SCRIPT_URLS_SYNC[(_rrIndexSync++) % APPS_SCRIPT_URLS_SYNC.length];
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 90000);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, payload }),
                signal: controller.signal
            });
            clearTimeout(timer);
            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error(`Respuesta no JSON de Apps Script: ${text.substring(0, 120)}`);
            }
            if (json && json.status === 'error') {
                throw new Error(json.message || 'Error devuelto por Google Apps Script');
            }
            return json.data !== undefined ? json.data : json;
        } catch (err) {
            ultimoError = err;
            await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        }
    }
    throw ultimoError;
}

function normalizarFormatoCursoSync(data) {
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
                    if (!header) return;
                    const val = values[colIndex] == null ? '' : String(values[colIndex]);
                    if (row[header] === undefined || row[header] === '' || val !== '') {
                        row[header] = val;
                    }
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
            sheetOrder: compactSheets.map(s => s.name).filter(Boolean),
            sheets: sheetConfigs,
            students
        };
    }
    return data;
}

function parsePlanillaInfoSync(nombre) {
    const norm = String(nombre || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().trim();
    const esSegundo = /(?:2\s*(?:º|°|DO)?\s*CUAT|SEGUNDO\s*CUAT)/i.test(norm);
    const sinCuatri = norm.replace(/[12]\s*(?:RO|DO|ER|TO|º|°)?\s*CUATRIMESTRE/gi, '');
    const m = sinCuatri.match(/\b([1-6])\s*(?:RO|DO|TO|ER|MO|º|°)?\b/i);
    const sinEsp = sinCuatri.replace(/\bESP\b/gi, '').trim();
    const mSec = sinEsp.match(/(?:^|\s)([A-L])(?:\s|$)/i);

    let materia = null;
    if (/INGLES/i.test(norm)) materia = 'INGLES';
    else if (/FISICA/i.test(norm)) materia = 'ED_FISICA';
    else if (/MUSICA/i.test(norm)) materia = 'MUSICA';
    else if (/PLASTICA|ARTISTICA/i.test(norm)) materia = 'PLASTICA';
    else if (/TECNOLOGIA/i.test(norm)) materia = 'TECNOLOGIA';

    return {
        esSegundo: esSegundo ? 2 : 1,
        grado: m ? String(m[1]) : null,
        seccion: mSec ? String(mSec[1]).toUpperCase() : null,
        materia,
        esEspecial: /\bESP\b|ESPECIAL/i.test(norm)
    };
}

function limpiarCacheLocalPlanilla(planilla) {
    if (!planilla) return;
    const claves = [
        'misericordia_data_' + planilla.spreadsheet_id,
        'misericordia_data_' + planilla.id,
        'misericordia_data_' + planilla.nombre
    ];
    claves.forEach(k => {
        try { sessionStorage.removeItem(k); } catch (e) {}
        try { localStorage.removeItem(k); } catch (e) {}
        if (typeof window.removeCacheKey === 'function') {
            try { window.removeCacheKey(k); } catch (e) {}
        }
    });
}

async function sincronizarCursoIndividualDesdeSheets(planilla, client) {
    client = client || window.supabaseClient;
    if (!client) throw new Error('Cliente Supabase no disponible.');
    if (!planilla || !planilla.spreadsheet_id) {
        throw new Error(`La planilla "${planilla ? planilla.nombre : ''}" no tiene spreadsheet_id.`);
    }

    const emailAdmin = 'misericordiaplanillas@gmail.com';
    const rawCursoData = await fetchAppsScriptSyncConReintento('cargarTodoElCurso', [
        planilla.spreadsheet_id,
        emailAdmin,
        { compact: true }
    ]);

    if (!rawCursoData || rawCursoData.error) {
        throw new Error((rawCursoData && rawCursoData.error) || 'No se recibieron datos de Google Sheets');
    }

    const cursoData = normalizarFormatoCursoSync(rawCursoData);
    const sheetOrder = cursoData.sheetOrder || Object.keys(cursoData.sheets || {});
    const sheets = cursoData.sheets || {};
    const students = cursoData.students || [];

    // 1. Batch upsert en planilla_hojas
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
            es_especial: /\bESP\b|PLASTICA|MUSICA|FISICA|INGLES/i.test(planilla.nombre)
        });
    }
    if (hojasMap.size > 0) {
        const { error: errHojas } = await client
            .from('planilla_hojas')
            .upsert(Array.from(hojasMap.values()), { onConflict: 'planilla_id,nombre_hoja' });
        if (errHojas) console.warn('[SyncSheets] Aviso en planilla_hojas:', errHojas.message);
    }

    // 2. Preparar batch de alumnos, matrículas y calificaciones
    const alumnosMap = new Map();
    const matriculasMap = new Map();
    const calificacionesMap = new Map();
    const ahoraIso = new Date().toISOString();

    let orden = 1;
    for (const st of students) {
        const dni = String(st.dni || '').trim();
        if (!dni) continue;

        const datosPersonales = (st.datosHojas && st.datosHojas['DATOS']) ? st.datosHojas['DATOS'] : {};
        let apellido = String(datosPersonales['APELLIDO'] || '').trim();
        let nombre = String(datosPersonales['NOMBRE'] || '').trim();

        if (!apellido && !nombre && st.nombreCompleto) {
            const partes = String(st.nombreCompleto).split(',');
            apellido = partes[0] ? partes[0].trim() : String(st.nombreCompleto).trim();
            nombre = partes[1] ? partes[1].trim() : '';
        }

        const sexo = String(datosPersonales['SEXO'] || '').trim();
        const fechaNac = String(datosPersonales['FECHA NACIMIENTO'] || datosPersonales['FECHA DE NACIMIENTO'] || datosPersonales['FECHA DE NAC'] || '').trim();

        const ocultoVal = String(datosPersonales['OCULTO'] || '').toUpperCase().trim();
        const estaOculto = (ocultoVal === 'SI' || ocultoVal === 'SÍ' || ocultoVal === 'TRUE');

        const activoVal = String(datosPersonales['ACTIVOS'] || datosPersonales['ESTADO'] || '').toUpperCase().trim();
        const estaActivo = (activoVal === '' || activoVal === 'TRUE' || activoVal === 'VERDADERO' || activoVal === 'SI' || activoVal === 'SÍ' || activoVal === '1');

        const tieneHojaDatos = Boolean(st.datosHojas && st.datosHojas['DATOS']);
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

        if (st.datosHojas && typeof st.datosHojas === 'object') {
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
                        updated_by: 'sync_sheets_manual',
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
        const { data: matActuales } = await client
            .from('alumno_planillas')
            .select('alumno_dni, alumnos(dni, apellido, nombre)')
            .eq('planilla_id', planilla.id);

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
                    console.log(`[SyncSheets] ${planilla.nombre}: Detectado cambio de DNI para ${alPayload.apellido}, ${alPayload.nombre}: ${dniViejo} ➔ ${dniHoja}`);

                    // Comprobar si dniHoja ya existe en la tabla alumnos
                    const { data: existeNuevo } = await client
                        .from('alumnos')
                        .select('dni')
                        .eq('dni', dniHoja)
                        .maybeSingle();

                    if (!existeNuevo) {
                        // Actualizar DNI en la tabla alumnos. La restricción ON UPDATE CASCADE
                        // propaga el cambio automáticamente a alumno_planillas y calificaciones.
                        const { error: errUpdDni } = await client
                            .from('alumnos')
                            .update({
                                dni: dniHoja,
                                apellido: alPayload.apellido,
                                nombre: alPayload.nombre,
                                updated_at: ahoraIso
                            })
                            .eq('dni', dniViejo);

                        if (errUpdDni) {
                            console.warn('[SyncSheets] Aviso al actualizar DNI:', errUpdDni.message);
                        } else {
                            console.log(`[SyncSheets] DNI actualizado correctamente en base de datos: ${dniViejo} ➔ ${dniHoja}`);
                        }
                    } else {
                        // Si ya existe el registro con dniHoja (por ejemplo, por una inserción previa):
                        // Unificar calificaciones y matrículas para no dejar registros huérfanos.
                        try {
                            const { data: matsViejo } = await client
                                .from('alumno_planillas')
                                .select('planilla_id')
                                .eq('alumno_dni', dniViejo);

                            for (const mv of (matsViejo || [])) {
                                const { data: tieneMatNuevo } = await client
                                    .from('alumno_planillas')
                                    .select('id')
                                    .eq('planilla_id', mv.planilla_id)
                                    .eq('alumno_dni', dniHoja)
                                    .maybeSingle();
                                if (!tieneMatNuevo) {
                                    await client
                                        .from('alumno_planillas')
                                        .update({ alumno_dni: dniHoja })
                                        .eq('planilla_id', mv.planilla_id)
                                        .eq('alumno_dni', dniViejo);
                                }
                            }

                            const { data: califsViejo } = await client
                                .from('calificaciones')
                                .select('id, planilla_id, nombre_hoja, valores')
                                .eq('alumno_dni', dniViejo);

                            for (const cv of (califsViejo || [])) {
                                const { data: tieneCalifNuevo } = await client
                                    .from('calificaciones')
                                    .select('id')
                                    .eq('planilla_id', cv.planilla_id)
                                    .eq('alumno_dni', dniHoja)
                                    .eq('nombre_hoja', cv.nombre_hoja)
                                    .maybeSingle();
                                if (!tieneCalifNuevo) {
                                    const valsActualizados = cv.valores && typeof cv.valores === 'object'
                                        ? { ...cv.valores, DNI: dniHoja }
                                        : cv.valores;
                                    await client
                                        .from('calificaciones')
                                        .update({ alumno_dni: dniHoja, valores: valsActualizados })
                                        .eq('id', cv.id);
                                }
                            }

                            await client.from('calificaciones').delete().eq('alumno_dni', dniViejo);
                            await client.from('alumno_planillas').delete().eq('alumno_dni', dniViejo);
                            await client.from('alumnos').delete().eq('dni', dniViejo);
                        } catch (eMerge) {
                            console.warn('[SyncSheets] Aviso unificando DNI previo:', eMerge.message);
                        }
                    }

                    // Actualizar el campo DNI en el jsonb de calificaciones si todavía contiene el DNI viejo
                    try {
                        const { data: califsAfectadas } = await client
                            .from('calificaciones')
                            .select('id, valores')
                            .eq('alumno_dni', dniHoja);
                        for (const c of (califsAfectadas || [])) {
                            if (c.valores && typeof c.valores === 'object' && c.valores.DNI === dniViejo) {
                                await client
                                    .from('calificaciones')
                                    .update({ valores: { ...c.valores, DNI: dniHoja } })
                                    .eq('id', c.id);
                            }
                        }
                    } catch (eJsonbDni) {
                        console.warn('[SyncSheets] Aviso actualizando DNI en JSONB de calificaciones:', eJsonbDni.message);
                    }
                }
            }
        }
    } catch (eDniCheck) {
        console.warn(`[SyncSheets] Aviso en verificación de cambio de DNI en ${planilla.nombre}:`, eDniCheck.message);
    }

    if (alumnosMap.size > 0) {
        const { error: errAl } = await client
            .from('alumnos')
            .upsert(Array.from(alumnosMap.values()), { onConflict: 'dni' });
        if (errAl) throw new Error(`Error actualizando alumnos en ${planilla.nombre}: ${errAl.message}`);
    }

    if (matriculasMap.size > 0) {
        const { error: errMat } = await client
            .from('alumno_planillas')
            .upsert(Array.from(matriculasMap.values()), { onConflict: 'planilla_id,alumno_dni' });
        if (errMat) throw new Error(`Error actualizando matrículas en ${planilla.nombre}: ${errMat.message}`);
    }

    if (calificacionesMap.size > 0) {
        // Leer calificaciones previas de esta planilla para registrar en auditoría cualquier cambio real (permitiendo restaurar hacia atrás)
        const mapaPreviasSync = new Map();
        try {
            const { data: prevCalifs } = await client
                .from('calificaciones')
                .select('alumno_dni, nombre_hoja, valores')
                .eq('planilla_id', planilla.id);
            (prevCalifs || []).forEach(r => {
                mapaPreviasSync.set(`${planilla.id}|${String(r.alumno_dni).trim()}|${r.nombre_hoja}`, (r.valores && typeof r.valores === 'object') ? r.valores : {});
            });
        } catch (ePrevS) {}

        const califsArr = Array.from(calificacionesMap.values());
        // Upsert en bloques de 250 para evitar payloads excesivos
        for (let i = 0; i < califsArr.length; i += 250) {
            const chunk = califsArr.slice(i, i + 250);
            const { error: errCal } = await client
                .from('calificaciones')
                .upsert(chunk, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });
            if (errCal) throw new Error(`Error guardando calificaciones en ${planilla.nombre}: ${errCal.message}`);
        }

        // Registrar en auditoría si alguna calificación que ya existía en Supabase fue modificada por la sincronización
        if (mapaPreviasSync.size > 0 && typeof getAuditSupabaseClient === 'function') {
            try {
                const clavesIdIgnorar = new Set(['DNI', 'D.N.I', 'APELLIDO Y NOMBRE', 'APELLIDO', 'NOMBRE', 'NRO.', 'Nro.', 'NRO', 'N°', 'Nº', 'NUMERO', 'NUMERO DE ORDEN', 'ACTIVOS', 'ESTADO', 'OCULTO', '_rowIndex']);
                const logsSync = [];
                for (const [claveMap, itemNuevo] of calificacionesMap.entries()) {
                    if (!mapaPreviasSync.has(claveMap)) continue;
                    if (/BOLETIN/i.test(itemNuevo.nombre_hoja)) continue;
                    const antesObj = mapaPreviasSync.get(claveMap) || {};
                    const despuesObj = itemNuevo.valores || {};
                    const diffs = [];
                    const camposMod = {};
                    const todasClaves = new Set([...Object.keys(antesObj), ...Object.keys(despuesObj)]);
                    todasClaves.forEach(k => {
                        if (clavesIdIgnorar.has(k)) return;
                        const vA = String(antesObj[k] ?? '').trim();
                        const vD = String(despuesObj[k] ?? '').trim();
                        if (vA !== vD) {
                            diffs.push(`${k}: "${vA}" ➔ "${vD}"`);
                            camposMod[k] = { antes: vA, despues: vD };
                        }
                    });
                    if (diffs.length > 0) {
                        const textoLeg = `☁️ Sync Google Sheets: ${diffs.join(' | ')}`;
                        const snapTxt = typeof window.codificarCambiosConSnapshot === 'function'
                            ? window.codificarCambiosConSnapshot(textoLeg, {
                                tipo: String(itemNuevo.nombre_hoja).toUpperCase() === 'DATOS' ? 'DATOS' : 'CALIFICACIONES',
                                planilla_id: planilla.id,
                                nombre_planilla: planilla.nombre,
                                dni: itemNuevo.alumno_dni,
                                hoja: itemNuevo.nombre_hoja,
                                antes: antesObj,
                                despues: despuesObj,
                                campos: camposMod
                            })
                            : textoLeg;
                        logsSync.push({
                            usuario: 'Sincronización Google Sheets',
                            planilla_id: String(planilla.id),
                            nombre_planilla: planilla.nombre,
                            hoja: itemNuevo.nombre_hoja,
                            dni_alumno: itemNuevo.alumno_dni,
                            cambios: snapTxt
                        });
                    }
                }
                if (logsSync.length > 0) {
                    await getAuditSupabaseClient().from('auditoria').insert(logsSync.slice(0, 100));
                }
            } catch (eAudSync) {
                console.warn('[SyncSheets] Aviso guardando auditoría de cambios en sync:', eAudSync);
            }
        }
    }

    // Si es una planilla de Área Especial (ESP), consolidar automáticamente sus notas en la planilla regular del grado
    const infoPlanillaSync = parsePlanillaInfoSync(planilla.nombre);
    if (infoPlanillaSync.esEspecial && infoPlanillaSync.materia && infoPlanillaSync.grado && infoPlanillaSync.seccion) {
        try {
            await propagarNotasEspecialesEnLoteSync(planilla, infoPlanillaSync, students, client);
        } catch (errProp) {
            console.warn(`[SyncSheets] Aviso propagando notas especiales de ${planilla.nombre}:`, errProp.message);
        }
    }

    limpiarCacheLocalPlanilla(planilla);

    return {
        planillaId: planilla.id,
        nombre: planilla.nombre,
        alumnosSincronizados: alumnosMap.size,
        hojasSincronizadas: hojasMap.size,
        registrosCalificaciones: calificacionesMap.size
    };
}
window.sincronizarCursoIndividualDesdeSheets = sincronizarCursoIndividualDesdeSheets;

function extraerNotaFinalEspecialSync(valores) {
    if (!valores) return '';
    const prom = valores['Promedio.'] || valores['Promedio'] || valores['PROMEDIO.'] || valores['PROMEDIO'] || valores['PROM'];
    if (prom !== undefined && prom !== null && String(prom).trim() !== '') {
        const n = Number(String(prom).replace(/,/g, '.'));
        return !isNaN(n) ? n.toFixed(2) : String(prom).trim();
    }
    const b1 = Number(String(valores['1 Bimestre'] || valores['1er Bimestre'] || valores['1° Bimestre'] || '').replace(/,/g, '.'));
    const b2 = Number(String(valores['2 Bimestre'] || valores['2do Bimestre'] || valores['2° Bimestre'] || '').replace(/,/g, '.'));
    const validas = [b1, b2].filter(n => !isNaN(n) && n > 0);
    if (validas.length > 0) {
        const avg = validas.reduce((a, b) => a + b, 0) / validas.length;
        return avg.toFixed(2);
    }
    return '';
}

function mapearColumnaMateriaEspecialSync(headers, materia, nombreHoja) {
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

async function propagarNotasEspecialesEnLoteSync(planillaEspecial, infoEsp, students, client) {
    const { data: candidatasReg } = await client
        .from('planillas')
        .select('id, nombre, spreadsheet_id')
        .eq('activo', true)
        .not('nombre', 'ilike', '%ESP%')
        .ilike('nombre', `%${infoEsp.grado}%`)
        .ilike('nombre', `%${infoEsp.seccion}%`);

    const regPlanilla = (candidatasReg || []).find(p => {
        const ir = parsePlanillaInfoSync(p.nombre);
        return !ir.esEspecial && ir.grado === infoEsp.grado && ir.seccion === infoEsp.seccion && ir.esSegundo === infoEsp.esSegundo;
    });
    if (!regPlanilla) return;

    const { data: regHojas } = await client
        .from('planilla_hojas')
        .select('nombre_hoja, all_headers')
        .eq('planilla_id', regPlanilla.id);
    if (!Array.isArray(regHojas) || regHojas.length === 0) return;

    const hojasDestino = [];
    regHojas.forEach(h => {
        const col = mapearColumnaMateriaEspecialSync(h.all_headers, infoEsp.materia, h.nombre_hoja);
        if (col) hojasDestino.push({ nombreHoja: h.nombre_hoja, columna: col });
    });
    if (hojasDestino.length === 0) return;

    const nombresHojasDest = hojasDestino.map(d => d.nombreHoja);
    const { data: existentes } = await client
        .from('calificaciones')
        .select('alumno_dni, nombre_hoja, valores')
        .eq('planilla_id', regPlanilla.id)
        .in('nombre_hoja', nombresHojasDest);

    const mapaExistentes = new Map();
    (existentes || []).forEach(c => {
        mapaExistentes.set(`${String(c.alumno_dni).trim()}|${c.nombre_hoja}`, c.valores || {});
    });

    const upserts = [];
    const ahoraIso = new Date().toISOString();

    for (const st of (students || [])) {
        const dni = String(st.dni || '').trim();
        if (!dni) continue;
        const valoresEsp = (st.datosHojas && (st.datosHojas['NOTAS_ÁREAS_ESPECIALES'] || Object.values(st.datosHojas)[0])) || {};
        const notaFinal = extraerNotaFinalEspecialSync(valoresEsp);
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
        await client
            .from('calificaciones')
            .upsert(upserts, { onConflict: 'planilla_id,alumno_dni,nombre_hoja' });
        limpiarCacheLocalPlanilla(regPlanilla);
    }
}

async function recargarPlanillaAbiertaEnPantallaSiCorresponde() {
    const inputPlanilla = document.getElementById('select-planilla');
    const nombreAbierto = String(window.currentPlanillaNombre || (inputPlanilla && inputPlanilla.value) || '').trim();
    if (!nombreAbierto && !window.currentSpreadsheetId) return;

    const hojaPrevia = typeof HOJA_ACTUAL_SELECCIONADA !== 'undefined' ? HOJA_ACTUAL_SELECCIONADA : '';
    const selectAl = document.getElementById('select-alumno');
    const dniPrevio = selectAl ? selectAl.value : '';

    if (typeof cargarHojasDePlanilla === 'function') {
        await cargarHojasDePlanilla(true);
        // Restaurar alumno y pestaña seleccionados previamente
        if (dniPrevio && selectAl && Array.from(selectAl.options).some(o => o.value === dniPrevio)) {
            selectAl.value = dniPrevio;
            selectAl.dispatchEvent(new Event('change'));
        }
        if (hojaPrevia) {
            const itemsSidebar = document.querySelectorAll('#sidebar-hojas .collection-item');
            itemsSidebar.forEach(item => {
                if (item.dataset && item.dataset.sheetName === hojaPrevia) {
                    item.click();
                }
            });
        }
    }
}

async function ejecutarSincronizacionManualSheetsUI() {
    const btnSyncManual = document.getElementById('btn-sync-ahora-manual');
    const consolaContent = document.getElementById('sync-consola-content');
    const consolaResumen = document.getElementById('sync-consola-resumen');
    const progressWrapper = document.getElementById('sync-progress-wrapper');
    const progressLabel = document.getElementById('sync-progress-label');
    const progressPct = document.getElementById('sync-progress-pct');
    const progressBar = document.getElementById('sync-progress-bar');
    const countEl = document.getElementById('sync-ui-count');
    const timeEl = document.getElementById('sync-ui-last-time');

    const alcance = document.getElementById('sync-alcance-select')?.value || 'grado';
    const gradoFiltro = document.getElementById('sync-grado-select')?.value || '6';
    const seccionFiltro = document.getElementById('sync-seccion-select')?.value || 'TODAS';
    const cuatriFiltro = document.getElementById('sync-cuatri-select')?.value || '2';
    const incluirEspeciales = document.getElementById('sync-incluir-especiales') ? document.getElementById('sync-incluir-especiales').checked : true;

    const logConsola = (msg) => {
        if (!consolaContent) return;
        consolaContent.textContent += `\n> [${new Date().toLocaleTimeString('es-AR')}] ${msg}`;
        consolaContent.scrollTop = consolaContent.scrollHeight;
    };

    if (btnSyncManual) {
        btnSyncManual.disabled = true;
        btnSyncManual.innerHTML = '<i class="material-icons left">loop</i>SINCRONIZANDO...';
    }
    if (progressWrapper) progressWrapper.style.display = 'block';
    if (progressBar) progressBar.style.width = '2%';
    if (progressPct) progressPct.textContent = '0%';

    try {
        const client = window.supabaseClient;
        if (!client) throw new Error('No se encontró conexión con Supabase.');

        const { data: todasPlanillas, error: errPl } = await client
            .from('planillas')
            .select('id, nombre, spreadsheet_id, activo')
            .eq('activo', true)
            .order('nombre');

        if (errPl) throw new Error('Error consultando catálogo de planillas: ' + errPl.message);

        const inputPlanilla = document.getElementById('select-planilla');
        const nombreActual = String(window.currentPlanillaNombre || (inputPlanilla && inputPlanilla.value) || '').trim();
        const idActual = String(window.currentSpreadsheetId || '').trim();

        let planillasObjetivo = [];

        if (alcance === 'actual') {
            if (!nombreActual && !idActual) {
                M.toast({ html: '⚠️ No hay ninguna planilla seleccionada en pantalla. Selecciona un Grado o abre una planilla.', classes: 'orange darken-3' });
                const selAlc = document.getElementById('sync-alcance-select');
                if (selAlc) {
                    selAlc.value = 'grado';
                    selAlc.dispatchEvent(new Event('change'));
                }
                return;
            }
            const principal = (todasPlanillas || []).find(p =>
                (idActual && (p.spreadsheet_id === idActual || String(p.id) === idActual)) ||
                (nombreActual && p.nombre.trim().toUpperCase() === nombreActual.toUpperCase())
            );
            if (!principal) {
                throw new Error(`No se encontró la planilla "${nombreActual || idActual}" en la tabla planillas de Supabase.`);
            }
            planillasObjetivo.push(principal);

            // Si está marcado "incluir especiales" y la planilla actual es regular, incluir las especiales de ese mismo grado/sección/cuatrimestre
            const infoPrin = parsePlanillaInfoSync(principal.nombre);
            if (incluirEspeciales && !infoPrin.esEspecial && infoPrin.grado && infoPrin.seccion) {
                const especialesCurso = (todasPlanillas || []).filter(p => {
                    const inf = parsePlanillaInfoSync(p.nombre);
                    return inf.esEspecial && inf.grado === infoPrin.grado && inf.seccion === infoPrin.seccion && inf.esSegundo === infoPrin.esSegundo;
                });
                planillasObjetivo.push(...especialesCurso);
            }
        } else if (alcance === 'grado') {
            planillasObjetivo = (todasPlanillas || []).filter(p => {
                const inf = parsePlanillaInfoSync(p.nombre);
                if (!incluirEspeciales && inf.esEspecial) return false;
                if (gradoFiltro !== 'TODOS' && inf.grado !== String(gradoFiltro)) return false;
                if (seccionFiltro !== 'TODAS' && inf.seccion !== String(seccionFiltro).toUpperCase()) return false;
                if (cuatriFiltro !== 'AMBOS' && String(inf.esSegundo) !== String(cuatriFiltro)) return false;
                return Boolean(inf.grado);
            });
        } else if (alcance === 'todas_2do') {
            planillasObjetivo = (todasPlanillas || []).filter(p => {
                if (/^RESET\b/i.test(p.nombre)) return false;
                const inf = parsePlanillaInfoSync(p.nombre);
                if (!incluirEspeciales && inf.esEspecial) return false;
                return inf.esSegundo === 2 && Boolean(inf.grado);
            });
        } else if (alcance === 'todas_1ro') {
            planillasObjetivo = (todasPlanillas || []).filter(p => {
                if (/^RESET\b/i.test(p.nombre)) return false;
                const inf = parsePlanillaInfoSync(p.nombre);
                if (!incluirEspeciales && inf.esEspecial) return false;
                return inf.esSegundo === 1 && Boolean(inf.grado);
            });
        } else {
            // 'todas': Todos los grados y todas las áreas especiales existentes
            planillasObjetivo = (todasPlanillas || []).filter(p => {
                if (/^RESET\b/i.test(p.nombre)) return false;
                const inf = parsePlanillaInfoSync(p.nombre);
                if (!incluirEspeciales && inf.esEspecial) return false;
                return Boolean(p.spreadsheet_id);
            });
        }

        // Ordenar: primero las regulares, luego las especiales
        planillasObjetivo.sort((a, b) => {
            const ia = parsePlanillaInfoSync(a.nombre);
            const ib = parsePlanillaInfoSync(b.nombre);
            if (ia.esEspecial !== ib.esEspecial) return ia.esEspecial ? 1 : -1;
            return a.nombre.localeCompare(b.nombre, 'es');
        });

        if (planillasObjetivo.length === 0) {
            M.toast({ html: 'No se encontraron planillas para el filtro seleccionado.', classes: 'orange darken-3' });
            logConsola('⚠️ No se encontraron planillas que coincidan con el filtro seleccionado.');
            return;
        }

        if (consolaContent) {
            consolaContent.textContent = `> [${new Date().toLocaleTimeString('es-AR')}] 🚀 Iniciando sincronización de ${planillasObjetivo.length} planilla(s) desde Google Sheets hacia Supabase...`;
        }
        M.toast({ html: `🔄 Sincronizando ${planillasObjetivo.length} planilla(s) desde Google Sheets...`, classes: 'teal darken-2' });

        let completadas = 0;
        let exitosas = 0;
        let fallidas = 0;
        let totalAlumnos = 0;
        let totalHojas = 0;

        const CONCURRENCIA = 3;
        for (let i = 0; i < planillasObjetivo.length; i += CONCURRENCIA) {
            const lote = planillasObjetivo.slice(i, i + CONCURRENCIA);
            await Promise.all(lote.map(async (pl) => {
                try {
                    if (progressLabel) progressLabel.textContent = `Sincronizando: ${pl.nombre} (${completadas + 1}/${planillasObjetivo.length})...`;
                    const resCurso = await sincronizarCursoIndividualDesdeSheets(pl, client);
                    exitosas++;
                    totalAlumnos += resCurso.alumnosSincronizados;
                    totalHojas += resCurso.hojasSincronizadas;
                    logConsola(`✔ ${pl.nombre} ➔ ${resCurso.alumnosSincronizados} alumnos | ${resCurso.registrosCalificaciones} hojas de notas actualizadas.`);
                } catch (errCurso) {
                    fallidas++;
                    logConsola(`❌ ${pl.nombre} ➔ Error: ${errCurso.message}`);
                } finally {
                    completadas++;
                    const pct = Math.round((completadas / planillasObjetivo.length) * 100);
                    if (progressBar) progressBar.style.width = `${pct}%`;
                    if (progressPct) progressPct.textContent = `${pct}%`;
                    if (consolaResumen) consolaResumen.textContent = `${completadas}/${planillasObjetivo.length} procesadas (${exitosas} OK)`;
                    if (countEl) countEl.textContent = String(exitosas);
                }
            }));
        }

        const ahoraStr = new Date().toLocaleString('es-AR');
        if (timeEl) timeEl.textContent = ahoraStr;
        if (progressLabel) progressLabel.textContent = `¡Sincronización finalizada! (${exitosas} planilla(s) actualizadas)`;

        // Registrar en el estado local si el servidor local está disponible
        fetch('/api/sync-sheets/record-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cursosSincronizados: exitosas, lastSyncIso: new Date().toISOString() })
        }).catch(() => {});

        logConsola(`🏁 Proceso completado: ${exitosas} planilla(s) sincronizadas con éxito${fallidas > 0 ? `, ${fallidas} con error` : ''}.`);

        // Si hay una planilla abierta en pantalla, recargarla automáticamente para mostrar las notas recién sincronizadas
        await recargarPlanillaAbiertaEnPantallaSiCorresponde();

        M.toast({
            html: `✅ Sincronización completada: ${exitosas} planilla(s) actualizadas desde Google Sheets.`,
            classes: 'green darken-2',
            displayLength: 5000
        });
    } catch (err) {
        console.error('[SyncSheets] Error en sincronización manual:', err);
        logConsola(`❌ Error general: ${err.message}`);
        M.toast({ html: '❌ Error en sincronización: ' + err.message, classes: 'red darken-3' });
    } finally {
        if (btnSyncManual) {
            btnSyncManual.disabled = false;
            btnSyncManual.innerHTML = '<i class="material-icons left">sync</i>SINCRONIZAR AHORA';
        }
    }
}
window.ejecutarSincronizacionManualSheetsUI = ejecutarSincronizacionManualSheetsUI;

// Función rápida para sincronizar con 1 clic la planilla actualmente abierta en pantalla
window.sincronizarPlanillaActualRapido = async function() {
    const inputPlanilla = document.getElementById('select-planilla');
    const nombreActual = String(window.currentPlanillaNombre || (inputPlanilla && inputPlanilla.value) || '').trim();
    const idActual = String(window.currentSpreadsheetId || '').trim();

    if (!nombreActual && !idActual) {
        M.toast({ html: 'Selecciona primero una planilla para sincronizarla.', classes: 'orange darken-3' });
        return;
    }

    const btnRapido = document.getElementById('btn-sync-planilla-actual');
    const htmlOriginal = btnRapido ? btnRapido.innerHTML : '';
    if (btnRapido) {
        btnRapido.disabled = true;
        btnRapido.innerHTML = '<i class="material-icons" style="font-size:20px;">sync</i>';
    }

    M.toast({ html: `🔄 Sincronizando notas de "${nombreActual}" desde Google Sheets...`, classes: 'teal darken-2', displayLength: 4000 });

    try {
        const client = window.supabaseClient;
        const { data: todasPlanillas, error: errPl } = await client
            .from('planillas')
            .select('id, nombre, spreadsheet_id, activo')
            .eq('activo', true);

        if (errPl) throw new Error(errPl.message);

        const principal = (todasPlanillas || []).find(p =>
            (idActual && (p.spreadsheet_id === idActual || String(p.id) === idActual)) ||
            (nombreActual && p.nombre.trim().toUpperCase() === nombreActual.toUpperCase())
        );

        if (!principal) throw new Error(`No se halló la planilla "${nombreActual}" en Supabase.`);

        const aSincronizar = [principal];
        const infoPrin = parsePlanillaInfoSync(principal.nombre);
        if (!infoPrin.esEspecial && infoPrin.grado && infoPrin.seccion) {
            const especiales = (todasPlanillas || []).filter(p => {
                const inf = parsePlanillaInfoSync(p.nombre);
                return inf.esEspecial && inf.grado === infoPrin.grado && inf.seccion === infoPrin.seccion && inf.esSegundo === infoPrin.esSegundo;
            });
            aSincronizar.push(...especiales);
        }

        for (const pl of aSincronizar) {
            await sincronizarCursoIndividualDesdeSheets(pl, client);
        }

        await recargarPlanillaAbiertaEnPantallaSiCorresponde();
        M.toast({ html: `✅ Notas de "${principal.nombre}" sincronizadas desde Google Sheets.`, classes: 'green darken-2', displayLength: 4500 });
    } catch (err) {
        console.error('[SyncRapido] Error:', err);
        M.toast({ html: '❌ Error al sincronizar planilla: ' + err.message, classes: 'red darken-3' });
    } finally {
        if (btnRapido) {
            btnRapido.disabled = false;
            btnRapido.innerHTML = htmlOriginal;
        }
    }
};

window.iniciarModuloMigracion = iniciarModuloMigracion;
