package com.integrationhub.platform.provider.messaging.redis;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.stream.StreamCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;

/**
 * Conector Redis del SPI de mensajeria. Usa el cliente Redis de Quarkus (extension
 * {@code quarkus-redis-client}, native-ready via Vert.x) en vez de jedis crudo. La
 * conexion es lazy: {@code stream(...)} solo arma el wrapper de comandos; el primer
 * {@code XADD} abre la conexion, asi que con otro broker (audit.broker.type != REDIS)
 * nunca se conecta. Publica a un Redis Stream con clave = {@code topic}, apto para
 * consumo por grupos.
 */
@ApplicationScoped
public class RedisMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "REDIS";

    private final StreamCommands<String, String, String> streams;

    @Inject
    public RedisMessageBrokerProvider(RedisDataSource redisDataSource) {
        this.streams = redisDataSource.stream(String.class, String.class, String.class);
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
        try {
            var id = streams.xadd(message.topic(), Map.of(
                    "key", message.key() == null ? "" : message.key(),
                    "payload", message.payload()));
            return PublishResult.ok(id);
        } catch (Exception error) {
            return PublishResult.failed(error.getMessage());
        }
    }
}
