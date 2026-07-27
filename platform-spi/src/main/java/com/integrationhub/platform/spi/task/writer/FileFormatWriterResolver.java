package com.integrationhub.platform.spi.task.writer;

/**
 * ADR-021: resuelve el {@link FileFormatWriter} de un formato.
 *
 * <p>El SPI ya declara el punto de extension ({@code FileFormatWriter}); esto declara como
 * <b>alcanzarlo</b>. Sin el puerto, quien quiera escribir un archivo tendria que conocer el registry
 * del motor — o peor, repetir la resolucion por su cuenta y divergir en el matching del formato.</p>
 *
 * <p>El registry vive en el motor junto a sus hermanos (readers, sources, sinks, compressors); aca
 * solo viaja el contrato.</p>
 */
public interface FileFormatWriterResolver {

    /**
     * @param format nombre del formato (case-insensitive), p.ej. {@code CSV} o {@code XLSX}
     * @return el escritor registrado para ese formato
     * @throws IllegalArgumentException si ningun escritor declara ese formato
     */
    FileFormatWriter resolve(String format);
}
