package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("compat-db")
class DatabaseFunctionTaskProviderSqlServerCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Test
    void executesTableValuedFunctionOnSqlServer() throws Exception {
        prepareSqlServer();
        var provider = provider(dataSource());

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
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("if object_id('dbo.fn_collect_result') is not null drop function dbo.fn_collect_result");
            statement.executeUpdate("create function dbo.fn_collect_result (@p_idinstancia nvarchar(50)) returns table as return select cast('OK-' + @p_idinstancia as nvarchar(100)) as resultado, cast(7 as int) as filas_actualizadas");
        }
    }

    private javax.sql.DataSource dataSource() {
        var sqlServer = CompatibilityJdbcContainers.sqlServer();
        return dataSource(sqlServer.getJdbcUrl(), sqlServer.getUsername(), sqlServer.getPassword());
    }
}
