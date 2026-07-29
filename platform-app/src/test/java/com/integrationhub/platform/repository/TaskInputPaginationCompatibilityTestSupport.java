package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.service.execution.TaskInputResolver;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-022: prueba que la lectura paginada por keyset de {@link TaskInputRepository} funciona en cada
 * motor. La usan FILE_WRITE en modo tabla y el scatter por streaming (BUILD_FROM_TABLE).
 *
 * <p>El sufijo de limite es lo unico que cambia por motor —{@code limit ?} en PostgreSQL y MySQL,
 * {@code fetch first ? rows only} en Oracle, {@code offset 0 rows fetch next ? rows only} en SQL
 * Server— y hasta ahora no habia ninguna prueba que lo ejecutara: la unica cobertura comparaba
 * cadenas. Es la misma forma de hueco que dejo vivir el defecto del upsert.
 *
 * <p>Recorre las paginas de verdad en vez de pedir solo la primera, porque asi se ejercita tambien el
 * viaje de ida y vuelta del cursor por JDBC — Oracle devuelve {@code NUMBER} como {@code BigDecimal},
 * y ese valor vuelve como parametro del {@code > ?} de la pagina siguiente.
 */
abstract class TaskInputPaginationCompatibilityTestSupport {

    protected static final String TABLE = "task_input_source";
    private static final int TOTAL_ROWS = 5;

    private final TaskInputRepository repository = new TaskInputRepository();

    /** DDL de la tabla origen: los tipos cambian por motor, la forma no (id PK, name, tenant). */
    protected abstract String createTableStatement();

    protected abstract ConnectionType connectionType();

    protected void assertKeysetPaginationWalksEveryRowOnce(DataSource dataSource) throws Exception {
        seed(dataSource);

        var seenIds = new ArrayList<Long>();
        Object cursor = null;
        var pages = 0;
        while (true) {
            var page = repository.readBatch(dataSource, connectionType(), TABLE, "id", Map.of(), cursor, 2);
            if (page.isEmpty()) {
                break;
            }
            pages++;
            assertTrue(pages <= TOTAL_ROWS + 1, "la paginacion no termino: posible cursor que no avanza");
            page.forEach(record -> seenIds.add(idOf(record)));
            cursor = TaskInputResolver.cursorValue(page, "id");
        }

        // Cada fila exactamente una vez y en orden: si el sufijo de limite no fuese el del motor, o el
        // cursor no viajara bien, aqui saldrian filas repetidas, ausentes o desordenadas.
        assertEquals(List.of(1L, 2L, 3L, 4L, 5L), seenIds);
        assertEquals(3, pages, "5 filas en paginas de 2 son 3 paginas");
    }

    protected void assertFiltersNarrowThePage(DataSource dataSource) throws Exception {
        seed(dataSource);

        var page = repository.readBatch(dataSource, connectionType(), TABLE, "id",
                Map.of("tenant", "B"), null, 10);

        assertEquals(List.of(2L, 4L), page.stream().map(this::idOf).toList());
    }

    protected void assertCountHonoursTheSameFilters(DataSource dataSource) throws Exception {
        seed(dataSource);

        assertEquals(TOTAL_ROWS, repository.count(dataSource, TABLE, Map.of()));
        assertEquals(2, repository.count(dataSource, TABLE, Map.of("tenant", "B")));
    }

    /**
     * Lee la columna con el nombre <b>en minusculas</b> a proposito, usando el accesor de produccion.
     *
     * <p>Contra Oracle la etiqueta que devuelve el driver es {@code ID}, asi que pedirla como {@code id}
     * es exactamente el caso que rompia: una configuracion redactada contra PostgreSQL y reapuntada a
     * Oracle. Si {@link com.integrationhub.platform.spi.reader.ReadRecord#value(String)} dejara de ser
     * tolerante al caso, este test se pondria rojo en Oracle y verde en los demas motores.
     */
    private long idOf(com.integrationhub.platform.spi.reader.ReadRecord record) {
        var raw = record.value("id");
        if (raw == null) {
            throw new AssertionError("el record no trae columna id: " + record.values().keySet());
        }
        return ((Number) raw).longValue();
    }

    private void seed(DataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            try {
                statement.executeUpdate("drop table " + TABLE);
            } catch (SQLException ignored) {
                // La tabla no existia: estado esperado en la primera ejecucion.
            }
            statement.executeUpdate(createTableStatement());
            for (var id = 1; id <= TOTAL_ROWS; id++) {
                // tenant alterna A/B para que el filtro deje 2 filas no contiguas (ids 2 y 4).
                statement.executeUpdate("insert into " + TABLE + " (id, name, tenant) values ("
                        + id + ", 'fila-" + id + "', '" + (id % 2 == 0 ? "B" : "A") + "')");
            }
        }
    }

    protected DataSource dataSource(String jdbcUrl, String username, String password) {
        return new JdbcUrlDataSource(jdbcUrl, username, password);
    }

    /** DataSource minimo sobre DriverManager: la suite no necesita pool. */
    protected record JdbcUrlDataSource(String jdbcUrl, String username, String password) implements DataSource {
        @Override
        public Connection getConnection() throws SQLException {
            return DriverManager.getConnection(jdbcUrl, username, password);
        }

        @Override
        public Connection getConnection(String user, String pass) throws SQLException {
            return DriverManager.getConnection(jdbcUrl, user, pass);
        }

        @Override
        public PrintWriter getLogWriter() {
            return null;
        }

        @Override
        public void setLogWriter(PrintWriter out) {
            // sin uso en pruebas
        }

        @Override
        public void setLoginTimeout(int seconds) {
            // sin uso en pruebas
        }

        @Override
        public int getLoginTimeout() {
            return 0;
        }

        @Override
        public Logger getParentLogger() {
            return Logger.getGlobal();
        }

        @Override
        public <T> T unwrap(Class<T> iface) {
            throw new UnsupportedOperationException("unwrap no soportado en pruebas");
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) {
            return false;
        }
    }
}
