package com.integrationhub.platform.spi.task.support;

import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StoredProcedureRuntimeSupportTest {

    @Test
    void resolvesPostgreSqlMetadataTypeAliases() {
        var runtimeVariables = Map.<String, Object>of(
                "entero", "7",
                "bandera", "true",
                "monto", "10.25",
                "marcaTiempo", "2026-04-16T14:42:36",
                "nombre", "abc"
        );

        var int4 = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_entero", "entero", "INT4", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );
        var bool = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_bandera", "bandera", "BOOL", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );
        var float8 = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_monto", "monto", "FLOAT8", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );
        var timestamptz = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_marca_tiempo", "marcaTiempo", "TIMESTAMPTZ", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );
        var varchar = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_nombre", "nombre", "CHARACTER VARYING", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );

        assertEquals(7, int4.value());
        assertEquals(java.sql.Types.INTEGER, int4.sqlType());
        assertEquals(true, bool.value());
        assertEquals(java.sql.Types.BOOLEAN, bool.sqlType());
        assertEquals(10.25d, (Double) float8.value(), 0.0001d);
        assertEquals(java.sql.Types.DOUBLE, float8.sqlType());
        assertEquals(Timestamp.valueOf("2026-04-16 14:42:36"), timestamptz.value());
        assertEquals(java.sql.Types.TIMESTAMP, timestamptz.sqlType());
        assertEquals("abc", varchar.value());
        assertEquals(java.sql.Types.VARCHAR, varchar.sqlType());
    }

    @Test
    void qualifiedSummaryKeyWinsOverCollidingGlobalKey() {
        // Fan-in: dos tareas publican `total` global; la expresion calificada `task-2.summary.total`
        // debe resolver el valor del productor correcto, no la clave global pisada (P1.a / P2.a).
        var runtimeVariables = Map.<String, Object>of(
                "total", 99,                       // clave global colisionada (putAll)
                "task-1.summary.total", 11,
                "task-2.summary.total", 42         // productor objetivo
        );

        var qualified = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_total", "task-2.summary.total", "INTEGER", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );

        assertEquals(42, qualified.value());
    }

    @Test
    void plainKeyResolvesFromCurrentRecord() {
        // Flujo por registro (records/table/errors): el campo viene del registro actual por clave plana.
        var runtimeVariables = Map.<String, Object>of("id", 7, "cliente", "Ana");

        var resolved = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_id", "id", "INTEGER", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                runtimeVariables
        );

        assertEquals(7, resolved.value());
    }

    @Test
    void parsesDateAliasesIntoSqlDate() {
        var parameter = StoredProcedureRuntimeSupport.resolveParameter(
                new StoredProcedureRuntimeSupport.ProcedureParameter("p_fecha", "fecha", "DATE", StoredProcedureRuntimeSupport.ParameterDirection.IN, true),
                Map.of("fecha", "2026-04-16")
        );

        assertEquals(Date.valueOf("2026-04-16"), parameter.value());
        assertEquals(java.sql.Types.DATE, parameter.sqlType());
    }
}
