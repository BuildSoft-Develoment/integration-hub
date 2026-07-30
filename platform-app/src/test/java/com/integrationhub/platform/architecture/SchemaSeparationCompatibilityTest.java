package com.integrationhub.platform.architecture;

import com.integrationhub.platform.provider.task.CompatibilityContainerTimeouts;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-023: aplica las 104 migraciones sobre un PostgreSQL real y comprueba que la separacion por
 * schemas queda como se decidio.
 *
 * <p>Un test que solo lea los ficheros .sql no demuestra nada aqui: {@code alter table ... set schema}
 * arrastra indices, restricciones y claves ajenas, y lo que hay que verificar es precisamente que las
 * FK del vertical hacia el motor <b>sobreviven al cruce de schema</b>. Eso solo lo dice el motor.
 */
@Tag("compat-db")
@Testcontainers
class SchemaSeparationCompatibilityTest {

    private static final String VERTICAL_SCHEMA = "vertical_mt101";
    private static final String CORE_SCHEMA = "public";

    /**
     * Contenedor propio, no el compartido de {@code CompatibilityJdbcContainers}.
     *
     * <p>Esta clase aplica las 104 migraciones y deja 22 tablas, indices y triggers: no es un vecino
     * aceptable para las fixtures de las otras clases {@code compat-db}, que crean sus propias tablas en
     * {@code public} y no limpian. Compartiendo base, si alguna corriera antes,
     * {@code Flyway.migrate()} abortaria con {@code NON_EMPTY_SCHEMA_WITHOUT_SCHEMA_HISTORY_TABLE} — y el
     * orden de surefire es {@code filesystem}, que no garantiza nada entre sistemas de ficheros.
     */
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("integration_hub_migrations")
            .withStartupTimeoutSeconds(CompatibilityContainerTimeouts.STARTUP_SECONDS);

    private static String jdbcUrl;
    private static String username;
    private static String password;

    @BeforeAll
    static void migrate() {
        jdbcUrl = POSTGRES.getJdbcUrl();
        username = POSTGRES.getUsername();
        password = POSTGRES.getPassword();

        var result = Flyway.configure()
                .dataSource(jdbcUrl, username, password)
                .locations("classpath:db/migration", "classpath:db/migration-mt101")
                .load()
                .migrate();

        // Sin esto, un jar del vertical desactualizado dejaria V104 fuera y los tests de ubicacion
        // fallarian con un mensaje que no senala la causa. Ya paso una vez.
        assertTrue(result.migrationsExecuted > 100,
                () -> "se esperaban las 104 migraciones y se aplicaron " + result.migrationsExecuted
                        + ": revisa que el jar de vertical-swift-mt101 este al dia");
    }

    @Test
    void everyVerticalTableLivesInItsOwnSchema() throws SQLException {
        var stragglers = query(
                "select table_name from information_schema.tables"
                        + " where table_schema = '" + CORE_SCHEMA + "' and table_type = 'BASE TABLE'"
                        + " and (table_name like 'mt101%' or table_name in ('swift_inbound_message',"
                        + " 'swift_message_envelope', 'inbound_routed_transaction', 'payment_validation_rule'))");

        assertTrue(stragglers.isEmpty(),
                () -> "tablas del vertical que se quedaron en el schema del motor: " + stragglers);
    }

    @Test
    void theVerticalSchemaHoldsExactlyTheTwentyTwoTables() throws SQLException {
        var tables = query("select table_name from information_schema.tables"
                + " where table_schema = '" + VERTICAL_SCHEMA + "' and table_type = 'BASE TABLE'");

        assertEquals(22, tables.size(), () -> "tablas en " + VERTICAL_SCHEMA + ": " + tables);
    }

    @Test
    void stagingRecordStaysWithTheEngine() throws SQLException {
        // La decision del ADR: es la zona de aterrizaje generica y su unico escritor es el motor. Si se
        // moviera, las 12 sentencias del vertical que la leen —tres con JOIN— tendrian que cualificarse.
        var inCore = query("select table_name from information_schema.tables"
                + " where table_schema = '" + CORE_SCHEMA + "' and table_name = 'staging_record'");
        var inVertical = query("select table_name from information_schema.tables"
                + " where table_schema = '" + VERTICAL_SCHEMA + "' and table_name = 'staging_record'");

        assertEquals(List.of("staging_record"), inCore, "staging_record debe seguir en el motor");
        assertTrue(inVertical.isEmpty(), "staging_record no debe existir en el schema del vertical");
    }

    @Test
    void foreignKeysFromTheVerticalToTheEngineSurviveTheMove() throws SQLException {
        // Es lo unico que no se puede razonar leyendo el .sql: que PostgreSQL conserve las FK al mover
        // la tabla de schema, y que queden apuntando al motor.
        var crossSchemaFks = query(
                "select tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_schema || '.' || ccu.table_name"
                        + " from information_schema.table_constraints tc"
                        + " join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name"
                        + " join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name"
                        + " where tc.constraint_type = 'FOREIGN KEY'"
                        + " and tc.table_schema = '" + VERTICAL_SCHEMA + "'"
                        + " and ccu.table_schema = '" + CORE_SCHEMA + "'");

        assertTrue(crossSchemaFks.size() >= 2,
                () -> "se esperaban FK del vertical hacia process_execution / process_task_definition"
                        + " y sobrevivieron: " + crossSchemaFks);
    }

    @Test
    void theSearchPathReachesBothSchemasWithoutQualifying() throws SQLException {
        // Reproduce lo que hace la aplicacion: search_path con los dos schemas. Si esto fallara, las
        // ~219 sentencias del vertical que no cualifican dejarian de encontrar sus tablas.
        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password);
             var statement = connection.createStatement()) {
            statement.execute("set search_path to " + CORE_SCHEMA + ", " + VERTICAL_SCHEMA);

            try (var rows = statement.executeQuery("select count(*) from mt101_archive")) {
                assertTrue(rows.next(), "una tabla del vertical debe resolverse sin cualificar");
            }
            try (var rows = statement.executeQuery("select count(*) from staging_record")) {
                assertTrue(rows.next(), "una tabla del motor debe resolverse sin cualificar");
            }
            // Y el JOIN cruzado, que es el caso que sostiene la decision de dejar staging_record aqui.
            try (var rows = statement.executeQuery(
                    "select count(*) from mt101_failed_record f join staging_record s on s.id = f.staging_id")) {
                assertTrue(rows.next(), "el JOIN entre schemas debe funcionar");
            }
        }
    }

    @Test
    void sequencesAndTriggerFunctionsMoveToo() throws SQLException {
        // No viajan con `alter table ... set schema`: la secuencia se creo suelta (sin `owned by`) y las
        // funciones de trigger son objetos de schema por derecho propio. Si se quedaran en `public`, el
        // inventario del vertical estaria partido entre dos schemas sin que ninguna asercion de tablas
        // lo delatara — las de ubicacion filtran por table_type = 'BASE TABLE'.
        var strays = query(
                "select 'secuencia ' || c.relname from pg_class c"
                        + " join pg_namespace n on n.oid = c.relnamespace"
                        + " where c.relkind = 'S' and c.relname like 'mt101%' and n.nspname = '" + CORE_SCHEMA + "'"
                        + " union all"
                        + " select 'funcion ' || p.proname from pg_proc p"
                        + " join pg_namespace n on n.oid = p.pronamespace"
                        + " where p.proname like 'mt101%' and n.nspname = '" + CORE_SCHEMA + "'");

        assertTrue(strays.isEmpty(),
                () -> "objetos del vertical que se quedaron en el schema del motor: " + strays);
    }

    @Test
    void everyEngineTableStaysInTheEngineSchema() throws SQLException {
        // La cara opuesta: la separacion tampoco debe arrastrarse tablas del motor.
        var moved = query("select table_name from information_schema.tables"
                + " where table_schema = '" + VERTICAL_SCHEMA + "' and table_type = 'BASE TABLE'"
                + " and (table_name like 'process_%' or table_name like 'task_%'"
                + " or table_name like 'audit_%' or table_name like 'plugin_%'"
                + " or table_name in ('staging_record', 'source_definition', 'reader_definition',"
                + " 'connection_definition', 'processed_source_file', 'system_theme_setting'))");

        assertTrue(moved.isEmpty(), () -> "tablas del motor arrastradas al schema del vertical: " + moved);
    }

    @Test
    void flywayHistoryStaysInTheEngineSchema() throws SQLException {
        var history = query("select table_name from information_schema.tables"
                + " where table_schema = '" + CORE_SCHEMA + "' and table_name = 'flyway_schema_history'");

        assertEquals(List.of("flyway_schema_history"), history,
                "el historial no se parte: una sola tabla, en el schema del motor");
    }

    private List<String> query(String sql) throws SQLException {
        var values = new ArrayList<String>();
        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password);
             var statement = connection.createStatement();
             var rows = statement.executeQuery(sql)) {
            while (rows.next()) {
                values.add(rows.getString(1));
            }
        }
        return values;
    }
}
