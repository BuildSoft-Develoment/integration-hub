package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
class DbWriteUpsertPostgreSqlCompatibilityTest extends DbWriteUpsertCompatibilityTestSupport {

    @Override
    protected String createTableStatement() {
        return "create table " + TABLE + " (id integer primary key, name varchar(50), amount integer)";
    }

    @Override
    protected DbWriteUpsertDialect dialect() {
        return new PostgreSqlDbWriteUpsertDialect();
    }

    @Test
    void upsertsOnPostgreSql() throws Exception {
        assertUpsertWritesThenOverwrites(dataSource());
    }

    private javax.sql.DataSource dataSource() {
        var postgres = CompatibilityJdbcContainers.postgres();
        return dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }
}
