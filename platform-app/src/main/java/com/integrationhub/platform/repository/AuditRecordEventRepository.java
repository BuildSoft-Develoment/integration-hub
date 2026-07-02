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
    public List<AuditRecordEvent> timelineByOperationalKey(String key, String value, int limit) {
        var normalized = key == null ? "" : key.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "sourcefilehash", "source_file_hash" ->
                    find("sourceFileHash = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "businesskeyhash", "business_key_hash" ->
                    find("businessKeyHash = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "paymentreference", "payment_reference", "sendersreference", "senders_reference", "20" ->
                    find("paymentReference = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "transactionreference", "transaction_reference", "21" ->
                    find("transactionReference = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "uetr" ->
                    find("uetr = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "gatewayreference", "gateway_reference" ->
                    find("gatewayReference = ?1 order by eventTs asc, id asc", value).page(0, limit).list();
            case "archiveid", "archive_id" ->
                    find("archiveId = ?1 order by eventTs asc, id asc", Long.parseLong(value)).page(0, limit).list();
            default -> throw new IllegalArgumentException("Unsupported lineage key: " + key);
        };
    }

    public List<AuditRecordEvent> timelineBySourceRow(String sourceFileHash, Long recordNumber, int limit) {
        return find("sourceFileHash = ?1 and recordNumber = ?2 order by eventTs asc, id asc",
                sourceFileHash, recordNumber).page(0, limit).list();
    }
}
