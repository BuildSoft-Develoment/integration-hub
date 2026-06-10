package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Registro de tipos de tarea reconocidos por el motor.
 *
 * <p>Cierra <b>M-1a</b> (T-015 spec 003, ADR-009): el motor ya no depende de un
 * enum cerrado. Las verticales aportan sus tipos via {@code TaskProvider} y este
 * registry los agrega a los del motor.</p>
 *
 * <ul>
 *   <li><b>{@link TaskType#BUILTIN}</b>: 6 tipos del motor (FILE_READ, DB_*,
 *       REST_CALL, NOTIFICATION).</li>
 *   <li><b>{@code TaskProviderRegistry}</b>: tipos aportados por providers
 *       registrados via CDI (MT101_*, PAIN001_*, futuros).</li>
 * </ul>
 *
 * <p>API util para validacion (rechazar configuraciones con tipos desconocidos)
 * y para introspeccion (UI listando los tipos disponibles).</p>
 */
@ApplicationScoped
public class TaskTypeRegistry {

    private final TaskProviderRegistry taskProviderRegistry;

    public TaskTypeRegistry(TaskProviderRegistry taskProviderRegistry) {
        this.taskProviderRegistry = taskProviderRegistry;
    }

    /**
     * Catalogo completo: tipos del motor + tipos aportados por providers.
     * Orden estable: builtin primero (insercion), luego providers (descubrimiento CDI).
     */
    public Set<String> all() {
        var result = new LinkedHashSet<String>(TaskType.BUILTIN);
        result.addAll(taskProviderRegistry.availableTaskTypes());
        return result;
    }

    /** Verifica si un task type esta registrado (motor o vertical). */
    public boolean isRegistered(String taskType) {
        if (taskType == null || taskType.isBlank()) {
            return false;
        }
        var normalized = taskType.trim();
        return TaskType.BUILTIN.stream().anyMatch(type -> type.equalsIgnoreCase(normalized))
                || taskProviderRegistry.availableTaskTypes().stream()
                .anyMatch(type -> type.equalsIgnoreCase(normalized));
    }

    /** Verifica si un task type es del motor (subset estable). */
    public boolean isBuiltin(String taskType) {
        return taskType != null && TaskType.BUILTIN.stream()
                .anyMatch(type -> type.equalsIgnoreCase(taskType.trim()));
    }
}
