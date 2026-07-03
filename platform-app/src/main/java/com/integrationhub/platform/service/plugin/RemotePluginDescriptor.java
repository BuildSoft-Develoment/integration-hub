package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.config.PluginConfigSchema;
import java.util.Map;
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
 * @param providedSourceTypes tipos de fuente remota que declara el plugin
 * @param providedReaderTypes tipos de reader remoto que declara el plugin
 * @param transport    transporte de invocacion ({@code GRPC}, {@code KAFKA}, ...)
 * @param endpoint     endpoint del plugin cuando el transporte lo requiere
 * @param trusted      si su firma/procedencia fue verificada (ver ADR-013/014)
 */
public record RemotePluginDescriptor(
        String id,
        String version,
        String spiVersion,
        Set<String> providedTypes,
        Set<String> providedSourceTypes,
        Set<String> providedReaderTypes,
        String transport,
        String endpoint,
        boolean trusted,
        String marketplaceUrl,
        String channel,
        String pinnedVersion,
        boolean pinned,
        Map<String, PluginConfigSchema> configSchemas) {

    public RemotePluginDescriptor {
        providedTypes = providedTypes == null ? Set.of() : Set.copyOf(providedTypes);
        providedSourceTypes = providedSourceTypes == null ? Set.of() : Set.copyOf(providedSourceTypes);
        providedReaderTypes = providedReaderTypes == null ? Set.of() : Set.copyOf(providedReaderTypes);
        endpoint = endpoint == null || endpoint.isBlank() ? null : endpoint.trim();
        marketplaceUrl = marketplaceUrl == null || marketplaceUrl.isBlank() ? null : marketplaceUrl.trim();
        channel = channel == null || channel.isBlank() ? null : channel.trim();
        pinnedVersion = pinnedVersion == null || pinnedVersion.isBlank() ? null : pinnedVersion.trim();
        configSchemas = configSchemas == null ? Map.of() : Map.copyOf(configSchemas);
    }

    /** Config-schema declarado por el plugin para un {@code providedType} (o vacío). */
    public PluginConfigSchema configSchemaFor(String type) {
        return configSchemas.getOrDefault(type, PluginConfigSchema.empty());
    }

    /** Compat: firma previa (sin config-schemas) → delega con mapa vacío. */
    public RemotePluginDescriptor(
            String id,
            String version,
            String spiVersion,
            Set<String> providedTypes,
            Set<String> providedSourceTypes,
            Set<String> providedReaderTypes,
            String transport,
            String endpoint,
            boolean trusted,
            String marketplaceUrl,
            String channel,
            String pinnedVersion,
            boolean pinned) {
        this(id, version, spiVersion, providedTypes, providedSourceTypes, providedReaderTypes,
                transport, endpoint, trusted, marketplaceUrl, channel, pinnedVersion, pinned, Map.of());
    }

    public RemotePluginDescriptor(
            String id,
            String version,
            String spiVersion,
            Set<String> providedTypes,
            Set<String> providedSourceTypes,
            Set<String> providedReaderTypes,
            String transport,
            String endpoint,
            boolean trusted) {
        this(id, version, spiVersion, providedTypes, providedSourceTypes, providedReaderTypes,
                transport, endpoint, trusted, null, null, null, false, Map.of());
    }

    public RemotePluginDescriptor(
            String id,
            String version,
            String spiVersion,
            Set<String> providedTypes,
            String transport,
            String endpoint,
            boolean trusted) {
        this(id, version, spiVersion, providedTypes, Set.of(), Set.of(), transport, endpoint, trusted);
    }

    public RemotePluginDescriptor(
            String id,
            String version,
            String spiVersion,
            Set<String> providedTypes,
            String transport,
            boolean trusted) {
        this(id, version, spiVersion, providedTypes, transport, null, trusted);
    }

    public boolean covers(String taskType) {
        return taskType != null
                && providedTypes.stream().anyMatch(type -> type.equalsIgnoreCase(taskType.trim()));
    }

    public boolean coversSource(String sourceType) {
        return sourceType != null
                && providedSourceTypes.stream().anyMatch(type -> type.equalsIgnoreCase(sourceType.trim()));
    }

    public boolean coversReader(String readerType) {
        return readerType != null
                && providedReaderTypes.stream().anyMatch(type -> type.equalsIgnoreCase(readerType.trim()));
    }
}
