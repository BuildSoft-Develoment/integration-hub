package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusQueryExecutor;
import com.integrationhub.platform.repository.payments.swift.Mt101ConfirmationRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * v52-fix (pendiente #1) — resolución del estado durable {@code UNCERTAIN}/{@code DISPATCHING} del PAY NORMAL
 * (no correctivo). Espeja {@link Mt101CorrectiveLifecycleService#resolveUncertainPay} pero sobre
 * {@code mt101_build_fragment} en vez del ledger correctivo: consulta al gateway el estado real de cada fragmento
 * incierto y lo transiciona a {@code SENT}/{@code REJECTED}. NUNCA reenvía (solo consulta STATUS); un gateway
 * pendiente/erróneo deja el fragmento como está (se reintenta luego). La config de consulta se toma de la tarea
 * {@code MT101_STATUS} de la definición de proceso del set (opción B) — coherente con el correctivo.
 *
 * <p>Fuente DURABLE (no el hand-off in-memory del pipeline, que solo lleva SENT) y sin muestra acotada: pagina TODOS
 * los fragmentos no resueltos. Soporta REST + SFTP + route-aware vía el {@link Mt101StatusQueryExecutor} compartido
 * (v55). Persiste una confirmacion de auditoria por fragmento resuelto en {@code mt101_confirmation} (v57), en paridad
 * con el correctivo.</p>
 */
@ApplicationScoped
public class Mt101PayUncertainResolutionService {

    private static final List<String> UNRESOLVED = List.of("UNCERTAIN", "DISPATCHING");
    private static final int PAGE_SIZE = 500;
    private static final int DEFAULT_TIMEOUT_SECONDS = 20;

    private static final String CONFIRMATION_TABLE = "mt101_confirmation";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StatusQueryExecutor statusQueryExecutor;
    private final Mt101ConfirmationRepository confirmationRepository;
    // P1 (item 2): trama append-only PAY_CONFLICT cuando STATUS detecta SENT→REJECTED (nullable en tests sin audit).
    private final com.integrationhub.platform.service.execution.RecordAuditEmitter recordAuditEmitter;

    private final com.integrationhub.platform.service.payments.swift.Mt101CorrectiveTaskConfigSource taskConfigSource;

    @Inject
    public Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                              ConnectionPoolManager connectionPoolManager,
                                              Mt101FragmentRepository fragmentRepository,
                                              ObjectMapper objectMapper,
                                              Mt101ConfirmationRepository confirmationRepository,
                                              com.integrationhub.platform.service.execution.RecordAuditEmitter recordAuditEmitter,
                                              Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.statusQueryExecutor = new Mt101StatusQueryExecutor(objectMapper);
        this.confirmationRepository = confirmationRepository;
        this.recordAuditEmitter = recordAuditEmitter;
        this.taskConfigSource = taskConfigSource;
    }

    /** Constructor de test: permite inyectar el ejecutor de consulta (con gateways stub) y el emisor de auditoría. */
    Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                       ConnectionPoolManager connectionPoolManager,
                                       Mt101FragmentRepository fragmentRepository,
                                       Mt101StatusQueryExecutor statusQueryExecutor,
                                       Mt101ConfirmationRepository confirmationRepository,
                                       com.integrationhub.platform.service.execution.RecordAuditEmitter recordAuditEmitter,
                                       Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.statusQueryExecutor = statusQueryExecutor;
        this.confirmationRepository = confirmationRepository;
        this.recordAuditEmitter = recordAuditEmitter;
        this.taskConfigSource = taskConfigSource;
    }

    public NormalPayResolution resolveUncertainNormalPay(String connectionRef, String fragmentSetId,
                                                         String executedBy, String reason) {
        var set = require(fragmentSetId, "fragmentSetId");
        require(executedBy, "executedBy");
        var reasonText = require(reason, "reason");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var meta = fragmentRepository.findSetMetadata(dataSource, set);
            if (meta == null || meta.taskDefinitionId() == null) {
                throw new IllegalArgumentException("no MT101 fragment set (with task definition) found: " + set);
            }
            var config = taskConfigSource.taskConfig(meta.taskDefinitionId(), "MT101_STATUS");
            if (config == null) {
                throw new IllegalStateException("the process of set " + set
                        + " has no MT101_STATUS task; cannot resolve the uncertain PAY status");
            }
            var query = mapValue(config.get("query"));
            // v55-fix: soporte REST + SFTP + route-aware (via el ejecutor compartido). En modo route-aware
            // (routeQuery presente) la URL compartida es opcional; si NO hay routeQuery ni query.url, no hay como
            // consultar -> error claro. Restriccion documentada: en el path normal solo hay ${sendersReference} y
            // ${route} disponibles en el registro (build_fragment no persiste gatewayReference/idempotencyKey).
            var routeQuery = mapValue(config.get("routeQuery"));
            var routeAware = !routeQuery.isEmpty();
            var urlTemplate = stringOrNull(query.get("url"));
            if (!routeAware && (urlTemplate == null || urlTemplate.isBlank())) {
                throw new IllegalStateException("MT101_STATUS requires query.url or routeQuery to resolve the "
                        + "uncertain PAY status for set " + set);
            }
            var method = stringValue(query.get("method"), "GET").toUpperCase(Locale.ROOT);
            var timeout = intValue(query.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
            var expected = mapValue(config.get("expectedGatewayResponse"));
            var statusPath = stringValue(expected.get("statusField"), "$.status");
            var referencePath = stringValue(expected.get("referenceField"), "$.gatewayReference");
            var accepted = upperSet(config.get("acceptedStatuses"), List.of("ACCEPTED", "ACCP", "SENT"));
            var rejected = upperSet(config.get("rejectedStatuses"), List.of("REJECTED", "RJCT"));
            var planConfig = new Mt101StatusQueryExecutor.QueryPlanConfig(routeAware, routeQuery, urlTemplate,
                    method, timeout, statusPath, referencePath);

            int resolvedSent = 0;
            int resolvedRejected = 0;
            int pending = 0;
            int errors = 0;
            int afterIndex = 0;
            while (true) {
                var page = fragmentRepository.unresolvedPayStatusRecords(dataSource, set, UNRESOLVED, afterIndex, PAGE_SIZE);
                if (page.isEmpty()) {
                    break;
                }
                var sentRefs = new LinkedHashSet<String>();
                var rejectedRefs = new LinkedHashSet<String>();
                // v57-fix: confirmaciones de auditoria por fragmento resuelto (paridad con el correctivo).
                var confirmationRows = new ArrayList<Mt101ConfirmationRepository.ConfirmationRow>();
                for (var record : page) {
                    afterIndex = intValue(record.get("fragmentIndex"), afterIndex);
                    var reference = stringOrNull(record.get("sendersReference"));
                    if (reference == null || reference.isBlank()) {
                        continue;
                    }
                    var result = statusQueryExecutor.query(record, planConfig);
                    if (result.error() != null || result.pending()) {
                        errors += result.error() != null ? 1 : 0;
                        pending += result.pending() ? 1 : 0;
                        continue; // no concluyente / ACK aun no presente -> se mantiene sin resolver (nunca reenvío)
                    }
                    var resolution = classify(result.confirmedStatus(), accepted, rejected);
                    if ("SENT".equals(resolution)) {
                        sentRefs.add(reference);
                    } else if ("REJECTED".equals(resolution)) {
                        rejectedRefs.add(reference);
                    } else {
                        pending++; // pendiente/desconocido: no se toca (nunca reenvío)
                        continue;
                    }
                    // Solo se audita lo REALMENTE resuelto (SENT/REJECTED): evidencia de la respuesta del banco.
                    confirmationRows.add(new Mt101ConfirmationRepository.ConfirmationRow(
                            longOrNull(record.get("archiveId")), "STATUS_API",
                            result.gatewayReference(), result.confirmedStatus(), result.rawBody()));
                }
                // P1 (atomicidad): la transición del fragmento y su confirmación van en UNA transacción. Si la
                // confirmation fallara, se revierte el cambio de estado → el fragmento queda seleccionable de nuevo
                // (sigue UNRESOLVED) y no hay evidencia perdida. Reemplaza los autocommits separados.
                var pageReason = reasonText + " | confirmed rejected by MT101_STATUS";
                var applied = inTransaction(dataSource, connection -> {
                    var s = fragmentRepository.resolvePayStatus(connection, set, sentRefs, UNRESOLVED, "SENT", null);
                    var r = fragmentRepository.resolvePayStatus(connection, set, rejectedRefs, UNRESOLVED, "REJECTED",
                            pageReason);
                    if (!confirmationRows.isEmpty()) {
                        confirmationRepository.insertConfirmations(connection, CONFIRMATION_TABLE, confirmationRows);
                    }
                    return new int[] {s, r};
                });
                resolvedSent += applied[0];
                resolvedRejected += applied[1];
                if (page.size() < PAGE_SIZE) {
                    break;
                }
            }
            // A (Modelo B): segunda pasada — re-consulta STATUS los fragmentos ya SENT (no conflictivos). Si el
            // banco los resuelve a un terminal CONTRADICTORIO (REJECTED), es una contradicción real: se marca
            // pay_conflict + confirmación append-only y NO se sobrescribe (conciliación manual). Cierra la asimetría
            // SENT→banco-REJECTED, que la primera pasada (solo UNCERTAIN/DISPATCHING) no veía.
            int conflicts = reconcileSentAgainstStatus(dataSource, set, planConfig, accepted, rejected, reasonText,
                    executedBy, meta.taskDefinitionId());
            return new NormalPayResolution(resolvedSent, resolvedRejected, pending, errors, conflicts);
        } catch (SQLException error) {
            throw new IllegalStateException("cannot resolve uncertain PAY for set " + set + ": " + error.getMessage(),
                    error);
        }
    }

    /**
     * A (Modelo B): reconcilia contra STATUS los fragmentos ya {@code SENT} que aún no están en conflicto. Un banco
     * que responde {@code REJECTED} sobre un {@code SENT} es una contradicción terminal: {@code SENT} y
     * {@code REJECTED} son terminales incompatibles → se marca {@code pay_conflict} + confirmación append-only y NO
     * se auto-resuelve (conciliación manual), espejo del correctivo. Nunca reenvía (STATUS solo consulta). Si el
     * banco confirma {@code SENT} o la consulta es no concluyente/pendiente, el fragmento no se toca.
     */
    private int reconcileSentAgainstStatus(DataSource dataSource, String set,
            Mt101StatusQueryExecutor.QueryPlanConfig planConfig, Set<String> accepted, Set<String> rejected,
            String reasonText, String executedBy, Long taskDefinitionId) throws SQLException {
        int conflicts = 0;
        int afterIndex = 0;
        while (true) {
            var page = fragmentRepository.unconflictedPayStatusRecords(dataSource, set, List.of("SENT"),
                    afterIndex, PAGE_SIZE);
            if (page.isEmpty()) {
                break;
            }
            var conflictRefs = new LinkedHashSet<String>();
            var confirmationRows = new ArrayList<Mt101ConfirmationRepository.ConfirmationRow>();
            // item 2: trama append-only PAY_CONFLICT (source=STATUS) por cada contradicción detectada.
            var conflictAudit = new ArrayList<com.integrationhub.platform.audit.AuditEnvelope>();
            for (var record : page) {
                afterIndex = intValue(record.get("fragmentIndex"), afterIndex);
                var reference = stringOrNull(record.get("sendersReference"));
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                var result = statusQueryExecutor.query(record, planConfig);
                if (result.error() != null || result.pending()) {
                    continue; // no concluyente / ACK aún no presente -> el SENT se mantiene (nunca reenvío)
                }
                // Solo un REJECTED del banco contradice un SENT. Un ACCEPTED/SENT lo confirma (no-op).
                if ("REJECTED".equals(classify(result.confirmedStatus(), accepted, rejected))) {
                    conflictRefs.add(reference);
                    confirmationRows.add(new Mt101ConfirmationRepository.ConfirmationRow(
                            longOrNull(record.get("archiveId")), "STATUS_API",
                            result.gatewayReference(), result.confirmedStatus(), result.rawBody()));
                    conflictAudit.add(Mt101PayConflictAudit.envelope(null, taskDefinitionId, reference,
                            "SENT", "REJECTED", result.gatewayReference(),
                            Mt101PayConflictAudit.Source.STATUS, executedBy));
                }
            }
            if (!conflictRefs.isEmpty()) {
                var conflictReason = "STATUS/banco resolvió REJECTED sobre un fragmento ya SENT; contradicción "
                        + "terminal — conciliación manual, no se sobrescribe (" + reasonText + ")";
                // P1 (atomicidad): pay_conflict + confirmación en UNA transacción.
                inTransaction(dataSource, connection -> {
                    fragmentRepository.markPayConflict(connection, set, conflictRefs, conflictReason);
                    if (!confirmationRows.isEmpty()) {
                        confirmationRepository.insertConfirmations(connection, CONFIRMATION_TABLE, confirmationRows);
                    }
                    return null;
                });
                // item 2: la trama PAY_CONFLICT va a su spool durable tras confirmar el estado (evidencia
                // conciliable en auditoría/timeline/UI, con source=STATUS). Sin emisor (tests) es no-op.
                if (recordAuditEmitter != null && !conflictAudit.isEmpty()) {
                    recordAuditEmitter.emitRecords(conflictAudit);
                }
                conflicts += conflictRefs.size();
            }
            if (page.size() < PAGE_SIZE) {
                break;
            }
        }
        return conflicts;
    }

    private String classify(String confirmedStatus, Set<String> accepted, Set<String> rejected) {
        if (confirmedStatus == null || confirmedStatus.isBlank()) {
            return null;
        }
        var normalized = confirmedStatus.trim().toUpperCase(Locale.ROOT);
        if (accepted.contains(normalized)) {
            return "SENT";
        }
        if (rejected.contains(normalized)) {
            return "REJECTED";
        }
        return null;
    }

    /** Unidad de trabajo transaccional sobre una conexión (P1 atomicidad). */
    @FunctionalInterface
    private interface SqlWork<T> {
        T run(Connection connection) throws SQLException;
    }

    /**
     * P1 (atomicidad): ejecuta {@code work} en UNA transacción (una conexión, {@code autoCommit=false}, commit o
     * rollback). Une la transición del fragmento y su confirmación de auditoría: si la confirmación falla, se
     * revierte el cambio de estado — nunca queda un fragmento resuelto sin evidencia. Sirve para el datasource por
     * defecto y para el de un {@code connectionRef} (tx a nivel conexión, no depende de JTA).
     */
    private <T> T inTransaction(DataSource dataSource, SqlWork<T> work) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var result = work.run(connection);
                connection.commit();
                return result;
            } catch (SQLException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        }
    }

    private Long longOrNull(Object raw) {
        if (raw instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        return raw instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private Set<String> upperSet(Object raw, List<String> defaults) {
        var source = raw instanceof List<?> list && !list.isEmpty() ? list : defaults;
        var result = new LinkedHashSet<String>();
        for (var item : source) {
            if (item != null) {
                var value = String.valueOf(item).trim().toUpperCase(Locale.ROOT);
                if (!value.isEmpty()) {
                    result.add(value);
                }
            }
        }
        return result;
    }

    private String stringOrNull(Object raw) {
        return raw == null ? null : String.valueOf(raw).trim();
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw instanceof Number number) {
            return number.intValue();
        }
        if (raw == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException error) {
            return defaultValue;
        }
    }

    private String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    /**
     * Resultado de la resolución: cuántos fragmentos quedaron SENT/REJECTED, cuántos siguen pendientes, cuántos
     * errores de gateway y cuántos quedaron en {@code conflicts} (A/Modelo B: SENT que el banco rechazó — exigen
     * conciliación manual, no se auto-resuelven).
     */
    public record NormalPayResolution(int resolvedSent, int resolvedRejected, int stillPending, int gatewayErrors,
                                      int conflicts) {
    }
}
