package com.integrationhub.platform.integration;

import com.integrationhub.platform.provider.task.payments.swift.Mt101PayDispatchIntentStore;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayDispatchIntentStore.ClaimResult;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * P3 — E2E contra Postgres real del ledger de intención de dispatch (camino de lista en memoria). Prueba la
 * re-request-safety: un pago ya enviado / ambiguo / en vuelo NO se reclama de nuevo (no reenvío); un rechazo
 * pre-dispatch seguro SÍ permite reintento. El claim atómico usa el {@code ON CONFLICT} real de Postgres.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayDispatchIntentStoreIT {

    @Inject
    DataSource dataSource;

    @Inject
    Mt101PayDispatchIntentStore store;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("truncate table mt101_pay_dispatch_intent restart identity");
            s.executeUpdate("truncate table mt101_archive restart identity cascade");
        }
    }

    /** Siembra una fila de archive con el terminal ya clasificado por el pipeline (V17), para el reconcile de D2. */
    private void seedArchive(String sendersReference, long processExecutionId, String status) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_archive (senders_reference, process_execution_id, status) "
                     + "values (?, ?, ?)")) {
            st.setString(1, sendersReference);
            st.setLong(2, processExecutionId);
            st.setString(3, status);
            st.executeUpdate();
        }
    }

    @Test
    void firstClaimSucceedsAndCommitsDispatching() {
        assertEquals(ClaimResult.CLAIMED, store.claimForDispatch("REST|12|REF001", 1L, "REF001", ph("REF001")));
        assertEquals("DISPATCHING", statusOf("REST|12|REF001"), "el DISPATCHING se persiste antes del send (durable)");
    }

    @Test
    void reRequestOfASentPaymentIsBlockedAsAlreadySent() {
        store.claimForDispatch("REST|12|REF-SENT", 1L, "REF-SENT", ph("REF-SENT"));
        store.recordResult("REST|12|REF-SENT", "SENT", "GW-1", 1, null);

        // Re-request (nueva ejecución, mismo pago): NO se reclama -> no reenvío.
        assertEquals(ClaimResult.ALREADY_SENT, store.claimForDispatch("REST|12|REF-SENT", 2L, "REF-SENT", ph("REF-SENT")));
        assertEquals("SENT", statusOf("REST|12|REF-SENT"), "el estado enviado se conserva; el re-request no lo pisa");
    }

    @Test
    void reRequestOfAnUncertainPaymentIsBlockedForReconciliation() {
        store.claimForDispatch("REST|12|REF-UNC", 1L, "REF-UNC", ph("REF-UNC"));
        store.recordResult("REST|12|REF-UNC", "UNCERTAIN", null, 1, "timeout tras posible recepción");

        // El corazón del gap P3: un pago ambiguo NUNCA se reenvía a ciegas en un re-request.
        assertEquals(ClaimResult.ALREADY_UNCERTAIN, store.claimForDispatch("REST|12|REF-UNC", 2L, "REF-UNC", ph("REF-UNC")));
        assertEquals("UNCERTAIN", statusOf("REST|12|REF-UNC"), "queda UNCERTAIN durable para conciliar");
    }

    @Test
    void inFlightDispatchIsBlocked() {
        store.claimForDispatch("REST|12|REF-INFLIGHT", 1L, "REF-INFLIGHT", ph("REF-INFLIGHT")); // reclamado, aún sin resultado (DISPATCHING)

        // Otro intento concurrente / reentrega: no reenvía mientras el primero esté en vuelo.
        assertEquals(ClaimResult.IN_FLIGHT, store.claimForDispatch("REST|12|REF-INFLIGHT", 1L, "REF-INFLIGHT", ph("REF-INFLIGHT")));
    }

    @Test
    void reRequestAfterSafeRejectIsAllowed() {
        store.claimForDispatch("REST|12|REF-REJ", 1L, "REF-REJ", ph("REF-REJ"));
        // Rechazo pre-dispatch: probado que NO salió al banco -> re-solicitable.
        store.recordResult("REST|12|REF-REJ", "REJECTED", null, 1, "transport config error");

        // Un re-request del mismo pago SÍ se reclama de nuevo (el rechazo seguro no bloquea).
        assertEquals(ClaimResult.CLAIMED, store.claimForDispatch("REST|12|REF-REJ", 2L, "REF-REJ", ph("REF-REJ")));
        assertEquals("DISPATCHING", statusOf("REST|12|REF-REJ"), "el re-claim vuelve a DISPATCHING");
    }

    @Test
    void reRequestAfterInvalidatedIsAllowed() {
        // D.2 (#8a): fallo técnico pre-dispatch (transportFailure) -> INVALIDATED, probado que NO salió al banco.
        store.claimForDispatch("REST|12|REF-INV", 1L, "REF-INV", ph("REF-INV"));
        store.recordResult("REST|12|REF-INV", "INVALIDATED", null, 1, "auth fail before dispatch (no bank call)");

        // INVALIDATED es re-reclamable igual que REJECTED (mismo "probado no enviado"): el re-request NO se bloquea.
        assertEquals(ClaimResult.CLAIMED, store.claimForDispatch("REST|12|REF-INV", 2L, "REF-INV", ph("REF-INV")));
        assertEquals("DISPATCHING", statusOf("REST|12|REF-INV"), "el re-claim desde INVALIDATED vuelve a DISPATCHING");
    }

    // --- R1 (identidad de pago): un payload DISTINTO bajo la misma clave no se silencia como ALREADY_SENT ---

    @Test
    void reRequestWithADifferentPayloadUnderASentKeyIsFlaggedConflict() {
        store.claimForDispatch("REST|12|K-SENT", 1L, "K-SENT", "ph-A");
        store.recordResult("REST|12|K-SENT", "SENT", "GW", 1, null);
        // Misma dispatch_key, payload DISTINTO (otro pago colisionando): conflicto, NUNCA idempotente/silencioso.
        assertEquals(ClaimResult.ALREADY_SENT_CONFLICT,
                store.claimForDispatch("REST|12|K-SENT", 2L, "K-SENT", "ph-B"));
        assertEquals("SENT", statusOf("REST|12|K-SENT"), "el pago original permanece SENT (no se sobrescribe)");
    }

    @Test
    void reRequestWithADifferentPayloadUnderAnUncertainKeyIsFlaggedConflict() {
        store.claimForDispatch("REST|12|K-UNC", 1L, "K-UNC", "ph-A");
        store.recordResult("REST|12|K-UNC", "UNCERTAIN", null, 1, "timeout");
        assertEquals(ClaimResult.ALREADY_UNCERTAIN_CONFLICT,
                store.claimForDispatch("REST|12|K-UNC", 2L, "K-UNC", "ph-B"));
    }

    @Test
    void reRequestWithTheSamePayloadIsIdempotentNotConflict() {
        store.claimForDispatch("REST|12|K-SAME", 1L, "K-SAME", "ph-X");
        store.recordResult("REST|12|K-SAME", "SENT", "GW", 1, null);
        // MISMO payload_hash = el mismo pago: idempotente (probado), no conflicto.
        assertEquals(ClaimResult.ALREADY_SENT,
                store.claimForDispatch("REST|12|K-SAME", 2L, "K-SAME", "ph-X"));
    }

    @Test
    void blankPayloadHashIsRejectedAsInvariant() {
        // Sin identidad de payload no se puede probar mismo-pago: el store lo rechaza (invariante), nunca crea la fila.
        assertThrows(IllegalArgumentException.class,
                () -> store.claimForDispatch("REST|12|K-NOHASH", 1L, "K-NOHASH", "  "));
        assertNull(statusOf("REST|12|K-NOHASH"), "no se crea intención sin identidad de payload");
    }

    // --- D1 (visibilidad): lectores del ledger para hacer observable el atasco ---

    @Test
    void stuckReadersExposeUncertainAndDispatchingButNotTerminal() {
        // Un pago de cada clase terminal + uno en vuelo.
        store.claimForDispatch("REST|12|V-SENT", 1L, "V-SENT", ph("V-SENT"));
        store.recordResult("REST|12|V-SENT", "SENT", "GW-9", 1, null);
        store.claimForDispatch("REST|12|V-REJ", 1L, "V-REJ", ph("V-REJ"));
        store.recordResult("REST|12|V-REJ", "REJECTED", null, 1, "config error");
        store.claimForDispatch("REST|12|V-UNC", 1L, "V-UNC", ph("V-UNC"));
        store.recordResult("REST|12|V-UNC", "UNCERTAIN", null, 1, "timeout tras posible recepción");
        store.claimForDispatch("REST|12|V-INFLIGHT", 2L, "V-INFLIGHT", ph("V-INFLIGHT")); // DISPATCHING (sin resultado)

        // Atascados = UNCERTAIN + DISPATCHING (los terminales SENT/REJECTED NO exigen conciliación).
        assertEquals(2L, store.stuckIntentCount());

        var stuck = store.stuckIntents(10);
        assertEquals(2, stuck.size(), "solo UNCERTAIN + DISPATCHING");
        var refs = stuck.stream().map(Mt101PayDispatchIntentStore.DispatchIntentRow::sendersReference).sorted().toList();
        assertEquals(java.util.List.of("V-INFLIGHT", "V-UNC"), refs);
        var uncertain = stuck.stream()
                .filter(r -> "V-UNC".equals(r.sendersReference())).findFirst().orElseThrow();
        assertEquals("UNCERTAIN", uncertain.status());
        assertEquals("timeout tras posible recepción", uncertain.errorMessage(), "el motivo viaja para conciliar");
        assertEquals(Long.valueOf(1L), uncertain.processExecutionId());

        // El resumen por estado cubre TODO el ledger (para el panel).
        var counts = new java.util.HashMap<String, Long>();
        store.statusCounts().forEach(c -> counts.put(c.status(), c.count()));
        assertEquals(Long.valueOf(1L), counts.get("SENT"));
        assertEquals(Long.valueOf(1L), counts.get("REJECTED"));
        assertEquals(Long.valueOf(1L), counts.get("UNCERTAIN"));
        assertEquals(Long.valueOf(1L), counts.get("DISPATCHING"));
    }

    @Test
    void stuckIntentReportsNullProcessExecutionIdAsNull() {
        // Regresión: el camino de lista puede reclamar sin process_execution_id (NULL). getLong() lo devuelve como 0;
        // el mapeo debe reportarlo como null (wasNull capturado en la columna correcta), no como 0.
        store.claimForDispatch("REST|12|N-EXEC", null, "N-EXEC", ph("N-EXEC")); // DISPATCHING, execId NULL
        var row = store.stuckIntents(10).stream()
                .filter(r -> "N-EXEC".equals(r.sendersReference())).findFirst().orElseThrow();
        assertNull(row.processExecutionId(), "un process_execution_id NULL se reporta como null, no 0");
    }

    @Test
    void stuckIntentsRespectsLimit() {
        store.claimForDispatch("REST|12|L-UNC1", 1L, "L-UNC1", ph("L-UNC1"));
        store.recordResult("REST|12|L-UNC1", "UNCERTAIN", null, 1, "a");
        store.claimForDispatch("REST|12|L-UNC2", 1L, "L-UNC2", ph("L-UNC2"));
        store.recordResult("REST|12|L-UNC2", "UNCERTAIN", null, 1, "b");

        assertEquals(1, store.stuckIntents(1).size(), "limit acota la muestra");
        assertEquals(2L, store.stuckIntentCount(), "el conteo es exacto (no acotado)");
    }

    // --- D2 (reconciliación): cierra el intent desde el terminal ya clasificado del archive ---

    @Test
    void reconcileTransitionsStuckUncertainIntentFromArchiveTerminal() throws Exception {
        // STATUS confirmó el pago inline (archive CONFIRMED) pero el intent quedó UNCERTAIN.
        seedArchive("R-OK", 55L, "CONFIRMED");
        store.claimForDispatch("REST|12|R-OK", 55L, "R-OK", ph("R-OK"));
        store.recordResult("REST|12|R-OK", "UNCERTAIN", null, 1, "timeout");

        // El archive expone el terminal ya clasificado (CONFIRMED -> SENT), acotado por (senders_reference, execId).
        assertEquals("SENT", store.archiveTerminalStatus("R-OK", 55L));
        var stuck = store.findStuckByKey("REST|12|R-OK");
        assertNotNull(stuck);
        assertEquals(Long.valueOf(55L), stuck.processExecutionId());

        // Reconcile: transiciona el intent y ya no está atascado.
        assertEquals(1, store.reconcileToTerminal("REST|12|R-OK", "SENT", "reconciled by ops"));
        assertEquals("SENT", statusOf("REST|12|R-OK"));
        assertNull(store.findStuckByKey("REST|12|R-OK"), "ya no está atascado tras reconciliar");
    }

    @Test
    void archiveTerminalStatusClassifiesAndSkipsNonTerminalAndOtherExecution() throws Exception {
        seedArchive("R-REJ", 60L, "REJECTED");
        seedArchive("R-PEND", 60L, "ARCHIVED");      // no terminal
        seedArchive("R-RECON", 60L, "RECONCILED");   // liquidado -> cuenta como enviado
        seedArchive("R-UNM", 60L, "UNMATCHED");      // ambiguo -> no terminal
        assertEquals("REJECTED", store.archiveTerminalStatus("R-REJ", 60L));
        assertEquals("SENT", store.archiveTerminalStatus("R-RECON", 60L), "RECONCILED = enviado/liquidado");
        assertNull(store.archiveTerminalStatus("R-PEND", 60L), "ARCHIVED no es terminal -> null");
        assertNull(store.archiveTerminalStatus("R-UNM", 60L), "UNMATCHED no es terminal concluyente -> null");
        assertNull(store.archiveTerminalStatus("R-REJ", 999L), "otra ejecución no matchea (join acotado)");
    }

    @Test
    void reconcileToTerminalNoOpWhenNotStuck() {
        store.claimForDispatch("REST|12|R-SENT2", 1L, "R-SENT2", ph("R-SENT2"));
        store.recordResult("REST|12|R-SENT2", "SENT", "GW", 1, null); // ya terminal
        // No está en UNCERTAIN/DISPATCHING -> el reconcile no la toca (nunca pisa un terminal).
        assertEquals(0, store.reconcileToTerminal("REST|12|R-SENT2", "REJECTED", "should not apply"));
        assertEquals("SENT", statusOf("REST|12|R-SENT2"));
        assertNull(store.findStuckByKey("REST|12|R-SENT2"), "un terminal no cuenta como atascado");
    }

    /** Hash de payload determinista por referencia: mismo ref = mismo pago (idempotente); distinto = colisión. */
    private static String ph(String reference) {
        return "ph-" + reference;
    }

    private String statusOf(String dispatchKey) {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select status from mt101_pay_dispatch_intent where dispatch_key = '"
                     + dispatchKey + "'")) {
            return rs.next() ? rs.getString(1) : null;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
