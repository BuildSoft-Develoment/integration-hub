package com.integrationhub.vertical.swift.mt101.provider.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.vertical.swift.mt101.spi.ValidationPredicate;
import com.integrationhub.vertical.swift.mt101.spi.ValidationRuleProvider;
import com.integrationhub.vertical.swift.mt101.provider.format.JsonMt101Formatter;
import com.integrationhub.vertical.swift.mt101.provider.validation.Mt101StructuralRules;
import com.integrationhub.vertical.swift.mt101.support.TestConfigurationMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Tag;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Harness de carga del pipeline masivo MT101 (RNF-04 spec 008):
 * {@code staging_record -> MT101_BUILD_FROM_TABLE -> MT101_VALIDATE -> MT101_ARCHIVE}.
 *
 * <p><b>Como ejecutarlo</b> (no corre en el build default — el sufijo *IT lo
 * excluye de surefire):</p>
 * <pre>
 *   mvn -pl platform-app test -Dtest=Mt101MassivePipelinePerfIT \
 *       -Dperf.rows=1000000 -DargLine="-Xmx512m"
 * </pre>
 *
 * <p>El cap de heap es LA asercion principal: si alguna etapa acumula los
 * fragmentos del set completo en memoria, el run muere con OOM. Con el default
 * de 20k filas el harness sirve como smoke en cualquier maquina; con 1M y
 * -Xmx512m es la prueba de carga real (correr en entorno representativo,
 * no en CI).</p>
 *
 * <p>Invariantes verificadas en SQL al final:</p>
 * <ul>
 *   <li>Ningun fragmento excede {@code maxBytesPerMessage}.</li>
 *   <li>{@code :20:} unico por set (count distinct == count).</li>
 *   <li>{@code :28D:} total uniforme y consistente con la cantidad real.</li>
 *   <li>Todos los fragmentos terminan {@code ARCHIVED} y las transacciones
 *       archivadas igualan las filas staging.</li>
 * </ul>
 */
@Tag("perf")
@Testcontainers
class Mt101MassivePipelinePerfIT {

    private static final int ROWS = Integer.getInteger("perf.rows", 20_000);
    private static final int SEED_BATCH = 5_000;

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payments_perf")
            .withUsername("postgres")
            .withPassword("postgres");

    @Test
    void massivePipelineKeepsInvariantsUnderLoad() throws Exception {
        var dataSource = dataSource();
        createSchema(dataSource);

        var seedStart = System.nanoTime();
        seedStagingRows(dataSource, ROWS);
        report("seed " + ROWS + " rows", seedStart);

        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        var fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        var buildProvider = new Mt101BuildTaskProvider(
                new OneInstance<>(new JsonMt101Formatter(objectMapper)));
        var fromTableProvider = new Mt101BuildFromTableTaskProvider(
                dataSource, null, new TestConfigurationMapper(), buildProvider, fragmentStore);
        var validateProvider = new Mt101ValidateTaskProvider(
                new OneInstance<ValidationRuleProvider>(structuralRuleProvider()), fragmentStore);
        var archiveProvider = new Mt101ArchiveTaskProvider(dataSource, null, fragmentStore);

        // --- BUILD_FROM_TABLE ---
        var context = new TaskContext(7_000L, 70L);
        context.attributes().put("taskOutputs", Map.of(
                "stage.table", "staging_record",
                "stage.processExecutionId", 7_000L,
                "stage.taskDefinitionId", 70L));
        var maxBytes = 10_000;
        var buildStart = System.nanoTime();
        var buildResult = fromTableProvider.execute(context, Map.of(
                "taskRef", "build-massive",
                "input", Map.of("sourceTaskRef", "stage", "sourceOutput", "table"),
                "format", "JSON",
                "maxTransactionsPerMessage", 100,
                "maxBytesPerMessage", maxBytes,
                "fragmentSetIdTemplate", "PERF-${_processExecutionId}",
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "P${messageIndex}",
                        "requestedExecutionDate", "2026-06-11",
                        "orderingCustomer", Map.of("option", "H", "account", "001-9999",
                                "nameAndAddress", List.of("PERF TEST SAC"))),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "T${recordNumber}",
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta",
                                "nameAndAddressFields", List.of("nombre")),
                        "remittanceInformationField", "concepto",
                        "detailsOfChargesField", "cargos")));
        report("BUILD_FROM_TABLE", buildStart);
        assertTrue(buildResult.success(), buildResult.details());
        var fragmentCount = (Integer) buildResult.outputs().get("fragmentCount");
        System.out.printf("[perf] fragments=%d rows=%d%n", fragmentCount, ROWS);

        @SuppressWarnings("unchecked")
        var fragmentSource = (Map<String, Object>) buildResult.outputs().get("fragments");

        // --- VALIDATE (paginado, marca VALIDATED) ---
        var validateContext = new TaskContext(7_000L, 71L);
        validateContext.attributes().put("taskOutputs", Map.of("build-massive.fragments", fragmentSource));
        var validateStart = System.nanoTime();
        var validateResult = validateProvider.execute(validateContext, Map.of(
                "input", Map.of("sourceTaskRef", "build-massive", "sourceOutput", "fragments")));
        report("VALIDATE", validateStart);
        assertTrue(validateResult.success(), validateResult.details());
        assertEquals(fragmentCount, validateResult.outputs().get("validCount"));

        // --- ARCHIVE (paginado, transaccion por pagina, marca ARCHIVED) ---
        var archiveContext = new TaskContext(7_000L, 72L);
        archiveContext.attributes().put("taskOutputs", Map.of("build-massive.fragments", fragmentSource));
        var archiveStart = System.nanoTime();
        var archiveResult = archiveProvider.execute(archiveContext, Map.of(
                "input", Map.of("sourceTaskRef", "build-massive", "sourceOutput", "fragments")));
        report("ARCHIVE", archiveStart);
        assertTrue(archiveResult.success(), archiveResult.details());
        assertEquals(fragmentCount, archiveResult.outputs().get("archivedCount"));

        // --- Invariantes SQL ---
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            assertEquals(0L, queryLong(statement,
                            "select count(*) from mt101_build_fragment where length(raw_payload) > " + maxBytes),
                    "ningun fragmento debe exceder maxBytes");
            assertEquals((long) fragmentCount, queryLong(statement,
                            "select count(distinct senders_reference) from mt101_build_fragment"),
                    ":20: debe ser unico por fragmento");
            assertEquals((long) fragmentCount, queryLong(statement,
                            "select count(*) from mt101_build_fragment where fragment_total = " + fragmentCount),
                    ":28D: total debe ser uniforme y igual a la cantidad real");
            assertEquals((long) fragmentCount, queryLong(statement,
                            "select count(*) from mt101_build_fragment where status = 'ARCHIVED'"),
                    "todos los fragmentos deben terminar ARCHIVED");
            assertEquals((long) ROWS, queryLong(statement, "select count(*) from mt101_transaction"),
                    "las transacciones archivadas deben igualar las filas staging");
        }
    }

    private void seedStagingRows(DataSource dataSource, int rows) throws Exception {
        var sql = "insert into staging_record (process_execution_id, task_definition_id, source_name, record_index, payload_json) "
                + "values (7000, 70, 'perf.csv', ?, ?)";
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < rows; i++) {
                statement.setInt(1, i);
                // Remittance variable para ejercitar la biseccion con payloads heterogeneos.
                var concepto = i % 97 == 0
                        ? "FACTURA " + i + " SERVICIOS PROFESIONALES PERIODO 2026"
                        : "FACTURA " + i;
                statement.setString(2, "{\"moneda\":\"PEN\",\"monto\":\"" + (100 + (i % 900)) + ".50\","
                        + "\"cuenta\":\"0011-" + String.format("%010d", i) + "\","
                        + "\"nombre\":\"BENEFICIARIO " + i + "\","
                        + "\"concepto\":\"" + concepto + "\",\"cargos\":\"SHA\"}");
                statement.addBatch();
                if ((i + 1) % SEED_BATCH == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
        }
    }

    private ValidationRuleProvider structuralRuleProvider() {
        List<ValidationPredicate> predicates = List.of(
                new Mt101StructuralRules.SendersReferenceLengthRule(),
                new Mt101StructuralRules.AmountPositiveRule(),
                new Mt101StructuralRules.CurrencyFormatRule(),
                new Mt101StructuralRules.TransactionReferenceUniqueRule(),
                new Mt101StructuralRules.MessageMaxLengthRule(),
                new Mt101StructuralRules.MessageIndexTotalFormatRule());
        return (ruleSet, standard, appliesTo) -> predicates;
    }

    private void createSchema(DataSource dataSource) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_transaction");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("drop table if exists swift_message_envelope");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "source_name varchar(255), source_file_hash varchar(64), record_index bigint, payload_json text not null)");
            statement.executeUpdate("create index ix_staging_perf on staging_record"
                    + "(process_execution_id, task_definition_id, id)");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "source_row_from bigint, source_row_to bigint,"
                    + "staging_id_from bigint, staging_id_to bigint,"
                    + "source_record_from bigint, source_record_to bigint, source_file_hash varchar(64),"
                    + "source_records_json text,"
                    + "fragment_index integer not null,"
                    + "fragment_total integer not null, senders_reference varchar(16) not null,"
                    + "payload_hash char(64) not null, raw_payload text not null, message_json text not null,"
                    + "status varchar(20) not null default 'BUILT', error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_perf_fragment_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
            statement.executeUpdate("create index ix_perf_fragment_status on mt101_build_fragment"
                    + "(fragment_set_id, status, fragment_index)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key,"
                    + "fragment_id bigint references mt101_build_fragment(id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null,"
                    + "original_fragment_set_id varchar(80),"
                    + "source_file_hash varchar(64),"
                    + "source_record_number bigint not null,"
                    + "staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16),"
                    + "current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80),"
                    + "status varchar(30) not null default 'BUILT',"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_perf_fragment_record_current on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number)");
            statement.executeUpdate("create table swift_message_envelope ("
                    + "id bigserial primary key, message_type char(3) not null, sender_lt char(12),"
                    + "receiver_lt char(12), uetr varchar(36), priority char(1), raw_payload text,"
                    + "payload_hash char(64), parsed_at timestamp not null default current_timestamp,"
                    + "source_file_name varchar(255), process_execution_id bigint)");
            statement.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, envelope_id bigint references swift_message_envelope(id),"
                    + "sender_lt char(12), process_execution_id bigint,"
                    + "senders_reference varchar(16) not null, customer_specified_reference varchar(16),"
                    + "message_index integer, message_total integer, requested_execution_date date,"
                    + "instructing_party_kind char(1), instructing_party_value text,"
                    + "ordering_customer_kind char(1), ordering_customer_account varchar(34),"
                    + "ordering_customer_name_addr text, account_servicing_kind char(1),"
                    + "account_servicing_value text, status varchar(20) not null default 'PENDING',"
                    + "format char(4), created_at timestamp not null default current_timestamp,"
                    + "retention_until date)");
            statement.executeUpdate("create table mt101_transaction ("
                    + "id bigserial primary key,"
                    + "archive_id bigint not null references mt101_archive(id) on delete cascade,"
                    + "sequence_number integer not null, transaction_reference varchar(16) not null,"
                    + "fx_deal_reference varchar(16), instruction_code varchar(35),"
                    + "amount_currency char(3) not null, amount_value numeric(18,3) not null,"
                    + "ordering_customer_kind char(1), ordering_customer_account varchar(34),"
                    + "ordering_customer_name_addr text, account_servicing_kind char(1),"
                    + "account_servicing_value text, intermediary text, account_with_institution text,"
                    + "beneficiary_kind char(1), beneficiary_account varchar(34), beneficiary_name_addr text,"
                    + "remittance_information text, regulatory_reporting text,"
                    + "original_amount_currency char(3), original_amount_value numeric(18,3),"
                    + "details_of_charges char(3) not null, charges_account varchar(34),"
                    + "exchange_rate numeric(15,8))");
        }
    }

    private long queryLong(Statement statement, String sql) throws Exception {
        try (var rs = statement.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private void report(String phase, long startNanos) {
        var elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;
        var usedMb = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / (1024 * 1024);
        System.out.printf("[perf] %-22s %8d ms  heapUsed=%d MB%n", phase, elapsedMs, usedMb);
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    /** Instance<T> de un solo bean para wiring manual en tests. */
    private static final class OneInstance<T> implements Instance<T> {
        private final T instance;

        OneInstance(T instance) {
            this.instance = instance;
        }

        @Override
        public Instance<T> select(java.lang.annotation.Annotation... qualifiers) {
            return this;
        }

        @Override
        public <U extends T> Instance<U> select(Class<U> subtype, java.lang.annotation.Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> subtype, java.lang.annotation.Annotation... qualifiers) {
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
        public void destroy(T toDestroy) {
            // no-op
        }

        @Override
        public Handle<T> getHandle() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterable<? extends Handle<T>> handles() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterator<T> iterator() {
            return List.of(instance).iterator();
        }

        @Override
        public T get() {
            return instance;
        }

        @Override
        public Stream<T> stream() {
            return StreamSupport.stream(spliterator(), false);
        }
    }
}
