package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.payments.swift.Mt101CorrectionSheetService.SheetRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-020 (C3): la logica money-critica del apply es el merge-patch efectivo con COERCION DE TIPOS. La planilla
 * trae todo como texto; al aplicar hay que devolver cada campo cambiado al tipo del payload actual para no cambiarle
 * la forma al que consume el BUILD (sobre todo {@code monto}). Se testea {@code computePatch} de forma directa.
 */
class Mt101BulkCorrectionServiceTest {

    private final Mt101BulkCorrectionService service =
            new Mt101BulkCorrectionService(null, null, null, null, new JsonConfigurationMapper(), null, null);

    private static SheetRow row(Map<String, String> cells) {
        return new SheetRow(new LinkedHashMap<>(cells));
    }

    @Test
    void numberFieldStaysNumericAsBigDecimal() {
        var patch = service.computePatch("{\"monto\":100.0,\"bic\":\"OLD\"}",
                row(Map.of("_stagingId", "1", "monto", "237.50", "bic", "OLD")));

        // monto cambio: vuelve como BigDecimal (exacto), NO como texto — money-safety.
        assertEquals(new BigDecimal("237.50"), patch.get("monto"));
        assertTrue(patch.get("monto") instanceof BigDecimal);
        // bic no cambio: no entra al patch (merge-patch minimo).
        assertFalse(patch.containsKey("bic"));
    }

    @Test
    void stringFieldStaysString() {
        var patch = service.computePatch("{\"bic\":\"OLD\"}",
                row(Map.of("_stagingId", "1", "bic", "BCPLPEPLXXX")));

        assertEquals("BCPLPEPLXXX", patch.get("bic"));
    }

    @Test
    void booleanFieldIsCoerced() {
        var patch = service.computePatch("{\"urgent\":true}",
                row(Map.of("_stagingId", "1", "urgent", "false")));

        assertEquals(Boolean.FALSE, patch.get("urgent"));
    }

    @Test
    void nonNumericIntoNumericFieldPassesThroughForDownstreamValidation() {
        // El operador metio basura en un campo numerico: no se traga el error, se deja el texto y lo rechaza
        // MT101_VALIDATE (fail-loud), en vez de coercionar a un numero inventado.
        var patch = service.computePatch("{\"monto\":100.0}",
                row(Map.of("_stagingId", "1", "monto", "N/A")));

        assertEquals("N/A", patch.get("monto"));
    }

    @Test
    void blankCellClearsToEmptyStringNotFieldRemoval() {
        // Celda vacia = el operador limpio el campo -> "" (no null, que en merge-patch BORRA la clave y rompe la forma).
        var patch = service.computePatch("{\"note\":\"algo\"}",
                row(Map.of("_stagingId", "1", "note", "")));

        assertTrue(patch.containsKey("note"));
        assertEquals("", patch.get("note"));
    }

    @Test
    void unchangedNumberRoundTripsWithoutFalseChange() {
        // El export escribe String.valueOf(237.5)="237.5"; si el operador no lo toca, no debe verse como cambio.
        var patch = service.computePatch("{\"monto\":237.5}",
                row(Map.of("_stagingId", "1", "monto", "237.5")));

        assertTrue(patch.isEmpty());
    }
}
