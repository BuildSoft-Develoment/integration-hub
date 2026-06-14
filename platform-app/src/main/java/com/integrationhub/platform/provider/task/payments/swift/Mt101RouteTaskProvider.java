package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.commons.jexl3.JexlBuilder;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.JexlExpression;
import org.apache.commons.jexl3.MapContext;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_ROUTE}: clasifica records de la tarea anterior segun
 * reglas declarativas (predicados JEXL) y agrega el campo {@code routedAs} a cada
 * uno, publicando el conjunto routeado a la siguiente tarea.
 *
 * <p>Caso de uso tipico (inbound): despues de {@code MT101_PARSE}, clasificar cada
 * transaccion como {@code BOOK_TRANSFER} (mismo banco), {@code LOCAL_CLEARING}
 * (BIC domestico) o {@code MT103_OUTBOUND} (BIC internacional).</p>
 *
 * <p>Caso outbound: tambien aplica para clasificar mensajes antes de
 * {@code MT101_PAY} (p.ej. ruta REST vs SFTP segun banco receptor).</p>
 *
 * <p><b>Predicate kind</b>: JEXL 3 (sintaxis tipo Java). {@code commons-jexl3} ya
 * esta en {@code pom.xml}. Contexto del predicado: cada record convertido a
 * {@code Map<String,Object>} via Jackson (acceso por dotted-path:
 * {@code beneficiary.bic == 'BCPLPEPL'}).</p>
 *
 * <p><b>Outputs</b>:</p>
 * <ul>
 *   <li>{@code records}: lista de {@code Map<String,Object>} con {@code routedAs}.</li>
 *   <li>{@code summary}: {@code routedCount}, {@code countByRoute}.</li>
 *   <li>{@code errors}: records cuyo predicado fallo (excepcion al evaluar).</li>
 * </ul>
 *
 * @trace spec 008-mensajeria-pagos RF-007, T-017
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101RouteTaskProvider implements TaskProvider {

    private static final String DEFAULT_FIELD_NAME = "routedAs";

    private final ObjectMapper objectMapper;
    private final JexlEngine jexlEngine;

    @Inject
    public Mt101RouteTaskProvider(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.jexlEngine = new JexlBuilder()
                .strict(false)   // null-tolerant
                .silent(true)    // no NPE en propiedades inexistentes
                .create();
    }

    @Override
    public String type() {
        return "MT101_ROUTE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var records = readRecords(context, configuration);
        if (records.isEmpty()) {
            return TaskResult.success("MT101_ROUTE skipped because there are no records to route");
        }

        var rules = parseRules(configuration.get("rules"));
        if (rules.isEmpty()) {
            throw new IllegalArgumentException("MT101_ROUTE requires configuration.rules (non-empty array)");
        }
        var defaultRoute = stringValue(configuration.get("defaultRoute"), "UNROUTED");
        var fieldName = stringValue(configuration.get("routeField"), DEFAULT_FIELD_NAME);

        var routed = new ArrayList<Map<String, Object>>(records.size());
        var errors = new ArrayList<Map<String, Object>>();
        var countByRoute = new TreeMap<String, Integer>();

        for (var record : records) {
            var asMap = toMap(record);
            String route;
            try {
                route = evaluate(rules, asMap, defaultRoute);
            } catch (RuntimeException error) {
                var errEntry = new LinkedHashMap<String, Object>(asMap);
                errEntry.put("error", error.getMessage());
                errors.add(errEntry);
                continue;
            }
            var enriched = new LinkedHashMap<String, Object>(asMap);
            enriched.put(fieldName, route);
            routed.add(enriched);
            countByRoute.merge(route, 1, Integer::sum);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("routedCount", routed.size());
        outputs.put("errorCount", errors.size());
        outputs.put("countByRoute", countByRoute);
        outputs.put("records", routed);
        outputs.put("errors", errors);

        var summary = "MT101_ROUTE routed=" + routed.size()
                + " errors=" + errors.size()
                + " distribution=" + countByRoute;
        return errors.isEmpty()
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

    private String evaluate(List<Rule> rules, Map<String, Object> recordMap, String defaultRoute) {
        var jexlContext = new MapContext();
        recordMap.forEach(jexlContext::set);
        for (var rule : rules) {
            try {
                var result = rule.expression().evaluate(jexlContext);
                if (Boolean.TRUE.equals(result)) {
                    return rule.routeTo();
                }
            } catch (RuntimeException error) {
                throw new IllegalStateException(
                        "Rule '" + rule.name() + "' failed: " + error.getMessage(), error);
            }
        }
        return defaultRoute;
    }

    @SuppressWarnings("unchecked")
    private List<Rule> parseRules(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return List.of();
        }
        var result = new ArrayList<Rule>();
        var seenNames = new java.util.HashSet<String>();
        for (var item : rawList) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            var name = stringValue(map.get("name"), "");
            var predicate = stringValue(map.get("predicate"), "");
            var routeTo = stringValue(map.get("routeTo"), "");
            if (name.isBlank() || predicate.isBlank() || routeTo.isBlank()) {
                throw new IllegalArgumentException(
                        "Each rule requires non-blank name/predicate/routeTo");
            }
            if (!seenNames.add(name)) {
                throw new IllegalArgumentException("Duplicate rule name: " + name);
            }
            JexlExpression expr;
            try {
                expr = jexlEngine.createExpression(predicate);
            } catch (RuntimeException error) {
                throw new IllegalArgumentException(
                        "Invalid JEXL predicate in rule '" + name + "': " + error.getMessage(), error);
            }
            result.add(new Rule(name, expr, routeTo));
        }
        return result;
    }

    private Map<String, Object> toMap(Object record) {
        if (record instanceof Map<?, ?> map) {
            var result = new LinkedHashMap<String, Object>();
            map.forEach((k, v) -> result.put(String.valueOf(k), v));
            return result;
        }
        if (record instanceof Mt101Message msg) {
            return objectMapper.convertValue(msg, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
            });
        }
        return objectMapper.convertValue(record, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
        });
    }

    @SuppressWarnings("unchecked")
    private List<Object> readRecords(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException("MT101_ROUTE requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("MT101_ROUTE input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) {
            return List.of();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be a List but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Object>(rawList.size());
        for (var item : rawList) {
            if (item != null) {
                result.add(item);
            }
        }
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    /** Regla compilada: nombre + expresion JEXL + ruta destino. */
    private record Rule(String name, JexlExpression expression, String routeTo) {
    }
}
