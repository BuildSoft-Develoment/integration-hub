package com.integrationhub.platform.provider.task;

import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.TaskContext;
import com.integrationhub.platform.spi.TaskProvider;
import com.integrationhub.platform.spi.TaskResult;
import com.integrationhub.platform.service.AuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Logger;

@ApplicationScoped
public class NotificationTaskProvider implements TaskProvider {

    private static final Logger LOGGER = Logger.getLogger(NotificationTaskProvider.class.getName());

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Inject
    AuditService auditService;

    @Override
    public String type() {
        return "NOTIFICATION";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        String channel = String.valueOf(configuration.getOrDefault("channel", "log")).toLowerCase();
        Map<String, Object> variables = buildVariables(context, configuration);

        return switch (channel) {
            case "log" -> sendLog(context, configuration, variables);
            case "webhook" -> sendWebhook(context, configuration, variables);
            case "email" -> sendEmailPlaceholder(context, configuration, variables);
            default -> throw new IllegalArgumentException("Unsupported notification channel: " + channel);
        };
    }

    private TaskResult sendLog(TaskContext context, Map<String, Object> configuration, Map<String, Object> variables) {
        String messageTemplate = String.valueOf(configuration.getOrDefault("message", "Process ${processExecutionId} completed with ${recordCount} records"));
        String message = NotificationTaskSupport.template(messageTemplate, variables);
        LOGGER.info(message);
        auditService.record(context.processExecution(), context.taskDefinition(), "NOTIFICATION_SENT", "COMPLETED", message, Map.of("channel", "log"));
        return TaskResult.success("Notification sent to log");
    }

    private TaskResult sendWebhook(TaskContext context, Map<String, Object> configuration, Map<String, Object> variables) {
        String url = NotificationTaskSupport.requireString(configuration, "url");
        String bodyTemplate = String.valueOf(configuration.getOrDefault("bodyTemplate", "{\"message\":\"${message}\"}"));
        String messageTemplate = String.valueOf(configuration.getOrDefault("message", "Process ${processExecutionId} completed"));
        String message = NotificationTaskSupport.template(messageTemplate, variables);
        variables.put("message", message);
        String body = NotificationTaskSupport.template(bodyTemplate, variables);
        Map<String, String> headers = NotificationTaskSupport.stringMap(configuration, "headers");
        int timeoutSeconds = NotificationTaskSupport.optionalInt(configuration, "timeoutSeconds", 15);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(body));
        headers.forEach(builder::header);
        if (!headers.containsKey("Content-Type")) {
            builder.header("Content-Type", "application/json");
        }

        try {
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Webhook notification returned status " + response.statusCode());
            }
            auditService.record(context.processExecution(), context.taskDefinition(), "NOTIFICATION_SENT", "COMPLETED", message, Map.of("channel", "webhook", "url", url));
            return TaskResult.success("Webhook notification sent successfully");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Webhook notification interrupted", e);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot send webhook notification", e);
        }
    }

    private TaskResult sendEmailPlaceholder(TaskContext context, Map<String, Object> configuration, Map<String, Object> variables) {
        String to = NotificationTaskSupport.requireString(configuration, "to");
        String subjectTemplate = String.valueOf(configuration.getOrDefault("subject", "Process ${processExecutionId} notification"));
        String bodyTemplate = String.valueOf(configuration.getOrDefault("body", "Process ${processExecutionId} completed with ${recordCount} records"));
        String subject = NotificationTaskSupport.template(subjectTemplate, variables);
        String body = NotificationTaskSupport.template(bodyTemplate, variables);
        LOGGER.info("EMAIL notification prepared to " + to + " with subject: " + subject + " and body: " + body);
        auditService.record(context.processExecution(), context.taskDefinition(), "NOTIFICATION_PREPARED", "COMPLETED", subject, Map.of("channel", "email", "to", to, "body", body));
        return TaskResult.success("Email notification prepared for " + to);
    }

    private Map<String, Object> buildVariables(TaskContext context, Map<String, Object> configuration) {
        Map<String, Object> variables = new LinkedHashMap<>();
        ReadResult readResult = (ReadResult) context.attributes().get("readResult");
        variables.put("processExecutionId", context.processExecution().id);
        variables.put("taskDefinitionId", context.taskDefinition().id);
        variables.put("recordCount", readResult == null ? 0 : readResult.recordCount());
        TaskOutputSupport.mergeTaskOutputs(variables, context);
        configuration.forEach((key, value) -> {
            if (value instanceof String stringValue) {
                variables.putIfAbsent(key, stringValue);
            }
        });
        return variables;
    }
}
