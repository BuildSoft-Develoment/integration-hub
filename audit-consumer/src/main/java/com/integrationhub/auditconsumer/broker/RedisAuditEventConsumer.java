package com.integrationhub.auditconsumer.broker;

import com.integrationhub.auditconsumer.AuditEventHandler;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.StreamEntryID;
import redis.clients.jedis.params.XReadParams;

import java.util.Map;

/**
 * Consumer Redis Streams opcional del contrato de auditoria. Lee mensajes XADD
 * publicados por el producer Redis; el payload viaja en el campo {@code payload}.
 */
@ApplicationScoped
public class RedisAuditEventConsumer {

    private final AuditEventHandler handler;
    private final String brokerType;
    private final String topic;
    private final int batchSize;
    private final String host;
    private final int port;

    private volatile JedisPool pool;
    private volatile StreamEntryID lastId = new StreamEntryID("0-0");

    @Inject
    public RedisAuditEventConsumer(
            AuditEventHandler handler,
            @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
            @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic,
            @ConfigProperty(name = "audit.consumer.batch-size", defaultValue = "200") int batchSize,
            @ConfigProperty(name = "redis.host", defaultValue = "localhost") String host,
            @ConfigProperty(name = "redis.port", defaultValue = "6379") int port) {
        this.handler = handler;
        this.brokerType = brokerType;
        this.topic = topic;
        this.batchSize = batchSize;
        this.host = host;
        this.port = port;
    }

    @Scheduled(every = "{audit.consumer.poll.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void poll() {
        if (!"REDIS".equalsIgnoreCase(brokerType)) {
            return;
        }
        try (var jedis = pool().getResource()) {
            var streams = Map.of(topic, lastId);
            var entries = jedis.xread(XReadParams.xReadParams().count(batchSize).block(100), streams);
            if (entries == null || entries.isEmpty()) {
                return;
            }
            for (var stream : entries) {
                for (var entry : stream.getValue()) {
                    var payload = entry.getFields().get("payload");
                    if (payload != null) {
                        handler.handle(payload, "REDIS", topic);
                    }
                    lastId = entry.getID();
                }
            }
        } catch (RuntimeException error) {
            throw new IllegalStateException("Redis audit consumer failed", error);
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
