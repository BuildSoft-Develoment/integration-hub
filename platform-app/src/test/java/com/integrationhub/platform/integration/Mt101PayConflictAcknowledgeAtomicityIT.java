package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.execution.AuditSpoolWriter;
import com.integrationhub.platform.service.payments.swift.Mt101PayConflictAcknowledgeService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Atomicidad de la resolución gobernada de PAY conflicts (A2, opción "atómico"): la limpieza del flag
 * {@code pay_conflict} y la trama {@code PAY_CONFLICT_RESOLVED} se escriben en <b>una sola transacción</b>. Este IT
 * fuerza un fallo del spool (vía mock de {@link AuditSpoolWriter}) para probar que, si la trama no puede persistir, se
 * hace {@code rollback} de la limpieza del flag → nunca queda un conflicto "resuelto" sin su trama de auditoría.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayConflictAcknowledgeAtomicityIT {

    @Inject
    DataSource dataSource;

    @Inject
    Mt101PayConflictAcknowledgeService service;

    @InjectMock
    AuditSpoolWriter auditSpoolWriter;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from mt101_build_fragment where fragment_set_id = 'ROLLBACK-SET'");
        }
    }

    @Test
    void rollsBackFlagWhenAuditFrameFails() throws Exception {
        seedConflict("ROLLBACK-SET", "K-RB", "SENT", "banco REJECTED");

        // El spool falla al escribir la trama DENTRO de la tx.
        Mockito.doThrow(new RuntimeException("spool caido"))
                .when(auditSpoolWriter).writeBatch(Mockito.any(Connection.class), Mockito.anyCollection());

        // La operación falla (propaga la excepción del spool)...
        Assertions.assertThrows(RuntimeException.class, () ->
                service.acknowledge(null, "NORMAL", "ROLLBACK-SET", "K-RB", "ops", "intento de resolver", "TCK-1"));

        // ...y el flag NO se limpió: rollback de la misma tx → el conflicto sigue abierto (money-safe: no se "resuelve"
        // un conflicto sin dejar su trama de auditoría). El status real tampoco se tocó.
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select status, pay_conflict from mt101_build_fragment "
                     + "where fragment_set_id = 'ROLLBACK-SET' and senders_reference = 'K-RB'")) {
            rs.next();
            Assertions.assertEquals("SENT", rs.getString("status"));
            Assertions.assertTrue(rs.getBoolean("pay_conflict"),
                    "el flag debe seguir en conflicto tras el rollback del spool");
        }
    }

    @Test
    void rejectsUnknownSourceWithoutFallingBackToNormal() {
        // source invalido no debe caer por defecto a NORMAL (reconoceria el conflicto equivocado): 400 explicito.
        var error = Assertions.assertThrows(IllegalArgumentException.class, () ->
                service.acknowledge(null, "CORRECTIVO", "ROLLBACK-SET", "K-RB", "ops", "motivo", "TCK-1"));
        Assertions.assertTrue(error.getMessage().contains("NORMAL or CORRECTIVE"), error.getMessage());
    }

    @Test
    void requiresTicketRef() {
        var error = Assertions.assertThrows(IllegalArgumentException.class, () ->
                service.acknowledge(null, "NORMAL", "ROLLBACK-SET", "K-RB", "ops", "motivo", "  "));
        Assertions.assertTrue(error.getMessage().contains("ticketRef"), error.getMessage());
    }

    @Test
    void preservesOriginalConflictReasonAndRecordsAcknowledgeSeparately() throws Exception {
        seedConflict("ROLLBACK-SET", "K-OK", "SENT", "banco REJECTED sobre SENT");

        var result = service.acknowledge(null, "NORMAL", "ROLLBACK-SET", "K-OK", "ops",
                "revisado, se conserva SENT", "TCK-42");
        Assertions.assertEquals(1, result.acknowledged());

        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select pay_conflict, pay_conflict_reason, pay_conflict_ack_by, "
                     + "pay_conflict_ack_reason, pay_conflict_ack_ticket, status from mt101_build_fragment "
                     + "where fragment_set_id = 'ROLLBACK-SET' and senders_reference = 'K-OK'")) {
            rs.next();
            Assertions.assertFalse(rs.getBoolean("pay_conflict"), "el flag debe quedar limpio");
            Assertions.assertEquals("SENT", rs.getString("status"), "el terminal real no se toca");
            // el motivo ORIGINAL se preserva (evidencia), el del reconocimiento va aparte
            Assertions.assertEquals("banco REJECTED sobre SENT", rs.getString("pay_conflict_reason"));
            Assertions.assertEquals("ops", rs.getString("pay_conflict_ack_by"));
            Assertions.assertEquals("revisado, se conserva SENT", rs.getString("pay_conflict_ack_reason"));
            Assertions.assertEquals("TCK-42", rs.getString("pay_conflict_ack_ticket"));
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
}
