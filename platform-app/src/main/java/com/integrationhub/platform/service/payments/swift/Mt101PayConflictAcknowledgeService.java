package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.AuditSpoolWriter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * A2 (resolución gobernada de PAY Conflicts): <b>reconoce</b> (acknowledge) un conflicto de pago con motivo.
 *
 * <p><b>Semántica segura para el dinero:</b> limpiar el flag {@code pay_conflict} y registrar el motivo, <b>SIN</b>
 * tocar el terminal real ({@code status}/{@code pay_status}). El operador afirma "revisé este conflicto, se conserva el
 * terminal del ledger, y este es el porqué". Nunca sobrescribe el estado a mano (eso sería mover dinero por UI). Deja
 * la trama append-only {@code PAY_CONFLICT_RESOLVED} (actor + motivo + terminal conservado) para auditoría/lineage.
 * Single-actor: la acción es gobernada por rol (no maker-checker) porque NO cambia el estado del pago.</p>
 *
 * <p><b>Atomicidad de auditoría:</b> la limpieza del flag {@code pay_conflict} y la trama {@code PAY_CONFLICT_RESOLVED}
 * se escriben en <b>una sola transacción</b> (el servicio abre la {@code Connection}, escribe el {@code UPDATE} y la
 * trama al spool vía {@link AuditSpoolWriter#writeBatch(java.sql.Connection, java.util.Collection)}, y hace
 * {@code commit}). Si el spool falla, hace {@code rollback}: nunca queda un conflicto "resuelto" sin su trama de
 * auditoría (a diferencia del emisor async del hot-path, que es best-effort y fuera de la tx de negocio).</p>
 */
@ApplicationScoped
public class Mt101PayConflictAcknowledgeService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository repository;
    private final AuditSpoolWriter auditSpoolWriter;

    @Inject
    public Mt101PayConflictAcknowledgeService(DataSource defaultDataSource,
                                              ConnectionPoolManager connectionPoolManager,
                                              Mt101FragmentRepository repository,
                                              AuditSpoolWriter auditSpoolWriter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.auditSpoolWriter = auditSpoolWriter;
    }

    /** Resultado del reconocimiento: cuántos fragmentos quedaron reconocidos (0 = ya no había conflicto → idempotente). */
    public record AcknowledgeResult(int acknowledged) {
    }

    /**
     * Reconoce el conflicto de un {@code :20:}. {@code source} = {@code NORMAL} (usa {@code fragmentSetId}) o
     * {@code CORRECTIVE} (usa {@code rebuildRunId}); {@code setOrRunId} es el identificador correspondiente. Requiere
     * {@code actor}, {@code reason} y {@code ticketRef}. Idempotente: si no hay conflicto abierto, no afecta filas ni
     * emite tramas. {@code source} se valida estrictamente (NORMAL|CORRECTIVE): un valor desconocido es 400, nunca
     * cae por defecto a NORMAL (eso reconocería el conflicto equivocado).
     */
    public AcknowledgeResult acknowledge(String connectionRef, String source, String setOrRunId,
                                         String sendersReference, String actor, String reason, String ticketRef) {
        if (sendersReference == null || sendersReference.isBlank()) {
            throw new IllegalArgumentException("sendersReference is required");
        }
        if (setOrRunId == null || setOrRunId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId (NORMAL) or rebuildRunId (CORRECTIVE) is required");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required to acknowledge a pay conflict");
        }
        if (ticketRef == null || ticketRef.isBlank()) {
            throw new IllegalArgumentException("ticketRef is required to acknowledge a pay conflict (traceability)");
        }
        var normalizedSource = source == null ? "" : source.trim().toUpperCase(java.util.Locale.ROOT);
        var corrective = switch (normalizedSource) {
            case "CORRECTIVE" -> true;
            case "NORMAL" -> false;
            default -> throw new IllegalArgumentException(
                    "source must be NORMAL or CORRECTIVE, got: '" + source + "'");
        };
        var actorName = actor == null || actor.isBlank() ? "unknown" : actor;
        var ackReason = reason.trim();
        var ticket = ticketRef.trim();
        var dataSource = resolveDataSource(connectionRef);
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var rows = corrective
                        ? repository.acknowledgeCorrectivePayConflict(connection, setOrRunId.trim(),
                                sendersReference.trim(), actorName, ackReason, ticket)
                        : repository.acknowledgeNormalPayConflict(connection, setOrRunId.trim(),
                                sendersReference.trim(), actorName, ackReason, ticket);
                var envelopes = rows.stream()
                        .map(row -> Mt101PayConflictAudit.resolvedEnvelope(
                                row.processExecutionId(), row.taskDefinitionId(), row.sendersReference(),
                                row.retainedStatus(), actor, ackReason, ticket, row.originalReason()))
                        .toList();
                // Atomicidad: la limpieza del flag y la trama PAY_CONFLICT_RESOLVED se escriben en la MISMA tx.
                // Si el spool falla, se hace rollback del flag → no queda un conflicto "resuelto" sin su trama.
                auditSpoolWriter.writeBatch(connection, envelopes);
                connection.commit();
                return new AcknowledgeResult(rows.size());
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot acknowledge pay conflict for " + sendersReference, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }
}
