package com.integrationhub.platform.service.plugin;

import java.util.Set;

/**
 * Descriptor de un plugin de backend out-of-process (ADR-014).
 *
 * <p>Es la vista del core sobre un plugin instalado desde fuera: identidad, version,
 * version de SPI, los tipos de tarea que aporta, el transporte y si su procedencia
 * fue verificada. El catalogo de descriptores es la unica fuente de verdad de que
 * plugins externos estan activos.</p>
 *
 * @param id           identificador unico del plugin
 * @param version      version del plugin
 * @param spiVersion   version del contrato SPI que implementa
 * @param providedTypes tipos de tarea que aporta ({@code MT101_*}, custom, ...)
 * @param transport    transporte de invocacion ({@code GRPC}, {@code KAFKA}, ...)
 * @param trusted      si su firma/procedencia fue verificada (ver ADR-013/014)
 */
public record RemotePluginDescriptor(
        String id,
        String version,
        String spiVersion,
        Set<String> providedTypes,
        String transport,
        boolean trusted) {

    public RemotePluginDescriptor {
        providedTypes = providedTypes == null ? Set.of() : Set.copyOf(providedTypes);
    }

    public boolean covers(String taskType) {
        return taskType != null
                && providedTypes.stream().anyMatch(type -> type.equalsIgnoreCase(taskType.trim()));
    }
}
