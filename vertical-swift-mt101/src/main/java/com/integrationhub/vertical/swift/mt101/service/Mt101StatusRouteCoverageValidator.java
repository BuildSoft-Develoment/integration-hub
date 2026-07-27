package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * #2 (versión completa — cobertura de rutas) — validación de definición para el STATUS route-aware del money-path.
 *
 * <p><b>Regla:</b> si un proceso tiene un {@code MT101_ROUTE} (que declara rutas estáticas vía {@code rules[].routeTo})
 * y, POSTERIOR a él, un {@code MT101_STATUS} <b>route-aware</b> (con {@code routeQuery} no vacío: un endpoint de
 * consulta por ruta), entonces {@code routeQuery} <b>debe</b> cubrir <b>todas</b> las rutas declaradas por ese
 * {@code MT101_ROUTE}. Una ruta declarada que no tenga entrada en {@code routeQuery} es error de definición (400) en vez
 * de un fallo ruidoso recién en runtime (el ejecutor route-aware no consulta contra otro endpoint: una ruta sin entrada
 * es error).</p>
 *
 * <p><b>Alcance (por qué es sano, sin falsos positivos):</b> las rutas de {@code MT101_ROUTE} son <b>estáticas</b>
 * (nombres literales en {@code rules[].routeTo}), enumerable en definición. Solo se valida cuando AMBOS están
 * presentes y el STATUS es route-aware; si no hay {@code MT101_ROUTE} upstream, o el STATUS no declara {@code
 * routeQuery}, no hay nada que exigir (no se inventan rutas de runtime). El {@code defaultRoute} (bucket "no matcheó
 * ninguna regla") se excluye de la exigencia: no es un destino de gateway nombrado por el diseñador.</p>
 */
@ApplicationScoped
public class Mt101StatusRouteCoverageValidator implements ProcessDefinitionValidator {

    private static final String MT101_ROUTE = "MT101_ROUTE";
    private static final String MT101_STATUS = "MT101_STATUS";

    private final ObjectMapper objectMapper;

    @Inject
    public Mt101StatusRouteCoverageValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un {@code MT101_STATUS}
     * route-aware no cubre en {@code routeQuery} alguna ruta declarada por un {@code MT101_ROUTE} upstream.
     */
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        for (var status : tasks) {
            if (!MT101_STATUS.equalsIgnoreCase(status.taskType()) || status.taskOrder() == null) {
                continue;
            }
            var routeQueryKeys = routeQueryKeys(status.configurationJson());
            if (routeQueryKeys.isEmpty()) {
                continue; // STATUS no route-aware: query.url único (caso aceptado); nada que exigir por ruta.
            }
            var declaredRoutes = upstreamDeclaredRoutes(tasks, status.taskOrder());
            if (declaredRoutes.isEmpty()) {
                continue; // sin MT101_ROUTE upstream: no se conocen rutas → no se inventa exigencia.
            }
            var missing = new ArrayList<String>();
            for (var route : declaredRoutes) {
                if (!routeQueryKeys.contains(route)) {
                    missing.add(route);
                }
            }
            if (!missing.isEmpty()) {
                throw new IllegalArgumentException(
                        "MT101_STATUS (task order " + status.taskOrder() + ") is route-aware (routeQuery) but does not "
                        + "cover route(s) declared by an upstream MT101_ROUTE: " + String.join(", ", missing)
                        + ". Add a routeQuery entry per declared route (a missing route has no gateway endpoint to "
                        + "query and fails at runtime).");
            }
        }
    }

    /** Claves (rutas cubiertas) del objeto {@code routeQuery}; vacío si el STATUS no es route-aware. */
    private Set<String> routeQueryKeys(String configurationJson) {
        var node = readObject(configurationJson, "routeQuery");
        var keys = new LinkedHashSet<String>();
        if (node != null && node.isObject()) {
            node.fieldNames().forEachRemaining(keys::add);
        }
        return keys;
    }

    /** Rutas declaradas ({@code rules[].routeTo}) por los {@code MT101_ROUTE} con orden menor al del STATUS. */
    private Set<String> upstreamDeclaredRoutes(List<ProcessTaskView> tasks, int statusOrder) {
        var routes = new LinkedHashSet<String>();
        for (var task : tasks) {
            if (!MT101_ROUTE.equalsIgnoreCase(task.taskType()) || task.taskOrder() == null
                    || task.taskOrder() >= statusOrder) {
                continue;
            }
            var rules = readObject(task.configurationJson(), "rules");
            if (rules == null || !rules.isArray()) {
                continue;
            }
            for (var rule : rules) {
                var routeTo = rule.get("routeTo");
                if (routeTo != null && !routeTo.asText("").isBlank()) {
                    routes.add(routeTo.asText());
                }
            }
        }
        return routes;
    }

    private JsonNode readObject(String configurationJson, String field) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return null;
        }
        try {
            var root = objectMapper.readTree(configurationJson);
            return root == null ? null : root.get(field);
        } catch (Exception malformed) {
            // Config no parseable: no se puede validar la cobertura aquí (el resto del pipeline la rechaza).
            return null;
        }
    }
}
