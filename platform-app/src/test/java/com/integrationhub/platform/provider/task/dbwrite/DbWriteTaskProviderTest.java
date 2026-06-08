package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
// @covers RF-002 (reingenieria: prueba que cubre el/los RF en produccion)
class DbWriteTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("integration_hub_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DbWriteTaskProvider provider;

    @BeforeEach
    void setUpSchema() throws Exception {
        var mapper = new JsonConfigurationMapper();
        var connectionPoolManager = new ConnectionPoolManager(null, null) {
            @Override
            public DataSource resolveJdbcDataSource(String connectionRef) {
                return dataSource();
            }
        };
        provider = new DbWriteTaskProvider(dataSource(), mapper, connectionPoolManager);

        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists public.integration_target");
            statement.executeUpdate("create table public.integration_target (id bigint primary key, nombre varchar(100), estado varchar(30), total integer, fecha_crea date, process_execution_id bigint, task_definition_id bigint, resultado_prev varchar(100), empresa varchar(50))");
        }
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void insertsRecordsWithDynamicMappings() throws Exception {
        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 1L, "name", "Ana", "status", "NEW", "amount", 10)),
                new ReadRecord(Map.of("id", 2L, "name", "Luis", "status", "READY", "amount", 20))
        ), 2));

        var result = provider.execute(context, Map.of(
                "mode", "insert",
                "targetTable", "public.integration_target",
                "batchSize", 2,
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                )
        ));

        assertTrue(result.success());
        assertEquals(2, countRows());
        assertEquals("Ana", singleValue("select nombre from public.integration_target where id = 1"));
        assertEquals("READY", singleValue("select estado from public.integration_target where id = 2"));
    }

    @Test
    void updatesExistingRecordsUsingKeyColumns() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("insert into public.integration_target (id, nombre, estado, total) values (1, 'Ana', 'NEW', 10), (2, 'Luis', 'READY', 20)");
        }

        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 1L, "name", "Ana Maria", "status", "DONE", "amount", 15)),
                new ReadRecord(Map.of("id", 2L, "name", "Luis Perez", "status", "DONE", "amount", 25))
        ), 2));

        var result = provider.execute(context, Map.of(
                "mode", "batch-update",
                "targetTable", "public.integration_target",
                "keyColumns", List.of("id"),
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                )
        ));

        assertTrue(result.success());
        assertEquals("Ana Maria", singleValue("select nombre from public.integration_target where id = 1"));
        assertEquals("25", singleValue("select total::text from public.integration_target where id = 2"));
    }

    @Test
    void upsertsRecordsUsingKeyColumns() throws Exception {
        try (Connection connection = dataSource().getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("insert into public.integration_target (id, nombre, estado, total) values (1, 'Ana', 'NEW', 10)");
        }

        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 1L, "name", "Ana Actualizada", "status", "DONE", "amount", 11)),
                new ReadRecord(Map.of("id", 3L, "name", "Marta", "status", "NEW", "amount", 30))
        ), 2));

        var result = provider.execute(context, Map.of(
                "mode", "upsert",
                "targetTable", "public.integration_target",
                "keyColumns", List.of("id"),
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                )
        ));

        assertTrue(result.success());
        assertEquals(2, countRows());
        assertEquals("Ana Actualizada", singleValue("select nombre from public.integration_target where id = 1"));
        assertEquals("Marta", singleValue("select nombre from public.integration_target where id = 3"));
    }

    @Test
    void insertsRecordsUsingDatabaseFunctions() throws Exception {
        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 20L, "name", "Ana", "status", "NEW", "amount", 10))
        ), 1));

        var result = provider.execute(context, Map.of(
                "mode", "insert",
                "targetTable", "public.integration_target",
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                ),
                "columnFunctions", Map.of(
                        "fecha_crea", "current_date"
                )
        ));

        assertTrue(result.success());
        assertEquals(LocalDate.now().toString(), singleValue("select fecha_crea::text from public.integration_target where id = 20"));
    }

    @Test
    void insertsRecordsUsingConnectionRef() throws Exception {
        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 10L, "name", "Conexion Externa", "status", "NEW", "amount", 100))
        ), 1));

        var result = provider.execute(context, Map.of(
                "connectionRef", "erp-postgres",
                "mode", "insert",
                "targetTable", "public.integration_target",
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                )
        ));

        assertTrue(result.success());
        assertEquals("Conexion Externa", singleValue("select nombre from public.integration_target where id = 10"));
    }

    @Test
    void insertsRecordsUsingRealConnectionPoolManagerResolution() throws Exception {
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
        var realProvider = new DbWriteTaskProvider(dataSource(), mapper, realConnectionPoolManager);

        var context = taskContext();
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 11L, "name", "Pool Manager", "status", "READY", "amount", 101))
        ), 1));

        var result = realProvider.execute(context, Map.of(
                "connectionRef", "erp-postgres-real",
                "mode", "insert",
                "targetTable", "public.integration_target",
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount"
                )
        ));

        assertTrue(result.success());
        assertEquals("Pool Manager", singleValue("select nombre from public.integration_target where id = 11"));
        realConnectionPoolManager.evict(definition.id);
    }

    @Test
    void insertsRecordsUsingRuntimeVariablesAndTaskOutputs() throws Exception {
        var context = taskContext();
        context.attributes().put("executionVariables", Map.of("empresa", "C910"));
        context.attributes().put("taskOutputs", Map.of("resultado", "SP_OK"));
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 30L, "name", "Runtime", "status", "NEW", "amount", 77))
        ), 1));

        var result = provider.execute(context, Map.of(
                "mode", "insert",
                "targetTable", "public.integration_target",
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "estado", "status",
                        "total", "amount",
                        "process_execution_id", "_processExecutionId",
                        "task_definition_id", "_taskDefinitionId",
                        "resultado_prev", "resultado",
                        "empresa", "empresa"
                )
        ));

        assertTrue(result.success());
        assertEquals("100", singleValue("select process_execution_id::text from public.integration_target where id = 30"));
        assertEquals("200", singleValue("select task_definition_id::text from public.integration_target where id = 30"));
        assertEquals("SP_OK", singleValue("select resultado_prev from public.integration_target where id = 30"));
        assertEquals("C910", singleValue("select empresa from public.integration_target where id = 30"));
    }
    @Test
    void insertsRecordsUsingQualifiedTaskOutputKey() throws Exception {
        // P1.b: una columna enlazada a un output AGREGADO de una tarea previa se persiste como
        // clave CALIFICADA `taskRef.output.campo` y el backend la resuelve (sin colision con
        // claves globales) desde el registro enriquecido (copyTaskOutputs). El front emite esa
        // clave para summary/out/table.
        var context = taskContext();
        context.attributes().put("taskOutputs", Map.of(
                "task-1.summary.estado", "PREV_OK",
                "estado", "GLOBAL_COLISIONADO" // clave plana colisionada: NO debe ganar
        ));
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("id", 40L, "name", "Calificado", "amount", 5))
        ), 1));

        var result = provider.execute(context, Map.of(
                "mode", "insert",
                "targetTable", "public.integration_target",
                "columnMappings", Map.of(
                        "id", "id",
                        "nombre", "name",
                        "total", "amount",
                        "estado", "task-1.summary.estado"
                )
        ));

        assertTrue(result.success());
        assertEquals("PREV_OK", singleValue("select estado from public.integration_target where id = 40"));
    }

    private static TaskContext taskContext() {
        return new TaskContext(100L, 200L);
    }

    private static DataSource dataSource() {
        var dataSource = new PGSimpleDataSource();
        dataSource.setURL(POSTGRES.getJdbcUrl());
        dataSource.setUser(POSTGRES.getUsername());
        dataSource.setPassword(POSTGRES.getPassword());
        return dataSource;
    }

    private int countRows() throws Exception {
        return Integer.parseInt(singleValue("select count(*)::text from public.integration_target"));
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
