package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
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
public class Mt101PayResolutionValidator implements ProcessDefinitionValidator {

    private final Mt101PayResolverPairing pairing;
    /** #1: si el ambiente exige reconciliación in-line, cada MT101_PAY debe traer su MT101_STATUS(resolveNormalPay). */
    private final boolean requireNormalPayResolver;

    @Inject
    public Mt101PayResolutionValidator(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "mt101.pay.require-normal-pay-resolver", defaultValue = "false")
            boolean requireNormalPayResolver) {
        this.pairing = new Mt101PayResolverPairing(objectMapper);
        this.requireNormalPayResolver = requireNormalPayResolver;
    }

    /** Compat/test: sin exigir resolutor por ambiente (comportamiento por defecto). */
    public Mt101PayResolutionValidator(ObjectMapper objectMapper) {
        this(objectMapper, false);
    }


    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un {@code MT101_PAY}
     * seguido de un {@code MT101_STATUS(resolveNormalPay=true)} no tiene {@code continueOnFailure=true}.
     */
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        var pays = pairing.pays(tasks);
        if (pays.isEmpty()) {
            return;
        }
        // Multi-PAY: la obligatoriedad exige emparejamiento EXACTO por resolvesPayTaskRef, igual que el validador de
        // conexión. Con un solo PAY, un resolutor "pelado" posterior lo satisface (compat con el flujo simple).
        var multiPay = pays.size() > 1;
        for (var pay : pays) {
            // #1: ¿existe un MT101_STATUS(resolveNormalPay=true) POSTERIOR que resuelva EXACTAMENTE este PAY?
            // Antes se preguntaba "¿hay ALGÚN resolutor posterior?" sin mirar resolvesPayTaskRef → en multi-PAY, un
            // PAY sin resolutor propio pasaba en falso porque otro PAY tenía el suyo. Ahora se empareja por taskRef.
            var hasResolver = pairing.hasResolverFor(pay, tasks, multiPay);
            // #1: ambiente con reconciliación in-line obligatoria → cada MT101_PAY debe traer SU resolutor posterior.
            if (requireNormalPayResolver && !hasResolver) {
                throw new IllegalArgumentException(
                        "MT101_PAY (task order " + pay.taskOrder() + ") requires a later MT101_STATUS with "
                        + "resolveNormalPay=true"
                        + (multiPay ? " and resolvesPayTaskRef matching this PAY's taskRef" : "")
                        + " because this environment enforces in-line normal-pay reconciliation "
                        + "(mt101.pay.require-normal-pay-resolver=true).");
            }
            if (hasResolver && !pairing.boolConfig(pay.configurationJson(), "continueOnFailure")) {
                throw new IllegalArgumentException(
                        "MT101_PAY (task order " + pay.taskOrder() + ") is followed by an MT101_STATUS with "
                        + "resolveNormalPay=true, so the MT101_PAY must set continueOnFailure=true; otherwise an "
                        + "UNCERTAIN payment stops the process in NEEDS_RECONCILIATION before the resolver runs, "
                        + "leaving the auto-reconciliation stage dead.");
            }
        }
    }
}
