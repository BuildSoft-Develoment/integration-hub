package com.integrationhub.platform.integration;

import com.integrationhub.platform.repository.TaskInboxRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Resiliencia distribuida (dos nodos): el claim de {@code task_inbox} es EXCLUSIVO por lease y con FENCING por token.
 * Valida la garantía money-safe bajo timeout ambiguo (un nodo "muere" a mitad de un work-item):
 * <ul>
 *   <li>un lease VIVO no lo roba otro nodo (exclusividad);</li>
 *   <li>un lease VENCIDO (nodo caído) SÍ lo re-clama otro nodo, con token nuevo (recovery);</li>
 *   <li>el nodo caído, al "despertar", NO puede finalizar su claim re-tomado (token mismatch → 0 filas) → CERO
 *       doble-ejecución / cero reenvío físico;</li>
 *   <li>un work-item ya finalizado (terminal) no se re-clama (idempotencia).</li>
 * </ul>
 * Cada acción corre en su PROPIA transacción (commit entre pasos) = dos nodos reales actuando en momentos distintos.
 * La contraparte PAY (lease vencido → UNCERTAIN, sin reenvío ciego) la cubre {@code Mt101CorrectiveLifecycleServiceTest.
 * payLateAcceptanceAfterLeaseExpiry} (assert payInvocations==1).
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class TwoNodeClaimFencingIT {

    @Inject
    TaskInboxRepository inbox;

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("truncate table task_inbox restart identity");
        }
    }

    private <T> T tx(Supplier<T> action) {
        return QuarkusTransaction.requiringNew().call(action::get);
    }

    @Test
    void liveLeaseBlocksOthersButAnExpiredLeaseIsStolenAndTheDeadNodeIsFenced() throws Exception {
        var key = "TWO-NODE-PAY-1";
        var base = Instant.now();
        var leaseA = Timestamp.from(base.plusSeconds(10));   // lease de node-A: vence en base+10s
        var leaseB = Timestamp.from(base.plusSeconds(60));

        // 1) node-A clama (crea la fila, CLAIMED, token-A). now = base.
        int claimedA = tx(() -> inbox.claim(key, "MT101_PAY", 1L, 1L, "test", "node-A", "token-A",
                leaseA, Timestamp.from(base)));
        assertEquals(1, claimedA, "node-A crea y reclama el work-item");

        // 2) node-B intenta robar el lease VIVO (now = base+1s, lease-A base+10s NO vencido). Bloqueado.
        int stolenLive = tx(() -> inbox.claim(key, "MT101_PAY", 1L, 1L, "test", "node-B", "token-B",
                leaseB, Timestamp.from(base.plusSeconds(1))));
        assertEquals(0, stolenLive, "un lease VIVO no lo roba otro nodo (exclusividad)");
        assertEquals("token-A", tokenOf(key), "el claim sigue siendo de node-A");

        // 3) el lease de node-A VENCE (node-A cayó): now = base+20s > lease-A. node-B re-clama con token nuevo.
        int stolenExpired = tx(() -> inbox.claim(key, "MT101_PAY", 1L, 1L, "test", "node-B", "token-B",
                leaseB, Timestamp.from(base.plusSeconds(20))));
        assertEquals(1, stolenExpired, "un lease VENCIDO lo re-clama otro nodo (recovery)");
        assertEquals("token-B", tokenOf(key), "ahora el claim es de node-B");

        // 4) node-A "despierta" e intenta finalizar su claim (token-A). FENCED: token no matchea -> 0 filas.
        int lateFinalizeA = tx(() -> inbox.finalizeClaimed(key, "PROCESSED", "{}", null, null, "token-A"));
        assertEquals(0, lateFinalizeA, "el nodo caido NO puede finalizar su claim re-tomado (fencing) -> cero doble-efecto");
        assertEquals("CLAIMED", statusOf(key), "el work-item sigue CLAIMED por node-B (no lo cerro el nodo caido)");

        // 5) node-B (dueño real) finaliza. Exito.
        int finalizeB = tx(() -> inbox.finalizeClaimed(key, "PROCESSED", "{}", null, null, "token-B"));
        assertEquals(1, finalizeB, "el nodo dueño del claim vivo finaliza el work-item");
        assertEquals("PROCESSED", statusOf(key));

        // 6) un re-claim posterior (cualquier nodo) NO re-ejecuta un terminal (idempotencia).
        int reclaimTerminal = tx(() -> inbox.claim(key, "MT101_PAY", 1L, 1L, "test", "node-C", "token-C",
                leaseB, Timestamp.from(base.plusSeconds(30))));
        assertEquals(0, reclaimTerminal, "un work-item PROCESSED no se re-clama (no re-ejecucion)");
        assertEquals("PROCESSED", statusOf(key));
    }

    @Test
    void heartbeatRenewalKeepsTheLeaseAndBlocksTheft() throws Exception {
        var key = "TWO-NODE-PAY-HB";
        var base = Instant.now();

        int claimedA = tx(() -> inbox.claim(key, "MT101_PAY", 2L, 2L, "test", "node-A", "token-A",
                Timestamp.from(base.plusSeconds(5)), Timestamp.from(base)));
        assertEquals(1, claimedA);

        // Heartbeat: node-A renueva su lease (token-A) a base+30s ANTES de que venza el original.
        int renewed = tx(() -> inbox.renewLease(key, "token-A", Timestamp.from(base.plusSeconds(30))));
        assertEquals(1, renewed, "el heartbeat renueva el lease del dueño (token-A)");

        // node-B intenta robar en base+10s: el lease original (base+5s) ya habria vencido, pero el heartbeat lo
        // extendio a base+30s -> NO vencido -> node-B bloqueado.
        int stolen = tx(() -> inbox.claim(key, "MT101_PAY", 2L, 2L, "test", "node-B", "token-B",
                Timestamp.from(base.plusSeconds(60)), Timestamp.from(base.plusSeconds(10))));
        assertEquals(0, stolen, "el heartbeat mantiene el lease vivo -> ningun nodo lo roba");
        assertEquals("token-A", tokenOf(key));

        // Un nodo que NO es el dueño no puede renovar (fencing del heartbeat).
        int renewByOther = tx(() -> inbox.renewLease(key, "token-B", Timestamp.from(base.plusSeconds(90))));
        assertEquals(0, renewByOther, "solo el dueño (token-A) renueva su lease");
    }

    private String tokenOf(String key) throws Exception {
        return field(key, "inbox_claim_token");
    }

    private String statusOf(String key) throws Exception {
        return field(key, "status");
    }

    private String field(String key, String col) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("select " + col + " from task_inbox where idempotency_key = ?")) {
            st.setString(1, key);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }
}
