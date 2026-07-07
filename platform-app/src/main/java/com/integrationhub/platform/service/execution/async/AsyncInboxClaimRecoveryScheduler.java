package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.repository.TaskInboxRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * §5 recovery: barrido de claims del inbox <b>estancados</b> (CLAIMED con lease vencido más allá de una
 * gracia = el nodo dueño cayó sin finalizar). Los marca {@code DEAD} para que aparezcan en la consola DLQ.
 *
 * <p><b>Fail-safe a propósito</b> (misma regla de seguridad que el claim distribuido de {@code
 * process_execution}, v53-fix #8): un claim estancado pudo haber ejecutado el efecto externo o no —no se
 * sabe—, así que NO se re-inyecta a ciegas (eso re-ejecutaría). Se deja visible en DLQ para que ops lo
 * redrive con criterio (el redrive reconstruye la suspensión). Para un provider idempotente el redrive es
 * inocuo; para uno no-idempotente, la decisión es humana e informada.</p>
 *
 * <p><b>Gated OFF</b> por {@code tasks.async.inbox-claim-recovery.enabled} (default {@code false}): con el
 * lease + re-toma en {@code claim()}, una re-entrega normal ya recupera un claim de un nodo caído; este
 * sweep cubre el caso residual "trama ya ackeada, claim colgado" que ninguna re-entrega tocaría.</p>
 */
@ApplicationScoped
public class AsyncInboxClaimRecoveryScheduler {

    private static final Logger LOG = Logger.getLogger(AsyncInboxClaimRecoveryScheduler.class);

    private final TaskInboxRepository inboxRepository;
    private final boolean enabled;
    private final Duration grace;

    @Inject
    public AsyncInboxClaimRecoveryScheduler(
            TaskInboxRepository inboxRepository,
            @ConfigProperty(name = "tasks.async.inbox-claim-recovery.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "tasks.async.inbox-claim-recovery.grace", defaultValue = "5m") Duration grace) {
        this.inboxRepository = inboxRepository;
        this.enabled = enabled;
        this.grace = grace;
    }

    @Scheduled(every = "{tasks.async.inbox-claim-recovery.every:120s}",
            concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void sweep() {
        if (!enabled) {
            return;
        }
        try {
            recoverStaleClaims();
        } catch (RuntimeException error) {
            LOG.warnf(error, "Async inbox claim recovery: sweep falló; se reintenta en el próximo tick");
        }
    }

    /** Marca DEAD los claims cuyo lease venció hace más que {@code grace}. Devuelve el conteo (testeable). */
    public int recoverStaleClaims() {
        var cutoff = LocalDateTime.now().minus(grace);
        var recovered = inboxRepository.markExpiredClaimsDead(Timestamp.valueOf(cutoff),
                "claim con lease vencido (nodo caído); el efecto pudo haber corrido — redrive con criterio (§5)");
        if (recovered > 0) {
            LOG.warnf("Async inbox claim recovery: %d claim(s) estancado(s) marcados DEAD (visibles en DLQ)", recovered);
        }
        return recovered;
    }
}
