package com.integrationhub.platform.spi.engine;

/**
 * ADR-016 / ADR-021: resuelve una definicion de {@code /sources} usada como <b>sink</b> de salida.
 *
 * <p>La resolucion abre una transaccion CORTA y devuelve un DTO desacoplado de la entidad, para que
 * la tarea NO mantenga una transaccion de BD abierta mientras entrega (SFTP/red puede ser lento).
 * Ese contrato es parte del puerto, no un detalle de la implementacion: quien lo implemente debe
 * respetarlo.</p>
 *
 * <p>ADR-021: existe para que un vertical pueda entregar a un sink configurado sin depender del
 * servicio del motor que lo carga.</p>
 */
public interface SinkDefinitionResolver {

    /**
     * @param sourceDefinitionId id de la definicion en {@code /sources}
     * @return el sink, ya desacoplado de la sesion de persistencia
     * @throws IllegalArgumentException si no existe
     */
    SinkDefinition resolve(Long sourceDefinitionId);

    /** DTO desacoplado de la entidad (evita entidad detached fuera de la transaccion). */
    record SinkDefinition(Long id, String name, String type, String configurationJson, String direction) {

        public boolean allowsOutput() {
            var normalized = direction == null ? "INPUT" : direction.trim().toUpperCase();
            return "OUTPUT".equals(normalized) || "BOTH".equals(normalized);
        }
    }
}
