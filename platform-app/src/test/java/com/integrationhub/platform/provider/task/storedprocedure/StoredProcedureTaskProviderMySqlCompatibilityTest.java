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
class StoredProcedureTaskProviderMySqlCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Test
    void executesProcedureWithOutputsOnMySql() throws Exception {
        prepareMySql();
        var provider = provider(dataSource(), ConnectionType.MYSQL);

        var result = provider.execute(taskContext(), Map.of(
                "connectionRef", "mysql-test",
                "procedureName", "sp_collect_result",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR", "direction", "IN"),
                        Map.of("name", "resultado", "jdbcType", "VARCHAR", "direction", "OUT"),
                        Map.of("name", "filas_actualizadas", "jdbcType", "INTEGER", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    private void prepareMySql() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("drop procedure if exists sp_collect_result");
            statement.execute("create procedure sp_collect_result(in p_idinstancia varchar(50), out resultado varchar(100), out filas_actualizadas integer) begin set resultado = concat('OK-', p_idinstancia); set filas_actualizadas = 7; end");
        }
    }

    private javax.sql.DataSource dataSource() {
        var mysql = CompatibilityJdbcContainers.mysql();
        return dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
