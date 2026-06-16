package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reproceso quirurgico de fragmentos MT101: revalidar/reenviar por transicion de
 * estado o reprocesar solo las filas afectadas de un lote (1M registros) sin
 * regenerar el set completo. Orquesta y valida transiciones; el SQL vive en
 * {@link Mt101FragmentRepository} (ADR-011).
 */
@ApplicationScoped
public class Mt101ReprocessService {

    /**
     * Transiciones seguras permitidas (fromStatus -> toStatus posibles). Acota el
     * reproceso a movimientos que los gates de las tareas saben reanudar:
     * VALIDATE lee BUILT, ARCHIVE lee BUILT/VALIDATED, PAY lee ARCHIVED.
     */
    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            "REJECTED", Set.of("BUILT", "ARCHIVED"),
            "VALIDATED", Set.of("BUILT"),
            "ARCHIVED", Set.of("BUILT", "VALIDATED"),
            "SENT", Set.of("ARCHIVED", "BUILT"));

    /** Estados destino validos para reprocesar filas (un gate de tarea los relee). */
    private static final Set<String> REPROCESSABLE_TARGETS = Set.of("BUILT", "VALIDATED", "ARCHIVED");

    private static final int MAX_ROW_FRAGMENTS = 5000;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository repository;
    private final Mt101FragmentStore fragmentStore;

    public Mt101ReprocessService(DataSource defaultDataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 Mt101FragmentRepository repository,
                                 Mt101FragmentStore fragmentStore) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.fragmentStore = fragmentStore;
    }

    /**
     * Transiciona en bloque los fragmentos de un set de {@code fromStatus} a
     * {@code toStatus} (p.ej. REJECTED -> BUILT para revalidar tras corregir reglas).
     *
     * @return cuantos fragmentos cambiaron de estado.
     */
    public int resetByStatus(String connectionRef, String fragmentSetId, String fromStatus, String toStatus) {
        var set = requireFragmentSetId(fragmentSetId);
        var from = requireStatus(fromStatus, "fromStatus");
        var to = requireStatus(toStatus, "toStatus");
        validateTransition(from, to);
        try {
            return repository.resetStatus(resolveDataSource(connectionRef), set, from, to);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reset MT101 fragments " + from + " -> " + to
                    + " for set " + set, error);
        }
    }

    /**
     * Reprocesa solo los fragmentos cuyo rango de fila del archivo solapa
     * [recordFrom, recordTo] (1-based), llevandolos a {@code toStatus} para que el
     * gate correspondiente los retome. No regenera el lote.
     *
     * @return los fragmentos afectados (para que el operador vea que filas se tocaron).
     */
    public List<Mt101FragmentRepository.FragmentLookupRow> reprocessSourceRows(String connectionRef,
                                                                               String fragmentSetId,
                                                                               long recordFrom,
                                                                               long recordTo,
                                                                               String sourceFileHash,
                                                                               String toStatus) {
        var set = requireFragmentSetId(fragmentSetId);
        var to = requireStatus(toStatus, "toStatus");
        if (!REPROCESSABLE_TARGETS.contains(to)) {
            throw new IllegalArgumentException("toStatus must be one of " + REPROCESSABLE_TARGETS
                    + " to reprocess source rows; got " + to);
        }
        if (recordFrom < 1 || recordTo < recordFrom) {
            throw new IllegalArgumentException("invalid source row range [" + recordFrom + ", " + recordTo + "]");
        }
        var dataSource = resolveDataSource(connectionRef);
        List<Mt101FragmentRepository.FragmentLookupRow> fragments;
        try {
            fragments = repository.findBySourceRowRange(dataSource, recordFrom, recordTo,
                    blankToNull(sourceFileHash), set, MAX_ROW_FRAGMENTS);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve MT101 fragments for source rows ["
                    + recordFrom + ", " + recordTo + "] in set " + set, error);
        }
        if (fragments.isEmpty()) {
            // Sin fallback: no se hace un no-op silencioso. Si el operador pide
            // reprocesar filas que no estan en ningun fragmento del set, es un error
            // accionable (rango equivocado, set equivocado o lote aun no construido).
            throw new IllegalArgumentException("no MT101 fragments cover source rows ["
                    + recordFrom + ", " + recordTo + "] in set " + set
                    + (sourceFileHash == null || sourceFileHash.isBlank() ? "" : " for source file " + sourceFileHash));
        }
        var errorByRef = new LinkedHashMap<String, String>();
        for (var fragment : fragments) {
            if (fragment.sendersReference() != null && !fragment.sendersReference().isBlank()) {
                errorByRef.put(fragment.sendersReference(), null);
            }
        }
        fragmentStore.markStatusBatch(fragmentSource(set, connectionRef), errorByRef, to);
        return fragments;
    }

    private Map<String, Object> fragmentSource(String fragmentSetId, String connectionRef) {
        var source = new LinkedHashMap<String, Object>();
        source.put("fragmentSetId", fragmentSetId);
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        return source;
    }

    private void validateTransition(String from, String to) {
        if (!ALLOWED_TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw new IllegalArgumentException("transition " + from + " -> " + to
                    + " is not allowed; permitted: " + ALLOWED_TRANSITIONS);
        }
    }

    private String requireFragmentSetId(String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        return fragmentSetId.trim();
    }

    private String requireStatus(String status, String field) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return status.trim().toUpperCase();
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
}
