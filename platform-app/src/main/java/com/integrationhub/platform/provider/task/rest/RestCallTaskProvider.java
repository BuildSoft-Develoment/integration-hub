package com.integrationhub.platform.provider.task.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class RestCallTaskProvider implements TaskProvider {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Inject
    ObjectMapper objectMapper;

    @Override
    public String type() {
        return "REST_CALL";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        String mode = String.valueOf(configuration.getOrDefault("mode", "per-record"));
        String method = String.valueOf(configuration.getOrDefault("method", "POST")).toUpperCase();
        String urlTemplate = RestTaskSupport.requireString(configuration, "url");
        String bodyTemplate = configuration.get("bodyTemplate") == null ? null
                : String.valueOf(configuration.get("bodyTemplate"));
        int timeoutSeconds = RestTaskSupport.optionalInt(configuration, "timeoutSeconds", 20);
        Map<String, String> headers = RestTaskSupport.stringMap(configuration, "headers");

        ReadResult readResult = (ReadResult) context.attributes().get("readResult");
        List<ReadRecord> records = readResult == null ? List.of() : readResult.records();

        return switch (mode.toLowerCase()) {
            case "single" -> executeSingle(configuration, method, urlTemplate, bodyTemplate, timeoutSeconds, headers,
                    records, context);
            case "per-record" -> executePerRecord(configuration, method, urlTemplate, bodyTemplate, timeoutSeconds,
                    headers, records, context);
            default -> throw new IllegalArgumentException("Unsupported REST task mode: " + mode);
        };
    }

    private TaskResult executePerRecord(Map<String, Object> configuration, String method, String urlTemplate,
            String bodyTemplate,
            int timeoutSeconds, Map<String, String> headers, List<ReadRecord> records, TaskContext context) {
        if (records.isEmpty()) {
            return TaskResult.success("REST task skipped because there are no parsed records");
        }

        int successfulCalls = 0;
        for (int index = 0; index < records.size(); index++) {
            ReadRecord record = records.get(index);
            Map<String, Object> variables = RestTaskSupport.buildRecordVariables(record, index, records.size(),
                    context);
            String resolvedUrl = RestTaskSupport.template(urlTemplate, variables);
            String resolvedBody = RestTaskSupport.resolveBody(bodyTemplate, record, objectMapper, variables);
            HttpRequest request = buildRequest(configuration, method, resolvedUrl, resolvedBody, timeoutSeconds,
                    headers);
            send(request);
            successfulCalls++;
        }
        return TaskResult.success("REST task completed with " + successfulCalls + " successful calls");
    }

    private TaskResult executeSingle(Map<String, Object> configuration, String method, String urlTemplate,
            String bodyTemplate,
            int timeoutSeconds, Map<String, String> headers, List<ReadRecord> records, TaskContext context) {
        Map<String, Object> variables = RestTaskSupport.buildBatchVariables(records, context, objectMapper);
        String resolvedUrl = RestTaskSupport.template(urlTemplate, variables);
        String resolvedBody = RestTaskSupport.resolveBatchBody(bodyTemplate, records, objectMapper, variables);
        HttpRequest request = buildRequest(configuration, method, resolvedUrl, resolvedBody, timeoutSeconds, headers);
        send(request);
        return TaskResult.success("REST task completed with a single call for " + records.size() + " records");
    }

    private HttpRequest buildRequest(Map<String, Object> configuration, String method, String url, String body,
            int timeoutSeconds, Map<String, String> headers) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds));

        headers.forEach(builder::header);
        applyAuthentication(builder, configuration);

        return switch (method) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "PATCH" ->
                builder.method("PATCH", HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "DELETE" ->
                builder.method("DELETE", HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            default -> builder.GET().build();
        };
    }

    private void applyAuthentication(HttpRequest.Builder builder, Map<String, Object> configuration) {
        String authType = configuration.get("authType") == null ? null : String.valueOf(configuration.get("authType"));
        if (authType == null || authType.isBlank()) {
            return;
        }

        switch (authType.toLowerCase()) {
            case "basic" -> {
                String username = RestTaskSupport.requireString(configuration, "username");
                String password = RestTaskSupport.requireString(configuration, "password");
                String token = Base64.getEncoder()
                        .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
                builder.header("Authorization", "Basic " + token);
            }
            case "bearer" ->
                builder.header("Authorization", "Bearer " + RestTaskSupport.requireString(configuration, "token"));
            default -> throw new IllegalArgumentException("Unsupported REST task authType: " + authType);
        }
    }

    private void send(HttpRequest request) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "REST task returned status " + response.statusCode() + " with body: " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("REST task was interrupted", e);
        } catch (IOException e) {
            throw new IllegalStateException("REST task failed to call target API", e);
        }
    }
}
