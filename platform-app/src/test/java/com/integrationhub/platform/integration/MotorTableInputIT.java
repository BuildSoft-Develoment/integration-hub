package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.execution.TaskInputResolver;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * IT del motor de I/O tipado (TaskInputResolver) sobre lectura por tabla contra Postgres real
 * (Testcontainers). Cubre escenarios sensibles de los hallazgos spec 003: paginacion keyset estable
 * (P1.4), orderBy obligatorio (P1.4) y routing de conexion del productor (P1.3). Ver ADR-004/ADR-006.
 *
 * <p>Construye el resolver directamente (sin arrancar todo Quarkus) para aislar la logica de
 * resolucion/paginacion.</p>
 */
@Testcontainers
class MotorTableInputIT {

    private static final String TABLE = "motor_keyset_test";
    private static final int ROWS = 25;

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    private static DataSource dataSource;
    private static TaskInputResolver resolver;

    @BeforeAll
    static void init() {
        var ds = new PGSimpleDataSource();
        ds.setUrl(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        dataSource = ds;
        // ConnectionPoolManager solo se usa para connectionRef no-default; estas pruebas usan la default.
        resolver = new TaskInputResolver(dataSource, null);
    }

    @BeforeEach
    void seedTable() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE IF NOT EXISTS " + TABLE + " (id integer primary key, payload varchar(50))");
            statement.execute("TRUNCATE TABLE " + TABLE);
            var order = new ArrayList<Integer>();
            for (int i = 1; i <= ROWS; i++) {
                order.add(i);
            }
            // Insertados desordenados a proposito: el ORDER BY keyset debe reordenarlos.
            Collections.shuffle(order, new Random(7));
            for (int id : order) {
                statement.execute("INSERT INTO " + TABLE + " (id, payload) VALUES (" + id + ", 'row-" + id + "')");
            }
        }
    }

    private Map<String, Object> tableConfig(int batchSize, String orderBy) {
        return Map.of(
                "executionMode", "batch",
                "input", Map.of(
                        "source", "task-output",
                        "sourceTaskRef", "task-1",
                        "sourceOutput", "table",
                        "batchSize", batchSize,
                        "cursor", orderBy == null ? Map.of() : Map.of("orderBy", orderBy)));
    }

    private List<Integer> collectIds(TaskInputResolver.ResolvedInput resolved, String mode, AtomicInteger batches) {
        var ids = new ArrayList<Integer>();
        resolver.executeByMode(resolved, mode, 0, slice -> {
            batches.incrementAndGet();
            for (ReadRecord record : slice.records()) {
                ids.add(((Number) record.values().get("id")).intValue());
            }
            return TaskResult.success("ok");
        });
        return ids;
    }

    @Test
    void keysetBatchReadsEveryRowOnceInOrder() {
        var resolved = resolver.resolve(tableConfig(10, "id"), Map.of("task-1.table", TABLE));
        var batches = new AtomicInteger();
        var ids = collectIds(resolved, "batch", batches);

        var expected = new ArrayList<Integer>();
        for (int i = 1; i <= ROWS; i++) {
            expected.add(i);
        }
        assertEquals(expected, ids, "keyset debe leer todas las filas, una vez, en orden ascendente");
        assertEquals(3, batches.get(), "25 filas con batchSize 10 => 3 lotes (10+10+5)");
    }

    @Test
    void perRecordReadsEveryRowOnce() {
        var resolved = resolver.resolve(tableConfig(10, "id"), Map.of("task-1.table", TABLE));
        var batches = new AtomicInteger();
        var ids = collectIds(resolved, "per-record", batches);

        assertEquals(ROWS, ids.size());
        assertEquals(ROWS, ids.stream().distinct().count(), "sin duplicados");
        assertEquals(ROWS, batches.get(), "per-record => un lote por fila");
    }

    @Test
    void tableBatchRequiresOrderBy() {
        var resolved = resolver.resolve(tableConfig(10, null), Map.of("task-1.table", TABLE));
        assertThrows(IllegalArgumentException.class,
                () -> resolver.executeByMode(resolved, "batch", 0, slice -> TaskResult.success("ok")),
                "sin cursor.orderBy la lectura por lotes debe fallar (keyset estable)");
    }

    @Test
    void tableConnectionPrefersProducerThenInput() {
        // P1.3: sin connectionRef en el input se usa la del productor (<ref>.table.connectionRef).
        var producerResolved = resolver.resolve(
                tableConfig(10, "id"),
                Map.of("task-1.table", TABLE, "task-1.table.connectionRef", "conn-productor"));
        assertEquals("conn-productor", producerResolved.tableInput().connectionRef());

        // Si el input declara su propia connectionRef, esa gana.
        var input = new HashMap<String, Object>();
        input.put("source", "task-output");
        input.put("sourceTaskRef", "task-1");
        input.put("sourceOutput", "table");
        input.put("connectionRef", "conn-input");
        input.put("cursor", Map.of("orderBy", "id"));
        var overridden = resolver.resolve(
                Map.of("executionMode", "batch", "input", input),
                Map.of("task-1.table", TABLE, "task-1.table.connectionRef", "conn-productor"));
        assertEquals("conn-input", overridden.tableInput().connectionRef());
    }
}
