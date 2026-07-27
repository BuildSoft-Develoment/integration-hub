package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.service.Mt101PayConflictAudit;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import com.integrationhub.platform.spi.engine.AuditSpoolGateway;
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
 * trama al spool vía {@link AuditSpoolGateway#writeBatch(java.sql.Connection, java.util.Collection)}, y hace
 * {@code commit}). Si el spool falla, hace {@code rollback}: nunca queda un conflicto "resuelto" sin su trama de
 * auditoría (a diferencia del emisor async del hot-path, que es best-effort y fuera de la tx de negocio).</p>
 */
@ApplicationScoped
public class Mt101PayConflictAcknowledgeService {

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101FragmentRepository repository;
    private final AuditSpoolGateway auditSpoolGateway;
    // Maker-checker OPT-IN (V99). Con false (default) el reconocimiento es single-actor (acknowledge). Con true se
    // exige el flujo de dos pasos (request-acknowledge del maker + approve-acknowledge del checker, actores distintos).
    // NO es un fallback: es el modo configurado por ambiente (off dev/UAT, on prod bancaria).
    private final boolean makerCheckerEnabled;

    @Inject
    public Mt101PayConflictAcknowledgeService(DataSource defaultDataSource,
                                              JdbcConnectionResolver connectionPoolManager,
                                              Mt101FragmentRepository repository,
                                              AuditSpoolGateway auditSpoolGateway,
                                              @org.eclipse.microprofile.config.inject.ConfigProperty(
                                                      name = "mt101.pay.conflict.acknowledge.maker-checker.enabled",
                                                      defaultValue = "false") boolean makerCheckerEnabled) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.auditSpoolGateway = auditSpoolGateway;
        this.makerCheckerEnabled = makerCheckerEnabled;
    }

    public boolean makerCheckerEnabled() {
        return makerCheckerEnabled;
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
        if (makerCheckerEnabled) {
            throw new IllegalArgumentException("maker-checker is enabled for pay-conflict acknowledge: use "
                    + "request-acknowledge (maker) then approve-acknowledge (checker, distinct actor), not "
                    + "single-actor acknowledge");
        }
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
                auditSpoolGateway.writeBatch(connection, envelopes);
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

    /**
     * Maker-checker paso 1 (MAKER): registra la intención de reconocer el conflicto (reason + ticket) SIN apagar la
     * alerta (pay_conflict sigue true). Requiere maker-checker habilitado. Fail-loud si no hay conflicto abierto.
     * En UNA transacción: superseda cualquier PENDING previo (conserva historial, no sobrescribe) + inserta la nueva
     * solicitud PENDING + emite la trama append-only {@code PAY_CONFLICT_ACK_REQUESTED}. Recién con la aprobación de
     * un checker DISTINTO se limpia el flag.
     */
    public void requestAcknowledge(String connectionRef, String source, String setOrRunId, String sendersReference,
                                   String actor, String reason, String ticketRef) {
        if (!makerCheckerEnabled) {
            throw new IllegalArgumentException("maker-checker is disabled: use single-actor acknowledge, not "
                    + "request-acknowledge");
        }
        var corrective = requireCommon(source, setOrRunId, sendersReference, reason, ticketRef);
        var maker = actor == null || actor.isBlank() ? "unknown" : actor;
        var ackReason = reason.trim();
        var ticket = ticketRef.trim();
        var normalizedSource = corrective ? "CORRECTIVE" : "NORMAL";
        var dataSource = resolveDataSource(connectionRef);
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var conflict = repository.readOpenPayConflict(connection, corrective, setOrRunId.trim(),
                        sendersReference.trim());
                if (conflict == null) {
                    throw new IllegalArgumentException("no open pay conflict for " + sendersReference
                            + " (nothing to acknowledge)");
                }
                // Historial: no se sobrescribe un PENDING previo -> se lee (para auditarlo), se marca SUPERSEDED y se
                // inserta la nueva solicitud. El unico indice parcial (un PENDING por conflicto) serializa concurrencia.
                var previousPending = repository.findPendingAckRequest(connection, normalizedSource, setOrRunId.trim(),
                        sendersReference.trim());
                repository.supersedePendingAckRequests(connection, normalizedSource, setOrRunId.trim(),
                        sendersReference.trim());
                repository.insertPendingAckRequest(connection, normalizedSource, setOrRunId.trim(),
                        sendersReference.trim(), maker, ackReason, ticket);
                // Tramas append-only (gobernanza), atomicas con la escritura del PENDING:
                //  - PAY_CONFLICT_ACK_SUPERSEDED (C): SOLO si habia un PENDING previo -> quien quedo reemplazado y por quien.
                //  - PAY_CONFLICT_ACK_REQUESTED: la nueva solicitud del maker (el flag NO se apaga hasta el checker).
                var envelopes = new java.util.ArrayList<com.integrationhub.platform.audit.AuditEnvelope>(2);
                if (previousPending != null) {
                    envelopes.add(Mt101PayConflictAudit.supersededEnvelope(conflict.processExecutionId(),
                            conflict.taskDefinitionId(), conflict.sendersReference(), conflict.retainedStatus(),
                            previousPending.requestedBy(), previousPending.reason(), previousPending.ticketRef(), maker));
                }
                envelopes.add(Mt101PayConflictAudit.requestedEnvelope(conflict.processExecutionId(),
                        conflict.taskDefinitionId(), conflict.sendersReference(), conflict.retainedStatus(),
                        maker, ackReason, ticket, conflict.originalReason()));
                auditSpoolGateway.writeBatch(connection, envelopes);
                connection.commit();
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot record acknowledge request for " + sendersReference, error);
        }
    }

    /**
     * Maker-checker paso 2 (CHECKER): un actor DISTINTO al maker aprueba la solicitud PENDING. En una sola
     * transacción limpia el flag pay_conflict (con el reason/ticket del maker) + marca la solicitud APPROVED + emite
     * la trama PAY_CONFLICT_RESOLVED con ambos actores. Fail-loud: sin PENDING, o si el checker == maker (segregación).
     */
    public AcknowledgeResult approveAcknowledge(String connectionRef, String source, String setOrRunId,
                                                String sendersReference, String approver) {
        if (!makerCheckerEnabled) {
            throw new IllegalArgumentException("maker-checker is disabled: use single-actor acknowledge, not "
                    + "approve-acknowledge");
        }
        if (approver == null || approver.isBlank()) {
            throw new IllegalArgumentException("approver (checker) is required");
        }
        var corrective = requireSourceAndIds(source, setOrRunId, sendersReference);
        var checker = approver.trim();
        var normalizedSource = corrective ? "CORRECTIVE" : "NORMAL";
        var dataSource = resolveDataSource(connectionRef);
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var pending = repository.findPendingAckRequest(connection, normalizedSource, setOrRunId.trim(),
                        sendersReference.trim());
                if (pending == null) {
                    throw new IllegalArgumentException("no pending acknowledge request for " + sendersReference
                            + " (a maker must request-acknowledge first)");
                }
                if (checker.equalsIgnoreCase(pending.requestedBy())) {
                    throw new IllegalArgumentException("segregation of duties: the checker (" + checker + ") must be "
                            + "a different actor from the maker who requested the acknowledge");
                }
                var rows = corrective
                        ? repository.acknowledgeCorrectivePayConflict(connection, setOrRunId.trim(),
                                sendersReference.trim(), checker, pending.reason(), pending.ticketRef())
                        : repository.acknowledgeNormalPayConflict(connection, setOrRunId.trim(),
                                sendersReference.trim(), checker, pending.reason(), pending.ticketRef());
                // Hardening (tanda-8 #9): la aprobación mueve DOS terminales que deben cerrar juntos o abortar —
                // limpiar el flag pay_conflict (rows) y marcar la solicitud APPROVED (guarded where status='PENDING').
                // En una carrera de dos checkers, el 2º lee el mismo PENDING pero el 1º ya cerró ambos: acknowledge*
                // devuelve 0 filas y markAckRequestApproved devuelve false. Sin este chequeo el 2º marcaría/retornaría
                // en silencio (0). Fail-loud → el catch hace rollback y el resource lo mapea a 400.
                var approved = repository.markAckRequestApproved(connection, pending.id(), checker);
                if (!approved) {
                    throw new IllegalArgumentException("the acknowledge request for " + sendersReference
                            + " was already resolved by another checker (no PENDING request left to approve)");
                }
                if (rows.isEmpty()) {
                    throw new IllegalArgumentException("no open pay conflict to acknowledge for " + sendersReference
                            + " (it was already resolved concurrently)");
                }
                var makerChecker = pending.reason() + " (maker: " + pending.requestedBy() + ", checker: " + checker + ")";
                var envelopes = rows.stream()
                        .map(row -> Mt101PayConflictAudit.resolvedEnvelope(
                                row.processExecutionId(), row.taskDefinitionId(), row.sendersReference(),
                                row.retainedStatus(), checker, makerChecker, pending.ticketRef(), row.originalReason()))
                        .toList();
                auditSpoolGateway.writeBatch(connection, envelopes);
                connection.commit();
                return new AcknowledgeResult(rows.size());
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot approve acknowledge for " + sendersReference, error);
        }
    }

    private boolean requireCommon(String source, String setOrRunId, String sendersReference, String reason,
                                  String ticketRef) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required to acknowledge a pay conflict");
        }
        if (ticketRef == null || ticketRef.isBlank()) {
            throw new IllegalArgumentException("ticketRef is required to acknowledge a pay conflict (traceability)");
        }
        return requireSourceAndIds(source, setOrRunId, sendersReference);
    }

    private boolean requireSourceAndIds(String source, String setOrRunId, String sendersReference) {
        if (sendersReference == null || sendersReference.isBlank()) {
            throw new IllegalArgumentException("sendersReference is required");
        }
        if (setOrRunId == null || setOrRunId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId (NORMAL) or rebuildRunId (CORRECTIVE) is required");
        }
        var normalizedSource = source == null ? "" : source.trim().toUpperCase(java.util.Locale.ROOT);
        return switch (normalizedSource) {
            case "CORRECTIVE" -> true;
            case "NORMAL" -> false;
            default -> throw new IllegalArgumentException("source must be NORMAL or CORRECTIVE, got: '" + source + "'");
        };
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }
}
