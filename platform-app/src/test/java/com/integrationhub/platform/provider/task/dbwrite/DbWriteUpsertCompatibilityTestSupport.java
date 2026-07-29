package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.repository.DbWriteRepository;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.support.DbTaskSupport;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * ADR-022: prueba que el upsert de DB_WRITE se ejecuta de verdad en cada motor.
 *
 * <p>Antes de ADR-022 el repositorio emitia siempre {@code on conflict ... excluded.x}, sintaxis solo
 * de PostgreSQL, de modo que contra Oracle, SQL Server y MySQL la tarea fallaba con error de sintaxis.
 * Fijar el texto SQL en un test unitario no basta: cada motor tiene que aceptarlo. Esto lo comprueba
 * insertando una fila y volviendo a escribir la misma clave, que es el caso que distingue un upsert
 * correcto de un insert que revienta por clave duplicada.
 */
abstract class DbWriteUpsertCompatibilityTestSupport {

    protected static final String TABLE = "integration_target";

    private final DbWriteRepository repository = new DbWriteRepository();

    /** DDL de la tabla destino: los tipos cambian por motor, la forma no (id PK, name, amount). */
    protected abstract String createTableStatement();

    protected abstract DbWriteUpsertDialect dialect();

    protected void assertUpsertWritesThenOverwrites(DataSource dataSource) throws Exception {
        recreateTable(dataSource);

        var assignments = List.of(
                DbTaskSupport.ColumnAssignment.field("id", "id"),
                DbTaskSupport.ColumnAssignment.field("name", "name"),
                DbTaskSupport.ColumnAssignment.field("amount", "amount"));
        var keyColumns = List.of("id");

        var inserted = repository.upsertDynamic(dataSource, TABLE,
                List.of(new ReadRecord(Map.of("id", 1, "name", "primera", "amount", 10))),
                assignments, keyColumns, 100, dialect());
        assertEquals(1, inserted, "la primera escritura debe insertar la fila");
        assertRow(dataSource, "primera", 10);

        // Misma clave: aqui es donde un INSERT normal fallaria por clave duplicada.
        var upserted = repository.upsertDynamic(dataSource, TABLE,
                List.of(new ReadRecord(Map.of("id", 1, "name", "segunda", "amount", 20))),
                assignments, keyColumns, 100, dialect());
        assertEquals(1, upserted, "la segunda escritura debe actualizar la fila existente");
        assertRow(dataSource, "segunda", 20);

        assertEquals(1, countRows(dataSource), "el upsert no debe duplicar la fila");
    }

    private void recreateTable(DataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            try {
                statement.executeUpdate("drop table " + TABLE);
            } catch (SQLException ignored) {
                // La tabla no existia: es el estado esperado en la primera ejecucion.
            }
            statement.executeUpdate(createTableStatement());
        }
    }

    private void assertRow(DataSource dataSource, String expectedName, int expectedAmount) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rows = statement.executeQuery("select name, amount from " + TABLE + " where id = 1")) {
            assertEquals(true, rows.next(), "la fila con id=1 debe existir");
            assertEquals(expectedName, rows.getString("name").trim());
            assertEquals(expectedAmount, rows.getInt("amount"));
        }
    }

    private int countRows(DataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rows = statement.executeQuery("select count(*) from " + TABLE)) {
            rows.next();
            return rows.getInt(1);
        }
    }

    protected DataSource dataSource(String jdbcUrl, String username, String password) {
        return new JdbcUrlDataSource(jdbcUrl, username, password);
    }

    /** DataSource minimo sobre DriverManager: la suite no necesita pool para dos sentencias. */
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
