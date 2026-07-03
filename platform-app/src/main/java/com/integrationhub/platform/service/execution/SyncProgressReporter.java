package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.TaskSyncProgressRepository;
import org.jboss.logging.Logger;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Reporta el progreso sync <b>en vivo</b> del streaming fastpath (FILE_READ→DB_WRITE) a la tabla
 * dedicada {@code task_sync_progress}, para que la UI de monitoreo pueda pollear el avance de un
 * proceso de 1M registros en vez de ver solo el estado terminal.
 *
 * <p><b>Throttling</b>: el upsert es cada {@link #FLUSH_EVERY_RECORDS} registros (no por lote) para no
 * golpear la DB a escala; un {@link #flush()} final captura la cola por debajo del umbral. El contador
 * es acumulativo del run completo y el upsert escribe el valor <i>absoluto</i> (monótono creciente).</p>
 *
 * <p><b>Thread-safe</b>: los modos paralelos llaman {@link #batchWritten(int)} desde varios hilos; el
 * contador es atómico y el CAS sobre {@code lastFlushed} garantiza un solo upsert por cruce de umbral.
 * <b>Best-effort</b>: un fallo de progreso NO rompe el pipeline (se loguea en debug).</p>
 */
public final class SyncProgressReporter {

    private static final Logger LOG = Logger.getLogger(SyncProgressReporter.class);
    private static final long FLUSH_EVERY_RECORDS = 50_000L;

    private final TaskSyncProgressRepository repository;
    private final Long processExecutionId;
    private final Long taskDefinitionId;
    private final AtomicLong processed = new AtomicLong();
    private final AtomicLong lastFlushed = new AtomicLong();

    public SyncProgressReporter(TaskSyncProgressRepository repository,
                                Long processExecutionId,
                                Long taskDefinitionId) {
        this.repository = repository;
        this.processExecutionId = processExecutionId;
        this.taskDefinitionId = taskDefinitionId;
    }

    /** Suma un lote escrito; upsertea el total absoluto si se cruzó el umbral (un solo flush por cruce). */
    public void batchWritten(int recordCount) {
        if (recordCount <= 0) {
            return;
        }
        long total = processed.addAndGet(recordCount);
        long last = lastFlushed.get();
        if (total - last >= FLUSH_EVERY_RECORDS && lastFlushed.compareAndSet(last, total)) {
            upsert(total);
        }
    }

    /** Flush final: persiste la cola que quedó por debajo del umbral (idempotente). */
    public void flush() {
        long total = processed.get();
        long last = lastFlushed.getAndSet(total);
        if (total > 0 && total != last) {
            upsert(total);
        }
    }

    private void upsert(long total) {
        try {
            repository.upsert(processExecutionId, taskDefinitionId, total);
        } catch (RuntimeException e) {
            LOG.debugf(e, "No se pudo persistir el progreso sync del fastpath exec=%d task=%d",
                    processExecutionId, taskDefinitionId);
        }
    }
}
