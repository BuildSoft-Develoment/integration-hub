package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.task.sink.OutputSinkRegistry;
import com.integrationhub.platform.spi.engine.SinkDefinitionResolver;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Se puede elegir un destino cuyo tipo la salida no sabe entregar, guardarlo, activarlo y descubrirlo
 * en la primera ejecucion. Estos tests fijan que se diga al publicar, no al correr.
 */
class FileDeliverSinkValidatorTest {

    private static OutputSink sink(String type) {
        return new OutputSink() {
            @Override public String type() { return type; }
            @Override public void deliver(String dropPath, StreamSource source, Map<String, Object> config) throws IOException { }
        };
    }

    /** Registry con los dos sinks que existen hoy. */
    private static final OutputSinkRegistry SINKS =
            new OutputSinkRegistry(List.of(sink("FILESYSTEM"), sink("SFTP")));

    private static SinkDefinitionResolver catalogo(SinkDefinitionResolver.SinkDefinition... definiciones) {
        return id -> List.of(definiciones).stream()
                .filter(d -> d.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("no existe: " + id));
    }

    private static FileDeliverSinkValidator validador(SinkDefinitionResolver catalogo) {
        return new FileDeliverSinkValidator(new ObjectMapper(), SINKS, catalogo);
    }

    private static ProcessTaskView entrega(int order, Long sinkRef) {
        return new ProcessTaskView("FILE_DELIVER", order, "{\"sinkRef\":" + sinkRef + "}");
    }

    @Test
    void rechazaAlPublicarUnDestinoSinSink() {
        var ftp = new SinkDefinitionResolver.SinkDefinition(7L, "FTP del proveedor", "FTP", "{}", "OUTPUT");

        var error = assertThrows(IllegalArgumentException.class,
                () -> validador(catalogo(ftp)).validate(List.of(entrega(3, 7L))));

        // El motivo tiene que ser accionable: qué tipo falla y qué sí se puede elegir.
        assertTrue(error.getMessage().contains("FTP"), error.getMessage());
        assertTrue(error.getMessage().contains("FILESYSTEM"), () -> "debe listar los tipos entregables: " + error.getMessage());
        assertTrue(error.getMessage().contains("SFTP"), error.getMessage());
        assertTrue(error.getMessage().contains("task order 3"), () -> "debe ubicar la tarea: " + error.getMessage());
    }

    @Test
    void aceptaLosDosTiposQueSiSeSabenEntregar() {
        var disco = new SinkDefinitionResolver.SinkDefinition(1L, "Carpeta regulatoria", "FILESYSTEM", "{}", "OUTPUT");
        var sftp = new SinkDefinitionResolver.SinkDefinition(2L, "SFTP del banco", "SFTP", "{}", "BOTH");
        var validador = validador(catalogo(disco, sftp));

        assertDoesNotThrow(() -> validador.validate(List.of(entrega(1, 1L), entrega(2, 2L))));
    }

    @Test
    void rechazaUnaFuenteDeSoloEntrada() {
        var entrada = new SinkDefinitionResolver.SinkDefinition(9L, "Carpeta de extractos", "FILESYSTEM", "{}", "INPUT");

        var error = assertThrows(IllegalArgumentException.class,
                () -> validador(catalogo(entrada)).validate(List.of(entrega(1, 9L))));

        assertTrue(error.getMessage().contains("direction=INPUT"), error.getMessage());
    }

    @Test
    void rechazaUnDestinoQueYaNoExiste() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> validador(catalogo()).validate(List.of(entrega(1, 404L))));

        assertTrue(error.getMessage().contains("no longer exists"), error.getMessage());
    }

    @Test
    void ignoraEnSilencioLosProcesosQueNoLeIncumben() {
        // Contrato del SPI: todos los validadores ven todos los procesos.
        var validador = validador(catalogo());
        var otras = List.of(
                new ProcessTaskView("FILE_READ", 1, "{}"),
                new ProcessTaskView("DB_WRITE", 2, "{\"targetTable\":\"staging_record\"}"),
                new ProcessTaskView("MT101_PAY", 3, "{\"sinkRef\":7}"));

        assertDoesNotThrow(() -> validador.validate(otras));
        assertDoesNotThrow(() -> validador.validate(null));
    }

    @Test
    void unaEntregaSinDestinoTodaviaNoSeRechaza() {
        // Publicar un proceso a medio cablear es legitimo: el destino se exige al ejecutar. Rechazarlo
        // aqui impediria activar procesos que el operador todavia esta armando.
        var validador = validador(catalogo());

        assertDoesNotThrow(() -> validador.validate(List.of(
                new ProcessTaskView("FILE_DELIVER", 1, "{}"),
                new ProcessTaskView("FILE_DELIVER", 2, "{\"sinkRef\":null}"),
                new ProcessTaskView("FILE_DELIVER", 3, "{\"dropPathTemplate\":\"${originalName}\"}"))));
    }

    @Test
    void elSinkRefViajaComoNumeroOComoTextoYAmbosSeComprueban() {
        // El front lo transporta de las dos formas segun el camino; si solo se entendiera una, la
        // comprobacion se saltaria en silencio justo en la mitad de los casos.
        var ftp = new SinkDefinitionResolver.SinkDefinition(7L, "FTP", "FTP", "{}", "OUTPUT");
        var validador = validador(catalogo(ftp));

        assertThrows(IllegalArgumentException.class,
                () -> validador.validate(List.of(new ProcessTaskView("FILE_DELIVER", 1, "{\"sinkRef\":7}"))));
        assertThrows(IllegalArgumentException.class,
                () -> validador.validate(List.of(new ProcessTaskView("FILE_DELIVER", 1, "{\"sinkRef\":\"7\"}"))));
    }
}
