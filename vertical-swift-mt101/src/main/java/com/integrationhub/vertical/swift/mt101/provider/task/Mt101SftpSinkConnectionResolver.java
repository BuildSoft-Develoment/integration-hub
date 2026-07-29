package com.integrationhub.vertical.swift.mt101.provider.task;


import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import com.integrationhub.platform.spi.engine.SinkDefinitionResolver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADR-017: resuelve la CONEXION de salida SFTP de {@code MT101_PAY} desde una fuente {@code /sources}
 * OUTPUT/BOTH referenciada por {@code sftp.sinkRef}, reutilizando el mismo mecanismo que {@code FILE_DELIVER}
 * ({@link SinkDefinitionResolver}). Mergea la conexion (host/puerto/credenciales-como-refs/knownHostsPath) en el
 * bloque {@code sftp} de la task, conservando lo OPERACIONAL ({@code dropPathTemplate}/{@code tmpExtension}/
 * {@code remoteDuplicatePolicy}). Sin {@code sinkRef} devuelve la config intacta (modo inline, retrocompatible).
 *
 * <p><b>Money-safety (ADR-017):</b> se snapshotea el host RESUELTO, NUNCA el {@code sinkRef} como referencia viva.
 * Este resolver se invoca UNA sola vez:</p>
 * <ul>
 *   <li>en la etapa de PREPARACION del correctivo ({@code preparePayIntents} antes de
 *       {@link Mt101DispatchPlanCompiler#compile}) — el compiler CONGELA el host literal + credenciales como
 *       {@code ${secret:...}} + hashea; el dispatch correctivo materializa el spec congelado y NO re-resuelve la
 *       fuente (evita re-pagar a otro banco si un operador edita/borra la fuente entre el pago y el correctivo);</li>
 *   <li>en el dispatch EN VIVO del pago normal/lista (top de {@code Mt101PayTaskProvider.execute}) — resuelve la
 *       fuente vigente al ejecutar, consistente con el modelo de config-viva del pago original inline.</li>
 * </ul>
 *
 * <p>Las credenciales del source deben ser referencias {@code ${secret:...}} (QA-006 ya lo exige en {@code /sources}
 * y el compiler rechaza literales), por lo que se leen SIN resolver ({@link ConfigurationMapper#toMapUnresolved})
 * y viajan al spec como refs. {@code knownHostsPath} debe ser {@code ${config:...}} para ser compilable en el
 * correctivo (el compiler lo trata como campo-credencial).</p>
 */
@ApplicationScoped
public class Mt101SftpSinkConnectionResolver {

    /**
     * Claves de CONEXION que se copian de la definicion {@code /sources} SFTP al bloque {@code sftp} de la task.
     * NO se copian claves operacionales de LECTURA de la fuente ({@code remotePath}, {@code fileNamePattern},
     * {@code selectionMode}, {@code mediaType}, ...): la task aporta lo operacional de ESCRITURA
     * ({@code dropPathTemplate}/{@code tmpExtension}/{@code remoteDuplicatePolicy}).
     */
    private static final List<String> CONNECTION_KEYS = List.of(
            "host", "port", "username", "password", "privateKeyPath", "passphrase",
            "timeoutMillis", "strictHostKeyChecking", "knownHostsPath");

    private static final String SFTP_TYPE = "SFTP";

    private final SinkDefinitionResolver sinkDefinitionResolver;
    private final ConfigurationMapper jsonConfigurationMapper;

    @Inject
    public Mt101SftpSinkConnectionResolver(SinkDefinitionResolver sinkDefinitionResolver,
                                          ConfigurationMapper jsonConfigurationMapper) {
        this.sinkDefinitionResolver = sinkDefinitionResolver;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    /**
     * Devuelve una copia de {@code payConfig} con la conexion SFTP resuelta desde {@code sinkRef} (top-level
     * {@code sftp} y cada {@code routeTransports.<ruta>.sftp}). No muta el mapa de entrada. Sin {@code sinkRef}
     * en ningun bloque, devuelve la config equivalente (modo inline).
     *
     * <p>{@code @ActivateRequestContext}: la resolucion consulta {@code source_definition} via Panache, que puede
     * ejecutarse en un hilo offloaded del dispatch de PAY (sin contexto CDI activo); reentrante y sin efecto si ya
     * hay contexto (p.ej. en la preparacion del correctivo disparada por REST).</p>
     */
    @ActivateRequestContext
    public Map<String, Object> withResolvedSink(Map<String, Object> payConfig) {
        return withResolvedSink(payConfig, "routeTransports", "MT101_PAY");
    }

    /**
     * ADR-017: misma resolucion para {@code MT101_STATUS}. El STATUS por ruta guarda su conexion SFTP en
     * {@code routeQuery.<ruta>.sftp} —el archivo ACK/NACK que el banco deja— y hasta ahora solo admitia el
     * bloque inline, asi que la conexion del PAY y la del STATUS del MISMO banco se mantenian por separado y
     * podian derivar. Referenciando la misma fuente OUTPUT/BOTH quedan atadas.
     *
     * <p>A diferencia del PAY, aca NO hay congelado: el STATUS consulta, no mueve dinero. Resolver en vivo es
     * lo correcto —si el banco cambia de host, la consulta debe seguir al host nuevo—; el PAY congela porque
     * su spec es la evidencia de a donde se mando el dinero.</p>
     */
    @ActivateRequestContext
    public Map<String, Object> withResolvedStatusSink(Map<String, Object> statusConfig) {
        return withResolvedSink(statusConfig, "routeQuery", "MT101_STATUS");
    }

    private Map<String, Object> withResolvedSink(Map<String, Object> config,
                                                 String routeContainerKey,
                                                 String taskType) {
        if (config == null) {
            return null;
        }
        var result = new LinkedHashMap<String, Object>(config);
        // top-level sftp (transport=SFTP)
        var mergedTop = mergedSftpBlock(result.get("sftp"), taskType);
        if (mergedTop != null) {
            result.put("sftp", mergedTop);
        }
        // <routeContainerKey>.<ruta>.sftp (SFTP por ruta)
        if (result.get(routeContainerKey) instanceof Map<?, ?> rawRoutes) {
            var newRoutes = new LinkedHashMap<String, Object>();
            var changed = false;
            for (var entry : rawRoutes.entrySet()) {
                var routeKey = String.valueOf(entry.getKey());
                if (entry.getValue() instanceof Map<?, ?> rawRouteConfig) {
                    var routeConfig = new LinkedHashMap<String, Object>();
                    rawRouteConfig.forEach((k, v) -> routeConfig.put(String.valueOf(k), v));
                    var mergedRoute = mergedSftpBlock(routeConfig.get("sftp"), taskType);
                    if (mergedRoute != null) {
                        routeConfig.put("sftp", mergedRoute);
                        changed = true;
                    }
                    newRoutes.put(routeKey, routeConfig);
                } else {
                    newRoutes.put(routeKey, entry.getValue());
                }
            }
            if (changed) {
                result.put(routeContainerKey, newRoutes);
            }
        }
        return result;
    }

    /**
     * Si {@code rawSftp} es un mapa con {@code sinkRef}, devuelve un NUEVO bloque {@code sftp} con la conexion de la
     * fuente mergeada (sin {@code sinkRef}); en cualquier otro caso devuelve {@code null} (nada que mergear: modo
     * inline o sin bloque sftp).
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> mergedSftpBlock(Object rawSftp, String taskType) {
        if (!(rawSftp instanceof Map<?, ?> rawMap)) {
            return null;
        }
        var sftp = new LinkedHashMap<String, Object>();
        rawMap.forEach((k, v) -> sftp.put(String.valueOf(k), v));
        var sinkRef = longValue(sftp.get("sinkRef"));
        if (sinkRef == null) {
            return null;
        }
        var definition = sinkDefinitionResolver.resolve(sinkRef);
        if (!definition.allowsOutput()) {
            throw new IllegalArgumentException(taskType + " sftp.sinkRef " + sinkRef + " ('" + definition.name()
                    + "') is not an OUTPUT sink (direction=" + definition.direction() + "); set the source to OUTPUT or BOTH");
        }
        if (!SFTP_TYPE.equalsIgnoreCase(definition.type())) {
            throw new IllegalArgumentException(taskType + " sftp.sinkRef " + sinkRef + " ('" + definition.name()
                    + "') is a " + definition.type() + " source; MT101_PAY transport=SFTP requires an SFTP sink");
        }
        // Refs ${secret:...}/${config:...} INTACTAS: el spec persistido nunca lleva secretos resueltos.
        var connection = jsonConfigurationMapper.toMapUnresolved(definition.configurationJson());
        var merged = new LinkedHashMap<String, Object>(sftp);
        merged.remove("sinkRef");
        for (var key : CONNECTION_KEYS) {
            if (connection.containsKey(key)) {
                merged.put(key, connection.get(key));
            }
        }
        return merged;
    }

    private static Long longValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException notNumeric) {
            return null;
        }
    }
}
