package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Auto-despertar de suspensiones M-2 con vencimiento: reanuda las tareas
 * {@code SUSPENDED} cuyo {@code suspend_expires_at} ya paso (tipicamente
 * {@code MT101_STATUS mode=poll}, que fija el vencimiento via
 * {@link SuspensionExpiry#RESUME_AFTER_SECONDS_KEY} en su estado).
 *
 * <p>Las suspensiones sin vencimiento (callback puro) nunca aparecen aqui:
 * esperan el POST externo indefinidamente.</p>
 *
 * <p>El resume se invoca con {@code externalEvent = {trigger: "SCHEDULER_EXPIRY"}};
 * un fallo en una suspension no detiene el barrido de las demas. Si el provider
 * re-suspende con nuevo vencimiento, el ciclo continua en el siguiente tick.</p>
 *
 * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@ApplicationScoped
public class SuspensionExpiryScheduler {

    private static final Logger LOG = Logger.getLogger(SuspensionExpiryScheduler.class);
    private static final int MAX_PER_SWEEP = 100;

    private final ProcessTaskExecutionRepository taskExecutionRepository;
    private final ProcessExecutionResumeService resumeService;

    public SuspensionExpiryScheduler(ProcessTaskExecutionRepository taskExecutionRepository,
                                     ProcessExecutionResumeService resumeService) {
        this.taskExecutionRepository = taskExecutionRepository;
        this.resumeService = resumeService;
    }

    @Scheduled(every = "{integrationhub.suspension.expiry-check-every:60s}")
    void resumeExpiredSuspensions() {
        var tokens = expiredTokens();
        for (var token : tokens) {
            try {
                var outcome = resumeService.resume(token, Map.of("trigger", "SCHEDULER_EXPIRY"));
                LOG.infof("Suspension expiry resume token=%s outcome=%s", token, outcome.outcome());
            } catch (ProcessExecutionResumeService.SuspensionNotFoundException raced) {
                // Otro nodo/callback la reanudo entre el query y el resume: benigno.
                LOG.debugf("Suspension already resumed for token=%s", token);
            } catch (RuntimeException error) {
                // El resume fallido ya dejo la tarea/proceso en FAILED via el
                // resume service; seguimos con el resto del barrido.
                LOG.errorf(error, "Suspension expiry resume failed for token=%s", token);
            }
        }
    }

    /** Lectura en su propia transaccion: el resume maneja la suya. */
    @Transactional
    List<String> expiredTokens() {
        var expired = taskExecutionRepository.findExpiredSuspensions(LocalDateTime.now(), MAX_PER_SWEEP);
        var tokens = new ArrayList<String>(expired.size());
        for (var taskExecution : expired) {
            if (taskExecution.resumeToken != null && !taskExecution.resumeToken.isBlank()) {
                tokens.add(taskExecution.resumeToken);
            }
        }
        return tokens;
    }
}
