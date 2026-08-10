package com.integrationhub.platform.service.execution;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Codec del envelope de continuacion M-2.1: el contexto del pipeline
 * ({@code taskOutputs}, variables y trigger) <b>y el plan de las tareas que quedan</b>, capturado al
 * suspender una tarea, para que el resume pueda continuar las tareas downstream sin re-drive manual.
 *
 * <p><b>El plan viaja congelado, a proposito.</b> Antes el envelope llevaba solo los datos y la
 * reanudacion RELEIA la definicion del proceso, filtrando por {@code taskOrder > afterTaskOrder}. Como
 * {@code ProcessCatalogService.replaceTasks} reasigna {@code taskOrder} en cada guardado, editar el
 * proceso mientras una ejecucion estaba suspendida hacia que ese filtro seleccionara un CONJUNTO
 * DISTINTO de tareas: la reanudacion podia saltarse un paso o ejecutar uno que nunca estuvo en su plan.
 * Con {@code MT101_PAY} suspendido esperando al banco, eso es dinero. Ahora la ejecucion reanuda con el
 * grafo que tenia, no con el que haya hoy.</p>
 *
 * <p><b>Limitacion documentada</b>: la rehidratacion devuelve los valores como
 * Maps/Lists/primitivos JSON. Los flujos masivos (fragment sources, contadores,
 * referencias) sobreviven intactos; objetos tipados en memoria (e.g.
 * {@code List<Mt101Message>} del flujo no-masivo) degradan a Maps y un consumidor
 * downstream tipado fallaria — para suspension con downstream usar la ruta de
 * fragmentos persistidos. Si el envelope no se puede serializar, se persiste
 * {@code null} y el resume degrada a {@code COMPLETED_NEEDS_REDRIVE}.</p>
 *
 * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2.1), ADR-009
 */
@ApplicationScoped
public class SuspensionContinuation {

    private static final Logger LOG = Logger.getLogger(SuspensionContinuation.class);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<ProcessExecutionStateService.TaskPlan>> TASK_PLAN_LIST_TYPE =
            new TypeReference<>() {
            };
    /** Clave del plan congelado. Su AUSENCIA distingue un envelope anterior al congelado. */
    private static final String REMAINING_TASKS_KEY = "remainingTasks";
    /** Claves volatiles internas que no deben persistirse (e.g. contadores en vivo). */
    private static final String VOLATILE_KEY_PREFIX = "_staging";

    private final ObjectMapper objectMapper;

    public SuspensionContinuation(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Contexto rehidratado del pipeline suspendido.
     *
     * @param remainingTasks plan CONGELADO de lo que queda por ejecutar, en orden. Lista vacia = la
     *                       tarea suspendida era la ultima. {@code null} = envelope anterior a este
     *                       congelado (o corrupto): no se puede garantizar QUE se ejecutaria a
     *                       continuacion, asi que el resume degrada a {@code COMPLETED_NEEDS_REDRIVE}
     *                       en vez de adivinar releyendo la definicion.
     */
    public record Envelope(
            LinkedHashMap<String, Object> taskOutputs,
            Map<String, String> executionVariables,
            String triggerSource,
            List<ProcessExecutionStateService.TaskPlan> remainingTasks
    ) {
    }

    /** Devuelve {@code null} si el contexto no es serializable (degrade controlado). */
    public String marshal(Map<String, Object> taskOutputs,
                          Map<String, String> executionVariables,
                          String triggerSource,
                          List<ProcessExecutionStateService.TaskPlan> remainingTasks) {
        var filtered = new LinkedHashMap<String, Object>();
        if (taskOutputs != null) {
            taskOutputs.forEach((key, value) -> {
                if (key != null && !key.startsWith(VOLATILE_KEY_PREFIX)) {
                    filtered.put(key, value);
                }
            });
        }
        var envelope = new LinkedHashMap<String, Object>();
        envelope.put("taskOutputs", filtered);
        envelope.put("executionVariables", executionVariables == null ? Map.of() : executionVariables);
        envelope.put("triggerSource", triggerSource == null ? "" : triggerSource);
        // Los config de tarea/fuente/reader que van aqui son los PERSISTIDOS, con sus refs
        // `${secret:...}` sin resolver (QA-006/ADR-017): el envelope no gana secretos en claro.
        envelope.put(REMAINING_TASKS_KEY, remainingTasks == null ? List.of() : remainingTasks);
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException error) {
            LOG.warnf("Suspension continuation not serializable (%s); resume will report "
                    + "COMPLETED_NEEDS_REDRIVE instead of auto-continuing", error.getMessage());
            return null;
        }
    }

    /** Devuelve {@code null} si no hay envelope persistido o esta corrupto. */
    @SuppressWarnings("unchecked")
    public Envelope unmarshal(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            var raw = objectMapper.readValue(json, MAP_TYPE);
            var taskOutputs = new LinkedHashMap<String, Object>();
            if (raw.get("taskOutputs") instanceof Map<?, ?> outputs) {
                outputs.forEach((key, value) -> taskOutputs.put(String.valueOf(key), value));
            }
            var executionVariables = new LinkedHashMap<String, String>();
            if (raw.get("executionVariables") instanceof Map<?, ?> variables) {
                variables.forEach((key, value) -> executionVariables.put(
                        String.valueOf(key), value == null ? null : String.valueOf(value)));
            }
            var triggerSource = raw.get("triggerSource") == null ? "" : String.valueOf(raw.get("triggerSource"));
            // Ausencia de la clave = envelope escrito antes del congelado del plan. Se devuelve null
            // (no lista vacia) para que el resume lo distinga de "no queda nada" y no continue a ciegas.
            var rawRemaining = raw.get(REMAINING_TASKS_KEY);
            var remainingTasks = rawRemaining == null
                    ? null
                    : objectMapper.convertValue(rawRemaining, TASK_PLAN_LIST_TYPE);
            return new Envelope(taskOutputs, executionVariables, triggerSource, remainingTasks);
        } catch (JsonProcessingException | IllegalArgumentException error) {
            LOG.warnf("Suspension continuation corrupted (%s); resume will report "
                    + "COMPLETED_NEEDS_REDRIVE", error.getMessage());
            return null;
        }
    }
}
