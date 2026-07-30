package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
class DbWriteUpsertSqlServerCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id int primary key, name varchar(50), amount int)";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new SqlServerDbWriteUpsertDialect();
    }

    /**
     * Es tambien la evidencia del punto y coma final: SQL Server rechaza un {@code MERGE} sin el, y es
     * el tipo de detalle que un test que solo compare cadenas nunca detectaria.
     */
    @Test
    void upsertsOnSqlServer() throws Exception {
        assertUpsertWritesThenOverwrites(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        var sqlServer = CompatibilityJdbcContainers.sqlServer();
        return dataSource(sqlServer.getJdbcUrl(), sqlServer.getUsername(), sqlServer.getPassword());
    }
}
