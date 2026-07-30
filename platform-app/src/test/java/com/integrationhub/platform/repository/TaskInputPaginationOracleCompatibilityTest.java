package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * Oracle es ademas el caso interesante del cursor: devuelve {@code NUMBER} como {@code BigDecimal}, de
 * modo que el valor que cierra una pagina vuelve como parametro del {@code > ?} de la siguiente con un
 * tipo distinto al que tendria en los otros motores. Recorrer las tres paginas lo comprueba.
 */
@Tag("compat-db")
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
        var dataSource = dataSource(CompatibilityJdbcContainers.oracleJdbcUrl(),
                CompatibilityJdbcContainers.USERNAME, CompatibilityJdbcContainers.PASSWORD);
        CompatibilityJdbcContainers.waitUntilOracleServiceIsRegistered(dataSource);

        // Los tres asertos comparten contenedor: levantar Oracle tres veces costaria ~9 minutos.
        assertKeysetPaginationWalksEveryRowOnce(dataSource);
        assertFiltersNarrowThePage(dataSource);
        assertCountHonoursTheSameFilters(dataSource);
    }
}
