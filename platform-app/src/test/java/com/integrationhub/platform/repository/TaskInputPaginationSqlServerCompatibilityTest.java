package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * SQL Server es el motor mas exigente de los cuatro: rechaza {@code FETCH FIRST ... ROWS ONLY} suelto
 * y exige {@code OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY}, que a su vez solo es valido si la consulta
 * lleva {@code ORDER BY}. Este test es la evidencia de que el SQL generado cumple ambas cosas.
 */
@Testcontainers
class TaskInputPaginationSqlServerCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

    @Container
    static final MSSQLServerContainer<?> SQLSERVER =
            new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
                    .acceptLicense()
                    // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
                    .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

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
        return dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword());
    }
}
