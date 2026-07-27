package com.integrationhub.platform.integration;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101RebuildRepository;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * H4: la cuarentena de la RAÍZ refleja el pago de un run HIJO. Un hijo reconstruye sólo los fragmentos que su padre
 * dejó rechazados; cuando el hijo los ENVÍA, las filas de cuarentena de la raíz (que el padre dejó
 * {@code REBUILD_REJECTED}) deben pasar a {@code REBUILD_SENT}. El cruce es por la tupla estable
 * {@code (staging_id, source_file_hash, source_record_number)}, no por {@code senders_reference} (que cambia entre
 * generaciones). Antes de este arreglo esas filas quedaban {@code REBUILD_REJECTED} para siempre aunque el hijo pagó.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101ChildQuarantinePropagationIT {

    @Inject
    DataSource dataSource;

    @Inject
    Mt101RebuildRepository rebuildRepository;

    @Inject
    Mt101FailedRecordRepository failedRecordRepository;

    private static final String ROOT_SET = "H4-ROOT";
    private static final String PARENT_CORR = "H4-ROOT-FIX-1";
    private static final String CHILD_CORR = "H4-ROOT-FIX-1-FIX-2";
    private static final String PARENT_RUN = "H4-ROOT-FIX-1";
    private static final String CHILD_RUN = "H4-ROOT-FIX-1-FIX-2";

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from mt101_rebuild_selection where rebuild_run_id in ('" + PARENT_RUN + "','" + CHILD_RUN + "')");
            s.execute("delete from mt101_rebuild_run where rebuild_run_id in ('" + PARENT_RUN + "','" + CHILD_RUN + "')");
            s.execute("delete from mt101_failed_record where fragment_set_id = '" + ROOT_SET + "'");
        }
    }

    @Test
    void resolvesRootSetWalkingParentChain() throws Exception {
        seedRuns();
        // El hijo (original set = set correctivo del padre) resuelve a la raíz (set de la carga original).
        Assertions.assertEquals(ROOT_SET, rebuildRepository.resolveRootOriginalSet(dataSource, CHILD_RUN));
        // Un run raíz devuelve su propio set original.
        Assertions.assertEquals(ROOT_SET, rebuildRepository.resolveRootOriginalSet(dataSource, PARENT_RUN));
    }

    @Test
    void childSentPropagatesToRootQuarantine() throws Exception {
        seedRuns();
        // Cuarentena raíz: una fila REBUILD_REJECTED (la que el hijo va a pagar) y una QUARANTINED (no la toca el hijo).
        seedFailedRecord("REBUILD_REJECTED", 70022L, "hashA", 22L);
        seedFailedRecord("QUARANTINED", 70099L, "hashB", 99L);
        // Selección del hijo: envió la fila (staging 70022) — misma tupla estable que la raíz, distinta senders_reference.
        seedChildSelection("REBUILD_SENT", 70022L, "hashA", 22L);

        var rootSet = rebuildRepository.resolveRootOriginalSet(dataSource, CHILD_RUN);
        int updated = failedRecordRepository.propagateChildSentToRootQuarantine(dataSource, CHILD_RUN, rootSet);

        Assertions.assertEquals(1, updated, "sólo la fila REBUILD_REJECTED que el hijo envió debe propagarse");
        Assertions.assertEquals("REBUILD_SENT", quarantineStatus(70022L), "la fila raíz pasa a REBUILD_SENT");
        Assertions.assertEquals("QUARANTINED", quarantineStatus(70099L), "una fila no tocada por el hijo no cambia");
    }

    @Test
    void propagationIsIdempotentAndDoesNotTouchAlreadySentRoot() throws Exception {
        seedRuns();
        seedFailedRecord("REBUILD_SENT", 70022L, "hashA", 22L);   // ya enviada
        seedChildSelection("REBUILD_SENT", 70022L, "hashA", 22L);

        var rootSet = rebuildRepository.resolveRootOriginalSet(dataSource, CHILD_RUN);
        int updated = failedRecordRepository.propagateChildSentToRootQuarantine(dataSource, CHILD_RUN, rootSet);

        Assertions.assertEquals(0, updated, "sólo actúa sobre REBUILD_REJECTED; una fila ya REBUILD_SENT no se retoca");
    }

    private void seedRuns() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            // Padre: original = ROOT (la carga original), sin padre.
            s.execute("insert into mt101_rebuild_run (rebuild_run_id, original_fragment_set_id, corrective_set_id, status) "
                    + "values ('" + PARENT_RUN + "','" + ROOT_SET + "','" + PARENT_CORR + "','PARTIALLY_SENT')");
            // Hijo: original = set correctivo del padre; parent_rebuild_run_id apunta al padre.
            s.execute("insert into mt101_rebuild_run (rebuild_run_id, original_fragment_set_id, corrective_set_id, status, "
                    + "parent_rebuild_run_id) values ('" + CHILD_RUN + "','" + PARENT_CORR + "','" + CHILD_CORR + "','SENT','"
                    + PARENT_RUN + "')");
        }
    }

    private void seedFailedRecord(String status, long stagingId, String hash, long recordNumber) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_failed_record (fragment_set_id, senders_reference, "
                     + "source_file_hash, source_record_number, staging_id, status) values (?,?,?,?,?,?)")) {
            st.setString(1, ROOT_SET);
            st.setString(2, "ORIG" + recordNumber);   // senders_reference ORIGINAL (distinta a la del hijo)
            st.setString(3, hash);
            st.setLong(4, recordNumber);
            st.setLong(5, stagingId);
            st.setString(6, status);
            st.executeUpdate();
        }
    }

    private void seedChildSelection(String status, long stagingId, String hash, long recordNumber) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_rebuild_selection (rebuild_run_id, fragment_set_id, "
                     + "source_record_number, record_index, staging_id, source_file_hash, original_senders_reference, "
                     + "status) values (?,?,?,?,?,?,?,?)")) {
            st.setString(1, CHILD_RUN);
            st.setString(2, PARENT_CORR);              // el hijo opera sobre el set correctivo del padre
            st.setLong(3, recordNumber);
            st.setInt(4, 1);
            st.setLong(5, stagingId);
            st.setString(6, hash);
            st.setString(7, "CHILD" + recordNumber);   // senders_reference del hijo (distinta a la raíz)
            st.setString(8, status);
            st.executeUpdate();
        }
    }

    private String quarantineStatus(long stagingId) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select status from mt101_failed_record where fragment_set_id = '" + ROOT_SET
                     + "' and staging_id = " + stagingId)) {
            return rs.next() ? rs.getString(1) : null;
        }
    }
}
