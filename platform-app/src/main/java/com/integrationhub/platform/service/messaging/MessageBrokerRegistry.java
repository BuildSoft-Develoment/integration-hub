package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

import java.util.List;
import java.util.Optional;

/**
 * Resuelve el broker de mensajeria por {@code type()} (mismo patron que
 * SourceProviderRegistry/TaskProviderRegistry). Permite enchufar Kafka/JMS/
 * RabbitMQ/Redis sin tocar a los productores.
 *
 * <p>La resolucion productiva es fail-fast: si {@code audit.relay.enabled=true},
 * el broker configurado debe existir. No hay fallback silencioso a DB/in-memory.</p>
 */
@ApplicationScoped
public class MessageBrokerRegistry {

    private final Instance<MessageBrokerProvider> providers;

    public MessageBrokerRegistry(Instance<MessageBrokerProvider> providers) {
        this.providers = providers;
    }

    public Optional<MessageBrokerProvider> find(String type) {
        if (type == null || type.isBlank()) {
            return Optional.empty();
        }
        return providers.stream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
    }

    public MessageBrokerProvider resolve(String type) {
        return find(type).orElseThrow(
                () -> new IllegalArgumentException("Unsupported message broker: " + type));
    }

    /** Tipos de transporte disponibles (brokers registrados), ordenados. Para poblar la UI. */
    public List<String> availableTypes() {
        return providers.stream()
                .map(MessageBrokerProvider::type)
                .distinct()
                .sorted()
                .toList();
    }
}
