package com.integrationhub.platform.provider.task.writer;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FieldValueFormatterTest {

    @Test
    void numberWithPattern() {
        var fmt = new FieldValueFormatter();
        assertEquals("5.00", fmt.format("5", "NUMBER", "0.00"));
        assertEquals("1,234.50", fmt.format("1234.5", "NUMBER", "#,##0.00"));
        assertEquals("3500.50", fmt.format(new BigDecimal("3500.50"), "NUMBER", null));
    }

    @Test
    void dateWithPattern() {
        var fmt = new FieldValueFormatter();
        assertEquals("20260719", fmt.format("2026-07-19", "DATE", "yyyyMMdd"));
        assertEquals("2026-07-19", fmt.format(LocalDate.of(2026, 7, 19), "DATE", "yyyy-MM-dd"));
    }

    @Test
    void stringAndFailSafe() {
        var fmt = new FieldValueFormatter();
        assertEquals("hola", fmt.format("hola", "STRING", null));
        assertEquals("hola", fmt.format("hola", null, null));
        // no numerico con tipo NUMBER -> passthrough (no aborta)
        assertEquals("abc", fmt.format("abc", "NUMBER", "0.00"));
        // patron de fecha incompatible con el valor -> passthrough
        assertEquals("no-fecha", fmt.format("no-fecha", "DATE", "yyyyMMdd"));
        assertEquals("", fmt.format(null, "NUMBER", "0.00"));
    }

    @Test
    void roundingModeAndFailSafe() {
        var fmt = new FieldValueFormatter();
        // HALF_UP (default) vs HALF_EVEN sobre el mismo valor limitrofe.
        assertEquals("1000.51", fmt.format("1000.505", "NUMBER", "0.00", "HALF_UP"));
        assertEquals("1000.50", fmt.format("1000.505", "NUMBER", "0.00", "HALF_EVEN"));
        // rounding invalido -> fail-safe a HALF_UP; UNNECESSARY sobre valor que requiere redondeo -> valor crudo.
        assertEquals("1000.51", fmt.format("1000.505", "NUMBER", "0.00", "BOGUS"));
        assertEquals("1000.505", fmt.format("1000.505", "NUMBER", "0.00", "UNNECESSARY"));
    }

    @Test
    void reusesCachedFormatterAcrossManyCalls() {
        // Mismo (patron, rounding) repetido: la instancia memoiza el DecimalFormat; la salida debe ser estable.
        var fmt = new FieldValueFormatter();
        for (var i = 0; i < 1000; i++) {
            assertEquals("1234.50", fmt.format("1234.5", "NUMBER", "0.00"));
            assertEquals("20260719", fmt.format("2026-07-19", "DATE", "yyyyMMdd"));
        }
    }
}
