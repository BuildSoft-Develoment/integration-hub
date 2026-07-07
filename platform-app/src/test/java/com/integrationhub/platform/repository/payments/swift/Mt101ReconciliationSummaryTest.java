package com.integrationhub.platform.repository.payments.swift;

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

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * v54-fix: el guard de terminalidad del cierre de NEEDS_RECONCILIATION — {@code reconciliationSummary} cuenta los
 * fragmentos NO terminales de una ejecución (por {@code process_execution_id}). Un ARCHIVED sin enviar cuenta como
 * no-terminal (bloquearía el cierre).
 */
@Testcontainers
class Mt101ReconciliationSummaryTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("reconciliation_summary")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentRepository repository;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        repository = new Mt101FragmentRepository();
        prepareSchema();
    }

    @Test
    void countsNonTerminalAndRejectedByExecution() throws Exception {
        // Ejecucion 100: SENT, CONFIRMED, REJECTED (terminales) + ARCHIVED, UNCERTAIN (no-terminales) = 2 no-terminal.
        seed(100L, "T1", 1, "SENT");
        seed(100L, "T2", 2, "CONFIRMED");
        seed(100L, "T3", 3, "REJECTED");
        seed(100L, "T4", 4, "ARCHIVED");
        seed(100L, "T5", 5, "UNCERTAIN");
        // Ejecucion 200 (otra): no debe contaminar el conteo de 100.
        seed(200L, "X1", 1, "DISPATCHING");

        var summary = repository.reconciliationSummary(dataSource, 100L);

        assertEquals(5, summary.total(), "5 fragmentos de la ejecucion 100");
        assertEquals(2, summary.nonTerminal(), "ARCHIVED + UNCERTAIN son no-terminales -> bloquean el cierre");
        assertEquals(1, summary.rejected(), "1 REJECTED -> el cierre seria COMPLETED_WITH_ERRORS");
    }

    @Test
    void allTerminalYieldsZeroNonTerminal() throws Exception {
        seed(300L, "A1", 1, "SENT");
        seed(300L, "A2", 2, "SUPERSEDED");
        seed(300L, "A3", 3, "RECONCILED");

        var summary = repository.reconciliationSummary(dataSource, 300L);

        assertEquals(3, summary.total());
        assertEquals(0, summary.nonTerminal(), "todos terminales -> cierre permitido");
        assertEquals(0, summary.rejected());
    }

    private void seed(long processExecutionId, String reference, int index, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("insert into mt101_build_fragment (fragment_set_id, "
                     + "process_execution_id, task_definition_id, source_table, fragment_index, fragment_total, "
                     + "senders_reference, payload_hash, raw_payload, message_json, status) "
                     + "values (?, ?, 20, 'staging_record', ?, 9, ?, repeat('a',64), 'raw', '{}', ?)")) {
            statement.setString(1, "SET-" + processExecutionId);
            statement.setLong(2, processExecutionId);
            statement.setInt(3, index);
            statement.setString(4, reference);
            statement.setString(5, status);
            statement.executeUpdate();
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key,"
                    + "fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint,"
                    + "task_definition_id bigint,"
                    + "source_table varchar(255),"
                    + "fragment_index integer not null,"
                    + "fragment_total integer not null,"
                    + "senders_reference varchar(16) not null,"
                    + "payload_hash char(64) not null,"
                    + "raw_payload text not null,"
                    + "message_json text not null,"
                    + "status varchar(20) not null default 'BUILT',"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
        }
    }

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }
}
