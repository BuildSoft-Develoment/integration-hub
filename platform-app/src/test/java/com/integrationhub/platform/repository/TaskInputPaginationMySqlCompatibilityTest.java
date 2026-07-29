package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class TaskInputPaginationMySqlCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id integer primary key, name varchar(50), tenant varchar(5))";
    }

    @Override
    protected ConnectionType connectionType() {
        return ConnectionType.MYSQL;
    }

    @Test
    void paginatesOnMySql() throws Exception {
        assertKeysetPaginationWalksEveryRowOnce(dataSource());
    }

    @Test
    void filtersOnMySql() throws Exception {
        assertFiltersNarrowThePage(dataSource());
    }

    @Test
    void countsOnMySql() throws Exception {
        assertCountHonoursTheSameFilters(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        return dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    }
}
