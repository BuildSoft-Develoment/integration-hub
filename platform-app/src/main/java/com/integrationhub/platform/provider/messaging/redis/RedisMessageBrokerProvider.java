package com.integrationhub.platform.provider.messaging.redis;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.util.Map;

/**
 * Conector Redis del SPI de mensajeria. Cliente raw (Jedis) con pool lazy: solo
 * conecta si {@code audit.broker.type=REDIS}. Publica a un Redis Stream con clave
 * = {@code topic} (XADD), apto para consumo por grupos.
 */
@ApplicationScoped
public class RedisMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "REDIS";

    private final String host;
    private final int port;

    private volatile JedisPool pool;

    @Inject
    public RedisMessageBrokerProvider(
            @ConfigProperty(name = "redis.host", defaultValue = "localhost") String host,
            @ConfigProperty(name = "redis.port", defaultValue = "6379") int port) {
        this.host = host;
        this.port = port;
    }

    @Override
    public String type() {
        return TYPE;
    }

    @Override
    public MessagePublisher publisher() {
        return this::publish;
    }

    private PublishResult publish(OutboundMessage message) {
        try (var jedis = pool().getResource()) {
            var id = jedis.xadd(message.topic(), redis.clients.jedis.StreamEntryID.NEW_ENTRY, Map.of(
                    "key", message.key() == null ? "" : message.key(),
                    "payload", message.payload()));
            return PublishResult.ok(id == null ? null : id.toString());
        } catch (Exception error) {
            return PublishResult.failed(error.getMessage());
        }
    }

    private JedisPool pool() {
        var local = pool;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (pool == null) {
                pool = new JedisPool(new JedisPoolConfig(), host, port);
            }
            return pool;
        }
    }
}
