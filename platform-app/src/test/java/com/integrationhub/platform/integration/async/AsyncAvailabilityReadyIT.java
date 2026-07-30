package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.KafkaTestResource;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * E2E POSITIVO del estado compuesto (#4): con TODOS los gates habilitados y Kafka real conectado, el estado async
 * debe llegar a {@code READY} — exige, con el {@code HealthCenter} REAL (no mocks), que ambos canales estén vivos:
 * consumer {@code tasks-in} (#4a) Y producer {@code audit-out} (#4b), además de los tres gates + broker registrado.
 *
 * <p>Cierra el hueco que el doble-check detectó: las demás aserciones de READY usaban un {@code ChannelHealth}
 * mockeado; ninguna probaba que las piezas COMBINAN a READY contra el sistema real. Es la contraparte positiva del
 * {@code AsyncDispatchLivenessBadBrokerIT} (broker inalcanzable → nunca READY).</p>
 */
@QuarkusTest
@TestProfile(AsyncAvailabilityReadyIT.AllGatesKafkaProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(value = KafkaTestResource.class, restrictToAnnotatedClass = true)
class AsyncAvailabilityReadyIT {

    public static class AllGatesKafkaProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "tasks.async.execution.enabled", "true",
                    "tasks.dispatch.enabled", "true",
                    "mp.messaging.incoming.tasks-in.enabled", "true",
                    "mp.messaging.incoming.tasks-in.pattern", "false",
                    "mp.messaging.incoming.tasks-in.topic", "tasks.ready_probe",
                    "mp.messaging.incoming.tasks-in.auto.offset.reset", "earliest"
            );
        }
    }

    @Inject
    AsyncAvailabilityService asyncAvailability;

    @Test
    void stateReachesReadyWhenAllGatesOnAndBothKafkaChannelsAreLive() throws Exception {
        // Los canales se conectan de forma asíncrona al arranque → poll hasta READY.
        var deadline = System.currentTimeMillis() + Duration.ofSeconds(40).toMillis();
        AsyncAvailabilityService.AsyncAvailability last = null;
        while (System.currentTimeMillis() < deadline) {
            last = asyncAvailability.availability();
            if (last.state() == AsyncAvailabilityService.State.READY) {
                break;
            }
            Thread.sleep(500);
        }
        assertEquals(AsyncAvailabilityService.State.READY, last.state(),
                "con todos los gates on + Kafka real, READY debe ser alcanzable; ultimo estado="
                        + last + " (consumerLive=" + last.consumerLive() + ", dispatchLive=" + last.dispatchLive() + ")");
    }
}
