package com.integrationhub.platform.service.plugin;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.Comparator;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Catalogo de plugins out-of-process activos y su estado (ADR-014).
 *
 * <p>Indexa descriptores por tipo de tarea para que la resolucion del motor pueda
 * delegar un {@code type()} no cubierto por un bean CDI local en un plugin remoto.
 * Mantiene el estado {@code degraded} por plugin (un plugin que falla deja su tipo
 * no disponible sin tumbar el motor), espejo de la senal {@code degraded} del
 * frontend.</p>
 */
@ApplicationScoped
public class RemotePluginRegistry {

    private final Map<String, RemotePluginDescriptor> byId = new ConcurrentHashMap<>();
    private final Map<String, RemotePluginDescriptor> byType = new ConcurrentHashMap<>();
    private final Map<String, String> degradedById = new ConcurrentHashMap<>();

    public void register(RemotePluginDescriptor descriptor) {
        for (var type : descriptor.providedTypes()) {
            var key = normalize(type);
            var previous = byType.get(key);
            if (previous != null && !previous.id().equals(descriptor.id())) {
                throw new IllegalArgumentException(
                        "Remote task type " + type + " already provided by plugin " + previous.id());
            }
        }
        byId.put(descriptor.id(), descriptor);
        for (var type : descriptor.providedTypes()) {
            byType.put(normalize(type), descriptor);
        }
    }

    public void replaceDescriptors(Collection<RemotePluginDescriptor> descriptors) {
        var nextById = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        var nextByType = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        for (var descriptor : descriptors) {
            nextById.put(descriptor.id(), descriptor);
            for (var type : descriptor.providedTypes()) {
                var key = normalize(type);
                var previous = nextByType.putIfAbsent(key, descriptor);
                if (previous != null && !previous.id().equals(descriptor.id())) {
                    throw new IllegalArgumentException(
                            "Remote task type " + type + " already provided by plugin " + previous.id());
                }
            }
        }
        byId.clear();
        byType.clear();
        degradedById.clear();
        byId.putAll(nextById);
        byType.putAll(nextByType);
    }

    public Optional<RemotePluginDescriptor> descriptorFor(String taskType) {
        if (taskType == null || taskType.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(byType.get(normalize(taskType)));
    }

    public boolean covers(String taskType) {
        return descriptorFor(taskType).isPresent();
    }

    public List<RemotePluginDescriptor> descriptors() {
        return byId.values().stream()
                .sorted(Comparator.comparing(RemotePluginDescriptor::id))
                .toList();
    }

    public List<String> availableTaskTypes() {
        return byType.keySet().stream().sorted().toList();
    }

    /** Marca un plugin como degradado (verificacion/invocacion/montaje fallido). */
    public void markDegraded(String pluginId, String reason) {
        degradedById.put(pluginId, reason);
    }

    /** Plugins degradados con su motivo, para una superficie de diagnostico. */
    public Map<String, String> degraded() {
        return Map.copyOf(degradedById);
    }

    private static String normalize(String type) {
        return type.trim().toUpperCase(Locale.ROOT);
    }
}
