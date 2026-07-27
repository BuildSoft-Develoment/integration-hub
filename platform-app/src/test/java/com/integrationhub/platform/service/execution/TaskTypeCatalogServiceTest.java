package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TaskTypeCatalogServiceTest {

    @Test
    void catalogIncludesBuiltinLocalAndRemoteTaskTypesWithStatus() {
        var providerRegistry = mock(TaskProviderRegistry.class);
        when(providerRegistry.localTaskTypeProviders()).thenReturn(new LinkedHashMap<>(Map.of(
                "LOCAL_DO", "LocalTaskProvider",
                TaskType.FILE_READ, "FileReadTaskProvider"
        )));
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor(
                "acme",
                "1.0.0",
                "1",
                Set.of("ACME_DO"),
                "KAFKA",
                true));
        remotePlugins.register(new RemotePluginDescriptor(
                "shadow",
                "1.0.0",
                "1",
                Set.of("LOCAL_DO"),
                "KAFKA",
                true));
        remotePlugins.register(new RemotePluginDescriptor(
                "unsafe",
                "1.0.0",
                "1",
                Set.of("UNSAFE_DO"),
                "KAFKA",
                false));
        remotePlugins.markDegraded("acme", "broker unavailable");

        var catalog = new TaskTypeCatalogService(providerRegistry, remotePlugins).catalog();

        assertEquals(TaskTypeCatalogService.ORIGIN_BUILTIN, find(catalog, TaskType.FILE_READ, "BUILTIN").origin());
        assertEquals(TaskTypeCatalogService.STATUS_AVAILABLE, find(catalog, "LOCAL_DO", "LOCAL").status());

        var degraded = find(catalog, "ACME_DO", "REMOTE");
        assertEquals("acme", degraded.pluginId());
        assertEquals(TaskTypeCatalogService.STATUS_DEGRADED, degraded.status());
        assertEquals("broker unavailable", degraded.reason());

        var shadowed = find(catalog, "LOCAL_DO", "REMOTE");
        assertEquals("shadow", shadowed.pluginId());
        assertEquals(TaskTypeCatalogService.STATUS_SHADOWED_BY_LOCAL, shadowed.status());

        var untrusted = find(catalog, "UNSAFE_DO", "REMOTE");
        assertEquals(TaskTypeCatalogService.STATUS_UNTRUSTED, untrusted.status());
    }

    @Test
    void remoteTypeShadowedByBuiltinIsVisibleAsShadowed() {
        var providerRegistry = mock(TaskProviderRegistry.class);
        when(providerRegistry.localTaskTypeProviders()).thenReturn(Map.of());
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor(
                "file-plugin",
                "1.0.0",
                "1",
                Set.of(TaskType.FILE_READ),
                "KAFKA",
                true));

        var catalog = new TaskTypeCatalogService(providerRegistry, remotePlugins).catalog();

        assertEquals(TaskTypeCatalogService.STATUS_SHADOWED_BY_LOCAL,
                find(catalog, TaskType.FILE_READ, "REMOTE").status());
    }

    @Test
    void catalogExposesProviderAsyncOffloadCapability() {
        var providerRegistry = mock(TaskProviderRegistry.class);
        when(providerRegistry.localTaskTypeProviders())
                .thenReturn(new LinkedHashMap<>(Map.of("SLICE_LOCAL", "SliceOnlyProvider")));
        when(providerRegistry.resolve("SLICE_LOCAL")).thenReturn(new SliceOnlyProvider());
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor(
                "acme", "1.0.0", "1", Set.of("ACME_DO"), "KAFKA", true));

        var catalog = new TaskTypeCatalogService(providerRegistry, remotePlugins).catalog();

        // El catálogo refleja la capacidad declarada por el provider...
        assertEquals("SLICE_ONLY", find(catalog, "SLICE_LOCAL", "LOCAL").asyncOffload());
        // ...los remotos son UNSUPPORTED para el async genérico (ya son async vía su transporte)...
        assertEquals("UNSUPPORTED", find(catalog, "ACME_DO", "REMOTE").asyncOffload());
        // ...y los tipos sin capacidad resoluble degradan a UNSUPPORTED (conservador).
        assertEquals("UNSUPPORTED", find(catalog, TaskType.FILE_READ, "BUILTIN").asyncOffload());
    }

    @Test
    void catalogExposesWhetherTheTypeDeclaresAConfigSchema() {
        // ADR-021: es lo que habilita a la UI a ofrecer un vertical LOCAL sin formulario compilado.
        var providerRegistry = mock(TaskProviderRegistry.class);
        when(providerRegistry.localTaskTypeProviders())
                .thenReturn(new LinkedHashMap<>(Map.of(
                        "SCHEMA_LOCAL", "SchemaProvider",
                        "BARE_LOCAL", "BareProvider")));
        when(providerRegistry.resolve("SCHEMA_LOCAL")).thenReturn(new SchemaProvider());
        when(providerRegistry.resolve("BARE_LOCAL")).thenReturn(new BareProvider());
        var remotePlugins = new RemotePluginRegistry();

        var catalog = new TaskTypeCatalogService(providerRegistry, remotePlugins).catalog();

        // Un vertical que declara su schema es configurable -> la UI puede ofrecerlo.
        assertEquals(true, find(catalog, "SCHEMA_LOCAL", "LOCAL").configurable());
        // Sin schema no hay forma de configurarlo -> la UI no lo ofrece (no se puede completar).
        assertEquals(false, find(catalog, "BARE_LOCAL", "LOCAL").configurable());
        // Un tipo que no resuelve a provider degrada a false (conservador), no explota.
        assertEquals(false, find(catalog, TaskType.FILE_READ, "BUILTIN").configurable());
    }

    private static final class SliceOnlyProvider implements TaskProvider {
        @Override public String type() { return "SLICE_LOCAL"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public AsyncOffloadSupport asyncOffloadSupport() { return AsyncOffloadSupport.SLICE_ONLY; }
    }

    /** Vertical bien portado: declara su config-schema, asi la UI lo renderiza sin form compilado. */
    private static final class SchemaProvider implements TaskProvider {
        @Override public String type() { return "SCHEMA_LOCAL"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public PluginConfigSchema configSchema() {
            return PluginConfigSchema.of(PluginConfigField.text("taskRef", "schemaLocal.taskRef", true));
        }
    }

    /** Provider sin schema: existe en el motor pero no es configurable desde la UI. */
    private static final class BareProvider implements TaskProvider {
        @Override public String type() { return "BARE_LOCAL"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
    }

    private TaskTypeCatalogEntry find(Iterable<TaskTypeCatalogEntry> entries, String type, String origin) {
        for (var entry : entries) {
            if (entry.type().equalsIgnoreCase(type) && entry.origin().equals(origin)) {
                return entry;
            }
        }
        assertNotNull(null, "Missing catalog entry " + type + "/" + origin);
        throw new AssertionError("unreachable");
    }
}
