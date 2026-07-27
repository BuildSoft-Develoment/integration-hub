package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-003, RF-014, RF-021, T-008, T-020
 */
@Testcontainers
class Mt101ArchiveTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payments_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private Mt101ArchiveTaskProvider provider;
    private DataSource dataSource;

    @BeforeEach
    void setUpSchema() throws Exception {
        dataSource = dataSource();
        provider = new Mt101ArchiveTaskProvider(dataSource, null);
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
                    " session bigint," +
                    " sequence bigint," +
                    " uetr varchar(36)," +
                    " priority char(1)," +
                    " raw_payload text," +
                    " payload_hash char(64)," +
                    " parsed_at timestamp not null default current_timestamp," +
                    " source_file_name varchar(255)," +
                    " process_execution_id bigint)");
            statement.executeUpdate(
                    "create table mt101_archive (" +
                    " id bigserial primary key," +
                    " envelope_id bigint references swift_message_envelope(id)," +
                    " sender_lt char(12)," +
                    " senders_reference varchar(16) not null," +
                    " customer_specified_reference varchar(16)," +
                    " message_index integer," +
                    " message_total integer," +
                    " requested_execution_date date," +
                    " instructing_party_kind char(1)," +
                    " instructing_party_value text," +
                    " ordering_customer_kind char(1)," +
                    " ordering_customer_account varchar(34)," +
                    " ordering_customer_name_addr text," +
                    " account_servicing_kind char(1)," +
                    " account_servicing_value text," +
                    " status varchar(20) not null default 'PENDING'," +
                    " format char(4)," +
                    " process_execution_id bigint," +
                    " created_at timestamp not null default current_timestamp," +
                    " updated_at timestamp not null default current_timestamp," +
                    " retention_until date)");
            statement.executeUpdate(
                    "create table mt101_transaction (" +
                    " id bigserial primary key," +
                    " archive_id bigint not null references mt101_archive(id) on delete cascade," +
                    " sequence_number integer not null," +
                    " transaction_reference varchar(16) not null," +
                    " fx_deal_reference varchar(16)," +
                    " instruction_code varchar(35)," +
                    " amount_currency char(3) not null," +
                    " amount_value numeric(18,3) not null," +
                    " ordering_customer_kind char(1)," +
                    " ordering_customer_account varchar(34)," +
                    " ordering_customer_name_addr text," +
                    " account_servicing_kind char(1)," +
                    " account_servicing_value text," +
                    " intermediary text," +
                    " account_with_institution text," +
                    " beneficiary_kind char(1)," +
                    " beneficiary_account varchar(34)," +
                    " beneficiary_name_addr text," +
                    " remittance_information text," +
                    " regulatory_reporting text," +
                    " original_amount_currency char(3)," +
                    " original_amount_value numeric(18,3)," +
                    " details_of_charges char(3) not null," +
                    " charges_account varchar(34)," +
                    " exchange_rate numeric(15,8))");
        }
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void archivesEnvelopeArchiveAndTransactionsForSingleMessage() throws Exception {
        var message = sampleMessage("PROC-42", List.of(
                sampleTransaction(1, "TX-1", "PEN", "100.50", "OUR"),
                sampleTransaction(2, "TX-2", "PEN", "250.00", "SHA")
        ));
        var context = contextWith(List.of(message), 7L);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, result.outputs().get("archivedCount"));
        assertEquals("mt101_archive", result.outputs().get("targetTable"));

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(1, records.size());
        assertNotNull(records.get(0).get("archiveId"));
        assertNotNull(records.get(0).get("envelopeId"));
        assertEquals(message, records.get(0).get("message"));
        assertEquals(64, ((String) records.get(0).get("hash")).length(), "SHA-256 hex es 64 chars");
        assertEquals(false, records.get(0).get("encrypted"));

        assertEquals(1, countRows("swift_message_envelope"));
        assertEquals(1, countRows("mt101_archive"));
        assertEquals(2, countRows("mt101_transaction"));
        assertEquals("PROC-42", singleString("select senders_reference from mt101_archive"));
        assertEquals("JSON", singleString("select format from mt101_archive").trim());
    }

    @Test
    void archivesSequenceBOrderingCustomerAndExtendedTransactionFields() throws Exception {
        var tx = new Mt101Message.Transaction(
                1, "TX-EXT", "FX-1", "INTC",
                new Mt101Message.Amount("USD", new BigDecimal("10.25")),
                new Mt101Message.Party("H", "DEBIT-001", null, List.of("SUBSIDIARIA UNO")),
                new Mt101Message.Party("A", null, "SERVUS33XXX", List.of()),
                new Mt101Message.Party("A", null, "INTERUS33XXX", List.of()),
                new Mt101Message.Party("A", null, "ACCTUS33XXX", List.of()),
                new Mt101Message.Party("", "BENE-001", null, List.of("BENE UNO")),
                "invoice 1", "REG-1",
                new Mt101Message.Amount("EUR", new BigDecimal("9.90")),
                "SHA", "CHARGE-001", new BigDecimal("1.12345678"));
        var message = new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                new Mt101Message.SequenceA("PROC-EXT", "CREF", 1, 1, LocalDate.of(2026, 6, 9),
                        new Mt101Message.Party("L", null, null, List.of("MATRIZ")),
                        null, null, null),
                List.of(tx),
                new Mt101Message.ControlTotals(1, Map.of("USD", new BigDecimal("10.25"))),
                "{\"sendersReference\":\"PROC-EXT\"}",
                "JSON");

        provider.execute(contextWith(List.of(message), 7L), Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertEquals("L", singleString("select instructing_party_kind from mt101_archive").trim());
        assertEquals("MATRIZ", singleString("select instructing_party_value from mt101_archive"));
        assertEquals("H", singleString("select ordering_customer_kind from mt101_transaction").trim());
        assertEquals("DEBIT-001", singleString("select ordering_customer_account from mt101_transaction"));
        assertEquals("SERVUS33XXX", singleString("select account_servicing_value from mt101_transaction"));
        assertEquals("INTERUS33XXX", singleString("select intermediary from mt101_transaction"));
        assertEquals("ACCTUS33XXX", singleString("select account_with_institution from mt101_transaction"));
        assertEquals("REG-1", singleString("select regulatory_reporting from mt101_transaction"));
        assertEquals("EUR", singleString("select original_amount_currency from mt101_transaction").trim());
        assertEquals("CHARGE-001", singleString("select charges_account from mt101_transaction"));
    }

    @Test
    void readsMessagesEmbeddedInArchiveRecordsFromPreviousTask() {
        var message = sampleMessageWithRawPayload("PROC-MAP", "{\"sendersReference\":\"PROC-MAP\"}");
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(
                "source.records", List.of(Map.of("archiveId", 88L, "message", message))
        ));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "source", "sourceOutput", "records")
        ));

        assertTrue(result.success(), () -> "expected map embedded message to archive, got: " + result.details());
        assertEquals(1, result.outputs().get("archivedCount"));
    }

    @Test
    void storesPlaintextWhenEncryptionNotConfigured() throws Exception {
        var rawPayload = "{\"sendersReference\":\"PROC-PLAIN\"}";
        var message = sampleMessageWithRawPayload("PROC-PLAIN", rawPayload);
        var context = contextWith(List.of(message), 1L);

        provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        var stored = singleString("select raw_payload from swift_message_envelope");
        assertEquals(rawPayload, stored);
    }

    @Test
    void encryptsRawPayloadWhenEncryptionConfigured() throws Exception {
        var rawPayload = "{\"sendersReference\":\"PROC-CRYPT\"}";
        var message = sampleMessageWithRawPayload("PROC-CRYPT", rawPayload);
        var context = contextWith(List.of(message), 1L);

        provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "encryptColumn", "raw_payload",
                "encryptionSecretRef", "test-archive-key-2026"
        ));

        var stored = singleString("select raw_payload from swift_message_envelope");
        assertTrue(stored.startsWith("AES-GCM-256:"));
        assertFalse(stored.contains("PROC-CRYPT"));

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) java.util.Optional.<List<Map<String, Object>>>empty().orElseGet(java.util.Collections::emptyList);
        // verifico el output flag tambien:
        var contextRecheck = contextWith(List.of(sampleMessageWithRawPayload("PROC-CRYPT-B", rawPayload)), 2L);
        var result = provider.execute(contextRecheck, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "encryptColumn", "raw_payload",
                "encryptionSecretRef", "another-key"
        ));
        @SuppressWarnings("unchecked")
        var outRecords = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(true, outRecords.get(0).get("encrypted"));
    }

    @Test
    void computesSha256OfOriginalPayloadEvenWhenEncrypted() throws Exception {
        var rawPayload = "{\"k\":\"v\"}";
        var message = sampleMessageWithRawPayload("PROC-HASH", rawPayload);
        var context = contextWith(List.of(message), 1L);
        var expectedHash = sha256Hex(rawPayload);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "encryptColumn", "raw_payload",
                "encryptionSecretRef", "any-key"
        ));

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(expectedHash, records.get(0).get("hash"));
        assertEquals(expectedHash, singleString("select payload_hash from swift_message_envelope"));
    }

    @Test
    void resolvesSecretReferenceThroughJsonConfigurationMapperAndEncrypts() throws Exception {
        // @covers spec 008-mensajeria-pagos RF-014 (cifrado por columna del raw_payload
        // usando clave resuelta vía ${secret:...} antes de invocar al provider).
        var mapper = new JsonConfigurationMapper(new ObjectMapper(),
                new SecretResolver(List.of(new SecretValueProvider() {
                    @Override
                    public boolean supports(String source) {
                        return "secret".equalsIgnoreCase(source);
                    }

                    @Override
                    public Optional<String> resolve(String reference) {
                        return "archive_key".equals(reference)
                                ? Optional.of("vault-resolved-key-2026")
                                : Optional.empty();
                    }
                })));

        var configurationJson = "{"
                + "\"input\":{\"sourceTaskRef\":\"build-mt101\",\"sourceOutput\":\"records\"},"
                + "\"encryptColumn\":\"raw_payload\","
                + "\"encryptionSecretRef\":\"${secret:archive_key}\""
                + "}";

        var configuration = mapper.toMap(configurationJson);
        assertEquals("vault-resolved-key-2026", configuration.get("encryptionSecretRef"),
                "JsonConfigurationMapper must expand ${secret:...} before the provider is invoked");

        var rawPayload = "{\"sendersReference\":\"PROC-SEC\"}";
        var message = sampleMessageWithRawPayload("PROC-SEC", rawPayload);
        var context = contextWith(List.of(message), 99L);

        var result = provider.execute(context, configuration);

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(true, records.get(0).get("encrypted"));

        var stored = singleString("select raw_payload from swift_message_envelope");
        assertTrue(stored.startsWith("AES-GCM-256:"));
        assertFalse(stored.contains("PROC-SEC"));
    }

    @Test
    void rejectsUnresolvedSecretPlaceholderInEncryptionSecretRef() throws Exception {
        // @covers spec 008-mensajeria-pagos RF-014 (invariante de seguridad: el provider
        // se niega a cifrar con un placeholder ${secret:...} sin resolver).
        var message = sampleMessageWithRawPayload("PROC-GUARD", "{\"k\":\"v\"}");
        var context = contextWith(List.of(message), 5L);

        var error = assertThrows(IllegalStateException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "encryptColumn", "raw_payload",
                "encryptionSecretRef", "${secret:archive_key}"
        )));

        assertTrue(error.getMessage().contains("encryptionSecretRef llegó sin resolver"),
                () -> "mensaje inesperado: " + error.getMessage());
        assertEquals(0, countRows("swift_message_envelope"),
                "no debe persistir nada cuando el placeholder no se resolvió");
    }

    @Test
    void skipsWhenNoMessages() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void rollbacksOnFailure() throws Exception {
        // Mensaje sin transactions causa fallo a nivel de constraint (FK al archivo aun no
        // creado para transactions vacios es OK, pero forzamos error setting transactionRef null
        // que viola NOT NULL en mt101_transaction).
        var brokenTx = new Mt101Message.Transaction(
                1, null,  // transaction_reference NOT NULL => fallara
                null, null,
                new Mt101Message.Amount("PEN", new BigDecimal("1")),
                null, null, null, null,
                new Mt101Message.Party("", "ACC", null, List.of()),
                null, null, null, "OUR", null, null);
        var message = new Mt101Message(
                new Mt101Message.Envelope("AAA", "BBB", "u", "N"),
                new Mt101Message.SequenceA("PROC-FAIL", null, 1, 1, LocalDate.now(),
                        null, null, null, null),
                List.of(brokenTx),
                new Mt101Message.ControlTotals(1, Map.of("PEN", BigDecimal.ONE)),
                "{\"p\":1}", "JSON");
        var context = contextWith(List.of(message), 1L);

        assertThrows(IllegalStateException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        )));

        assertEquals(0, countRows("swift_message_envelope"));
        assertEquals(0, countRows("mt101_archive"));
        assertEquals(0, countRows("mt101_transaction"));
    }

    // --- helpers ---

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private TaskContext contextWith(List<Mt101Message> messages, Long processExecutionId) {
        var context = new TaskContext(processExecutionId, 1L);
        context.attributes().put("taskOutputs", Map.of("build-mt101.records", messages));
        return context;
    }

    private Mt101Message sampleMessage(String sendersReference, List<Mt101Message.Transaction> transactions) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX",
                        "3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c", "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001-10200200", null, List.of("ACME SAC")),
                        new Mt101Message.Party("A", null, "BCPLPEPLXXX", List.of()),
                        null),
                transactions,
                new Mt101Message.ControlTotals(transactions.size(), Map.of("PEN", new BigDecimal("100"))),
                "{\"sendersReference\":\"" + sendersReference + "\"}",
                "JSON");
    }

    private Mt101Message sampleMessageWithRawPayload(String sendersReference, String rawPayload) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100")),
                        null, null, null, null,
                        new Mt101Message.Party("", "BENE", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100"))),
                rawPayload, "JSON");
    }

    private Mt101Message.Transaction sampleTransaction(int seq, String ref, String currency,
                                                       String amount, String charges) {
        return new Mt101Message.Transaction(
                seq, ref, null, null,
                new Mt101Message.Amount(currency, new BigDecimal(amount)),
                null, null, null,
                new Mt101Message.Party("A", null, "BCPLPEPL", List.of()),
                new Mt101Message.Party("", "0072-" + ref, null, List.of("BENE " + ref)),
                "concepto " + ref, null, null, charges, null, null);
    }

    private int countRows(String table) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from " + table)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private String singleString(String query) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            rs.next();
            return rs.getString(1);
        }
    }

    private String sha256Hex(String input) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(
                    digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
