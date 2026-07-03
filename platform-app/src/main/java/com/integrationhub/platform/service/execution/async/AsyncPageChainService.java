package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.repository.TaskInputRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.TaskInputResolver;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;

/**
 * Motor de la <b>page-chain</b> del scatter por table-streaming (ADR-015). Encapsula la lectura keyset
 * de una página y la <b>auto-propagación</b> de la cadena: el consumer de cada página encola la
 * siguiente (cursor avanzado) antes de procesar la suya, así el dispatch se distribuye entre workers
 * (no bloquea el motor), con memoria acotada a una página y recuperación automática por at-least-once
 * (la reentrega re-encola la siguiente, dedup por {@code idempotencyKey} determinista {@code page-i}).
 *
 * <p>El {@code taskType}/{@code transport} viajan en el {@link AsyncTaskEnvelope}, no en el work-item.</p>
 */
@ApplicationScoped
public class AsyncPageChainService {

    private final DataSource dataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final TaskInputRepository taskInputRepository;
    private final TaskAsyncDispatchRepository tracker;
    private final TaskOutboxStore outboxStore;
    private final ObjectMapper objectMapper;

    @Inject
    public AsyncPageChainService(DataSource dataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 TaskInputRepository taskInputRepository,
                                 TaskAsyncDispatchRepository tracker,
                                 TaskOutboxStore outboxStore,
                                 ObjectMapper objectMapper) {
        this.dataSource = dataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.taskInputRepository = taskInputRepository;
        this.tracker = tracker;
        this.outboxStore = outboxStore;
        this.objectMapper = objectMapper;
    }

    /**
     * Abre el scatter en streaming y encola la página semilla. Se invoca <b>dentro de la transacción de
     * la suspensión</b> (como el dispatch materializado): open + seed + suspensión commitean juntos, o
     * nada — así la trama de la primera página nunca es visible sin su suspensión.
     */
    public void seed(Long processExecutionId, Long taskDefinitionId, String taskType, String transport,
                     AsyncPageWorkItem seed) {
        tracker.openStreaming(processExecutionId, taskDefinitionId);
        enqueuePage(processExecutionId, taskDefinitionId, taskType, transport, seed);
    }

    /**
     * Lee la página de este work-item y, si hay más filas, <b>encola la siguiente</b> (cursor avanzado)
     * en su propia transacción. Devuelve la página con {@code last}/{@code total} para que el consumer
     * procese sus records, cuente la slice y —si es la última— selle el scatter.
     */
    @Transactional
    public Page readAndChain(AsyncTaskEnvelope envelope, AsyncPageWorkItem item) {
        var records = taskInputRepository.readBatch(
                resolveDataSource(item.connectionRef()),
                item.table(),
                item.orderBy(),
                item.filters(),
                item.cursor(),
                item.batchSize());

        if (records.isEmpty()) {
            // Página vacía: no es slice. Terminador → total = índice (slices fueron 0..índice-1).
            return new Page(List.of(), true, item.pageIndex(), false);
        }
        var nextCursor = TaskInputResolver.cursorValue(records, item.orderBy());
        var last = records.size() < item.batchSize() || nextCursor == null;
        if (last) {
            // Última página con records: es la slice de índice pageIndex → total = pageIndex+1.
            return new Page(records, true, item.pageIndex() + 1, true);
        }
        // Página completa: hay más. Encola la siguiente ANTES de procesar (fan-out + retry).
        enqueuePage(envelope.processExecutionId(), envelope.taskDefinitionId(),
                envelope.taskType(), envelope.transport(), item.next(nextCursor));
        return new Page(records, false, -1, true);
    }

    private void enqueuePage(Long processExecutionId, Long taskDefinitionId, String taskType, String transport,
                             AsyncPageWorkItem page) {
        var traceId = "exec-" + processExecutionId;
        var idempotencyKey = TaskIdempotency.key(processExecutionId, taskDefinitionId, "page-" + page.pageIndex());
        var json = serialize(page);
        var envelope = new AsyncTaskEnvelope(
                traceId,
                processExecutionId,
                taskDefinitionId,
                taskType,
                transport,
                idempotencyKey,
                1,
                json,
                Map.of("traceId", traceId, "kind", "PAGE", "pageIndex", String.valueOf(page.pageIndex())));
        outboxStore.enqueue(envelope); // idempotente por idempotencyKey (reentrega no duplica la cadena)
        // Registra esta página como la última despachada, para poder re-inyectarla si la cadena se rompe.
        tracker.recordDispatchedPage(processExecutionId, taskDefinitionId, page.pageIndex(), json);
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return dataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String serialize(AsyncPageWorkItem page) {
        try {
            return objectMapper.writeValueAsString(page);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Página de scatter streaming no serializable", e);
        }
    }

    /**
     * Resultado de leer una página. {@code isSlice}=hay records para procesar (una página vacía no lo es).
     * {@code last}=última página de la cadena; {@code total}=total de slices para sellar (solo si last).
     */
    public record Page(List<ReadRecord> records, boolean last, int total, boolean isSlice) {
    }
}
