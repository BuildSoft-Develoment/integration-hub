package com.integrationhub.platform.service.execution;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Al fallar una tarea se emitia un payload de auditoria con SOLO el plan, descartando el output que la tarea si
 * llego a producir. Ahi es donde el provider deja el motivo: MT101_PAY publica en {@code errors} la referencia y
 * el {@code lastError} de cada fragmento no despachado. El unico rastro de un pago no entregado quedaba siendo el
 * contador {@code invalidated=N}, indiagnosticable despues.
 *
 * <p>Las ramas de exito y de continueOnFailure si conservaban el output; la de fallo —la que mas lo necesita— no.
 * Estos tests fijan que el output viaja tambien al fallar, sin perder la trazabilidad del plan.
 */
class ProcessExecutionAuditMapperFailurePayloadTest {

    private final ProcessExecutionAuditMapper mapper =
            new ProcessExecutionAuditMapper(new com.integrationhub.platform.service.JsonConfigurationMapper());

    private static ProcessExecutionStateService.TaskPlan payPlan() {
        return new ProcessExecutionStateService.TaskPlan(
                6L, 6, "MT101_PAY", "{}", null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("el motivo del fallo (errors del provider) sobrevive en el payload de auditoria")
    void conservaElOutputDeLaTarea() {
        var output = new LinkedHashMap<String, Object>();
        output.put("invalidatedCount", 1);
        output.put("errors", List.of(Map.of(
                "reference", "TX-15-1",
                "lastError", "Auth fail: host key not verified")));

        var payload = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL", output);

        assertTrue(payload.containsKey("errors"),
                "sin el output, el operador solo ve el contador invalidated y no puede diagnosticar");
        assertEquals(1, payload.get("invalidatedCount"));
        assertTrue(payload.get("errors").toString().contains("host key not verified"));
    }

    @Test
    @DisplayName("forma REAL del motor: taskPayload = {taskType, outputs:{...}} con errors anidado")
    void formaRealDelTaskPayload() {
        // ProcessExecutionService:234 arma el payload generico asi; el motivo viaja DENTRO de 'outputs'.
        Map<String, Object> taskPayload = Map.of(
                "taskType", "MT101_PAY",
                "outputs", Map.of(
                        "dispatchCount", 1,
                        "invalidatedCount", 1,
                        "errors", List.of(Map.of("reference", "TX-15-1", "lastError", "Auth fail"))));

        var payload = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL", taskPayload);

        assertTrue(payload.containsKey("outputs"), "el output de la tarea debe viajar al fallar");
        assertTrue(payload.get("outputs").toString().contains("Auth fail"),
                "el lastError del provider tiene que llegar al evento de auditoria");
        assertEquals("MT101_PAY", payload.get("taskType"));
    }

    @Test
    @DisplayName("el plan gana ante colision: describe QUE tarea fallo y el output no debe pisarlo")
    void elPlanNoSePisaConElOutput() {
        Map<String, Object> output = Map.of("taskType", "OTRO", "triggerSource", "IMPOSTOR");

        var payload = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL", output);

        assertEquals("MT101_PAY", payload.get("taskType"));
        assertEquals("MANUAL", payload.get("triggerSource"));
    }

    @Test
    @DisplayName("sin output (excepcion antes de producirlo) el payload sigue siendo el del plan")
    void sinOutputSeComportaComoAntes() {
        var conNull = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL", null);
        var sinArgumento = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL");

        assertEquals(sinArgumento, conNull);
    }

    @Test
    @DisplayName("un output que no es Map no se pierde: se adjunta bajo taskOutput")
    void outputNoMapaSeAdjunta() {
        var payload = mapper.buildTaskFailurePayload(payPlan(), Map.of(), "MANUAL", "detalle-suelto");

        assertEquals("detalle-suelto", payload.get("taskOutput"));
    }
}
