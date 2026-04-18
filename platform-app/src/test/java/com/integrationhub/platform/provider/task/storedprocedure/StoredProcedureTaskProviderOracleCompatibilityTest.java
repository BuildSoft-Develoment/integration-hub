package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
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

class StoredProcedureTaskProviderOracleCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Test
    void executesProcedureWithOutputsOnOracle() throws Exception {
        try (GenericContainer<?> oracle = new GenericContainer<>("gvenzl/oracle-free:23-slim-faststart")
                .withEnv("ORACLE_PASSWORD", "test")
                .withEnv("APP_USER", "test")
                .withEnv("APP_USER_PASSWORD", "test")
                .withExposedPorts(1521)
                .waitingFor(Wait.forListeningPort().withStartupTimeout(Duration.ofMinutes(8)))) {
            oracle.start();
            prepareOracle(oracle);
            var provider = provider(dataSource(oracleJdbcUrl(oracle), "test", "test"), ConnectionType.ORACLE);

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
    }

    private void prepareOracle(GenericContainer<?> oracle) throws Exception {
        try (Connection connection = waitForOracleConnection(oracle);
             Statement statement = connection.createStatement()) {
            try {
                statement.execute("drop procedure sp_collect_result");
            } catch (SQLException ignored) {
            }
            statement.execute("create or replace procedure sp_collect_result(p_idinstancia in varchar2, resultado out varchar2, filas_actualizadas out number) as begin resultado := 'OK-' || p_idinstancia; filas_actualizadas := 7; end;");
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
