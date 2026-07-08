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
import static org.junit.jupiter.api.Assertions.assertNull;

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
        }
    }

    @Test
    void firstClaimSucceedsAndCommitsDispatching() {
        assertEquals(ClaimResult.CLAIMED, store.claimForDispatch("REST|12|REF001", 1L, "REF001"));
        assertEquals("DISPATCHING", statusOf("REST|12|REF001"), "el DISPATCHING se persiste antes del send (durable)");
    }

    @Test
    void reRequestOfASentPaymentIsBlockedAsAlreadySent() {
        store.claimForDispatch("REST|12|REF-SENT", 1L, "REF-SENT");
        store.recordResult("REST|12|REF-SENT", "SENT", "GW-1", 1, null);

        // Re-request (nueva ejecución, mismo pago): NO se reclama -> no reenvío.
        assertEquals(ClaimResult.ALREADY_SENT, store.claimForDispatch("REST|12|REF-SENT", 2L, "REF-SENT"));
        assertEquals("SENT", statusOf("REST|12|REF-SENT"), "el estado enviado se conserva; el re-request no lo pisa");
    }

    @Test
    void reRequestOfAnUncertainPaymentIsBlockedForReconciliation() {
        store.claimForDispatch("REST|12|REF-UNC", 1L, "REF-UNC");
        store.recordResult("REST|12|REF-UNC", "UNCERTAIN", null, 1, "timeout tras posible recepción");

        // El corazón del gap P3: un pago ambiguo NUNCA se reenvía a ciegas en un re-request.
        assertEquals(ClaimResult.ALREADY_UNCERTAIN, store.claimForDispatch("REST|12|REF-UNC", 2L, "REF-UNC"));
        assertEquals("UNCERTAIN", statusOf("REST|12|REF-UNC"), "queda UNCERTAIN durable para conciliar");
    }

    @Test
    void inFlightDispatchIsBlocked() {
        store.claimForDispatch("REST|12|REF-INFLIGHT", 1L, "REF-INFLIGHT"); // reclamado, aún sin resultado (DISPATCHING)

        // Otro intento concurrente / reentrega: no reenvía mientras el primero esté en vuelo.
        assertEquals(ClaimResult.IN_FLIGHT, store.claimForDispatch("REST|12|REF-INFLIGHT", 1L, "REF-INFLIGHT"));
    }

    @Test
    void reRequestAfterSafeRejectIsAllowed() {
        store.claimForDispatch("REST|12|REF-REJ", 1L, "REF-REJ");
        // Rechazo pre-dispatch: probado que NO salió al banco -> re-solicitable.
        store.recordResult("REST|12|REF-REJ", "REJECTED", null, 1, "transport config error");

        // Un re-request del mismo pago SÍ se reclama de nuevo (el rechazo seguro no bloquea).
        assertEquals(ClaimResult.CLAIMED, store.claimForDispatch("REST|12|REF-REJ", 2L, "REF-REJ"));
        assertEquals("DISPATCHING", statusOf("REST|12|REF-REJ"), "el re-claim vuelve a DISPATCHING");
    }

    // --- D1 (visibilidad): lectores del ledger para hacer observable el atasco ---

    @Test
    void stuckReadersExposeUncertainAndDispatchingButNotTerminal() {
        // Un pago de cada clase terminal + uno en vuelo.
        store.claimForDispatch("REST|12|V-SENT", 1L, "V-SENT");
        store.recordResult("REST|12|V-SENT", "SENT", "GW-9", 1, null);
        store.claimForDispatch("REST|12|V-REJ", 1L, "V-REJ");
        store.recordResult("REST|12|V-REJ", "REJECTED", null, 1, "config error");
        store.claimForDispatch("REST|12|V-UNC", 1L, "V-UNC");
        store.recordResult("REST|12|V-UNC", "UNCERTAIN", null, 1, "timeout tras posible recepción");
        store.claimForDispatch("REST|12|V-INFLIGHT", 2L, "V-INFLIGHT"); // DISPATCHING (sin resultado)

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
        store.claimForDispatch("REST|12|N-EXEC", null, "N-EXEC"); // DISPATCHING, execId NULL
        var row = store.stuckIntents(10).stream()
                .filter(r -> "N-EXEC".equals(r.sendersReference())).findFirst().orElseThrow();
        assertNull(row.processExecutionId(), "un process_execution_id NULL se reporta como null, no 0");
    }

    @Test
    void stuckIntentsRespectsLimit() {
        store.claimForDispatch("REST|12|L-UNC1", 1L, "L-UNC1");
        store.recordResult("REST|12|L-UNC1", "UNCERTAIN", null, 1, "a");
        store.claimForDispatch("REST|12|L-UNC2", 1L, "L-UNC2");
        store.recordResult("REST|12|L-UNC2", "UNCERTAIN", null, 1, "b");

        assertEquals(1, store.stuckIntents(1).size(), "limit acota la muestra");
        assertEquals(2L, store.stuckIntentCount(), "el conteo es exacto (no acotado)");
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
