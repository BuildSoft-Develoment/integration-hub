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

    /**
     * Valor de un campo, tolerante a mayúsculas/minúsculas. <b>Es la forma canónica de leer un campo</b>:
     * nadie debería hacer {@code values().get(...)} directamente.
     *
     * <p>Motivo: las claves de un registro leído de tabla son las etiquetas que devuelve el driver JDBC,
     * y cada motor las escribe a su manera — Oracle pone en MAYÚSCULAS los identificadores no
     * entrecomillados, PostgreSQL los pasa a minúsculas. La configuración del usuario, en cambio, se
     * escribe una sola vez: si se redactó contra PostgreSQL ({@code id}) y luego el proceso se reapunta a
     * Oracle (que devuelve {@code ID}), un {@code get} exacto no encuentra nada y el campo llega vacío en
     * silencio. Con los ficheros pasa lo mismo cuando la cabecera del CSV no respeta el caso configurado.
     *
     * <p>La coincidencia exacta tiene prioridad, de modo que una tabla con columnas entrecomilladas
     * distinguibles sigue resolviéndose sin ambigüedad. Solo si no hay exacta se busca ignorando el caso.
     *
     * @throws IllegalStateException si más de un campo coincide ignorando el caso (p. ej. una tabla con
     *         {@code "id"} y {@code "ID"} entrecomilladas). Elegir uno al azar sería peor que fallar:
     *         daría un resultado distinto según el orden de las columnas.
     */
    public Object value(String field) {
        if (field == null) {
            return null;
        }
        if (values.containsKey(field)) {
            return values.get(field);
        }
        String matchedKey = null;
        for (var key : values.keySet()) {
            if (field.equalsIgnoreCase(key)) {
                if (matchedKey != null) {
                    throw new IllegalStateException("Ambiguous field '" + field
                            + "': the record has several columns that differ only in case (" + matchedKey
                            + ", " + key + ")");
                }
                matchedKey = key;
            }
        }
        return matchedKey == null ? null : values.get(matchedKey);
    }
}
