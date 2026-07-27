package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resuelve la cabecera de un lote MT101 (archivo + hash + ejecucion + conteos por
 * estado) por {@code fragmentSetId} o por {@code processExecutionId} — lo que el
 * operador conoce tras correr el proceso. Alimenta la vista unificada de
 * trazabilidad: "del lote → a la fila que fallo → a su traza → a la accion".
 */
@ApplicationScoped
public class Mt101LoteService {

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StagingRecordRepository stagingRepository;

    public Mt101LoteService(DataSource defaultDataSource,
                            JdbcConnectionResolver connectionPoolManager,
                            Mt101FragmentRepository fragmentRepository,
                            Mt101StagingRecordRepository stagingRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.stagingRepository = stagingRepository;
    }

    public LoteHeader header(String connectionRef, String fragmentSetId, Long processExecutionId) {
        if ((fragmentSetId == null || fragmentSetId.isBlank()) && processExecutionId == null) {
            throw new IllegalArgumentException("fragmentSetId or processExecutionId is required");
        }
        var dataSource = resolveDataSource(connectionRef);
        try {
            var ref = fragmentRepository.loteRef(dataSource, fragmentSetId, processExecutionId);
            if (ref == null) {
                return null;
            }
            var source = ref.processExecutionId() == null
                    ? new Mt101StagingRecordRepository.SourceInfo(null, 0)
                    : stagingRepository.sourceInfo(dataSource, ref.processExecutionId());

            var byStatus = new LinkedHashMap<String, Long>();
            long totalFragments = 0;
            for (var count : fragmentRepository.statusCountsBySet(dataSource, ref.fragmentSetId())) {
                byStatus.put(count.status(), count.count());
                totalFragments += count.count();
            }
            return new LoteHeader(
                    ref.fragmentSetId(),
                    ref.processExecutionId(),
                    source.sourceName(),
                    ref.sourceFileHash(),
                    source.rowCount(),
                    totalFragments,
                    byStatus);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve MT101 lote header", error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record LoteHeader(
            String fragmentSetId,
            Long processExecutionId,
            String sourceFileName,
            String sourceFileHash,
            long rowCount,
            long totalFragments,
            Map<String, Long> byStatus
    ) {
    }
}
