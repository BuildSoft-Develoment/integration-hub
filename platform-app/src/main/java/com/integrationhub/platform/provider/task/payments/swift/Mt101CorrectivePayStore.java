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
    public java.util.List<String> markResults(Map<String, Object> fragmentSource,
                            String rebuildRunId,
                            java.util.Collection<Mt101RebuildRepository.PayFragmentResult> results) {
        if (rebuildRunId == null || rebuildRunId.isBlank() || results == null || results.isEmpty()) {
            return java.util.List.of();
        }
        try {
            // v34 (hallazgo 2): devuelve las referencias en conflicto terminal para que el provider NO
            // propague SENT a build_fragment/archive si el ledger no aceptó esa transición (coherencia
            // entre fuentes de verdad: ledger == build == archive).
            return rebuildRepository.updatePayFragmentResults(
                    resolveDataSource(stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef"))),
                    rebuildRunId,
                    results).conflictReferences();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist MT101 corrective PAY fragment results batch for run "
                    + rebuildRunId, error);
        }
    }

    /**
     * P0.2 v22+v24: transicion atomica PREPARED -> DISPATCHING. Devuelve true solo si se reclamo
     * EXACTAMENTE una intencion PREPARED cuyo plan (payload_hash + routed_as) sigue siendo el aprobado.
     * Si el plan cambio tras la aprobacion (payload/ruta), el fragmento se INVALIDA y NO se envia. Si no
     * habia intencion valida (ya DISPATCHING/terminal), devuelve false sin invalidar.
     */
    public boolean markDispatching(Map<String, Object> fragmentSource,
                                   String rebuildRunId,
                                   String sendersReference,
                                   String currentPayloadHash,
                                   String currentRoutedAs,
                                   String currentPlanHash) {
        return markDispatching(fragmentSource, rebuildRunId, sendersReference, currentPayloadHash,
                currentRoutedAs, currentPlanHash, null);
    }

    /**
     * v37: el claim enlaza ATOMICAMENTE el contrato persistido. Ademas de payload_hash + routed_as +
     * dispatch_plan_hash, valida el {@code dispatch_spec_hash} esperado (el de la spec leida): si la spec del
     * ledger cambio entre la lectura y el claim, no se reclama.
     */
    public boolean markDispatching(Map<String, Object> fragmentSource,
                                   String rebuildRunId,
                                   String sendersReference,
                                   String currentPayloadHash,
                                   String currentRoutedAs,
                                   String currentPlanHash,
                                   String expectedDispatchSpecHash) {
        return markDispatching(fragmentSource, rebuildRunId, sendersReference, currentPayloadHash,
                currentRoutedAs, currentPlanHash, expectedDispatchSpecHash, null);
    }

    /**
     * v38: el claim enlaza ademas el {@code dispatch_spec_json} EXACTO (no solo su hash): el ledger representa
     * byte-a-byte lo que se va a enviar. Reclamar ocurre ANTES de re-resolver secretos (el provider materializa
     * tras ganar el claim).
     */
    public boolean markDispatching(Map<String, Object> fragmentSource,
                                   String rebuildRunId,
                                   String sendersReference,
                                   String currentPayloadHash,
                                   String currentRoutedAs,
                                   String currentPlanHash,
                                   String expectedDispatchSpecHash,
                                   String expectedDispatchSpecJson) {
        if (rebuildRunId == null || rebuildRunId.isBlank()
                || sendersReference == null || sendersReference.isBlank()) {
            return false;
        }
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            var claimed = rebuildRepository.markPayFragmentDispatching(
                    dataSource, rebuildRunId, sendersReference, currentPayloadHash, currentRoutedAs,
                    currentPlanHash, expectedDispatchSpecHash, expectedDispatchSpecJson) == 1;
            if (claimed) {
                return true;
            }
            // No se reclamo: si fue por drift del plan (sigue PREPARED pero cambio), se INVALIDA.
            rebuildRepository.invalidatePayFragmentOnPlanDrift(
                    dataSource, rebuildRunId, sendersReference, currentPayloadHash, currentRoutedAs,
                    currentPlanHash);
            return false;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot mark MT101 corrective PAY fragment as DISPATCHING: "
                    + sendersReference, error);
        }
    }

    /** v38: fallo de materializacion (Vault/spec) DESPUES del claim, ANTES del envio -> INVALIDATED (sin banco). */
    public void invalidateMaterializeFailure(Map<String, Object> fragmentSource, String rebuildRunId,
                                             String sendersReference, String reason) {
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            rebuildRepository.invalidatePayFragmentMaterializeFailure(dataSource, rebuildRunId, sendersReference, reason);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot invalidate MT101 corrective PAY fragment after materialize "
                    + "failure: " + sendersReference, error);
        }
    }

    /** v37: la spec persistida no coincide con su hash (manipulada): se INVALIDA y NO se llama al banco. */
    public void invalidateTamperedSpec(Map<String, Object> fragmentSource, String rebuildRunId, String sendersReference) {
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            rebuildRepository.invalidatePayFragmentTamperedSpec(dataSource, rebuildRunId, sendersReference);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot invalidate MT101 corrective PAY fragment with tampered spec: "
                    + sendersReference, error);
        }
    }

    /**
     * v46-fix (read-from-pf): INVALIDA un fragmento PREPARED cuyo ledger operativo DIVERGE de la revision ACTIVE
     * inmutable (de donde se lee el contrato). Devuelve true si invalido (divergencia). Asi una manipulacion
     * directa del ledger no deja el fragmento atascado en PREPARED ni se despacha.
     */
    public boolean invalidateIfLedgerDivergesFromActiveRevision(Map<String, Object> fragmentSource,
                                                                String rebuildRunId, String sendersReference) {
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            return rebuildRepository.invalidatePayFragmentDivergingFromActiveRevision(
                    dataSource, rebuildRunId, sendersReference) > 0;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot invalidate MT101 corrective PAY fragment diverging from the "
                    + "active revision: " + sendersReference, error);
        }
    }

    /** v37: lee el contrato de despacho persistido (spec ejecutable) de un fragmento PREPARED. */
    public Mt101RebuildRepository.PreparedDispatchSpec readPreparedSpec(Map<String, Object> fragmentSource,
                                                                        String rebuildRunId, String sendersReference) {
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            return rebuildRepository.readPreparedDispatchSpec(dataSource, rebuildRunId, sendersReference);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read MT101 corrective PAY dispatch spec for " + sendersReference, error);
        }
    }

    /** v37: sin spec persistido NO hay fallback: el fragmento PREPARED se INVALIDA (no se llama al banco). */
    public void invalidateMissingSpec(Map<String, Object> fragmentSource, String rebuildRunId, String sendersReference) {
        var dataSource = resolveDataSource(
                stringValue(fragmentSource == null ? null : fragmentSource.get("connectionRef")));
        try {
            rebuildRepository.invalidatePayFragmentMissingSpec(dataSource, rebuildRunId, sendersReference);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot invalidate MT101 corrective PAY fragment without spec: "
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
