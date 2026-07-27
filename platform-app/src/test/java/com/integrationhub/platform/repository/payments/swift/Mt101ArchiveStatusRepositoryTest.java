package com.integrationhub.platform.repository.payments.swift;

import com.integrationhub.vertical.swift.mt101.repository.Mt101ArchiveStatusRepository;

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
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * @covers spec 008-mensajeria-pagos RF-004, RF-022
 */
@Testcontainers
class Mt101ArchiveStatusRepositoryTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_archive_status_repository")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101ArchiveStatusRepository repository;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        repository = new Mt101ArchiveStatusRepository();
        prepareSchema();
    }

    @Test
    void updatesStatusAndTimestampWhenArchiveTableMatchesContract() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            repository.updateArchiveStatus(connection, "mt101_archive_ok",
                    List.of(new Mt101ArchiveStatusRepository.ArchiveStatusUpdate(1L, "SENT")));
        }

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(
                     "select status, updated_at is not null as touched from mt101_archive_ok where id = 1")) {
            rs.next();
            assertEquals("SENT", rs.getString("status"));
            assertEquals(true, rs.getBoolean("touched"));
        }
    }

    @Test
    void failsFastWhenArchiveTableDoesNotExposeUpdatedAt() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            var error = assertThrows(SQLException.class, () -> repository.updateArchiveStatus(
                    connection,
                    "mt101_archive_legacy",
                    List.of(new Mt101ArchiveStatusRepository.ArchiveStatusUpdate(1L, "SENT"))));

            assertEquals("42703", error.getSQLState());
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_archive_ok");
            statement.executeUpdate("drop table if exists mt101_archive_legacy");
            statement.executeUpdate("create table mt101_archive_ok ("
                    + "id bigint primary key,"
                    + "status varchar(20) not null,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_archive_legacy ("
                    + "id bigint primary key,"
                    + "status varchar(20) not null)");
            statement.executeUpdate("insert into mt101_archive_ok(id, status) values (1, 'ARCHIVED')");
            statement.executeUpdate("insert into mt101_archive_legacy(id, status) values (1, 'ARCHIVED')");
        }
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }
}
