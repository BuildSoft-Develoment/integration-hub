// Utilidades puras para los timelines E2E (record-lineage y cuarentena):
// clasificación semántica del estado, icono Tabler y duración entre hitos.

const OK_STATES = new Set([
  'SENT', 'ARCHIVED', 'VALIDATED', 'INGESTED', 'BUILT', 'CONFIRMED', 'RECONCILED', 'RESOLVED', 'COMPOSED',
]);
const ERROR_STATES = new Set([
  'REJECTED', 'ERROR', 'DEAD', 'FAILED', 'VALIDATION_ISSUE', 'REBUILD_REJECTED',
]);

export type TimelineStatusKind = 'ok' | 'error' | 'pending';

/** Clasifica un estado de dominio en familia visual (verde / rojo / neutro). */
export function timelineStatusKind(status: string | null | undefined): TimelineStatusKind {
  if (!status) {
    return 'pending';
  }
  const s = status.toUpperCase();
  if (ERROR_STATES.has(s)) {
    return 'error';
  }
  if (OK_STATES.has(s)) {
    return 'ok';
  }
  return 'pending';
}

/** Nombre de icono (ih-icon) que refuerza el estado más allá del color (accesibilidad). */
export function timelineStatusIcon(status: string | null | undefined): string {
  switch (timelineStatusKind(status)) {
    case 'ok':
      return 'check';
    case 'error':
      return 'x';
    default:
      return 'loader';
  }
}

/** Formatea una duración en ms de forma legible para diagnóstico operativo. */
export function formatDurationMs(ms: number): string {
  const value = ms < 0 ? 0 : ms;
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  const seconds = value / 1000;
  if (seconds < 60) {
    return `${Math.round(seconds * 10) / 10}s`;
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return remSeconds ? `${minutes}min ${remSeconds}s` : `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes ? `${hours}h ${remMinutes}min` : `${hours}h`;
}

/** Duración entre dos timestamps ISO; null si falta alguno o no parsean. */
export function durationBetween(prevIso: string | null | undefined, iso: string | null | undefined): string | null {
  if (!prevIso || !iso) {
    return null;
  }
  const a = Date.parse(prevIso);
  const b = Date.parse(iso);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) {
    return null;
  }
  return formatDurationMs(b - a);
}
