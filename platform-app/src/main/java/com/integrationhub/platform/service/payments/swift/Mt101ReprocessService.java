package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101ReprocessAuditRepository;
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
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101ReprocessAuditRepository auditRepository;

    @Inject
    public Mt101ReprocessService(DataSource defaultDataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 Mt101FragmentRepository repository,
                                 Mt101FailedRecordRepository failedRecordRepository,
                                 Mt101ReprocessAuditRepository auditRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.failedRecordRepository = failedRecordRepository;
        this.auditRepository = auditRepository;
    }

    public Mt101ReprocessService(DataSource defaultDataSource,
                                 ConnectionPoolManager connectionPoolManager,
                                 Mt101FragmentRepository repository) {
        this(defaultDataSource, connectionPoolManager, repository,
                new Mt101FailedRecordRepository(), new Mt101ReprocessAuditRepository());
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
        var dataSource = resolveDataSource(connectionRef);
        // B4: reset de estado + auditoria en UNA transaccion local (no best-effort).
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var affected = repository.resetStatus(connection, set, from, to);
                auditRepository.insert(connection, new Mt101ReprocessAuditRepository.ReprocessAuditRow(
                        "STATUS_RESET", set, null, null, null, from, to, affected, normalizeActor(actor),
                        blankToNull(reason), blankToNull(ticketRef)));
                connection.commit();
                return affected;
            } catch (SQLException | RuntimeException error) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    error.addSuppressed(rollbackError);
                }
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
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
        var expectedByRef = new LinkedHashMap<String, String>();
        for (var fragment : fragments) {
            if (fragment.sendersReference() != null && !fragment.sendersReference().isBlank()) {
                expectedByRef.put(fragment.sendersReference(),
                        fragment.status() == null ? null : fragment.status().toUpperCase());
            }
        }
        // B3+B4: transicion condicional (cada fragmento solo cambia si su estado sigue siendo
        // el leido -> no pisa un PAY concurrente que lo llevo a SENT) + auditoria durable, todo
        // en UNA transaccion local. Si no cambian todas las filas esperadas: rollback, sin parcial.
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var updated = repository.transitionStatusConditional(connection, set, expectedByRef, to);
                if (updated != expectedByRef.size()) {
                    throw new IllegalStateException("cannot reprocess source rows [" + recordFrom + ", " + recordTo
                            + "] in set " + set + " to " + to + "; expected " + expectedByRef.size()
                            + " fragments but " + updated + " changed (concurrent status change). No partial apply.");
                }
                auditRepository.insert(connection, new Mt101ReprocessAuditRepository.ReprocessAuditRow(
                        "SOURCE_ROW_REPROCESS", set, hash, recordFrom, recordTo, null, to, updated, normalizeActor(actor),
                        blankToNull(reason), blankToNull(ticketRef)));
                connection.commit();
            } catch (SQLException | RuntimeException error) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    error.addSuppressed(rollbackError);
                }
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reprocess source rows [" + recordFrom + ", " + recordTo
                    + "] in set " + set, error);
        }
        return fragments;
    }

    /**
     * B1': reabre una fila cuyo rebuild correctivo fue rechazado
     * ({@code REBUILD_REJECTED -> QUARANTINED}) para que vuelva al ciclo corregir->rebuild,
     * conservando el run previo y las referencias correctivas. Cambio de estado + auditoria
     * en una sola transaccion local.
     *
     * @return cuantas filas se reabrieron (1 si existia la fila rechazada).
     */
    public int reopenRejectedRebuild(String connectionRef,
                                     String fragmentSetId,
                                     String sourceFileHash,
                                     long sourceRecordNumber,
                                     long stagingId,
                                     String actor,
                                     String reason,
                                     String ticketRef) {
        var set = requireFragmentSetId(fragmentSetId);
        var hash = requireSourceFileHash(sourceFileHash);
        if (sourceRecordNumber < 1) {
            throw new IllegalArgumentException("sourceRecordNumber must be positive");
        }
        if (stagingId < 1) {
            throw new IllegalArgumentException("stagingId must be positive");
        }
        var dataSource = resolveDataSource(connectionRef);
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var reopened = failedRecordRepository.reopenRejectedRow(connection, set, hash, sourceRecordNumber, stagingId);
                if (reopened == 0) {
                    // Sin fallback: si no hay fila REBUILD_REJECTED, es un error accionable.
                    throw new IllegalArgumentException("no REBUILD_REJECTED row at source file " + hash
                            + " row " + sourceRecordNumber + " stagingId " + stagingId + " for set " + set);
                }
                auditRepository.insert(connection, new Mt101ReprocessAuditRepository.ReprocessAuditRow(
                        "REBUILD_REOPEN", set, hash, sourceRecordNumber, sourceRecordNumber,
                        "REBUILD_REJECTED", "QUARANTINED", reopened, normalizeActor(actor),
                        blankToNull(reason), blankToNull(ticketRef)));
                connection.commit();
                return reopened;
            } catch (SQLException | RuntimeException error) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    error.addSuppressed(rollbackError);
                }
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reopen rejected rebuild row " + sourceRecordNumber
                    + " for set " + set, error);
        }
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
