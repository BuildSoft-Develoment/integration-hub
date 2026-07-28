import { ProcessFlowNodePresentation } from '@integration-hub/shared/models';
import { PlatformProcessTaskType, ProcessTaskType } from '../models/process.models';

/**
 * ADR-021: identificador de agrupacion, ABIERTO. Cada vertical usa el suyo (`swift-mt101`,
 * `sbs`, ...) declarandolo en el descriptor de su provider; el motor solo conoce los dos
 * cajones propios de abajo.
 */
export type TaskCategory = string;

/** Cajon de los tipos del propio motor. */
export const CATEGORY_MOTOR = 'motor';
/** Cajon por defecto de lo que no declara categoria (plugins de terceros, tipos sueltos). */
export const CATEGORY_PLUGIN = 'plugin';

/** Tipos del motor. Es legitimo que el motor conozca los SUYOS; no conoce los de ningun vertical. */
const PLATFORM_TASK_TYPES = new Set<string>([
  'FILE_READ',
  'FILE_WRITE',
  'FILE_COMPRESS',
  'FILE_DELIVER',
  'DB_WRITE',
  'DB_EXECUTE_SP',
  'DB_EXECUTE_FN',
  'REST_CALL',
  'NOTIFICATION',
]);

/**
 * Categoria del tipo: la que DECLARA el provider y, si no declara, el cajon que corresponda.
 * Antes se infería con `type.startsWith('MT101_')` — el motor tenia el nombre de un estandar
 * SWIFT cableado como condicion de branching, y un vertical nuevo caia en "Plugins".
 */
export function taskCategory(descriptor: { type: ProcessTaskType; category?: string }): TaskCategory {
  const declared = descriptor.category?.trim();
  if (declared) {
    return declared;
  }
  return PLATFORM_TASK_TYPES.has(descriptor.type) ? CATEGORY_MOTOR : CATEGORY_PLUGIN;
}

/** Clave i18n de la etiqueta del grupo. Un vertical aporta la suya por `registerMessages()`. */
export function categoryLabelKey(category: TaskCategory): string {
  return `processTask.category.${category}`;
}

/** ADR-021: el contrato vive en shared/models para que un provider pueda declararlo. */
export type { ProcessFlowNodePresentation } from '@integration-hub/shared/models';

/**
 * ADR-021: defaults de los tipos que el motor ya conoce. NO es total: un vertical o un plugin
 * declara el suyo en el descriptor del provider, sin editar esta lib.
 */
// ADR-021: SOLO los tipos del motor. El nodo de un vertical lo declara su provider en
// `descriptor.nodePresentation`; aca vivian los 12 de MT101 con su badge, tono e icono SVG.
const NODE_PRESENTATION: Partial<Record<PlatformProcessTaskType, ProcessFlowNodePresentation>> = {
  FILE_READ: {
    badge: 'READ',
    toneClass: 'task-node--source',
    iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6M8 13h8M8 17h8M8 9h3',
  },
  FILE_WRITE: {
    badge: 'FILE',
    toneClass: 'task-node--source',
    // save/diskette: escribe/genera el archivo de salida (distinto del file-text de READ).
    iconPath: 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7',
  },
  FILE_COMPRESS: {
    badge: 'ZIP',
    toneClass: 'task-node--source',
    // package/caja: comprime a archivo (ZIP/GZIP).
    iconPath: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zM12 22V12m3.3-5 8.7 5 8.7-5m7.5 4.27 9 5.15',
  },
  FILE_DELIVER: {
    badge: 'SEND',
    toneClass: 'task-node--source',
    // send/avion: entrega el archivo al sink de salida (filesystem/SFTP).
    iconPath: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  },
  DB_WRITE: {
    badge: 'WRITE',
    toneClass: 'task-node--database',
    iconPath: 'M12 3c-4.97 0-9 1.79-9 4v10c0 2.21 4.03 4 9 4s9-1.79 9-4V7c0-2.21-4.03-4-9-4m0 2c4.42 0 7 .99 7 2s-2.58 2-7 2-7-.99-7-2 2.58-2 7-2m0 14c-4.42 0-7-.99-7-2v-2c1.55 1.03 4.28 1.5 7 1.5s5.45-.47 7-1.5v2c0 1.01-2.58 2-7 2m0-5c-4.42 0-7-.99-7-2v-2c1.55 1.03 4.28 1.5 7 1.5s5.45-.47 7-1.5v2c0 1.01-2.58 2-7 2',
  },
  DB_EXECUTE_SP: {
    badge: 'SP',
    toneClass: 'task-node--procedure',
    iconPath: 'M8 4 4 8l4 4M16 4l4 4-4 4M14 20l-4-16',
  },
  DB_EXECUTE_FN: {
    badge: 'FN',
    toneClass: 'task-node--function',
    iconPath: 'M9 4h10M9 8h7M9 12h10M5 4v16M5 12h4',
  },
  REST_CALL: {
    badge: 'REST',
    toneClass: 'task-node--integration',
    iconPath: 'M8 12h8M12 8l4 4-4 4M4 5h8M4 19h8',
  },
  NOTIFICATION: {
    badge: 'NOTIFY',
    toneClass: 'task-node--notification',
    iconPath: 'M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.59 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9',
  },
  // --- Vertical mensajeria de pagos sub-catalogo swift/ (spec 008, ADR-009) ---
};

/**
 * Visual del nodo. ADR-021: gana la que DECLARA el provider (`descriptor.nodePresentation`),
 * luego el default de los tipos propios del motor, y por ultimo la generica derivada del nombre.
 */
export function getProcessFlowNodePresentation(
  taskType: ProcessTaskType,
  declared?: ProcessFlowNodePresentation,
): ProcessFlowNodePresentation {
  return declared ?? NODE_PRESENTATION[taskType as PlatformProcessTaskType] ?? remotePresentation(taskType);
}

function remotePresentation(taskType: ProcessTaskType): ProcessFlowNodePresentation {
  return {
    badge: compactRemoteBadge(taskType),
    toneClass: 'task-node--integration',
    iconPath: 'M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4m-2 5h4V6a2 2 0 1 0-4 0zm-3 5h10M9 16h6',
  };
}

function compactRemoteBadge(taskType: ProcessTaskType): string {
  const parts = String(taskType).split('_').filter(Boolean);
  const meaningful = parts[0] === 'DEMO' ? parts.slice(1) : parts;
  const badge = meaningful.map((part) => part.charAt(0)).join('').slice(0, 6);
  return badge || 'PLUGIN';
}
