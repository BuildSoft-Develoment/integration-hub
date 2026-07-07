package com.integrationhub.platform.service.messaging;

import io.smallrye.reactive.messaging.health.HealthReport;
import io.smallrye.reactive.messaging.providers.extension.HealthCenter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

/**
 * v60-fix (#4) — readiness EN VIVO de un canal de reactive-messaging (por nombre), leída del {@link HealthCenter} de
 * smallrye-reactive-messaging (el componente que computa el mismo readiness que alimenta {@code /q/health/ready}).
 *
 * <p><b>Nota (validada por E2E):</b> se inyecta el bean concreto {@code HealthCenter} (que es {@code @ApplicationScoped}),
 * NO la interfaz {@code HealthReporter} — esta última NO está registrada como bean en Quarkus (un {@code Instance} de
 * ella queda <i>unsatisfied</i> y devolvería siempre {@code false}, dejando READY inalcanzable). El
 * {@code AsyncTaskKafkaConsumerE2EIT} atrapó exactamente ese fallo.</p>
 *
 * <p>Funciona para el canal consumer {@code tasks-in} (#4a) y el producer {@code audit-out} (#4b): ambos usan
 * {@code smallrye-kafka} y su readiness refleja la conectividad al broker (verificado: con un broker inalcanzable,
 * {@code audit-out} reporta readiness=false). <b>SRP</b>: solo traduce readiness→boolean por canal. <b>Falla
 * CERRADA</b>: si el componente no está, el canal no aparece, o la lectura lanza → {@code false}.</p>
 */
@ApplicationScoped
public class SmallRyeChannelHealth implements ChannelHealth {

    private final Instance<HealthCenter> healthCenter;

    public SmallRyeChannelHealth(Instance<HealthCenter> healthCenter) {
        this.healthCenter = healthCenter;
    }

    @Override
    public boolean ready(String channel) {
        if (channel == null || channel.isBlank() || healthCenter.isUnsatisfied() || healthCenter.isAmbiguous()) {
            return false;
        }
        try {
            HealthReport readiness = healthCenter.get().getReadiness();
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
