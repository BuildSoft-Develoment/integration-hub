package com.integrationhub.platform.service;
import com.integrationhub.platform.api.ConnectionTestResponse;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.List;
@ApplicationScoped
public class ConnectionCatalogService {
    private final ConnectionDefinitionRepository connectionDefinitionRepository;
    private final ConnectionPoolManager connectionPoolManager;
    public ConnectionCatalogService(ConnectionDefinitionRepository connectionDefinitionRepository,
                                    ConnectionPoolManager connectionPoolManager) {
        this.connectionDefinitionRepository = connectionDefinitionRepository;
        this.connectionPoolManager = connectionPoolManager;
    }
    @Transactional
    public ConnectionDefinition create(String name, ConnectionType connectionType, boolean active, String configurationJson) {
        var definition = new ConnectionDefinition();
        apply(definition, name, connectionType, active, configurationJson);
        connectionDefinitionRepository.persist(definition);
        return definition;
    }
    @Transactional
    public ConnectionDefinition update(Long connectionDefinitionId, String name, ConnectionType connectionType, boolean active, String configurationJson) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        apply(definition, name, connectionType, active, configurationJson);
        connectionPoolManager.evict(connectionDefinitionId);
        return definition;
    }
    @Transactional
    public ConnectionDefinition setActive(Long connectionDefinitionId, boolean active) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        definition.active = active;
        connectionPoolManager.evict(connectionDefinitionId);
        return definition;
    }
    public List<ConnectionDefinition> listAll() {
        return connectionDefinitionRepository.listAllOrdered();
    }
    public ConnectionTestResponse test(String name, ConnectionType connectionType, String configurationJson) {
        if (connectionType == null) {
            throw new IllegalArgumentException("Connection type is required");
        }
        if (connectionType == ConnectionType.MONGODB) {
            return new ConnectionTestResponse(false, "MongoDB test connection is not implemented yet");
        }
        connectionPoolManager.testJdbcConnection(name, configurationJson);
        return new ConnectionTestResponse(true, "Connection successful");
    }
    private void apply(ConnectionDefinition definition, String name, ConnectionType connectionType, boolean active, String configurationJson) {
        definition.name = name;
        definition.connectionType = connectionType;
        definition.active = active;
        definition.configurationJson = configurationJson;
    }
}