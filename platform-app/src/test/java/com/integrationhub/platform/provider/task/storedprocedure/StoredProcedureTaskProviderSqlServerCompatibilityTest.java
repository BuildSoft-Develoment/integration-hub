package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
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
class StoredProcedureTaskProviderSqlServerCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Test
    void executesProcedureWithOutputsOnSqlServer() throws Exception {
        prepareSqlServer();
        var provider = provider(dataSource(), ConnectionType.SQLSERVER);

        var result = provider.execute(taskContext(), Map.of(
                "connectionRef", "sqlserver-test",
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
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("if object_id('dbo.sp_collect_result', 'P') is not null drop procedure dbo.sp_collect_result");
            statement.execute("create procedure dbo.sp_collect_result @p_idinstancia varchar(50), @resultado varchar(100) output, @filas_actualizadas int output as begin set nocount on; set @resultado = 'OK-' + @p_idinstancia; set @filas_actualizadas = 7; end");
        }
    }

    private javax.sql.DataSource dataSource() {
        var sqlServer = CompatibilityJdbcContainers.sqlServer();
        return dataSource(sqlServer.getJdbcUrl(), sqlServer.getUsername(), sqlServer.getPassword());
    }
}
