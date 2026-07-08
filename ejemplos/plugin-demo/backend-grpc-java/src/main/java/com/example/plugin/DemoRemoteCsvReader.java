package com.example.plugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pure remote-reader logic for DEMO_REMOTE_CSV.
 *
 * <p>The platform stages the source file and passes an artifactRef GET in configuration_json. This reader downloads the
 * artifact by HTTP, optionally with a Range header derived from the cursor, and returns one page of records plus
 * nextCursor. It intentionally depends only on JDK types so the plugin remains independent from platform-contract.</p>
 */
public final class DemoRemoteCsvReader {

    public static final String READER_TYPE = "DEMO_REMOTE_CSV";
    public static final String TASK_TYPE = "READER_READ:" + READER_TYPE;

    private final HttpClient http;

    public DemoRemoteCsvReader() {
        this(HttpClient.newHttpClient());
    }

    DemoRemoteCsvReader(HttpClient http) {
        this.http = http;
    }

    public Map<String, Object> read(Map<String, Object> request) throws IOException, InterruptedException {
        var artifactRef = objectMap(request.get("artifactRef"), "artifactRef");
        var uri = required(artifactRef.get("uri"), "artifactRef.uri is required");
        var method = string(artifactRef.get("method"));
        if (!"GET".equalsIgnoreCase(method)) {
            throw new IllegalArgumentException("DEMO_REMOTE_CSV requires artifactRef.method=GET");
        }

        var configuration = optionalObjectMap(request.get("configuration"));
        var delimiter = stringOrDefault(configuration.get("delimiter"), ",");
        var columns = columns(configuration.get("columns"));
        var batchSize = positiveInt(request.get("batchSize"), 100);
        var cursor = positiveLong(request.get("cursor"), 0L);

        var records = new ArrayList<Map<String, Object>>();
        long nextOffset = cursor;
        boolean endedAtEof = false;
        try (var body = openRange(uri, cursor)) {
            while (records.size() < batchSize) {
                var line = readLine(body);
                if (line == null) {
                    endedAtEof = true;
                    break;
                }
                nextOffset += line.rawBytesRead();
                if (line.text().isBlank()) {
                    if (line.endedAtEof()) {
                        endedAtEof = true;
                        break;
                    }
                    continue;
                }
                records.add(record(line.text(), delimiter, columns));
                if (line.endedAtEof()) {
                    endedAtEof = true;
                    break;
                }
            }
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("records", records);
        outputs.put("skippedRows", List.of());
        if (!endedAtEof && !records.isEmpty()) {
            outputs.put("nextCursor", String.valueOf(nextOffset));
        }
        return outputs;
    }

    private InputStream openRange(String uri, long cursor) throws IOException, InterruptedException {
        var builder = HttpRequest.newBuilder(URI.create(uri)).GET();
        if (cursor > 0) {
            builder.header("Range", "bytes=" + cursor + "-");
        }
        var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofInputStream());
        var status = response.statusCode();
        if (status != 200 && status != 206) {
            throw new IOException("artifact GET failed: HTTP " + status);
        }
        return response.body();
    }

    private static Line readLine(InputStream input) throws IOException {
        var buffer = new ByteArrayOutputStream();
        int count = 0;
        while (true) {
            int next = input.read();
            if (next < 0) {
                if (count == 0) {
                    return null;
                }
                return new Line(trimLine(buffer.toString(StandardCharsets.UTF_8)), count, true);
            }
            count++;
            if (next == '\n') {
                return new Line(trimLine(buffer.toString(StandardCharsets.UTF_8)), count, false);
            }
            buffer.write(next);
        }
    }

    private static String trimLine(String line) {
        return line.endsWith("\r") ? line.substring(0, line.length() - 1) : line;
    }

    private static Map<String, Object> record(String line, String delimiter, List<String> columns) {
        var values = line.split(java.util.regex.Pattern.quote(delimiter), -1);
        var record = new LinkedHashMap<String, Object>();
        for (int index = 0; index < values.length; index++) {
            var key = index < columns.size() ? columns.get(index) : "c" + (index + 1);
            record.put(key, values[index].trim());
        }
        return record;
    }

    private static List<String> columns(Object value) {
        if (!(value instanceof List<?> raw)) {
            return List.of();
        }
        return raw.stream()
                .filter(item -> item != null && !String.valueOf(item).isBlank())
                .map(item -> String.valueOf(item).trim())
                .toList();
    }

    private static Map<String, Object> objectMap(Object value, String field) {
        var map = optionalObjectMap(value);
        if (map.isEmpty()) {
            throw new IllegalArgumentException(field + " must be an object");
        }
        return map;
    }

    private static Map<String, Object> optionalObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> raw)) {
            return Map.of();
        }
        var copy = new LinkedHashMap<String, Object>();
        for (var entry : raw.entrySet()) {
            if (entry.getKey() instanceof String key) {
                copy.put(key, entry.getValue());
            }
        }
        return copy;
    }

    private static String required(Object value, String message) {
        var text = string(value);
        if (text.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return text;
    }

    private static String string(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String stringOrDefault(Object value, String fallback) {
        var text = string(value);
        return text.isBlank() ? fallback : text;
    }

    private static int positiveInt(Object value, int fallback) {
        var text = string(value);
        if (text.isBlank()) {
            return fallback;
        }
        return Math.max(1, Integer.parseInt(text));
    }

    private static long positiveLong(Object value, long fallback) {
        var text = string(value);
        if (text.isBlank()) {
            return fallback;
        }
        return Math.max(0L, Long.parseLong(text));
    }

    private record Line(String text, int rawBytesRead, boolean endedAtEof) {
    }
}
