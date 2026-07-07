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
