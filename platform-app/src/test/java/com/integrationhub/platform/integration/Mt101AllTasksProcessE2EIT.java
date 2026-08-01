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
 * E2E de cobertura funcional para la vertical SWIFT/MT101:
 *
 * <ul>
 *   <li>Outbound (camino estandar paginado): CSV comun -> DB_WRITE(staging_record)
 *       -> MT101_BUILD_FROM_TABLE -> MT101_VALIDATE -> MT101_ARCHIVE -> MT101_PAY.</li>
 *   <li>Inbound: archivo SWIFT FIN -> reader SWIFT_MT -> MT101_PARSE -> MT101_ROUTE.</li>
 * </ul>
 *
 * <p>El build en memoria {@code MT101_BUILD} se removio (no escala a alto volumen);
 * la unica ruta de construccion es la paginada {@code MT101_BUILD_FROM_TABLE}, que
 * lee de {@code staging_record} y absorbe el split por bytes/transacciones.</p>
 *
 * @covers spec 003-diseno-y-ejecucion-procesos RF-003, RF-004
 * @covers spec 008-mensajeria-pagos RF-001, RF-005, RF-006, RF-007, RF-008
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101AllTasksProcessE2EIT {

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
                      mt101_reconciliation_exception,
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
    void runsCommonCsvThroughStandardPagedMt101Pipeline() throws Exception {
        var inputFile = Path.of("C:/tmp/integration-hub-e2e/mt101-all-tasks-outbound.csv");
        writeOutboundCsv(inputFile);

        try (var gateway = LocalSwiftGateway.start()) {
            var sourceId = createSource("source-mt101-all-outbound", inputFile);
            var readerId = createCsvReader("reader-mt101-all-outbound");
            var processId = createOutboundProcess(sourceId, readerId, gateway);

            var executionId = executeProcess(processId);
            awaitExecutionCompleted(executionId);

            // Camino estandar paginado: FILE_READ -> DB_WRITE(staging) -> BUILD_FROM_TABLE
            // -> VALIDATE -> ARCHIVE -> PAY (6 tareas). Con 6 filas y
            // maxTransactionsPerMessage=2 el build produce 3 fragmentos MT101.
            assertAllTasksCompleted(executionId, 6);

            var fragments = countRows("mt101_build_fragment");
            assertEquals(3, fragments, "6 filas / maxTransactionsPerMessage=2 -> 3 fragmentos MT101");
            assertEquals(6, countRows("staging_record"), "DB_WRITE carga las 6 filas en staging");
            assertEquals(6, countRows("mt101_transaction"), "ARCHIVE persiste una transaccion por fila");
            assertEquals(fragments, countRows("mt101_archive"), "ARCHIVE guarda un registro por fragmento");
            assertEquals(0, countRows("mt101_validation_issue"), "el CSV valido no produce issues");
            assertEquals(fragments, gateway.payRequests(), "PAY envia un POST por fragmento MT101");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void runsSwiftMtInboundThroughParseAndRoute() throws Exception {
        var inputFile = Path.of("C:/tmp/integration-hub-e2e/mt101-all-tasks-inbound.fin");
        Files.createDirectories(inputFile.getParent());
        Files.writeString(inputFile, inboundFinMessage(), StandardCharsets.UTF_8);

        var sourceId = createSource("source-mt101-all-inbound", inputFile);
        var readerId = createSwiftMtReader("reader-mt101-all-inbound");
        var processId = createInboundProcess(sourceId, readerId);

        var executionId = executeProcess(processId);
        awaitExecutionCompleted(executionId);

        assertAllTasksCompleted(executionId, 3);
        assertTaskDetailsContain(executionId,
                "MT101_PARSE parsed=1 transactions=2 errors=0",
                "MT101_ROUTE routed=1");
    }

    private Number createOutboundProcess(Number sourceId, Number readerId, LocalSwiftGateway gateway) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "process-mt101-all-outbound-e2e",
                        "description", "CSV -> staging -> BUILD_FROM_TABLE -> VALIDATE -> ARCHIVE -> PAY (paginado)",
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
                                        "input", input("file-read", "records"),
                                        "mode", "insert",
                                        "targetTable", "staging_record")),
                                task(3, "MT101_BUILD_FROM_TABLE", null, null, buildFromTableConfig()),
                                task(4, "MT101_VALIDATE", null, null, Map.of(
                                        "taskRef", "validate-mt101",
                                        "executionMode", "once",
                                        "input", input("build-mt101", "fragments"),
                                        "ruleSet", "structural-mvp",
                                        "standard", "SWIFT",
                                        "appliesTo", "MT101",
                                        "failOn", "ERROR",
                                        "publishIssuesTo", "table:mt101_validation_issue")),
                                task(5, "MT101_ARCHIVE", null, null, Map.of(
                                        "taskRef", "archive-mt101",
                                        "executionMode", "once",
                                        "input", input("build-mt101", "fragments"),
                                        "retentionDays", 3650,
                                        "pageSize", 200)),
                                task(6, "MT101_PAY", null, null, Map.of(
                                        "taskRef", "pay-mt101",
                                        "executionMode", "once",
                                        "transport", "REST",
                                        "input", input("build-mt101", "fragments"),
                                        "rest", Map.of(
                                                "url", gateway.payUrl(),
                                                "method", "POST",
                                                "contentType", "text/plain; charset=utf-8"),
                                        "retryPolicy", Map.of("maxRetries", 0, "retryOn", List.of()),
                                        "pageSize", 200)))))
        .when()
                .post("/api/process-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private Number createInboundProcess(Number sourceId, Number readerId) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "process-mt101-all-inbound-e2e",
                        "description", "SWIFT FIN inbound parse and route",
                        "active", true,
                        "scheduled", false,
                        "scheduleEvery", "",
                        "tasks", List.of(
                                task(1, "FILE_READ", sourceId, readerId, Map.of(
                                        "taskRef", "read-swift",
                                        "executionMode", "batch")),
                                task(2, "MT101_PARSE", null, null, Map.of(
                                        "taskRef", "parse-mt101",
                                        "executionMode", "batch",
                                        "input", input("read-swift", "records"))),
                                task(3, "MT101_ROUTE", null, null, Map.of(
                                        "taskRef", "route-inbound",
                                        "executionMode", "once",
                                        "input", input("parse-mt101", "records"),
                                        "rules", List.of(Map.of(
                                                "name", "same-bank-inbound",
                                                "predicate", "sequenceA.sendersReference == 'INB1'",
                                                "routeTo", "INBOUND_REVIEW")),
                                        "defaultRoute", "UNMATCHED")))))
        .when()
                .post("/api/process-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private Map<String, Object> buildFromTableConfig() {
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("taskRef", "build-mt101");
        configuration.put("executionMode", "once");
        configuration.put("input", input("stage", "table"));
        configuration.put("format", "FIN");
        // 6 filas / 2 tx por mensaje -> 3 fragmentos MT101 (BUILD_FROM_TABLE absorbe el split).
        configuration.put("maxTransactionsPerMessage", 2);
        configuration.put("maxBytesPerMessage", 10000);
        configuration.put("fragmentSetIdTemplate", "E2E-${_processExecutionId}");
        configuration.put("replaceExisting", true);
        configuration.put("envelope", Map.of(
                "senderLt", "SGOBFRPPAXXX",
                "receiverLt", "BCPLPEPLXXXX",
                "uetrStrategy", "perMessage",
                "priority", "N"));
        configuration.put("sequenceA", Map.of(
                // ${messageIndex} obligatorio con >1 fragmento: :20: unico por fragmento.
                "sendersReferenceTemplate", "P${messageIndex}",
                "requestedExecutionDate", LocalDate.now().plusDays(1).toString(),
                "orderingCustomer", Map.of(
                        "option", "H",
                        "account", "001-10200200",
                        "nameAndAddress", List.of("EMPRESA E2E SAC", "LIMA PE"))));
        configuration.put("transactionMappings", Map.of(
                "transactionReferenceTemplate", "T${recordNumber}",
                "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
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

    private Map<String, Object> input(String sourceTaskRef, String sourceOutput) {
        return Map.of(
                "source", "task-output",
                "sourceTaskRef", sourceTaskRef,
                "sourceOutput", sourceOutput);
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

    private Number createSource(String name, Path file) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", name,
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

    private Number createCsvReader(String name) {
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
        return createReader(name, "CSV", readerConfiguration);
    }

    private Number createSwiftMtReader(String name) {
        return createReader(name, "SWIFT_MT", Map.of("encoding", "UTF-8"));
    }

    private Number createReader(String name, String type, Map<String, Object> configuration) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", name,
                        "readerType", type,
                        "active", true,
                        "configurationJson", json(configuration)))
        .when()
                .post("/api/reader-definitions")
        .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private long executeProcess(Number processId) {
        Number executionId = given()
                .contentType(ContentType.JSON)
                .body("{}")
        .when()
                .post("/api/process-executions/{processDefinitionId}", processId.longValue())
        .then()
                .statusCode(200)
                .extract()
                .path("id");
        return executionId.longValue();
    }

    private void awaitExecutionCompleted(long executionId) {
        long deadline = System.currentTimeMillis() + 60_000L;
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
                Thread.sleep(250L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        assertEquals("COMPLETED", status, () -> "execution " + executionId + " debe terminar COMPLETED");
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

    private void assertTaskDetailsContain(long executionId, String... snippets) {
        List<String> details = given()
                .when()
                        .get("/api/query/process-executions/{processExecutionId}/tasks", executionId)
                .then()
                        .statusCode(200)
                        .extract()
                        .jsonPath()
                        .getList("details", String.class);
        var joined = String.join("\n", details);
        for (var snippet : snippets) {
            assertTrue(joined.contains(snippet), () -> "No se encontro '" + snippet + "' en:\n" + joined);
        }
    }

    private long countRows(String tableName) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT count(*) FROM " + tableName)) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private void writeOutboundCsv(Path file) throws Exception {
        Files.createDirectories(file.getParent());
        try (BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
            writer.write("dni,nombre,cuenta,moneda,monto,bic,concepto,cargos");
            writer.newLine();
            for (int i = 1; i <= 6; i++) {
                writer.write(10_000_000 + i + ",BENEFICIARIO " + i
                        + ",00100000000" + i
                        + ",PEN,"
                        + (100 + i) + ".50"
                        + ",BCPLPEPLXXX,PAGO " + i
                        + ",SHA");
                writer.newLine();
            }
        }
    }

    private String inboundFinMessage() {
        return "{1:F01SGOBFRPPAXXX0000000000}"
                + "{2:I101BCPLPEPLXXXXN}"
                + "{3:{121:3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c}}"
                + "{4:\r\n"
                + ":20:INB1\r\n"
                + ":28D:1/1\r\n"
                + ":30:260609\r\n"
                + ":50H:/001-10200200\r\n"
                + "EMPRESA INBOUND SAC\r\n"
                + "LIMA PE\r\n"
                + ":52A:BCPLPEPLXXX\r\n"
                + ":21:ITX1\r\n"
                + ":32B:PEN20000,\r\n"
                + ":57A:BCPLPEPL\r\n"
                + ":59:/0072987654321\r\n"
                + "JUAN PEREZ\r\n"
                + ":70:SUELDO\r\n"
                + ":71A:OUR\r\n"
                + ":21:ITX2\r\n"
                + ":32B:PEN15500,5\r\n"
                + ":57A:BBVAPEPLXXX\r\n"
                + ":59:/0011123456789\r\n"
                + "MARIA GARCIA\r\n"
                + ":70:PROVEEDOR\r\n"
                + ":71A:SHA\r\n"
                + "-}"
                + "{5:{CHK:000000000000}}";
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
        private final AtomicInteger payRequests = new AtomicInteger();
        private final AtomicInteger statusRequests = new AtomicInteger();

        private LocalSwiftGateway(HttpServer server) {
            this.server = server;
        }

        static LocalSwiftGateway start() throws Exception {
            var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            var gateway = new LocalSwiftGateway(server);
            server.createContext("/v1/swift/mt101", exchange -> {
                exchange.getRequestBody().readAllBytes();
                var count = gateway.payRequests.incrementAndGet();
                var response = "{\"accepted\":true,\"gatewayReference\":\"GW-PAY-" + count + "\"}";
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.getBytes(StandardCharsets.UTF_8).length);
                exchange.getResponseBody().write(response.getBytes(StandardCharsets.UTF_8));
                exchange.close();
            });
            server.createContext("/v1/swift/status", exchange -> {
                gateway.statusRequests.incrementAndGet();
                var path = exchange.getRequestURI().getPath();
                var reference = path.substring(path.lastIndexOf('/') + 1);
                var response = "{\"status\":\"ACCEPTED\",\"gatewayReference\":\"GW-ST-" + reference + "\"}";
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.getBytes(StandardCharsets.UTF_8).length);
                exchange.getResponseBody().write(response.getBytes(StandardCharsets.UTF_8));
                exchange.close();
            });
            server.setExecutor(Executors.newCachedThreadPool());
            server.start();
            return gateway;
        }

        String payUrl() {
            return "http://127.0.0.1:" + server.getAddress().getPort() + "/v1/swift/mt101";
        }

        String statusUrl() {
            return "http://127.0.0.1:" + server.getAddress().getPort() + "/v1/swift/status";
        }

        int payRequests() {
            return payRequests.get();
        }

        int statusRequests() {
            return statusRequests.get();
        }

        @Override
        public void close() {
            server.stop(0);
        }
    }
}
