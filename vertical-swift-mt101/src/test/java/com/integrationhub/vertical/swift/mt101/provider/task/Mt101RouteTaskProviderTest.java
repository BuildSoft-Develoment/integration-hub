package com.integrationhub.vertical.swift.mt101.provider.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-007, T-017
 */
class Mt101RouteTaskProviderTest {

    private Mt101RouteTaskProvider provider;

    @BeforeEach
    void setUp() {
        provider = new Mt101RouteTaskProvider(new ObjectMapper());
    }

    @Test
    void routesEachRecordByFirstMatchingRule() {
        var records = List.of(
                Map.<String, Object>of("dni", "1", "beneficiaryBic", "BCPLPEPL", "amount", 100),
                Map.<String, Object>of("dni", "2", "beneficiaryBic", "BBVAPEPLXXX", "amount", 200),
                Map.<String, Object>of("dni", "3", "beneficiaryBic", "CITIUS33XXX", "amount", 300));

        var configuration = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "parse-mt101", "sourceOutput", "records"),
                "rules", List.of(
                        Map.of("name", "same-bank", "predicate", "beneficiaryBic == 'BCPLPEPL'", "routeTo", "BOOK_TRANSFER"),
                        Map.of("name", "domestic", "predicate", "endsWith(beneficiaryBic, 'PEPLXXX')", "routeTo", "LOCAL_CLEARING")),
                "defaultRoute", "MT103_OUTBOUND");

        var result = provider.execute(contextWith("parse-mt101.records", records), configuration);

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(3, result.outputs().get("routedCount"));
        assertEquals(0, result.outputs().get("errorCount"));

        @SuppressWarnings("unchecked")
        var routed = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("BOOK_TRANSFER", routed.get(0).get("routedAs"));
        assertEquals("LOCAL_CLEARING", routed.get(1).get("routedAs"));
        assertEquals("MT103_OUTBOUND", routed.get(2).get("routedAs"));

        @SuppressWarnings("unchecked")
        var byRoute = (Map<String, Integer>) result.outputs().get("countByRoute");
        assertEquals(1, byRoute.get("BOOK_TRANSFER"));
        assertEquals(1, byRoute.get("LOCAL_CLEARING"));
        assertEquals(1, byRoute.get("MT103_OUTBOUND"));
    }

    @Test
    void supportsCustomRouteField() {
        var records = List.<Object>of(Map.<String, Object>of("k", "v"));
        var configuration = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "rules", List.of(Map.of("name", "any", "predicate", "true", "routeTo", "DEST")),
                "routeField", "channel");

        var result = provider.execute(contextWith("x.records", records), configuration);
        @SuppressWarnings("unchecked")
        var routed = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("DEST", routed.get(0).get("channel"));
        assertFalse(routed.get(0).containsKey("routedAs"));
    }

    @Test
    void skipsWhenNoRecords() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "rules", List.of(Map.of("name", "any", "predicate", "true", "routeTo", "D"))));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void rejectsConfigurationWithoutRules() {
        var records = List.<Object>of(Map.<String, Object>of("x", 1));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(
                contextWith("x.records", records),
                Map.of("input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"))));
        assertTrue(error.getMessage().contains("rules"));
    }

    @Test
    void rejectsInvalidJexlPredicate() {
        var records = List.<Object>of(Map.<String, Object>of("x", 1));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(
                contextWith("x.records", records),
                Map.of(
                        "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                        "rules", List.of(Map.of("name", "bad", "predicate", "this is not jexl @@", "routeTo", "X")))));
        assertTrue(error.getMessage().contains("Invalid JEXL"));
    }

    @Test
    void rejectsDuplicateRuleNames() {
        var records = List.<Object>of(Map.<String, Object>of("x", 1));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(
                contextWith("x.records", records),
                Map.of(
                        "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                        "rules", List.of(
                                Map.of("name", "dup", "predicate", "true", "routeTo", "A"),
                                Map.of("name", "dup", "predicate", "true", "routeTo", "B")))));
        assertTrue(error.getMessage().contains("Duplicate"));
    }

    @Test
    void defaultRouteIsUnroutedWhenNotConfigured() {
        var records = List.<Object>of(Map.<String, Object>of("x", "v"));
        var configuration = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "rules", List.of(Map.of("name", "never", "predicate", "false", "routeTo", "X")));

        var result = provider.execute(contextWith("x.records", records), configuration);
        @SuppressWarnings("unchecked")
        var routed = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("UNROUTED", routed.get(0).get("routedAs"));
    }

    @Test
    void honorsExplicitDefaultRoute() {
        var records = List.<Object>of(Map.<String, Object>of("x", "v"));
        var configuration = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "rules", List.of(Map.of("name", "never", "predicate", "false", "routeTo", "X")),
                "defaultRoute", "FALLBACK_QUEUE");

        var result = provider.execute(contextWith("x.records", records), configuration);
        @SuppressWarnings("unchecked")
        var routed = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("FALLBACK_QUEUE", routed.get(0).get("routedAs"));
    }

    @Test
    void handlesNullFieldsGracefully() {
        // JEXL silent mode no debe NPE en propiedad ausente; el record cae a default.
        var record = new LinkedHashMap<String, Object>();
        record.put("dni", "1");
        // sin beneficiaryBic
        var records = List.<Object>of(record);

        var configuration = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "rules", List.of(Map.of("name", "same-bank", "predicate", "beneficiaryBic == 'BCPLPEPL'", "routeTo", "BOOK")),
                "defaultRoute", "OTHER");

        var result = provider.execute(contextWith("x.records", records), configuration);
        @SuppressWarnings("unchecked")
        var routed = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("OTHER", routed.get(0).get("routedAs"));
    }

    private TaskContext contextWith(String key, List<?> records) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(key, records));
        return context;
    }
}
