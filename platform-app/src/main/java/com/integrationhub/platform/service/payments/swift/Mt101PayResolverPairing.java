package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.spi.process.ProcessTaskView;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * Regla ÚNICA de emparejamiento {@code MT101_PAY} ↔ {@code MT101_STATUS(resolveNormalPay=true)} para el money-path
 * normal, compartida por los dos validadores de definición que la necesitan:
 * {@link Mt101PayStatusConnectionCoverageValidator} (misma conexión) y {@link Mt101PayResolutionValidator}
 * (obligatoriedad por ambiente). Antes cada uno tenía su propia lógica y podían divergir: el de conexión ya usaba
 * {@code resolvesPayTaskRef} y el de obligatoriedad no, dejando pasar procesos multi-PAY donde un PAY quedaba sin
 * resolutor. Aquí vive la única definición de "qué STATUS resuelve qué PAY".
 *
 * <p><b>Regla:</b> un {@code MT101_STATUS(resolveNormalPay=true)} resuelve un {@code MT101_PAY} si está DESPUÉS de él
 * y, cuando el proceso tiene VARIOS {@code MT101_PAY}, si declara {@code resolvesPayTaskRef} = el {@code taskRef} de
 * ese PAY. Con un ÚNICO PAY, un resolutor "pelado" (sin {@code resolvesPayTaskRef}) lo satisface sin ambigüedad. Sin
 * fallback: un resolutor sin {@code resolvesPayTaskRef} en un proceso multi-PAY es ambiguo (400).</p>
 */
final class Mt101PayResolverPairing {

    static final String MT101_PAY = "MT101_PAY";
    static final String MT101_STATUS = "MT101_STATUS";

    private final ObjectMapper objectMapper;

    Mt101PayResolverPairing(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    boolean isPay(ProcessTaskView task) {
        return MT101_PAY.equalsIgnoreCase(task.taskType()) && task.taskOrder() != null;
    }

    boolean isNormalPayResolver(ProcessTaskView task) {
        return MT101_STATUS.equalsIgnoreCase(task.taskType())
                && task.taskOrder() != null
                && boolConfig(task.configurationJson(), "resolveNormalPay");
    }

    List<ProcessTaskView> pays(List<ProcessTaskView> tasks) {
        return tasks.stream().filter(this::isPay).toList();
    }

    String connectionOf(ProcessTaskView task) {
        return normalize(stringConfig(task.configurationJson(), "connectionRef"));
    }

    /**
     * El {@code MT101_PAY} que resuelve este STATUS resolutor, o {@code null} si no hay PAY anterior. Ambigüedad (varios
     * PAY y el STATUS no declara {@code resolvesPayTaskRef}) o {@code resolvesPayTaskRef} que no casa con ningún PAY
     * anterior → {@link IllegalArgumentException}.
     */
    ProcessTaskView payForResolver(ProcessTaskView status,
                                                        List<ProcessTaskView> pays) {
        var earlier = pays.stream().filter(p -> p.taskOrder() < status.taskOrder()).toList();
        if (earlier.isEmpty()) {
            return null;
        }
        var resolvesRef = normalize(stringConfig(status.configurationJson(), "resolvesPayTaskRef"));
        if (resolvesRef == null) {
            if (earlier.size() > 1) {
                throw new IllegalArgumentException(
                        "MT101_STATUS (task order " + status.taskOrder() + ") has resolveNormalPay=true and the "
                        + "process has multiple MT101_PAY tasks; it must declare resolvesPayTaskRef to name which PAY "
                        + "it resolves (no guessing across banks/connections).");
            }
            return earlier.get(0);
        }
        return earlier.stream()
                .filter(p -> resolvesRef.equals(normalize(stringConfig(p.configurationJson(), "taskRef"))))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "MT101_STATUS (task order " + status.taskOrder() + ") declares resolvesPayTaskRef='"
                        + resolvesRef + "' but no earlier MT101_PAY with that taskRef exists in the process."));
    }

    /**
     * ¿Existe un {@code MT101_STATUS(resolveNormalPay=true)} POSTERIOR que resuelva EXACTAMENTE este PAY? Un único PAY
     * en el proceso → un resolutor pelado posterior lo satisface. Varios PAY → debe existir un resolutor que declare
     * {@code resolvesPayTaskRef} = el {@code taskRef} de este PAY.
     */
    boolean hasResolverFor(ProcessTaskView pay,
                           List<ProcessTaskView> tasks,
                           boolean multiPay) {
        var payRef = normalize(stringConfig(pay.configurationJson(), "taskRef"));
        return tasks.stream().anyMatch(status ->
                isNormalPayResolver(status)
                        && status.taskOrder() > pay.taskOrder()
                        && resolves(status, payRef, multiPay));
    }

    private boolean resolves(ProcessTaskView status, String payRef, boolean multiPay) {
        var resolvesRef = normalize(stringConfig(status.configurationJson(), "resolvesPayTaskRef"));
        if (multiPay) {
            // Con varios PAY, solo cuenta si nombra explícitamente a ESTE por taskRef (un resolutor pelado es
            // ambiguo y no satisface a ningún PAY concreto).
            return resolvesRef != null && resolvesRef.equals(payRef);
        }
        // Un solo PAY: un resolutor pelado lo satisface; si nombra un taskRef, debe ser el suyo.
        return resolvesRef == null || resolvesRef.equals(payRef);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    String stringConfig(String configurationJson, String key) {
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

    boolean boolConfig(String configurationJson, String key) {
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

    static String describeConnection(String connection) {
        return connection == null ? "<default>" : connection;
    }
}
