package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.task.sink.OutputSinkRegistry;
import com.integrationhub.platform.spi.engine.SinkDefinitionResolver;
import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Un {@code FILE_DELIVER} solo se puede publicar si su destino se puede entregar de verdad.
 *
 * <p><b>Por que existe.</b> El catalogo de {@code /sources} admite mas tipos de ENTRADA de los que la
 * salida sabe escribir —el cruce al dia, generado desde el codigo, esta en el catalogo de tipos de
 * {@code docs/transversal}—. El selector de destino ofrecia cualquier fuente marcada {@code direction}
 * OUTPUT/BOTH sin comprobar que existiera sink, asi que se podia elegir una fuente de un tipo sin
 * salida, <b>guardar el proceso sin ningun error</b>, activarlo, programarlo — y descubrirlo en la
 * primera ejecucion, cuando {@code OutputSinkRegistry.resolve} lanza
 * {@code "Unsupported output sink: <tipo>"} con alguien esperando el archivo.</p>
 *
 * <p>Falla ruidoso, si. Pero <b>tarde</b>: despues de que alguien creyo tenerlo listo. Esta clase mueve
 * esa deteccion al momento en que se toma la decision.</p>
 *
 * <p><b>Que comprueba, en orden:</b> que el {@code sinkRef} exista, que la fuente admita salida
 * ({@code OUTPUT}/{@code BOTH}) y que haya un sink para su tipo. Son las tres cosas que
 * {@code FileDeliverTaskProvider} verifica al ejecutar; aqui se preguntan antes.</p>
 *
 * <p><b>Alcance.</b> Solo se invoca al publicar (un borrador se guarda libre, ver
 * {@code ProcessCatalogService}), e ignora en silencio los procesos sin {@code FILE_DELIVER}, como
 * exige el contrato del SPI.</p>
 */
@ApplicationScoped
public class FileDeliverSinkValidator implements ProcessDefinitionValidator {

    private static final String FILE_DELIVER = "FILE_DELIVER";

    private final ObjectMapper objectMapper;
    private final OutputSinkRegistry sinks;
    private final SinkDefinitionResolver sinkDefinitions;

    @Inject
    public FileDeliverSinkValidator(ObjectMapper objectMapper,
                                    OutputSinkRegistry sinks,
                                    SinkDefinitionResolver sinkDefinitions) {
        this.objectMapper = objectMapper;
        this.sinks = sinks;
        this.sinkDefinitions = sinkDefinitions;
    }

    @Override
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null) {
            return;
        }
        for (var task : tasks) {
            if (FILE_DELIVER.equalsIgnoreCase(task.taskType())) {
                validateOne(task);
            }
        }
    }

    private void validateOne(ProcessTaskView task) {
        var sinkRef = sinkRefOf(task.configurationJson());
        if (sinkRef == null) {
            // Sin destino elegido todavia: el provider lo exige al ejecutar y el formulario lo pide.
            // Rechazarlo aqui impediria publicar un proceso que el operador aun esta cableando.
            return;
        }

        SinkDefinitionResolver.SinkDefinition definition;
        try {
            definition = sinkDefinitions.resolve(sinkRef);
        } catch (RuntimeException notFound) {
            throw new IllegalArgumentException("FILE_DELIVER (task order " + task.taskOrder()
                    + ") points to sink id " + sinkRef + ", which no longer exists in /sources.", notFound);
        }

        if (!definition.allowsOutput()) {
            throw new IllegalArgumentException("FILE_DELIVER (task order " + task.taskOrder()
                    + ") uses source '" + definition.name() + "' (id " + sinkRef + "), which is direction="
                    + definition.direction() + ". Set it to OUTPUT or BOTH, or pick another destination.");
        }

        if (!sinks.supports(definition.type())) {
            throw new IllegalArgumentException("FILE_DELIVER (task order " + task.taskOrder()
                    + ") uses source '" + definition.name() + "' (id " + sinkRef + ") of type "
                    + definition.type() + ", and there is no output sink for that type: the file could not "
                    + "be delivered and the process would only fail once it runs. Destinations that can be "
                    + "delivered to today: " + String.join(", ", sinks.availableTypes()) + ".");
        }
    }

    private Long sinkRefOf(String configurationJson) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return null;
        }
        try {
            var node = objectMapper.readTree(configurationJson).get("sinkRef");
            if (node == null || node.isNull()) {
                return null;
            }
            // El front lo transporta como numero o como texto segun el camino; ambos son validos.
            var text = node.asText("").trim();
            return text.isEmpty() ? null : Long.valueOf(text);
        } catch (Exception ignored) {
            // Config ilegible o sinkRef no numerico: no es asunto de este validador. Si de verdad esta
            // roto, el provider fallara al ejecutar con su propio mensaje.
            return null;
        }
    }
}
