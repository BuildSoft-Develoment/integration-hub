package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ValidateTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * B2': orquestacion del ciclo bancario del set correctivo. VALIDATE/ARCHIVE automaticos;
 * PAY con maker-checker propio (el aprobador del envio != el solicitante).
 */
@Testcontainers
class Mt101CorrectiveLifecycleServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_corrective")
            .withUsername("postgres")
            .withPassword("postgres");

    private static final String SET = "SET";
    private static final String FIX = "SET-FIX-1";

    private DataSource dataSource;
    private Mt101CorrectiveLifecycleService service;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        prepareSchema();

        var rebuildService = new Mt101RebuildService(dataSource, null, null, null,
                new Mt101FailedRecordRepository(), new Mt101FragmentRepository(), new Mt101RebuildRepository());

        // Fakes de providers: marcan los fragmentos del correctivo al estado de cada etapa.
        var validate = new Mt101ValidateTaskProvider(null, null, null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                markCorrective("VALIDATED");
                return TaskResult.success("fake validate");
            }
        };
        var archive = new Mt101ArchiveTaskProvider(null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                markCorrective("ARCHIVED");
                upsertArchive("ARCHIVED");
                return TaskResult.success("fake archive");
            }
        };
        var pay = new Mt101PayTaskProvider(null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                markCorrective("SENT");
                return TaskResult.success("fake pay");
            }
        };
        Mt101CorrectiveTaskConfigSource configSource = (buildTaskDefinitionId, taskType) -> Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "fragments"));

        service = new Mt101CorrectiveLifecycleService(dataSource, null,
                new Mt101RebuildRepository(), new Mt101FragmentRepository(), rebuildService,
                configSource, validate, archive, pay);
    }

    @Test
    void advancesCorrectiveThroughValidateAndArchive() throws Exception {
        var result = service.advanceCorrective(null, FIX, "executor");

        assertEquals("ARCHIVED", result.status(), "el correctivo llega a ARCHIVED sin enviar");
        assertEquals("ARCHIVED", runStatus(FIX));
        assertEquals("REBUILD_ARCHIVED", quarantineStatus());
    }

    @Test
    void correctivePayRequiresSegregationOfDuties() throws Exception {
        service.advanceCorrective(null, FIX, "executor");

        service.requestCorrectivePay(null, FIX, "ana");
        // El mismo que solicita no puede aprobar el envio.
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.approveAndPayCorrective(null, FIX, "ana"));
        assertTrue(error.getMessage().contains("segregation of duties"));

        // Un aprobador distinto si: se envia y el lifecycle pasa a SENT.
        var paid = service.approveAndPayCorrective(null, FIX, "luis");
        assertEquals("SENT", paid.status());
        assertEquals("SENT", runStatus(FIX));
        assertEquals("REBUILD_SENT", quarantineStatus());
    }

    @Test
    void payRequiresArchivedAndPriorRequest() throws Exception {
        // No se puede pagar un correctivo que aun no esta ARCHIVED.
        var notArchived = assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana"));
        assertTrue(notArchived.getMessage().contains("must be ARCHIVED"));

        service.advanceCorrective(null, FIX, "executor");
        // Aprobar sin solicitud previa falla.
        var noRequest = assertThrows(IllegalArgumentException.class,
                () -> service.approveAndPayCorrective(null, FIX, "luis"));
        assertTrue(noRequest.getMessage().contains("must be requested"));
    }

    private void markCorrective(String status) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ? where fragment_set_id = '" + FIX + "'")) {
            statement.setString(1, status);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private void upsertArchive(String status) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_archive (senders_reference, process_execution_id, status) values ('RTEST1', 100, ?) "
                             + "on conflict (senders_reference, process_execution_id) do update set status = excluded.status")) {
            statement.setString(1, status);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private String runStatus(String runId) throws SQLException {
        return queryString("select status from mt101_rebuild_run where rebuild_run_id = '" + runId + "'");
    }

    private String quarantineStatus() throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = '" + SET + "'");
    }

    private String queryString(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : null;
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement s = connection.createStatement()) {
            s.executeUpdate("drop table if exists mt101_rebuild_selection");
            s.executeUpdate("drop table if exists mt101_rebuild_run");
            s.executeUpdate("drop table if exists mt101_failed_record");
            s.executeUpdate("drop table if exists mt101_archive");
            s.executeUpdate("drop table if exists mt101_build_fragment");
            s.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "senders_reference varchar(16) not null, superseded_by varchar(80),"
                    + "status varchar(20) not null default 'BUILT',"
                    + "updated_at timestamp not null default current_timestamp)");
            // Fragmento del set original (para findSetMetadata) y del correctivo (BUILT).
            s.executeUpdate("insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, source_table, senders_reference, status) "
                    + "values ('" + SET + "', 100, 20, 'staging_record', 'P1', 'SUPERSEDED')");
            s.executeUpdate("insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, source_table, senders_reference, status) "
                    + "values ('" + FIX + "', 100, 20, 'staging_record', 'RTEST1', 'BUILT')");
            s.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key, original_fragment_set_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null, status varchar(30) not null default 'BUILT',"
                    + "requested_by varchar(120), approved_by varchar(120), executed_by varchar(120),"
                    + "request_reason text, approval_reason text, selected_rows bigint not null default 1,"
                    + "affected_fragments integer not null default 1, error_message text, reference_code varchar(12),"
                    + "connection_ref varchar(120), pay_requested_by varchar(120), pay_requested_at timestamp,"
                    + "pay_approved_by varchar(120), pay_approved_at timestamp,"
                    + "created_at timestamp not null default current_timestamp, approved_at timestamp, executed_at timestamp,"
                    + "built_at timestamp, completed_at timestamp, last_lifecycle_sync_at timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            s.executeUpdate("insert into mt101_rebuild_run (rebuild_run_id, original_fragment_set_id, corrective_set_id, status, reference_code) "
                    + "values ('" + FIX + "', '" + SET + "', '" + FIX + "', 'BUILT', '1')");
            s.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, original_senders_reference varchar(16))");
            s.executeUpdate("insert into mt101_rebuild_selection (rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, original_senders_reference) "
                    + "values ('" + FIX + "', '" + SET + "', 'hashA', 25, 'P1')");
            s.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null, senders_reference varchar(16),"
                    + "source_file_hash varchar(64), source_record_number bigint, status varchar(40) not null default 'QUARANTINED',"
                    + "resolved_at timestamp)");
            s.executeUpdate("insert into mt101_failed_record (fragment_set_id, senders_reference, source_file_hash, source_record_number, status) "
                    + "values ('" + SET + "', 'P1', 'hashA', 25, 'REBUILD_PENDING_VALIDATION')");
            s.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, senders_reference varchar(16) not null, process_execution_id bigint,"
                    + "status varchar(20) not null default 'ARCHIVED')");
            s.executeUpdate("create unique index ux_archive_ref_exec_corr on mt101_archive (senders_reference, process_execution_id)");
        }
    }

    private DataSource dataSource() {
        var ds = new PGSimpleDataSource();
        ds.setURL(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        return ds;
    }
}
