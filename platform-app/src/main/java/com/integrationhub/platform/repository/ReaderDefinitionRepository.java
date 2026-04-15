package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ReaderDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ReaderDefinitionRepository implements PanacheRepository<ReaderDefinition> {

    public ReaderDefinition findRequired(Long readerDefinitionId) {
        var definition = findById(readerDefinitionId);
        if (definition == null) {
            throw new IllegalArgumentException("Reader definition not found: " + readerDefinitionId);
        }
        return definition;
    }

    public List<ReaderDefinition> listAllOrdered() {
        return list("order by name");
    }
}
