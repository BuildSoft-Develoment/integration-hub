package com.integrationhub.platform.spi.reader;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-022: lectura de campos tolerante al caso.
 *
 * <p>Las claves de un registro leido de tabla son las etiquetas del driver JDBC, y cada motor las
 * escribe a su manera: Oracle en MAYUSCULAS, PostgreSQL en minusculas. La configuracion del usuario se
 * escribe una sola vez, de modo que un proceso redactado contra PostgreSQL y reapuntado a Oracle
 * encontraba el campo vacio en silencio.
 */
class ReadRecordValueTest {

    @Test
    void findsTheFieldWhateverCaseTheEngineUsed() {
        // Oracle devuelve ID; la configuracion dice id.
        var record = new ReadRecord(Map.of("ID", 7, "NAME", "siete"));

        assertEquals(7, record.value("id"));
        assertEquals("siete", record.value("name"));
    }

    @Test
    void anExactMatchWinsOverACaseInsensitiveOne() {
        // Con columnas entrecomilladas distinguibles, la exacta manda y no hay ambiguedad.
        var values = new LinkedHashMap<String, Object>();
        values.put("ID", "mayusculas");
        values.put("id", "minusculas");
        var record = new ReadRecord(values);

        assertEquals("minusculas", record.value("id"));
        assertEquals("mayusculas", record.value("ID"));
    }

    @Test
    void anAmbiguousFieldFailsLoudInsteadOfPickingOne() {
        // Ninguna coincide de forma exacta con "Id", pero dos lo hacen ignorando el caso: elegir una
        // daria un resultado distinto segun el orden de las columnas.
        var values = new LinkedHashMap<String, Object>();
        values.put("ID", "mayusculas");
        values.put("id", "minusculas");
        var record = new ReadRecord(values);

        var error = assertThrows(IllegalStateException.class, () -> record.value("Id"));

        assertTrue(error.getMessage().contains("Ambiguous field 'Id'"), error.getMessage());
    }

    @Test
    void anUnknownFieldIsNullAndANullFieldDoesNotBlowUp() {
        var record = new ReadRecord(Map.of("ID", 7));

        assertNull(record.value("otra"));
        assertNull(record.value(null));
    }

    @Test
    void aNullValueUnderAnExactKeyIsNotConfusedWithAMissingField() {
        // `containsKey` y no `get() != null`: una columna presente con valor NULL debe devolver null sin
        // caer a la busqueda por caso, que podria encontrar otra columna distinta.
        var values = new LinkedHashMap<String, Object>();
        values.put("importe", null);
        values.put("IMPORTE", "no deberia elegirse");
        var record = new ReadRecord(values);

        assertNull(record.value("importe"));
    }
}
