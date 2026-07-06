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
 * v59-fix: derivación del estado compuesto de disponibilidad async a partir de los TRES gates + el registro de
 * brokers. La lógica pura {@code derive(...)} se testea en aislamiento (valor SOLID: sin HTTP ni CDI).
 */
class AsyncAvailabilityServiceTest {

    @Test
    void disabledWhenExecutionOff() {
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, true, true, true));
        assertEquals(State.DISABLED, AsyncAvailabilityService.derive(false, false, false, false));
    }

    @Test
    void degradedWhenExecutionOnButAnyOtherGateOff() {
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, false, true, true), "relay off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, false, true), "consumer off");
        assertEquals(State.DEGRADED, AsyncAvailabilityService.derive(true, true, true, false), "sin brokers");
    }

    @Test
    void readyOnlyWhenAllThreeGatesOnAndBrokerRegistered() {
        assertEquals(State.READY, AsyncAvailabilityService.derive(true, true, true, true));
    }

    @Test
    void availabilityComputesBrokersRegisteredFromTheRegistry() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of());
        // execution+dispatch+consumer on, pero SIN brokers -> DEGRADED.
        var noBroker = new AsyncAvailabilityService(brokers, true, true, true).availability();
        assertFalse(noBroker.brokersRegistered());
        assertEquals(State.DEGRADED, noBroker.state());

        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));
        var withBroker = new AsyncAvailabilityService(brokers, true, true, true).availability();
        assertTrue(withBroker.brokersRegistered());
        assertEquals(State.READY, withBroker.state());
    }
}
