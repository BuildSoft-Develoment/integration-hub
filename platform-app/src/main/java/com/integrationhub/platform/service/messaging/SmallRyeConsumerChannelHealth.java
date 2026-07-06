package com.integrationhub.platform.service.messaging;

import io.smallrye.reactive.messaging.health.HealthReport;
import io.smallrye.reactive.messaging.health.HealthReporter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

/**
 * v60-fix (#4 opción a) — readiness EN VIVO de un canal consumer, leída del {@code HealthReporter} de
 * smallrye-reactive-messaging (el mismo que alimenta {@code /q/health/ready}). El canal {@code tasks-in} usa el
 * conector {@code smallrye-kafka}: cuando está habilitado y conectado, aparece OK en la readiness; cuando está
 * deshabilitado (default) o desconectado, no aparece OK.
 *
 * <p><b>SRP</b>: solo traduce la readiness de SmallRye a un booleano por canal. <b>Falla CERRADA</b>: si el reporter
 * no está disponible, el canal no aparece, o la lectura lanza, devuelve {@code false} (no listo) — coherente con
 * "tratar != READY como no operativo".</p>
 */
@ApplicationScoped
public class SmallRyeConsumerChannelHealth implements ConsumerChannelHealth {

    private final Instance<HealthReporter> reporter;

    public SmallRyeConsumerChannelHealth(Instance<HealthReporter> reporter) {
        this.reporter = reporter;
    }

    @Override
    public boolean ready(String channel) {
        if (channel == null || channel.isBlank() || reporter.isUnsatisfied()) {
            return false;
        }
        try {
            HealthReport readiness = reporter.get().getReadiness();
            if (readiness == null) {
                return false;
            }
            return readiness.getChannels().stream()
                    .filter(info -> channel.equals(info.getChannel()))
                    .findFirst()
                    .map(HealthReport.ChannelInfo::isOk)
                    .orElse(false);
        } catch (RuntimeException error) {
            return false;
        }
    }
}
