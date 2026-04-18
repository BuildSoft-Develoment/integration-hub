package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import jakarta.enterprise.util.TypeLiteral;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.lang.annotation.Annotation;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class StoredProcedureTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("integration_hub_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private StoredProcedureTaskProvider provider;

    @BeforeEach
    void setUpSchema() throws Exception {
        var mapper = new JsonConfigurationMapper();
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public JdbcConnectionTarget resolveJdbcTarget(String connectionRef) {
                return new JdbcConnectionTarget(dataSource(), ConnectionType.POSTGRESQL);
            }
        };
        provider = new StoredProcedureTaskProvider(
                connectionPoolManager,
                fixedDialectInstance(List.of(
                        new PostgreSqlStoredProcedureDialect(),
                        new MySqlStoredProcedureDialect(),
                        new OracleStoredProcedureDialect(),
                        new SqlServerStoredProcedureDialect()
                ))
        );

        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists public.sp_result");
            statement.executeUpdate("create table public.sp_result (id bigint primary key, empresa varchar(20), fecha_proceso date, origen varchar(30), record_count integer)");
            statement.executeUpdate("drop procedure if exists public.sp_insert_result(bigint, varchar, date, varchar, integer)");
            statement.executeUpdate("create or replace procedure public.sp_insert_result(p_id bigint, p_empresa varchar, p_fecha_proceso date, p_origen varchar, p_record_count integer) language plpgsql as $$ begin insert into public.sp_result (id, empresa, fecha_proceso, origen, record_count) values (p_id, p_empresa, p_fecha_proceso, p_origen, p_record_count); end; $$");
            statement.executeUpdate("drop procedure if exists public.sp_collect_result(varchar, out varchar, out integer)");
            statement.executeUpdate("create or replace procedure public.sp_collect_result(in p_idinstancia varchar, out resultado varchar, out filas_actualizadas integer) language plpgsql as $$ begin resultado := 'OK-' || p_idinstancia; filas_actualizadas := 7; end; $$");
            statement.executeUpdate("drop procedure if exists public.p_procesar(text, out text, out int4)");
            statement.executeUpdate("create or replace procedure public.p_procesar(in p_idinstancia text, out resultado text, out filas_actualizadas int4) language plpgsql as $$ begin resultado := 'OK-' || p_idinstancia; filas_actualizadas := 11; end; $$");
        }
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void executesStoredProcedureUsingExecutionAndRuntimeVariables() throws Exception {
        var context = taskContext();
        context.attributes().put("executionVariables", Map.of("empresa", "C910", "fechaProceso", "2026-04-03"));
        context.attributes().put("readResult", new ReadResult(List.of(new ReadRecord(Map.of("id", 1))), 7, 2, List.of()));
        context.attributes().put("sourcePayload", SourcePayload.fromBytes("clientes_20260403.txt", new byte[]{1,2,3}, "text/plain"));

        var result = provider.execute(context, Map.of(
                "connectionRef", "erp-postgres",
                "procedureName", "public.sp_insert_result",
                "timeoutSeconds", 15,
                "parameters", List.of(
                        Map.of("name", "p_id", "value", "_processExecutionId", "jdbcType", "BIGINT"),
                        Map.of("name", "p_empresa", "value", "empresa", "jdbcType", "VARCHAR"),
                        Map.of("name", "p_fecha_proceso", "value", "fechaProceso", "jdbcType", "DATE"),
                        Map.of("name", "p_origen", "value", "const:REPROCESO", "jdbcType", "VARCHAR"),
                        Map.of("name", "p_record_count", "value", "_recordCount", "jdbcType", "INTEGER")
                )
        ));

        assertTrue(result.success());
        assertEquals("C910", singleValue("select empresa from public.sp_result where id = 300"));
        assertEquals("2026-04-03", singleValue("select fecha_proceso::text from public.sp_result where id = 300"));
        assertEquals("REPROCESO", singleValue("select origen from public.sp_result where id = 300"));
        assertEquals("7", singleValue("select record_count::text from public.sp_result where id = 300"));
    }

    @Test
    void capturesOutputParametersFromStoredProcedure() {
        var context = taskContext();
        context.attributes().put("executionVariables", Map.of("idinstancia", "ABC123"));

        var result = provider.execute(context, Map.of(
                "connectionRef", "erp-postgres",
                "procedureName", "public.sp_collect_result",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "VARCHAR", "direction", "IN"),
                        Map.of("name", "resultado", "jdbcType", "VARCHAR", "direction", "OUT"),
                        Map.of("name", "filas_actualizadas", "jdbcType", "INTEGER", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(7, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    @Test
    void capturesOutputParametersFromStoredProcedureUsingPostgreSqlMetadataTypes() {
        var context = taskContext();
        context.attributes().put("executionVariables", Map.of("idinstancia", "ABC123"));

        var result = provider.execute(context, Map.of(
                "connectionRef", "erp-postgres",
                "procedureName", "public.p_procesar",
                "parameters", List.of(
                        Map.of("name", "p_idinstancia", "value", "idinstancia", "jdbcType", "TEXT", "direction", "IN"),
                        Map.of("name", "resultado", "jdbcType", "TEXT", "direction", "OUT"),
                        Map.of("name", "filas_actualizadas", "jdbcType", "INT4", "direction", "OUT")
                )
        ));

        assertTrue(result.success());
        assertEquals("OK-ABC123", result.outputs().get("resultado"));
        assertEquals(11, ((Number) result.outputs().get("filas_actualizadas")).intValue());
    }

    @Test
    void executesStoredProcedureUsingResolvedConnectionRef() throws Exception {
        var mapper = new JsonConfigurationMapper();

        var definition = new ConnectionDefinition();
        definition.id = 999L;
        definition.name = "erp-postgres-real";
        definition.active = true;
        definition.connectionType = ConnectionType.POSTGRESQL;
        definition.configurationJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Map.of(
                "jdbcUrl", POSTGRES.getJdbcUrl(),
                "username", POSTGRES.getUsername(),
                "password", POSTGRES.getPassword(),
                "minSize", 0,
                "maxSize", 3,
                "acquisitionTimeoutSeconds", 30,
                "validationTimeoutSeconds", 5,
                "reapTimeoutMinutes", 5
        ));

        var repository = new ConnectionDefinitionRepository() {
            @Override
            public ConnectionDefinition findActiveRequiredByName(String name) {
                assertEquals("erp-postgres-real", name);
                return definition;
            }
        };

        var realConnectionPoolManager = new ConnectionPoolManager(repository, mapper);
        var realProvider = new StoredProcedureTaskProvider(
                realConnectionPoolManager,
                fixedDialectInstance(List.of(
                        new PostgreSqlStoredProcedureDialect(),
                        new MySqlStoredProcedureDialect(),
                        new OracleStoredProcedureDialect(),
                        new SqlServerStoredProcedureDialect()
                ))
        );

        var context = taskContext();
        context.attributes().put("executionVariables", Map.of("empresa", "ERP"));

        var result = realProvider.execute(context, Map.of(
                "connectionRef", "erp-postgres-real",
                "procedureName", "public.sp_insert_result",
                "parameters", List.of(
                        Map.of("name", "p_id", "value", "_processExecutionId", "jdbcType", "BIGINT"),
                        Map.of("name", "p_empresa", "value", "empresa", "jdbcType", "VARCHAR"),
                        Map.of("name", "p_fecha_proceso", "value", "const:2026-04-03", "jdbcType", "DATE"),
                        Map.of("name", "p_origen", "value", "const:MANUAL", "jdbcType", "VARCHAR"),
                        Map.of("name", "p_record_count", "value", "const:0", "jdbcType", "INTEGER")
                )
        ));

        assertTrue(result.success());
        assertEquals("ERP", singleValue("select empresa from public.sp_result where id = 300"));
        realConnectionPoolManager.evict(definition.id);
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

    private static TaskContext taskContext() {
        return new TaskContext(300L, 400L);
    }

    private static DataSource dataSource() {
        var dataSource = new PGSimpleDataSource();
        dataSource.setURL(POSTGRES.getJdbcUrl());
        dataSource.setUser(POSTGRES.getUsername());
        dataSource.setPassword(POSTGRES.getPassword());
        return dataSource;
    }

    private String singleValue(String sql) throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getString(1);
        }
    }
}
