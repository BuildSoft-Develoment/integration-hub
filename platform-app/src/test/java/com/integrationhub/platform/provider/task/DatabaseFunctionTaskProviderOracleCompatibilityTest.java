package com.integrationhub.platform.provider.task;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseFunctionTaskProviderOracleCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Test
    void executesScalarFunctionOnOracleUsingDynamicAlias() throws Exception {
        try (GenericContainer<?> oracle = new GenericContainer<>("gvenzl/oracle-free:23-slim-faststart")
                .withEnv("ORACLE_PASSWORD", "test")
                .withEnv("APP_USER", "test")
                .withEnv("APP_USER_PASSWORD", "test")
                .withExposedPorts(1521)
                .waitingFor(Wait.forListeningPort().withStartupTimeout(Duration.ofMinutes(8)))) {
            oracle.start();
            prepareOracle(oracle);
            var provider = provider(dataSource(oracleJdbcUrl(oracle), "test", "test"));

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
    }

    private void prepareOracle(GenericContainer<?> oracle) throws Exception {
        try (Connection connection = waitForOracleConnection(oracle);
             Statement statement = connection.createStatement()) {
            try {
                statement.execute("drop function FN_COLLECT_RESULT");
            } catch (SQLException ignored) {
            }
            statement.execute("create or replace function FN_COLLECT_RESULT(p_idinstancia varchar2) return varchar2 is begin return 'OK-' || p_idinstancia; end;");
        }
    }

    private Connection waitForOracleConnection(GenericContainer<?> oracle) throws Exception {
        SQLException lastError = null;
        var deadline = System.nanoTime() + Duration.ofMinutes(5).toNanos();
        while (System.nanoTime() < deadline) {
            try {
                return dataSource(oracleJdbcUrl(oracle), "test", "test").getConnection();
            } catch (SQLException error) {
                lastError = error;
                Thread.sleep(5000);
            }
        }
        throw lastError == null ? new SQLException("Oracle connection was not ready") : lastError;
    }

    private String oracleJdbcUrl(GenericContainer<?> oracle) {
        return "jdbc:oracle:thin:@localhost:" + oracle.getMappedPort(1521) + "/FREEPDB1";
    }
}