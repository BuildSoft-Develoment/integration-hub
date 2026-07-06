package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.service.messaging.AsyncAvailabilityService.State;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * v59-fix / v60-fix (#4): derivación del estado compuesto de disponibilidad async a partir de los TRES gates + el
 * registro de brokers + la readiness EN VIVO del canal consumer. La lógica pura {@code derive(...)} se testea en
 * aislamiento (valor SOLID: sin HTTP ni CDI); el health del canal entra por la abstracción {@link ConsumerChannelHealth}.
 */
class AsyncAvailabilityServiceTest {

    /** Fake de la abstracción de health: readiness del canal controlada por el test (sin SmallRye). */
    private static ConsumerChannelHealth channelReady(boolean ready) {
        return channel -> ready && AsyncAvailabilityService.TASKS_IN_CHANNEL.equals(channel);
    }

    @Test
    void disabledWhenExecutionOff() {
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, true, true, true, true));
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, false, false, false, false));
    }

    @Test
    void degradedWhenExecutionOnButAnyOtherGateOff() {
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, false, true, true, true), "relay off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, false, false, true), "consumer off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, true, false), "sin brokers");
        // v60-fix: consumer habilitado pero NO conectado en vivo -> DEGRADED (antes mentía READY).
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, false, true), "consumer no vivo");
    }

    @Test
    void readyOnlyWhenAllGatesOnBrokerRegisteredAndConsumerLive() {
        assertEquals(State.READY, AsyncAvailabilityService.derive(true, true, true, true, true));
    }

    @Test
    void availabilityComputesBrokersRegisteredFromTheRegistry() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of());
        // execution+dispatch+consumer on y consumer vivo, pero SIN brokers -> DEGRADED.
        var noBroker = new AsyncAvailabilityService(brokers, channelReady(true), true, true, true).availability();
        assertFalse(noBroker.brokersRegistered());
        assertEquals(State.DEGRADED, noBroker.state());

        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        var withBroker = new AsyncAvailabilityService(brokers, channelReady(true), true, true, true).availability();
        assertTrue(withBroker.brokersRegistered());
        assertTrue(withBroker.consumerLive());
        assertEquals(State.READY, withBroker.state());
    }

    @Test
    void availabilityMarksConsumerNotLiveWhenChannelReadinessIsDown() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        // Todos los gates on + broker, pero el canal tasks-in NO está listo en vivo -> DEGRADED, consumerLive=false.
        var status = new AsyncAvailabilityService(brokers, channelReady(false), true, true, true).availability();
        assertTrue(status.consumerEnabled());
        assertFalse(status.consumerLive());
        assertEquals(State.DEGRADED, status.state());
    }

    @Test
    void availabilityDoesNotProbeChannelWhenConsumerDisabled() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        // consumer deshabilitado: consumerLive=false sin importar el health (no hay canal que sondear).
        var probeWouldSayReady = channelReady(true);
        var status = new AsyncAvailabilityService(brokers, probeWouldSayReady, true, true, false).availability();
        assertFalse(status.consumerEnabled());
        assertFalse(status.consumerLive());
        assertEquals(State.DEGRADED, status.state());
    }
}
