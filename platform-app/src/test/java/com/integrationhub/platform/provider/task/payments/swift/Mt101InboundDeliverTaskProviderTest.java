package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
 * Cubre la rama REST de MT101_INBOUND_DELIVER (la feature nueva): entrega los mensajes ruteados por HTTP y
 * traduce el status HTTP a DELIVERED/FAILED. Usa la costura de test del provider (constructor con HttpClient
 * inyectable) + mock del SwiftInboundStore, sin red ni DB.
 */
class Mt101InboundDeliverTaskProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Mt101Message sampleMessage() {
        return new Mt101Message(null, null, List.of(), null, "{}", "JSON");
    }

    private TaskContext contextWithInbound() {
        var context = new TaskContext(100L, 30L);
        context.attributes().put("taskOutputs", Map.of(
                "src.records", Map.of("inboundSetId", "INB-1", "connectionRef", "conn")));
        return context;
    }

    private Map<String, Object> restConfig() {
        return Map.of(
                "transport", "REST",
                "url", "https://gateway.banco.local/v1/inbound/mt101",
                "input", Map.of("sourceTaskRef", "src", "sourceOutput", "records"));
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

        var provider = new Mt101InboundDeliverTaskProvider(store, null, null, null, objectMapper, httpClient);
        TaskResult result = provider.execute(contextWithInbound(), restConfig());

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

        var provider = new Mt101InboundDeliverTaskProvider(store, null, null, null, objectMapper, httpClient);
        TaskResult result = provider.execute(contextWithInbound(), restConfig());

        assertFalse(result.success(), "un non-2xx debe hacer fallar la tarea");
        assertEquals(0L, result.outputs().get("delivered"));
        assertEquals(1L, result.outputs().get("failed"));
    }

    @Test
    void restRequiresUrl() {
        var store = mock(SwiftInboundStore.class);
        stubOnePage(store, 1L);
        var provider = new Mt101InboundDeliverTaskProvider(store, null, null, null, objectMapper, mock(HttpClient.class));

        var config = Map.<String, Object>of(
                "transport", "REST",
                "input", Map.of("sourceTaskRef", "src", "sourceOutput", "records"));
        var error = org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> provider.execute(contextWithInbound(), config));
        assertTrue(error.getMessage().contains("requires url"), () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void skipsWhenNoInboundSource() {
        var store = mock(SwiftInboundStore.class);
        var provider = new Mt101InboundDeliverTaskProvider(store, null, null, null, objectMapper, mock(HttpClient.class));
        // Sin taskOutputs -> inboundSource vacio -> skip (no explota).
        var result = provider.execute(new TaskContext(1L, 1L), restConfig());
        assertTrue(result.success());
        assertTrue(result.details().contains("skipped"));
    }
}
