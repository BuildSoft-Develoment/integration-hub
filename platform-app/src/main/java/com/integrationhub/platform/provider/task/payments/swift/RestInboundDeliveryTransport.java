package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.vertical.swift.mt101.provider.InboundDeliveryTransport;
import com.integrationhub.vertical.swift.mt101.provider.task.SwiftInboundStore;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.http.HttpRequestSupport;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.integrationhub.vertical.swift.mt101.provider.InboundDeliverySupport.intValue;
import static com.integrationhub.vertical.swift.mt101.provider.InboundDeliverySupport.stringValue;

/**
 * Transporte REST de {@code MT101_INBOUND_DELIVER}: POST de cada mensaje ruteado (JSON) a un endpoint. Reusa
 * el contrato HTTP comun ({@link HttpRequestSupport}: url/method/auth/login/headers), igual que REST_CALL y el
 * webhook de NOTIFICATION. Marca DELIVERED/FAILED por mensaje segun el status HTTP.
 */
@ApplicationScoped
public class RestInboundDeliveryTransport implements InboundDeliveryTransport {

    private final SwiftInboundStore inboundStore;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Inject
    public RestInboundDeliveryTransport(SwiftInboundStore inboundStore, ObjectMapper objectMapper) {
        this(inboundStore, objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    /** Costura de test: permite inyectar un {@link HttpClient} mockeado. */
    RestInboundDeliveryTransport(SwiftInboundStore inboundStore, ObjectMapper objectMapper, HttpClient httpClient) {
        this.inboundStore = inboundStore;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public String transport() {
        return "REST";
    }

    @Override
    public TaskResult deliver(TaskContext context, Map<String, Object> configuration,
                              Map<String, Object> inboundSource, int pageSize) {
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
}
