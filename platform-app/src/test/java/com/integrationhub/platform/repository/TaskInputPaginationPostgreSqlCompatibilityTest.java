package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class TaskInputPaginationPostgreSqlCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id integer primary key, name varchar(50), tenant varchar(5))";
    }

    @Override
    protected ConnectionType connectionType() {
        return ConnectionType.POSTGRESQL;
    }

    @Test
    void paginatesOnPostgreSql() throws Exception {
        assertKeysetPaginationWalksEveryRowOnce(dataSource());
    }

    @Test
    void filtersOnPostgreSql() throws Exception {
        assertFiltersNarrowThePage(dataSource());
    }

    @Test
    void countsOnPostgreSql() throws Exception {
        assertCountHonoursTheSameFilters(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        return dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }
}
