package com.integrationhub.platform.provider.task.dbfunction;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class DatabaseFunctionTaskProviderMySqlCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("integration_hub_mysql_fn")
            .withUsername("mysql")
            .withPassword("mysql")
            .withCommand("--log-bin-trust-function-creators=1");

    @Test
    void executesScalarFunctionOnMySqlUsingDynamicAlias() throws Exception {
        prepareMySql();
        var provider = provider(dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()));

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
        try (Connection connection = dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()).getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop function if exists fn_collect_result");
            statement.executeUpdate("create function fn_collect_result(p_idinstancia varchar(50)) returns varchar(100) deterministic return concat('OK-', p_idinstancia)");
        }
    }
}
