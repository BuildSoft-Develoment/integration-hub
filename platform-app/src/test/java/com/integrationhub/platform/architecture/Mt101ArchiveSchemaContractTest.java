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
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contrato de modelo de datos del vertical SWIFT MT101, comprobado sobre el esquema QUE CONSTRUYE
 * FLYWAY.
 *
 * <p><b>Por que existe.</b> RF-013 declaraba como prueba a {@code Mt101ArchiveTaskProviderTest}, que
 * crea su PROPIO DDL con un {@code CREATE TABLE} de fixture. Ese test comprueba que el repositorio
 * sabe escribir contra las tablas que el mismo acaba de inventar — no que las migraciones creen esas
 * tablas, ni con esos constraints. Anotarlo como cubridor del requisito habria certificado algo que
 * nadie estaba mirando. (El codigo no se nombra en esta prosa a proposito: el cosechador de
 * trazabilidad lee el fichero entero y habria contado esta frase como una declaracion mas.)</p>
 *
 * <p><b>Por que provoca los duplicados en vez de leer {@code indexdef}.</b> Comparar cadenas del
 * catalogo demuestra que hay un indice que se PARECE al pedido. Lo que protege el dinero es el
 * rechazo, y solo el rechazo se puede observar intentandolo. La diferencia no es academica:
 * {@code ux_mt101_archive_operational_idempotency} es un indice FUNCIONAL sobre
 * {@code coalesce(sender_lt, '')}, y un UNIQUE ingenuo sobre las tres columnas leeria casi igual en
 * el catalogo pero NO bloquearia nada cuando {@code sender_lt} es nulo, porque en PostgreSQL dos
 * nulos no son iguales entre si. Ese matiz es exactamente por donde se archiva dos veces el mismo
 * {@code :20:}, y el unico test que lo ve es el que inserta la fila repetida.</p>
 *
 * @covers spec 008-mensajeria-pagos RF-013 (modelo de datos: tablas, indices y las dos guardas de unicidad)
 */
@Tag("compat-db")
@Testcontainers
class Mt101ArchiveSchemaContractTest {

    private static final String VERTICAL_SCHEMA = "vertical_mt101";

    /** Contenedor propio por la misma razon que {@link SchemaSeparationCompatibilityTest}: aqui se migra. */
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("integration_hub_schema_contract")
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

        assertTrue(result.migrationsExecuted > 100,
                () -> "se esperaban las migraciones completas y se aplicaron " + result.migrationsExecuted
                        + ": revisa que el jar de vertical-swift-mt101 este al dia");
    }

    @Test
    void lasTablasDelRequisitoExistenTrasMigrar() throws SQLException {
        var declaradas = List.of(
                "mt101_archive",
                "mt101_confirmation",
                "mt101_validation_issue",
                "mt101_reconciliation_exception",
                "mt101_build_fragment");

        var presentes = query(
                "select table_name from information_schema.tables where table_schema = '"
                        + VERTICAL_SCHEMA + "'");

        var ausentes = declaradas.stream().filter(t -> !presentes.contains(t)).toList();
        assertTrue(ausentes.isEmpty(),
                () -> "RF-013 declara estas tablas y las migraciones NO las crean en " + VERTICAL_SCHEMA
                        + ": " + ausentes);
    }

    @Test
    void archivarDosVecesLaMismaReferenciaDelMismoEmisorYAnoEsRechazado() throws SQLException {
        // sender_lt informado: el caso ordinario.
        insertarArchive("BANKPEPXXXX", "REF-IDEMP-001", "2026-03-10");

        var duplicado = assertThrows(SQLException.class,
                () -> insertarArchive("BANKPEPXXXX", "REF-IDEMP-001", "2026-03-10"),
                "la segunda insercion del mismo :20: del mismo emisor y ano DEBE ser rechazada:"
                        + " sin esa guarda el mismo pago se archiva dos veces");

        assertTrue("23505".equals(duplicado.getSQLState()),
                () -> "se esperaba violacion de unicidad (23505) y llego " + duplicado.getSQLState()
                        + ": " + duplicado.getMessage());
    }

    @Test
    void laGuardaDeIdempotenciaSigueApretandoCuandoElEmisorEsNulo() throws SQLException {
        // Este es el caso que un UNIQUE ingenuo dejaria pasar. Va aparte del anterior a proposito:
        // si algun dia alguien "simplifica" el indice funcional, quiero que el mensaje rojo diga
        // exactamente cual de los dos casos se rompio.
        insertarArchive(null, "REF-IDEMP-NULL", "2026-03-11");

        var duplicado = assertThrows(SQLException.class,
                () -> insertarArchive(null, "REF-IDEMP-NULL", "2026-03-11"),
                "con sender_lt nulo el duplicado TAMBIEN debe rechazarse. En PostgreSQL dos nulos no"
                        + " son iguales, asi que un UNIQUE plano sobre (sender_lt, senders_reference,"
                        + " year) aceptaria ambas filas: la idempotencia depende de que el indice sea"
                        + " funcional sobre coalesce(sender_lt, '')");

        assertTrue("23505".equals(duplicado.getSQLState()),
                () -> "se esperaba violacion de unicidad (23505) y llego " + duplicado.getSQLState()
                        + ": " + duplicado.getMessage());
    }

    @Test
    void elMismoAnoConFechasDistintasSigueSiendoElMismoPago() throws SQLException {
        // La clave es el ANO, no la fecha exacta: reprocesar el mismo :20: con otra fecha de
        // ejecucion del mismo ejercicio no puede colarse como un pago nuevo.
        insertarArchive("BANKPEPXXXX", "REF-IDEMP-YEAR", "2026-01-05");

        assertThrows(SQLException.class,
                () -> insertarArchive("BANKPEPXXXX", "REF-IDEMP-YEAR", "2026-11-30"),
                "misma referencia y mismo emisor dentro del mismo ano deben colisionar aunque cambie"
                        + " el dia: la unicidad se calcula sobre el ano extraido, no sobre la fecha");
    }

    @Test
    void unFragmentoNoSeDuplicaAlReprocesar() throws SQLException {
        insertarFragmento("SET-REPROCESO-001", 1);

        var duplicado = assertThrows(SQLException.class,
                () -> insertarFragmento("SET-REPROCESO-001", 1),
                "RF-013 exige unicidad por (fragment_set_id, fragment_index): sin ella, reprocesar un"
                        + " lote duplica fragmentos ya construidos");

        assertTrue("23505".equals(duplicado.getSQLState()),
                () -> "se esperaba violacion de unicidad (23505) y llego " + duplicado.getSQLState());
    }

    private static void insertarArchive(String senderLt, String referencia, String fechaEjecucion)
            throws SQLException {
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password);
             var ps = conn.prepareStatement(
                     "insert into " + VERTICAL_SCHEMA + ".mt101_archive"
                             + " (sender_lt, senders_reference, requested_execution_date) values (?, ?, ?::date)")) {
            ps.setString(1, senderLt);
            ps.setString(2, referencia);
            ps.setString(3, fechaEjecucion);
            ps.executeUpdate();
        }
    }

    private static void insertarFragmento(String setId, int indice) throws SQLException {
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password);
             var ps = conn.prepareStatement(
                     "insert into " + VERTICAL_SCHEMA + ".mt101_build_fragment"
                             + " (fragment_set_id, fragment_index, fragment_total, senders_reference,"
                             + "  payload_hash, raw_payload, message_json)"
                             + " values (?, ?, 1, 'REF-FRAG-001', repeat('a', 64), ':20:REF-FRAG-001', '{}')")) {
            ps.setString(1, setId);
            ps.setInt(2, indice);
            ps.executeUpdate();
        }
    }

    private static List<String> query(String sql) throws SQLException {
        var out = new ArrayList<String>();
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password);
             var st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                out.add(rs.getString(1));
            }
        }
        return out;
    }
}
