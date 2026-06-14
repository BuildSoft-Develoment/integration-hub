package com.integrationhub.auditconsumer;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Set;

/**
 * Fail-fast de configuracion: el consumer no debe arrancar con un broker
 * inexistente porque eso ocultaria perdida de trazabilidad.
 */
@ApplicationScoped
public class AuditConsumerStartupValidator {

    private static final Set<String> SUPPORTED = Set.of("KAFKA", "JMS", "RABBITMQ", "REDIS");

    private final String brokerType;

    public AuditConsumerStartupValidator(
            @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType) {
        this.brokerType = brokerType;
    }

    void validate(@Observes StartupEvent ignored) {
        if (!SUPPORTED.contains(brokerType.toUpperCase(java.util.Locale.ROOT))) {
            throw new IllegalStateException("Unsupported audit.broker.type: " + brokerType);
        }
    }
}
