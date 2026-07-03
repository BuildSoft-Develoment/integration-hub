package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;

import java.util.HashMap;
import java.util.Map;

/**
 * Perfil de IT con el despacho async del motor <b>activado</b> ({@code tasks.async.execution.enabled=true})
 * sobre la base del {@link IntegrationTestProfile}, para ejercitar el lazo productor → outbox →
 * consumer → completación (ADR-015 Etapa 4).
 */
public class AsyncExecutionTestProfile extends IntegrationTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        var overrides = new HashMap<>(super.getConfigOverrides());
        overrides.put("tasks.async.execution.enabled", "true");
        return overrides;
    }
}
