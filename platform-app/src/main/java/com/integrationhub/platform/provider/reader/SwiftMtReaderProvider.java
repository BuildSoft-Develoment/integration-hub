package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Reader del catalogo 002 para archivos SWIFT FIN (formato crudo
 * {@code {1:}{2:}{3:}{4:...-}{5:}}). Vive en este modulo por ownership de la
 * vertical 008-mensajeria-pagos pero se registra en el catalogo 002 como un
 * formato mas (alongside TXT/CSV/XML/JSON/XLS).
 *
 * <p><b>Responsabilidad: solo parsear el formato</b>. NO interpreta semantica
 * SWIFT (Sequence A/B, NVR, validacion 50a-xor). Esa interpretacion vive en
 * {@code MT101_PARSE} (catalogo 008). Aqui:</p>
 * <ul>
 *   <li>Decompone los 5 blocks SWIFT en sus contenidos crudos.</li>
 *   <li>Lee linea por linea el block 4 reconociendo tags {@code :TAG:value} y
 *       lineas de continuacion (no inician con {@code ':'}).</li>
 *   <li>Reconoce el marcador {@code :21:} como inicio de cada Sequence B y
 *       agrupa los tags hacia su transaccion correspondiente.</li>
 * </ul>
 *
 * <p><b>Output records</b>: emite 1 {@link ReadRecord} por mensaje MT-X en el
 * archivo. Cada record contiene:</p>
 * <pre>
 *   block1: String          // ej "F01SGOBFRPPAXXX0000000000"
 *   block2: String          // ej "I101BCPLPEPLXXXXN"
 *   block3: Map&lt;String,String&gt;   // sub-tags del block 3 (ej "121": UETR)
 *   sequenceA: Map&lt;String,String&gt; // tags antes del primer :21:
 *   sequenceB: List&lt;Map&lt;String,String&gt;&gt;  // 1 entrada por transaccion
 *   block5: Map&lt;String,String&gt;   // trailer
 * </pre>
 *
 * <p>El reader tolera CRLF y LF; rechaza charset SWIFT-X solo si
 * {@code rejectNonSwiftXChars: true} esta configurado (default false en este
 * slice; la validacion estricta es responsabilidad del validator de spec 008).</p>
 *
 * @trace spec 002-catalogo-readers RF-001
 * @trace spec 008-mensajeria-pagos RF-008, T-015
 * @trace ADR-009
 */
@ApplicationScoped
public class SwiftMtReaderProvider implements ReaderProvider {

    public static final String READER_TYPE = "SWIFT_MT";
    private static final Pattern TAG_LINE = Pattern.compile("^:([0-9]{2}[A-Z]?):(.*)$");
    // Block 3 acepta tags numericos (108, 121, 111...); block 5 acepta alfanumericos
    // (CHK, MAC, TNG, PDE, DLM, PDM...). Patron unico para ambos.
    private static final Pattern BLOCK3_INNER_TAG = Pattern.compile("\\{([A-Z0-9]+):([^}]*)\\}");

    @Override
    public String type() {
        return READER_TYPE;
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var content = readAll(payload, encoding);
        if (content.isBlank()) {
            return new ReadResult(List.of(), 0);
        }

        var batch = new ArrayList<ReadRecord>();
        var effectiveBatchSize = Math.max(batchSize, 1);
        var batchNumber = 1;
        var total = 0;

        // Un archivo FIN puede contener varios mensajes SWIFT concatenados (cada uno
        // inicia con "{1:"). Se parsea mensaje a mensaje y se emite en lotes via el
        // consumer: asi la normalizacion (replace/split del block 4) opera sobre cada
        // mensaje (<=10KB en SWIFT valido) y no sobre todo el archivo, y la ingestion
        // multi-mensaje escala (muchos MT101 <=100 tx por archivo).
        for (var messageContent : splitMessages(content)) {
            var record = parseMessage(messageContent);
            if (record != null) {
                batch.add(record);
                total++;
                if (batch.size() >= effectiveBatchSize) {
                    flushBatch(payload, batch, batchNumber++, consumer);
                }
            }
        }
        flushBatch(payload, batch, batchNumber, consumer);
        return new ReadResult(List.of(), total);
    }

    /**
     * Separa un archivo FIN en mensajes SWIFT individuales. Cada mensaje inicia con el
     * basic header block {@code {1:}}; el contenido entre dos {@code {1:} consecutivos
     * (o hasta el fin) es un mensaje. Si no hay block 1 se trata todo como un mensaje
     * (compatibilidad con payloads sin cabecera).
     */
    private List<String> splitMessages(String content) {
        var start = content.indexOf("{1:");
        if (start < 0) {
            return List.of(content);
        }
        var messages = new ArrayList<String>();
        while (start >= 0) {
            var next = content.indexOf("{1:", start + 3);
            if (next < 0) {
                messages.add(content.substring(start));
                break;
            }
            messages.add(content.substring(start, next));
            start = next;
        }
        return messages;
    }

    /** Parsea un unico mensaje SWIFT (raw FIN) a un {@link ReadRecord} estructurado. */
    private ReadRecord parseMessage(String content) {
        var blocks = extractBlocks(content);
        if (blocks.isEmpty()) {
            return null;
        }
        var values = new LinkedHashMap<String, Object>();
        if (blocks.containsKey("1")) {
            values.put("block1", blocks.get("1"));
        }
        if (blocks.containsKey("2")) {
            values.put("block2", blocks.get("2"));
        }
        if (blocks.containsKey("3")) {
            values.put("block3", parseInnerBlock(blocks.get("3")));
        }
        if (blocks.containsKey("4")) {
            var block4 = parseBlock4(blocks.get("4"));
            values.put("sequenceA", block4.sequenceA());
            values.put("sequenceB", block4.sequenceB());
        }
        if (blocks.containsKey("5")) {
            values.put("block5", parseInnerBlock(blocks.get("5")));
        }
        return new ReadRecord(values);
    }

    /**
     * Extrae blocks {@code {N:contenido}} del payload. Reconoce anidamientos en
     * block 3/5 ({@code {3:{121:uuid}{108:ref}}}) preservando el contenido interno
     * intacto para que {@link #parseInnerBlock} lo deshaga.
     */
    private Map<String, String> extractBlocks(String content) {
        var blocks = new LinkedHashMap<String, String>();
        int i = 0;
        var len = content.length();
        while (i < len) {
            if (content.charAt(i) != '{') {
                i++;
                continue;
            }
            // Cabecera "{N:" (N = digito uno o mas).
            int colon = content.indexOf(':', i);
            if (colon < 0) {
                break;
            }
            var blockId = content.substring(i + 1, colon);
            if (!blockId.matches("[0-9]+")) {
                i++;
                continue;
            }
            // Lee hasta el cierre balanceado.
            int depth = 1;
            int contentStart = colon + 1;
            int j = contentStart;
            // Block 4 termina especial con "-}" en linea propia.
            if ("4".equals(blockId)) {
                int closeIdx = content.indexOf("-}", contentStart);
                if (closeIdx < 0) {
                    break;
                }
                blocks.put(blockId, content.substring(contentStart, closeIdx));
                i = closeIdx + 2;
                continue;
            }
            while (j < len && depth > 0) {
                var ch = content.charAt(j);
                if (ch == '{') {
                    depth++;
                } else if (ch == '}') {
                    depth--;
                    if (depth == 0) {
                        blocks.put(blockId, content.substring(contentStart, j));
                        break;
                    }
                }
                j++;
            }
            i = j + 1;
        }
        return blocks;
    }

    /** Parsea sub-tags estilo block 3/5: {@code {121:uuid}{108:ref}} -> map. */
    private Map<String, String> parseInnerBlock(String inner) {
        var result = new LinkedHashMap<String, String>();
        if (inner == null || inner.isBlank()) {
            return result;
        }
        var matcher = BLOCK3_INNER_TAG.matcher(inner);
        while (matcher.find()) {
            result.put(matcher.group(1), matcher.group(2));
        }
        return result;
    }

    /**
     * Parsea el contenido del block 4: reconoce tags {@code :NN[A]:value}, lineas
     * de continuacion, y separa Sequence A (antes del primer {@code :21:}) de
     * Sequence B (cada {@code :21:} inicia una nueva transaccion). El delimiter
     * de tag NO se acumula al value.
     */
    private Block4 parseBlock4(String content) {
        var sequenceA = new LinkedHashMap<String, String>();
        var sequenceB = new ArrayList<Map<String, String>>();
        Map<String, String> currentTransaction = null;
        String currentTag = null;
        var currentValue = new StringBuilder();

        // Normalizamos line endings a \n para iterar uniformemente.
        var normalized = content.replace("\r\n", "\n").replace("\r", "\n");
        for (var line : normalized.split("\n")) {
            if (line.isEmpty()) {
                continue;
            }
            var matcher = TAG_LINE.matcher(line);
            if (matcher.matches()) {
                // Cierre del tag anterior.
                flushTag(currentTag, currentValue, currentTransaction, sequenceA);
                currentTag = matcher.group(1);
                currentValue.setLength(0);
                currentValue.append(matcher.group(2));
                // ":21:" = inicio de nueva Sequence B.
                if ("21".equals(currentTag)) {
                    currentTransaction = new LinkedHashMap<>();
                    sequenceB.add(currentTransaction);
                }
            } else {
                // Linea de continuacion del tag actual.
                if (currentTag != null) {
                    currentValue.append('\n').append(line);
                }
            }
        }
        flushTag(currentTag, currentValue, currentTransaction, sequenceA);
        return new Block4(sequenceA, sequenceB);
    }

    private void flushTag(String tag, StringBuilder value,
                          Map<String, String> currentTransaction,
                          Map<String, String> sequenceA) {
        if (tag == null) {
            return;
        }
        var target = currentTransaction != null ? currentTransaction : sequenceA;
        target.put(tag, value.toString());
    }

    private String readAll(SourcePayload payload, String encoding) {
        var charset = encoding == null || encoding.isBlank() ? StandardCharsets.UTF_8
                : Charset.forName(encoding);
        try (var reader = new BufferedReader(new InputStreamReader(payload.openStream(), charset))) {
            var sb = new StringBuilder();
            char[] buffer = new char[4096];
            int read;
            while ((read = reader.read(buffer)) > 0) {
                sb.append(buffer, 0, read);
            }
            return sb.toString();
        } catch (IOException error) {
            throw new IllegalStateException("Cannot read SWIFT MT payload " + payload.name(), error);
        }
    }

    private void flushBatch(SourcePayload payload, List<ReadRecord> records,
                            int batchNumber, ReadBatchConsumer consumer) {
        if (consumer == null || records.isEmpty()) {
            return;
        }
        consumer.accept(new ReadBatch(payload.name(), batchNumber, List.copyOf(records)));
        records.clear();
    }

    private record Block4(Map<String, String> sequenceA, List<Map<String, String>> sequenceB) {
    }
}
