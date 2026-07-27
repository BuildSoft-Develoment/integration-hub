package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.provider.format.JsonMt101Formatter;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test de integracion encadenando {@link Mt101SplitTaskProvider} y
 * {@link Mt101RepairTaskProvider} reproduciendo el patron de outputs cruzados
 * del engine (mapa {@code taskOutputs} compartido).
 *
 * <p>Cubre la tarea T-028 del sprint 3 (escenario "split + repair").</p>
 *
 * <p>Casos cubiertos:</p>
 * <ol>
 *   <li>Mensaje grande (250 tx) llega de BUILD, SPLIT lo parte en 3 fragmentos,
 *       REPAIR sanitiza cada fragmento. La pipeline SPLIT -&gt; REPAIR funciona.</li>
 *   <li>Las modificaciones de REPAIR no afectan los limites de SPLIT
 *       (los fragmentos ya estan definidos antes del repair).</li>
 *   <li>Cuando se inserta REPAIR ANTES de SPLIT, el sanitizing aplica al
 *       mensaje original y se propaga a todos los fragmentos resultantes.</li>
 *   <li>Mensaje pequenio (50 tx) pasa por SPLIT como passthrough; REPAIR igual
 *       aplica sus acciones.</li>
 * </ol>
 *
 * @covers spec 008-mensajeria-pagos T-023 + T-024 + T-028
 * @covers ADR-009
 */
class Mt101SplitRepairIT {

    private Mt101SplitTaskProvider splitProvider;
    private Mt101RepairTaskProvider repairProvider;

    @BeforeEach
    void setUp() {
        var jsonFormatter = new JsonMt101Formatter(new ObjectMapper());
        splitProvider = new Mt101SplitTaskProvider(List.of(jsonFormatter));
        repairProvider = new Mt101RepairTaskProvider(List.of(jsonFormatter));
    }

    @Test
    void buildSplitRepairPipelineProducesSanitizedFragments() {
        // 1. BUILD (simulado): 250 transacciones con caracteres no-SWIFT-X.
        var built = sampleMessage("PROC-1", 250, "Pago a JOSE-Ñ con tildes á é í");
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("build-mt101.records", List.of(built));

        // 2. SPLIT: 250 tx / 100 por fragmento = 3 fragmentos.
        var splitResult = splitProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));
        assertTrue(splitResult.success(), () -> "SPLIT: " + splitResult.details());
        assertEquals(3, splitResult.outputs().get("outputFragmentCount"));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) splitResult.outputs().get("records");
        // Cada fragmento tiene sendersReference unico despues del split.
        assertNotEquals(
                fragments.get(0).sequenceA().sendersReference(),
                fragments.get(1).sequenceA().sendersReference());
        assertTrue(fragments.get(0).rawPayload().contains(fragments.get(0).sequenceA().sendersReference()));
        taskOutputs.put("split-mt101.records", fragments);

        // 3. REPAIR: sanitiza el remittance de cada fragmento.
        var repairResult = repairProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "split-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation")))));
        assertTrue(repairResult.success(), () -> "REPAIR: " + repairResult.details());
        assertEquals(3, repairResult.outputs().get("inputMessageCount"));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) repairResult.outputs().get("records");
        // Todos los fragmentos quedan sanitizados.
        for (var fragment : repaired) {
            for (var tx : fragment.transactions()) {
                var remittance = tx.remittanceInformation();
                if (remittance == null) continue;
                assertFalse(remittance.contains("Ñ"));
                assertFalse(remittance.contains("á"));
                assertFalse(remittance.contains("é"));
            }
        }
    }

    @Test
    void repairBeforeSplitSanitizesOriginalAndPropagatesToFragments() {
        // 1. BUILD: 200 transacciones con caracteres invalidos.
        var built = sampleMessage("PROC-2", 200, "DIRTY Ñ TEXT");
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("build-mt101.records", List.of(built));

        // 2. REPAIR primero: limpia el unico mensaje.
        var repairResult = repairProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation")))));
        assertTrue(repairResult.success());

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) repairResult.outputs().get("records");
        taskOutputs.put("repair-mt101.records", repaired);

        // 3. SPLIT despues: 200 tx / 100 = 2 fragmentos, ambos ya sanitizados.
        var splitResult = splitProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "repair-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));
        assertTrue(splitResult.success());
        assertEquals(2, splitResult.outputs().get("outputFragmentCount"));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) splitResult.outputs().get("records");
        for (var fragment : fragments) {
            for (var tx : fragment.transactions()) {
                assertFalse(tx.remittanceInformation().contains("Ñ"),
                        "fragmento conserva sanitizing previo del repair");
            }
        }
    }

    @Test
    void smallMessagePassthroughSplitThenStillRepairs() {
        // 1. BUILD: 50 transacciones (bajo el limite por defecto).
        var built = sampleMessage("PROC-3", 50, "Texto con Ñ");
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("build-mt101.records", List.of(built));

        // 2. SPLIT: passthrough (50 < 100).
        var splitResult = splitProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));
        assertEquals(1, splitResult.outputs().get("passthroughCount"));
        assertEquals(0, splitResult.outputs().get("splitMessageCount"));

        @SuppressWarnings("unchecked")
        var afterSplit = (List<Mt101Message>) splitResult.outputs().get("records");
        // Verifica que es la MISMA instancia (passthrough no copia).
        assertEquals(built, afterSplit.get(0));
        taskOutputs.put("split-mt101.records", afterSplit);

        // 3. REPAIR aplica igual sobre el passthrough.
        var repairResult = repairProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "split-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation")))));
        assertTrue(repairResult.success());
        assertTrue((int) repairResult.outputs().get("totalChanges") >= 1,
                "repair detecto Ñ y la limpio en al menos 1 transaccion");
    }

    @Test
    void repairAppliesNewReferenceTemplateAcrossAllFragments() {
        // Repair con newReferenceTemplate sobre fragmentos del split: cada
        // fragmento queda renombrado con sufijo de repair.
        var built = sampleMessage("PROC-4", 120, "x");
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("build-mt101.records", List.of(built));

        var splitResult = splitProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));
        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) splitResult.outputs().get("records");
        taskOutputs.put("split-mt101.records", fragments);

        var repairResult = repairProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "split-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "uppercaseField",
                        "targetFields", List.of("transactions.beneficiary.account"))),
                "newReferenceTemplate", "${sendersReference}-R",
                "repairAttempt", 1));

        assertTrue(repairResult.success());
        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) repairResult.outputs().get("records");
        for (var fragment : repaired) {
            assertTrue(fragment.sequenceA().sendersReference().endsWith("-R"),
                    () -> "fragment ref no termina en -R: " + fragment.sequenceA().sendersReference());
            assertTrue(fragment.sequenceA().sendersReference().length() <= 16,
                    "sendersReference debe respetar :20: 16x");
        }
    }

    @Test
    void splitAndRepairRefreshRawPayload() {
        var built = sampleMessage("PROC-RAW", 120, "PAYMENT DESCRIPTION");
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("build-mt101.records", List.of(built));

        var splitResult = splitProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));
        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) splitResult.outputs().get("records");
        assertTrue(fragments.get(1).rawPayload().contains(fragments.get(1).sequenceA().sendersReference()));

        taskOutputs.put("split-mt101.records", fragments);
        var repairResult = repairProvider.execute(contextWith(taskOutputs), Map.of(
                "input", Map.of("sourceTaskRef", "split-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "truncateField",
                        "targetFields", List.of("transactions.remittanceInformation"),
                        "maxLength", 7))));
        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) repairResult.outputs().get("records");

        assertEquals("PAYMENT", repaired.get(0).transactions().get(0).remittanceInformation());
        assertTrue(repaired.get(0).rawPayload().contains("\"remittanceInformation\" : \"PAYMENT\""));
        assertFalse(repaired.get(0).rawPayload().contains("DESCRIPTION"));
    }

    // --- helpers ---

    private TaskContext contextWith(Map<String, Object> taskOutputs) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", taskOutputs);
        return context;
    }

    private Mt101Message sampleMessage(String ref, int txCount, String remittance) {
        var txs = new ArrayList<Mt101Message.Transaction>(txCount);
        for (int i = 1; i <= txCount; i++) {
            txs.add(new Mt101Message.Transaction(
                    i, "TX-" + i, null, null,
                    new Mt101Message.Amount("PEN", new BigDecimal("100")),
                    null, null, null, null,
                    new Mt101Message.Party("", "ACC-" + i, null, List.of()),
                    remittance, null, null, "OUR", null, null));
        }
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + ref, "N"),
                new Mt101Message.SequenceA(ref, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME")),
                        null, null),
                txs,
                new Mt101Message.ControlTotals(txCount, Map.of("PEN", new BigDecimal(txCount * 100L))),
                "{\"sendersReference\":\"" + ref + "\"}", "JSON");
    }
}
