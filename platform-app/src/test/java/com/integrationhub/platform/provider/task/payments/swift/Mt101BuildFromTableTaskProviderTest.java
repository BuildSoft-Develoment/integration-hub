package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.spi.task.payments.PaymentMessageFormatter;
import com.integrationhub.platform.provider.task.payments.swift.format.JsonMt101Formatter;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class Mt101BuildFromTableTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payments_massive_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101BuildFromTableTaskProvider provider;
    private Mt101FragmentStore fragmentStore;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        var buildProvider = new Mt101BuildTaskProvider(new OneFormatterInstance(new JsonMt101Formatter(objectMapper)));
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        provider = new Mt101BuildFromTableTaskProvider(
                dataSource,
                null,
                new JsonConfigurationMapper(),
                buildProvider,
                fragmentStore);
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_rebuild_selection");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key,"
                    + "process_execution_id bigint,"
                    + "task_definition_id bigint,"
                    + "record_index integer,"
                    + "source_file_hash varchar(64),"
                    + "payload_json text not null)");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key,"
                    + "fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint,"
                    + "task_definition_id bigint,"
                    + "source_table varchar(255),"
                    + "source_row_from bigint,"
                    + "source_row_to bigint,"
                    + "staging_id_from bigint,"
                    + "staging_id_to bigint,"
                    + "source_record_from bigint,"
                    + "source_record_to bigint,"
                    + "source_file_hash varchar(64),"
                    + "source_records_json text,"
                    + "fragment_index integer not null,"
                    + "fragment_total integer not null,"
                    + "senders_reference varchar(16) not null,"
                    + "payload_hash char(64) not null,"
                    + "raw_payload text not null,"
                    + "message_json text not null,"
                    + "status varchar(20) not null default 'BUILT',"
                    + "error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key,"
                    + "fragment_id bigint references mt101_build_fragment(id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null,"
                    + "original_fragment_set_id varchar(80),"
                    + "source_file_hash varchar(64),"
                    + "source_record_number bigint not null,"
                    + "staging_id bigint,"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16),"
                    + "current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80),"
                    + "status varchar(30) not null default 'BUILT',"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_mt101_fragment_record_current on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number)");
            statement.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key,"
                    + "rebuild_run_id varchar(80) not null,"
                    + "fragment_set_id varchar(80) not null,"
                    + "source_file_hash varchar(64),"
                    + "source_record_number bigint not null,"
                    + "record_index bigint not null,"
                    + "staging_id bigint,"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "status varchar(30) not null default 'SELECTED',"
                    + "created_at timestamp not null default current_timestamp)");
            insertRow(statement, "BEN1", "10.00", 1);
            insertRow(statement, "BEN2", "20.00", 2);
            insertRow(statement, "BEN3", "30.00", 3);
        }
    }

    @Test
    void buildsPersistedFragmentsFromStagingRows() throws Exception {
        var context = new TaskContext(100L, 30L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));

        var result = provider.execute(context, Map.of(
                "taskRef", "build-massive",
                "input", Map.of("sourceTaskRef", "stage", "sourceOutput", "table"),
                "format", "JSON",
                "maxTransactionsPerMessage", 2,
                "maxBytesPerMessage", 10000,
                "fragmentSetIdTemplate", "SET-${_processExecutionId}-${_taskDefinitionId}",
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "P${messageIndex}",
                        "requestedExecutionDate", "2026-06-09",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "TX-${recordNumber}",
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario"),
                        "detailsOfChargesField", "cargos"
                )
        ));

        assertTrue(result.success(), result.details());
        assertEquals(2, result.outputs().get("fragmentCount"));
        assertEquals(3L, result.outputs().get("transactionCount"));

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var messages = fragmentStore.readMessages(fragmentSource);
        assertEquals(2, messages.size());
        assertEquals(1, messages.get(0).sequenceA().messageIndex());
        assertEquals(2, messages.get(0).sequenceA().messageTotal());
        assertEquals(2, messages.get(0).transactions().size());
        assertEquals("TX-3", messages.get(1).transactions().get(0).transactionReference());
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from mt101_fragment_record")) {
            assertTrue(rs.next());
            assertEquals(3, rs.getInt(1), "cada transaccion queda trazada en mt101_fragment_record");
        }
    }

    @Test
    void bisectsFragmentsWhenPayloadExceedsMaxBytes() throws Exception {
        // maxTransactionsPerMessage=3 metria las 3 txs en un fragmento, pero el
        // payload JSON resultante no cabe en maxBytes; la fase de planificacion
        // debe bisectar en fragmentos mas chicos en vez de abortar.
        var context = new TaskContext(100L, 31L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));

        // Calibracion: el header del mensaje domina el tamano, asi que el limite se
        // fija con el costo MARGINAL por transaccion: caben 1 tx, no caben 2.
        var singleTxBytes = measureFragmentBytes(97L, 1);
        var threeTxBytes = measureFragmentBytes(98L, 3);
        var perTxBytes = (threeTxBytes - singleTxBytes) / 2;
        assertTrue(perTxBytes > 16, "el costo marginal por tx debe superar el ensanche de :28D: en medicion");
        var maxBytes = singleTxBytes + perTxBytes - 1;

        var result = provider.execute(context, baseConfiguration(31L, Map.of(
                "maxTransactionsPerMessage", 3,
                "maxBytesPerMessage", maxBytes)));

        assertTrue(result.success(), result.details());
        assertEquals(3, result.outputs().get("fragmentCount"),
                "3 txs con limite de ~1 tx por mensaje deben dar 3 fragmentos");

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var messages = fragmentStore.readMessages(fragmentSource);
        assertEquals(3, messages.size());
        for (var message : messages) {
            assertEquals(3, message.sequenceA().messageTotal(), ":28D: total debe ser el definitivo");
            assertTrue(message.rawPayload().getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= maxBytes,
                    "ningun fragmento debe exceder maxBytes");
        }
        assertEquals(List.of(1, 2, 3),
                messages.stream().map(m -> m.sequenceA().messageIndex()).toList());
    }

    @Test
    void rejectsMultiFragmentSetWithoutMessageIndexInReferenceTemplate() {
        var context = new TaskContext(100L, 32L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));

        var configuration = new java.util.LinkedHashMap<String, Object>(baseConfiguration(32L, Map.of(
                "maxTransactionsPerMessage", 2,
                "maxBytesPerMessage", 10000)));
        configuration.put("sequenceA", Map.of(
                "sendersReferenceTemplate", "FIXED-REF",
                "requestedExecutionDate", "2026-06-09",
                "orderingCustomer", Map.of("option", "H", "account", "001")));

        var error = org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> provider.execute(context, configuration));
        assertTrue(error.getMessage().contains("${messageIndex}"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void rejectsDuplicateTransactionReferencesInsideFragment() {
        var context = new TaskContext(100L, 35L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));

        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.execute(context, baseConfiguration(35L, Map.of(
                        "maxTransactionsPerMessage", 3,
                        "maxBytesPerMessage", 10000,
                        "transactionMappings", transactionMappings("DUP")))));

        assertTrue(error.getMessage().contains("duplicate :21:"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void failsFastWhenFragmentCountExceeds28dLimit() {
        // 99999 cabe; 100000 excede el :28D: 5n. El guard se prueba en aislado
        // porque materializar 100k fragmentos reales seria inviable en un test.
        provider.guardFragmentCount(99999); // no lanza
        var error = org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> provider.guardFragmentCount(100_000));
        assertTrue(error.getMessage().contains("exceeding the :28D: limit"),
                () -> "mensaje inesperado: " + error.getMessage());
        assertTrue(error.getMessage().contains("maxTransactionsPerMessage"),
                "el mensaje debe ser accionable");
    }

    @Test
    void payGateOnlyReadsArchivedFragmentsByDefault() throws Exception {
        // Construye 2 fragmentos BUILT; sin pasar por VALIDATE+ARCHIVE, el default
        // de PAY (["ARCHIVED"]) no debe leer ninguno. Marcando uno como ARCHIVED,
        // solo ese queda elegible.
        var context = new TaskContext(100L, 33L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(33L, Map.of(
                "maxTransactionsPerMessage", 2,
                "maxBytesPerMessage", 10000)));
        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");

        var archivedOnly = new java.util.ArrayList<com.integrationhub.platform.spi.task.payments.Mt101Message>();
        fragmentStore.forEachPage(fragmentSource, List.of("ARCHIVED"), 50, archivedOnly::addAll);
        assertEquals(0, archivedOnly.size(), "fragmentos BUILT no deben ser elegibles para PAY");

        var built = fragmentStore.readMessages(fragmentSource, List.of("BUILT"));
        assertEquals(2, built.size());
        fragmentStore.markStatus(fragmentSource, built.get(0).sequenceA().sendersReference(), "ARCHIVED", null);

        fragmentStore.forEachPage(fragmentSource, List.of("ARCHIVED"), 50, archivedOnly::addAll);
        assertEquals(1, archivedOnly.size(), "solo el fragmento ARCHIVED queda elegible");
    }

    @Test
    void forEachPagePaginatesWithKeysetAcrossPages() throws Exception {
        var context = new TaskContext(100L, 34L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(34L, Map.of(
                "maxTransactionsPerMessage", 1,
                "maxBytesPerMessage", 10000)));
        assertEquals(3, result.outputs().get("fragmentCount"));

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var pages = new java.util.ArrayList<Integer>();
        var all = new java.util.ArrayList<com.integrationhub.platform.spi.task.payments.Mt101Message>();
        fragmentStore.forEachPage(fragmentSource, List.of("BUILT"), 2, page -> {
            pages.add(page.size());
            all.addAll(page);
        });
        assertEquals(List.of(2, 1), pages, "pageSize=2 sobre 3 fragmentos = paginas de 2 y 1");
        assertEquals(List.of(1, 2, 3), all.stream().map(m -> m.sequenceA().messageIndex()).toList(),
                "el orden por fragment_index debe preservarse entre paginas");
    }

    @Test
    void lookupBySourceRowUsesFileRowNotStagingId() throws Exception {
        // Reproduce produccion: los ids de staging son autoincrementales globales
        // (arrancan altos), distintos del numero de fila del archivo. El lookup debe
        // resolver por fila del archivo (1-based), no por id de staging.
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("delete from staging_record");
            statement.executeUpdate("alter sequence staging_record_id_seq restart with 8500000");
            insertRow(statement, "BEN1", "10.00", 1);   // fila 1, staging id 8500000
            insertRow(statement, "BEN2", "20.00", 2);   // fila 2, staging id 8500001
            insertRow(statement, "BEN3", "30.00", 3);   // fila 3, staging id 8500002
        }

        var context = new TaskContext(100L, 77L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(77L, Map.of(
                "maxTransactionsPerMessage", 2,
                "maxBytesPerMessage", 10000)));
        assertTrue(result.success(), result.details());

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            // El primer fragmento cubre filas 1-2; sus ids de staging son millones.
            try (var rs = statement.executeQuery("select staging_id_from, staging_id_to, "
                    + "source_record_from, source_record_to, source_file_hash "
                    + "from mt101_build_fragment order by fragment_index limit 1")) {
                assertTrue(rs.next());
                assertTrue(rs.getLong("staging_id_from") >= 8500000L, "id tecnico de staging es alto");
                assertEquals(1L, rs.getLong("source_record_from"), "fila del archivo es 1-based");
                assertEquals(2L, rs.getLong("source_record_to"));
                assertEquals("testhash", rs.getString("source_file_hash"));
            }
            // Buscar la fila 1 del archivo SI encuentra el fragmento (clave nueva)...
            try (var rs = statement.executeQuery("select count(*) from mt101_build_fragment "
                    + "where source_record_from <= 1 and source_record_to >= 1")) {
                assertTrue(rs.next());
                assertEquals(1, rs.getInt(1), "el lookup por fila del archivo encuentra el fragmento");
            }
            // ...mientras que el lookup viejo por id de staging (que valia source_row_from)
            // NO encontraria la fila 1: prueba de que el bug original esta corregido.
            try (var rs = statement.executeQuery("select count(*) from mt101_build_fragment "
                    + "where source_row_from <= 1 and source_row_to >= 1")) {
                assertTrue(rs.next());
                assertEquals(0, rs.getInt(1), "el id de staging nunca coincide con la fila 1");
            }
        }
    }

    @Test
    void buildsOnlyFilteredRecordIndexes() throws Exception {
        // Rebuild selectivo: construir SOLO las filas record_index 0 y 2 (BEN1, BEN3),
        // saltando BEN2. Cierra el ciclo "reprocesar solo lo necesario".
        var context = new TaskContext(100L, 88L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(88L, Map.of(
                "maxTransactionsPerMessage", 10,
                "maxBytesPerMessage", 10000,
                "source", Map.of("recordIndexIn", List.of(0, 2)),
                "transactionMappings", transactionMappings("TX-${_sourceRecordNumber}"))));
        assertTrue(result.success(), result.details());
        assertEquals(2L, result.outputs().get("transactionCount"), "solo se construyen 2 de 3 filas");
        assertEquals(2, result.outputs().get("fragmentCount"),
                "filas no contiguas no deben fingir un rango source_record continuo");

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var messages = fragmentStore.readMessages(fragmentSource);
        var accounts = messages.stream()
                .flatMap(m -> m.transactions().stream())
                .map(t -> t.beneficiary().account())
                .sorted()
                .toList();
        assertEquals(List.of("BEN1", "BEN3"), accounts, "BEN2 (record_index 1) queda fuera");
        var references = messages.stream()
                .flatMap(m -> m.transactions().stream())
                .map(t -> t.transactionReference())
                .sorted()
                .toList();
        assertEquals(List.of("TX-1", "TX-3"), references,
                "el build filtrado puede usar la fila fuente estable en templates correctivos");
    }

    @Test
    void buildsOnlyRowsSelectedByRebuildRun() throws Exception {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("insert into mt101_rebuild_selection "
                     + "(rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, record_index) "
                     + "values ('RUN-1', 'SET-OLD', 'testhash', ?, ?)")) {
            statement.setLong(1, 1L);
            statement.setLong(2, 0L);
            statement.addBatch();
            statement.setLong(1, 3L);
            statement.setLong(2, 2L);
            statement.addBatch();
            statement.executeBatch();
        }
        var context = new TaskContext(100L, 89L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(89L, Map.of(
                "maxTransactionsPerMessage", 10,
                "maxBytesPerMessage", 10000,
                "source", Map.of("rebuildRunId", "RUN-1"),
                "transactionMappings", transactionMappings("TX-${_sourceRecordNumber}"))));
        assertTrue(result.success(), result.details());
        assertEquals(2L, result.outputs().get("transactionCount"));

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var references = fragmentStore.readMessages(fragmentSource).stream()
                .flatMap(m -> m.transactions().stream())
                .map(t -> t.transactionReference())
                .sorted()
                .toList();
        assertEquals(List.of("TX-1", "TX-3"), references);
    }

    @Test
    void neverMixesFilesInOneFragment() throws Exception {
        // #8 multiarchivo: dos archivos en la misma ejecucion (hashes distintos), contiguos.
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("delete from staging_record");
            insertHashed(statement, "A1", "10.00", 0, "hashAAAA");
            insertHashed(statement, "A2", "20.00", 1, "hashAAAA");
            insertHashed(statement, "B1", "30.00", 2, "hashBBBB");
            insertHashed(statement, "B2", "40.00", 3, "hashBBBB");
        }
        var context = new TaskContext(100L, 91L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        // maxTransactionsPerMessage=10: sin el split por archivo, las 4 filas caerian en 1 fragmento.
        var result = provider.execute(context, baseConfiguration(91L, Map.of(
                "maxTransactionsPerMessage", 10, "maxBytesPerMessage", 10000)));
        assertTrue(result.success(), result.details());
        assertEquals(2, result.outputs().get("fragmentCount"), "un fragmento por archivo, no mezclados");

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select source_file_hash, count(*) from mt101_build_fragment "
                     + "group by source_file_hash order by source_file_hash")) {
            var hashes = new java.util.ArrayList<String>();
            while (rs.next()) {
                hashes.add(rs.getString(1));
                assertEquals(1, rs.getInt(2), "un fragmento por hash de archivo");
            }
            assertEquals(List.of("hashAAAA", "hashBBBB"), hashes, "cada fragmento lleva el hash de su archivo");
        }
    }

    private void insertHashed(Statement statement, String account, String amount, int recordIndex, String hash) throws Exception {
        statement.executeUpdate("insert into staging_record(process_execution_id, task_definition_id, record_index, source_file_hash, payload_json) values "
                + "(100, 20, " + recordIndex + ", '" + hash + "', '{\"moneda\":\"PEN\",\"monto\":\"" + amount
                + "\",\"cuenta_beneficiario\":\"" + account + "\",\"cargos\":\"OUR\"}')");
    }

    private Map<String, Object> baseConfiguration(long taskDefinitionId, Map<String, Object> overrides) {
        var configuration = new java.util.LinkedHashMap<String, Object>();
        configuration.put("taskRef", "build-massive-" + taskDefinitionId);
        configuration.put("input", Map.of("sourceTaskRef", "stage", "sourceOutput", "table"));
        configuration.put("format", "JSON");
        configuration.put("fragmentSetIdTemplate", "SET-${_processExecutionId}-${_taskDefinitionId}");
        configuration.put("sequenceA", Map.of(
                "sendersReferenceTemplate", "P${messageIndex}",
                "requestedExecutionDate", "2026-06-09",
                "orderingCustomer", Map.of("option", "H", "account", "001")));
        configuration.put("transactionMappings", transactionMappings("TX-${recordNumber}"));
        configuration.putAll(overrides);
        return configuration;
    }

    private Map<String, Object> transactionMappings(String transactionReferenceTemplate) {
        return Map.of(
                "transactionReferenceTemplate", transactionReferenceTemplate,
                "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario"),
                "detailsOfChargesField", "cargos");
    }

    /** Mide los bytes del fragmento mas grande con N txs por mensaje (calibracion). */
    private int measureFragmentBytes(long taskDefinitionId, int maxTransactionsPerMessage) {
        var context = new TaskContext(100L, taskDefinitionId);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 100L,
                "stage.taskDefinitionId", 20L));
        var result = provider.execute(context, baseConfiguration(taskDefinitionId, Map.of(
                "maxTransactionsPerMessage", maxTransactionsPerMessage,
                "maxBytesPerMessage", 100000)));
        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) result.outputs().get("fragments");
        var messages = fragmentStore.readMessages(fragmentSource, List.of("BUILT"));
        var max = 0;
        for (var message : messages) {
            max = Math.max(max, message.rawPayload().getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
        }
        fragmentStore.replaceFragmentSet(null, String.valueOf(fragmentSource.get("fragmentSetId")));
        return max;
    }

    private void insertRow(Statement statement, String account, String amount, int index) throws Exception {
        // record_index 0-based (como en produccion); el numero de fila visible es index.
        statement.executeUpdate("insert into staging_record(process_execution_id, task_definition_id, record_index, source_file_hash, payload_json) values "
                + "(100, 20, " + (index - 1) + ", 'testhash', '{\"moneda\":\"PEN\",\"monto\":\"" + amount
                + "\",\"cuenta_beneficiario\":\"" + account + "\",\"cargos\":\"OUR\",\"idx\":\"" + index + "\"}')");
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private static final class OneFormatterInstance implements Instance<PaymentMessageFormatter> {
        private final PaymentMessageFormatter formatter;

        OneFormatterInstance(PaymentMessageFormatter formatter) {
            this.formatter = formatter;
        }

        @Override
        public Instance<PaymentMessageFormatter> select(java.lang.annotation.Annotation... qualifiers) {
            return this;
        }

        @Override
        public <U extends PaymentMessageFormatter> Instance<U> select(Class<U> subtype, java.lang.annotation.Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends PaymentMessageFormatter> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> subtype, java.lang.annotation.Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public boolean isUnsatisfied() {
            return false;
        }

        @Override
        public boolean isAmbiguous() {
            return false;
        }

        @Override
        public void destroy(PaymentMessageFormatter instance) {
            // no-op
        }

        @Override
        public jakarta.enterprise.inject.Instance.Handle<PaymentMessageFormatter> getHandle() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterable<? extends jakarta.enterprise.inject.Instance.Handle<PaymentMessageFormatter>> handles() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterator<PaymentMessageFormatter> iterator() {
            return List.of(formatter).iterator();
        }

        @Override
        public PaymentMessageFormatter get() {
            return formatter;
        }

        @Override
        public Stream<PaymentMessageFormatter> stream() {
            return StreamSupport.stream(spliterator(), false);
        }
    }
}
