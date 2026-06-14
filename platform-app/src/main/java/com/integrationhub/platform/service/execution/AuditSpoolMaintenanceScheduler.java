package com.integrationhub.platform.service.execution;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Retencion automatica del spool de auditoria: purga periodicamente las filas
 * {@code SENT} mas viejas que la retencion configurada. El spool es un outbox
 * transitorio (ya entregado al MQ -> audit_event/cold store), no el system-of-record,
 * asi que borrar SENT es seguro y evita crecimiento ilimitado a alto volumen.
 *
 * <p>Complementa el endpoint manual {@code AuditSpoolResource}. Las filas
 * {@code DEAD} se conservan (requieren accion del operador).</p>
 */
@ApplicationScoped
public class AuditSpoolMaintenanceScheduler {

    private static final Logger LOG = Logger.getLogger(AuditSpoolMaintenanceScheduler.class);

    private final AuditSpoolOperationsService operationsService;
    private final boolean enabled;
    private final int retentionDays;
    private final int batchLimit;

    @Inject
    public AuditSpoolMaintenanceScheduler(
            AuditSpoolOperationsService operationsService,
            @ConfigProperty(name = "audit.spool.cleanup.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "audit.spool.cleanup.retention-days", defaultValue = "7") int retentionDays,
            @ConfigProperty(name = "audit.spool.cleanup.batch", defaultValue = "10000") int batchLimit) {
        this.operationsService = operationsService;
        this.enabled = enabled;
        this.retentionDays = retentionDays;
        this.batchLimit = batchLimit;
    }

    @Scheduled(every = "{audit.spool.cleanup.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void cleanup() {
        if (!enabled) {
            return;
        }
        var deleted = operationsService.cleanupSent(retentionDays, batchLimit);
        if (deleted > 0) {
            LOG.infof("Audit spool retention: purged %d SENT rows older than %d days", deleted, retentionDays);
        }
    }
}
