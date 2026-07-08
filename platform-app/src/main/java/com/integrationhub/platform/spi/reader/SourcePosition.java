package com.integrationhub.platform.spi.reader;

/**
 * Posición FÍSICA de un registro en su archivo origen, separada del ordinal lógico ({@code record_index}). Cierra la
 * pregunta "¿qué <b>línea</b> del archivo falló?" con precisión de auditoría: {@code record_index} es el n-ésimo
 * registro de datos (no cuenta cabeceras ni líneas físicas que un registro multilínea pueda ocupar), así que no
 * equivale a la línea física.
 *
 * <ul>
 *   <li>Formatos de línea (CSV/TXT/FIN): {@code physicalLine} 1-based (incluye cabeceras/blancos en la cuenta).</li>
 *   <li>Excel: {@code sheetName} + {@code sheetRow} 1-based (una hoja no tiene "línea" global).</li>
 * </ul>
 *
 * <p>Todos los campos son nullables: un reader que no aporta posición devuelve {@code null} y el registro se persiste
 * sin ella (no se inventa una línea). Es un objeto de valor inmutable (SRP: solo describe la posición).</p>
 */
public record SourcePosition(Long physicalLine, String sheetName, Long sheetRow) {

    /** Posición por línea física 1-based (CSV/TXT/FIN). */
    public static SourcePosition line(long physicalLine) {
        return new SourcePosition(physicalLine, null, null);
    }

    /** Posición por hoja + fila 1-based (Excel). */
    public static SourcePosition sheet(String sheetName, long sheetRow) {
        return new SourcePosition(null, sheetName, sheetRow);
    }
}
