package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * G2 (acotado) — validación de definición de proceso para el money-path MT101_PAY normal.
 *
 * <p><b>Regla:</b> si un {@code MT101_PAY} tiene, en el MISMO proceso, un {@code MT101_STATUS} POSTERIOR con
 * {@code resolveNormalPay=true} (un auto-resolutor in-process), entonces el {@code MT101_PAY} <b>debe</b> tener
 * {@code continueOnFailure=true}. Si no, un pago que queda {@code UNCERTAIN} detiene el proceso en
 * {@code NEEDS_RECONCILIATION} ANTES de que el resolutor corra → el resolutor queda muerto (nunca reconcilia).</p>
 *
 * <p><b>Qué NO hace (a propósito):</b> no exige que exista un resolutor. La topología correcta y dominante resuelve el
 * UNCERTAIN en una ejecución SEPARADA (las confirmaciones bancarias llegan después), y un validador de definición no
 * puede ver esa ejecución. Tampoco fuerza {@code resolveNormalPay} en un {@code MT101_STATUS} de confirmación legítimo.
 * Solo blinda el cableado cuando el diseñador SÍ puso un auto-resolutor in-process. La seguridad en runtime (no cerrar
 * COMPLETED con dinero incierto) ya la garantiza G1; esto solo evita un auto-resolutor mal cableado (muerto).</p>
 */
@ApplicationScoped
public class Mt101PayResolutionValidator {

    private static final String MT101_PAY = "MT101_PAY";
    private static final String MT101_STATUS = "MT101_STATUS";

    private final ObjectMapper objectMapper;

    @Inject
    public Mt101PayResolutionValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Vista mínima de una tarea para validar el grafo (tipo + orden + config JSON). */
    public record TaskView(String taskType, Integer taskOrder, String configurationJson) {
    }

    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un {@code MT101_PAY}
     * seguido de un {@code MT101_STATUS(resolveNormalPay=true)} no tiene {@code continueOnFailure=true}.
     */
    public void validate(List<TaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        for (var pay : tasks) {
            if (!MT101_PAY.equalsIgnoreCase(pay.taskType()) || pay.taskOrder() == null) {
                continue;
            }
            var hasDownstreamNormalPayResolver = tasks.stream().anyMatch(candidate ->
                    MT101_STATUS.equalsIgnoreCase(candidate.taskType())
                            && candidate.taskOrder() != null
                            && candidate.taskOrder() > pay.taskOrder()
                            && boolConfig(candidate.configurationJson(), "resolveNormalPay"));
            if (hasDownstreamNormalPayResolver && !boolConfig(pay.configurationJson(), "continueOnFailure")) {
                throw new IllegalArgumentException(
                        "MT101_PAY (task order " + pay.taskOrder() + ") is followed by an MT101_STATUS with "
                        + "resolveNormalPay=true, so the MT101_PAY must set continueOnFailure=true; otherwise an "
                        + "UNCERTAIN payment stops the process in NEEDS_RECONCILIATION before the resolver runs, "
                        + "leaving the auto-reconciliation stage dead.");
            }
        }
    }

    private boolean boolConfig(String configurationJson, String key) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return false;
        }
        try {
            var node = objectMapper.readTree(configurationJson);
            var value = node.get(key);
            return value != null && value.asBoolean(false);
        } catch (Exception malformed) {
            // Config no parseable: tratamos la clave como ausente (no bloquea por sí sola; el resto del pipeline valida).
            return false;
        }
    }
}
