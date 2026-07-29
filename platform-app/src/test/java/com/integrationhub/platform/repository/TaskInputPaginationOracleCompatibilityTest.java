package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;

/**
 * Oracle es ademas el caso interesante del cursor: devuelve {@code NUMBER} como {@code BigDecimal}, de
 * modo que el valor que cierra una pagina vuelve como parametro del {@code > ?} de la siguiente con un
 * tipo distinto al que tendria en los otros motores. Recorrer las tres paginas lo comprueba.
 */
class TaskInputPaginationOracleCompatibilityTest extends TaskInputPaginationCompatibilityTestSupport {

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id number(10) primary key, name varchar2(50), tenant varchar2(5))";
    }

    @Override
    protected ConnectionType connectionType() {
        return ConnectionType.ORACLE;
    }

    @Test
    void paginatesFiltersAndCountsOnOracle() throws Exception {
        try (GenericContainer<?> oracle = new GenericContainer<>("gvenzl/oracle-free:23-slim-faststart")
                .withEnv("ORACLE_PASSWORD", "test")
                .withEnv("APP_USER", "test")
                .withEnv("APP_USER_PASSWORD", "test")
                .withExposedPorts(1521)
                .waitingFor(Wait.forListeningPort().withStartupTimeout(Duration.ofMinutes(8)))) {
            oracle.start();
            var dataSource = dataSource(jdbcUrl(oracle), "test", "test");
            waitUntilServiceIsRegistered(dataSource);

            // Los tres asertos comparten contenedor: levantar Oracle tres veces costaria ~9 minutos.
            assertKeysetPaginationWalksEveryRowOnce(dataSource);
            assertFiltersNarrowThePage(dataSource);
            assertCountHonoursTheSameFilters(dataSource);
        }
    }

    /**
     * El listener de Oracle acepta conexiones antes de que el servicio de la PDB este registrado, y en
     * esa ventana responde ORA-12514. Se reintenta igual que en las demas pruebas de compatibilidad.
     */
    private void waitUntilServiceIsRegistered(DataSource dataSource) throws Exception {
        SQLException lastError = null;
        var deadline = System.nanoTime() + Duration.ofMinutes(5).toNanos();
        while (System.nanoTime() < deadline) {
            try (Connection ignored = dataSource.getConnection()) {
                return;
            } catch (SQLException error) {
                lastError = error;
                Thread.sleep(5000);
            }
        }
        throw lastError == null ? new SQLException("Oracle no quedo disponible a tiempo") : lastError;
    }

    private String jdbcUrl(GenericContainer<?> oracle) {
        return "jdbc:oracle:thin:@localhost:" + oracle.getMappedPort(1521) + "/FREEPDB1";
    }
}
