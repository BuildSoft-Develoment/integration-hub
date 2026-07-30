package com.integrationhub.platform.architecture;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-023: cada modulo es dueno del DDL de sus objetos.
 *
 * <p>Antes de ADR-023 las 103 migraciones vivian en {@code platform-app}, incluidas las 53 que crean y
 * evolucionan objetos del vertical SWIFT. La frontera motor/vertical existia en Java —modulos, SPI,
 * ArchUnit— y no existia en la base de datos: el motor era dueno del DDL del vertical.
 *
 * <p>Este ratchet no congela la lista de ficheros (crecera), congela la <b>regla</b>: una migracion del
 * motor no declara DDL sobre objetos del vertical, y una del vertical no lo declara sobre los del
 * motor. Cubre tablas, indices y triggers, porque el DDL de un modulo no es solo {@code create table}:
 * en {@code migration-mt101} hay 61 indices y 7 triggers frente a 22 tablas.
 *
 * <p>Es un guard de construccion, asi que lee del arbol de fuentes en vez del classpath: lo que hay que
 * vigilar es donde vive el fichero, y eso el classpath ya no lo distingue.
 */
class MigrationOwnershipRatchetTest {

    private static final Path CORE_MIGRATIONS = Path.of("src/main/resources/db/migration");
    private static final Path VERTICAL_MIGRATIONS =
            Path.of("../vertical-swift-mt101/src/main/resources/db/migration-mt101");

    /**
     * Tablas del vertical SWIFT. Cuatro no llevan el prefijo {@code mt101_} y solo se identifican por
     * quien las usa: si se cayeran de esta lista, sus migraciones podrian volver al motor sin que nada
     * lo notara.
     */
    private static final Pattern VERTICAL_TABLES = Pattern.compile(
            "(mt101_[a-z_0-9]*|swift_inbound_message|swift_message_envelope"
                    + "|inbound_routed_transaction|payment_validation_rule)");

    private static final Pattern CORE_TABLES = Pattern.compile(
            "(process_[a-z_0-9]*|staging_record|source_definition|reader_definition|connection_definition"
                    + "|audit_[a-z_0-9]*|task_[a-z_0-9]*|plugin_[a-z_0-9]*|ui_plugin_catalog_entry"
                    + "|system_theme_setting|processed_source_file)");

    /**
     * DDL que declara propiedad sobre una tabla. Acepta el nombre cualificado ({@code schema.tabla}) y
     * se queda con la ULTIMA parte: tras ADR-023 la cabecera de V104 exige crear cualificado, asi que
     * una regex que capturase la primera parte leeria el schema y dejaria pasar todo en silencio —el
     * guard se apagaria justo cuando alguien obedece la instruccion—.
     */
    private static final Pattern TABLE_DDL = Pattern.compile(
            "(?i)(?:create|alter|drop)\\s+(?:unlogged\\s+|temp\\s+|temporary\\s+)?table\\s+"
                    + "(?:if\\s+not\\s+exists\\s+|if\\s+exists\\s+)?(?:only\\s+)?"
                    + "\"?([a-z_0-9]+)\"?(?:\\.\"?([a-z_0-9]+)\"?)?");

    /** Un indice o un trigger pertenecen al dueno de la tabla sobre la que se declaran. */
    private static final Pattern ON_TABLE_DDL = Pattern.compile(
            "(?i)(?:create|drop)\\s+(?:unique\\s+)?(?:index|trigger)\\s+(?:if\\s+not\\s+exists\\s+|if\\s+exists\\s+)?"
                    + "[a-z_0-9\"]+\\s+on\\s+\"?([a-z_0-9]+)\"?(?:\\.\"?([a-z_0-9]+)\"?)?");

    private static final Pattern SQL_LINE_COMMENT = Pattern.compile("--[^\\n]*");
    private static final Pattern SQL_BLOCK_COMMENT = Pattern.compile("(?s)/\\*.*?\\*/");

    /**
     * Excepcion unica y documentada. {@code V31} anadio {@code source_file_hash} a {@code staging_record}
     * y a la vez las columnas de linaje a {@code mt101_build_fragment}: es la migracion que creo el
     * vinculo {@code staging_id} entre ambos lados, asi que su mezcla es historica. No se reescribe
     * porque cambiaria su checksum y romperia Flyway en toda instalacion existente.
     */
    private static final String MIXED_LEGACY_MIGRATION = "V31__record_traceability_source_row.sql";

    @Test
    void engineMigrationsDoNotOwnVerticalObjects() throws IOException {
        var offenders = objectsOwnedIn(CORE_MIGRATIONS, VERTICAL_TABLES, MIXED_LEGACY_MIGRATION);

        assertTrue(offenders.isEmpty(),
                () -> "Migraciones del motor que declaran DDL sobre objetos del vertical: " + offenders
                        + ". Su sitio es vertical-swift-mt101/src/main/resources/db/migration-mt101.");
    }

    @Test
    void verticalMigrationsDoNotOwnEngineObjects() throws IOException {
        var offenders = objectsOwnedIn(VERTICAL_MIGRATIONS, CORE_TABLES, null);

        assertTrue(offenders.isEmpty(),
                () -> "Migraciones del vertical que declaran DDL sobre objetos del motor: " + offenders
                        + ". El vertical no versiona el esquema del motor.");
    }

    @Test
    void theOnlyMixedMigrationStaysWithTheEngine() throws IOException {
        // Comprueba que la exencion no queda huerfana: si alguien moviera V31 al vertical, los otros dos
        // tests seguirian verdes por la exencion y la mezcla quedaria sin vigilar. No comprueba el
        // checksum del fichero, que es cosa de Flyway.
        assertTrue(Files.exists(CORE_MIGRATIONS.resolve(MIXED_LEGACY_MIGRATION)),
                MIXED_LEGACY_MIGRATION + " es la unica migracion mixta admitida y debe seguir en el motor.");
    }

    @Test
    void noVersionNumberIsClaimedByBothModules() throws IOException {
        // El historial de Flyway es UNICO y compartido: dos migraciones con la misma version, aunque
        // vivan en modulos distintos, son un conflicto irresoluble en el arranque.
        var coreVersions = versionsIn(CORE_MIGRATIONS);
        var verticalVersions = versionsIn(VERTICAL_MIGRATIONS);
        var shared = new TreeSet<>(coreVersions);
        shared.retainAll(verticalVersions);

        assertTrue(shared.isEmpty(),
                () -> "Versiones reclamadas por los dos modulos a la vez: " + shared);
    }

    @Test
    void bothLocationsExistAndAreNotEmpty() throws IOException {
        // Sin esto, un directorio mal escrito dejaria los dos tests de propiedad verdes sobre cero
        // ficheros: el fallo silencioso mas peligroso de este guard.
        assertFalse(sqlFiles(CORE_MIGRATIONS).isEmpty(), "el motor debe conservar sus migraciones");
        assertFalse(sqlFiles(VERTICAL_MIGRATIONS).isEmpty(),
                "el vertical debe tener las suyas; si esta vacio, quarkus.flyway.locations sobra");
    }

    // --- apoyo -----------------------------------------------------------------------------------

    private List<String> objectsOwnedIn(Path directory, Pattern foreignTables, String allowedException)
            throws IOException {
        var offenders = new ArrayList<String>();
        for (var file : sqlFiles(directory)) {
            var name = file.getFileName().toString();
            if (name.equals(allowedException)) {
                continue;
            }
            var sql = stripComments(Files.readString(file));
            collectForeign(TABLE_DDL.matcher(sql), foreignTables, name, offenders);
            collectForeign(ON_TABLE_DDL.matcher(sql), foreignTables, name, offenders);
        }
        return offenders;
    }

    private void collectForeign(Matcher matcher, Pattern foreignTables, String file, List<String> offenders) {
        while (matcher.find()) {
            // Con nombre cualificado el grupo 2 trae la tabla y el 1 el schema; sin cualificar, solo el 1.
            var table = (matcher.group(2) != null ? matcher.group(2) : matcher.group(1)).toLowerCase(Locale.ROOT);
            if (foreignTables.matcher(table).matches()) {
                offenders.add(file + " -> " + table);
            }
        }
    }

    /** Un DDL citado dentro de un comentario no declara propiedad de nada. */
    private String stripComments(String sql) {
        return SQL_LINE_COMMENT.matcher(SQL_BLOCK_COMMENT.matcher(sql).replaceAll(" ")).replaceAll(" ");
    }

    private java.util.Set<String> versionsIn(Path directory) throws IOException {
        var versions = new HashSet<String>();
        for (var file : sqlFiles(directory)) {
            var name = file.getFileName().toString();
            if (name.startsWith("V")) {
                versions.add(name.substring(1).replaceFirst("__.*$", ""));
            }
        }
        return versions;
    }

    private List<Path> sqlFiles(Path directory) throws IOException {
        if (!Files.isDirectory(directory)) {
            return List.of();
        }
        // Flyway escanea las locations en profundidad, asi que el guard tambien: un subdirectorio no
        // puede ser un punto ciego.
        try (Stream<Path> files = Files.walk(directory)) {
            return files.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".sql"))
                    .sorted()
                    .toList();
        }
    }
}
