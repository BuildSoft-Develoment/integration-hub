package com.integrationhub.platform.task;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ArtifactReferenceTest {

    @Test
    void getFactoryAndRoundTripThroughMap() {
        var ref = ArtifactReference.get("https://store/bucket/key?sig=abc", "text/csv", 1024L, 1730000000000L);
        assertEquals(ArtifactReference.GET, ref.method());

        var map = ref.asMap();
        assertEquals("https://store/bucket/key?sig=abc", map.get(ArtifactReference.URI));
        assertEquals("GET", map.get(ArtifactReference.METHOD));
        assertEquals(1024L, map.get(ArtifactReference.SIZE_BYTES));

        // fromMap tolera números como String (JSON) y reconstruye igual.
        Map<String, Object> asJson = new HashMap<>(map);
        asJson.put(ArtifactReference.SIZE_BYTES, "1024");
        asJson.put(ArtifactReference.EXPIRES_AT, "1730000000000");
        assertEquals(ref, ArtifactReference.fromMap(asJson));
    }

    @Test
    void putFactoryNormalizesMethodAndDefaults() {
        var ref = ArtifactReference.put("https://store/put?sig=xyz", "application/octet-stream", 0L);
        assertEquals(ArtifactReference.PUT, ref.method());
        assertEquals(0L, ref.sizeBytes());
    }

    @Test
    void blankUriIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> new ArtifactReference("  ", "GET", "text/csv", 0L, 0L));
    }

    @Test
    void unknownMethodIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> new ArtifactReference("https://store/x", "DELETE", "text/csv", 0L, 0L));
    }

    @Test
    void nullMethodDefaultsToGet() {
        assertEquals(ArtifactReference.GET,
                new ArtifactReference("https://store/x", null, null, -5L, -9L).method());
    }
}
