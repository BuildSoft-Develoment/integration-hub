package com.integrationhub.vertical.swift.mt101.provider.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guard POR CAMINO de {@code executionMode} en MT101_STATUS.
 *
 * <p>A diferencia de MT101_PAY (que exige {@code once} siempre), STATUS SI soporta {@code per-record}/{@code batch}
 * en su camino principal — {@code mode=query} simple, una consulta HTTP por mensaje, que es su uso normal y por eso
 * su default es {@code per-record}. Solo se restringen los caminos que el motor no sabe acarrear fuera de
 * {@code once}: los que SUSPENDEN ({@code callback}/{@code poll}, donde el flag {@code suspended} se descarta y la
 * tarea cerraria como COMPLETADA sin esperar al banco) y el que CONCILIA ({@code resolveNormalPay}, donde se
 * descarta {@code needsReconciliation}/{@code resolvedReconciliation}).</p>
 *
 * <p>El guard lanza antes de cualquier I/O, asi que este test no necesita contenedores ni WireMock.</p>
 */
class Mt101StatusExecutionModeGuardTest {

    private Mt101StatusTaskProvider provider() {
        // El cast desambigua contra la sobrecarga (ObjectMapper, HttpClient, DataSource, ConnectionPoolManager).
        return new Mt101StatusTaskProvider(new ObjectMapper(), (DataSource) null, null, null);
    }

    private void assertRejects(Map<String, Object> configuration, String expectedPath) {
        var error = assertThrows(IllegalStateException.class,
                () -> provider().execute(new TaskContext(1L, 1L), configuration));
        assertTrue(error.getMessage().contains(expectedPath),
                () -> "deberia nombrar el camino '" + expectedPath + "': " + error.getMessage());
        assertTrue(error.getMessage().contains("executionMode 'once'"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void rejectsCallbackOutsideOnce() {
        // callback SUSPENDE: fuera de 'once' el motor descarta 'suspended' y, como TaskResult.suspended() tiene
        // success=true, la tarea cerraria COMPLETADA y el proceso seguiria sin esperar el callback del banco.
        assertRejects(Map.of("mode", "callback", "executionMode", "per-record"), "mode=callback");
        assertRejects(Map.of("mode", "callback", "executionMode", "batch"), "mode=callback");
    }

    @Test
    void rejectsPollOutsideOnce() {
        assertRejects(Map.of("mode", "poll", "executionMode", "per-record"), "mode=poll");
        assertRejects(Map.of("mode", "poll", "executionMode", "batch"), "mode=poll");
    }

    @Test
    void rejectsResolveNormalPayOutsideOnce() {
        // Camino de conciliacion: se guarda dentro de resolveNormalPay, donde convergen sus DOS entradas.
        assertRejects(Map.of("mode", "query", "resolveNormalPay", true, "executionMode", "per-record"),
                "resolveNormalPay");
        assertRejects(Map.of("mode", "query", "resolveNormalPay", true, "executionMode", "batch"),
                "resolveNormalPay");
    }

    @Test
    void allowsPlainQueryInPerRecord() {
        // REGRESION: el guard NO debe alcanzar al camino principal. 'query' simple en per-record es el uso normal
        // de STATUS (y su default), no suspende ni concilia: debe seguir funcionando.
        var result = provider().execute(new TaskContext(1L, 1L),
                Map.of("mode", "query", "executionMode", "per-record"));
        assertTrue(result.success(), result.details());
    }

    @Test
    void allowsGuardedPathsInOnce() {
        // 'once' explicito y ausente son equivalentes: el guard no dispara en ninguno. Se comprueba con el camino
        // de conciliacion, que falla despues por falta del servicio (no por el guard).
        for (var configuration : java.util.List.of(
                Map.<String, Object>of("mode", "query", "resolveNormalPay", true, "executionMode", "once"),
                Map.<String, Object>of("mode", "query", "resolveNormalPay", true))) {
            var error = assertThrows(IllegalStateException.class,
                    () -> provider().execute(new TaskContext(1L, 1L), configuration));
            assertTrue(error.getMessage().contains("requires the PAY resolution service"),
                    () -> "deberia pasar el guard y fallar por el servicio ausente: " + error.getMessage());
        }
    }
}
