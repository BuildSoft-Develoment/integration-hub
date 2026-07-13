package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Catalogo de reader types disponibles para la UI/operacion. Espejo de
 * {@code TaskTypeCatalogService}: expone los readers locales (registrados en el build) y los
 * readers remotos aportados por plugins backend, con su estado de confianza/degradacion, para
 * que el frontend descubra los tipos de plugin y decida cuales habilitar.
 */
@ApplicationScoped
public class ReaderTypeCatalogService {

    public static final String ORIGIN_LOCAL = "LOCAL";
    public static final String ORIGIN_REMOTE = "REMOTE";

    public static final String STATUS_AVAILABLE = "AVAILABLE";
    public static final String STATUS_DEGRADED = "DEGRADED";
    public static final String STATUS_UNTRUSTED = "UNTRUSTED";
    public static final String STATUS_SHADOWED_BY_LOCAL = "SHADOWED_BY_LOCAL";

    private final ReaderProviderRegistry readerProviderRegistry;
    private final RemotePluginRegistry remotePluginRegistry;

    public ReaderTypeCatalogService(
            ReaderProviderRegistry readerProviderRegistry,
            RemotePluginRegistry remotePluginRegistry) {
        this.readerProviderRegistry = readerProviderRegistry;
        this.remotePluginRegistry = remotePluginRegistry;
    }

    public List<ReaderTypeCatalogEntry> catalog() {
        var entries = new ArrayList<ReaderTypeCatalogEntry>();
        var localProviders = readerProviderRegistry.localReaderTypeProviders();
        var localKeys = normalized(localProviders.keySet());

        localProviders.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
                .forEach(entry -> entries.add(new ReaderTypeCatalogEntry(
                        entry.getKey(), ORIGIN_LOCAL, entry.getValue(),
                        null, null, null, STATUS_AVAILABLE, null)));

        var degraded = remotePluginRegistry.degraded();
        remotePluginRegistry.descriptors().stream()
                .sorted(Comparator.comparing(RemotePluginDescriptor::id))
                .forEach(descriptor -> descriptor.providedReaderTypes().stream()
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .forEach(type -> entries.add(remoteEntry(
                                descriptor, type, localKeys, degraded.get(descriptor.id())))));

        return List.copyOf(entries);
    }

    private ReaderTypeCatalogEntry remoteEntry(
            RemotePluginDescriptor descriptor,
            String type,
            Set<String> localKeys,
            String degradedReason) {
        var normalizedType = normalize(type);
        var shadowed = localKeys.contains(normalizedType);
        var status = shadowed
                ? STATUS_SHADOWED_BY_LOCAL
                : degradedReason != null
                ? STATUS_DEGRADED
                : descriptor.trusted()
                ? STATUS_AVAILABLE
                : STATUS_UNTRUSTED;
        var reason = shadowed
                ? "Local provider has priority for reader type " + normalizedType
                : degradedReason;
        return new ReaderTypeCatalogEntry(
                normalizedType, ORIGIN_REMOTE, "backend-plugin",
                descriptor.id(), descriptor.version(), descriptor.transport(), status, reason);
    }

    private static Set<String> normalized(Iterable<String> values) {
        return java.util.stream.StreamSupport.stream(values.spliterator(), false)
                .map(ReaderTypeCatalogService::normalize)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private static String normalize(String type) {
        return type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
    }
}
