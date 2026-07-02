package com.integrationhub.platform.provider.task.notification;

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationTaskProviderConfigSchemaTest {

    @Test
    void exposesConfigSchemaForItsType() {
        // configSchema() no usa dependencias inyectadas, así que se puede construir directo.
        PluginConfigSchema schema = new NotificationTaskProvider().configSchema();

        assertFalse(schema.isEmpty(), "el tipo NOTIFICATION declara un schema de config");
        List<String> keys = schema.fields().stream().map(PluginConfigField::key).toList();
        assertTrue(keys.containsAll(List.of("channel", "message", "url", "bodyTemplate")),
                "el schema expone los campos de config del tipo: " + keys);

        PluginConfigField channel = schema.fields().stream()
                .filter(f -> f.key().equals("channel"))
                .findFirst()
                .orElseThrow();
        assertEquals("select", channel.type());
        assertTrue(channel.required());
        List<String> options = channel.options().stream().map(o -> o.value()).toList();
        assertTrue(options.containsAll(List.of("log", "webhook", "email")),
                "el select channel expone sus opciones: " + options);
    }

    @Test
    void defaultConfigSchemaIsEmptyForProvidersThatDoNotDeclareOne() {
        // Un provider que no sobreescribe configSchema() devuelve vacío (opt-in, no rompe nada).
        TaskProvider bare = new TaskProvider() {
            @Override
            public String type() {
                return "X";
            }

            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                return null;
            }
        };
        assertTrue(bare.configSchema().isEmpty());
    }
}
