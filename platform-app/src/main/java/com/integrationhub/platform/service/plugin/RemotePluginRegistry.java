package com.integrationhub.platform.service.plugin;

import jakarta.enterprise.context.ApplicationScoped;

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

    private final Map<String, RemotePluginDescriptor> byType = new ConcurrentHashMap<>();
    private final Map<String, String> degradedById = new ConcurrentHashMap<>();

    public void register(RemotePluginDescriptor descriptor) {
        for (var type : descriptor.providedTypes()) {
            byType.put(type.toUpperCase(Locale.ROOT), descriptor);
        }
    }

    public Optional<RemotePluginDescriptor> descriptorFor(String taskType) {
        if (taskType == null || taskType.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(byType.get(taskType.trim().toUpperCase(Locale.ROOT)));
    }

    public boolean covers(String taskType) {
        return descriptorFor(taskType).isPresent();
    }

    /** Marca un plugin como degradado (verificacion/invocacion/montaje fallido). */
    public void markDegraded(String pluginId, String reason) {
        degradedById.put(pluginId, reason);
    }

    /** Plugins degradados con su motivo, para una superficie de diagnostico. */
    public Map<String, String> degraded() {
        return Map.copyOf(degradedById);
    }
}
