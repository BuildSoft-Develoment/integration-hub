package com.integrationhub.platform.provider.task.dbfunction;

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
class DatabaseFunctionTaskProviderOracleCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Test
    void executesScalarFunctionOnOracleUsingDynamicAlias() throws Exception {
        var dataSource = dataSource();
        CompatibilityJdbcContainers.waitUntilOracleServiceIsRegistered(dataSource);
        prepareOracle(dataSource);
        var provider = provider(dataSource);

        var result = provider.execute(taskContext(), Map.of(
                "functionName", "FN_COLLECT_RESULT",
                "resultAlias", "resultado_fn",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado_fn"));
    }

    private void prepareOracle(javax.sql.DataSource dataSource) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            try {
                statement.execute("drop function FN_COLLECT_RESULT");
            } catch (SQLException ignored) {
            }
            statement.execute("create or replace function FN_COLLECT_RESULT(p_idinstancia varchar2) return varchar2 is begin return 'OK-' || p_idinstancia; end;");
        }
    }

    private javax.sql.DataSource dataSource() {
        return dataSource(CompatibilityJdbcContainers.oracleJdbcUrl(),
                CompatibilityJdbcContainers.USERNAME, CompatibilityJdbcContainers.PASSWORD);
    }
}
