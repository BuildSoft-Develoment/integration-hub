package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class DbWriteUpsertMySqlCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            // Politica unica de la suite multi-BD: ver CompatibilityContainerTimeouts.
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id integer primary key, name varchar(50), amount integer)";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new MySqlDbWriteUpsertDialect();
    }

    /**
     * Ademas del upsert, este test es la evidencia de que {@code values(columna)} sigue operativo en
     * MySQL 8.4: esta marcado obsoleto desde 8.0.20 y se eligio frente a la forma con alias de fila
     * precisamente por cubrir mas versiones del motor del cliente. Si una version futura lo retirase,
     * es aqui donde se vera.
     */
    @Test
    void upsertsOnMySql() throws Exception {
        assertUpsertWritesThenOverwrites(
                dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()));
    }
}
