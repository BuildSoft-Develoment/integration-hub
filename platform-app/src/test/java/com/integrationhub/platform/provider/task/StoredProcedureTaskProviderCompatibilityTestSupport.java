package com.integrationhub.platform.provider.task;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.service.ConnectionPoolManager;
import com.integrationhub.platform.spi.TaskContext;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

abstract class StoredProcedureTaskProviderCompatibilityTestSupport {

    protected StoredProcedureTaskProvider provider(DataSource dataSource) {
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public DataSource resolveJdbcDataSource(String connectionRef) {
                return dataSource;
            }
        };
        return new StoredProcedureTaskProvider(
                dataSource,
                connectionPoolManager,
                fixedDialectInstance(List.of(new PostgreSqlStoredProcedureDialect(), new GenericStoredProcedureDialect()))
        );
    }

    protected TaskContext taskContext() {
        var execution = new ProcessExecution();
        execution.id = 300L;
        execution.status = ExecutionStatus.RUNNING;
        execution.startedAt = LocalDateTime.now();

        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 400L;
        taskDefinition.taskType = TaskType.DB_EXECUTE_SP;
        taskDefinition.taskOrder = 1;
        taskDefinition.configurationJson = "{}";

        var context = new TaskContext(execution, taskDefinition);
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