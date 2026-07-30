package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.CompatibilityJdbcContainers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("compat-db")
class StoredProcedureTaskProviderPostgreSqlCompatibilityTest extends StoredProcedureTaskProviderCompatibilityTestSupport {

    @Test
    void executesProcedureWithOutputsOnPostgreSql() throws Exception {
        preparePostgreSql();
        var provider = provider(dataSource(), ConnectionType.POSTGRESQL);

        var result = provider.execute(taskContext(), Map.of(
                "connectionRef", "postgres-test",
                "procedureName", "public.sp_collect_result",
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

    private void preparePostgreSql() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop procedure if exists public.sp_collect_result(varchar, out varchar, out integer)");
            statement.executeUpdate("create or replace procedure public.sp_collect_result(in p_idinstancia varchar, out resultado varchar, out filas_actualizadas integer) language plpgsql as $$ begin resultado := 'OK-' || p_idinstancia; filas_actualizadas := 7; end; $$");
        }
    }

    private javax.sql.DataSource dataSource() {
        var postgres = CompatibilityJdbcContainers.postgres();
        return dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }
}
