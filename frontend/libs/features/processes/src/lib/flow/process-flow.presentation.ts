import { ProcessTaskType } from '../models/process.models';

export type TaskCategory = 'motor' | 'swift-mt101';

export function taskCategory(type: ProcessTaskType): TaskCategory {
  return type.startsWith('MT101_') ? 'swift-mt101' : 'motor';
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  motor: 'Motor',
  'swift-mt101': 'SWIFT MT101',
};

export interface ProcessFlowNodePresentation {
  badge: string;
  toneClass: string;
  iconPath: string;
}

const NODE_PRESENTATION: Record<ProcessTaskType, ProcessFlowNodePresentation> = {
  FILE_READ: {
    badge: 'READ',
    toneClass: 'task-node--source',
    iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6M8 13h8M8 17h8M8 9h3',
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
  MT101_BUILD: {
    badge: 'BUILD',
    toneClass: 'task-node--payment',
    iconPath: 'M4 6h16M4 10h10M4 14h16M4 18h10M18 8l3 3-3 3M18 16l3-3',
  },
  MT101_BUILD_FROM_TABLE: {
    badge: 'BUILD DB',
    toneClass: 'task-node--payment',
    iconPath: 'M4 6h16M4 10h10M4 14h16M4 18h10M18 8l3 3-3 3M18 16l3-3',
  },
  MT101_VALIDATE: {
    badge: 'NVR',
    toneClass: 'task-node--payment-validate',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  MT101_ARCHIVE: {
    badge: 'ARCHIVE',
    toneClass: 'task-node--payment-archive',
    iconPath: 'M5 8h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm0 0V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M9 12h6M9 16h6',
  },
  MT101_PAY: {
    badge: 'PAY',
    toneClass: 'task-node--payment-dispatch',
    iconPath: 'M3 10h18M3 14h18M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 14h2',
  },
  // --- Sprint 2 (spec 008) ---
  MT101_ROUTE: {
    badge: 'ROUTE',
    toneClass: 'task-node--payment-route',
    iconPath: 'M4 6h8a4 4 0 0 1 0 8H6a4 4 0 0 0 0 8h6m4-16h4l-3-3M16 14h4l-3 3',
  },
  MT101_RECONCILE: {
    badge: 'RECON',
    toneClass: 'task-node--payment-reconcile',
    iconPath: 'M4 8h6m0 0L7 5m3 3L7 11m13 5h-6m0 0l3-3m-3 3l3 3',
  },
  MT101_STATUS: {
    badge: 'STATUS',
    toneClass: 'task-node--payment-status',
    iconPath: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  MT101_PARSE: {
    badge: 'PARSE',
    toneClass: 'task-node--payment-parse',
    iconPath: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h2M8 17h2M14 7h2M14 17h2',
  },
  // --- Sprint 3 (spec 008) ---
  MT101_SPLIT: {
    badge: 'SPLIT',
    toneClass: 'task-node--payment-split',
    iconPath: 'M12 4v16M4 8l8 8 8-8M4 16h16',
  },
  MT101_REPAIR: {
    badge: 'REPAIR',
    toneClass: 'task-node--payment-repair',
    iconPath: 'M14 3l7 7-11 11H3v-7zM14 3l-3 3 7 7 3-3z',
  },
  // --- Inbound a escala (table-backed) ---
  MT101_PARSE_FROM_TABLE: {
    badge: 'PARSE',
    toneClass: 'task-node--payment-parse',
    iconPath: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h2M8 17h2M14 7h2M14 17h2',
  },
  MT101_INBOUND_DELIVER: {
    badge: 'DELIVER',
    toneClass: 'task-node--payment-dispatch',
    iconPath: 'M3 10h18M3 14h18M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 14h2',
  },
};

export function getProcessFlowNodePresentation(taskType: ProcessTaskType): ProcessFlowNodePresentation {
  return NODE_PRESENTATION[taskType];
}
