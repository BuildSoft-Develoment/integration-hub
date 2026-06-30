package com.integrationhub.platform.provider.task.remote;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.RemoteTaskResumePayload;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

class RemoteTaskProviderTest {

    private final RemotePluginRegistry registry = new RemotePluginRegistry();
    private final TaskContext context = new TaskContext(1L, 2L);

    private RemotePluginDescriptor descriptor(boolean trusted) {
        return new RemotePluginDescriptor("acme-tasks", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", trusted);
    }

    @Test
    void delegatesToInvokerOnSuccess() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("done by " + d.id());
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);

        var result = provider.execute(context, Map.of());

        assertTrue(result.success());
        assertTrue(registry.degraded().isEmpty());
    }

    @Test
    void degradesAndFailsWhenInvokerThrows() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> {
            throw new IllegalStateException("boom");
        };
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);

        var result = provider.execute(context, Map.of());

        assertFalse(result.success());
        assertTrue(registry.degraded().containsKey("acme-tasks"));
        assertTrue(registry.degraded().get("acme-tasks").contains("boom"));
    }

    @Test
    void failsAndDegradesWhenDescriptorUntrusted() {
        boolean[] invoked = {false};
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> {
            invoked[0] = true;
            return TaskResult.success("should not run");
        };
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(false), invoker, registry);

        var result = provider.execute(context, Map.of());

        assertFalse(result.success());
        assertFalse(invoked[0]);
        assertTrue(registry.degraded().containsKey("acme-tasks"));
    }

    @Test
    void remoteProviderIsSuspendableForBrokerCallbacks() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("unused");
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);

        assertTrue(provider instanceof SuspendableTaskProvider);
    }

    @Test
    void resumeCompletesFromRemoteCallbackPayload() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("unused");
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);
        var payload = RemoteTaskResumePayload.completed(
                "acme-tasks",
                "ACME_DO",
                "plugin:acme-tasks:1:2:ACME_DO",
                "done by sidecar",
                Map.of("remoteRef", "R-100"));

        var result = provider.resume(context, Map.of(), suspendedState(payload));

        assertTrue(result.success());
        assertFalse(result.suspended());
        assertEquals("done by sidecar", result.details());
        assertEquals("R-100", result.outputs().get("remoteRef"));
        assertTrue(registry.degraded().isEmpty());
    }

    @Test
    void resumeFailsFromRemoteCallbackPayload() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("unused");
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);
        var payload = RemoteTaskResumePayload.failed(
                "acme-tasks",
                "ACME_DO",
                "plugin:acme-tasks:1:2:ACME_DO",
                "sidecar rejected work",
                Map.of("code", "REMOTE_REJECTED"));

        var result = provider.resume(context, Map.of(), suspendedState(payload));

        assertFalse(result.success());
        assertEquals("REMOTE_REJECTED", result.outputs().get("code"));
        assertTrue(registry.degraded().isEmpty());
    }

    @Test
    void resumeRejectsMismatchedCorrelationAndDegrades() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("unused");
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);
        var payload = RemoteTaskResumePayload.completed(
                "acme-tasks",
                "ACME_DO",
                "plugin:other:1:2:ACME_DO",
                "done",
                Map.of());

        var result = provider.resume(context, Map.of(), suspendedState(payload));

        assertFalse(result.success());
        assertTrue(registry.degraded().containsKey("acme-tasks"));
        assertTrue(registry.degraded().get("acme-tasks").contains("idempotencyKey"));
    }

    @Test
    void resumeRequiresExternalEvent() {
        RemotePluginInvoker invoker = (d, type, ctx, cfg) -> TaskResult.success("unused");
        var provider = new RemoteTaskProvider("ACME_DO", descriptor(true), invoker, registry);

        var result = provider.resume(context, Map.of(), Map.of());

        assertFalse(result.success());
        assertTrue(registry.degraded().containsKey("acme-tasks"));
    }

    private Map<String, Object> suspendedState(RemoteTaskResumePayload payload) {
        return Map.of(
                "idempotencyKey", "plugin:acme-tasks:1:2:ACME_DO",
                "externalEvent", payload.asExternalEvent());
    }
}
