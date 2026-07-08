package com.integrationhub.platform.spi.reader;

import java.util.Map;

/**
 * Un registro leído: sus valores por campo y, opcionalmente, su {@link SourcePosition} física en el archivo origen
 * (línea física / hoja+fila). {@code position} es nullable — un reader que no la aporta usa el constructor de 1 arg y
 * el registro se persiste sin posición (retrocompatible: no rompe los sitios que ya construyen {@code ReadRecord}).
 */
public record ReadRecord(Map<String, Object> values, SourcePosition position) {

    /** Retrocompatible: registro sin posición física (equivale a {@code position = null}). */
    public ReadRecord(Map<String, Object> values) {
        this(values, null);
    }
}
