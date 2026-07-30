package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * SQL Server es el motor mas exigente de los cuatro: rechaza {@code FETCH FIRST ... ROWS ONLY} suelto
 * y exige {@code OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY}, que a su vez solo es valido si la consulta
 * lleva {@code ORDER BY}. Este test es la evidencia de que el SQL generado cumple ambas cosas.
 */
@Tag("compat-db")
class TaskInputPaginationSqlServerCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id int primary key, name varchar(50), tenant varchar(5))";
    }

    @Override
    protected ConnectionType connectionType() {
        return ConnectionType.SQLSERVER;
    }

    @Test
    void paginatesOnSqlServer() throws Exception {
        assertKeysetPaginationWalksEveryRowOnce(dataSource());
    }

    @Test
    void filtersOnSqlServer() throws Exception {
        assertFiltersNarrowThePage(dataSource());
    }

    @Test
    void countsOnSqlServer() throws Exception {
        assertCountHonoursTheSameFilters(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        var sqlServer = CompatibilityJdbcContainers.sqlServer();
        return dataSource(sqlServer.getJdbcUrl(), sqlServer.getUsername(), sqlServer.getPassword());
    }
}
