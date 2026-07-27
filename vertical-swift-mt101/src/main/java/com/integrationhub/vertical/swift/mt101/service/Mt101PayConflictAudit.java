package com.integrationhub.vertical.swift.mt101.service;

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

    /**
     * Maker-checker paso 1: trama append-only {@code PAY_CONFLICT_ACK_REQUESTED} que registra que un MAKER
     * <b>solicitó</b> reconocer el conflicto (con motivo + ticket), <b>sin</b> limpiar el flag. La aprobación
     * posterior de un checker distinto emite {@code PAY_CONFLICT_RESOLVED}. Deja el rastro inmutable de la
     * solicitud (gobernanza / segregación de funciones), aparte del historial en {@code mt101_pay_conflict_ack_request}.
     */
    public static AuditEnvelope requestedEnvelope(Long processExecutionId,
                                                  Long taskDefinitionId,
                                                  String sendersReference,
                                                  String retainedStatus,
                                                  String maker,
                                                  String reason,
                                                  String ticketRef,
                                                  String originalReason) {
        var attributes = new LinkedHashMap<String, String>();
        attributes.put("retainedStatus", retainedStatus);
        if (maker != null && !maker.isBlank()) {
            attributes.put("maker", maker);
        }
        if (reason != null && !reason.isBlank()) {
            attributes.put("reason", reason);
        }
        if (ticketRef != null && !ticketRef.isBlank()) {
            attributes.put("ticketRef", ticketRef);
        }
        if (originalReason != null && !originalReason.isBlank()) {
            attributes.put("originalConflictReason", originalReason);
        }
        var message = "reconocimiento de conflicto PAY SOLICITADO por " + (maker == null ? "?" : maker)
                + " (pendiente de aprobación de un checker distinto); terminal '" + retainedStatus + "'"
                + (reason == null || reason.isBlank() ? "" : " — " + reason);
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                sendersReference,
                AuditLevel.RECORD,
                "PAY_CONFLICT_ACK_REQUESTED",
                "PAY_CONFLICT_ACK_REQUESTED",
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
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    /**
     * Maker-checker (gobernanza): trama append-only {@code PAY_CONFLICT_ACK_SUPERSEDED} que registra que una solicitud
     * PENDING previa fue <b>reemplazada</b> por una nueva (otro —o el mismo— maker re-solicitó). El historial ya queda
     * en {@code mt101_pay_conflict_ack_request} (status SUPERSEDED), pero esta trama lo deja inmutable en el spool:
     * quién quedó reemplazado, con qué motivo/ticket, y quién lo reemplaza. Auditoría fina de "cuándo y por quién".
     */
    public static AuditEnvelope supersededEnvelope(Long processExecutionId,
                                                   Long taskDefinitionId,
                                                   String sendersReference,
                                                   String retainedStatus,
                                                   String supersededMaker,
                                                   String supersededReason,
                                                   String supersededTicketRef,
                                                   String newMaker) {
        var attributes = new LinkedHashMap<String, String>();
        attributes.put("retainedStatus", retainedStatus);
        if (supersededMaker != null && !supersededMaker.isBlank()) {
            attributes.put("supersededMaker", supersededMaker);
        }
        if (supersededReason != null && !supersededReason.isBlank()) {
            attributes.put("supersededReason", supersededReason);
        }
        if (supersededTicketRef != null && !supersededTicketRef.isBlank()) {
            attributes.put("supersededTicketRef", supersededTicketRef);
        }
        if (newMaker != null && !newMaker.isBlank()) {
            attributes.put("newMaker", newMaker);
        }
        var message = "solicitud de reconocimiento de " + (supersededMaker == null ? "?" : supersededMaker)
                + " REEMPLAZADA por una nueva de " + (newMaker == null ? "?" : newMaker) + "; terminal '"
                + retainedStatus + "' (sin cambios en el dinero; historial de gobernanza)";
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                sendersReference,
                AuditLevel.RECORD,
                "PAY_CONFLICT_ACK_SUPERSEDED",
                "PAY_CONFLICT_ACK_SUPERSEDED",
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
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    /**
     * A2 (resolución gobernada): trama append-only {@code PAY_CONFLICT_RESOLVED} que registra que un operador
     * <b>reconoció</b> el conflicto (limpió el flag) con su motivo, <b>conservando</b> el terminal real del ledger
     * ({@code retainedStatus}). NO cambia el dinero: es la evidencia auditable de la decisión humana.
     */
    public static AuditEnvelope resolvedEnvelope(Long processExecutionId,
                                                 Long taskDefinitionId,
                                                 String sendersReference,
                                                 String retainedStatus,
                                                 String actor,
                                                 String reason,
                                                 String ticketRef,
                                                 String originalReason) {
        var attributes = new LinkedHashMap<String, String>();
        attributes.put("retainedStatus", retainedStatus);
        if (actor != null && !actor.isBlank()) {
            attributes.put("actor", actor);
        }
        if (reason != null && !reason.isBlank()) {
            attributes.put("reason", reason);
        }
        if (ticketRef != null && !ticketRef.isBlank()) {
            attributes.put("ticketRef", ticketRef);
        }
        // El motivo ORIGINAL del conflicto (que dijo el banco) viaja en la trama para lineage completo, aparte
        // del motivo del reconocimiento.
        if (originalReason != null && !originalReason.isBlank()) {
            attributes.put("originalConflictReason", originalReason);
        }
        var message = "conflicto PAY reconocido por " + (actor == null ? "?" : actor) + ": se conserva el terminal '"
                + retainedStatus + "'" + (reason == null || reason.isBlank() ? "" : " — " + reason);
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                sendersReference,
                AuditLevel.RECORD,
                "PAY_CONFLICT_RESOLVED",
                "PAY_CONFLICT_RESOLVED",
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
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }
}
