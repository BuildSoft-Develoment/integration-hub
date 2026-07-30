package com.integrationhub.platform.provider.task.dbfunction;

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
class DatabaseFunctionTaskProviderPostgreSqlCompatibilityTest extends DatabaseFunctionTaskProviderCompatibilityTestSupport {

    @Test
    void executesFunctionAndPublishesFirstRowAsOutputs() throws Exception {
        preparePostgreSql();
        var provider = provider(dataSource());

        var result = provider.execute(taskContext(), Map.of(
                "functionName", "public.fn_collect_result",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    @Test
    void executesFunctionUsingTaskOutputsAsInputs() throws Exception {
        preparePostgreSql();
        var provider = provider(dataSource());
        var context = taskContext();
        context.attributes().put("taskOutputs", Map.of("resultado_previo", "SP_OK"));

        var result = provider.execute(context, Map.of(
                "functionName", "public.fn_collect_task_output",
                "parameters", List.of(
                        Map.of("name", "p_resultado_previo", "value", "resultado_previo", "jdbcType", "VARCHAR"),
                        Map.of("name", "p_ejecucion", "value", "_processExecutionId", "jdbcType", "BIGINT")
                )
        ));

        assertTrue(result.success());
        assertEquals("SP_OK", result.outputs().get("resultado_previo"));
        assertEquals(301L, ((Number) result.outputs().get("ejecucion_recibida")).longValue());
    }

    private void preparePostgreSql() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop function if exists public.fn_collect_result(varchar)");
            statement.executeUpdate("drop function if exists public.fn_collect_task_output(varchar, bigint)");
            statement.executeUpdate("create or replace function public.fn_collect_result(p_idinstancia varchar) returns table(resultado varchar, filas_actualizadas integer) language plpgsql as $$ begin return query select cast('OK-' || p_idinstancia as varchar), 7; end; $$");
            statement.executeUpdate("create or replace function public.fn_collect_task_output(p_resultado_previo varchar, p_ejecucion bigint) returns table(resultado_previo varchar, ejecucion_recibida bigint) language plpgsql as $$ begin return query select p_resultado_previo, p_ejecucion; end; $$");
        }
    }

    private javax.sql.DataSource dataSource() {
        var postgres = CompatibilityJdbcContainers.postgres();
        return dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }
}
