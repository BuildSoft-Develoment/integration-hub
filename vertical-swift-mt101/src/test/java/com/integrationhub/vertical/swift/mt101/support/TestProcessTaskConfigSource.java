package com.integrationhub.vertical.swift.mt101.support;

import com.integrationhub.platform.spi.engine.ProcessTaskConfigSource;

import java.util.Map;
import java.util.function.LongFunction;
import java.util.function.UnaryOperator;

/**
 * Doble de {@link ProcessTaskConfigSource} para las pruebas del vertical.
 *
 * <p>Antes cada prueba armaba su lambda, lo que era posible porque las interfaces eran funcionales.
 * Al volver {@code siblingConfigOfUnresolved} abstracto eso ya no compila — a proposito: la
 * distincion entre config <b>resuelta</b> y <b>sin resolver</b> es una decision de money-path
 * (un snapshot congelado no debe llevar secretos en claro) y no debe poder tomarse por omision.</p>
 *
 * <p>Por eso hay tres fabricas y no un constructor: el nombre de la que se elige DICE que semantica
 * quiere la prueba. Lo que no se configura <b>lanza</b>, para que estrenar un camino sin declararlo
 * falle fuerte en vez de devolver null en silencio.</p>
 */
public final class TestProcessTaskConfigSource implements ProcessTaskConfigSource {

    /** Busqueda de la tarea hermana por tipo. */
    @FunctionalInterface
    public interface ByType {
        Map<String, Object> apply(long taskDefinitionId, String taskType);
    }

    private final LongFunction<Map<String, Object>> byId;
    private final ByType unresolvedByType;
    private final UnaryOperator<Map<String, Object>> secrets;

    private TestProcessTaskConfigSource(LongFunction<Map<String, Object>> byId,
                                        ByType unresolvedByType,
                                        UnaryOperator<Map<String, Object>> secrets) {
        this.byId = byId;
        this.unresolvedByType = unresolvedByType;
        this.secrets = secrets;
    }

    /** Solo {@link #configOf}: la prueba no mira tareas hermanas. */
    public static TestProcessTaskConfigSource forTask(Map<String, Object> config) {
        return new TestProcessTaskConfigSource(taskDefinitionId -> config, null, null);
    }

    /**
     * Busqueda por tipo <b>sin pipeline de secretos</b>: resuelta y sin resolver son la misma config.
     * El nombre lo declara — es valido cuando la prueba no usa {@code ${secret:...}} en ningun lado.
     */
    public static TestProcessTaskConfigSource forSiblingsWithoutSecrets(ByType byType) {
        return new TestProcessTaskConfigSource(null, byType, UnaryOperator.identity());
    }

    /**
     * Busqueda por tipo distinguiendo ambas versiones: {@code byType} devuelve la config SIN resolver
     * y {@code secrets} la resuelve, igual que hace el motor.
     */
    public static TestProcessTaskConfigSource forSiblings(ByType byType,
                                                          UnaryOperator<Map<String, Object>> secrets) {
        return new TestProcessTaskConfigSource(null, byType, secrets);
    }

    @Override
    public Map<String, Object> configOf(long taskDefinitionId) {
        if (byId == null) {
            throw new UnsupportedOperationException(
                    "esta prueba no declaro configOf: usar TestProcessTaskConfigSource.forTask(...)");
        }
        return byId.apply(taskDefinitionId);
    }

    @Override
    public Map<String, Object> siblingConfigOf(long taskDefinitionId, String taskType) {
        var unresolved = siblingConfigOfUnresolved(taskDefinitionId, taskType);
        return unresolved == null ? null : secrets.apply(unresolved);
    }

    @Override
    public Map<String, Object> siblingConfigOfUnresolved(long taskDefinitionId, String taskType) {
        if (unresolvedByType == null) {
            throw new UnsupportedOperationException("esta prueba no declaro busqueda por tipo: usar "
                    + "TestProcessTaskConfigSource.forSiblings(...) o forSiblingsWithoutSecrets(...)");
        }
        return unresolvedByType.apply(taskDefinitionId, taskType);
    }
}
