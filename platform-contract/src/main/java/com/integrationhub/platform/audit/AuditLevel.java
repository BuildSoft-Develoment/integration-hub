package com.integrationhub.platform.audit;

/**
 * Granularidad de la trama de auditoria.
 *
 * <ul>
 *   <li>{@code PROCESS} - eventos de ciclo de vida de proceso/tarea (los que la UI consulta).</li>
 *   <li>{@code RECORD}  - eventos por registro individual (xls/csv/txt/otros) para trazabilidad E2E.</li>
 * </ul>
 */
public enum AuditLevel {
    PROCESS,
    RECORD
}
