package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;

import java.util.HashMap;
import java.util.Map;

/**
 * Perfil de IT con el despacho async <b>y</b> la auto-recuperación de la page-chain <b>activados</b>
 * ({@code tasks.async.recovery.enabled=true}, {@code stall-threshold=0s}) para ejercitar el
 * {@code AsyncScatterRecoveryScheduler.sweep()} (gating + config + wiring).
 */
public class AsyncRecoveryTestProfile extends IntegrationTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        var overrides = new HashMap<>(super.getConfigOverrides());
        overrides.put("tasks.async.execution.enabled", "true");
        // §9: relay ON como precondición del productor (el scheduler está off en IT → no drena; sin race).
        overrides.put("tasks.dispatch.enabled", "true");
        overrides.put("tasks.async.recovery.enabled", "true");
        overrides.put("tasks.async.recovery.stall-threshold", "0s");
        overrides.put("tasks.async.recovery.max-per-sweep", "50");
        // Timer enorme: el test invoca sweep() a mano; evita que el @Scheduled dispare e interfiera.
        overrides.put("tasks.async.recovery.every", "1h");
        return overrides;
    }
}
