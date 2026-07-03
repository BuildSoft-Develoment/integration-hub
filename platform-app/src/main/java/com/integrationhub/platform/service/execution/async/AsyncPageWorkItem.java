package com.integrationhub.platform.service.execution.async;

import java.util.Map;

/**
 * Payload de una <b>página</b> del scatter por <b>table-streaming</b> (ADR-015, page-chain). Cuando una
 * tarea batch/per-record async tiene input por tabla (N desconocido), no se despachan N slices upfront:
 * se encola <b>una</b> página semilla y <b>cada consumer encola la siguiente</b> (keyset paging por
 * {@code orderBy}), auto-propagando la cadena hasta agotar la tabla. Así el dispatch es distribuido
 * (no bloquea el motor), con memoria acotada a una página, y la recuperación es automática por
 * at-least-once (la reentrega re-encola la siguiente, dedup por key determinista).
 *
 * <p>El work-item lleva lo necesario para leer su página y continuar la cadena, más el contexto
 * serializable (Nivel 2) para rehidratar el {@code TaskContext} del provider.</p>
 *
 * @param table              tabla a paginar
 * @param connectionRef      datasource (null = default)
 * @param orderBy            columna de cursor keyset (estable)
 * @param filters            filtros de la consulta
 * @param batchSize          filas por página
 * @param cursor             último key de la página anterior (null = primera página / seed). <b>Nota</b>:
 *                           viaja por JSON entre páginas, así que {@code orderBy} debe ser una columna de
 *                           tipo JSON-estable (entero/bigint/texto). Tipos como timestamp/UUID/binario
 *                           podrían degradarse en el round-trip y romper el keyset (a diferencia del path
 *                           síncrono, que mantiene el cursor tipado en memoria).
 * @param pageIndex          índice 0-based de esta página (para sellar total = índice+1 en la última)
 * @param configuration      configuración resuelta de la tarea
 * @param taskOutputs        outputs de las tareas origen (contexto propagado)
 * @param metadata           metadata de ejecución de la tarea
 * @param executionVariables variables de ejecución del proceso
 */
public record AsyncPageWorkItem(
        String table,
        String connectionRef,
        String orderBy,
        Map<String, Object> filters,
        int batchSize,
        Object cursor,
        int pageIndex,
        Map<String, Object> configuration,
        Map<String, Object> taskOutputs,
        Map<String, Object> metadata,
        Map<String, String> executionVariables) {

    public AsyncPageWorkItem {
        filters = filters == null ? Map.of() : filters;
        configuration = configuration == null ? Map.of() : configuration;
        taskOutputs = taskOutputs == null ? Map.of() : taskOutputs;
        metadata = metadata == null ? Map.of() : metadata;
        executionVariables = executionVariables == null ? Map.of() : executionVariables;
    }

    public static AsyncPageWorkItem seed(String table, String connectionRef, String orderBy,
                                         Map<String, Object> filters, int batchSize,
                                         Map<String, Object> configuration, Map<String, Object> taskOutputs,
                                         Map<String, Object> metadata, Map<String, String> executionVariables) {
        return new AsyncPageWorkItem(table, connectionRef, orderBy, filters, batchSize, null, 0,
                configuration, taskOutputs, metadata, executionVariables);
    }

    /** Siguiente página con el cursor avanzado y el índice incrementado, mismo contexto. */
    public AsyncPageWorkItem next(Object nextCursor) {
        return new AsyncPageWorkItem(table, connectionRef, orderBy, filters, batchSize, nextCursor, pageIndex + 1,
                configuration, taskOutputs, metadata, executionVariables);
    }
}
