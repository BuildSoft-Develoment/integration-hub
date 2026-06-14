package com.integrationhub.auditconsumer.coldstore;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.sql.DataSource;

/**
 * Selecciona el backend del store frio por {@code audit.cold-store.type}
 * (POSTGRES por defecto; CLICKHOUSE para volumen analitico). Enchufable sin tocar
 * al consumidor: agregar un backend = nueva impl de {@link ColdStore} + una rama aqui.
 */
@ApplicationScoped
public class ColdStoreProducer {

    @Produces
    @ApplicationScoped
    public ColdStore coldStore(
            DataSource dataSource,
            @ConfigProperty(name = "audit.cold-store.type", defaultValue = "POSTGRES") String type,
            @ConfigProperty(name = "clickhouse.url", defaultValue = "jdbc:clickhouse://localhost:8123/default") String clickhouseUrl,
            @ConfigProperty(name = "clickhouse.username", defaultValue = "default") String clickhouseUser,
            @ConfigProperty(name = "clickhouse.password", defaultValue = "") String clickhousePassword) {
        if ("CLICKHOUSE".equalsIgnoreCase(type)) {
            return new ClickHouseColdStore(clickhouseUrl, clickhouseUser, clickhousePassword);
        }
        return new PostgresColdStore(dataSource);
    }
}
