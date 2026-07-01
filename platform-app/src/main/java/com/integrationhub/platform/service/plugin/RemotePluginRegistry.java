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
    private final Map<String, RemotePluginDescriptor> bySourceType = new ConcurrentHashMap<>();
    private final Map<String, RemotePluginDescriptor> byReaderType = new ConcurrentHashMap<>();
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
        for (var type : descriptor.providedSourceTypes()) {
            var key = normalize(type);
            var previous = bySourceType.get(key);
            if (previous != null && !previous.id().equals(descriptor.id())) {
                throw new IllegalArgumentException(
                        "Remote source type " + type + " already provided by plugin " + previous.id());
            }
        }
        for (var type : descriptor.providedReaderTypes()) {
            var key = normalize(type);
            var previous = byReaderType.get(key);
            if (previous != null && !previous.id().equals(descriptor.id())) {
                throw new IllegalArgumentException(
                        "Remote reader type " + type + " already provided by plugin " + previous.id());
            }
        }
        byId.put(descriptor.id(), descriptor);
        for (var type : descriptor.providedTypes()) {
            byType.put(normalize(type), descriptor);
        }
        for (var type : descriptor.providedSourceTypes()) {
            bySourceType.put(normalize(type), descriptor);
        }
        for (var type : descriptor.providedReaderTypes()) {
            byReaderType.put(normalize(type), descriptor);
        }
    }

    public void replaceDescriptors(Collection<RemotePluginDescriptor> descriptors) {
        var nextById = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        var nextByType = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        var nextBySourceType = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        var nextByReaderType = new ConcurrentHashMap<String, RemotePluginDescriptor>();
        for (var descriptor : descriptors) {
            nextById.put(descriptor.id(), descriptor);
            indexCapabilities(nextByType, descriptor, descriptor.providedTypes(), "task");
            indexCapabilities(nextBySourceType, descriptor, descriptor.providedSourceTypes(), "source");
            indexCapabilities(nextByReaderType, descriptor, descriptor.providedReaderTypes(), "reader");
        }
        byId.clear();
        byType.clear();
        bySourceType.clear();
        byReaderType.clear();
        degradedById.clear();
        byId.putAll(nextById);
        byType.putAll(nextByType);
        bySourceType.putAll(nextBySourceType);
        byReaderType.putAll(nextByReaderType);
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

    public Optional<RemotePluginDescriptor> descriptorForSource(String sourceType) {
        if (sourceType == null || sourceType.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(bySourceType.get(normalize(sourceType)));
    }

    public Optional<RemotePluginDescriptor> descriptorForReader(String readerType) {
        if (readerType == null || readerType.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(byReaderType.get(normalize(readerType)));
    }

    public List<RemotePluginDescriptor> descriptors() {
        return byId.values().stream()
                .sorted(Comparator.comparing(RemotePluginDescriptor::id))
                .toList();
    }

    public List<String> availableTaskTypes() {
        return byType.keySet().stream().sorted().toList();
    }

    public List<String> availableSourceTypes() {
        return bySourceType.keySet().stream().sorted().toList();
    }

    public List<String> availableReaderTypes() {
        return byReaderType.keySet().stream().sorted().toList();
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

    private static void indexCapabilities(
            Map<String, RemotePluginDescriptor> target,
            RemotePluginDescriptor descriptor,
            Collection<String> types,
            String capabilityName) {
        for (var type : types) {
            var key = normalize(type);
            var previous = target.putIfAbsent(key, descriptor);
            if (previous != null && !previous.id().equals(descriptor.id())) {
                throw new IllegalArgumentException(
                        "Remote " + capabilityName + " type " + type + " already provided by plugin " + previous.id());
            }
        }
    }
}
