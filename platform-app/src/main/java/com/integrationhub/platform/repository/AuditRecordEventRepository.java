package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.AuditRecordEvent;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Locale;

/**
 * Lectura del store frio para el visor de trazabilidad E2E por registro.
 */
@ApplicationScoped
public class AuditRecordEventRepository implements PanacheRepository<AuditRecordEvent> {

    /** Linea de tiempo de un registro (:20:) ordenada por instante del evento. */
    public List<AuditRecordEvent> timelineByRecordId(String recordId, int limit) {
        return find("recordId = ?1 order by eventTs asc, id asc", recordId).page(0, limit).list();
    }

    /** Linea de tiempo de toda una ejecucion/ingesta (traceId). */
    public List<AuditRecordEvent> timelineByTraceId(String traceId, int limit) {
        return find("traceId = ?1 order by eventTs asc, id asc", traceId).page(0, limit).list();
    }

    /** Linea de tiempo por clave funcional consultable (:20:, :21:, UETR, archivo/fila, etc.). */
    /**
     * Timeline por clave operativa (:20:, :21:, UETR, hash...). {@code processExecutionId} opcional desambigua
     * reprocesos: una misma {@code :20:} se repite entre corridas del mismo lote, asi que sin ejecucion trae todas;
     * si viene, acota a esa ejecucion (igual que {@link #timelineBySourceRow}). Si es null, trae todas.
     */
    public List<AuditRecordEvent> timelineByOperationalKey(String key, String value, Long processExecutionId,
                                                           int limit) {
        var normalized = key == null ? "" : key.trim().toLowerCase(Locale.ROOT);
        String field;
        Object typedValue = value;
        switch (normalized) {
            case "sourcefilehash", "source_file_hash" -> field = "sourceFileHash";
            case "businesskeyhash", "business_key_hash" -> field = "businessKeyHash";
            case "paymentreference", "payment_reference", "sendersreference", "senders_reference", "20" ->
                    field = "paymentReference";
            case "transactionreference", "transaction_reference", "21" -> field = "transactionReference";
            case "uetr" -> field = "uetr";
            case "gatewayreference", "gateway_reference" -> field = "gatewayReference";
            case "archiveid", "archive_id" -> {
                field = "archiveId";
                typedValue = Long.parseLong(value);
            }
            default -> throw new IllegalArgumentException("Unsupported lineage key: " + key);
        }
        // El nombre del campo sale del switch (constante controlada), no del input -> sin riesgo de inyeccion.
        if (processExecutionId == null) {
            return find(field + " = ?1 order by eventTs asc, id asc", typedValue).page(0, limit).list();
        }
        return find(field + " = ?1 and processExecutionId = ?2 order by eventTs asc, id asc",
                typedValue, processExecutionId).page(0, limit).list();
    }

    /**
     * B: timeline de una fila origen. {@code processExecutionId} opcional desambigua reprocesos del mismo archivo+fila
     * (varias ejecuciones dejan eventos bajo el mismo {@code (sourceFileHash, recordNumber)}); si es null, trae todos.
     */
    public List<AuditRecordEvent> timelineBySourceRow(String sourceFileHash, Long recordNumber,
                                                      Long processExecutionId, int limit) {
        if (processExecutionId == null) {
            return find("sourceFileHash = ?1 and recordNumber = ?2 order by eventTs asc, id asc",
                    sourceFileHash, recordNumber).page(0, limit).list();
        }
        return find("sourceFileHash = ?1 and recordNumber = ?2 and processExecutionId = ?3 order by eventTs asc, id asc",
                sourceFileHash, recordNumber, processExecutionId).page(0, limit).list();
    }
}
