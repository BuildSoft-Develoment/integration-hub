package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.List;

/** Consulta operacional para resolver filas origen hacia fragmentos MT101. */
@ApplicationScoped
public class Mt101FragmentLookupService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository repository;

    public Mt101FragmentLookupService(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101FragmentRepository repository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
    }

    public List<Mt101FragmentRepository.FragmentLookupRow> findBySourceRow(String connectionRef,
                                                                           Long recordNumber,
                                                                           String sourceFileHash,
                                                                           String sourceTable,
                                                                           Long processExecutionId,
                                                                           String fragmentSetId,
                                                                           int limit) {
        if (recordNumber == null || recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        var hash = requireSourceFileHash(sourceFileHash);
        try {
            return repository.findBySourceRecord(resolveDataSource(connectionRef),
                    recordNumber, hash, blankToNull(sourceTable), processExecutionId,
                    blankToNull(fragmentSetId), Math.min(Math.max(limit, 1), 100));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve MT101 fragment for source row " + recordNumber, error);
        }
    }

    /** Resumen del lote: conteo de fragmentos por estado + total. */
    public List<Mt101FragmentRepository.StatusCount> statusCounts(String connectionRef, String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return repository.statusCountsBySet(resolveDataSource(connectionRef), fragmentSetId.trim());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot summarize MT101 fragment set " + fragmentSetId, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String requireSourceFileHash(String sourceFileHash) {
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required for MT101 source-row lookup");
        }
        return sourceFileHash.trim();
    }
}
