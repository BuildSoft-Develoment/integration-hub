package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusGateway;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
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
 * los fragmentos no resueltos. Solo soporta consulta REST ({@code query.url}); SFTP/route-aware es follow-up
 * documentado (se rechaza con error claro, sin consultar a ciegas).</p>
 */
@ApplicationScoped
public class Mt101PayUncertainResolutionService {

    private static final List<String> UNRESOLVED = List.of("UNCERTAIN", "DISPATCHING");
    private static final int PAGE_SIZE = 500;
    private static final int DEFAULT_TIMEOUT_SECONDS = 20;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StatusGateway gateway;

    private final com.integrationhub.platform.service.payments.swift.Mt101CorrectiveTaskConfigSource taskConfigSource;

    @Inject
    public Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                              ConnectionPoolManager connectionPoolManager,
                                              Mt101FragmentRepository fragmentRepository,
                                              ObjectMapper objectMapper,
                                              Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.gateway = new Mt101StatusGateway(java.net.http.HttpClient.newBuilder().build(), objectMapper);
        this.taskConfigSource = taskConfigSource;
    }

    /** Constructor de test: permite inyectar el gateway (HttpClient stub). */
    Mt101PayUncertainResolutionService(DataSource defaultDataSource,
                                       ConnectionPoolManager connectionPoolManager,
                                       Mt101FragmentRepository fragmentRepository,
                                       Mt101StatusGateway gateway,
                                       Mt101CorrectiveTaskConfigSource taskConfigSource) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.gateway = gateway;
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
            var urlTemplate = stringOrNull(query.get("url"));
            if (urlTemplate == null || urlTemplate.isBlank()) {
                throw new IllegalStateException("MT101_STATUS query.url is required to resolve the uncertain PAY "
                        + "status for set " + set + " (only REST gateway query is supported; SFTP/route-aware is a "
                        + "documented follow-up)");
            }
            var method = stringValue(query.get("method"), "GET").toUpperCase(Locale.ROOT);
            var timeout = intValue(query.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
            var expected = mapValue(config.get("expectedGatewayResponse"));
            var statusPath = stringValue(expected.get("statusField"), "$.status");
            var accepted = upperSet(config.get("acceptedStatuses"), List.of("ACCEPTED", "ACCP", "SENT"));
            var rejected = upperSet(config.get("rejectedStatuses"), List.of("REJECTED", "RJCT"));

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
                for (var record : page) {
                    afterIndex = intValue(record.get("fragmentIndex"), afterIndex);
                    var reference = stringOrNull(record.get("sendersReference"));
                    if (reference == null || reference.isBlank()) {
                        continue;
                    }
                    var url = resolveTemplate(urlTemplate, record);
                    var response = gateway.query(method, url, timeout);
                    if (response.error() != null) {
                        errors++; // gateway no concluyente -> se mantiene UNCERTAIN/DISPATCHING (reintentar luego)
                        continue;
                    }
                    var resolution = classify(gateway.extractField(response.body(), statusPath), accepted, rejected);
                    if ("SENT".equals(resolution)) {
                        sentRefs.add(reference);
                    } else if ("REJECTED".equals(resolution)) {
                        rejectedRefs.add(reference);
                    } else {
                        pending++; // pendiente/desconocido: no se toca (nunca reenvío)
                    }
                }
                resolvedSent += fragmentRepository.resolvePayStatus(dataSource, set, sentRefs, UNRESOLVED, "SENT", null);
                resolvedRejected += fragmentRepository.resolvePayStatus(dataSource, set, rejectedRefs, UNRESOLVED,
                        "REJECTED", reasonText + " | confirmed rejected by MT101_STATUS");
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

    private String resolveTemplate(String template, Map<String, Object> record) {
        var resolved = template;
        for (var entry : record.entrySet()) {
            resolved = resolved.replace("${" + entry.getKey() + "}",
                    entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return resolved;
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
