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

    /**
     * P0.1 v21: persiste el resultado real de CADA fragmento de la pagina (SENT/REJECTED/UNCERTAIN),
     * no la muestra acotada del output. Asi el ledger es la fuente de verdad para 20k fragmentos.
     */
    public void markResults(Map<String, Object> fragmentSource,
                            String rebuildRunId,
                            java.util.Collection<Mt101RebuildRepository.PayFragmentResult> results) {
        if (rebuildRunId == null || rebuildRunId.isBlank() || results == null || results.isEmpty()) {
            return;
        }
        try {
            rebuildRepository.updatePayFragmentResults(
                    resolveDataSource(stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef"))),
                    rebuildRunId,
                    results);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist MT101 corrective PAY fragment results batch for run "
                    + rebuildRunId, error);
        }
    }

    /**
     * P0.2 v22: transicion atomica PREPARED -> DISPATCHING. Devuelve true solo si se reclamo
     * EXACTAMENTE una intencion PREPARED; false si no habia intencion valida (no se debe enviar).
     */
    public boolean markDispatching(Map<String, Object> fragmentSource,
                                   String rebuildRunId,
                                   String sendersReference) {
        if (rebuildRunId == null || rebuildRunId.isBlank()
                || sendersReference == null || sendersReference.isBlank()) {
            return false;
        }
        try {
            return rebuildRepository.markPayFragmentDispatching(
                    resolveDataSource(stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef"))),
                    rebuildRunId,
                    sendersReference) == 1;
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
