package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
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
class StoredProcedureTaskProviderMySqlCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("integration_hub_mysql")
            .withUsername("test")
            .withPassword("test")
            // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Test
    void executesProcedureWithOutputsOnMySql() throws Exception {
        prepareMySql();
        var provider = provider(dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()), ConnectionType.MYSQL);

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
        try (Connection connection = dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()).getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("drop procedure if exists sp_collect_result");
            statement.execute("create procedure sp_collect_result(in p_idinstancia varchar(50), out resultado varchar(100), out filas_actualizadas integer) begin set resultado = concat('OK-', p_idinstancia); set filas_actualizadas = 7; end");
        }
    }
}
