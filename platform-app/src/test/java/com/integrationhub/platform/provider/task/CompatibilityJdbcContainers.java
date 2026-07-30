package com.integrationhub.platform.provider.task;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;

/**
 * Contenedores compartidos por la suite de compatibilidad multi-BD.
 *
 * <p>Estas pruebas recrean sus tablas, funciones y procedimientos antes de cada asercion. Por eso es
 * seguro reutilizar el proceso del motor dentro del mismo fork de Maven y evitar que el reactor
 * arranque PostgreSQL, MySQL, SQL Server y Oracle una vez por clase.</p>
 */
public final class CompatibilityJdbcContainers {

    public static final String USERNAME = "test";
    public static final String PASSWORD = "test";

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("integration_hub_compat")
            .withUsername(USERNAME)
            .withPassword(PASSWORD)
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("integration_hub_compat")
            .withUsername(USERNAME)
            .withPassword(PASSWORD)
            .withCommand("--log-bin-trust-function-creators=1")
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    private static final MSSQLServerContainer<?> SQLSERVER =
            new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
                    .acceptLicense()
                    .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    private static final GenericContainer<?> ORACLE = new GenericContainer<>("gvenzl/oracle-free:23-slim-faststart")
            .withEnv("ORACLE_PASSWORD", PASSWORD)
            .withEnv("APP_USER", USERNAME)
            .withEnv("APP_USER_PASSWORD", PASSWORD)
            .withExposedPorts(1521)
            .waitingFor(Wait.forListeningPort()
                    .withStartupTimeout(Duration.ofSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS)));

    private static boolean oracleServiceReady;

    private CompatibilityJdbcContainers() {
    }

    public static PostgreSQLContainer<?> postgres() {
        return start(POSTGRES);
    }

    public static MySQLContainer<?> mysql() {
        return start(MYSQL);
    }

    public static MSSQLServerContainer<?> sqlServer() {
        return start(SQLSERVER);
    }

    public static GenericContainer<?> oracle() {
        return start(ORACLE);
    }

    public static String oracleJdbcUrl() {
        var oracle = oracle();
        return "jdbc:oracle:thin:@localhost:" + oracle.getMappedPort(1521) + "/FREEPDB1";
    }

    public static void waitUntilOracleServiceIsRegistered(DataSource dataSource) throws Exception {
        synchronized (CompatibilityJdbcContainers.class) {
            if (oracleServiceReady) {
                return;
            }

            SQLException lastError = null;
            var deadline = System.nanoTime() + Duration.ofMinutes(5).toNanos();
            while (System.nanoTime() < deadline) {
                try (Connection ignored = dataSource.getConnection()) {
                    oracleServiceReady = true;
                    return;
                } catch (SQLException error) {
                    lastError = error;
                    Thread.sleep(5000);
                }
            }
            throw lastError == null ? new SQLException("Oracle no quedo disponible a tiempo") : lastError;
        }
    }

    private static synchronized <T extends GenericContainer<?>> T start(T container) {
        if (!container.isRunning()) {
            container.start();
            if (container == ORACLE) {
                oracleServiceReady = false;
            }
        }
        return container;
    }
}
