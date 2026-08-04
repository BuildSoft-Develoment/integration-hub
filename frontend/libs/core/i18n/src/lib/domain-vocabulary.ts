import { I18nService } from './i18n.service';

/**
 * Resolutor unico de "valor de dominio -> etiqueta y tono".
 *
 * <h3>Por que existe</h3>
 * Habia tres resolutores distintos y ninguno obligatorio, mas un cuarto camino: no llamar a
 * ninguno. El resultado medible era que la MISMA ejecucion se leia `Completada` en #/executions,
 * `Completado` en #/audit/events y `COMPLETED` en #/overview. Un operador no puede reconocer el
 * mismo hecho en tres pantallas si cada una lo nombra a su manera.
 *
 * Vive en `core/i18n` a proposito: la frontera Nx `type:feature -> solo core|shared` impedia que
 * `executions` u `overview` alcanzaran el helper que si traducia, porque estaba dentro de
 * `features/audit`. La frontera no sobraba; el helper estaba del lado equivocado.
 *
 * <h3>Ausencia de clave: se ve, no se disimula</h3>
 * Los helpers anteriores hacian `return translated !== key ? translated : valorCrudo`, es decir,
 * convertian una traduccion que falta en un enum bonito de leer para el programador e ilegible para
 * el operador — y ademas silencioso. Aqui una clave ausente se MARCA y se registra.
 *
 * No lanza en tiempo de ejecucion. Quien exige exhaustividad es el test
 * (`domain-vocabulary.spec.ts`), que recorre los enums del backend y falla el build si falta una
 * sola clave. Lanzar durante el render dejaria la pantalla en blanco a mitad de un incidente de
 * pagos, que para quien esta operando es peor que una etiqueta fea.
 */

/** Familias de valores de dominio que la UI recibe del backend y debe saber nombrar. */
export type VocabularyKind =
  | 'executionStatus'
  | 'taskType'
  | 'auditEvent'
  | 'inboxStatus'
  | 'spoolStatus'
  | 'payDispatchStatus'
  | 'quarantineStatus'
  // El linaje por registro tiene DOS campos y no son lo mismo: `stage` dice que le paso al registro
  // (RECORD_ARCHIVED) y `status` en que estado quedo (ARCHIVED). Mezclarlos en una familia obligaria
  // a que cada valor sirviera para los dos, y no sirven.
  | 'recordStage'
  | 'recordStatus';

export type VocabularyTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

/**
 * Prefijo de clave por familia. Un solo espacio por familia: los duplicados (`audit.status.*`,
 * `taskTypeLabel.*`) se eliminaron en vez de dejarse "por compatibilidad".
 */
const PREFIJO: Record<VocabularyKind, string> = {
  executionStatus: 'executionStatus',
  taskType: 'processTask',
  auditEvent: 'audit.eventLabel',
  inboxStatus: 'inboxStatus',
  spoolStatus: 'spoolStatus',
  payDispatchStatus: 'payDispatchStatus',
  quarantineStatus: 'quarantineStatus',
  recordStage: 'recordStage',
  recordStatus: 'recordStatus',
};

/**
 * Tono por valor.
 *
 * <p>El ambar y el rojo NO son intercambiables, y esta es la regla mas importante del fichero:
 * ambar significa "no sabemos, mirelo una persona" y rojo significa "salio mal". Confundirlos hace
 * que un operador reintente un pago que quiza ya salio. Por eso `NEEDS_RECONCILIATION` y
 * `UNCERTAIN` son `warning`, y `REJECTED`/`FAILED` son `danger`. Es la misma separacion que fija el
 * prototipo aprobado de 008 (`sello--incierto` en ambar frente a `sello--rechazado` en rojo).</p>
 *
 * <p>Un valor sin entrada aqui cae a `neutral`, que es lo correcto para lo que no es un estado
 * (tipos de tarea, tipos de evento). Que un ESTADO caiga a neutral es un defecto, y lo caza el
 * test de tonos, no este mapa.</p>
 */
const TONO: Partial<Record<VocabularyKind, Record<string, VocabularyTone>>> = {
  executionStatus: {
    PENDING: 'neutral',
    RUNNING: 'info',
    // En vuelo esperando una devolucion de llamada: normal, no exige a nadie.
    SUSPENDED: 'info',
    // La ejecucion inicio un efecto NO idempotente y no pudo confirmarlo. Nunca reprocesar a
    // ciegas. Iba en gris neutro, indistinguible de PENDING, en overview Y en executions.
    NEEDS_RECONCILIATION: 'warning',
    COMPLETED: 'success',
    COMPLETED_WITH_ERRORS: 'warning',
    FAILED: 'danger',
    // Estado de tarea: se quedo sin nodo a media ejecucion. Ambar, no gris, porque puede haber
    // escrito parte de su trabajo antes de caer — se ha medido un DB_WRITE que dejo miles de filas
    // en un intento abortado. Y ambar, no rojo, porque no fallo: no sabemos si termino.
    ABORTED: 'warning',
  },
  payDispatchStatus: {
    DISPATCHING: 'info',
    SENT: 'success',
    // Salio al banco y no sabemos el resultado.
    UNCERTAIN: 'warning',
    // NO salio al banco (fallo de transporte reintentable). No es un rechazo de negocio y no puede
    // pintarse como tal: quien lo lea decide si reenvia.
    INVALIDATED: 'warning',
    // El banco dijo que no.
    REJECTED: 'danger',
  },
  spoolStatus: {
    PENDING: 'neutral',
    IN_FLIGHT: 'info',
    SENT: 'success',
    DEAD: 'danger',
  },
  inboxStatus: {
    CLAIMED: 'info',
    PROCESSED: 'success',
    FAILED: 'danger',
    DEAD: 'danger',
    POISON: 'danger',
  },
  recordStatus: {
    INGESTED: 'info',
    BUILT: 'info',
    VALIDATED: 'info',
    ROUTED: 'info',
    ARCHIVED: 'success',
    CONFIRMED: 'success',
    CORRECTED: 'info',
    // El banco no reconoce el registro: no es un fallo tecnico, es una discrepancia que alguien
    // tiene que resolver antes de dar el pago por bueno.
    UNMATCHED: 'warning',
    REJECTED: 'danger',
  },
  quarantineStatus: {
    QUARANTINED: 'warning',
    CORRECTED: 'info',
    APPROVED: 'success',
    REJECTED: 'danger',
    REBUILD_PENDING_VALIDATION: 'info',
    REBUILD_VALIDATED: 'info',
    REBUILD_CONFIRMED: 'info',
    REBUILD_SENT: 'success',
    REBUILD_ARCHIVED: 'success',
    REBUILD_REJECTED: 'danger',
    REBUILD_REOPEN: 'warning',
  },
};

/** Clave i18n de un valor de dominio. Publica para que los tests puedan exigir exhaustividad. */
export function vocabularyKey(kind: VocabularyKind, value: string): string {
  return `${PREFIJO[kind]}.${value}`;
}

/**
 * Etiqueta legible de un valor de dominio.
 *
 * Un valor vacio o nulo devuelve `-` (no hay dato, y eso no es un fallo de traduccion).
 * Un valor sin clave se devuelve MARCADO y deja rastro en consola: se ve que falta.
 */
export function resolveVocabulary(
  i18n: I18nService,
  kind: VocabularyKind,
  value: string | null | undefined,
): string {
  if (!value) {
    return '-';
  }

  const key = vocabularyKey(kind, value);
  if (i18n.has(key)) {
    return i18n.t(key);
  }

  // Ruidoso a proposito. El helper anterior devolvia `value` aqui y nadie se enteraba nunca.
  console.error(
    `[i18n] vocabulario sin clave: ${key}. La UI mostrara el valor crudo marcado.` +
      ' Anadelo al diccionario del modulo que emite ese valor.',
  );
  return `⚠ ${value}`;
}

/**
 * Tono semantico del valor, para colorear su distintivo.
 *
 * Sustituye a las copias de `statusTone()` que vivian en cada pantalla y que, por copiarse entre
 * si, compartian el mismo agujero: ninguna contemplaba `NEEDS_RECONCILIATION`.
 */
export function vocabularyTone(kind: VocabularyKind, value: string | null | undefined): VocabularyTone {
  if (!value) {
    return 'neutral';
  }
  return TONO[kind]?.[value] ?? 'neutral';
}

/** Valores con tono declarado de una familia. Lo usa el test de exhaustividad de tonos. */
export function tonedValues(kind: VocabularyKind): readonly string[] {
  return Object.keys(TONO[kind] ?? {});
}
