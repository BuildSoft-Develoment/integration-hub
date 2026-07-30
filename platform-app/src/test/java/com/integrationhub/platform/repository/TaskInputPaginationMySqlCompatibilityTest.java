package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
class TaskInputPaginationMySqlCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

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
        var mysql = CompatibilityJdbcContainers.mysql();
        return dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
