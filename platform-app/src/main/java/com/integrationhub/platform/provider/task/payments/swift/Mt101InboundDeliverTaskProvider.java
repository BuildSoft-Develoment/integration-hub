package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.http.HttpRequestSupport;
import com.integrationhub.platform.repository.payments.swift.InboundRoutedTransactionRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.sql.SQLException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Task provider {@code MT101_INBOUND_DELIVER}: sink final del inbound (espejo de
 * {@code MT101_PAY}). Lee del store inbound los mensajes {@code ROUTED} por paginas y
 * los entrega segun {@code transport}, marcando {@code DELIVERED} por lote (memoria
 * O(pageSize), escala a 1M):
 * <ul>
 *   <li>{@code DB} (default): aplana cada transaccion a {@code inbound_routed_transaction}.</li>
 *   <li>{@code REST}: POST de cada mensaje (JSON) a {@code rest.url}.</li>
 * </ul>
 *
 * @trace spec 008-mensajeria-pagos RF-007
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101InboundDeliverTaskProvider implements TaskProvider {

    private static final int DEFAULT_PAGE_SIZE = 500;

    private final SwiftInboundStore inboundStore;
    private final InboundRoutedTransactionRepository routedRepository;
    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Inject
    public Mt101InboundDeliverTaskProvider(SwiftInboundStore inboundStore,
                                           InboundRoutedTransactionRepository routedRepository,
                                           DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           ObjectMapper objectMapper) {
        this(inboundStore, routedRepository, defaultDataSource, connectionPoolManager, objectMapper,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    /** Costura de test: permite inyectar un {@link HttpClient} mockeado para cubrir la rama REST. */
    Mt101InboundDeliverTaskProvider(SwiftInboundStore inboundStore,
                                    InboundRoutedTransactionRepository routedRepository,
                                    DataSource defaultDataSource,
                                    ConnectionPoolManager connectionPoolManager,
                                    ObjectMapper objectMapper,
                                    HttpClient httpClient) {
        this.inboundStore = inboundStore;
        this.routedRepository = routedRepository;
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public String type() {
        return "MT101_INBOUND_DELIVER";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var inboundSource = Mt101MessageInputResolver.inboundSource(context, configuration, type());
        if (inboundSource.isEmpty()) {
            return TaskResult.success("MT101_INBOUND_DELIVER skipped because there is no inbound source");
        }
        var transport = stringValue(configuration.get("transport"), "DB").toUpperCase();
        var pageSize = intValue(configuration.get("pageSize"), DEFAULT_PAGE_SIZE);
        return switch (transport) {
            case "DB" -> deliverToTable(context, inboundSource, pageSize);
            case "REST" -> deliverToRest(configuration, inboundSource, pageSize);
            default -> throw new IllegalArgumentException("Unsupported MT101_INBOUND_DELIVER transport: " + transport);
        };
    }

    private TaskResult deliverToTable(TaskContext context, Map<String, Object> inboundSource, int pageSize) {
        var inboundSetId = stringValue(inboundSource.get("inboundSetId"), null);
        var connectionRef = stringValue(inboundSource.get("connectionRef"), null);
        var dataSource = resolveDataSource(connectionRef);
        var delivered = new long[]{0L, 0L}; // [0]=messages, [1]=rows

        inboundStore.forEachPage(inboundSource, SwiftInboundStore.READ_ROUTED, pageSize, page -> {
            var rows = new ArrayList<InboundRoutedTransactionRepository.Row>();
            var ids = new ArrayList<Long>(page.size());
            for (var item : page) {
                ids.add(item.id());
                var message = item.message();
                var sendersReference = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
                var uetr = message.envelope() == null ? null : message.envelope().uetr();
                for (var tx : message.transactions()) {
                    var beneficiary = tx.beneficiary();
                    var beneficiaryName = beneficiary == null || beneficiary.nameAndAddress() == null
                            || beneficiary.nameAndAddress().isEmpty()
                            ? null : beneficiary.nameAndAddress().get(0);
                    rows.add(new InboundRoutedTransactionRepository.Row(
                            inboundSetId,
                            context.processExecutionId(),
                            sendersReference,
                            tx.transactionReference(),
                            beneficiary == null ? null : beneficiary.account(),
                            beneficiaryName,
                            tx.amount() == null ? null : tx.amount().currency(),
                            tx.amount() == null ? null : tx.amount().value(),
                            uetr,
                            item.routedAs()));
                }
            }
            try {
                routedRepository.insertBatch(dataSource, rows);
            } catch (SQLException error) {
                throw new IllegalStateException("Cannot persist inbound routed transactions batch ("
                        + rows.size() + ")", error);
            }
            inboundStore.markStatusBatch(inboundSource, ids, "DELIVERED", null);
            delivered[0] += ids.size();
            delivered[1] += rows.size();
        });

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("transport", "DB");
        outputs.put("deliveredMessages", delivered[0]);
        outputs.put("rowsWritten", delivered[1]);
        return TaskResult.success("MT101_INBOUND_DELIVER via DB delivered=" + delivered[0]
                + " rows=" + delivered[1], outputs);
    }

    private TaskResult deliverToRest(Map<String, Object> configuration, Map<String, Object> inboundSource, int pageSize) {
        // El slice HTTP (url/method/auth/login/headers) viene en el top-level del config (contrato comun con
        // REST_CALL / webhook NOTIFICATION); se delega en HttpRequestSupport, que resuelve auth/login.
        var url = stringValue(configuration.get("url"), "");
        if (url.isBlank()) {
            throw new IllegalArgumentException("MT101_INBOUND_DELIVER transport=REST requires url");
        }
        var method = stringValue(configuration.get("method"), "POST").toUpperCase();
        var timeoutSeconds = intValue(configuration.get("timeoutSeconds"), 15);
        var headers = new LinkedHashMap<String, String>();
        if (configuration.get("headers") instanceof Map<?, ?> rawHeaders) {
            rawHeaders.forEach((key, value) -> {
                if (key != null && value != null) {
                    headers.put(String.valueOf(key), String.valueOf(value));
                }
            });
        }
        var stats = new long[]{0L, 0L}; // [0]=delivered, [1]=failed

        inboundStore.forEachPage(inboundSource, SwiftInboundStore.READ_ROUTED, pageSize, page -> {
            var deliveredIds = new ArrayList<Long>(page.size());
            var failedById = new LinkedHashMap<Long, String>();
            for (var item : page) {
                try {
                    var body = objectMapper.writeValueAsString(item.message());
                    var request = HttpRequestSupport.build(httpClient, objectMapper, configuration, method, url,
                            body, timeoutSeconds, headers);
                    var response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        deliveredIds.add(item.id());
                    } else {
                        failedById.put(item.id(), "HTTP " + response.statusCode());
                    }
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrupted delivering inbound message " + item.id(), error);
                } catch (Exception error) {
                    failedById.put(item.id(), error.getMessage());
                }
            }
            inboundStore.markStatusBatch(inboundSource, deliveredIds, "DELIVERED", null);
            inboundStore.markStatusBatch(inboundSource, failedById, "FAILED", null);
            stats[0] += deliveredIds.size();
            stats[1] += failedById.size();
        });

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("transport", "REST");
        outputs.put("delivered", stats[0]);
        outputs.put("failed", stats[1]);
        var summary = "MT101_INBOUND_DELIVER via REST delivered=" + stats[0] + " failed=" + stats[1];
        return stats[1] == 0 ? TaskResult.success(summary, outputs) : TaskResult.failure(summary, outputs);
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw).trim());
    }
}
