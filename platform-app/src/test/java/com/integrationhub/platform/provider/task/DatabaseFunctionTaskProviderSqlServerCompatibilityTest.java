package com.integrationhub.platform.provider.task;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class DatabaseFunctionTaskProviderSqlServerCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Container
    static final MSSQLServerContainer<?> SQLSERVER = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
            .acceptLicense();

    @Test
    void executesTableValuedFunctionOnSqlServer() throws Exception {
        prepareSqlServer();
        var provider = provider(dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword()));

        var result = provider.execute(taskContext(), Map.of(
                "functionName", "dbo.fn_collect_result",
                "parameters", List.of(
                        Map.of("name", "@p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    private void prepareSqlServer() throws Exception {
        try (Connection connection = dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword()).getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("if object_id('dbo.fn_collect_result') is not null drop function dbo.fn_collect_result");
            statement.executeUpdate("create function dbo.fn_collect_result (@p_idinstancia nvarchar(50)) returns table as return select cast('OK-' + @p_idinstancia as nvarchar(100)) as resultado, cast(7 as int) as filas_actualizadas");
        }
    }
}