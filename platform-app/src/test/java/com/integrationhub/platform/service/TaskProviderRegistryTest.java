package com.integrationhub.platform.service;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskProviderRegistryTest {

    @Test
    void resolvesLocalProviderBeforeRemoteDescriptors() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor("remote", "1.0.0", "1", Set.of("LOCAL"), "GRPC", true));
        var registry = new TaskProviderRegistry(
                List.of(provider("LOCAL", "local")),
                remotePlugins,
                Optional::empty);

        var result = registry.resolve("LOCAL").execute(new TaskContext(1L, 2L), Map.of());

        assertEquals("local", result.details());
    }

    @Test
    void resolvesRemoteProviderWhenNoLocalProviderMatches() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor("remote", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        RemotePluginInvoker invoker = (descriptor, type, context, configuration) ->
                TaskResult.success("remote:" + descriptor.id() + ":" + type);
        var registry = new TaskProviderRegistry(List.of(), remotePlugins, () -> Optional.of(invoker));

        var result = registry.resolve("ACME_DO").execute(new TaskContext(1L, 2L), Map.of());

        assertTrue(result.success());
        assertEquals("remote:remote:ACME_DO", result.details());
    }

    @Test
    void failsFastWhenRemoteDescriptorExistsWithoutInvoker() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor("remote", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        var registry = new TaskProviderRegistry(List.of(), remotePlugins, Optional::empty);

        assertThrows(IllegalStateException.class, () -> registry.resolve("ACME_DO"));
    }

    @Test
    void includesRemoteTypesInAvailableTaskTypes() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor("remote", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        var registry = new TaskProviderRegistry(List.of(provider("LOCAL", "local")), remotePlugins, Optional::empty);

        assertEquals(Set.of("LOCAL", "ACME_DO"), registry.availableTaskTypes());
    }

    private TaskProvider provider(String type, String details) {
        return new TaskProvider() {
            @Override
            public String type() {
                return type;
            }

            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                return TaskResult.success(details);
            }
        };
    }
}
