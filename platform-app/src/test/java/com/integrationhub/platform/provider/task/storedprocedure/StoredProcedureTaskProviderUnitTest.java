package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import jakarta.enterprise.util.TypeLiteral;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.annotation.Annotation;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.logging.Logger;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

class StoredProcedureTaskProviderUnitTest {

    @Test
    void requiresConnectionRefForStoredProcedureExecution() {
        var provider = new StoredProcedureTaskProvider(
                new ConnectionPoolManager(null, null),
                fixedDialectInstance(List.of(new PostgreSqlStoredProcedureDialect()))
        );

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(taskContext(), Map.of(
                "procedureName", "public.p_procesar",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "TEXT", "direction", "IN")
                )
        )));

        assertEquals("Stored procedure tasks require connectionRef", error.getMessage());
    }

    @Test
    void executesPostgreSqlProcedureOutputsViaCallResultSet() {
        var recordedSql = new AtomicReference<String>();
        var bindings = new ArrayList<String>();
        var firstRow = new AtomicBoolean(true);

        DataSource dataSource = new ProxyDataSource(() -> postgresConnection(recordedSql, bindings, firstRow));
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public JdbcConnectionTarget resolveJdbcTarget(String connectionRef) {
                return new JdbcConnectionTarget(dataSource, ConnectionType.POSTGRESQL);
            }
        };
        var provider = new StoredProcedureTaskProvider(
                connectionPoolManager,
                fixedDialectInstance(List.of(
                        new SqlServerStoredProcedureDialect(),
                        new OracleStoredProcedureDialect(),
                        new MySqlStoredProcedureDialect(),
                        new PostgreSqlStoredProcedureDialect()
                ))
        );

        var result = provider.execute(taskContext(), Map.of(
                "connectionRef", "postgres-test",
                "procedureName", "public.p_procesar",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "TEXT", "direction", "IN"),
                        Map.of("name", "resultado", "jdbcType", "TEXT", "direction", "OUT"),
                        Map.of("name", "filas_actualizadas", "jdbcType", "INT4", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
        assertEquals("call public.p_procesar(cast(? as text), cast(? as text), cast(? as integer))", recordedSql.get());
        assertEquals(List.of("setObject:1:ABC123:12", "setNull:2:12", "setNull:3:4"), bindings);
    }

    private static Connection postgresConnection(AtomicReference<String> recordedSql,
                                                 List<String> bindings,
                                                 AtomicBoolean firstRow) {
        var resultSet = (ResultSet) Proxy.newProxyInstance(
                ResultSet.class.getClassLoader(),
                new Class[]{ResultSet.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "next" -> firstRow.getAndSet(false);
                    case "getObject" -> switch ((Integer) args[0]) {
                        case 1 -> "OK-ABC123";
                        case 2 -> 7;
                        default -> null;
                    };
                    case "close" -> null;
                    case "isClosed" -> false;
                    default -> defaultValue(method.getReturnType());
                }
        );

        var statement = (PreparedStatement) Proxy.newProxyInstance(
                PreparedStatement.class.getClassLoader(),
                new Class[]{PreparedStatement.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "setQueryTimeout" -> null;
                    case "setObject" -> {
                        bindings.add("setObject:" + args[0] + ":" + args[1] + ":" + args[2]);
                        yield null;
                    }
                    case "setNull" -> {
                        bindings.add("setNull:" + args[0] + ":" + args[1]);
                        yield null;
                    }
                    case "execute" -> true;
                    case "getResultSet" -> resultSet;
                    case "close" -> null;
                    case "isClosed" -> false;
                    default -> defaultValue(method.getReturnType());
                }
        );

        return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(),
                new Class[]{Connection.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "prepareStatement" -> {
                        recordedSql.set((String) args[0]);
                        yield statement;
                    }
                    case "prepareCall" -> {
                        fail("PostgreSQL procedures with OUT parameters should not use CallableStatement");
                        yield null;
                    }
                    case "close" -> null;
                    case "isClosed" -> false;
                    default -> defaultValue(method.getReturnType());
                }
        );
    }

    private static TaskContext taskContext() {
        var context = new TaskContext(300L, 400L);
        context.attributes().put("executionVariables", Map.of("idinstancia", "ABC123"));
        return context;
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType == Void.TYPE) {
            return null;
        }
        if (returnType == Boolean.TYPE) {
            return false;
        }
        if (returnType == Integer.TYPE) {
            return 0;
        }
        if (returnType == Long.TYPE) {
            return 0L;
        }
        if (returnType == Double.TYPE) {
            return 0d;
        }
        if (returnType == Float.TYPE) {
            return 0f;
        }
        if (returnType == Short.TYPE) {
            return (short) 0;
        }
        if (returnType == Byte.TYPE) {
            return (byte) 0;
        }
        if (returnType == Character.TYPE) {
            return '\0';
        }
        return null;
    }

    private static Instance<StoredProcedureDialect> fixedDialectInstance(List<StoredProcedureDialect> dialects) {
        return new Instance<>() {
            private final List<StoredProcedureDialect> values = List.copyOf(dialects);

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
        };
    }

    private record ProxyDataSource(ConnectionSupplier supplier) implements DataSource {
        @Override
        public Connection getConnection() throws SQLException {
            return supplier.get();
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            return supplier.get();
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

    @FunctionalInterface
    private interface ConnectionSupplier {
        Connection get() throws SQLException;
    }
}
