/** Salud agregada del backbone async (ADR-015) para el tile del overview. */
export interface AsyncHealth {
  /** Total de filas muertas del DLQ (outbox + inbox + poison). */
  readonly dead: number;
  /** Scatters streaming estancados (sin progreso por > umbral). */
  readonly stalled: number;
}
