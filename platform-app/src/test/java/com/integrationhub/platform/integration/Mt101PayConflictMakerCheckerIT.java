package com.integrationhub.platform.integration;

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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

        // Segundo request (otro maker): NO sobrescribe en silencio -> supersede el previo y deja UN solo PENDING.
        service.requestAcknowledge(null, "NORMAL", "SET-E", "KE", "jose", "segunda solicitud", "TCK-2");
        assertEquals(1L, ackRequestCount("SET-E", "KE", "PENDING"), "un solo PENDING (el ultimo maker)");
        assertEquals(1L, ackRequestCount("SET-E", "KE", "SUPERSEDED"), "el PENDING previo se conserva como SUPERSEDED (historial)");
        // Hallazgo 1: una solicitud SUPERSEDED NO fue aprobada -> approved_at y approved_by quedan NULL.
        assertEquals(1L, ackRequestCount("SET-E", "KE", "SUPERSEDED", true),
                "la fila SUPERSEDED no lleva approved_at/approved_by (no fue aprobada)");

        // El PENDING vigente es el del ultimo maker (jose): approve usa su reason/ticket.
        var result = service.approveAcknowledge(null, "NORMAL", "SET-E", "KE", "carlos");
        assertEquals(1, result.acknowledged());
        assertFalse(payConflict("SET-E", "KE"));
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
