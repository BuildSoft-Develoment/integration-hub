package com.integrationhub.platform.provider.task.storedprocedure;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Fija la construccion de la expresion de parametro (P1.a, ADR-004): los outputs AGREGADOS
 * (summary/out) se califican a `task.<output>.<campo>`; los flujos por registro
 * (records/table/errors) y campos sueltos resuelven por clave plana.
 */
class StoredProcedureConfigurationSupportTest {

    private static Map<String, Object> param(Map<String, Object> entries) {
        var map = new LinkedHashMap<String, Object>();
        map.put("name", "p");
        map.put("jdbcType", "INTEGER");
        map.put("direction", "IN");
        map.putAll(entries);
        return map;
    }

    private static String expressionOf(Map<String, Object> paramEntries) {
        var configuration = Map.<String, Object>of("parameters", List.of(param(paramEntries)));
        var parameters = StoredProcedureConfigurationSupport.parameters(configuration);
        assertEquals(1, parameters.size());
        return parameters.get(0).expression();
    }

    @Test
    void summaryBindingIsQualified() {
        // El front (agregado) manda sourceTaskRef+sourceOutput SIN value -> backend califica.
        var expression = expressionOf(Map.of(
                "sourceKind", "summary",
                "sourceKey", "total",
                "sourceTaskRef", "task-2",
                "sourceOutput", "summary"
        ));
        assertEquals("task-2.summary.total", expression);
    }

    @Test
    void outBindingIsQualified() {
        var expression = expressionOf(Map.of(
                "sourceKind", "out",
                "sourceKey", "resultado",
                "sourceTaskRef", "task-3",
                "sourceOutput", "out"
        ));
        assertEquals("task-3.out.resultado", expression);
    }

    @Test
    void perRecordBindingStaysPlain() {
        // El front (por registro) manda `value` plano -> backend lo respeta (resuelve del registro).
        var expression = expressionOf(Map.of(
                "sourceKind", "table",
                "value", "id",
                "sourceKey", "id"
        ));
        assertEquals("id", expression);
    }

    @Test
    void perRecordBindingIsNotQualifiedEvenWithTaskRef() {
        // Aunque llegara sourceTaskRef con un kind por-registro y sin value, NO se infiere
        // sourceOutput (records/table/errors no tienen clave calificada): queda `task.id`.
        var expression = expressionOf(Map.of(
                "sourceKind", "table",
                "sourceKey", "id",
                "sourceTaskRef", "task-2"
        ));
        assertEquals("task-2.id", expression);
    }

    @Test
    void constantBindingUsesConstPrefix() {
        var expression = expressionOf(Map.of(
                "sourceKind", "const",
                "sourceKey", "ACTIVO"
        ));
        assertEquals("const:ACTIVO", expression);
    }
}
