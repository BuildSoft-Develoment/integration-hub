package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import jakarta.enterprise.util.TypeLiteral;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.annotation.Annotation;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Stream;

abstract class DatabaseFunctionTaskProviderCompatibilityTestSupport {

    protected DatabaseFunctionTaskProvider provider(DataSource dataSource) {
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public DataSource resolveJdbcDataSource(String connectionRef) {
                return dataSource;
            }
        };
        return new DatabaseFunctionTaskProvider(
                dataSource,
                connectionPoolManager,
                fixedDialectInstance(List.of(
                        new PostgreSqlDatabaseFunctionDialect(),
                        new MySqlDatabaseFunctionDialect(),
                        new SqlServerDatabaseFunctionDialect(),
                        new OracleDatabaseFunctionDialect()
                ))
        );
    }

    protected TaskContext taskContext() {
        var context = new TaskContext(301L, 401L);
        context.attributes().put("executionVariables", Map.of("idinstancia", "ABC123", "empresa", "C910"));
        return context;
    }

    protected DataSource dataSource(String jdbcUrl, String username, String password) {
        return new JdbcUrlDataSource(jdbcUrl, username, password);
    }

    protected Instance<DatabaseFunctionDialect> fixedDialectInstance(List<DatabaseFunctionDialect> dialects) {
        return new FixedDialectInstance(dialects);
    }

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
        }

        @Override
        public void setLoginTimeout(int seconds) {
        }

        @Override
        public int getLoginTimeout() {
            return 0;
        }

        @Override
        public Logger getParentLogger() throws SQLFeatureNotSupportedException {
            throw new SQLFeatureNotSupportedException();
        }

        @Override
        public <T> T unwrap(Class<T> iface) throws SQLException {
            throw new SQLException("Not a wrapper");
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) {
            return false;
        }
    }

    private static final class FixedDialectInstance implements Instance<DatabaseFunctionDialect> {

        private final List<DatabaseFunctionDialect> values;

        private FixedDialectInstance(List<DatabaseFunctionDialect> values) {
            this.values = List.copyOf(values);
        }

        @Override
        public Iterator<DatabaseFunctionDialect> iterator() {
            return values.iterator();
        }

        @Override
        public Stream<DatabaseFunctionDialect> stream() {
            return values.stream();
        }

        @Override
        public DatabaseFunctionDialect get() {
            return values.stream().findFirst().orElseThrow();
        }

        @Override
        public boolean isUnsatisfied() {
            return values.isEmpty();
        }

        @Override
        public boolean isAmbiguous() {
            return false;
        }

        @Override
        public void destroy(DatabaseFunctionDialect instance) {
        }

        @Override
        public Instance<DatabaseFunctionDialect> select(Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends DatabaseFunctionDialect> Instance<U> select(Class<U> subtype, Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends DatabaseFunctionDialect> Instance<U> select(TypeLiteral<U> subtype, Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Handle<DatabaseFunctionDialect> getHandle() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterable<? extends Handle<DatabaseFunctionDialect>> handles() {
            throw new UnsupportedOperationException();
        }
    }
}
