package com.integrationhub.platform.integration;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.platform.service.payments.swift.Mt101PayConflictAcknowledgeService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Maker-checker OPT-IN del acknowledge de PAY_CONFLICT (V99). Con el flag ON:
 * <ul>
 *   <li>el acknowledge single-actor se RECHAZA (fuerza el flujo de dos pasos);</li>
 *   <li>request-acknowledge (maker) registra la intención SIN apagar la alerta;</li>
 *   <li>approve-acknowledge exige un actor DISTINTO (segregación) y recién ahí limpia el flag.</li>
 * </ul>
 */
@QuarkusTest
@TestProfile(Mt101PayConflictMakerCheckerIT.MakerCheckerProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayConflictMakerCheckerIT {

    public static class MakerCheckerProfile extends IntegrationTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            var overrides = new HashMap<>(super.getConfigOverrides());
            overrides.put("mt101.pay.conflict.acknowledge.maker-checker.enabled", "true");
            return overrides;
        }
    }

    @Inject
    DataSource dataSource;

    @Inject
    Mt101PayConflictAcknowledgeService service;

    @Inject
    Mt101FragmentRepository repository;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("truncate table mt101_build_fragment restart identity cascade");
            s.executeUpdate("truncate table mt101_pay_conflict_ack_request restart identity");
            s.executeUpdate("truncate table mt101_rebuild_run restart identity cascade");
            s.executeUpdate("truncate table audit_spool restart identity");
        }
    }

    @Test
    void makerCheckerEnabledIsReported() {
        assertTrue(service.makerCheckerEnabled(), "el perfil activa maker-checker");
    }

    @Test
    void singleActorAcknowledgeIsRejectedWhenMakerCheckerEnabled() throws Exception {
        seedConflict("SET-A", "K1", "SENT", "banco REJECTED sobre SENT");
        var error = assertThrows(IllegalArgumentException.class, () ->
                service.acknowledge(null, "NORMAL", "SET-A", "K1", "ops", "revisado", "TCK-1"));
        assertTrue(error.getMessage().contains("maker-checker is enabled"));
        assertTrue(payConflict("SET-A", "K1"), "el flag sigue en true (no se apagó sin checker)");
    }

    @Test
    void requestDoesNotClearFlagAndApproveByADifferentActorClearsIt() throws Exception {
        seedConflict("SET-B", "K2", "SENT", "banco REJECTED sobre SENT");

        // MAKER: solicita; el flag NO se apaga.
        service.requestAcknowledge(null, "NORMAL", "SET-B", "K2", "maria", "revisado, se conserva SENT", "TCK-9");
        assertTrue(payConflict("SET-B", "K2"), "request-acknowledge NO apaga el flag (falta el checker)");

        // El MISMO actor no puede aprobar (segregación de funciones).
        var same = assertThrows(IllegalArgumentException.class, () ->
                service.approveAcknowledge(null, "NORMAL", "SET-B", "K2", "maria"));
        assertTrue(same.getMessage().contains("segregation"));
        assertTrue(payConflict("SET-B", "K2"), "el flag sigue en true tras el intento del mismo actor");

        // CHECKER distinto: aprueba -> limpia el flag.
        var result = service.approveAcknowledge(null, "NORMAL", "SET-B", "K2", "carlos");
        assertEquals(1, result.acknowledged());
        assertFalse(payConflict("SET-B", "K2"), "el checker distinto apaga el flag");
    }

    @Test
    void approveWithoutAPendingRequestIsRejected() throws Exception {
        seedConflict("SET-C", "K3", "SENT", "banco REJECTED");
        var error = assertThrows(IllegalArgumentException.class, () ->
                service.approveAcknowledge(null, "NORMAL", "SET-C", "K3", "carlos"));
        assertTrue(error.getMessage().contains("no pending"));
        assertTrue(payConflict("SET-C", "K3"), "sin un maker previo el flag no se toca");
    }

    @Test
    void requestForANonConflictIsRejected() throws Exception {
        // Sin conflicto abierto no se solicita reconocer (fail-loud).
        var error = assertThrows(IllegalArgumentException.class, () ->
                service.requestAcknowledge(null, "NORMAL", "SET-D", "K4", "maria", "sin motivo", "TCK-0"));
        assertTrue(error.getMessage().contains("no open pay conflict"));
    }

    // --- #7: maker-checker sobre CORRECTIVE (rebuildRunId + corrective_senders_reference) ---

    @Test
    void correctiveRequestDoesNotClearFlagAndApproveByADifferentActorClearsIt() throws Exception {
        seedCorrectiveConflict("RUN-B", "CORR-B", "KC2", "SENT", "banco REJECTED sobre SENT (correctivo)");

        service.requestAcknowledge(null, "CORRECTIVE", "RUN-B", "KC2", "maria", "revisado", "TCK-C9");
        assertTrue(correctivePayConflict("RUN-B", "KC2"), "request no apaga el flag correctivo");

        var same = assertThrows(IllegalArgumentException.class, () ->
                service.approveAcknowledge(null, "CORRECTIVE", "RUN-B", "KC2", "maria"));
        assertTrue(same.getMessage().contains("segregation"));
        assertTrue(correctivePayConflict("RUN-B", "KC2"));

        var result = service.approveAcknowledge(null, "CORRECTIVE", "RUN-B", "KC2", "carlos");
        assertEquals(1, result.acknowledged());
        assertFalse(correctivePayConflict("RUN-B", "KC2"), "el checker distinto apaga el flag correctivo");
        assertEquals("SENT", correctivePayStatus("RUN-B", "KC2"), "el pay_status real se conserva (no se toca)");
    }

    @Test
    void correctiveApproveWithoutPendingIsRejected() throws Exception {
        seedCorrectiveConflict("RUN-C", "CORR-C", "KC3", "SENT", "contradiccion");
        var error = assertThrows(IllegalArgumentException.class, () ->
                service.approveAcknowledge(null, "CORRECTIVE", "RUN-C", "KC3", "carlos"));
        assertTrue(error.getMessage().contains("no pending"));
        assertTrue(correctivePayConflict("RUN-C", "KC3"));
    }

    // --- #8: trama append-only PAY_CONFLICT_ACK_REQUESTED + historial (no sobrescribe el PENDING) ---

    @Test
    void requestEmitsAckRequestedTraceAndSupersedesPreviousPendingKeepingHistory() throws Exception {
        seedConflict("SET-E", "KE", "SENT", "banco REJECTED sobre SENT");

        service.requestAcknowledge(null, "NORMAL", "SET-E", "KE", "maria", "primera solicitud", "TCK-1");
        // Trama append-only del request (gobernanza): la solicitud del maker queda auditada aunque el flag siga true.
        assertTrue(spoolHasStage("PAY_CONFLICT_ACK_REQUESTED"),
                "request-acknowledge emite la trama append-only PAY_CONFLICT_ACK_REQUESTED");
        // tanda-9 C: la PRIMERA solicitud (sin PENDING previo) NO emite trama de reemplazo.
        assertFalse(spoolHasStage("PAY_CONFLICT_ACK_SUPERSEDED"),
                "sin PENDING previo no hay trama de reemplazo");

        // Segundo request (otro maker): NO sobrescribe en silencio -> supersede el previo y deja UN solo PENDING.
        service.requestAcknowledge(null, "NORMAL", "SET-E", "KE", "jose", "segunda solicitud", "TCK-2");
        assertEquals(1L, ackRequestCount("SET-E", "KE", "PENDING"), "un solo PENDING (el ultimo maker)");
        assertEquals(1L, ackRequestCount("SET-E", "KE", "SUPERSEDED"), "el PENDING previo se conserva como SUPERSEDED (historial)");
        // tanda-9 C: el reemplazo deja una trama append-only PAY_CONFLICT_ACK_SUPERSEDED con el maker reemplazado (maria).
        assertTrue(spoolHasStage("PAY_CONFLICT_ACK_SUPERSEDED"),
                "el segundo request emite la trama de reemplazo");
        assertTrue(spoolStageMentions("PAY_CONFLICT_ACK_SUPERSEDED", "maria"),
                "la trama de reemplazo nombra al maker reemplazado");
        // Hallazgo 1: una solicitud SUPERSEDED NO fue aprobada -> approved_at y approved_by quedan NULL.
        assertEquals(1L, ackRequestCount("SET-E", "KE", "SUPERSEDED", true),
                "la fila SUPERSEDED no lleva approved_at/approved_by (no fue aprobada)");

        // El PENDING vigente es el del ultimo maker (jose): approve usa su reason/ticket.
        var result = service.approveAcknowledge(null, "NORMAL", "SET-E", "KE", "carlos");
        assertEquals(1, result.acknowledged());
        assertFalse(payConflict("SET-E", "KE"));
    }

    // --- tanda-8 #7: la consola de open-conflicts expone la solicitud PENDING (LEFT JOIN sin fan-out) ---

    @Test
    void openPayConflictsExposesThePendingAckRequestAndNullWhenNone() throws Exception {
        seedConflict("SET-P", "KP", "SENT", "banco REJECTED sobre SENT");
        seedConflict("SET-N", "KN", "SENT", "sin solicitud aun");
        service.requestAcknowledge(null, "NORMAL", "SET-P", "KP", "maria", "revisado y conservado SENT", "TCK-P7");

        var rows = repository.openPayConflicts(dataSource, null, null, 50);
        var withPending = rows.stream().filter(r -> "KP".equals(r.sendersReference())).findFirst().orElseThrow();
        assertEquals("PENDING", withPending.ackStatus(), "el LEFT JOIN trae la solicitud PENDING");
        assertEquals("maria", withPending.ackRequestedBy());
        assertEquals("TCK-P7", withPending.ackTicketRef());
        assertEquals("revisado y conservado SENT", withPending.ackReason());
        assertNotNull(withPending.ackRequestedAt(), "requested_at se expone como instante");

        var withoutPending = rows.stream().filter(r -> "KN".equals(r.sendersReference())).findFirst().orElseThrow();
        assertNull(withoutPending.ackStatus(), "sin PENDING el LEFT JOIN deja los campos ack en null (no fan-out)");
        assertNull(withoutPending.ackRequestedBy());
    }

    @Test
    void openCorrectivePayConflictsExposesThePendingAckRequest() throws Exception {
        seedCorrectiveConflict("RUN-P", "CORR-P", "KCP", "SENT", "contradiccion correctiva");
        service.requestAcknowledge(null, "CORRECTIVE", "RUN-P", "KCP", "maria", "correctivo revisado", "TCK-CP");

        var rows = repository.openCorrectivePayConflicts(dataSource, null, null, 50);
        var row = rows.stream().filter(r -> "KCP".equals(r.sendersReference())).findFirst().orElseThrow();
        assertEquals("PENDING", row.ackStatus());
        assertEquals("maria", row.ackRequestedBy());
        assertEquals("TCK-CP", row.ackTicketRef());
        assertEquals("correctivo revisado", row.ackReason());
    }

    // --- tanda-8 #9: approve-acknowledge fail-loud (rows/marked explícito), sin doble-cierre silencioso ---

    @Test
    void approveIsFailLoudWhenTheConflictWasAlreadyResolvedOutOfBand() throws Exception {
        seedConflict("SET-F", "KF", "SENT", "banco REJECTED");
        service.requestAcknowledge(null, "NORMAL", "SET-F", "KF", "maria", "revisado", "TCK-F");
        // El flag ya se limpió por otra vía (p.ej. un checker concurrente que ganó): el PENDING sigue, el flag no.
        clearFlag("SET-F", "KF");

        var error = assertThrows(IllegalArgumentException.class, () ->
                service.approveAcknowledge(null, "NORMAL", "SET-F", "KF", "carlos"));
        assertTrue(error.getMessage().contains("already resolved"), "aborta explícito, no retorna 0 en silencio");
        // Rollback: la solicitud NO quedó marcada APPROVED en falso (sigue PENDING). Sin doble-cierre.
        assertEquals(1L, ackRequestCount("SET-F", "KF", "PENDING"));
        assertEquals(0L, ackRequestCount("SET-F", "KF", "APPROVED"));
    }

    @Test
    void concurrentApproveByTwoDifferentCheckersGrantsExactlyOne() throws Exception {
        seedConflict("SET-RACE", "KR", "SENT", "banco REJECTED sobre SENT");
        service.requestAcknowledge(null, "NORMAL", "SET-RACE", "KR", "maria", "revisado", "TCK-R");

        var start = new CountDownLatch(1);
        var successes = new AtomicInteger(0);
        var failures = new AtomicInteger(0);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Runnable attempt = () -> {
                try {
                    start.await();
                    var result = service.approveAcknowledge(null, "NORMAL", "SET-RACE", "KR",
                            Thread.currentThread().getName());
                    if (result.acknowledged() == 1) {
                        successes.incrementAndGet();
                    }
                } catch (RuntimeException expectedForLoser) {
                    // El perdedor de la carrera falla fuerte (already resolved / no pending), no un no-op silencioso.
                    failures.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            };
            var f1 = pool.submit(attempt);   // checker "pool-...-thread-1"
            var f2 = pool.submit(attempt);   // checker "pool-...-thread-2"
            start.countDown();
            f1.get(15, TimeUnit.SECONDS);
            f2.get(15, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }

        assertEquals(1, successes.get(), "exactamente UN checker aprueba (contención real)");
        assertEquals(1, failures.get(), "el otro falla fuerte (cero doble-cierre silencioso)");
        assertFalse(payConflict("SET-RACE", "KR"), "el flag queda limpio una sola vez");
        assertEquals(1L, ackRequestCount("SET-RACE", "KR", "APPROVED"), "una sola aprobación queda registrada");
        assertEquals(0L, ackRequestCount("SET-RACE", "KR", "PENDING"), "no queda PENDING colgado");
    }

    private void clearFlag(String setId, String ref) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("update mt101_build_fragment set pay_conflict = false "
                     + "where fragment_set_id = ? and senders_reference = ?")) {
            st.setString(1, setId);
            st.setString(2, ref);
            st.executeUpdate();
        }
    }

    private void seedCorrectiveConflict(String runId, String correctiveSetId, String ref, String payStatus,
                                        String reason) throws Exception {
        try (Connection c = dataSource.getConnection()) {
            try (var st = c.prepareStatement("insert into mt101_rebuild_run "
                    + "(rebuild_run_id, original_fragment_set_id, corrective_set_id, status) "
                    + "values (?, ?, ?, 'COMPLETED')")) {
                st.setString(1, runId);
                st.setString(2, "ORIG-" + runId);
                st.setString(3, correctiveSetId);
                st.executeUpdate();
            }
            try (var st = c.prepareStatement("insert into mt101_corrective_pay_fragment "
                    + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, "
                    + "idempotency_key, pay_status, pay_conflict, pay_conflict_reason) "
                    + "values (?, ?, ?, repeat('a', 64), ?, ?, true, ?)")) {
                st.setString(1, runId);
                st.setString(2, correctiveSetId);
                st.setString(3, ref);
                st.setString(4, "idem-" + ref);
                st.setString(5, payStatus);
                st.setString(6, reason);
                st.executeUpdate();
            }
        }
    }

    private boolean correctivePayConflict(String runId, String ref) throws Exception {
        return correctiveField(runId, ref, "pay_conflict").equals("true");
    }

    private String correctivePayStatus(String runId, String ref) throws Exception {
        return correctiveField(runId, ref, "pay_status");
    }

    private String correctiveField(String runId, String ref, String field) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("select " + field + " from mt101_corrective_pay_fragment "
                     + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            st.setString(1, runId);
            st.setString(2, ref);
            try (var rs = st.executeQuery()) {
                rs.next();
                return String.valueOf(rs.getObject(1));
            }
        }
    }

    private long ackRequestCount(String setOrRunId, String ref, String status) throws Exception {
        return ackRequestCount(setOrRunId, ref, status, false);
    }

    private long ackRequestCount(String setOrRunId, String ref, String status, boolean requireNullApproval)
            throws Exception {
        var sql = "select count(*) from mt101_pay_conflict_ack_request "
                + "where set_or_run_id = ? and senders_reference = ? and status = ?"
                + (requireNullApproval ? " and approved_at is null and approved_by is null" : "");
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement(sql)) {
            st.setString(1, setOrRunId);
            st.setString(2, ref);
            st.setString(3, status);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private boolean spoolHasStage(String stage) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("select count(*) from audit_spool where payload like ?")) {
            st.setString(1, "%" + stage + "%");
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1) > 0;
            }
        }
    }

    /** ¿Hay una trama del stage dado cuyo payload contiene además el needle (p.ej. el maker reemplazado)? */
    private boolean spoolStageMentions(String stage, String needle) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("select count(*) from audit_spool where payload like ? and payload like ?")) {
            st.setString(1, "%" + stage + "%");
            st.setString(2, "%" + needle + "%");
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1) > 0;
            }
        }
    }

    private void seedConflict(String setId, String ref, String status, String reason) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_build_fragment "
                     + "(fragment_set_id, source_table, fragment_index, fragment_total, senders_reference, "
                     + "payload_hash, raw_payload, message_json, status, pay_conflict, pay_conflict_reason) "
                     + "values (?, 'staging_record', 1, 2, ?, repeat('a', 64), 'raw', '{}', ?, true, ?)")) {
            st.setString(1, setId);
            st.setString(2, ref);
            st.setString(3, status);
            st.setString(4, reason);
            st.executeUpdate();
        }
    }

    private boolean payConflict(String setId, String ref) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("select pay_conflict from mt101_build_fragment "
                     + "where fragment_set_id = ? and senders_reference = ?")) {
            st.setString(1, setId);
            st.setString(2, ref);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getBoolean(1);
            }
        }
    }
}
