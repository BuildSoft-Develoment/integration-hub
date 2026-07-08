package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

/**
 * §5 (F3): mantiene VIVO el lease del claim mientras corre un efecto largo, renovándolo periódicamente en
 * background. Responsabilidad única: envolver la ejecución del efecto con un heartbeat owner-scoped.
 *
 * <p>Sin esto, una ejecución que excede el lease queda re-reclamable: una reentrega (rebalance de Kafka, crash/
 * restart) durante la ejecución podría re-tomar el claim en otro nodo y <b>duplicar el efecto externo</b>. El
 * fencing del finalize ({@code inbox_owner}) evita el doble <i>finalize</i>, pero no el doble <i>efecto</i>; el
 * heartbeat cierra esa ventana manteniendo {@code claimed_until} adelantado mientras el dueño sigue vivo.</p>
 *
 * <p>Overhead nulo para tareas rápidas: la primera renovación es a {@code lease/2}, así que un efecto que termina
 * antes nunca dispara una escritura. Un pool compartido y pequeño atiende todas las renovaciones en vuelo (son
 * UPDATEs cortos). Si el dueño muere, el heartbeat para y el lease vence de forma natural (recuperación estándar).</p>
 */
@ApplicationScoped
public class LeaseHeartbeat {

    private static final Logger LOG = Logger.getLogger(LeaseHeartbeat.class);

    private final TaskInboxStore inbox;
    private final int leaseSeconds;
    private final long periodSeconds;
    private final ScheduledExecutorService scheduler;

    @Inject
    public LeaseHeartbeat(
            TaskInboxStore inbox,
            @ConfigProperty(name = "tasks.async.consumer.claim-lease-seconds", defaultValue = "30") int leaseSeconds,
            @ConfigProperty(name = "tasks.async.consumer.heartbeat-threads", defaultValue = "2") int threads) {
        this.inbox = inbox;
        this.leaseSeconds = Math.max(2, leaseSeconds);
        // Renueva a mitad de vida: el lease queda siempre adelantado por [lease/2, lease].
        this.periodSeconds = Math.max(1, this.leaseSeconds / 2);
        this.scheduler = Executors.newScheduledThreadPool(Math.max(1, threads), daemonThreadFactory());
    }

    /**
     * Ejecuta {@code work} (el efecto, síncrono, en el hilo actual) mientras un heartbeat renueva el lease del
     * claim de {@code envelope} (dueño {@code owner}) cada {@code lease/2}. Cancela la renovación al terminar,
     * incluso si {@code work} lanza. Un heartbeat que dispara tras finalizar es un no-op seguro (la fila ya no
     * está {@code CLAIMED}).
     */
    public <T> T runWithHeartbeat(AsyncTaskEnvelope envelope, String owner, Supplier<T> work) {
        var future = scheduler.scheduleAtFixedRate(
                () -> renew(envelope, owner), periodSeconds, periodSeconds, TimeUnit.SECONDS);
        try {
            return work.get();
        } finally {
            future.cancel(false);
        }
    }

    private void renew(AsyncTaskEnvelope envelope, String owner) {
        try {
            if (!inbox.renewLease(envelope, owner, leaseSeconds)) {
                // El claim ya no es nuestro (re-tomado) o ya finalizó: no hay nada que renovar. No se puede abortar
                // un execute() en curso; el fencing del finalize (owner) es la red si el efecto se duplicó.
                LOG.debugf("Async heartbeat: lease de %s ya no renovable por %s (re-tomado/terminal)",
                        envelope.idempotencyKey(), owner);
            }
        } catch (RuntimeException error) {
            // Un fallo transitorio de BD al renovar no debe tumbar la ejecución en curso; se reintenta al próximo tick.
            LOG.warnf(error, "Async heartbeat: fallo al renovar el lease de %s", envelope.idempotencyKey());
        }
    }

    private static ThreadFactory daemonThreadFactory() {
        var counter = new AtomicInteger();
        return runnable -> {
            var thread = new Thread(runnable, "async-lease-heartbeat-" + counter.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
    }

    @PreDestroy
    void shutdown() {
        scheduler.shutdownNow();
    }
}
