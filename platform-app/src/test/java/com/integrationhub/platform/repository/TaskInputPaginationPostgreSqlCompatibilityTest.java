package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
class TaskInputPaginationPostgreSqlCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

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
        var postgres = CompatibilityJdbcContainers.postgres();
        return dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }
}
