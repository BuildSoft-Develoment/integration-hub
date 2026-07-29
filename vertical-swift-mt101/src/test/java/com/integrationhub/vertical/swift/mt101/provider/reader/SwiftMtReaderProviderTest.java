package com.integrationhub.vertical.swift.mt101.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 002-catalogo-readers RF-001
 * @covers spec 008-mensajeria-pagos RF-008, T-015
 */
class SwiftMtReaderProviderTest {

    private SwiftMtReaderProvider reader;

    @BeforeEach
    void setUp() {
        reader = new SwiftMtReaderProvider();
    }

    @Test
    void typeIsSwiftMt() {
        assertEquals("SWIFT_MT", reader.type());
    }

    @Test
    void parsesAllFiveBlocksAndSeparatesSequences() {
        var fin = "{1:F01SGOBFRPPAXXX0000000000}"
                + "{2:I101BCPLPEPLXXXXN}"
                + "{3:{121:3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c}}"
                + "{4:\r\n"
                + ":20:PROC-1\r\n"
                + ":28D:1/1\r\n"
                + ":30:260609\r\n"
                + ":50H:/001-10200200\r\n"
                + "EMPRESA INTEGRADORA SAC\r\n"
                + "LIMA PE\r\n"
                + ":52A:BCPLPEPLXXX\r\n"
                + ":21:TX-001\r\n"
                + ":32B:PEN20000,\r\n"
                + ":57A:BCPLPEPL\r\n"
                + ":59:/0072-987654321\r\n"
                + "JUAN PEREZ\r\n"
                + ":70:SUELDO MAYO\r\n"
                + ":71A:OUR\r\n"
                + ":21:TX-002\r\n"
                + ":32B:PEN15500,5\r\n"
                + ":57A:BBVAPEPLXXX\r\n"
                + ":59:/0011-123456789\r\n"
                + "MARIA GARCIA\r\n"
                + ":70:PROVEEDOR\r\n"
                + ":71A:SHA\r\n"
                + "-}"
                + "{5:{CHK:000000000000}}";

        var captured = new ArrayList<ReadBatch>();
        var result = reader.readInBatches(
                SourcePayload.fromBytes("test.fin", fin.getBytes(StandardCharsets.UTF_8), "application/x-swift"),
                Map.of(), 10,
                captured::add);

        assertEquals(1, result.recordCount(), "1 mensaje => 1 record");
        assertEquals(1, captured.size());
        var record = captured.get(0).records().get(0);
        var values = record.values();

        // Block 1 y 2 sin estructurar (solo el contenido crudo).
        assertEquals("F01SGOBFRPPAXXX0000000000", values.get("block1"));
        assertEquals("I101BCPLPEPLXXXXN", values.get("block2"));

        // Block 3: UETR extraido del sub-tag 121.
        @SuppressWarnings("unchecked")
        var block3 = (Map<String, String>) values.get("block3");
        assertEquals("3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c", block3.get("121"));

        // SequenceA: tags antes del primer :21:.
        @SuppressWarnings("unchecked")
        var seqA = (Map<String, String>) values.get("sequenceA");
        assertEquals("PROC-1", seqA.get("20"));
        assertEquals("1/1", seqA.get("28D"));
        assertEquals("260609", seqA.get("30"));
        assertEquals("BCPLPEPLXXX", seqA.get("52A"));
        // 50H es multilinea con account + name+address.
        assertTrue(seqA.get("50H").contains("/001-10200200"));
        assertTrue(seqA.get("50H").contains("EMPRESA INTEGRADORA SAC"));
        assertTrue(seqA.get("50H").contains("LIMA PE"));

        // SequenceB: 2 transacciones detectadas.
        @SuppressWarnings("unchecked")
        var seqB = (List<Map<String, String>>) values.get("sequenceB");
        assertEquals(2, seqB.size());
        var tx1 = seqB.get(0);
        assertEquals("TX-001", tx1.get("21"));
        assertEquals("PEN20000,", tx1.get("32B"));
        assertEquals("OUR", tx1.get("71A"));
        assertEquals("BCPLPEPL", tx1.get("57A"));
        var tx2 = seqB.get(1);
        assertEquals("TX-002", tx2.get("21"));
        assertEquals("PEN15500,5", tx2.get("32B"));
        assertEquals("SHA", tx2.get("71A"));

        // Block 5: trailer.
        @SuppressWarnings("unchecked")
        var block5 = (Map<String, String>) values.get("block5");
        assertEquals("000000000000", block5.get("CHK"));
    }

    @Test
    void toleratesLfOnlyLineEndings() {
        var fin = "{1:F01XXXXXXXXXXXX0000000000}"
                + "{2:I101YYYYYYYYYYYYN}"
                + "{4:\n"
                + ":20:REF\n"
                + ":28D:1/1\n"
                + ":30:260101\n"
                + ":21:TX1\n"
                + ":32B:USD100,\n"
                + ":59:/A\nBENEF\n"
                + ":71A:OUR\n"
                + "-}"
                + "{5:{CHK:0}}";

        var captured = new ArrayList<ReadBatch>();
        reader.readInBatches(SourcePayload.fromBytes("lf.fin",
                fin.getBytes(StandardCharsets.UTF_8), "application/x-swift"),
                Map.of(), 10, captured::add);

        var record = captured.get(0).records().get(0);
        @SuppressWarnings("unchecked")
        var seqA = (Map<String, String>) record.values().get("sequenceA");
        assertEquals("REF", seqA.get("20"));
    }

    @Test
    void returnsZeroRecordsForBlankPayload() {
        var result = reader.readInBatches(
                SourcePayload.fromBytes("empty.fin", "".getBytes(StandardCharsets.UTF_8), "application/x-swift"),
                Map.of(), 10, batch -> {});
        assertEquals(0, result.recordCount());
    }

    @Test
    void preservesMultilineTagValueForBeneficiary() {
        var fin = "{1:F01XXXXXXXXXXXX0000000000}"
                + "{2:I101YYYYYYYYYYYYN}"
                + "{4:\r\n"
                + ":20:R1\r\n"
                + ":28D:1/1\r\n"
                + ":30:260101\r\n"
                + ":21:TX1\r\n"
                + ":32B:PEN1,\r\n"
                + ":59F:/12345\r\n"
                + "1/JUAN PEREZ LOPEZ\r\n"
                + "2/AV. LARGA 123\r\n"
                + "3/LIMA PE\r\n"
                + ":71A:OUR\r\n"
                + "-}"
                + "{5:{CHK:0}}";

        var captured = new ArrayList<ReadBatch>();
        reader.readInBatches(SourcePayload.fromBytes("multi.fin",
                fin.getBytes(StandardCharsets.UTF_8), "application/x-swift"),
                Map.of(), 10, captured::add);

        var record = captured.get(0).records().get(0);
        @SuppressWarnings("unchecked")
        var seqB = (List<Map<String, String>>) record.values().get("sequenceB");
        var beneficiary = seqB.get(0).get("59F");
        assertNotNull(beneficiary);
        // El value debe preservar TODAS las lineas, incluyendo el account y los
        // codes 1/2/3/.
        assertTrue(beneficiary.contains("/12345"));
        assertTrue(beneficiary.contains("1/JUAN PEREZ LOPEZ"));
        assertTrue(beneficiary.contains("3/LIMA PE"));
    }

    @Test
    void readsMultipleConcatenatedMessagesPerFileInBatches() {
        // Tres mensajes MT101 concatenados en un mismo archivo FIN (cada uno {1:..}).
        var sb = new StringBuilder();
        for (int m = 1; m <= 3; m++) {
            sb.append("{1:F01SGOBFRPPAXXX0000000000}")
              .append("{2:I101BCPLPEPLXXXXN}")
              .append("{4:\r\n")
              .append(":20:R-").append(m).append("\r\n")
              .append(":28D:1/1\r\n")
              .append(":30:260101\r\n")
              .append(":21:T").append(m).append("A\r\n")
              .append(":32B:PEN10,\r\n")
              .append(":59:/000").append(m).append("\r\nBENEF ").append(m).append("\r\n")
              .append(":71A:OUR\r\n")
              .append(":21:T").append(m).append("B\r\n")
              .append(":32B:PEN20,\r\n")
              .append(":59:/111").append(m).append("\r\nBENEF2 ").append(m).append("\r\n")
              .append(":71A:SHA\r\n")
              .append("-}{5:{CHK:0}}");
        }

        var captured = new ArrayList<ReadBatch>();
        // batchSize=2 -> 2 lotes (2 + 1) para 3 mensajes.
        var result = reader.readInBatches(SourcePayload.fromBytes("multi-msg.fin",
                sb.toString().getBytes(StandardCharsets.UTF_8), "application/x-swift"),
                Map.of(), 2, captured::add);

        assertEquals(3, result.recordCount(), "un record por mensaje SWIFT del archivo");
        var allRecords = captured.stream().flatMap(b -> b.records().stream()).toList();
        assertEquals(3, allRecords.size());
        assertEquals(2, captured.size(), "batchSize=2 debe producir 2 lotes (2 + 1)");
        for (int m = 1; m <= 3; m++) {
            var record = allRecords.get(m - 1);
            @SuppressWarnings("unchecked")
            var seqA = (Map<String, String>) record.values().get("sequenceA");
            @SuppressWarnings("unchecked")
            var seqB = (List<Map<String, String>>) record.values().get("sequenceB");
            assertEquals("R-" + m, seqA.get("20"));
            assertEquals(2, seqB.size(), "cada mensaje tiene 2 transacciones");
        }
    }
}
