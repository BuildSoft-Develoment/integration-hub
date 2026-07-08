package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.UUID;

/**
 * Factory ÚNICA de la trama append-only {@code PAY_CONFLICT} del PAY normal (DRY, SRP). La emiten AMBOS lados de la
 * simetría del conflicto terminal:
 * <ul>
 *   <li>{@code WORKER}: un resultado terminal tardío del despacho contradijo un estado ya resuelto por STATUS;</li>
 *   <li>{@code STATUS}: el banco (vía MT101_STATUS/RECONCILE) devolvió {@code REJECTED} sobre un fragmento ya
 *       {@code SENT}.</li>
 * </ul>
 * No se sobrescribe el estado real; esta trama deja la evidencia conciliable (auditoría/timeline/UI) con el
 * {@code source}, el {@code actor}, el estado previo, el resultado entrante y la referencia del gateway.
 */
public final class Mt101PayConflictAudit {

    /** Lado que detectó la contradicción terminal. */
    public enum Source {
        WORKER,
        STATUS
    }

    private Mt101PayConflictAudit() {
    }

    public static AuditEnvelope envelope(Long processExecutionId,
                                         Long taskDefinitionId,
                                         String sendersReference,
                                         String previousStatus,
                                         String incomingTerminal,
                                         String gatewayReference,
                                         Source source,
                                         String actor) {
        var attributes = new LinkedHashMap<String, String>();
        attributes.put("previousStatus", previousStatus);
        attributes.put("incomingTerminal", incomingTerminal);
        attributes.put("source", source.name());
        if (gatewayReference != null && !gatewayReference.isBlank()) {
            attributes.put("gatewayReference", gatewayReference);
        }
        if (actor != null && !actor.isBlank()) {
            attributes.put("actor", actor);
        }
        var message = "conflicto PAY normal: resultado '" + incomingTerminal + "' contradijo el estado ya resuelto '"
                + previousStatus + "' (source=" + source + "); no se sobrescribió — conciliar";
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                sendersReference,
                AuditLevel.RECORD,
                "PAY_CONFLICT",
                "PAY_CONFLICT",
                processExecutionId,
                taskDefinitionId,
                message,
                null,
                attributes,
                "SWIFT",
                "MT101",
                null,
                null,
                null,
                null,
                null,
                sendersReference,
                null,
                null,
                null,
                gatewayReference,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }
}
