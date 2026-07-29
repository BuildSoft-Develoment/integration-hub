package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class DbWriteUpsertPostgreSqlCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id integer primary key, name varchar(50), amount integer)";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new PostgreSqlDbWriteUpsertDialect();
    }

    @Test
    void upsertsOnPostgreSql() throws Exception {
        assertUpsertWritesThenOverwrites(
                dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()));
    }
}
