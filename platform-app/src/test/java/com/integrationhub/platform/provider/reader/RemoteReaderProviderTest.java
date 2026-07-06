package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * v58-fix: guard de tamano del reader remoto. El reader empuja el archivo COMPLETO (Base64) en un request gRPC
 * unary; para archivos que exceden el umbral se rechaza ANTES de invocar con un mensaje accionable (en vez de un
 * RESOURCE_EXHAUSTED gRPC crudo del server del plugin). No es streaming; es operabilidad.
 */
class RemoteReaderProviderTest {

    private RemotePluginDescriptor trustedDescriptor() {
        return new RemotePluginDescriptor("plugin-x", "1.0", "1.0", Set.of("MY_READER"), "GRPC", true);
    }

    @Test
    void rejectsOversizedContentWithActionableMessageWithoutInvokingThePlugin() {
        var calls = new AtomicInteger();
        RemotePluginInvoker invoker = (descriptor, taskType, context, configuration) -> {
            calls.incrementAndGet();
            return TaskResult.success("ok", Map.of("records", java.util.List.of()));
        };
        // Umbral 10 B; un archivo de 100 B ~= 132 B en Base64 -> excede.
        var provider = new RemoteReaderProvider("MY_READER", trustedDescriptor(), invoker,
                new RemotePluginRegistry(), 10L);
        var payload = SourcePayload.fromBytes("big.csv", new byte[100], "text/csv");

        var error = assertThrows(IllegalStateException.class,
                () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));

        assertTrue(error.getMessage().contains("excede el maximo del reader remoto"),
                () -> "mensaje accionable esperado: " + error.getMessage());
        assertTrue(error.getMessage().contains("reader LOCAL"), "sugiere usar un reader local");
        assertEquals(0, calls.get(), "NO se invoca al plugin cuando el guard rechaza por tamano");
    }

    @Test
    void allowsContentUnderTheThresholdAndInvokesThePlugin() {
        var calls = new AtomicInteger();
        RemotePluginInvoker invoker = (descriptor, taskType, context, configuration) -> {
            calls.incrementAndGet();
            return TaskResult.success("ok", Map.of("records", java.util.List.of(Map.of("a", "1"))));
        };
        var provider = new RemoteReaderProvider("MY_READER", trustedDescriptor(), invoker,
                new RemotePluginRegistry(), 4L * 1024 * 1024);
        var payload = SourcePayload.fromBytes("small.csv", new byte[100], "text/csv");

        var result = provider.readInBatches(payload, Map.of(), 10, batch -> { });

        assertEquals(1, calls.get(), "un archivo bajo el umbral SI invoca al plugin");
        assertEquals(1, result.records().size());
    }
}
