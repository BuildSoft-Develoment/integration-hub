package com.integrationhub.platform.service.sink;

import com.integrationhub.platform.repository.SourceDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * ADR-016: carga una definicion {@code /sources} usada como sink de {@code FILE_DELIVER}, en una transaccion CORTA, y
 * devuelve un DTO desacoplado (JSON de conexion + tipo + direction). Asi la tarea no mantiene una transaccion de BD
 * abierta durante la entrega (que puede ser lenta: SFTP/red).
 */
@ApplicationScoped
public class SinkDefinitionService {

    private final SourceDefinitionRepository sourceDefinitionRepository;

    @Inject
    public SinkDefinitionService(SourceDefinitionRepository sourceDefinitionRepository) {
        this.sourceDefinitionRepository = sourceDefinitionRepository;
    }

    @Transactional
    public SinkDefinition resolve(Long sourceDefinitionId) {
        var definition = sourceDefinitionRepository.findRequired(sourceDefinitionId);
        return new SinkDefinition(definition.id, definition.name, definition.sourceType,
                definition.configurationJson, definition.direction);
    }

    /** DTO desacoplado de la entidad (evita entidad detached fuera de la transaccion). */
    public record SinkDefinition(Long id, String name, String type, String configurationJson, String direction) {

        public boolean allowsOutput() {
            var normalized = direction == null ? "INPUT" : direction.trim().toUpperCase();
            return "OUTPUT".equals(normalized) || "BOTH".equals(normalized);
        }
    }
}
