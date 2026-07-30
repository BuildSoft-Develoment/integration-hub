package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import com.integrationhub.platform.service.messaging.ChannelHealth;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E negativo (#4b): con el canal producer {@code audit-out} apuntando a un broker Kafka <b>inalcanzable</b>, su
 * readiness es {@code false}, así que {@code dispatchLive} debe ser {@code false} y el estado NO puede ser READY —
 * aunque execution+dispatch estén habilitados. Es la prueba que exigía el doble-check: sin ella, {@code dispatchLive}
 * podría ser un flag que miente (readiness outgoing que reporta UP con el broker caído). El diagnóstico previo confirmó
 * empíricamente que {@code audit-out} reporta readiness=false con bootstrap inválido; este IT lo blinda como regresión.
 */
@QuarkusTest
@TestProfile(AsyncDispatchLivenessBadBrokerIT.UnreachableKafkaProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncDispatchLivenessBadBrokerIT {

    public static class UnreachableKafkaProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "quarkus.devservices.enabled", "false",
                    "quarkus.kafka.devservices.enabled", "false",
                    "mp.messaging.outgoing.audit-out.connector", "smallrye-kafka",
                    "mp.messaging.outgoing.audit-out.bootstrap.servers", "localhost:59999",
                    "kafka.bootstrap.servers", "localhost:59999",
                    "mp.messaging.outgoing.audit-out.health-readiness-enabled", "true",
                    "tasks.async.execution.enabled", "true",
                    "tasks.dispatch.enabled", "true"
            );
        }
    }

    @Inject
    AsyncAvailabilityService asyncAvailability;

    @Inject
    ChannelHealth channelHealth;

    @Test
    void dispatchLiveIsFalseAndStateNotReadyWhenTheProducerCannotReachTheBroker() throws Exception {
        assertTrue(awaitDispatchNotLive(Duration.ofSeconds(20)),
                "la readiness del canal producer audit-out debe pasar a false con un broker inalcanzable");

        var availability = asyncAvailability.availability();
        assertFalse(availability.dispatchLive(),
                "dispatchLive debe ser false: el producer no está conectado al broker");
        assertNotEquals(AsyncAvailabilityService.State.READY, availability.state(),
                "el estado no puede ser READY si el producer no puede publicar al broker");
    }

    private boolean awaitDispatchNotLive(Duration timeout) throws InterruptedException {
        var deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            if (!channelHealth.ready(AsyncAvailabilityService.DISPATCH_CHANNEL)) {
                return true;
            }
            Thread.sleep(500);
        }
        return false;
    }
}
