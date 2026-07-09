package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

/**
 * G2 (acotado) — validación de definición de proceso para el money-path MT101_PAY normal.
 *
 * <p><b>Regla:</b> si un {@code MT101_PAY} tiene, en el MISMO proceso, un {@code MT101_STATUS} POSTERIOR con
 * {@code resolveNormalPay=true} (un auto-resolutor in-process), entonces el {@code MT101_PAY} <b>debe</b> tener
 * {@code continueOnFailure=true}. Si no, un pago que queda {@code UNCERTAIN} detiene el proceso en
 * {@code NEEDS_RECONCILIATION} ANTES de que el resolutor corra → el resolutor queda muerto (nunca reconcilia).</p>
 *
 * <p><b>Qué NO hace por defecto (a propósito):</b> no exige que exista un resolutor. La topología correcta y dominante
 * resuelve el UNCERTAIN en una ejecución SEPARADA (las confirmaciones bancarias llegan después), y un validador de
 * definición no puede ver esa ejecución. Solo blinda el cableado cuando el diseñador SÍ puso un auto-resolutor
 * in-process. La seguridad en runtime (no cerrar COMPLETED con dinero incierto) ya la garantiza G1.</p>
 *
 * <p><b>#1 — resolveNormalPay obligatorio por ambiente</b> (opt-in, {@code mt101.pay.require-normal-pay-resolver},
 * default {@code false}): cuando un ambiente usa la topología de reconciliación <b>in-line</b> (el mismo proceso
 * consulta el STATUS y resuelve el UNCERTAIN, en vez de diferirlo a una ejecución separada), activar este flag
 * <b>obliga</b> a que cada {@code MT101_PAY} tenga un {@code MT101_STATUS(resolveNormalPay=true)} POSTERIOR; si falta,
 * el proceso no se puede publicar (400). Default OFF: los ambientes con topología de ejecución separada (la dominante)
 * no se ven afectados. <b>Advertencia operativa:</b> encenderlo en un ambiente donde el banco confirma async hará que
 * el resolutor corra antes de la respuesta del banco y el proceso quede {@code NEEDS_RECONCILIATION} casi siempre; solo
 * tiene sentido en ambientes cuya confirmación es síncrona/in-line.</p>
 */
@ApplicationScoped
public class Mt101PayResolutionValidator {

    private static final String MT101_PAY = "MT101_PAY";
    private static final String MT101_STATUS = "MT101_STATUS";

    private final ObjectMapper objectMapper;
    /** #1: si el ambiente exige reconciliación in-line, cada MT101_PAY debe traer su MT101_STATUS(resolveNormalPay). */
    private final boolean requireNormalPayResolver;

    @Inject
    public Mt101PayResolutionValidator(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "mt101.pay.require-normal-pay-resolver", defaultValue = "false")
            boolean requireNormalPayResolver) {
        this.objectMapper = objectMapper;
        this.requireNormalPayResolver = requireNormalPayResolver;
    }

    /** Compat/test: sin exigir resolutor por ambiente (comportamiento por defecto). */
    public Mt101PayResolutionValidator(ObjectMapper objectMapper) {
        this(objectMapper, false);
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
            // #1: ambiente con reconciliación in-line obligatoria → cada MT101_PAY debe traer su resolutor posterior.
            if (requireNormalPayResolver && !hasDownstreamNormalPayResolver) {
                throw new IllegalArgumentException(
                        "MT101_PAY (task order " + pay.taskOrder() + ") requires a later MT101_STATUS with "
                        + "resolveNormalPay=true because this environment enforces in-line normal-pay reconciliation "
                        + "(mt101.pay.require-normal-pay-resolver=true).");
            }
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
