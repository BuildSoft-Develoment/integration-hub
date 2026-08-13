package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 (lectura de la config de conexion compartida por los sinks de salida)

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Lectura de la {@code configuration} de conexion que comparten los {@code OutputSink}.
 *
 * <p>Es el espejo de {@code SourceConfigurationSupport}, que no se puede reutilizar: es
 * package-private del paquete de fuentes y ademas resuelve cosas que la salida no tiene
 * (plantillas de seleccion, reglas de nombre). Aqui solo esta la lectura de escalares.</p>
 *
 * <p>Nace de tener que escribir cuatro sinks nuevos: los helpers estaban duplicados dentro de
 * {@code SftpSink}, y copiarlos cuatro veces mas habria garantizado cuatro versiones distintas del
 * mismo <i>parse</i> —y que un arreglo en una no llegara a las otras—.</p>
 *
 * <p>Cada mensaje de error nombra el sink: quien lo lee esta mirando un proceso que no entrego, y
 * "requires 'bucket'" sin decir cual de los destinos ahorra media hora de busqueda.</p>
 */
final class SinkConfigurationSupport {

    private SinkConfigurationSupport() {
    }

    /** Valor obligatorio. Falla ANTES de tocar la red: una config incompleta no merece un timeout. */
    static String requireString(Map<String, Object> configuration, String key, String sinkLabel) {
        var value = optionalString(configuration, key);
        if (value == null) {
            throw new IllegalArgumentException(sinkLabel + " sink requires '" + key + "'");
        }
        return value;
    }

    /** {@code null} si falta o viene en blanco: un valor vacio es ausencia, no un valor. */
    static String optionalString(Map<String, Object> configuration, String key) {
        var raw = configuration == null ? null : configuration.get(key);
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    static String optionalString(Map<String, Object> configuration, String key, String defaultValue) {
        var value = optionalString(configuration, key);
        return value == null ? defaultValue : value;
    }

    static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        var value = optionalString(configuration, key);
        return value == null ? defaultValue : Integer.parseInt(value);
    }

    static boolean optionalBoolean(Map<String, Object> configuration, String key, boolean defaultValue) {
        var value = optionalString(configuration, key);
        return value == null ? defaultValue : Boolean.parseBoolean(value);
    }

    /** Igual que el de {@code SourceConfigurationSupport}: {@code {yyyyMM}}, {@code {dd}}... */
    private static final Pattern PLANTILLA = Pattern.compile("\\{[^{}]+}");

    /**
     * Compone la clave final a partir del prefijo de la conexion y el {@code dropPath} de la tarea.
     *
     * <p>El {@code dropPath} se interpreta RELATIVO al prefijo, asi que se le quita la barra inicial. Sin
     * eso, un {@code dropPath} escrito como {@code /SUCAVE/0228.A01} contra un prefijo {@code envios/}
     * produciria la clave {@code envios//SUCAVE/0228.A01} —valida en un object store, y por eso
     * peligrosa: el archivo se sube, nadie falla, y aparece en una carpeta vacia que no es la que
     * alguien esta mirando—.</p>
     *
     * <p>Es la misma interpretacion relativa que hace {@code FilesystemSink}, con una diferencia
     * deliberada: alli, sin ruta base, el {@code dropPath} se respeta tal cual y {@code /a/b.txt} es una
     * ruta absoluta legitima; aqui la barra inicial se quita siempre, porque una clave de object store
     * que empieza por {@code /} crea un nivel de nombre vacio que casi nadie quiere.</p>
     *
     * <p><b>Aviso para quien configure:</b> los sinks NO tratan igual las rutas de la conexion.
     * {@code FILESYSTEM} usa su {@code path} como base, y los de objeto usan su {@code prefix} —de ahi
     * este metodo—. Los de (S)FTP <b>ignoran</b> el {@code remotePath} de la conexion: ahi el
     * {@code dropPathTemplate} de la tarea lleva la ruta remota completa. No es un descuido, es la
     * convencion que {@code SftpSink} lleva en produccion desde ADR-016 y que {@code FtpSink} sigue por
     * simetria; unificarla cambiaria donde aterrizan las entregas ya configuradas.</p>
     */
    static String joinPrefix(String prefix, String dropPath) {
        rejectTemplate(prefix);
        var relative = dropPath.startsWith("/") ? dropPath.substring(1) : dropPath;
        if (prefix == null || prefix.isBlank()) {
            return relative;
        }
        var base = prefix.endsWith("/") ? prefix.substring(0, prefix.length() - 1) : prefix;
        return base + "/" + relative;
    }

    /**
     * Un {@code prefix} con plantilla se rechaza en vez de escribirse literal.
     *
     * <p>La MISMA definicion {@code /sources} sirve de entrada y de salida, pero no la leen igual: al
     * leer, {@code SourceConfigurationSupport.resolvePathTemplate} resuelve {@code {yyyyMM}} y compania;
     * al escribir no hay tal resolucion. Con un prefijo {@code envios/{yyyyMM}/}, la lectura miraria en
     * {@code envios/202608/} y la escritura crearia una carpeta llamada, literalmente,
     * <code>{yyyyMM}</code>. Nada fallaria: el archivo se sube y desaparece de la vista.</p>
     *
     * <p>No se resuelve aqui a proposito. La fecha del artefacto de salida la pone el
     * {@code dropPathTemplate} de la tarea de entrega, que es donde el operador la ve y la controla;
     * meter un segundo motor de plantillas en la conexion daria dos sitios donde mirar cuando un archivo
     * aparezca donde no toca.</p>
     */
    private static void rejectTemplate(String prefix) {
        if (prefix != null && PLANTILLA.matcher(prefix).find()) {
            throw new IllegalArgumentException("Output sink prefix must not contain a path template ("
                    + prefix + "): it is resolved when READING this connection but not when writing. "
                    + "Put the date/period in the delivery task's dropPathTemplate instead.");
        }
    }
}
