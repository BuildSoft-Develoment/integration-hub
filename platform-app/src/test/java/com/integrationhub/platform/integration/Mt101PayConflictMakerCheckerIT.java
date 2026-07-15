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
