package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.spi.task.payments.ValidationIssue;
import com.integrationhub.platform.spi.task.payments.ValidationPredicate;
import com.integrationhub.platform.spi.task.payments.ValidationRuleProvider;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-002, RF-011, RNF-04
 */
@Testcontainers
class Mt101ValidateTaskProviderIssueHandlingTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_issue_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_validation_issue");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key,"
                    + "fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint,"
                    + "task_definition_id bigint,"
                    + "source_table varchar(255),"
                    + "source_row_from bigint,"
                    + "source_row_to bigint,"
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
            statement.executeUpdate("create table mt101_validation_issue ("
                    + "id bigserial primary key,"
                    + "archive_id bigint,"
                    + "transaction_id bigint,"
                    + "rule_code varchar(80) not null,"
                    + "rule_set varchar(50) not null,"
                    + "severity char(1) not null,"
                    + "message text,"
                    + "fragment_set_id varchar(80),"
                    + "senders_reference varchar(16),"
                    + "fragment_index integer,"
                    + "detected_at timestamp not null default current_timestamp)");
        }
    }

    @Test
    void capsErrorsOutputWhileCountingAllIssues() {
        var provider = provider(null);
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(
                "build-mt101.records", List.of(validMessage("TX-1"), validMessage("TX-2"))
        ));

        var result = provider.execute(context, Map.of(
                "maxIssuesInOutput", 1,
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(4, result.outputs().get("issueCount"));
        assertEquals(true, result.outputs().get("issuesTruncated"));

        @SuppressWarnings("unchecked")
        var errors = (List<ValidationIssue>) result.outputs().get("errors");
        assertEquals(1, errors.size(), "errors conserva solo una muestra configurable");

        @SuppressWarnings("unchecked")
        var bySeverity = (Map<String, Integer>) result.outputs().get("issuesBySeverity");
        assertEquals(4, bySeverity.get("ERROR"));
        assertEquals(2, result.outputs().get("invalidCount"));
    }

    @Test
    void persistsIssuesWhenPublishIssuesToIsConfigured() throws Exception {
        var provider = provider(dataSource);
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(
                "build-mt101.records", List.of(validMessage("TX-1"))
        ));

        var result = provider.execute(context, Map.of(
                "publishIssuesTo", "table:mt101_validation_issue",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(2, result.outputs().get("issueCount"));

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from mt101_validation_issue")) {
            assertTrue(rs.next());
            assertEquals(2, rs.getInt(1));
        }
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery("select rule_code, rule_set, severity, message "
                     + "from mt101_validation_issue order by rule_code")) {
            assertTrue(rs.next());
            assertEquals("BANK.TEST.LIMIT", rs.getString("rule_code"));
            assertEquals("bank:TEST", rs.getString("rule_set"));
            assertEquals("E", rs.getString("severity"));
            assertTrue(rs.getString("message").contains("transactionReference=TX-1"));
            assertTrue(rs.next());
            assertEquals("BANK.TEST.REQUIRED", rs.getString("rule_code"));
        }
    }

    @Test
    void persistsFragmentLineageWhenValidatingMassiveFlow() throws Exception {
        var fragmentStore = new Mt101FragmentStore(dataSource, null,
                new ObjectMapper().registerModule(new JavaTimeModule()));
        var provider = provider(dataSource, fragmentStore);
        var message = validMessage("TX-FRAG").withRawPayload("{\"sample\":true}", "JSON");
        fragmentStore.insertFragment(null, "SET-ISSUES", 1L, 10L,
                "staging_record", 1L, 1L, 1, 1, message);

        var context = new TaskContext(1L, 10L);
        context.attributes().put("taskOutputs", Map.of(
                "build-mt101.fragments", fragmentStore.source(null, "SET-ISSUES", 1)
        ));

        var result = provider.execute(context, Map.of(
                "publishIssuesTo", "table:mt101_validation_issue",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "fragments"),
                "pageSize", 1
        ));

        assertFalse(result.success());
        assertEquals(2, result.outputs().get("issueCount"));

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from mt101_validation_issue "
                     + "where fragment_set_id = 'SET-ISSUES' "
                     + "and senders_reference = 'PROC-1' "
                     + "and fragment_index = 1")) {
            assertTrue(rs.next());
            assertEquals(2, rs.getInt(1));
        }
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery("select status from mt101_build_fragment "
                     + "where fragment_set_id = 'SET-ISSUES' and senders_reference = 'PROC-1'")) {
            assertTrue(rs.next());
            assertEquals("REJECTED", rs.getString(1));
        }
    }

    private Mt101ValidateTaskProvider provider(DataSource sinkDataSource) {
        return provider(sinkDataSource, null);
    }

    private Mt101ValidateTaskProvider provider(DataSource sinkDataSource, Mt101FragmentStore fragmentStore) {
        var ruleProvider = new SingleRuleProvider((ruleSet, standard, appliesTo) -> List.of(
                new FixedIssuePredicate("BANK.TEST.REQUIRED"),
                new FixedIssuePredicate("BANK.TEST.LIMIT")
        ));
        return new Mt101ValidateTaskProvider(new InstanceOfOne<>(ruleProvider), fragmentStore, sinkDataSource, null);
    }

    private Mt101Message validMessage(String transactionReference) {
        return new Mt101Message(
                null,
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 11),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, transactionReference, null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "0072-1", null, List.of("BENE")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                null, null);
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private static final class FixedIssuePredicate implements ValidationPredicate {
        private final String code;

        private FixedIssuePredicate(String code) {
            this.code = code;
        }

        @Override
        public String code() {
            return code;
        }

        @Override
        public String ruleSet() {
            return "bank:TEST";
        }

        @Override
        public String standard() {
            return "SWIFT";
        }

        @Override
        public String appliesTo() {
            return "MT101";
        }

        @Override
        public ValidationIssue.Severity severity() {
            return ValidationIssue.Severity.ERROR;
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            var txRef = message.transactions().get(0).transactionReference();
            return List.of(ValidationIssue.transactionLevel(
                    code, ruleSet(), ValidationIssue.Severity.ERROR, txRef, "Synthetic bank issue"));
        }
    }

    private static final class SingleRuleProvider implements ValidationRuleProvider {
        private final TriFn fn;

        SingleRuleProvider(TriFn fn) {
            this.fn = fn;
        }

        @Override
        public List<ValidationPredicate> findRules(String ruleSet, String standard, String appliesTo) {
            return fn.apply(ruleSet, standard, appliesTo);
        }
    }

    @FunctionalInterface
    private interface TriFn {
        List<ValidationPredicate> apply(String ruleSet, String standard, String appliesTo);
    }

    private static final class InstanceOfOne<T> implements Instance<T> {
        private final T instance;

        InstanceOfOne(T instance) {
            this.instance = instance;
        }

        @Override public Instance<T> select(java.lang.annotation.Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return false; }
        @Override public boolean isAmbiguous() { return false; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return List.of(instance).iterator(); }
        @Override public T get() { return instance; }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
