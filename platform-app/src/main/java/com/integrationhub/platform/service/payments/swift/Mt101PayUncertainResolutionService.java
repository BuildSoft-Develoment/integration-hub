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

    private final com.integrationhub.platform.service.payments.swift.Mt101CorrectiveTaskConfigSource taskConfigSource;

    @Inject
    public Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                              ConnectionPoolManager connectionPoolManager,
                                              Mt101FragmentRepository fragmentRepository,
                                              ObjectMapper objectMapper,
                                              Mt101ConfirmationRepository confirmationRepository,
                                              Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.statusQueryExecutor = new Mt101StatusQueryExecutor(objectMapper);
        this.confirmationRepository = confirmationRepository;
        this.taskConfigSource = taskConfigSource;
    }

    /** Constructor de test: permite inyectar el ejecutor de consulta (con gateways stub). */
    Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                       ConnectionPoolManager connectionPoolManager,
                                       Mt101FragmentRepository fragmentRepository,
                                       Mt101StatusQueryExecutor statusQueryExecutor,
                                       Mt101ConfirmationRepository confirmationRepository,
                                       Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.statusQueryExecutor = statusQueryExecutor;
        this.confirmationRepository = confirmationRepository;
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
                resolvedSent += fragmentRepository.resolvePayStatus(dataSource, set, sentRefs, UNRESOLVED, "SENT", null);
                resolvedRejected += fragmentRepository.resolvePayStatus(dataSource, set, rejectedRefs, UNRESOLVED,
                        "REJECTED", reasonText + " | confirmed rejected by MT101_STATUS");
                persistConfirmations(dataSource, confirmationRows);
                if (page.size() < PAGE_SIZE) {
                    break;
                }
            }
            return new NormalPayResolution(resolvedSent, resolvedRejected, pending, errors);
        } catch (SQLException error) {
            throw new IllegalStateException("cannot resolve uncertain PAY for set " + set + ": " + error.getMessage(),
                    error);
        }
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

    /**
     * v57-fix: persiste las confirmaciones de auditoria de los fragmentos resueltos en {@code mt101_confirmation}
     * (paridad con el correctivo). archive_id admite null (best-effort). No aborta la resolucion si falla el audit.
     */
    private void persistConfirmations(DataSource dataSource, List<Mt101ConfirmationRepository.ConfirmationRow> rows) {
        if (rows.isEmpty()) {
            return;
        }
        try (Connection connection = dataSource.getConnection()) {
            confirmationRepository.insertConfirmations(connection, CONFIRMATION_TABLE, rows);
        } catch (SQLException error) {
            throw new IllegalStateException("cannot persist MT101 STATUS confirmations during uncertain resolution: "
                    + error.getMessage(), error);
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

    /** Resultado de la resolución: cuántos fragmentos quedaron SENT/REJECTED y cuántos siguen pendientes. */
    public record NormalPayResolution(int resolvedSent, int resolvedRejected, int stillPending, int gatewayErrors) {
    }
}
