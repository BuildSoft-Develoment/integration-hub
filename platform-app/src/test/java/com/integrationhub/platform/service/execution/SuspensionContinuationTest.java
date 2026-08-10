package com.integrationhub.platform.service.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * El envelope de continuacion lleva el PLAN CONGELADO, no solo los datos.
 *
 * <p>Antes solo viajaban {@code taskOutputs}/variables/trigger y la reanudacion releia la definicion
 * del proceso filtrando por {@code taskOrder > afterTaskOrder}. Como guardar un proceso reasigna los
 * {@code taskOrder}, editarlo durante una suspension cambiaba el conjunto de tareas que reanudaba.
 * Estos tests fijan las dos mitades del contrato: que el plan sobrevive el viaje intacto, y que su
 * AUSENCIA se distingue de "no queda nada" — que es lo que permite al resume degradar en vez de
 * adivinar.</p>
 */
class SuspensionContinuationTest {

    private final SuspensionContinuation continuation = new SuspensionContinuation(new ObjectMapper());

    private static ProcessExecutionStateService.TaskPlan plan(long id, int order, String type) {
        return new ProcessExecutionStateService.TaskPlan(
                id, order, type, "{\"taskRef\":\"" + type.toLowerCase() + "\"}",
                null, null, null, null, null, null, null);
    }

    @Test
    void elPlanRestanteSobreviveElViaje() {
        var remaining = List.of(plan(7L, 5, "MT101_STATUS"), plan(8L, 6, "NOTIFICATION"));

        var envelope = continuation.unmarshal(
                continuation.marshal(Map.of("pagar", Map.of("count", 3)), Map.of("periodo", "2026-08"),
                        "SCHEDULER", remaining));

        assertNotNull(envelope);
        assertEquals(2, envelope.remainingTasks().size());
        assertEquals("MT101_STATUS", envelope.remainingTasks().get(0).taskType());
        assertEquals(7L, envelope.remainingTasks().get(0).taskDefinitionId());
        assertEquals(5, envelope.remainingTasks().get(0).taskOrder());
        // El config de cada tarea viaja con ella: es lo que la reanudacion ejecuta, y por eso no
        // puede depender de lo que diga la definicion hoy.
        assertEquals("{\"taskRef\":\"mt101_status\"}", envelope.remainingTasks().get(0).configurationJson());
        assertEquals("NOTIFICATION", envelope.remainingTasks().get(1).taskType());
        // El contexto del pipeline sigue viajando igual que antes.
        assertEquals("SCHEDULER", envelope.triggerSource());
        assertEquals("2026-08", envelope.executionVariables().get("periodo"));
        assertTrue(envelope.taskOutputs().containsKey("pagar"));
    }

    @Test
    void unaSuspensionEnLaUltimaTareaViajaConPlanVacioNoNulo() {
        var envelope = continuation.unmarshal(
                continuation.marshal(Map.of(), Map.of(), "API", List.of()));

        assertNotNull(envelope);
        // Vacio, NO null: "no queda nada" es una respuesta conocida y el resume cierra el proceso.
        assertNotNull(envelope.remainingTasks());
        assertTrue(envelope.remainingTasks().isEmpty());
    }

    @Test
    void unEnvelopeAnteriorAlCongeladoSeDistingueDeUnPlanVacio() {
        // Escrito por una version previa: tiene el contexto pero NO la clave del plan.
        var legacy = "{\"taskOutputs\":{\"pagar\":{\"count\":3}},\"executionVariables\":{},"
                + "\"triggerSource\":\"API\"}";

        var envelope = continuation.unmarshal(legacy);

        assertNotNull(envelope);
        assertTrue(envelope.taskOutputs().containsKey("pagar"));
        // null (no lista vacia): el resume NO puede saber que quedaba por ejecutar, asi que degrada a
        // COMPLETED_NEEDS_REDRIVE en vez de releer la definicion, que pudo cambiar mientras tanto.
        assertNull(envelope.remainingTasks());
    }

    @Test
    void unEnvelopeCorruptoNoRevienta() {
        assertNull(continuation.unmarshal("{no es json"));
        assertNull(continuation.unmarshal(null));
        assertNull(continuation.unmarshal("   "));
    }

    @Test
    void lasClavesVolatilesNoSePersistenPeroElPlanSi() {
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("_stagingCounter", 999);
        outputs.put("leer", Map.of("records", 10));

        var envelope = continuation.unmarshal(
                continuation.marshal(outputs, Map.of(), "API", List.of(plan(2L, 2, "DB_WRITE"))));

        assertNotNull(envelope);
        assertTrue(envelope.taskOutputs().containsKey("leer"));
        assertTrue(envelope.taskOutputs().keySet().stream().noneMatch(key -> key.startsWith("_staging")));
        assertEquals(1, envelope.remainingTasks().size());
    }
}
