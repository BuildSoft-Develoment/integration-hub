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
 * v59/v60-fix (#4): derivación del estado compuesto async a partir de los TRES gates + registro de brokers + la
 * readiness EN VIVO de dos canales (consumer {@code tasks-in} y producer {@code audit-out}). La lógica pura
 * {@code derive(...)} se testea en aislamiento; el health de canal entra por la abstracción {@link ChannelHealth}.
 */
class AsyncAvailabilityServiceTest {

    /** Fake de la abstracción: readiness controlada por canal (sin SmallRye). */
    private static ChannelHealth channels(boolean consumerReady, boolean dispatchReady) {
        return channel -> {
            if (AsyncAvailabilityService.TASKS_IN_CHANNEL.equals(channel)) {
                return consumerReady;
            }
            if (AsyncAvailabilityService.DISPATCH_CHANNEL.equals(channel)) {
                return dispatchReady;
            }
            return false;
        };
    }

    @Test
    void disabledWhenExecutionOff() {
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, true, true, true, true, true));
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, false, false, false, false, false));
    }

    @Test
    void degradedWhenExecutionOnButAnyOtherGateOff() {
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, false, true, true, true, true), "relay off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, false, false, true, true), "consumer off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, true, true, false), "sin brokers");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, false, true, true), "consumer no vivo");
        // v60-fix #4b: producer (audit-out) no conectado -> DEGRADED (antes no se miraba).
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, true, false, true), "producer no vivo");
    }

    @Test
    void readyOnlyWhenAllGatesOnBrokerRegisteredAndBothChannelsLive() {
        assertEquals(State.READY, AsyncAvailabilityService.derive(true, true, true, true, true, true));
    }

    @Test
    void availabilityComputesBrokersRegisteredFromTheRegistry() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of());
        var noBroker = new AsyncAvailabilityService(brokers, channels(true, true), true, true, true).availability();
        assertFalse(noBroker.brokersRegistered());
        assertEquals(State.DEGRADED, noBroker.state());

        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        var ready = new AsyncAvailabilityService(brokers, channels(true, true), true, true, true).availability();
        assertTrue(ready.brokersRegistered());
        assertTrue(ready.consumerLive());
        assertTrue(ready.dispatchLive());
        assertEquals(State.READY, ready.state());
    }

    @Test
    void availabilityMarksConsumerNotLiveWhenTasksInReadinessIsDown() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        var status = new AsyncAvailabilityService(brokers, channels(false, true), true, true, true).availability();
        assertTrue(status.consumerEnabled());
        assertFalse(status.consumerLive());
        assertEquals(State.DEGRADED, status.state());
    }

    @Test
    void availabilityMarksDispatchNotLiveWhenAuditOutReadinessIsDown() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        // Todos los gates + consumer vivo, pero el canal producer audit-out NO listo -> DEGRADED, dispatchLive=false.
        var status = new AsyncAvailabilityService(brokers, channels(true, false), true, true, true).availability();
        assertTrue(status.dispatchEnabled());
        assertFalse(status.dispatchLive());
        assertEquals(State.DEGRADED, status.state());
    }

    @Test
    void availabilityDoesNotProbeChannelsWhenGatesDisabled() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        // dispatch y consumer deshabilitados: ni consumerLive ni dispatchLive, sin importar el health.
        var status = new AsyncAvailabilityService(brokers, channels(true, true), true, false, false).availability();
        assertFalse(status.consumerLive());
        assertFalse(status.dispatchLive());
        assertEquals(State.DEGRADED, status.state());
    }
}
