package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageFormatter;
import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageTransport;
import com.integrationhub.platform.provider.task.payments.spi.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.spi.ValidationRuleProvider;
import com.integrationhub.platform.provider.task.payments.swift.format.FinMt101Formatter;
import com.integrationhub.platform.provider.task.payments.swift.format.JsonMt101Formatter;
import com.integrationhub.platform.provider.task.payments.swift.format.XmlMt101Formatter;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.provider.task.payments.swift.transport.RestPaymentTransport;
import com.integrationhub.platform.provider.task.payments.swift.validation.Mt101StructuralRules;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.lang.annotation.Annotation;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.getAllServeEvents;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.reset;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test end-to-end de la vertical {@code 008-mensajeria-pagos} sub-catalogo
 * {@code swift/}: encadena los 4 task providers de slice 1-3 reproduciendo el
 * mecanismo del engine (mapa {@code taskOutputs} compartido entre tareas), con
 * Postgres real (Testcontainers) y gateway WireMock.
 *
 * <p>Pipeline ejercitado (espejo de la cadena del frontend):</p>
 * <pre>
 *   records CSV-like ──► MT101_BUILD ──► MT101_VALIDATE ──► MT101_ARCHIVE ──► MT101_PAY
 *                                                            (PG real)         (WireMock)
 * </pre>
 *
 * <p>El test NO pasa por la capa HTTP de Quarkus ni por
 * {@code ProcessTaskRuntimeService}; usa los providers directamente con el mismo
 * patron de {@code context.attributes().put("taskOutputs", ...)} que el engine
 * aplica. Esto valida la cadena de outputs entre tareas.</p>
 *
 * @covers spec 008-mensajeria-pagos T-012 (E2E outbound MVP)
 * @covers ADR-009
 */
@Testcontainers
@WireMockTest
class Mt101OutboundEndToEndIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payments_e2e")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101BuildTaskProvider buildProvider;
    private Mt101ValidateTaskProvider validateProvider;
    private Mt101ArchiveTaskProvider archiveProvider;
    private Mt101PayTaskProvider payProvider;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        prepareSchema();
        reset();

        // BUILD con 3 formateadores registrados.
        var formatters = List.<PaymentMessageFormatter>of(
                new JsonMt101Formatter(new ObjectMapper()),
                new XmlMt101Formatter(),
                new FinMt101Formatter());
        buildProvider = new Mt101BuildTaskProvider(new ListInstance<>(formatters));

        // VALIDATE con set estructural completo (7 reglas).
        var predicates = List.<ValidationPredicate>of(
                new Mt101StructuralRules.SendersReferenceLengthRule(),
                new Mt101StructuralRules.TransactionCountRule(),
                new Mt101StructuralRules.AmountPositiveRule(),
                new Mt101StructuralRules.CurrencyFormatRule(),
                new Mt101StructuralRules.ChargesValueRule(),
                new Mt101StructuralRules.TransactionReferenceLengthRule(),
                new Mt101StructuralRules.BeneficiaryRequiredRule());
        var ruleProvider = (ValidationRuleProvider) (rs, std, app) -> predicates.stream()
                .filter(p -> matches(rs, p.ruleSet()))
                .filter(p -> matches(std, p.standard()))
                .filter(p -> matches(app, p.appliesTo()))
                .toList();
        validateProvider = new Mt101ValidateTaskProvider(
                new ListInstance<>(List.of(ruleProvider)));

        // ARCHIVE con DataSource real (Testcontainers).
        archiveProvider = new Mt101ArchiveTaskProvider(dataSource, null);

        // PAY con RestPaymentTransport apuntando a WireMock.
        var transports = List.<PaymentMessageTransport>of(
                new RestPaymentTransport(new ObjectMapper()));
        payProvider = new Mt101PayTaskProvider(new ListInstance<>(transports));
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void runsFullOutboundPipelineFromRecordsToGateway(WireMockRuntimeInfo wm) throws Exception {
        // 0. Gateway acepta cualquier POST con 200 y devuelve un gatewayReference.
        stubFor(any(urlPathMatching("/v1/swift/mt101.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"accepted\":true,\"gatewayReference\":\"GW-E2E-001\"}")));

        // 1. Records "leidos" de un CSV (4 pagos en PEN/USD).
        var records = List.of(
                new ReadRecord(Map.of(
                        "dni", "12345678", "nombre", "Juan Perez",
                        "cuenta_beneficiario", "0072-987654321", "bic_beneficiario", "BCPLPEPL",
                        "moneda", "PEN", "monto", "20000.00",
                        "concepto", "Sueldo mayo", "cargos", "OUR")),
                new ReadRecord(Map.of(
                        "dni", "87654321", "nombre", "Maria Garcia",
                        "cuenta_beneficiario", "0011-123456789", "bic_beneficiario", "BBVAPEPLXXX",
                        "moneda", "PEN", "monto", "15500.50",
                        "concepto", "Proveedor", "cargos", "SHA")),
                new ReadRecord(Map.of(
                        "dni", "11223344", "nombre", "Carlos Rojas",
                        "cuenta_beneficiario", "0807-555111222", "bic_beneficiario", "SCBLPEPLXXX",
                        "moneda", "USD", "monto", "1200.00",
                        "concepto", "Reembolso", "cargos", "SHA")));

        // Mapa de taskOutputs compartido (lo que el engine pasa entre tareas).
        var taskOutputs = new LinkedHashMap<String, Object>();

        // 2. BUILD: invocacion directa sin engine. El provider lee `readResult`
        //    desde context.attributes y emite el Mt101Message con rawPayload JSON.
        var buildContext = newContext(100L, 1L, taskOutputs);
        buildContext.attributes().put("readResult", new ReadResult(records, records.size()));
        TaskResult buildResult = buildProvider.execute(buildContext, buildConfiguration());
        assertTrue(buildResult.success(), () -> "BUILD: " + buildResult.details());
        // Engine-equivalente: publica records bajo build-mt101.records.
        @SuppressWarnings("unchecked")
        var built = (List<Mt101Message>) buildResult.outputs().get("records");
        assertNotNull(built);
        assertEquals(1, built.size(), "BUILD emite 1 mensaje con 3 transacciones");
        assertEquals(3, built.get(0).transactions().size());
        taskOutputs.put("build-mt101.records", built);

        // 3. VALIDATE: consume build-mt101.records, no debe emitir issues blocking.
        var validateContext = newContext(100L, 2L, taskOutputs);
        TaskResult validateResult = validateProvider.execute(validateContext, validateConfiguration());
        assertTrue(validateResult.success(), () -> "VALIDATE: " + validateResult.details());
        assertEquals(0, validateResult.outputs().get("invalidCount"));

        // 4. ARCHIVE: persiste a Postgres (envelope + archive + 3 transactions).
        var archiveContext = newContext(100L, 3L, taskOutputs);
        TaskResult archiveResult = archiveProvider.execute(archiveContext, archiveConfiguration());
        assertTrue(archiveResult.success(), () -> "ARCHIVE: " + archiveResult.details());
        assertEquals(1, archiveResult.outputs().get("archivedCount"));
        assertEquals(1, countRows("mt101_archive"));
        assertEquals(1, countRows("swift_message_envelope"));
        assertEquals(3, countRows("mt101_transaction"));

        // 5. PAY: el archive publica build-mt101 reciclando los Mt101Message ya
        //    formateados para que PAY los consuma sin volver a renderizar.
        taskOutputs.put("archive-mt101.records", built);
        var payContext = newContext(100L, 4L, taskOutputs);
        TaskResult payResult = payProvider.execute(payContext, payConfiguration(wm.getHttpBaseUrl()));
        assertTrue(payResult.success(), () -> "PAY: " + payResult.details());
        assertEquals(1, payResult.outputs().get("sentCount"));
        assertEquals(1, payResult.outputs().get("acceptedCount"));
        assertEquals(0, payResult.outputs().get("rejectedCount"));

        // 6. Verifica que el gateway recibio el POST con la senders_reference como
        //    idempotency key.
        @SuppressWarnings("unchecked")
        var payRecords = (List<Map<String, Object>>) payResult.outputs().get("records");
        var sendersRef = (String) payRecords.get(0).get("sendersReference");
        assertNotNull(sendersRef);
        verify(postRequestedFor(urlPathMatching("/v1/swift/mt101.*"))
                .withHeader("Idempotency-Key", equalTo(sendersRef))
                .withHeader("Content-Type", equalTo("application/json")));
        assertEquals(1, getAllServeEvents().size(), "1 mensaje => 1 POST al gateway");
    }

    @Test
    void rejectedAtValidateStopsThePipeline(WireMockRuntimeInfo wm) throws Exception {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        // Records con monto negativo => VALIDATE debe fallar.
        var records = List.of(new ReadRecord(Map.of(
                "dni", "1", "nombre", "Bad",
                "cuenta_beneficiario", "X", "bic_beneficiario", "BCP",
                "moneda", "PEN", "monto", "-10.00",
                "concepto", "neg", "cargos", "OUR")));

        var taskOutputs = new LinkedHashMap<String, Object>();
        var buildContext = newContext(200L, 1L, taskOutputs);
        buildContext.attributes().put("readResult", new ReadResult(records, 1));
        var buildResult = buildProvider.execute(buildContext, buildConfiguration());
        assertTrue(buildResult.success());
        taskOutputs.put("build-mt101.records", buildResult.outputs().get("records"));

        var validateContext = newContext(200L, 2L, taskOutputs);
        var validateResult = validateProvider.execute(validateContext, validateConfiguration());

        assertFalse(validateResult.success(),
                "VALIDATE debe fallar por monto negativo (STRUCT.AMOUNT_POSITIVE)");
        assertEquals(1, validateResult.outputs().get("invalidCount"));
        assertEquals(0, getAllServeEvents().size(), "PAY no se invoca; gateway sin trafico");
        assertEquals(0, countRows("mt101_archive"), "ARCHIVE no se invoca");
    }

    // --- helpers ---

    private TaskContext newContext(Long processExecutionId, Long taskDefinitionId,
                                   Map<String, Object> taskOutputs) {
        var context = new TaskContext(processExecutionId, taskDefinitionId);
        context.attributes().put("taskOutputs", taskOutputs);
        return context;
    }

    private Map<String, Object> buildConfiguration() {
        return Map.of(
                "format", "JSON",
                "envelope", Map.of(
                        "senderLt", "SGOBFRPPAXXX",
                        "receiverLt", "BCPLPEPLXXXX",
                        "uetrStrategy", "perMessage",
                        "priority", "N"),
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "requestedExecutionDate", "2026-06-09",
                        "orderingCustomer", Map.of(
                                "option", "H",
                                "account", "001-10200200",
                                "nameAndAddress", List.of("EMPRESA INTEGRADORA SAC", "LIMA PE"))),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "TX-${recordNumber}-${dni}",
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of(
                                "option", "",
                                "accountField", "cuenta_beneficiario",
                                "nameAndAddressFields", List.of("nombre", "dni")),
                        "accountWithInstitution", Map.of("option", "A", "bicField", "bic_beneficiario"),
                        "remittanceInformationField", "concepto",
                        "detailsOfChargesField", "cargos"));
    }

    private Map<String, Object> validateConfiguration() {
        return Map.of(
                "executionMode", "once",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "ruleSet", "structural-mvp",
                "standard", "SWIFT",
                "appliesTo", "MT101",
                "failOn", "ERROR");
    }

    private Map<String, Object> archiveConfiguration() {
        return Map.of(
                "executionMode", "batch",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "retentionDays", 3650);
    }

    private Map<String, Object> payConfiguration(String baseUrl) {
        var config = new HashMap<String, Object>();
        config.put("transport", "REST");
        config.put("input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"));
        config.put("rest", Map.of(
                "url", baseUrl + "/v1/swift/mt101",
                "method", "POST",
                "contentType", "application/json"));
        config.put("retryPolicy", Map.of("maxRetries", 0, "retryOn", List.of()));
        return config;
    }

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_transaction");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("drop table if exists swift_message_envelope");
            statement.executeUpdate(
                    "create table swift_message_envelope (" +
                    " id bigserial primary key," +
                    " message_type char(3) not null," +
                    " sender_lt char(12)," +
                    " receiver_lt char(12)," +
                    " session bigint, sequence bigint," +
                    " uetr varchar(36), priority char(1)," +
                    " raw_payload text, payload_hash char(64)," +
                    " parsed_at timestamp not null default current_timestamp," +
                    " source_file_name varchar(255)," +
                    " process_execution_id bigint)");
            statement.executeUpdate(
                    "create table mt101_archive (" +
                    " id bigserial primary key," +
                    " envelope_id bigint references swift_message_envelope(id)," +
                    " senders_reference varchar(16) not null," +
                    " customer_specified_reference varchar(16)," +
                    " message_index integer, message_total integer," +
                    " requested_execution_date date," +
                    " instructing_party_kind char(1), instructing_party_value text," +
                    " ordering_customer_kind char(1), ordering_customer_account varchar(34)," +
                    " ordering_customer_name_addr text," +
                    " account_servicing_kind char(1), account_servicing_value text," +
                    " status varchar(20) not null default 'PENDING'," +
                    " format char(4)," +
                    " created_at timestamp not null default current_timestamp," +
                    " retention_until date)");
            statement.executeUpdate(
                    "create table mt101_transaction (" +
                    " id bigserial primary key," +
                    " archive_id bigint not null references mt101_archive(id) on delete cascade," +
                    " sequence_number integer not null," +
                    " transaction_reference varchar(16) not null," +
                    " fx_deal_reference varchar(16), instruction_code varchar(35)," +
                    " amount_currency char(3) not null, amount_value numeric(18,3) not null," +
                    " ordering_customer_kind char(1), ordering_customer_account varchar(34)," +
                    " ordering_customer_name_addr text," +
                    " account_servicing_kind char(1), account_servicing_value text," +
                    " intermediary text, account_with_institution text," +
                    " beneficiary_kind char(1), beneficiary_account varchar(34)," +
                    " beneficiary_name_addr text," +
                    " remittance_information text, regulatory_reporting text," +
                    " original_amount_currency char(3), original_amount_value numeric(18,3)," +
                    " details_of_charges char(3) not null, charges_account varchar(34)," +
                    " exchange_rate numeric(15,8))");
        }
    }

    private int countRows(String table) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from " + table)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private static boolean matches(String requested, String candidate) {
        return requested == null || requested.isBlank() || "*".equals(requested)
                || requested.equalsIgnoreCase(candidate);
    }

    /** Instance CDI minima sobre una lista, para no arrancar el contenedor en este IT. */
    private static final class ListInstance<T> implements Instance<T> {
        private final List<T> items;

        ListInstance(List<T> items) {
            this.items = items;
        }

        @Override public Instance<T> select(Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return items.isEmpty(); }
        @Override public boolean isAmbiguous() { return items.size() > 1; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return items.iterator(); }
        @Override public T get() {
            if (items.isEmpty()) throw new IllegalStateException("No items");
            return items.get(0);
        }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
