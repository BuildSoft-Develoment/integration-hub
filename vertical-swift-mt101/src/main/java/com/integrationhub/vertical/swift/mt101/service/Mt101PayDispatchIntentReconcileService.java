package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.provider.Mt101PayDispatchIntentStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * D2 (reconciliación gobernada del PAY por lista): cierra el lazo del intent-ledger. Un dispatch que quedó
 * {@code UNCERTAIN} (o {@code DISPATCHING} colgado) bloquea el reenvío "hasta conciliar"; MT101_STATUS ya confirmó el
 * pago inline y dejó {@code mt101_archive.status} en el terminal clasificado, pero el intent seguía atascado. Este
 * servicio transiciona el intent leyendo ese terminal autoritativo (join por {@code (senders_reference,
 * process_execution_id)}), <b>sin re-consultar el gateway ni re-despachar</b>.
 *
 * <p>Gobernanza (money-path): acción explícita del operador con {@code executedBy} + {@code reason} obligatorios; la
 * evidencia (actor + motivo + terminal) queda durable en el intent. Solo actúa con un terminal <b>definitivo</b> del
 * archive; sin ejecución, sin match o sin terminal → no-op (queda atascado para conciliación manual), nunca un
 * desbloqueo ciego que arriesgue doble-pago.</p>
 */
@ApplicationScoped
public class Mt101PayDispatchIntentReconcileService {

    private final Mt101PayDispatchIntentStore store;

    @Inject
    public Mt101PayDispatchIntentReconcileService(Mt101PayDispatchIntentStore store) {
        this.store = store;
    }

    public ReconcileResult reconcile(String dispatchKey, String executedBy, String reason) {
        var key = require(dispatchKey, "dispatchKey");
        var actor = require(executedBy, "executedBy");
        var motive = require(reason, "reason");

        var stuck = store.findStuckByKey(key);
        if (stuck == null) {
            // No existe o ya no está atascada (otro la resolvió): nada que hacer.
            return new ReconcileResult(Outcome.NOT_STUCK, null);
        }
        if (stuck.processExecutionId() == null) {
            // Sin ejecución no se puede acotar el join al archive → queda manual (no se adivina el pago).
            return new ReconcileResult(Outcome.NO_EXECUTION, null);
        }
        var terminal = store.archiveTerminalStatus(stuck.sendersReference(), stuck.processExecutionId());
        if (terminal == null) {
            // El archive aún no está en un terminal (STATUS no concluyó, o query gatewayReference-based): manual.
            return new ReconcileResult(Outcome.NO_TERMINAL, null);
        }
        var evidence = "reconciled " + stuck.status() + "->" + terminal + " by " + actor
                + ": " + motive + " (archive=" + terminal + ")";
        var applied = store.reconcileToTerminal(key, terminal, evidence);
        if (applied == 0) {
            // Carrera: dejó de estar atascada entre la lectura y el update.
            return new ReconcileResult(Outcome.NOT_STUCK, null);
        }
        return new ReconcileResult(Outcome.RECONCILED, terminal);
    }

    private static String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("MT101 pay dispatch intent reconcile requires a non-blank " + field);
        }
        return value.trim();
    }

    /** Resultado del reconcile: qué pasó y (si aplica) el nuevo estado terminal. */
    public record ReconcileResult(Outcome outcome, String newStatus) {
    }

    public enum Outcome {
        /** Transicionado al terminal del archive (newStatus = SENT/REJECTED). */
        RECONCILED,
        /** No existe o ya no estaba atascada. */
        NOT_STUCK,
        /** Sin process_execution_id: no se puede acotar → manual. */
        NO_EXECUTION,
        /** El archive aún no está en un terminal definitivo → manual. */
        NO_TERMINAL
    }
}
