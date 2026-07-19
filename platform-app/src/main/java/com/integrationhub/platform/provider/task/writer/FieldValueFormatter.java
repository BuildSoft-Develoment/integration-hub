package com.integrationhub.platform.provider.task.writer;

// @trace ADR-016 (salida generica: formateo de campos por tipo/patron para writers CSV/TXT)

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.Locale;

/**
 * ADR-016: formatea el valor de un campo segun {@code type} ({@code STRING}/{@code NUMBER}/{@code DATE}) y un
 * {@code format} (patron) opcional, antes de que el writer (CSV/TXT) lo renderice. Cierra la "complejidad de campos":
 * decimales fijos, agrupacion, fechas {@code yyyyMMdd}, etc. <b>Fail-safe</b>: si el valor no encaja con el tipo/patron,
 * cae al {@code String.valueOf} crudo (nunca aborta la escritura por un valor suelto).
 */
final class FieldValueFormatter {

    private FieldValueFormatter() {
    }

    static String format(Object value, String type, String pattern) {
        return format(value, type, pattern, null);
    }

    static String format(Object value, String type, String pattern, String rounding) {
        if (value == null) {
            return "";
        }
        var normalizedType = type == null ? "STRING" : type.trim().toUpperCase(Locale.ROOT);
        return switch (normalizedType) {
            case "NUMBER", "DECIMAL", "INTEGER" -> formatNumber(value, pattern, rounding);
            case "DATE", "DATETIME" -> formatDate(value, pattern);
            default -> String.valueOf(value);
        };
    }

    private static String formatNumber(Object value, String pattern, String rounding) {
        BigDecimal number;
        try {
            number = value instanceof BigDecimal decimal ? decimal : new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException notNumeric) {
            return String.valueOf(value);
        }
        if (pattern == null || pattern.isBlank()) {
            return number.toPlainString();
        }
        try {
            // Locale.ROOT: punto decimal y sin agrupacion salvo que el patron la pida ('#,##0.00').
            var decimalFormat = new DecimalFormat(pattern, DecimalFormatSymbols.getInstance(Locale.ROOT));
            decimalFormat.setRoundingMode(roundingMode(rounding));
            return decimalFormat.format(number);
        } catch (IllegalArgumentException badPattern) {
            return number.toPlainString();
        }
    }

    /**
     * Modo de redondeo por nombre ({@link RoundingMode}: {@code HALF_UP}, {@code HALF_EVEN}, {@code DOWN}, ...).
     * Default {@code HALF_UP} (redondeo comercial: 0.005 -> 0.01), no el {@code HALF_EVEN} por defecto de DecimalFormat.
     * Fail-safe: un nombre invalido cae a {@code HALF_UP}.
     */
    private static RoundingMode roundingMode(String rounding) {
        if (rounding == null || rounding.isBlank()) {
            return RoundingMode.HALF_UP;
        }
        try {
            return RoundingMode.valueOf(rounding.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException unknown) {
            return RoundingMode.HALF_UP;
        }
    }

    private static String formatDate(Object value, String pattern) {
        if (pattern == null || pattern.isBlank()) {
            return String.valueOf(value);
        }
        var temporal = toTemporal(value);
        if (temporal == null) {
            return String.valueOf(value);
        }
        try {
            return DateTimeFormatter.ofPattern(pattern, Locale.ROOT).format(temporal);
        } catch (RuntimeException incompatible) {
            // El patron pide campos que el temporal no tiene (p. ej. hora sobre un LocalDate) -> crudo.
            return String.valueOf(value);
        }
    }

    private static TemporalAccessor toTemporal(Object value) {
        if (value instanceof TemporalAccessor temporal) {
            return temporal;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(ZoneOffset.UTC);
        }
        var text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        for (var parser : PARSERS) {
            try {
                return parser.parse(text);
            } catch (RuntimeException ignored) {
                // prueba el siguiente formato
            }
        }
        return null;
    }

    @FunctionalInterface
    private interface TemporalParser {
        TemporalAccessor parse(String text);
    }

    private static final TemporalParser[] PARSERS = {
            LocalDateTime::parse,
            LocalDate::parse,
            Instant::parse,
    };
}
