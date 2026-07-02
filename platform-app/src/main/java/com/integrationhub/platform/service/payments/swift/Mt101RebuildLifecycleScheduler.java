package com.integrationhub.platform.service.payments.swift;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

/**
 * R6: avanza el lifecycle de los rebuilds correctivos en curso
 * ({@code BUILT -> VALIDATED -> ARCHIVED -> SENT -> CONFIRMED -> RECONCILED}) sin depender
 * de que un operador abra la pantalla de cuarentena. Un correctivo confirmado por el banco
 * deja de quedarse "BUILT" hasta la siguiente vista.
 *
 * <p>Cada pasada persiste {@code last_lifecycle_sync_at} por run (via el servicio) y un
 * fallo aislado no detiene el resto del barrido.</p>
 */
@ApplicationScoped
public class Mt101RebuildLifecycleScheduler {

    private static final Logger LOG = Logger.getLogger(Mt101RebuildLifecycleScheduler.class);

    private final Mt101RebuildService rebuildService;

    public Mt101RebuildLifecycleScheduler(Mt101RebuildService rebuildService) {
        this.rebuildService = rebuildService;
    }

    @Scheduled(every = "{integrationhub.mt101.rebuild-lifecycle-sync-every:60s}")
    void synchronizeActiveLifecycles() {
        try {
            var advanced = rebuildService.synchronizeActiveLifecycles();
            if (advanced > 0) {
                LOG.infof("MT101 rebuild lifecycle sync advanced %d run(s)", advanced);
            }
        } catch (RuntimeException error) {
            LOG.errorf(error, "MT101 rebuild lifecycle sync failed");
        }
    }
}
