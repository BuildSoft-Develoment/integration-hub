package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Map;

/** Adapter de store para el ledger correctivo de PAY. El SQL vive en repository. */
@ApplicationScoped
public class Mt101CorrectivePayStore {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101RebuildRepository rebuildRepository;

    @Inject
    public Mt101CorrectivePayStore(DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101RebuildRepository rebuildRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.rebuildRepository = rebuildRepository;
    }

    public void markDispatching(Map<String, Object> fragmentSource,
                                String rebuildRunId,
                                String sendersReference) {
        if (rebuildRunId == null || rebuildRunId.isBlank()
                || sendersReference == null || sendersReference.isBlank()) {
            return;
        }
        try {
            rebuildRepository.markPayFragmentDispatching(
                    resolveDataSource(stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef"))),
                    rebuildRunId,
                    sendersReference);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot mark MT101 corrective PAY fragment as DISPATCHING: "
                    + sendersReference, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String stringValue(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }
}
