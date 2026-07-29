package com.integrationhub.platform.provider.task.dbwrite;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;

class DbWriteUpsertOracleCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id number(10) primary key, name varchar2(50), amount number(10))";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new OracleDbWriteUpsertDialect();
    }

    /**
     * Es tambien la evidencia de que Oracle acepta parametros sin tipar dentro del
     * {@code select ... from dual} que alimenta el MERGE — el punto del diseno sobre el que habia mas
     * duda, porque el motor a veces exige un cast para deducir el tipo de un {@code ?} en la lista de
     * seleccion.
     */
    @Test
    void upsertsOnOracle() throws Exception {
        try (GenericContainer<?> oracle = new GenericContainer<>("gvenzl/oracle-free:23-slim-faststart")
                .withEnv("ORACLE_PASSWORD", "test")
                .withEnv("APP_USER", "test")
                .withEnv("APP_USER_PASSWORD", "test")
                .withExposedPorts(1521)
                .waitingFor(Wait.forListeningPort().withStartupTimeout(Duration.ofMinutes(8)))) {
            oracle.start();
            var dataSource = dataSource(jdbcUrl(oracle), "test", "test");
            waitUntilServiceIsRegistered(dataSource);

            assertUpsertWritesThenOverwrites(dataSource);
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
