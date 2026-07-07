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
        // §9: declara el relay ON (precondición del productor para despachar). Con quarkus.scheduler.enabled
        // =false (base IT) el relay NO drena → sin side-effect ni race con el read manual del outbox; estos
        // E2E simulan la entrega llamando al consumer a mano. Sin esto, el fail-loud §9 abortaría el despacho.
        overrides.put("tasks.dispatch.enabled", "true");
        // §6: valor de secreto resoluble por ${config:...} para probar que NO se persiste en el outbox
        // (el envelope viaja con el placeholder) y que el consumer lo re-resuelve en el punto-de-uso.
        overrides.put("integrationhub.test.secret", "SUPER_SECRET_XYZ");
        return overrides;
    }
}
