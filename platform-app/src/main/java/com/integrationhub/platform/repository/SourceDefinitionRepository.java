package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.SourceDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class SourceDefinitionRepository implements PanacheRepository<SourceDefinition> {

    public SourceDefinition findRequired(Long sourceDefinitionId) {
        var definition = findById(sourceDefinitionId);
        if (definition == null) {
            throw new IllegalArgumentException("Source definition not found: " + sourceDefinitionId);
        }
        return definition;
    }

    public List<SourceDefinition> listAllOrdered() {
        return list("order by name");
    }
}
