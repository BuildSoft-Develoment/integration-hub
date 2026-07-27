package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cubre el {@link RestInboundDeliveryTransport} (la feature nueva de MT101_INBOUND_DELIVER): entrega los
 * mensajes ruteados por HTTP y traduce el status HTTP a DELIVERED/FAILED. Usa la costura de test del transporte
 * (constructor con HttpClient inyectable) + mock del {@link SwiftInboundStore}, sin red ni DB.
 */
class RestInboundDeliveryTransportTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Mt101Message sampleMessage() {
        return new Mt101Message(null, null, List.of(), null, "{}", "JSON");
    }

    private TaskContext context() {
        return new TaskContext(100L, 30L);
    }

    private Map<String, Object> inboundSource() {
        return Map.of("inboundSetId", "INB-1", "connectionRef", "conn");
    }

    private Map<String, Object> restConfig() {
        return Map.of(
                "transport", "REST",
                "url", "https://gateway.banco.local/v1/inbound/mt101");
    }

    @SuppressWarnings("unchecked")
    private void stubOnePage(SwiftInboundStore store, long id) {
        doAnswer(invocation -> {
            java.util.function.Consumer<List<SwiftInboundStore.InboundMessage>> consumer = invocation.getArgument(3);
            consumer.accept(List.of(new SwiftInboundStore.InboundMessage(id, sampleMessage(), "BOOK_TRANSFER")));
            return null;
        }).when(store).forEachPage(any(), any(), anyInt(), any());
    }

    @Test
    void restDelivery2xxMarksDelivered() throws Exception {
        var store = mock(SwiftInboundStore.class);
        var httpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<Void> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(202);
        doReturn(response).when(httpClient).send(any(), any());
        stubOnePage(store, 7L);

        var transport = new RestInboundDeliveryTransport(store, objectMapper, httpClient);
        TaskResult result = transport.deliver(context(), restConfig(), inboundSource(), 500);

        assertTrue(result.success(), result.details());
        assertEquals(1L, result.outputs().get("delivered"));
        assertEquals(0L, result.outputs().get("failed"));
        verify(store).markStatusBatch(any(), eq(List.of(7L)), eq("DELIVERED"), isNull());
    }

    @Test
    void restDeliveryNon2xxMarksFailedAndReturnsFailure() throws Exception {
        var store = mock(SwiftInboundStore.class);
        var httpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<Void> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(500);
        doReturn(response).when(httpClient).send(any(), any());
        stubOnePage(store, 9L);

        var transport = new RestInboundDeliveryTransport(store, objectMapper, httpClient);
        TaskResult result = transport.deliver(context(), restConfig(), inboundSource(), 500);

        assertFalse(result.success(), "un non-2xx debe hacer fallar la tarea");
        assertEquals(0L, result.outputs().get("delivered"));
        assertEquals(1L, result.outputs().get("failed"));
    }

    @Test
    void restRequiresUrl() {
        var store = mock(SwiftInboundStore.class);
        var transport = new RestInboundDeliveryTransport(store, objectMapper, mock(HttpClient.class));

        var config = Map.<String, Object>of("transport", "REST");
        var error = assertThrows(IllegalArgumentException.class,
                () -> transport.deliver(context(), config, inboundSource(), 500));
        assertTrue(error.getMessage().contains("requires url"), () -> "mensaje inesperado: " + error.getMessage());
    }
}
