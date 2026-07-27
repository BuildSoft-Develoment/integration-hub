package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Catalogo observable de task types disponibles para UI/operacion.
 */
@ApplicationScoped
public class TaskTypeCatalogService {

    public static final String ORIGIN_BUILTIN = "BUILTIN";
    public static final String ORIGIN_LOCAL = "LOCAL";
    public static final String ORIGIN_REMOTE = "REMOTE";

    public static final String STATUS_AVAILABLE = "AVAILABLE";
    public static final String STATUS_DEGRADED = "DEGRADED";
    public static final String STATUS_UNTRUSTED = "UNTRUSTED";
    public static final String STATUS_SHADOWED_BY_LOCAL = "SHADOWED_BY_LOCAL";

    private final TaskProviderRegistry taskProviderRegistry;
    private final RemotePluginRegistry remotePluginRegistry;

    public TaskTypeCatalogService(
            TaskProviderRegistry taskProviderRegistry,
            RemotePluginRegistry remotePluginRegistry) {
        this.taskProviderRegistry = taskProviderRegistry;
        this.remotePluginRegistry = remotePluginRegistry;
    }

    public List<TaskTypeCatalogEntry> catalog() {
        var entries = new ArrayList<TaskTypeCatalogEntry>();
        var localProviders = taskProviderRegistry.localTaskTypeProviders();
        var builtinKeys = normalized(TaskType.BUILTIN);
        var localKeys = normalized(localProviders.keySet());

        for (var type : TaskType.BUILTIN) {
            entries.add(new TaskTypeCatalogEntry(
                    type,
                    ORIGIN_BUILTIN,
                    "platform-core",
                    null,
                    null,
                    null,
                    STATUS_AVAILABLE,
                    null,
                    asyncOffloadFor(type),
                    configurableFor(type)));
        }

        localProviders.entrySet().stream()
                .filter(entry -> !builtinKeys.contains(normalize(entry.getKey())))
                .sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
                .forEach(entry -> entries.add(new TaskTypeCatalogEntry(
                        entry.getKey(),
                        ORIGIN_LOCAL,
                        entry.getValue(),
                        null,
                        null,
                        null,
                        STATUS_AVAILABLE,
                        null,
                        asyncOffloadFor(entry.getKey()),
                        configurableFor(entry.getKey()))));

        var degraded = remotePluginRegistry.degraded();
        remotePluginRegistry.descriptors().stream()
                .sorted(Comparator.comparing(RemotePluginDescriptor::id))
                .forEach(descriptor -> descriptor.providedTypes().stream()
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .forEach(type -> entries.add(remoteEntry(
                                descriptor,
                                type,
                                builtinKeys,
                                localKeys,
                                degraded.get(descriptor.id())))));

        return List.copyOf(entries);
    }

    private TaskTypeCatalogEntry remoteEntry(
            RemotePluginDescriptor descriptor,
            String type,
            Set<String> builtinKeys,
            Set<String> localKeys,
            String degradedReason) {
        var normalizedType = normalize(type);
        var shadowed = builtinKeys.contains(normalizedType) || localKeys.contains(normalizedType);
        var status = shadowed
                ? STATUS_SHADOWED_BY_LOCAL
                : degradedReason != null
                ? STATUS_DEGRADED
                : descriptor.trusted()
                ? STATUS_AVAILABLE
                : STATUS_UNTRUSTED;
        var reason = shadowed
                ? "Local or builtin provider has priority for task type " + normalizedType
                : degradedReason;
        return new TaskTypeCatalogEntry(
                normalizedType,
                ORIGIN_REMOTE,
                "backend-plugin",
                descriptor.id(),
                descriptor.version(),
                descriptor.transport(),
                status,
                reason,
                // Los plugins remotos ya son async vía su propio transporte (y suspenden esperando el
                // resultado del broker del plugin); el offload async genérico no aplica.
                AsyncOffloadSupport.UNSUPPORTED.name(),
                configurableFor(normalizedType));
    }

    /**
     * ADR-021: ¿el provider del tipo declara un config-schema no vacio? Es lo que habilita a la UI a
     * ofrecer un tipo que NO trae formulario compilado en el frontend (lo renderiza con
     * {@code ih-schema-form}). Conservador: si el tipo no resuelve a un provider, {@code false}.
     */
    private boolean configurableFor(String type) {
        try {
            var schema = taskProviderRegistry.resolve(type).configSchema();
            return schema != null && !schema.isEmpty();
        } catch (RuntimeException unresolved) {
            return false;
        }
    }

    /**
     * Capacidad de offload async del tipo, según la declara su provider ({@link AsyncOffloadSupport}).
     * Si el tipo no resuelve a un provider local (no debería para builtin/local), degrada a
     * {@code UNSUPPORTED} conservador en vez de propagar el error del catálogo.
     */
    private String asyncOffloadFor(String type) {
        try {
            return taskProviderRegistry.resolve(type).asyncOffloadSupport().name();
        } catch (RuntimeException e) {
            return AsyncOffloadSupport.UNSUPPORTED.name();
        }
    }

    private static Set<String> normalized(Iterable<String> values) {
        var result = new LinkedHashSet<String>();
        for (var value : values) {
            result.add(normalize(value));
        }
        return result;
    }

    private static String normalize(String type) {
        return type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
    }
}
