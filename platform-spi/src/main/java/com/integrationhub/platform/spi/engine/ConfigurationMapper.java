package com.integrationhub.platform.spi.engine;

import java.util.Map;

/**
 * ADR-021 (ola 3): lectura/escritura del {@code configuration_json} de una tarea, como CONTRATO.
 *
 * <p>El motor guarda la configuracion de cada tarea como JSON y resuelve las referencias a
 * secretos al leerla. Un vertical necesita ese servicio, pero no la implementacion concreta.</p>
 */
public interface ConfigurationMapper {

    /** JSON -> mapa, con las referencias a secretos YA resueltas. */
    Map<String, Object> toMap(String json);

    /** JSON -> mapa SIN resolver secretos (para editar/mostrar sin exponer valores). */
    Map<String, Object> toMapUnresolved(String json);

    /** Objeto -> JSON. */
    String toJson(Object value);

    /** Resuelve las referencias a secretos de un mapa ya parseado. */
    Map<String, Object> resolveSecretsIn(Map<String, Object> raw);
}
