package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ReconcileTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RepairTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RouteTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusTaskProvider;
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
import java.util.concurrent.atomic.AtomicInteger;

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
    private Mt101RebuildService rebuildService;
    private AtomicInteger payInvocations;
    private AtomicInteger routeInvocations;
    private AtomicInteger statusInvocations;
    private AtomicInteger reconcileInvocations;
    private boolean rejectSecondPayFragment;
    private boolean payUncertain;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        prepareSchema();
        payInvocations = new AtomicInteger();
        routeInvocations = new AtomicInteger();
        statusInvocations = new AtomicInteger();
        reconcileInvocations = new AtomicInteger();
        rejectSecondPayFragment = false;
        payUncertain = false;

        rebuildService = new Mt101RebuildService(dataSource, null, null, null,
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
        var repair = new Mt101RepairTaskProvider() {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                return TaskResult.success("fake repair");
            }
        };
        var route = new Mt101RouteTaskProvider(null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                routeInvocations.incrementAndGet();
                return TaskResult.success("fake route");
            }
        };
        var pay = new Mt101PayTaskProvider(null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                payInvocations.incrementAndGet();
                if (payUncertain) {
                    // Timeout/conexion tras enviar: el provider clasifica UNCERTAIN (no marca
                    // SENT/REJECTED) y lo reporta en uncertainCount. No toca los fragmentos.
                    return TaskResult.failure("fake uncertain pay", Map.of(
                            "uncertainCount", 1,
                            "uncertain", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST1",
                                    "status", "UNCERTAIN",
                                    "attempts", 1,
                                    "lastError", "timeout: read timed out")),
                            "records", java.util.List.of(),
                            "errors", java.util.List.of(),
                            "dispatchCount", 1,
                            "sentCount", 0,
                            "rejectedCount", 0));
                }
                if (rejectSecondPayFragment) {
                    markReference("RTEST1", "SENT", null);
                    markReference("RTEST2", "REJECTED", "gateway rejected");
                    return TaskResult.failure("fake partial pay", Map.of(
                            "records", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST1",
                                    "status", "ACCEPTED",
                                    "gatewayReference", "GW-1",
                                    "attempts", 1)),
                            "errors", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST2",
                                    "status", "REJECTED",
                                    "lastError", "gateway rejected",
                                    "attempts", 1)),
                            "dispatchCount", 2,
                            "sentCount", 1,
                            "rejectedCount", 1));
                }
                markCorrective("SENT");
                return TaskResult.success("fake pay", Map.of(
                        "records", java.util.List.of(
                                Map.of("sendersReference", "RTEST1", "status", "ACCEPTED", "gatewayReference", "GW-1", "attempts", 1),
                                Map.of("sendersReference", "RTEST2", "status", "ACCEPTED", "gatewayReference", "GW-2", "attempts", 1))));
            }
        };
        var status = new Mt101StatusTaskProvider(null, dataSource, null, null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                statusInvocations.incrementAndGet();
                return TaskResult.success("fake status");
            }
        };
        var reconcile = new Mt101ReconcileTaskProvider(dataSource, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                reconcileInvocations.incrementAndGet();
                return TaskResult.success("fake reconcile");
            }
        };
        Mt101CorrectiveTaskConfigSource configSource = (buildTaskDefinitionId, taskType) -> Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "fragments"));

        service = new Mt101CorrectiveLifecycleService(dataSource, null,
                new Mt101RebuildRepository(), new Mt101FragmentRepository(), rebuildService,
                configSource, validate, repair, route, archive, pay, status, reconcile);
    }

    @Test
    void advancesCorrectiveThroughValidateAndArchive() throws Exception {
        var result = service.advanceCorrective(null, FIX, "executor");

        assertEquals("ARCHIVED", result.status(), "el correctivo llega a ARCHIVED sin enviar");
        assertEquals("ARCHIVED", runStatus(FIX));
        assertEquals("REBUILD_ARCHIVED", quarantineStatus());
        assertEquals(1, routeInvocations.get(), "ROUTE se ejecuta antes de ARCHIVE");
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
        assertEquals("SENT", payStatus(FIX));
        assertEquals(1, statusInvocations.get(), "STATUS se invoca despues de PAY");
        assertEquals(1, reconcileInvocations.get(), "RECONCILE se invoca despues de PAY");
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

    @Test
    void payClaimPreventsDoubleSendWhenAnotherCheckerWonTheClaim() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana");

        var repository = new Mt101RebuildRepository();
        var payloadHash = repository.archivedCorrectivePayloadHash(dataSource, FIX);
        assertTrue(repository.claimPayForExecution(dataSource, FIX, "luis",
                        payloadHash, java.time.LocalDateTime.now().plusMinutes(15)),
                "simula que otro checker ya reclamo PAY");

        var error = assertThrows(IllegalStateException.class,
                () -> service.approveAndPayCorrective(null, FIX, "maria"));

        assertTrue(error.getMessage().contains("could not be claimed"));
        assertEquals(0, payInvocations.get(), "no se invoca MT101_PAY si el claim atomico no gana");
    }

    @Test
    void invalidatesPayRequestWhenArchivedPayloadHashChanges() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana");

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_build_fragment set payload_hash = repeat('9', 64) "
                    + "where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST2'");
        }

        var error = assertThrows(IllegalStateException.class,
                () -> service.approveAndPayCorrective(null, FIX, "luis"));

        assertTrue(error.getMessage().contains("invalidated"));
        assertEquals("INVALIDATED", payStatus(FIX));
        assertEquals(0, payInvocations.get(), "no se invoca MT101_PAY si cambio el hash aprobado");
    }

    @Test
    void partialPayPersistsFragmentDetailAndKeepsGranularQuarantine() throws Exception {
        rejectSecondPayFragment = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana");

        var result = service.approveAndPayCorrective(null, FIX, "luis");

        assertEquals("PARTIALLY_SENT", result.status());
        assertEquals("PARTIALLY_SENT", runStatus(FIX));
        assertEquals("PARTIALLY_SENT", payStatus(FIX));
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'SENT'"));
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'REJECTED'"));
        assertEquals("REBUILD_SENT", quarantineStatus(25));
        assertEquals("REBUILD_REJECTED", quarantineStatus(75));
    }

    @Test
    void expiredExecutingPayBecomesUncertainWithoutRetry() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana");
        var repository = new Mt101RebuildRepository();
        var payloadHash = repository.archivedCorrectivePayloadHash(dataSource, FIX);
        assertTrue(repository.claimPayForExecution(dataSource, FIX, "luis",
                payloadHash, java.time.LocalDateTime.now().minusMinutes(1)));

        var marked = repository.markExpiredPayExecutionsUncertain(dataSource, java.time.LocalDateTime.now());

        assertEquals(1, marked);
        assertEquals("UNCERTAIN", payStatus(FIX));
        assertEquals(0, payInvocations.get(), "el vencimiento de lease no reintenta PAY");
    }

    @Test
    void uncertainPayMarksRunUncertainWithoutSendingOrReconciling() throws Exception {
        payUncertain = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana");

        service.approveAndPayCorrective(null, FIX, "luis");

        // Clasificacion TIPADA (TransportResult.uncertain): no se asume enviado.
        assertEquals("UNCERTAIN", payStatus(FIX));
        assertEquals(1, payInvocations.get());
        assertEquals(0, statusInvocations.get(), "no se corre STATUS con PAY incierto");
        assertEquals(0, reconcileInvocations.get(), "no se corre RECONCILE con PAY incierto");
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'UNCERTAIN'"));
        assertEquals(0L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'SENT'"));
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

    private void markReference(String reference, String status, String errorMessage) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ?, error_message = ? "
                             + "where fragment_set_id = '" + FIX + "' and senders_reference = ?")) {
            statement.setString(1, status);
            statement.setString(2, errorMessage);
            statement.setString(3, reference);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private void upsertArchive(String status) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_archive (senders_reference, process_execution_id, status) values ('RTEST1', 100, ?), ('RTEST2', 100, ?) "
                             + "on conflict (senders_reference, process_execution_id) do update set status = excluded.status")) {
            statement.setString(1, status);
            statement.setString(2, status);
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

    private String quarantineStatus(long recordNumber) throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = '" + SET
                + "' and source_record_number = " + recordNumber);
    }

    private String payStatus(String runId) throws SQLException {
        return queryString("select pay_status from mt101_rebuild_run where rebuild_run_id = '" + runId + "'");
    }

    private long queryLong(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getLong(1) : 0L;
        }
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
            s.executeUpdate("drop table if exists mt101_corrective_pay_fragment");
            s.executeUpdate("drop table if exists mt101_rebuild_selection");
            s.executeUpdate("drop table if exists mt101_rebuild_run");
            s.executeUpdate("drop table if exists mt101_failed_record");
            s.executeUpdate("drop table if exists mt101_archive");
            s.executeUpdate("drop table if exists mt101_fragment_record");
            s.executeUpdate("drop table if exists mt101_build_fragment");
            s.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "senders_reference varchar(16) not null, superseded_by varchar(80),"
                    + "payload_hash varchar(64) not null default repeat('0', 64),"
                    + "status varchar(20) not null default 'BUILT',"
                    + "error_message text,"
                    + "updated_at timestamp not null default current_timestamp)");
            // Fragmento del set original (para findSetMetadata) y del correctivo (BUILT).
            s.executeUpdate("insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, source_table, senders_reference, payload_hash, status) "
                    + "values ('" + SET + "', 100, 20, 'staging_record', 'P1', repeat('a', 64), 'SUPERSEDED')");
            s.executeUpdate("insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, source_table, senders_reference, payload_hash, status) "
                    + "values ('" + FIX + "', 100, 20, 'staging_record', 'RTEST1', repeat('1', 64), 'BUILT'),"
                    + "('" + FIX + "', 100, 20, 'staging_record', 'RTEST2', repeat('2', 64), 'BUILT')");
            s.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id),"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80))");
            s.executeUpdate("insert into mt101_fragment_record "
                    + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, current_senders_reference, current_transaction_reference, rebuild_run_id) "
                    + "select id, '" + FIX + "', 'hashA', 25, 10025, 'RTEST1', 'C25', '" + FIX + "' "
                    + "from mt101_build_fragment where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST1'");
            s.executeUpdate("insert into mt101_fragment_record "
                    + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, current_senders_reference, current_transaction_reference, rebuild_run_id) "
                    + "select id, '" + FIX + "', 'hashA', 75, 10075, 'RTEST2', 'C75', '" + FIX + "' "
                    + "from mt101_build_fragment where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST2'");
            s.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key, original_fragment_set_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null, status varchar(30) not null default 'BUILT',"
                    + "requested_by varchar(120), approved_by varchar(120), executed_by varchar(120),"
                    + "request_reason text, approval_reason text, selected_rows bigint not null default 1,"
                    + "affected_fragments integer not null default 1, error_message text, reference_code varchar(12),"
                    + "connection_ref varchar(120), pay_requested_by varchar(120), pay_requested_at timestamp,"
                    + "pay_status varchar(30) not null default 'NOT_REQUESTED',"
                    + "pay_approved_by varchar(120), pay_approved_at timestamp,"
                    + "pay_claimed_by varchar(120), pay_claimed_at timestamp,"
                    + "pay_requested_payload_hash varchar(64), pay_claimed_payload_hash varchar(64),"
                    + "pay_lease_until timestamp, pay_uncertain_reason text,"
                    + "pay_completed_at timestamp, pay_error_message text,"
                    + "created_at timestamp not null default current_timestamp, approved_at timestamp, executed_at timestamp,"
                    + "built_at timestamp, completed_at timestamp, last_lifecycle_sync_at timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            s.executeUpdate("insert into mt101_rebuild_run (rebuild_run_id, original_fragment_set_id, corrective_set_id, status, reference_code) "
                    + "values ('" + FIX + "', '" + SET + "', '" + FIX + "', 'BUILT', '1')");
            s.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16), corrective_senders_reference varchar(16),"
                    + "status varchar(30) not null default 'SELECTED',"
                    + "lifecycle_updated_at timestamp)");
            s.executeUpdate("insert into mt101_rebuild_selection (rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, staging_id, original_senders_reference, corrective_senders_reference) "
                    + "values ('" + FIX + "', '" + SET + "', 'hashA', 25, 10025, 'P1', 'RTEST1'),"
                    + "('" + FIX + "', '" + SET + "', 'hashA', 75, 10075, 'P2', 'RTEST2')");
            s.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null, senders_reference varchar(16),"
                    + "source_file_hash varchar(64), source_record_number bigint, staging_id bigint,"
                    + "status varchar(40) not null default 'QUARANTINED',"
                    + "resolved_at timestamp)");
            s.executeUpdate("insert into mt101_failed_record (fragment_set_id, senders_reference, source_file_hash, source_record_number, staging_id, status) "
                    + "values ('" + SET + "', 'P1', 'hashA', 25, 10025, 'REBUILD_PENDING_VALIDATION'),"
                    + "('" + SET + "', 'P2', 'hashA', 75, 10075, 'REBUILD_PENDING_VALIDATION')");
            s.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, senders_reference varchar(16) not null, process_execution_id bigint,"
                    + "status varchar(20) not null default 'ARCHIVED')");
            s.executeUpdate("create unique index ux_archive_ref_exec_corr on mt101_archive (senders_reference, process_execution_id)");
            s.executeUpdate("create table mt101_corrective_pay_fragment ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null references mt101_rebuild_run(rebuild_run_id) on delete cascade,"
                    + "corrective_set_id varchar(80) not null, corrective_senders_reference varchar(16) not null,"
                    + "source_file_hash varchar(64), source_record_number bigint, staging_id bigint,"
                    + "payload_hash varchar(64) not null, idempotency_key varchar(180) not null,"
                    + "gateway_reference varchar(120), pay_status varchar(30) not null default 'REQUESTED',"
                    + "attempts integer not null default 0, error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp,"
                    + "unique (rebuild_run_id, corrective_senders_reference))");
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
