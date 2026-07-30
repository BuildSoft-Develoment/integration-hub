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
class DatabaseFunctionTaskProviderMySqlCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Test
    void executesScalarFunctionOnMySqlUsingDynamicAlias() throws Exception {
        prepareMySql();
        var provider = provider(dataSource());

        var result = provider.execute(taskContext(), Map.of(
                "functionName", "fn_collect_result",
                "resultAlias", "resultado_fn",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado_fn"));
    }

    private void prepareMySql() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop function if exists fn_collect_result");
            statement.executeUpdate("create function fn_collect_result(p_idinstancia varchar(50)) returns varchar(100) deterministic return concat('OK-', p_idinstancia)");
        }
    }

    private javax.sql.DataSource dataSource() {
        var mysql = CompatibilityJdbcContainers.mysql();
        return dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
