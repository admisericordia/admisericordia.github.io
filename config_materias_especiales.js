/**
 * ================================================================
 * CONFIGURACIÓN DE MATERIAS ESPECIALES - Script Listo para Usar
 * Guarde este archivo como: config_materias_especiales.js
 * ================================================================
 * 
 * Este archivo contiene:
 * 1. Configuración de todas las materias especiales
 * 2. Funciones helper para validar y obtener datos
 * 3. Ejemplos que puede personalizar según su institución
 * 
 * Incluir en HTML:
 * <script src="config_materias_especiales.js"></script>
 * <script src="app.js"></script>  <!-- DESPUÉS de esta línea -->
 */

// ================================================================
// SECCIÓN 1: CONFIGURACIÓN GLOBAL DE MATERIAS ESPECIALES
// ================================================================

/**
 * CONFIGURACIÓN CENTRAL DE MATERIAS ESPECIALES
 * 
 * Estructura:
 * {
 *   'id-unico': {
 *     id: 'id-unico',
 *     name: 'Nombre Mostrado',
 *     icon: 'Emoji o ícono',
 *     areas: [{ id, name }, ...],
 *     applicableGrades: [1, 2, 3, 4, 5, 6],
 *     sheetNamePattern: función(area, grado) → nombre origen,
 *     destSheetPattern: función(area, grado) → nombre destino
 *   }
 * }
 */

const SPECIAL_SUBJECTS_CONFIG = {
  // ============= INGLÉS =============
  'ing-001': {
    id: 'ing-001',
    name: 'Inglés',
    description: 'Idiomas modernos y comunicación en inglés',
    icon: '🌐',
    color: '#2196F3',  // Azul

    // Áreas que ofrece esta materia
    areas: [
      { 
        id: 'eng-idiomas', 
        name: 'Idiomas Modernos',
        description: 'Enfoque en conversación y gramática'
      },
      { 
        id: 'eng-conversacion', 
        name: 'Conversación',
        description: 'Oratoria y presentaciones en inglés'
      },
      { 
        id: 'eng-literatura', 
        name: 'Literatura Inglesa',
        description: 'Autores y obras clásicas en inglés'
      }
    ],

    // Grados que atiende esta materia
    applicableGrades: [1, 2, 3, 4, 5, 6],

    // Función para generar nombre de hoja ORIGEN (1er cuatrimestre)
    // Ejemplo: "Inglés Idiomas Modernos 1°"
    sheetNamePattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ing-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `Inglés ${areaName} ${grado}°`;
    },

    // Función para generar nombre de hoja DESTINO (2do cuatrimestre)
    // Ejemplo: "2do Cuatrimestre 1° Inglés (Idiomas Modernos)"
    destSheetPattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ing-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `2do Cuatrimestre ${grado}° Inglés (${areaName})`;
    }
  },

  // ============= INFORMÁTICA =============
  'inf-001': {
    id: 'inf-001',
    name: 'Informática',
    description: 'Tecnología y programación',
    icon: '💻',
    color: '#4CAF50',  // Verde

    areas: [
      { 
        id: 'inf-computacion', 
        name: 'Computación',
        description: 'Uso de software y herramientas'
      },
      { 
        id: 'inf-programacion', 
        name: 'Programación',
        description: 'Lenguajes de programación'
      },
      { 
        id: 'inf-robotica', 
        name: 'Robótica',
        description: 'Robótica educativa y control'
      }
    ],

    applicableGrades: [1, 2, 3, 4, 5, 6],

    sheetNamePattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['inf-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `Informática ${areaName} ${grado}°`;
    },

    destSheetPattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['inf-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `2do Cuatrimestre ${grado}° Informática (${areaName})`;
    }
  },

  // ============= EDUCACIÓN FÍSICA =============
  'ef-001': {
    id: 'ef-001',
    name: 'Educación Física',
    description: 'Deportes y actividad física',
    icon: '⚽',
    color: '#FF9800',  // Naranja

    areas: [
      { 
        id: 'ef-deportes', 
        name: 'Deportes',
        description: 'Prácticas deportivas variadas'
      },
      { 
        id: 'ef-gimnasia', 
        name: 'Gimnasia',
        description: 'Ejercicios de gimnasia y acondicionamiento'
      },
      { 
        id: 'ef-natacion', 
        name: 'Natación',
        description: 'Cursos de natación'
      }
    ],

    applicableGrades: [1, 2, 3, 4, 5, 6],

    sheetNamePattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ef-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `Ed. Física ${areaName} ${grado}°`;
    },

    destSheetPattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ef-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `2do Cuatrimestre ${grado}° Ed. Física (${areaName})`;
    }
  },

  // ============= ARTES PLÁSTICAS =============
  'ap-001': {
    id: 'ap-001',
    name: 'Artes Plásticas',
    description: 'Artes visuales y plásticas',
    icon: '🎨',
    color: '#9C27B0',  // Púrpura

    areas: [
      { 
        id: 'ap-dibujo', 
        name: 'Dibujo',
        description: 'Técnicas de dibujo y composición'
      },
      { 
        id: 'ap-pintura', 
        name: 'Pintura',
        description: 'Pintura y técnicas pictóricas'
      },
      { 
        id: 'ap-escultura', 
        name: 'Escultura',
        description: 'Técnicas de escultura y modelado'
      }
    ],

    applicableGrades: [1, 2, 3],

    sheetNamePattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ap-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `Artes ${areaName} ${grado}°`;
    },

    destSheetPattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['ap-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `2do Cuatrimestre ${grado}° Artes (${areaName})`;
    }
  },

  // ============= MÚSICA =============
  'mus-001': {
    id: 'mus-001',
    name: 'Música',
    description: 'Educación musical',
    icon: '🎵',
    color: '#E91E63',  // Rosa

    areas: [
      { 
        id: 'mus-vocales', 
        name: 'Vocales',
        description: 'Canto e técnica vocal'
      },
      { 
        id: 'mus-instrumentos', 
        name: 'Instrumentos',
        description: 'Práctica de instrumentos musicales'
      },
      { 
        id: 'mus-teoria', 
        name: 'Teoría Musical',
        description: 'Teoría y solfeo musical'
      }
    ],

    applicableGrades: [1, 2, 3, 4, 5, 6],

    sheetNamePattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['mus-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `Música ${areaName} ${grado}°`;
    },

    destSheetPattern: (area, grado) => {
      const areaName = SPECIAL_SUBJECTS_CONFIG['mus-001'].areas
        .find(a => a.id === area)?.name || 'Desconocida';
      return `2do Cuatrimestre ${grado}° Música (${areaName})`;
    }
  }
};

// ================================================================
// SECCIÓN 2: FUNCIONES HELPER (READY TO USE)
// ================================================================

/**
 * Obtener lista de todas las materias especiales
 * Retorna: [{ id, name, icon, description }, ...]
 */
function getSpecialSubjectsList() {
  return Object.values(SPECIAL_SUBJECTS_CONFIG)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(subj => ({
      id: subj.id,
      name: subj.name,
      icon: subj.icon,
      description: subj.description,
      color: subj.color
    }));
}

/**
 * Obtener áreas de una materia específica
 * @param {string} subjectId - ID de la materia
 * @returns {Array} Array de áreas disponibles
 */
function getAreasForSubject(subjectId) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  if (!subject) return [];
  return subject.areas || [];
}

/**
 * Obtener grados aplicables para una materia
 * @param {string} subjectId - ID de la materia
 * @returns {Array<number>} Array de grados (1-6)
 */
function getGradesForSubject(subjectId) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  if (!subject) return [];
  return subject.applicableGrades || [];
}

/**
 * Validar si una combinación materia+área+grado es válida
 * @param {string} subjectId - ID de materia
 * @param {string} areaId - ID de área
 * @param {number} grade - Grado (1-6)
 * @returns {object} { valid: bool, error: string }
 */
function validateSubjectAreaGradeCombination(subjectId, areaId, grade) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  
  if (!subject) {
    return { 
      valid: false, 
      error: `Materia especial "${subjectId}" no encontrada en configuración` 
    };
  }

  // Validar grado
  if (!subject.applicableGrades.includes(parseInt(grade))) {
    return { 
      valid: false, 
      error: `Grado ${grade} no es válido para ${subject.name}. Grados aplicables: ${subject.applicableGrades.join(', ')}` 
    };
  }

  // Validar área
  const area = subject.areas.find(a => a.id === areaId);
  if (!area) {
    const areasDisponibles = subject.areas.map(a => a.name).join(', ');
    return { 
      valid: false, 
      error: `Área "${areaId}" no encontrada para ${subject.name}. Áreas disponibles: ${areasDisponibles}` 
    };
  }

  return { valid: true };
}

/**
 * Obtener nombre de hoja de origen (1er cuatrimestre)
 * @param {string} subjectId - ID de materia
 * @param {string} areaId - ID de área
 * @param {number} grade - Grado
 * @returns {string} Nombre de la hoja
 */
function getOriginSheetName(subjectId, areaId, grade) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  if (!subject || !subject.sheetNamePattern) return null;
  
  try {
    return subject.sheetNamePattern(areaId, grade);
  } catch (e) {
    console.error('Error generando nombre de hoja origen:', e);
    return null;
  }
}

/**
 * Obtener nombre de hoja de destino (2do cuatrimestre)
 * @param {string} subjectId - ID de materia
 * @param {string} areaId - ID de área
 * @param {number} grade - Grado
 * @returns {string} Nombre de la hoja
 */
function getDestinationSheetName(subjectId, areaId, grade) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  if (!subject || !subject.destSheetPattern) return null;
  
  try {
    return subject.destSheetPattern(areaId, grade);
  } catch (e) {
    console.error('Error generando nombre de hoja destino:', e);
    return null;
  }
}

/**
 * Obtener información completa de una materia
 * @param {string} subjectId - ID de materia
 * @returns {object} Objeto con toda la información de la materia
 */
function getSubjectInfo(subjectId) {
  return SPECIAL_SUBJECTS_CONFIG[subjectId] || null;
}

// ================================================================
// SECCIÓN 3: FUNCIONES DE VALIDACIÓN Y UTILIDAD
// ================================================================

/**
 * Verificar si hay al menos una materia especial configurada
 */
function hasSpecialSubjects() {
  return Object.keys(SPECIAL_SUBJECTS_CONFIG).length > 0;
}

/**
 * Obtener el nombre corto de una materia (para labels en logs)
 * Ejemplo: "Inglés" → "ING", "Informática" → "INF"
 * @param {string} subjectId - ID de materia
 * @returns {string} Nombre corto (3 caracteres)
 */
function getSubjectShortName(subjectId) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  if (!subject) return '???';
  
  // Tomar primeras 3 letras del nombre en mayúscula
  return subject.name.substring(0, 3).toUpperCase();
}

/**
 * Obtener el ícono de una materia
 * @param {string} subjectId - ID de materia
 * @returns {string} Ícono/emoji
 */
function getSubjectIcon(subjectId) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  return subject?.icon || '📚';
}

/**
 * Obtener el color de una materia (para UI)
 * @param {string} subjectId - ID de materia
 * @returns {string} Color en formato hex
 */
function getSubjectColor(subjectId) {
  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  return subject?.color || '#999999';
}

/**
 * Generar un objeto con toda la información para enviar al backend
 * @param {string} subjectId - ID de materia
 * @param {string} areaId - ID de área
 * @param {number} grade - Grado
 * @returns {object} Objeto listo para payload
 */
function createSpecialSubjectPayload(subjectId, areaId, grade) {
  // Validar primero
  const validation = validateSubjectAreaGradeCombination(subjectId, areaId, grade);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const subject = SPECIAL_SUBJECTS_CONFIG[subjectId];
  const area = subject.areas.find(a => a.id === areaId);

  return {
    id: subjectId,
    name: subject.name,
    icon: subject.icon,
    area: areaId,
    areaName: area.name,
    grado: grade,
    originSheet: getOriginSheetName(subjectId, areaId, grade),
    destSheet: getDestinationSheetName(subjectId, areaId, grade)
  };
}

// ================================================================
// SECCIÓN 4: EJEMPLOS DE USO
// ================================================================

/*
// EJEMPLO 1: Obtener lista de materias
const materias = getSpecialSubjectsList();
console.log(materias);
// Output: [
//   { id: 'ing-001', name: 'Inglés', icon: '🌐', ... },
//   { id: 'inf-001', name: 'Informática', icon: '💻', ... },
//   ...
// ]

// EJEMPLO 2: Obtener áreas de Inglés
const areasIngles = getAreasForSubject('ing-001');
console.log(areasIngles);
// Output: [
//   { id: 'eng-idiomas', name: 'Idiomas Modernos', description: '...' },
//   { id: 'eng-conversacion', name: 'Conversación', description: '...' },
//   ...
// ]

// EJEMPLO 3: Obtener grados de Informática
const gradosInfo = getGradesForSubject('inf-001');
console.log(gradosInfo);
// Output: [1, 2, 3, 4, 5, 6]

// EJEMPLO 4: Validar combinación
const validation = validateSubjectAreaGradeCombination('ing-001', 'eng-idiomas', 1);
console.log(validation);
// Output: { valid: true }

// EJEMPLO 5: Obtener nombre de hoja origen
const originSheet = getOriginSheetName('ing-001', 'eng-idiomas', 1);
console.log(originSheet);
// Output: "Inglés Idiomas Modernos 1°"

// EJEMPLO 6: Obtener nombre de hoja destino
const destSheet = getDestinationSheetName('ing-001', 'eng-idiomas', 1);
console.log(destSheet);
// Output: "2do Cuatrimestre 1° Inglés (Idiomas Modernos)"

// EJEMPLO 7: Crear payload completo
const payload = createSpecialSubjectPayload('inf-001', 'inf-programacion', 3);
console.log(payload);
// Output: {
//   id: 'inf-001',
//   name: 'Informática',
//   icon: '💻',
//   area: 'inf-programacion',
//   areaName: 'Programación',
//   grado: 3,
//   originSheet: 'Informática Programación 3°',
//   destSheet: '2do Cuatrimestre 3° Informática (Programación)'
// }
*/

// ================================================================
// SECCIÓN 5: EXPORTAR PARA MODULES (OPCIONAL)
// ================================================================

// Si usas módulos ES6:
// export {
//   SPECIAL_SUBJECTS_CONFIG,
//   getSpecialSubjectsList,
//   getAreasForSubject,
//   getGradesForSubject,
//   validateSubjectAreaGradeCombination,
//   getOriginSheetName,
//   getDestinationSheetName,
//   getSubjectInfo,
//   hasSpecialSubjects,
//   getSubjectShortName,
//   getSubjectIcon,
//   getSubjectColor,
//   createSpecialSubjectPayload
// };

console.log('✅ Configuración de Materias Especiales cargada');
console.log('Materias disponibles:', getSpecialSubjectsList().length);
