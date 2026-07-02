package com.integrationhub.platform.service.plugin;

import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

/**
 * Deterministic percentage/segment routing for a canary version. Given a weight (0-100)
 * and a stable routing key (the "segment": e.g. a tenant id, connection id or execution
 * key), decides whether that segment routes to the canary version.
 *
 * <p>The decision is deterministic per key (the same segment always resolves the same
 * way, so a rollout is sticky and reproducible) and, across many keys, the share routed
 * to canary approximates the configured weight.
 */
@ApplicationScoped
public class CanaryRolloutSelector {

    public boolean routesToCanary(Integer weightPercent, String routingKey) {
        int weight = weightPercent == null ? 0 : weightPercent;
        if (weight <= 0) {
            return false;
        }
        if (weight >= 100) {
            return true;
        }
        return bucketOf(routingKey) < weight;
    }

    /** Stable 0-99 bucket for a routing key. */
    int bucketOf(String routingKey) {
        var crc = new CRC32();
        crc.update((routingKey == null ? "" : routingKey).getBytes(StandardCharsets.UTF_8));
        return (int) Math.floorMod(crc.getValue(), 100L);
    }
}
