/**
 * Tipos de tarea reconocidos por el motor de procesos (spec 003).
 *
 * <p>Tipos base del motor: {@code FILE_READ}, {@code DB_WRITE}, {@code DB_EXECUTE_SP},
 * {@code DB_EXECUTE_FN}, {@code REST_CALL}, {@code NOTIFICATION}.</p>
 *
 * <p>Tipos de la vertical mensajeria de pagos (spec 008): {@code MT101_BUILD_FROM_TABLE},
 * {@code MT101_VALIDATE}, {@code MT101_ARCHIVE}, {@code MT101_PAY}.</p>
 *
 * <p><b>Deuda temporal</b>: este union sigue siendo cerrado por parsimonia, en paralelo
 * al enum Java {@code com.integrationhub.platform.domain.TaskType}. El cierre limpio
 * para verticales (M-1b en spec 003, ADR-009) introduce un mecanismo de registro por
 * Injection Token; mientras tanto, los nuevos tipos se documentan aqui con su origen.</p>
 */
export type PlatformProcessTaskType =
  // --- Motor (spec 003) ---
  | 'FILE_READ'
  | 'DB_WRITE'
  | 'DB_EXECUTE_SP'
  | 'DB_EXECUTE_FN'
  | 'REST_CALL'
  | 'NOTIFICATION'
  // --- Capa de salida generica (ADR-016) ---
  | 'FILE_WRITE'
  | 'FILE_COMPRESS'
  | 'FILE_DELIVER'
  // --- Vertical mensajeria de pagos sub-catalogo swift/ (spec 008) ---
  // Sprint 1 (outbound MVP): la construccion en memoria MT101_BUILD se removio (no
  // escala); la unica ruta de construccion es la paginada MT101_BUILD_FROM_TABLE.
  | 'MT101_BUILD_FROM_TABLE'
  | 'MT101_VALIDATE'
  | 'MT101_ARCHIVE'
  | 'MT101_PAY'
  // Sprint 2 (route, reconciliation, status, parse inbound):
  | 'MT101_ROUTE'
  | 'MT101_RECONCILE'
  | 'MT101_STATUS'
  | 'MT101_PARSE'
  // Sprint 3 (split + repair):
  | 'MT101_SPLIT'
  | 'MT101_REPAIR'
  // Inbound a escala (table-backed): parse desde staging + entrega final.
  | 'MT101_PARSE_FROM_TABLE'
  | 'MT101_INBOUND_DELIVER';

/**
 * Tipo de tarea usado por procesos.
 *
 * Los tipos de plataforma siguen tipados por union cerrada en {@link PlatformProcessTaskType}.
 * Los plugins backend aportan tipos remotos en runtime via `/api/task-types`; por eso el
 * contrato público queda abierto sin relajar los mapas exhaustivos del core.
 */
export type ProcessTaskType = PlatformProcessTaskType | (string & {});

export interface SourceRef {
  id: number;
  name: string;
  sourceType?: string;
  active?: boolean;
  configurationJson?: string;
}

export interface ReaderRef {
  id: number;
  name: string;
  readerType?: string;
  active?: boolean;
  configurationJson?: string;
}

export interface ConnectionRef {
  id: number;
  name: string;
  connectionType: string;
}

export interface ProcessTaskFormModel {
  clientId: string;
  id: number | null;
  taskOrder: number;
  taskType: ProcessTaskType;
  active: boolean;
  sourceDefinitionId: number | null;
  readerDefinitionId: number | null;
  configurationJson: string;
}
