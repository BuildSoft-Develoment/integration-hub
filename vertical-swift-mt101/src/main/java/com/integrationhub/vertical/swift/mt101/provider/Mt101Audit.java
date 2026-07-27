package com.integrationhub.vertical.swift.mt101.provider;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class Mt101Audit {

    private Mt101Audit() {
    }

    public static AuditEnvelope messageEvent(TaskContext context,
                                      Mt101Message message,
                                      String stage,
                                      String status,
                                      String detail,
                                      Map<String, String> attributes) {
        var reference = message != null && message.sequenceA() != null
                ? message.sequenceA().sendersReference()
                : null;
        var txRef = message != null && message.transactions() != null && message.transactions().size() == 1
                ? message.transactions().get(0).transactionReference()
                : null;
        var attrs = new LinkedHashMap<String, String>();
        if (attributes != null) {
            attrs.putAll(attributes);
        }
        if (message != null && message.transactions() != null) {
            attrs.putIfAbsent("transactionCount", String.valueOf(message.transactions().size()));
        }
        if (message != null && message.format() != null) {
            attrs.putIfAbsent("format", message.format());
        }
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                stage,
                status,
                context.processExecutionId(),
                context.taskDefinitionId(),
                detail,
                null,
                attrs,
                "SWIFT",
                "MT101",
                null,
                null,
                null,
                null,
                null,
                reference,
                txRef,
                message != null && message.envelope() != null ? message.envelope().uetr() : null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }
}
