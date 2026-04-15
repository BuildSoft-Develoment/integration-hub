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
class StoredProcedureTaskProviderSqlServerCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Container
    static final MSSQLServerContainer<?> SQLSERVER = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
            .acceptLicense();

    @Test
    void executesProcedureWithOutputsOnSqlServer() throws Exception {
        prepareSqlServer();
        var provider = provider(dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword()));

        var result = provider.execute(taskContext(), Map.of(
                "procedureName", "dbo.sp_collect_result",
                "parameters", List.of(
                        Map.of("name", "@p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR", "direction", "IN"),
                        Map.of("name", "@resultado", "jdbcType", "VARCHAR", "direction", "OUT"),
                        Map.of("name", "@filas_actualizadas", "jdbcType", "INTEGER", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    private void prepareSqlServer() throws Exception {
        try (Connection connection = dataSource(SQLSERVER.getJdbcUrl(), SQLSERVER.getUsername(), SQLSERVER.getPassword()).getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("if object_id('dbo.sp_collect_result', 'P') is not null drop procedure dbo.sp_collect_result");
            statement.execute("create procedure dbo.sp_collect_result @p_idinstancia varchar(50), @resultado varchar(100) output, @filas_actualizadas int output as begin set nocount on; set @resultado = 'OK-' + @p_idinstancia; set @filas_actualizadas = 7; end");
        }
    }
}