package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("compat-db")
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
     * {@code select ... from dual} que alimenta el MERGE: el punto del diseno sobre el que habia mas
     * duda, porque el motor a veces exige un cast para deducir el tipo de un {@code ?} en la lista de
     * seleccion.
     */
    @Test
    void upsertsOnOracle() throws Exception {
        var dataSource = dataSource(CompatibilityJdbcContainers.oracleJdbcUrl(),
                CompatibilityJdbcContainers.USERNAME, CompatibilityJdbcContainers.PASSWORD);
        CompatibilityJdbcContainers.waitUntilOracleServiceIsRegistered(dataSource);

        assertUpsertWritesThenOverwrites(dataSource);
    }
}
