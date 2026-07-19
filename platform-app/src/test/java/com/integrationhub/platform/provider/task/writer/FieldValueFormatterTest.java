package com.integrationhub.platform.provider.task.writer;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FieldValueFormatterTest {

    @Test
    void numberWithPattern() {
        assertEquals("5.00", FieldValueFormatter.format("5", "NUMBER", "0.00"));
        assertEquals("1,234.50", FieldValueFormatter.format("1234.5", "NUMBER", "#,##0.00"));
        assertEquals("3500.50", FieldValueFormatter.format(new BigDecimal("3500.50"), "NUMBER", null));
    }

    @Test
    void dateWithPattern() {
        assertEquals("20260719", FieldValueFormatter.format("2026-07-19", "DATE", "yyyyMMdd"));
        assertEquals("2026-07-19", FieldValueFormatter.format(LocalDate.of(2026, 7, 19), "DATE", "yyyy-MM-dd"));
    }

    @Test
    void stringAndFailSafe() {
        assertEquals("hola", FieldValueFormatter.format("hola", "STRING", null));
        assertEquals("hola", FieldValueFormatter.format("hola", null, null));
        // no numerico con tipo NUMBER -> passthrough (no aborta)
        assertEquals("abc", FieldValueFormatter.format("abc", "NUMBER", "0.00"));
        // patron de fecha incompatible con el valor -> passthrough
        assertEquals("no-fecha", FieldValueFormatter.format("no-fecha", "DATE", "yyyyMMdd"));
        assertEquals("", FieldValueFormatter.format(null, "NUMBER", "0.00"));
    }
}
