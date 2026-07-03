package com.integrationhub.platform.integration.async;

import java.util.HashMap;
import java.util.Map;

/**
 * Perfil del IT Kafka del consumer async (ADR-015 Etapa 5): sobre el {@link AsyncExecutionTestProfile}
 * (flag async ON) <b>habilita el canal {@code tasks-in}</b> contra el Kafka real de Testcontainers.
 * Usa un topic fijo (en vez del patrón de producción) para que el IT sea determinista, sin depender
 * del refresco de metadata para descubrir topics nuevos.
 */
public class AsyncKafkaConsumerTestProfile extends AsyncExecutionTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        var overrides = new HashMap<>(super.getConfigOverrides());
        overrides.put("mp.messaging.incoming.tasks-in.enabled", "true");
        overrides.put("mp.messaging.incoming.tasks-in.pattern", "false");
        overrides.put("mp.messaging.incoming.tasks-in.topic", "tasks.test_follow_up");
        overrides.put("mp.messaging.incoming.tasks-in.auto.offset.reset", "earliest");
        return overrides;
    }
}
