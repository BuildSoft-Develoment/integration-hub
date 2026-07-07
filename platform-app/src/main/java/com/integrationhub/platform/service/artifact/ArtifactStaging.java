package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.task.ArtifactReference;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;

/**
 * Proyecto #3, Fase 2 — staging de artefactos en un object store para el streaming de plugins remotos (opción B).
 *
 * <p>Abstracción (DIP) que aísla a los providers remotos del object store concreto. La impl productiva
 * ({@code S3ArtifactStaging}) usa S3/MinIO. Modela el caso <b>source</b> (plugin → plataforma): la plataforma presigna
 * un PUT de corta vida, el plugin sube el archivo por esa URL, y la plataforma lo lee por streaming.</p>
 */
public interface ArtifactStaging {

    /**
     * Presigna una subida (PUT) de corta vida a una key única. Devuelve la {@link ArtifactReference} (PUT) para pasar
     * al plugin y la {@code key} interna con la que la plataforma leerá/limpiará el objeto.
     */
    StagedUpload presignUpload(String mediaType, Duration ttl);

    /**
     * Abre el objeto staged como stream. <b>El {@code close()} del stream BORRA el objeto</b> (delete-on-close): así el
     * cleanup ocurre cuando el reader terminó de consumir, no antes (evita borrar-antes-de-leer). Una lifecycle-expiry
     * del bucket es la red de seguridad ante fallo/leak.
     */
    InputStream openAndDeleteOnClose(String key) throws IOException;

    /**
     * Proyecto #3, Fase 3a (caso reader) — la plataforma SUBE {@code content} al staging (por streaming) y presigna un
     * GET de corta vida para que el plugin lo DESCARGUE. Devuelve la referencia (GET) + la key interna. El caller borra
     * con {@link #deleteStaged} tras el READ (aquí el consumidor es el plugin, no la plataforma → no delete-on-close).
     *
     * @param sizeBytes tamaño conocido del contenido (para subir por streaming sin materializar); {@code <= 0} = usar
     *                  fallback materializando (tamaño desconocido).
     */
    StagedDownload stageForDownload(InputStream content, String mediaType, long sizeBytes, Duration ttl) throws IOException;

    /** Borra un objeto de staging (cleanup del caso reader, tras el READ). */
    void deleteStaged(String key);
}
