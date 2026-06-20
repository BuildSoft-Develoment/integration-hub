package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101ReprocessAuditRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reproceso quirurgico de fragmentos MT101: revalidar por transicion de estado
 * o reprocesar solo las filas afectadas de un lote (1M registros) sin
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
            "REJECTED", Set.of("BUILT"),
            "VALIDATED", Set.of("BUILT"),
            "ARCHIVED", Set.of("BUILT", "VALIDATED"));

    /** Estados destino validos para reprocesar filas (un gate de tarea los relee). */
    private static final Set<String> REPROCESSABLE_TARGETS = Set.of("BUILT", "VALIDATED", "ARCHIVED");

    /** Estados enviados/cerrados o reemplazados: no admiten reproceso tecnico. */
    private static final Set<String> NON_REPROCESSABLE = Set.of("SENT", "CONFIRMED", "RECONCILED", "SUPERSEDED");

    private static final int MAX_ROW_FRAGMENTS = 5000;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository repository;
    private final Mt101FragmentStore fragmentStore;
    private final Mt101ReprocessAuditRepository auditRepository;

    @Inject
    public Mt101ReprocessService(DataSource defaultDataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 Mt101FragmentRepository repository,
                                 Mt101FragmentStore fragmentStore,
                                 Mt101ReprocessAuditRepository auditRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.fragmentStore = fragmentStore;
        this.auditRepository = auditRepository;
    }

    public Mt101ReprocessService(DataSource defaultDataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 Mt101FragmentRepository repository,
                                 Mt101FragmentStore fragmentStore) {
        this(defaultDataSource, connectionPoolManager, repository, fragmentStore,
                new Mt101ReprocessAuditRepository());
    }

    /**
     * Transiciona en bloque los fragmentos de un set de {@code fromStatus} a
     * {@code toStatus} (p.ej. REJECTED -> BUILT para revalidar tras corregir reglas).
     *
     * @return cuantos fragmentos cambiaron de estado.
     */
    public int resetByStatus(String connectionRef, String fragmentSetId, String fromStatus, String toStatus) {
        return resetByStatus(connectionRef, fragmentSetId, fromStatus, toStatus, "unknown", null, null);
    }

    public int resetByStatus(String connectionRef,
                             String fragmentSetId,
                             String fromStatus,
                             String toStatus,
                             String actor,
                             String reason,
                             String ticketRef) {
        var set = requireFragmentSetId(fragmentSetId);
        var from = requireStatus(fromStatus, "fromStatus");
        var to = requireStatus(toStatus, "toStatus");
        validateTransition(from, to);
        try {
            var dataSource = resolveDataSource(connectionRef);
            var affected = repository.resetStatus(dataSource, set, from, to);
            auditRepository.insert(dataSource, new Mt101ReprocessAuditRepository.ReprocessAuditRow(
                    "STATUS_RESET", set, null, null, null, from, to, affected, normalizeActor(actor),
                    blankToNull(reason), blankToNull(ticketRef)));
            return affected;
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
        return reprocessSourceRows(connectionRef, fragmentSetId, recordFrom, recordTo, sourceFileHash, toStatus,
                "unknown", null, null);
    }

    public List<Mt101FragmentRepository.FragmentLookupRow> reprocessSourceRows(String connectionRef,
                                                                               String fragmentSetId,
                                                                               long recordFrom,
                                                                               long recordTo,
                                                                               String sourceFileHash,
                                                                               String toStatus,
                                                                               String actor,
                                                                               String reason,
                                                                               String ticketRef) {
        var set = requireFragmentSetId(fragmentSetId);
        var to = requireStatus(toStatus, "toStatus");
        if (!REPROCESSABLE_TARGETS.contains(to)) {
            throw new IllegalArgumentException("toStatus must be one of " + REPROCESSABLE_TARGETS
                    + " to reprocess source rows; got " + to);
        }
        if (recordFrom < 1 || recordTo < recordFrom) {
            throw new IllegalArgumentException("invalid source row range [" + recordFrom + ", " + recordTo + "]");
        }
        var hash = requireSourceFileHash(sourceFileHash);
        var dataSource = resolveDataSource(connectionRef);
        List<Mt101FragmentRepository.FragmentLookupRow> fragments;
        try {
            fragments = repository.findBySourceRowRange(dataSource, recordFrom, recordTo,
                    hash, set, MAX_ROW_FRAGMENTS);
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
                    + " for source file " + hash);
        }
        // P0.1: un pago enviado/cerrado o reemplazado NO se reprocesa como si nunca
        // hubiera salido. Eso requiere cancelacion/reverso o un nuevo correctivo.
        var blockedFragments = fragments.stream()
                .filter(f -> f.status() != null && NON_REPROCESSABLE.contains(f.status().toUpperCase()))
                .map(f -> f.sendersReference() + "=" + f.status())
                .toList();
        if (!blockedFragments.isEmpty()) {
            throw new IllegalArgumentException("cannot reprocess source rows [" + recordFrom + ", " + recordTo
                    + "] in set " + set + "; fragments are already sent/confirmed/reconciled or superseded: "
                    + blockedFragments + ". A closed payment needs cancellation/reversal or a governed corrective run.");
        }
        var invalidTransitions = fragments.stream()
                .filter(f -> f.status() == null || !to.equals(f.status().toUpperCase()))
                .filter(f -> f.status() == null
                        || !ALLOWED_TRANSITIONS.getOrDefault(f.status().toUpperCase(), Set.of()).contains(to))
                .map(f -> f.sendersReference() + "=" + (f.status() == null ? "<missing>" : f.status()))
                .toList();
        if (!invalidTransitions.isEmpty()) {
            throw new IllegalArgumentException("cannot reprocess source rows [" + recordFrom + ", " + recordTo
                    + "] in set " + set + " to " + to + "; invalid current states: " + invalidTransitions
                    + "; permitted: " + ALLOWED_TRANSITIONS);
        }
        var errorByRef = new LinkedHashMap<String, String>();
        for (var fragment : fragments) {
            if (fragment.sendersReference() != null && !fragment.sendersReference().isBlank()) {
                errorByRef.put(fragment.sendersReference(), null);
            }
        }
        fragmentStore.markStatusBatch(fragmentSource(set, connectionRef), errorByRef, to);
        try {
            auditRepository.insert(dataSource, new Mt101ReprocessAuditRepository.ReprocessAuditRow(
                    "SOURCE_ROW_REPROCESS", set, hash, recordFrom, recordTo, null, to, errorByRef.size(), normalizeActor(actor),
                    blankToNull(reason), blankToNull(ticketRef)));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot audit MT101 source-row reprocess for set " + set, error);
        }
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

    private String requireSourceFileHash(String sourceFileHash) {
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required for MT101 row reprocess");
        }
        return sourceFileHash.trim();
    }

    private String normalizeActor(String actor) {
        return actor == null || actor.isBlank() ? "unknown" : actor.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

}
