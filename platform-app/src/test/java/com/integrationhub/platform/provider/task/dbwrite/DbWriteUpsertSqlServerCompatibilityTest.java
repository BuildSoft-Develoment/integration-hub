package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class DbWriteUpsertSqlServerCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Container
    static final MSSQLServerContainer<?> SQLSERVER =
            new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
                    .acceptLicense()
                    // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
                    .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id int primary key, name varchar(50), amount int)";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new SqlServerDbWriteUpsertDialect();
    }

    /**
     * Es tambien la evidencia del punto y coma final: SQL Server rechaza un {@code MERGE} sin el, y es
     * el tipo de detalle que un test que solo compare cadenas nunca detectaria.
     */
    @Test
    void upsertsOnSqlServer() throws Exception {
        assertUpsertWritesThenOverwrites(
                dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword()));
    }
}
