package com.integrationhub.vertical.swift.mt101.repository;

import com.integrationhub.vertical.swift.mt101.repository.Mt101RebuildRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * v49-fix: pruebas de INYECTIVIDAD de la serializacion canonica del hash del conjunto (pay_plan_set_hash V3).
 * No tocan la base de datos: validan directamente que tuplas de contrato distintas SIEMPRE producen cadenas
 * canonicas distintas (null != "", y un valor que contenga el separador no puede colisionar con otra combinacion
 * de campos). Con la serializacion V2 ('|'-join + null->"") varios de estos casos colisionaban.
 */
class Mt101PayPlanSetCanonicalTest {

    /** Construye una fila de 10 campos (el contrato completo) con overrides en posiciones concretas. */
    private static List<String> row(String... overridesPairsIndexThenValue) {
        var values = new ArrayList<>(Arrays.asList("ref", "payload", "idem", "REST", "ep",
                "ROUTE", "dest", "planhash", "specv", "spech"));
        for (int i = 0; i < overridesPairsIndexThenValue.length; i += 2) {
            values.set(Integer.parseInt(overridesPairsIndexThenValue[i]), overridesPairsIndexThenValue[i + 1]);
        }
        return values;
    }

    private static String canonical(List<String> values) {
        var sb = new StringBuilder();
        Mt101RebuildRepository.appendPayPlanSetRow(sb, values);
        return sb.toString();
    }

    @Test
    void nullAndEmptyStringAreDistinct() {
        var withNull = new ArrayList<>(row());
        withNull.set(4, null);          // endpoint_ref = NULL
        var withEmpty = new ArrayList<>(row());
        withEmpty.set(4, "");           // endpoint_ref = ""
        assertNotEquals(canonical(withNull), canonical(withEmpty),
                "null y cadena vacia deben producir canonicos distintos (V2 los igualaba)");
    }

    @Test
    void aValueContainingTheSeparatorCannotCollideWithAnotherFieldSplit() {
        // Bajo V2 ('|'-join) estas dos tuplas colisionaban: ["A|B",""] vs ["A","B"] -> ambas "A|B|...".
        var merged = row("0", "A|B", "1", "");    // ref="A|B", payload=""
        var split = row("0", "A", "1", "B");      // ref="A",   payload="B"
        assertNotEquals(canonical(merged), canonical(split),
                "un valor con '|' no puede colisionar con otra particion de campos (V2 colisionaba)");
    }

    @Test
    void aValueContainingNewlineCannotCollideWithAFieldBoundary() {
        var withNewline = row("0", "A\nB");        // ref contiene salto de linea
        var twoFields = row("0", "A", "1", "B");
        assertNotEquals(canonical(withNewline), canonical(twoFields),
                "un valor con '\\n' no puede colisionar con un limite de campo");
    }

    @Test
    void identicalTuplesProduceIdenticalCanonical() {
        assertEquals(canonical(row()), canonical(row()),
                "tuplas identicas producen el mismo canonico (determinista)");
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }

    @Test
    void streamingPerRowDigestEqualsTheMonolithicCanonicalDigest() throws Exception {
        // v50-fix: digestPayPlanSet alimenta el MessageDigest fila a fila (memoria O(fila)) en vez de acumular todo
        // el canonico. Esta prueba evidencia la invariante en la que se apoya: digerir las filas por partes produce
        // EXACTAMENTE el mismo hash que SHA-256 del canonico completo concatenado (bytes identicos, mismo V3).
        var rows = List.of(
                row("0", "AAA1", "3", "REST"),
                row("0", "AAA2", "4", null),
                row("0", "AAA3", "2", "A|B\nC"));

        var monolithic = new StringBuilder();
        for (var r : rows) {
            monolithic.append(canonical(r));
        }
        var monolithicHash = sha256Hex(monolithic.toString().getBytes(StandardCharsets.UTF_8));

        var streaming = MessageDigest.getInstance("SHA-256");
        for (var r : rows) {
            streaming.update(canonical(r).getBytes(StandardCharsets.UTF_8));
        }
        var streamingHash = HexFormat.of().formatHex(streaming.digest());

        assertEquals(monolithicHash, streamingHash,
                "el hash en streaming por filas debe ser identico al del canonico completo (mismo V3)");
    }

    @Test
    void everyFieldParticipatesInTheCanonical() {
        var base = canonical(row());
        for (int field = 0; field < 10; field++) {
            var mutated = row(Integer.toString(field), "CHANGED-" + field);
            assertNotEquals(base, canonical(mutated),
                    "cambiar el campo " + field + " del contrato debe cambiar el canonico");
        }
    }
}
