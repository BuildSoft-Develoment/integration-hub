package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResilientRemotePluginInvokerTest {

    private final TaskContext context = new TaskContext(1L, 2L);

    @Test
    void delegatesToMatchingTransport() {
        var invoker = new ResilientRemotePluginInvoker(List.of(new FakeTransport("GRPC")));
        var descriptor = descriptor("GRPC");

        var result = invoker.invoke(descriptor, "ACME_DO", context, Map.of("x", 1));

        assertTrue(result.success());
        assertEquals("GRPC:ACME_DO:http://localhost:9090", result.details());
    }

    @Test
    void rejectsWhenNoTransportSupportsDescriptor() {
        var invoker = new ResilientRemotePluginInvoker(List.of(new FakeTransport("KAFKA")));
        var descriptor = descriptor("GRPC");

        assertThrows(IllegalStateException.class,
                () -> invoker.invoke(descriptor, "ACME_DO", context, Map.of()));
    }

    private RemotePluginDescriptor descriptor(String transport) {
        return new RemotePluginDescriptor(
                "acme",
                "1.0.0",
                "1",
                Set.of("ACME_DO"),
                transport,
                "http://localhost:9090",
                true);
    }

    private record FakeTransport(String supportedTransport) implements RemotePluginTransport {

        @Override
        public boolean supports(RemotePluginDescriptor descriptor) {
            return supportedTransport.equalsIgnoreCase(descriptor.transport());
        }

        @Override
        public TaskResult invoke(
                RemotePluginDescriptor descriptor,
                String taskType,
                TaskContext context,
                Map<String, Object> configuration) {
            return TaskResult.success(descriptor.transport() + ":" + taskType + ":" + descriptor.endpoint());
        }
    }
}
