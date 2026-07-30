package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("compat-db")
class StoredProcedureTaskProviderOracleCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Test
    void executesProcedureWithOutputsOnOracle() throws Exception {
        var dataSource = dataSource();
        CompatibilityJdbcContainers.waitUntilOracleServiceIsRegistered(dataSource);
        prepareOracle(dataSource);
        var provider = provider(dataSource, ConnectionType.ORACLE);

        var result = provider.execute(taskContext(), Map.of(
                "connectionRef", "oracle-test",
                "procedureName", "sp_collect_result",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR", "direction", "IN"),
                        Map.of("name", "resultado", "jdbcType", "VARCHAR", "direction", "OUT"),
                        Map.of("name", "filas_actualizadas", "jdbcType", "NUMERIC", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    private void prepareOracle(javax.sql.DataSource dataSource) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            try {
                statement.execute("drop procedure sp_collect_result");
            } catch (SQLException ignored) {
            }
            statement.execute("create or replace procedure sp_collect_result(p_idinstancia in varchar2, resultado out varchar2, filas_actualizadas out number) as begin resultado := 'OK-' || p_idinstancia; filas_actualizadas := 7; end;");
        }
    }

    private javax.sql.DataSource dataSource() {
        return dataSource(CompatibilityJdbcContainers.oracleJdbcUrl(),
                CompatibilityJdbcContainers.USERNAME, CompatibilityJdbcContainers.PASSWORD);
    }
}
