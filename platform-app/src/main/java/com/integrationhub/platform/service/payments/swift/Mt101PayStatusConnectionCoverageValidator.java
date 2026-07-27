package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

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
 * <p><b>Emparejamiento explícito (evita el falso positivo multi-banco):</b> con un único {@code MT101_PAY} en el
 * proceso, el STATUS resolutor se empareja con él sin ambigüedad. Con <b>varios</b> {@code MT101_PAY}, cada STATUS
 * resolutor <b>debe</b> declarar {@code resolvesPayTaskRef} = el {@code taskRef} del PAY que resuelve; si no lo
 * declara, es ambigüedad → 400 (no se adivina comparando contra todos los PAY, que rechazaría un grafo válido
 * PAY_A/STATUS_A + PAY_B/STATUS_B). El par comparado es exactamente (PAY nombrado, STATUS).</p>
 *
 * <p><b>Alcance (por qué es sano):</b> el {@code connectionRef} es config estática de ambos providers, enumerable en
 * definición. {@code null}/blank normaliza a "conexión por defecto" (ambos sin {@code connectionRef} = misma conexión).
 * NO valida transporte/banco por ruta ni {@code fragmentSetId} (derivado en runtime del output upstream): eso no es
 * verificable en definición sin falsos positivos. Solo cubre el gap real y estático: el ledger/conexión.</p>
 */
@ApplicationScoped
public class Mt101PayStatusConnectionCoverageValidator implements ProcessDefinitionValidator {

    private final Mt101PayResolverPairing pairing;

    @Inject
    public Mt101PayStatusConnectionCoverageValidator(ObjectMapper objectMapper) {
        this.pairing = new Mt101PayResolverPairing(objectMapper);
    }

    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un
     * {@code MT101_STATUS(resolveNormalPay=true)} resuelve un {@code MT101_PAY} con {@code connectionRef} distinto, o
     * si con varios PAY el STATUS no declara a cuál resuelve ({@code resolvesPayTaskRef}).
     */
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        var pays = pairing.pays(tasks);
        if (pays.isEmpty()) {
            return;
        }
        for (var status : tasks) {
            if (!pairing.isNormalPayResolver(status)) {
                continue;
            }
            var pay = pairing.payForResolver(status, pays);
            if (pay == null) {
                // No hay PAY anterior que emparejar: este validador solo cubre la cobertura de conexión PAY→STATUS.
                // "PAY sin resolutor" o "resolutor sin PAY" son responsabilidad de Mt101PayResolutionValidator.
                continue;
            }
            var payConnection = pairing.connectionOf(pay);
            var statusConnection = pairing.connectionOf(status);
            if (!java.util.Objects.equals(payConnection, statusConnection)) {
                throw new IllegalArgumentException(
                        "MT101_STATUS (task order " + status.taskOrder() + ") resolves the normal PAY "
                        + "(resolveNormalPay=true) but reads connection '"
                        + Mt101PayResolverPairing.describeConnection(statusConnection)
                        + "', which differs from the MT101_PAY (task order " + pay.taskOrder() + ") connection '"
                        + Mt101PayResolverPairing.describeConnection(payConnection) + "'. The resolver must use the "
                        + "same connectionRef as the MT101_PAY; otherwise it reads an empty fragment set from the "
                        + "wrong ledger and would falsely close the process while the money is still UNCERTAIN.");
            }
        }
    }
}
