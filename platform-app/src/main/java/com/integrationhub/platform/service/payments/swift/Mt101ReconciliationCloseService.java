package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * v54-fix (follow-up de v53) — cierra el ciclo de vida de una ejecución en {@code NEEDS_RECONCILIATION}.
 * La recuperación de v53 marca así una ejecución huérfana que ya inició PAY (nunca re-ejecución a ciegas). Una vez el
 * operador reconcilió sus fragmentos (por {@code resolve-uncertain-normal-pay} v52 o el correctivo), este servicio la
 * cierra a {@code COMPLETED}/{@code COMPLETED_WITH_ERRORS}.
 *
 * <p><b>Guard de terminalidad (doble-check):</b> solo cierra si TODOS los fragmentos de la ejecución alcanzaron un
 * terminal de despacho ({@code SENT/CONFIRMED/RECONCILED/REJECTED/SUPERSEDED}). Si queda alguno no-terminal
 * (p.ej. {@code ARCHIVED} nunca enviado, o {@code UNCERTAIN}/{@code DISPATCHING} sin resolver) → RECHAZA: cerrar como
 * completado con pagos pendientes sería un falso-completado. NUNCA re-ejecuta ni reenvía.</p>
 */
@ApplicationScoped
public class Mt101ReconciliationCloseService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final ProcessExecutionStateService processExecutionStateService;

    @Inject
    public Mt101ReconciliationCloseService(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           Mt101FragmentRepository fragmentRepository,
                                           ProcessExecutionStateService processExecutionStateService) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.processExecutionStateService = processExecutionStateService;
    }

    public CloseResult closeReconciledExecution(String connectionRef, Long processExecutionId,
                                                String executedBy, String reason) {
        if (processExecutionId == null) {
            throw new IllegalArgumentException("processExecutionId is required");
        }
        require(executedBy, "executedBy");
        var reasonText = require(reason, "reason");
        var execution = processExecutionStateService.getExecution(processExecutionId);
        if (execution == null) {
            throw new IllegalArgumentException("process execution not found: " + processExecutionId);
        }
        if (execution.status != ExecutionStatus.NEEDS_RECONCILIATION) {
            throw new IllegalStateException("process execution " + processExecutionId
                    + " must be NEEDS_RECONCILIATION to close after reconciliation; current status is "
                    + execution.status);
        }
        Mt101FragmentRepository.ReconciliationSummary summary;
        try {
            summary = fragmentRepository.reconciliationSummary(resolveDataSource(connectionRef), processExecutionId);
        } catch (SQLException error) {
            throw new IllegalStateException("cannot read fragment reconciliation summary for execution "
                    + processExecutionId + ": " + error.getMessage(), error);
        }
        if (summary.nonTerminal() > 0) {
            throw new IllegalStateException("cannot close execution " + processExecutionId + ": "
                    + summary.nonTerminal() + " of " + summary.total() + " fragment(s) are not in a terminal dispatch "
                    + "state (resolve UNCERTAIN/DISPATCHING or complete the send of ARCHIVED first); no blind close");
        }
        var withErrors = summary.rejected() > 0;
        var details = reasonText + " | reconciled close by " + executedBy + " (total=" + summary.total()
                + ", rejected=" + summary.rejected() + ")";
        if (!processExecutionStateService.closeReconciled(processExecutionId, withErrors, details)) {
            throw new IllegalStateException("process execution " + processExecutionId
                    + " was not in NEEDS_RECONCILIATION at close time (concurrent change)");
        }
        return new CloseResult(withErrors ? "COMPLETED_WITH_ERRORS" : "COMPLETED", summary.total(), summary.rejected());
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    /** Resultado del cierre: estado final + conteos reconciliados. */
    public record CloseResult(String status, long totalFragments, long rejectedFragments) {
    }
}
