package com.integrationhub.platform.task;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Proyecto #3, Fase 1 — contrato de <b>artefacto por referencia</b> para plugins remotos.
 *
 * <p>En vez de transferir el archivo completo como Base64 dentro del payload (que no escala), la plataforma pasa una
 * <b>referencia</b> a un object store (URL presignada de corta vida + método): el plugin remoto hace stream
 * <b>desde/hacia</b> ese store, y el mensaje solo lleva la referencia (pequeña). Desacopla el dato del canal de
 * control y sirve por igual a gRPC y broker.</p>
 *
 * <ul>
 *   <li><b>Reader</b> (plataforma → plugin): la plataforma stagea el archivo y presigna un <b>GET</b>; el plugin
 *       descarga por streaming.</li>
 *   <li><b>Source</b> (plugin → plataforma): la plataforma presigna un <b>PUT</b>; el plugin sube el archivo y la
 *       plataforma lo lee por streaming (p.ej. vía {@code S3SourceProvider}).</li>
 * </ul>
 *
 * <p>Serializable a/desde {@code Map<String,Object>} (primitivos) para viajar en el payload JSON del plugin, igual que
 * el resto del contrato. Sin dependencias de infra: la generación de la URL presignada vive en la plataforma; el
 * cliente (SDK del plugin) solo hace GET/PUT HTTP a la URL.</p>
 */
public record ArtifactReference(
        String uri,
        String method,
        String mediaType,
        long sizeBytes,
        long expiresAtEpochMs) {

    /** Clave bajo la que la referencia viaja en el payload/outputs (reemplaza a {@code contentBase64}). */
    public static final String ARTIFACT_REF = "artifactRef";

    public static final String URI = "uri";
    public static final String METHOD = "method";
    public static final String MEDIA_TYPE = "mediaType";
    public static final String SIZE_BYTES = "sizeBytes";
    public static final String EXPIRES_AT = "expiresAtEpochMs";

    public static final String GET = "GET";
    public static final String PUT = "PUT";

    public ArtifactReference {
        if (uri == null || uri.isBlank()) {
            throw new IllegalArgumentException("artifact reference: uri requerida");
        }
        method = (method == null || method.isBlank()) ? GET : method.trim().toUpperCase(Locale.ROOT);
        if (!GET.equals(method) && !PUT.equals(method)) {
            throw new IllegalArgumentException("artifact reference: method debe ser GET o PUT, fue " + method);
        }
        mediaType = mediaType == null ? "" : mediaType;
        sizeBytes = Math.max(0, sizeBytes);
        expiresAtEpochMs = Math.max(0, expiresAtEpochMs);
    }

    /** Referencia de descarga (reader): el plugin hace GET del archivo staged. */
    public static ArtifactReference get(String uri, String mediaType, long sizeBytes, long expiresAtEpochMs) {
        return new ArtifactReference(uri, GET, mediaType, sizeBytes, expiresAtEpochMs);
    }

    /** Referencia de subida (source): el plugin hace PUT del archivo producido. */
    public static ArtifactReference put(String uri, String mediaType, long expiresAtEpochMs) {
        return new ArtifactReference(uri, PUT, mediaType, 0, expiresAtEpochMs);
    }

    public Map<String, Object> asMap() {
        var map = new LinkedHashMap<String, Object>();
        map.put(URI, uri);
        map.put(METHOD, method);
        map.put(MEDIA_TYPE, mediaType);
        map.put(SIZE_BYTES, sizeBytes);
        map.put(EXPIRES_AT, expiresAtEpochMs);
        return Collections.unmodifiableMap(map);
    }

    public static ArtifactReference fromMap(Map<String, Object> map) {
        if (map == null) {
            throw new IllegalArgumentException("artifact reference: map requerido");
        }
        return new ArtifactReference(
                str(map.get(URI)),
                str(map.get(METHOD)),
                str(map.get(MEDIA_TYPE)),
                lng(map.get(SIZE_BYTES)),
                lng(map.get(EXPIRES_AT)));
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static long lng(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        var text = str(value);
        return text == null || text.isBlank() ? 0L : Long.parseLong(text.trim());
    }
}
