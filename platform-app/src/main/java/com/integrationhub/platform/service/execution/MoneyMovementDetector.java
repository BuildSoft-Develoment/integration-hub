package com.integrationhub.platform.service.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.TaskProviderRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * ADR-021 (bloque E): decide si UNA TAREA CONFIGURADA mueve dinero hacia afuera.
 *
 * <p>Dos caminos, en OR:</p>
 * <ol>
 *   <li><b>Por capacidad del provider</b> ({@code TaskProvider.movesMoney()}): cubre a la tarea que se
 *       sabe de pago por su tipo, como {@code MT101_PAY}.</li>
 *   <li><b>Por destino</b>: la tarea entrega a una fuente marcada {@code moneyCritical}. Cubre a la tarea
 *       GENERICA — {@code FILE_DELIVER} acepta cualquier {@code sinkRef} de salida, el mismo mecanismo con
 *       el que {@code MT101_PAY} deja el archivo en el banco, asi que un operador puede armar una entrega
 *       de pagos con el. Ese tipo declara {@code movesMoney=false} CON RAZON: es generico. Lo que mueve
 *       dinero es la tarea configurada, no el tipo.</li>
 * </ol>
 *
 * <p>Esto no filtra ningun vertical al motor: {@code sinkRef} ya es un concepto del motor
 * ({@code SinkDefinitionService}, {@code FILE_DELIVER} desde ADR-016).</p>
 *
 * <p><b>Se evalua al ARRANCAR la tarea y se persiste</b> ({@code process_task_execution.moves_money}).
 * Re-evaluarlo en el barrido de huerfanas leeria la definicion ACTUAL, que pudo cambiar entre la caida
 * del nodo y el barrido: la recuperacion tiene que saber lo que realmente paso.</p>
 *
 * <p><b>Limite conocido.</b> Un vertical que mueva dinero sin pasar por un sink —una API REST de pagos—
 * sigue dependiendo de declarar la capacidad. Entre este detector y el trinquete
 * {@code MoneyMovementCapabilityRatchetTest} queda cubierto lo que existe, no lo que pueda inventarse.</p>
 */
@ApplicationScoped
public class MoneyMovementDetector {

    private final TaskProviderRegistry taskProviders;
    private final SourceDefinitionRepository sourceDefinitions;
    private final ObjectMapper objectMapper;

    @Inject
    public MoneyMovementDetector(TaskProviderRegistry taskProviders,
                                 SourceDefinitionRepository sourceDefinitions,
                                 ObjectMapper objectMapper) {
        this.taskProviders = taskProviders;
        this.sourceDefinitions = sourceDefinitions;
        this.objectMapper = objectMapper;
    }

    public boolean movesMoney(String taskType, String configurationJson) {
        if (taskType != null && taskProviders.moneyMovementTaskTypes().contains(taskType)) {
            return true;
        }
        var sinkRef = sinkRefOf(configurationJson);
        if (sinkRef == null) {
            return false;
        }
        var source = sourceDefinitions.findById(sinkRef);
        return source != null && source.moneyCritical;
    }

    /**
     * {@code sinkRef} de la configuracion, o {@code null} si no lo declara.
     *
     * <p>Una config a medio escribir devuelve {@code null} en vez de romper: si el JSON es invalido, la
     * tarea no va a llegar a ejecutarse igual, y hacer fallar el ARRANQUE con un error de parseo aca
     * ocultaria el error real.</p>
     */
    private Long sinkRefOf(String configurationJson) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return null;
        }
        try {
            var node = objectMapper.readTree(configurationJson).get("sinkRef");
            return node != null && node.canConvertToLong() ? node.asLong() : null;
        } catch (com.fasterxml.jackson.core.JsonProcessingException ignored) {
            return null;
        }
    }
}
