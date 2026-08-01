package com.integrationhub.platform.service.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
 */
class SuspendedStateMarshallerTest {

    private SuspendedStateMarshaller marshaller;

    @BeforeEach
    void setUp() {
        marshaller = new SuspendedStateMarshaller(new ObjectMapper());
    }

    @Test
    void marshalsSimpleMapAndUnmarshalsBack() {
        var state = new LinkedHashMap<String, Object>();
        state.put("attempt", 3);
        state.put("nextPollAt", "2026-06-09T12:00:00Z");
        state.put("externalRef", "BANK-REF-42");

        var json = marshaller.marshal(state);
        var rehydrated = marshaller.unmarshal(json);

        assertEquals(3, rehydrated.get("attempt"));
        assertEquals("2026-06-09T12:00:00Z", rehydrated.get("nextPollAt"));
        assertEquals("BANK-REF-42", rehydrated.get("externalRef"));
    }

    @Test
    void marshalsNestedMapsAndLists() {
        var state = Map.<String, Object>of(
                "tokens", List.of("a", "b", "c"),
                "history", List.of(Map.of("at", "T1", "code", "OK"), Map.of("at", "T2", "code", "RETRY"))
        );

        var json = marshaller.marshal(state);
        var rehydrated = marshaller.unmarshal(json);

        assertEquals(List.of("a", "b", "c"), rehydrated.get("tokens"));
        @SuppressWarnings("unchecked")
        var history = (List<Map<String, Object>>) rehydrated.get("history");
        assertEquals("OK", history.get(0).get("code"));
        assertEquals("RETRY", history.get(1).get("code"));
    }

    @Test
    void marshalsNullAndBlankToEmptyJsonObject() {
        assertEquals("{}", marshaller.marshal(null));
        assertEquals("{}", marshaller.marshal(Map.of()));
    }

    @Test
    void unmarshalsNullOrBlankAsEmptyMutableMap() {
        var fromNull = marshaller.unmarshal(null);
        var fromBlank = marshaller.unmarshal("   ");
        assertTrue(fromNull.isEmpty());
        assertTrue(fromBlank.isEmpty());
        fromNull.put("k", "v"); // verify mutability
        assertEquals("v", fromNull.get("k"));
    }

    @Test
    void rejectsNonSerializableValues() {
        var state = new LinkedHashMap<String, Object>();
        state.put("badValue", new Object() {
            // anonymous class without getters; jackson cannot serialize
        });
        var error = assertThrows(IllegalStateException.class, () -> marshaller.marshal(state));
        assertNotNull(error.getMessage());
        assertTrue(error.getMessage().contains("Cannot serialize suspendedState"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void rejectsCorruptedJsonOnUnmarshal() {
        var error = assertThrows(IllegalStateException.class,
                () -> marshaller.unmarshal("{not-valid-json"));
        assertTrue(error.getMessage().contains("Cannot deserialize suspendedState"));
    }
}
