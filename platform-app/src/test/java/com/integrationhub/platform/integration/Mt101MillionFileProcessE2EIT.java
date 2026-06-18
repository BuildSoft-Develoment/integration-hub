package com.integrationhub.platform.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.io.BufferedWriter;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E operativo para alto volumen:
 * FILE_READ(CSV) -> DB_WRITE(staging_record) -> MT101_BUILD_FROM_TABLE
 * -> MT101_VALIDATE -> MT101_ARCHIVE -> MT101_PAY(REST local).
 *
 * <p>Ejecutar carga real:</p>
 * <pre>
 *   mvn -q -pl platform-app test "-Dtest=Mt101MillionFileProcessE2EIT" \
 *       "-De2e.rows=1000000" "-DargLine=-Xmx768m"
 * </pre>
 */
@Tag("perf")
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101MillionFileProcessE2EIT {

    private static final int ROWS = Integer.getInteger("e2e.rows", 1_000_000);
    private static final int MAX_TRANSACTIONS_PER_MESSAGE =
            Integer.getInteger("e2e.maxTransactionsPerMessage", 100);
    private static final int MAX_BYTES_PER_MESSAGE =
            Integer.getInteger("e2e.maxBytesPerMessage", 10_000);
    private static final int PAY_PAGE_SIZE = Integer.getInteger("e2e.payPageSize", 200);
    private static final long TIMEOUT_SECONDS = Long.getLong("e2e.timeout.seconds", 900L);
    private static final String MT101_FORMAT = System.getProperty("e2e.format", "FIN").toUpperCase();
    private static final Path DEFAULT_INPUT_FILE =
            Path.of(System.getProperty("e2e.file", "C:/tmp/integration-hub-e2e/mt101-million.csv"));

    @Inject
    DataSource dataSource;

    @Inject
    ObjectMapper objectMapper;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("""
                    TRUNCATE TABLE
                      audit_spool,
                      audit_event,
                      mt101_failed_record,
                      mt101_validation_issue,
                      mt101_confirmation,
                      mt101_transaction,
                      mt101_archive,
                      swift_message_envelope,
                      mt101_build_fragment,
                      processed_source_file,
                      staging_record,
                      process_task_execution,
                      process_execution,
                      process_task_definition,
                      process_definition,
                      source_definition,
                      reader_definition
                    RESTART IDENTITY CASCADE
                    """);
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void runsFileToSwiftProcessForMillionRows() throws Exception {
        writeCsv(DEFAULT_INPUT_FILE, ROWS);

        try (var gateway = LocalSwiftGateway.start()) {
            var sourceId = createSource(DEFAULT_INPUT_FILE);
            var readerId = createReader();
            var processId = createSwiftProcess(sourceId, readerId, gateway.url());

            Number executionId =
                    given()
                            .contentType(ContentType.JSON)
                            .body("{}")
                    .when()
                            .post("/api/process-executions/{processDefinitionId}", processId.longValue())
                    .then()
                            .statusCode(200)
                            .extract()
                            .path("id");

            awaitExecutionCompleted(executionId.longValue());

            var diagnostics = diagnostics(executionId.longValue());
            var fragments = countRows("mt101_build_fragment");
            assertEquals(ROWS, countRows("staging_record"),
                    () -> "FILE_READ -> DB_WRITE debe cargar todas las filas. " + diagnostics);
            assertTrue(fragments > 0, "BUILD_FROM_TABLE debe crear fragmentos MT101");
            assertEquals(ROWS, countRows("mt101_transaction"),
                    () -> "ARCHIVE debe persistir todas las transacciones. " + diagnostics);
            assertEquals(fragments, countRowsWhere("mt101_build_fragment", "status = 'SENT'"),
                    "PAY debe marcar todos los fragmentos como SENT");
            assertEquals(fragments, countRows("mt101_archive"),
                    "ARCHIVE debe guardar un registro por fragmento MT101");
            assertEquals(0, countRows("mt101_validation_issue"),
                    "VALIDATE no debe producir issues para el archivo sintetico valido");
            assertEquals(fragments, gateway.requests(),
                    "el gateway local debe recibir un POST por fragmento MT101");

            assertAllTasksCompleted(executionId.longValue(), 6);
            assertNoOversizedFragments();
        }
    }

    private static final int NEG_ROWS = Integer.getInteger("e2e.negativeRows", 200);
    private static final int BAD_ROW = Integer.getInteger("e2e.badRow", 137);

    /**
     * Caso negativo a escala: una sola fila invalida en un lote grande. Verifica que
     * el operador puede ubicar la <b>fila exacta</b> que fallo y reprocesar solo esa
     * fila (cuarentena -> rebuild) sin tocar el resto. Parametrizable a 1M via
     * {@code -De2e.negativeRows=1000000 -De2e.badRow=847192}.
     */
    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void locatesAndReprocessesExactFailedRowInLargeBatch() throws Exception {
        writeCsvWithBadRow(DEFAULT_INPUT_FILE, NEG_ROWS, BAD_ROW);

        try (var gateway = LocalSwiftGateway.start()) {
            var sourceId = createSource(DEFAULT_INPUT_FILE);
            var readerId = createReader();
            var processId = createSwiftProcess(sourceId, readerId, gateway.url());

            Number executionId = given()
                    .contentType(ContentType.JSON).body("{}")
                    .when().post("/api/process-executions/{processDefinitionId}", processId.longValue())
                    .then().statusCode(200).extract().path("id");
            awaitExecutionTerminal(executionId.longValue());

            var fragmentSetId = "E2E-" + executionId.longValue();

            // 1) Todas las filas llegaron a staging; la fila mala produjo 1 issue por :21:.
            assertEquals(NEG_ROWS, countRows("staging_record"), "todas las filas se cargan en staging");
            assertEquals(1, countRowsWhere("mt101_validation_issue",
                    "rule_code = 'STRUCT.CHARGES_VALUE' and transaction_reference is not null"),
                    "la fila invalida produce exactamente un issue de transaccion");

            // 2) Cuarentena: resuelve el :21: fallido a su fila EXACTA del archivo.
            int quarantined = given()
                    .queryParam("fragmentSetId", fragmentSetId)
                    .when().post("/api/query/mt101-quarantine/build")
                    .then().statusCode(200).extract().path("quarantined");
            assertEquals(1, quarantined, "se encola exactamente la fila fallida");

            var failedRow = given()
                    .queryParam("fragmentSetId", fragmentSetId)
                    .when().get("/api/query/mt101-quarantine")
                    .then().statusCode(200).extract().jsonPath();
            assertEquals(BAD_ROW, failedRow.getInt("[0].sourceRecordNumber"),
                    "el operador ve la fila exacta del archivo que fallo");
            assertEquals("STRUCT.CHARGES_VALUE", failedRow.getString("[0].ruleCode"));

            // 3) Lookup fila -> fragmento por la fila exacta devuelve el :20: correcto.
            var lookup = given()
                    .queryParam("recordNumber", BAD_ROW)
                    .queryParam("fragmentSetId", fragmentSetId)
                    .when().get("/api/query/mt101-fragments/source-row")
                    .then().statusCode(200).extract().jsonPath();
            var fragFrom = lookup.getLong("[0].sourceRecordFrom");
            var fragTo = lookup.getLong("[0].sourceRecordTo");
            assertTrue(fragFrom <= BAD_ROW && fragTo >= BAD_ROW, "el fragmento devuelto cubre la fila exacta");
            var affectedRows = fragTo - fragFrom + 1;

            // 4) Reproceso quirurgico: corregir la fila y rebuild del FRAGMENTO COMPLETO afectado.
            correctStagingRow(BAD_ROW);
            var rebuild = given()
                    .queryParam("fragmentSetId", fragmentSetId)
                    .queryParam("correctiveSetId", fragmentSetId + "-FIX")
                    .when().post("/api/query/mt101-quarantine/rebuild")
                    .then().statusCode(200).extract().jsonPath();
            // P0-1: reconstruye TODAS las filas del fragmento afectado, no solo la fila fallida.
            assertEquals(affectedRows, rebuild.getLong("rebuiltRows"),
                    "reconstruye todas las transacciones del fragmento, no solo la fila " + BAD_ROW);
            assertEquals(1, rebuild.getInt("supersededFragments"), "el fragmento original queda superseded");
            assertEquals(1, countRowsWhere("mt101_build_fragment",
                    "fragment_set_id = '" + fragmentSetId + "' and status = 'SUPERSEDED'"),
                    "el fragmento original de la fila fallida queda SUPERSEDED");

            // Critico (#14): el set correctivo conserva TODAS las transacciones del fragmento
            // afectado -> no se pierde ninguna transaccion valida hermana de la 847192/8472.
            assertEquals(affectedRows, queryLong("select coalesce(sum(source_record_to - source_record_from + 1), 0) "
                            + "from mt101_build_fragment where fragment_set_id = '" + fragmentSetId + "-FIX'"),
                    "el correctivo cubre todas las filas del fragmento afectado, sin perder transacciones");
        }
    }

    private void correctStagingRow(int recordNumber) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            // El issue era cargos invalido; lo corregimos a OUR en el payload de staging.
            statement.executeUpdate("update staging_record set payload_json = "
                    + "regexp_replace(payload_json, '\"cargos\":\"BAD\"', '\"cargos\":\"OUR\"') "
                    + "where record_index = " + (recordNumber - 1));
        }
    }

    private void awaitExecutionTerminal(long executionId) {
        long deadline = System.currentTimeMillis() + TIMEOUT_SECONDS * 1_000L;
        String status = null;
        while (System.currentTimeMillis() < deadline) {
            status = given().when()
                    .get("/api/query/process-executions/{processExecutionId}", executionId)
                    .then().statusCode(200).extract().path("status");
            if (status != null && !"QUEUED".equals(status) && !"PENDING".equals(status)
                    && !"RUNNING".equals(status)) {
                return;
            }
            try {
                Thread.sleep(1_000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    private void writeCsvWithBadRow(Path file, int rows, int badRow) throws Exception {
        Files.createDirectories(file.getParent());
        try (BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
            writer.write("dni,nombre,cuenta,moneda,monto,bic,concepto,cargos");
            writer.newLine();
            for (int i = 1; i <= rows; i++) {
                writer.write(String.valueOf(10_000_000 + i));
                writer.write(",BENEFICIARIO ");
                writer.write(String.valueOf(i));
                writer.write(",001");
                writer.write(String.format("%010d", i));
                writer.write(',');
                writer.write("PEN");
                writer.write(',');
                writer.write(String.valueOf(100 + (i % 900)));
                writer.write(".50,BCPLPEPLXXX,FACTURA ");
                writer.write(String.valueOf(i));
                writer.write(',');
                // detailsOfCharges invalido SOLO en la fila objetivo -> STRUCT.CHARGES_VALUE.
                writer.write(i == badRow ? "BAD" : "OUR");
                writer.newLine();
            }
        }
    }

    private Number createSource(Path file) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "source-mt101-million-file",
                        "sourceType", "FILESYSTEM",
                        "active", true,
                        "configurationJson", json(Map.of("path", file.toString()))))
        .when()
                .post("/api/source-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private Number createReader() {
        var readerConfiguration = Map.of(
                "delimiter", ",",
                "encoding", "UTF-8",
                "hasHeader", true,
                "dataStartRowIndex", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2),
                        Map.of("name", "cuenta", "position", 3),
                        Map.of("name", "moneda", "position", 4),
                        Map.of("name", "monto", "position", 5),
                        Map.of("name", "bic", "position", 6),
                        Map.of("name", "concepto", "position", 7),
                        Map.of("name", "cargos", "position", 8)));
        var request = Map.of(
                "name", "reader-mt101-million-csv",
                "readerType", "CSV",
                "active", true,
                "configurationJson", json(readerConfiguration));
        return given()
                .contentType(ContentType.JSON)
                .body(request)
        .when()
                .post("/api/reader-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private Number createSwiftProcess(Number sourceId, Number readerId, String gatewayUrl) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "process-mt101-million-e2e",
                        "description", "E2E 1M CSV to SWIFT MT101",
                        "active", true,
                        "scheduled", false,
                        "scheduleEvery", "",
                        "tasks", List.of(
                                task(1, "FILE_READ", sourceId, readerId, Map.of(
                                        "taskRef", "file-read",
                                        "executionMode", "batch")),
                                task(2, "DB_WRITE", null, null, Map.of(
                                        "taskRef", "stage",
                                        "executionMode", "batch",
                                        "input", Map.of(
                                                "source", "task-output",
                                                "sourceTaskRef", "file-read",
                                                "sourceOutput", "records"),
                                        "mode", "insert",
                                        "targetTable", "staging_record")),
                                task(3, "MT101_BUILD_FROM_TABLE", null, null, buildFromTableConfig()),
                                task(4, "MT101_VALIDATE", null, null, Map.of(
                                        "taskRef", "validate-mt101",
                                        "executionMode", "once",
                                        "input", Map.of(
                                                "source", "task-output",
                                                "sourceTaskRef", "build-mt101",
                                                "sourceOutput", "fragments"),
                                        "ruleSet", "structural-mvp",
                                        "standard", "SWIFT",
                                        "appliesTo", "MT101",
                                        "failOn", "ERROR",
                                        "maxIssuesInOutput", 20,
                                        "publishIssuesTo", "table:mt101_validation_issue")),
                                task(5, "MT101_ARCHIVE", null, null, Map.of(
                                        "taskRef", "archive-mt101",
                                        "executionMode", "once",
                                        "input", Map.of(
                                                "source", "task-output",
                                                "sourceTaskRef", "build-mt101",
                                                "sourceOutput", "fragments"),
                                        "retentionDays", 3650,
                                        "pageSize", 200)),
                                task(6, "MT101_PAY", null, null, Map.of(
                                        "taskRef", "pay-mt101",
                                        "executionMode", "once",
                                        "transport", "REST",
                                        "input", Map.of(
                                                "source", "task-output",
                                                "sourceTaskRef", "build-mt101",
                                                "sourceOutput", "fragments"),
                                        "rest", Map.of(
                                                "url", gatewayUrl,
                                                "method", "POST",
                                                "contentType", payContentType()),
                                        "retryPolicy", Map.of(
                                                "maxRetries", 0,
                                                "retryOn", List.of()),
                                        "pageSize", PAY_PAGE_SIZE)))))
        .when()
                .post("/api/process-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private Map<String, Object> task(int order,
                                     String taskType,
                                     Number sourceId,
                                     Number readerId,
                                     Map<String, Object> configuration) {
        var task = new LinkedHashMap<String, Object>();
        task.put("taskOrder", order);
        task.put("taskType", taskType);
        if (sourceId != null) {
            task.put("sourceDefinitionId", sourceId.longValue());
        }
        if (readerId != null) {
            task.put("readerDefinitionId", readerId.longValue());
        }
        task.put("configurationJson", json(configuration));
        return task;
    }

    private Map<String, Object> buildFromTableConfig() {
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("taskRef", "build-mt101");
        configuration.put("executionMode", "once");
        configuration.put("input", Map.of(
                "source", "task-output",
                "sourceTaskRef", "stage",
                "sourceOutput", "table"));
        configuration.put("format", MT101_FORMAT);
        configuration.put("maxTransactionsPerMessage", MAX_TRANSACTIONS_PER_MESSAGE);
        configuration.put("maxBytesPerMessage", MAX_BYTES_PER_MESSAGE);
        configuration.put("fragmentSetIdTemplate", "E2E-${_processExecutionId}");
        configuration.put("replaceExisting", true);
        configuration.put("envelope", Map.of(
                "senderLt", "SGOBFRPPAXXX",
                "receiverLt", "BCPLPEPLXXXX",
                "uetrStrategy", "perMessage",
                "priority", "N"));
        configuration.put("sequenceA", Map.of(
                "sendersReferenceTemplate", "P${messageIndex}",
                "requestedExecutionDate", LocalDate.now().plusDays(1).toString(),
                "orderingCustomer", Map.of(
                        "option", "H",
                        "account", "001-10200200",
                        "nameAndAddress", List.of("EMPRESA E2E SAC", "LIMA PE"))));
        configuration.put("transactionMappings", Map.of(
                "transactionReferenceTemplate", "T${recordNumber}",
                "amount", Map.of(
                        "currencyField", "moneda",
                        "valueField", "monto"),
                "beneficiary", Map.of(
                        "option", "",
                        "accountField", "cuenta",
                        "nameAndAddressFields", List.of("nombre", "dni")),
                "accountWithInstitution", Map.of(
                        "option", "A",
                        "bicField", "bic"),
                "remittanceInformationField", "concepto",
                "detailsOfChargesField", "cargos"));
        return configuration;
    }

    private void writeCsv(Path file, int rows) throws Exception {
        Files.createDirectories(file.getParent());
        try (BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
            writer.write("dni,nombre,cuenta,moneda,monto,bic,concepto,cargos");
            writer.newLine();
            for (int i = 1; i <= rows; i++) {
                writer.write(String.valueOf(10_000_000 + i));
                writer.write(",BENEFICIARIO ");
                writer.write(String.valueOf(i));
                writer.write(",001");
                writer.write(String.format("%010d", i));
                writer.write(',');
                writer.write(i % 10 == 0 ? "USD" : "PEN");
                writer.write(',');
                writer.write(String.valueOf(100 + (i % 900)));
                writer.write(".50,BCPLPEPLXXX,FACTURA ");
                writer.write(String.valueOf(i));
                writer.write(',');
                writer.write(i % 50 == 0 ? "OUR" : "SHA");
                writer.newLine();
            }
        }
    }

    private String payContentType() {
        return "FIN".equals(MT101_FORMAT)
                ? "text/plain; charset=utf-8"
                : "application/json";
    }

    private void awaitExecutionCompleted(long executionId) {
        long deadline = System.currentTimeMillis() + TIMEOUT_SECONDS * 1_000L;
        String status = null;
        while (System.currentTimeMillis() < deadline) {
            status = given()
                    .when()
                            .get("/api/query/process-executions/{processExecutionId}", executionId)
                    .then()
                            .statusCode(200)
                            .extract()
                            .path("status");
            if (status != null && !"QUEUED".equals(status) && !"PENDING".equals(status)
                    && !"RUNNING".equals(status)) {
                break;
            }
            try {
                Thread.sleep(1_000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        assertEquals("COMPLETED", status, "la ejecucion debe terminar en COMPLETED");
    }

    private void assertAllTasksCompleted(long executionId, int expectedTasks) {
        var statuses = given()
                .when()
                        .get("/api/query/process-executions/{processExecutionId}/tasks", executionId)
                .then()
                        .statusCode(200)
                        .extract()
                        .jsonPath()
                        .getList("status", String.class);

        assertEquals(expectedTasks, statuses.size(), "cantidad de tareas ejecutadas");
        assertTrue(statuses.stream().allMatch("COMPLETED"::equals),
                () -> "todas las tareas deben terminar COMPLETED: " + statuses);
    }

    private String diagnostics(long executionId) throws Exception {
        return "tasks=" + taskSummaries(executionId)
                + ", fragmentStatuses=" + queryString(
                "select coalesce(string_agg(status || ':' || count, ', ' order by status), '') "
                        + "from (select status, count(*) as count from mt101_build_fragment group by status) s")
                + ", stagingTaskIds=" + queryString(
                "select coalesce(string_agg(task_definition_id || ':' || count, ', ' order by task_definition_id), '') "
                        + "from (select task_definition_id, count(*) as count from staging_record group by task_definition_id) s")
                + ", archives=" + countRows("mt101_archive")
                + ", transactions=" + countRows("mt101_transaction");
    }

    private List<String> taskSummaries(long executionId) {
        return given()
                .when()
                        .get("/api/query/process-executions/{processExecutionId}/tasks", executionId)
                .then()
                        .statusCode(200)
                        .extract()
                        .jsonPath()
                        .getList("details", String.class);
    }

    private void assertNoOversizedFragments() throws Exception {
        assertEquals(0, countRowsWhere("mt101_build_fragment",
                "octet_length(raw_payload) > " + MAX_BYTES_PER_MESSAGE),
                "ningun fragmento debe exceder maxBytesPerMessage");
        var fragments = countRows("mt101_build_fragment");
        assertEquals(fragments, countDistinct("mt101_build_fragment", "senders_reference"),
                ":20: debe ser unico por fragmento");
    }

    private long countRows(String tableName) throws Exception {
        return queryLong("SELECT count(*) FROM " + tableName);
    }

    private long countRowsWhere(String tableName, String whereClause) throws Exception {
        return queryLong("SELECT count(*) FROM " + tableName + " WHERE " + whereClause);
    }

    private long countDistinct(String tableName, String columnName) throws Exception {
        return queryLong("SELECT count(DISTINCT " + columnName + ") FROM " + tableName);
    }

    private long queryLong(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private String queryString(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            var value = resultSet.getString(1);
            return value == null ? "" : value;
        }
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot serialize test configuration", error);
        }
    }

    private static final class LocalSwiftGateway implements AutoCloseable {
        private final HttpServer server;
        private final AtomicInteger requests = new AtomicInteger();

        private LocalSwiftGateway(HttpServer server) {
            this.server = server;
        }

        static LocalSwiftGateway start() throws Exception {
            var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            var gateway = new LocalSwiftGateway(server);
            server.createContext("/v1/swift/mt101", exchange -> {
                exchange.getRequestBody().readAllBytes();
                var count = gateway.requests.incrementAndGet();
                var response = "{\"accepted\":true,\"gatewayReference\":\"GW-E2E-" + count + "\"}";
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.getBytes(StandardCharsets.UTF_8).length);
                exchange.getResponseBody().write(response.getBytes(StandardCharsets.UTF_8));
                exchange.close();
            });
            server.setExecutor(Executors.newCachedThreadPool());
            server.start();
            return gateway;
        }

        String url() {
            return "http://127.0.0.1:" + server.getAddress().getPort() + "/v1/swift/mt101";
        }

        int requests() {
            return requests.get();
        }

        @Override
        public void close() {
            server.stop(0);
        }
    }
}
