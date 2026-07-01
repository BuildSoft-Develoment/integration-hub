package com.integrationhub.platform.service.plugin;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public record PluginMarketplaceCatalog(List<PluginMarketplaceEntry> plugins) {

    public PluginMarketplaceCatalog {
        plugins = plugins == null ? List.of() : List.copyOf(plugins);
    }

    public PluginMarketplaceEntry select(PluginMarketplaceInstallCommand command) {
        requireText(command.pluginId(), "Plugin marketplace pluginId is required");
        var matches = plugins.stream()
                .filter(plugin -> equalsIgnoreCase(plugin.id(), command.pluginId()))
                .filter(plugin -> blank(command.channel()) || equalsIgnoreCase(plugin.channel(), command.channel()))
                .filter(plugin -> blank(command.pinnedVersion()) || equalsIgnoreCase(plugin.version(), command.pinnedVersion()))
                .toList();
        if (matches.isEmpty()) {
            throw new IllegalArgumentException("Plugin marketplace entry was not found");
        }
        if (!blank(command.pinnedVersion())) {
            return matches.getFirst();
        }
        return matches.stream()
                .max(Comparator.comparing(PluginMarketplaceEntry::parsedVersion))
                .orElseThrow();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean equalsIgnoreCase(String left, String right) {
        return left != null && right != null && left.trim().equalsIgnoreCase(right.trim());
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    public record PluginMarketplaceEntry(
            String id,
            String version,
            String spiVersion,
            Set<String> providedTypes,
            Set<String> providedSourceTypes,
            Set<String> providedReaderTypes,
            String transport,
            String endpoint,
            boolean trusted,
            String integrity,
            String signature,
            String marketplaceUrl,
            String channel,
            String pinnedVersion,
            boolean pinned) {

        public PluginMarketplaceEntry {
            providedTypes = providedTypes == null ? Set.of() : Set.copyOf(providedTypes);
            providedSourceTypes = providedSourceTypes == null ? Set.of() : Set.copyOf(providedSourceTypes);
            providedReaderTypes = providedReaderTypes == null ? Set.of() : Set.copyOf(providedReaderTypes);
        }

        PluginDescriptorInstallCommand toInstallCommand(
                PluginMarketplaceInstallCommand command,
                String fallbackMarketplaceUrl) {
            var requestedPinnedVersion = trimToNull(command.pinnedVersion());
            var resolvedPinnedVersion = requestedPinnedVersion != null
                    ? requestedPinnedVersion
                    : trimToNull(pinnedVersion);
            var resolvedChannel = trimToNull(command.channel()) != null ? trimToNull(command.channel()) : trimToNull(channel);
            return new PluginDescriptorInstallCommand(
                    id,
                    version,
                    spiVersion,
                    providedTypes,
                    providedSourceTypes,
                    providedReaderTypes,
                    transport,
                    endpoint,
                    trusted,
                    command.active(),
                    integrity,
                    signature,
                    trimToNull(marketplaceUrl) != null ? trimToNull(marketplaceUrl) : fallbackMarketplaceUrl,
                    resolvedChannel == null ? null : resolvedChannel.toLowerCase(Locale.ROOT),
                    resolvedPinnedVersion,
                    pinned || resolvedPinnedVersion != null);
        }

        private static String trimToNull(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return value.trim();
        }

        private ComparableVersion parsedVersion() {
            return ComparableVersion.parse(version);
        }
    }

    private record ComparableVersion(int major, int minor, int patch, String qualifier, String raw)
            implements Comparable<ComparableVersion> {

        static ComparableVersion parse(String value) {
            if (value == null || value.isBlank()) {
                return new ComparableVersion(0, 0, 0, "", "");
            }
            var raw = value.trim();
            var parts = raw.split("-", 2);
            var numbers = parts[0].split("\\.");
            return new ComparableVersion(
                    number(numbers, 0),
                    number(numbers, 1),
                    number(numbers, 2),
                    parts.length == 2 ? parts[1] : "",
                    raw);
        }

        @Override
        public int compareTo(ComparableVersion other) {
            var majorCompare = Integer.compare(major, other.major);
            if (majorCompare != 0) {
                return majorCompare;
            }
            var minorCompare = Integer.compare(minor, other.minor);
            if (minorCompare != 0) {
                return minorCompare;
            }
            var patchCompare = Integer.compare(patch, other.patch);
            if (patchCompare != 0) {
                return patchCompare;
            }
            if (qualifier.isBlank() && !other.qualifier.isBlank()) {
                return 1;
            }
            if (!qualifier.isBlank() && other.qualifier.isBlank()) {
                return -1;
            }
            var qualifierCompare = qualifier.compareToIgnoreCase(other.qualifier);
            return qualifierCompare != 0 ? qualifierCompare : raw.compareToIgnoreCase(other.raw);
        }

        private static int number(String[] values, int index) {
            if (index >= values.length) {
                return 0;
            }
            try {
                return Integer.parseInt(values[index]);
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
    }
}
