package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Objects;

/**
 * #2 (extensión — cobertura semántica de conexión) — validación de definición del money-path MT101_PAY normal.
 *
 * <p><b>Regla:</b> si un {@code MT101_PAY} tiene, POSTERIOR y en el mismo proceso, un
 * {@code MT101_STATUS(resolveNormalPay=true)} (el auto-resolutor in-process del UNCERTAIN normal), entonces ese STATUS
 * <b>debe</b> usar el <b>mismo</b> {@code connectionRef} que el {@code MT101_PAY}. Si no, el resolutor lee el set de
 * fragmentos ({@code mt101_build_fragment}) desde un ledger/BD distinto al que el PAY escribió → encuentra 0 fragmentos
 * → reporta "todo resuelto" → el proceso cierra {@code COMPLETED} mientras el dinero sigue {@code UNCERTAIN} en la otra
 * conexión. Fail-loud (400 al publicar), sin fallback.</p>
 *
 * <p><b>Alcance (por qué es sano):</b> el {@code connectionRef} es config estática de ambos providers, enumerable en
 * definición. {@code null}/blank normaliza a "conexión por defecto" (ambos sin {@code connectionRef} = misma conexión).
 * NO valida transporte/banco por ruta ni {@code fragmentSetId} (derivado en runtime del output upstream): eso no es
 * verificable en definición sin falsos positivos. Solo cubre el gap real y estático: el ledger/conexión.</p>
 */
@ApplicationScoped
public class Mt101PayStatusConnectionCoverageValidator {

    private static final String MT101_PAY = "MT101_PAY";
    private static final String MT101_STATUS = "MT101_STATUS";

    private final ObjectMapper objectMapper;

    @Inject
    public Mt101PayStatusConnectionCoverageValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un
     * {@code MT101_STATUS(resolveNormalPay=true)} posterior a un {@code MT101_PAY} usa un {@code connectionRef} distinto.
     */
    public void validate(List<Mt101PayResolutionValidator.TaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        for (var pay : tasks) {
            if (!MT101_PAY.equalsIgnoreCase(pay.taskType()) || pay.taskOrder() == null) {
                continue;
            }
            var payConnection = normalize(stringConfig(pay.configurationJson(), "connectionRef"));
            for (var status : tasks) {
                if (!MT101_STATUS.equalsIgnoreCase(status.taskType())
                        || status.taskOrder() == null
                        || status.taskOrder() <= pay.taskOrder()
                        || !boolConfig(status.configurationJson(), "resolveNormalPay")) {
                    continue;
                }
                var statusConnection = normalize(stringConfig(status.configurationJson(), "connectionRef"));
                if (!Objects.equals(payConnection, statusConnection)) {
                    throw new IllegalArgumentException(
                            "MT101_STATUS (task order " + status.taskOrder() + ") resolves the normal PAY "
                            + "(resolveNormalPay=true) but reads connection '" + describe(statusConnection)
                            + "', which differs from the MT101_PAY (task order " + pay.taskOrder() + ") connection '"
                            + describe(payConnection) + "'. The resolver must use the same connectionRef as the "
                            + "MT101_PAY; otherwise it reads an empty fragment set from the wrong ledger and would "
                            + "falsely close the process while the money is still UNCERTAIN.");
                }
            }
        }
    }

    private static String describe(String connection) {
        return connection == null ? "<default>" : connection;
    }

    /** null/blank → null (conexión por defecto), para que dos tareas "sin connectionRef" cuenten como la misma. */
    private static String normalize(String connection) {
        return connection == null || connection.isBlank() ? null : connection.trim();
    }

    private String stringConfig(String configurationJson, String key) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return null;
        }
        try {
            var node = objectMapper.readTree(configurationJson);
            var value = node.get(key);
            return value == null || value.isNull() ? null : value.asText();
        } catch (Exception malformed) {
            return null;
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
            return false;
        }
    }
}
