package com.integrationhub.platform.repository;
import com.integrationhub.platform.entity.ConnectionDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
@ApplicationScoped
public class ConnectionDefinitionRepository implements PanacheRepository<ConnectionDefinition> {
    public ConnectionDefinition findRequired(Long connectionDefinitionId) {
        var definition = findById(connectionDefinitionId);
        if (definition == null) {
            throw new IllegalArgumentException("Connection definition not found: " + connectionDefinitionId);
        }
        return definition;
    }
    public ConnectionDefinition findActiveRequiredByName(String name) {
        var definition = find("name = ?1", name).firstResult();
        if (definition == null) {
            throw new IllegalArgumentException("Connection definition not found: " + name);
        }
        if (!definition.active) {
            throw new IllegalArgumentException("Connection definition is inactive: " + name);
        }
        return definition;
    }
    public List<ConnectionDefinition> listAllOrdered() {
        return list("order by name");
    }
    public List<ConnectionDefinition> listActiveOrdered() {
        return list("active = true order by name");
    }
}
