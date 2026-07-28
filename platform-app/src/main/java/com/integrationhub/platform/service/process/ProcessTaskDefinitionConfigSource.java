package com.integrationhub.platform.service.process;

import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import com.integrationhub.platform.spi.engine.ProcessTaskConfigSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Map;

/**
 * ADR-021: implementacion del motor de {@link ProcessTaskConfigSource} sobre
 * {@code process_task_definition}.
 *
 * <p>Reemplaza a los dos adaptadores por-vertical que habia antes
 * ({@code ProcessTaskDefinition{Build,Corrective}ConfigSource}, uno por interfaz de MT101). Ninguno
 * tenia nada de MT101: leian la misma tabla con la misma logica y solo se diferenciaban en el nombre
 * del puerto que satisfacian. Ahora hay una sola, generica, y un vertical nuevo no necesita la suya.</p>
 *
 * <p>Las transacciones son CORTAS y por llamada ({@code REQUIRED} sobre una lectura): el llamante es
 * un orquestador de reproceso que despues ejecuta etapas lentas (envio al banco), y no debe quedarse
 * con una transaccion abierta mientras tanto.</p>
 */
@ApplicationScoped
public class ProcessTaskDefinitionConfigSource implements ProcessTaskConfigSource {

    private final ProcessTaskDefinitionRepository taskDefinitionRepository;
    private final ConfigurationMapper configurationMapper;

    public ProcessTaskDefinitionConfigSource(ProcessTaskDefinitionRepository taskDefinitionRepository,
                                             ConfigurationMapper configurationMapper) {
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.configurationMapper = configurationMapper;
    }

    @Override
    @Transactional
    public Map<String, Object> configOf(long taskDefinitionId) {
        var definition = taskDefinitionRepository.findRequired(taskDefinitionId);
        return configurationMapper.toMap(definition.configurationJson);
    }

    @Override
    @Transactional
    public Map<String, Object> siblingConfigOf(long taskDefinitionId, String taskType) {
        var sibling = requireUnambiguousSibling(taskDefinitionId, taskType);
        return sibling == null ? null : configurationMapper.toMap(sibling);
    }

    @Override
    @Transactional
    public Map<String, Object> siblingConfigOfUnresolved(long taskDefinitionId, String taskType) {
        var sibling = requireUnambiguousSibling(taskDefinitionId, taskType);
        // toMapUnresolved: las refs ${secret:...} viajan intactas. Es la razon de ser de este metodo.
        return sibling == null ? null : configurationMapper.toMapUnresolved(sibling);
    }

    /** @return el {@code configuration_json} de la unica tarea activa de ese tipo, o null si no hay. */
    private String requireUnambiguousSibling(long taskDefinitionId, String taskType) {
        var task = taskDefinitionRepository.findRequired(taskDefinitionId);
        var siblings = taskDefinitionRepository.listActiveByProcessAndType(task.processDefinition, taskType);
        if (siblings.isEmpty()) {
            return null;
        }
        if (siblings.size() > 1) {
            throw new IllegalStateException("Process " + task.processDefinition.id
                    + " has " + siblings.size() + " active " + taskType
                    + " tasks; reprocessing requires an unambiguous task definition");
        }
        return siblings.get(0).configurationJson;
    }
}
