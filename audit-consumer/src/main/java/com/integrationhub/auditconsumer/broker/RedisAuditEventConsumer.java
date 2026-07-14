package com.integrationhub.auditconsumer.broker;

import com.integrationhub.auditconsumer.AuditEventHandler;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.stream.StreamCommands;
import io.quarkus.redis.datasource.stream.XReadArgs;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Map;

/**
 * Consumer Redis Streams opcional del contrato de auditoria. Lee mensajes XADD publicados por
 * el producer Redis; el payload viaja en el campo {@code payload}. Usa el cliente Redis de
 * Quarkus (extension {@code quarkus-redis-client}, native-ready via Vert.x) en vez de jedis.
 * Solo activo si {@code audit.broker.type=REDIS}; con KAFKA (default) el poll retorna sin tocar Redis.
 */
@ApplicationScoped
public class RedisAuditEventConsumer {

    private final AuditEventHandler handler;
    private final String brokerType;
    private final String topic;
    private final int batchSize;
    private final StreamCommands<String, String, String> streams;
    private volatile String lastId = "0-0";

    @Inject
    public RedisAuditEventConsumer(
            AuditEventHandler handler,
            RedisDataSource redisDataSource,
            @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
            @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic,
            @ConfigProperty(name = "audit.consumer.batch-size", defaultValue = "200") int batchSize) {
        this.handler = handler;
        this.brokerType = brokerType;
        this.topic = topic;
        this.batchSize = batchSize;
        this.streams = redisDataSource.stream(String.class, String.class, String.class);
    }

    @Scheduled(every = "{audit.consumer.poll.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void poll() {
        if (!"REDIS".equalsIgnoreCase(brokerType)) {
            return;
        }
        try {
            var messages = streams.xread(
                    Map.of(topic, lastId),
                    new XReadArgs().count(batchSize).block(Duration.ofMillis(100)));
            if (messages == null || messages.isEmpty()) {
                return;
            }
            var payloads = new ArrayList<String>(batchSize);
            var newestId = lastId;
            for (var message : messages) {
                var payload = message.payload().get("payload");
                if (payload != null) {
                    payloads.add(payload);
                }
                newestId = message.id();
            }
            if (!payloads.isEmpty()) {
                handler.handleBatch(payloads, "REDIS", topic);
            }
            lastId = newestId;
        } catch (RuntimeException error) {
            throw new IllegalStateException("Redis audit consumer failed", error);
        }
    }
}
