package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
class DbWriteUpsertMySqlCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

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
        assertUpsertWritesThenOverwrites(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        var mysql = CompatibilityJdbcContainers.mysql();
        return dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
