package com.integrationhub.platform.service.connection;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import io.agroal.api.AgroalDataSource;
import io.agroal.api.configuration.supplier.AgroalDataSourceConfigurationSupplier;
import io.agroal.api.security.NamePrincipal;
import io.agroal.api.security.SimplePassword;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
@ApplicationScoped
public class ConnectionPoolManager {
    private final ConnectionDefinitionRepository connectionDefinitionRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final Map<Long, AgroalDataSource> dataSources = new ConcurrentHashMap<>();
    public ConnectionPoolManager(ConnectionDefinitionRepository connectionDefinitionRepository,
                                 JsonConfigurationMapper jsonConfigurationMapper) {
        this.connectionDefinitionRepository = connectionDefinitionRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }
    public JdbcConnectionTarget resolveJdbcTarget(String connectionRef) {
        var definition = findRequiredJdbcDefinition(connectionRef);
        var dataSource = dataSources.computeIfAbsent(definition.id, ignored -> createJdbcDataSource(definition));
        return new JdbcConnectionTarget(dataSource, definition.connectionType);
    }
    public DataSource resolveJdbcDataSource(String connectionRef) {
        return resolveJdbcTarget(connectionRef).dataSource();
    }
    public List<String> activeJdbcConnectionRefs() {
        return connectionDefinitionRepository.listActiveOrdered().stream()
                .filter(definition -> definition.connectionType != null && definition.connectionType.isJdbc())
                .map(definition -> definition.name)
                .filter(name -> name != null && !name.isBlank())
                .toList();
    }
    public void testJdbcConnection(String connectionName, String configurationJson) {
        var definition = new ConnectionDefinition();
        definition.name = connectionName != null && !connectionName.isBlank() ? connectionName : "temporary-connection";
        definition.configurationJson = configurationJson;
        definition.connectionType = null;
        var dataSource = createJdbcDataSource(definition);
        try (var connection = dataSource.getConnection()) {
            if (!connection.isValid(5)) {
                throw new IllegalStateException("Connection validation returned false");
            }
            connection.getMetaData().getURL();
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot connect using the provided JDBC configuration", e);
        } finally {
            dataSource.close();
        }
    }
    public void evict(Long connectionDefinitionId) {
        var dataSource = dataSources.remove(connectionDefinitionId);
        if (dataSource != null) {
            dataSource.close();
        }
    }
    @PreDestroy
    void closeAll() {
        var ids = dataSources.keySet().toArray(Long[]::new);
        for (var id : ids) {
            evict(id);
        }
    }
    private AgroalDataSource createJdbcDataSource(ConnectionDefinition definition) {
        var configuration = jsonConfigurationMapper.toMap(definition.configurationJson);
        var jdbcUrl = requiredString(configuration, "jdbcUrl");
        var supplier = new AgroalDataSourceConfigurationSupplier();
        var pool = supplier.connectionPoolConfiguration();
        var factory = pool.connectionFactoryConfiguration();
        factory.jdbcUrl(jdbcUrl);
        optionalString(configuration, "username").ifPresent(username -> factory.principal(new NamePrincipal(username)));
        optionalString(configuration, "password").ifPresent(password -> factory.credential(new SimplePassword(password)));
        optionalString(configuration, "initialSql").ifPresent(factory::initialSql);
        jdbcProperties(configuration).forEach(factory::jdbcProperty);
        pool.minSize(intValue(configuration, "minSize", 0));
        pool.maxSize(intValue(configuration, "maxSize", 10));
        pool.acquisitionTimeout(Duration.ofSeconds(intValue(configuration, "acquisitionTimeoutSeconds", 30)));
        pool.validationTimeout(Duration.ofSeconds(intValue(configuration, "validationTimeoutSeconds", 5)));
        pool.reapTimeout(Duration.ofMinutes(intValue(configuration, "reapTimeoutMinutes", 5)));
        try {
            return AgroalDataSource.from(supplier);
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot create datasource for connection " + definition.name, e);
        }
    }
    private String requiredString(Map<String, Object> configuration, String key) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required connection configuration key: " + key);
        }
        return String.valueOf(value);
    }
    private Optional<String> optionalString(Map<String, Object> configuration, String key) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return Optional.empty();
        }
        return Optional.of(String.valueOf(value));
    }
    @SuppressWarnings("unchecked")
    private Map<String, String> jdbcProperties(Map<String, Object> configuration) {
        var value = configuration.get("jdbcProperties");
        if (value == null) {
            return Map.of();
        }
        if (!(value instanceof Map<?, ?> rawMap)) {
            throw new IllegalArgumentException("jdbcProperties must be an object");
        }
        var properties = new LinkedHashMap<String, String>();
        rawMap.forEach((key, propertyValue) -> properties.put(String.valueOf(key), String.valueOf(propertyValue)));
        return properties;
    }
    private int intValue(Map<String, Object> configuration, String key, int defaultValue) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }
    private ConnectionDefinition findRequiredJdbcDefinition(String connectionRef) {
        var definition = connectionDefinitionRepository.findActiveRequiredByName(connectionRef);
        if (!definition.connectionType.isJdbc()) {
            throw new IllegalArgumentException("Connection type is not JDBC: " + definition.connectionType);
        }
        return definition;
    }
    public record JdbcConnectionTarget(DataSource dataSource, ConnectionType connectionType) {
    }
}
