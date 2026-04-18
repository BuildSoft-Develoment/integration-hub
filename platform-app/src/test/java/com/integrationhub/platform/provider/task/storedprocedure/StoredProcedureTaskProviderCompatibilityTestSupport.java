package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
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
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

abstract class StoredProcedureTaskProviderCompatibilityTestSupport {

    protected StoredProcedureTaskProvider provider(DataSource dataSource, ConnectionType connectionType) {
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public JdbcConnectionTarget resolveJdbcTarget(String connectionRef) {
                return new JdbcConnectionTarget(dataSource, connectionType);
            }
        };
        return new StoredProcedureTaskProvider(
                connectionPoolManager,
                fixedDialectInstance(List.of(
                        new PostgreSqlStoredProcedureDialect(),
                        new MySqlStoredProcedureDialect(),
                        new OracleStoredProcedureDialect(),
                        new SqlServerStoredProcedureDialect()
                ))
        );
    }

    protected TaskContext taskContext() {
        var context = new TaskContext(300L, 400L);
        context.attributes().put("executionVariables", Map.of("idinstancia", "ABC123"));
        return context;
    }

    protected DataSource dataSource(String jdbcUrl, String username, String password) {
        return new JdbcUrlDataSource(jdbcUrl, username, password);
    }

    protected Instance<StoredProcedureDialect> fixedDialectInstance(List<StoredProcedureDialect> dialects) {
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

    private static final class FixedDialectInstance implements Instance<StoredProcedureDialect> {

        private final List<StoredProcedureDialect> values;

        private FixedDialectInstance(List<StoredProcedureDialect> values) {
            this.values = List.copyOf(values);
        }

        @Override
        public Iterator<StoredProcedureDialect> iterator() {
            return values.iterator();
        }

        @Override
        public Stream<StoredProcedureDialect> stream() {
            return values.stream();
        }

        @Override
        public StoredProcedureDialect get() {
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
        public void destroy(StoredProcedureDialect instance) {
        }

        @Override
        public Instance<StoredProcedureDialect> select(Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends StoredProcedureDialect> Instance<U> select(Class<U> subtype, Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends StoredProcedureDialect> Instance<U> select(TypeLiteral<U> subtype, Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Handle<StoredProcedureDialect> getHandle() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterable<? extends Handle<StoredProcedureDialect>> handles() {
            throw new UnsupportedOperationException();
        }
    }
}
