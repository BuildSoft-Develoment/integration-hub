package com.example.plugin;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TransformTaskTest {

    private final TransformTask task = new TransformTask();

    @Test
    void upperTransformsAndReportsEngine() {
        var outcome = task.execute(Map.of("text", "hola mundo", "op", "upper"));
        assertTrue(outcome.success());
        assertEquals("HOLA MUNDO", outcome.outputs().get("result"));
        assertEquals("java", outcome.outputs().get("engine"));
        assertEquals("upper", outcome.outputs().get("op"));
    }

    @Test
    void reverseTransforms() {
        var outcome = task.execute(Map.of("text", "abc", "op", "reverse"));
        assertTrue(outcome.success());
        assertEquals("cba", outcome.outputs().get("result"));
    }

    @Test
    void missingOpDefaultsToIdentity() {
        var outcome = task.execute(Map.of("text", "abc"));
        assertTrue(outcome.success());
        assertEquals("abc", outcome.outputs().get("result"));
        assertEquals("identity", outcome.outputs().get("op"));
    }

    @Test
    void missingTextFailsLoud() {
        var outcome = task.execute(Map.of("op", "upper"));
        assertFalse(outcome.success(), "sin 'text' la tarea falla; no devuelve exito vacio");
    }

    @Test
    void unknownOpFailsLoud() {
        var outcome = task.execute(Map.of("text", "abc", "op", "explode"));
        assertFalse(outcome.success(), "una op desconocida falla en vez de silenciarse");
    }
}
