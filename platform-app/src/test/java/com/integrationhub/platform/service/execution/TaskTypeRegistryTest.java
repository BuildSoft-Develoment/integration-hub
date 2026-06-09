package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.lang.annotation.Annotation;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003-diseno-y-ejecucion-procesos T-015 (M-1a)
 * @covers ADR-009
 */
class TaskTypeRegistryTest {

    @Test
    void allCombinesBuiltinTypesWithProviderRegisteredTypes() {
        var providerRegistry = new TaskProviderRegistry(new ListInstance<>(List.of(
                stubProvider("MT101_BUILD"),
                stubProvider("PAIN001_BUILD"),
                stubProvider("CUSTOM_TYPE"))));
        var registry = new TaskTypeRegistry(providerRegistry);

        var all = registry.all();
        // Builtin del motor (6).
        assertTrue(all.contains(TaskType.FILE_READ));
        assertTrue(all.contains(TaskType.DB_WRITE));
        assertTrue(all.contains(TaskType.DB_EXECUTE_SP));
        assertTrue(all.contains(TaskType.DB_EXECUTE_FN));
        assertTrue(all.contains(TaskType.REST_CALL));
        assertTrue(all.contains(TaskType.NOTIFICATION));
        // Tipos de verticales descubiertos via CDI.
        assertTrue(all.contains("MT101_BUILD"));
        assertTrue(all.contains("PAIN001_BUILD"));
        assertTrue(all.contains("CUSTOM_TYPE"));
    }

    @Test
    void isRegisteredAcceptsBuiltinAndProviderTypes() {
        var providerRegistry = new TaskProviderRegistry(new ListInstance<>(List.of(
                stubProvider("MT101_BUILD"))));
        var registry = new TaskTypeRegistry(providerRegistry);

        assertTrue(registry.isRegistered(TaskType.FILE_READ));
        assertTrue(registry.isRegistered("MT101_BUILD"));
        assertFalse(registry.isRegistered("UNKNOWN_TYPE"));
        assertFalse(registry.isRegistered(null));
        assertFalse(registry.isRegistered(""));
        assertFalse(registry.isRegistered("   "));
    }

    @Test
    void isBuiltinOnlyAcceptsMotorTypes() {
        var providerRegistry = new TaskProviderRegistry(new ListInstance<>(List.of(
                stubProvider("MT101_BUILD"))));
        var registry = new TaskTypeRegistry(providerRegistry);

        assertTrue(registry.isBuiltin(TaskType.FILE_READ));
        assertTrue(registry.isBuiltin(TaskType.NOTIFICATION));
        assertFalse(registry.isBuiltin("MT101_BUILD"));
        assertFalse(registry.isBuiltin(null));
    }

    @Test
    void emptyProviderRegistryStillExposesBuiltinTypes() {
        var providerRegistry = new TaskProviderRegistry(new ListInstance<>(List.of()));
        var registry = new TaskTypeRegistry(providerRegistry);

        assertTrue(registry.all().containsAll(TaskType.BUILTIN));
        // Sin verticales no rompe.
        assertFalse(registry.isRegistered("MT101_BUILD"));
    }

    // --- helpers ---

    private TaskProvider stubProvider(String type) {
        return new TaskProvider() {
            @Override public String type() { return type; }
            @Override public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                return TaskResult.success("stub");
            }
        };
    }

    /** Instance CDI minima para tests sin contenedor. */
    private static final class ListInstance<T> implements Instance<T> {
        private final List<T> items;
        ListInstance(List<T> items) { this.items = items; }
        @Override public Instance<T> select(Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return items.isEmpty(); }
        @Override public boolean isAmbiguous() { return items.size() > 1; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return items.iterator(); }
        @Override public T get() {
            if (items.isEmpty()) throw new IllegalStateException("empty");
            return items.get(0);
        }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
