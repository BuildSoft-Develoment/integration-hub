package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * El {@code taskRef} identifica una tarea dentro de su proceso: {@code input.sourceTaskRef} cablea el
 * pipeline por el y {@code resolvesPayTaskRef} nombra a que PAY concilia un STATUS. Repetido, la
 * referencia se resuelve por "el primero que coincida" — adivina.
 */
class TaskRefUniquenessValidatorTest {

    private final TaskRefUniquenessValidator validator = new TaskRefUniquenessValidator(new ObjectMapper());

    private static ProcessTaskView task(String type, int order, String taskRef) {
        return new ProcessTaskView(type, order, "{\"taskRef\":\"" + taskRef + "\"}");
    }

    @Test
    void acceptsAPipelineWhereEveryTaskHasItsOwnName() {
        validator.validate(List.of(
                task("FILE_READ", 1, "file-read"),
                task("DB_WRITE", 2, "stage"),
                task("MT101_PAY", 3, "pay-mt101")));
    }

    @Test
    void rejectsTwoTasksSharingATaskRef() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                task("MT101_PAY", 3, "pay-mt101"),
                task("MT101_PAY", 4, "pay-mt101"))));
        assertTrue(error.getMessage().contains("pay-mt101"), () -> "mensaje: " + error.getMessage());
        assertTrue(error.getMessage().contains("3, 4"), () -> "debe decir QUE tareas: " + error.getMessage());
    }

    @Test
    void allowsSeveralTasksWithoutATaskRef() {
        // Una tarea terminal que nadie referencia no necesita nombre. Exigirlo rechazaria definiciones
        // validas que existen hoy (p.ej. el FILE_WRITE final del proceso 2 del stack de integracion).
        validator.validate(List.of(
                new ProcessTaskView("FILE_WRITE", 1, "{}"),
                new ProcessTaskView("NOTIFICATION", 2, "{}"),
                new ProcessTaskView("REST_CALL", 3, "{\"taskRef\":\"\"}")));
    }

    @Test
    void treatsBlankAndWhitespaceAsNoName() {
        // "   " no identifica nada; contarlo como nombre haria fallar un proceso por dos espacios.
        validator.validate(List.of(
                new ProcessTaskView("FILE_WRITE", 1, "{\"taskRef\":\"   \"}"),
                new ProcessTaskView("NOTIFICATION", 2, "{\"taskRef\":\"\"}")));
    }

    @Test
    void reportsEveryDuplicatedName() {
        // Con dos colisiones distintas el operador tiene que verlas TODAS: arreglar una y volver a fallar
        // por la otra es el peor bucle de feedback posible.
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                task("FILE_READ", 1, "leer"),
                task("FILE_READ", 2, "leer"),
                task("DB_WRITE", 3, "escribir"),
                task("DB_WRITE", 4, "escribir"))));
        assertTrue(error.getMessage().contains("leer"), () -> "mensaje: " + error.getMessage());
        assertTrue(error.getMessage().contains("escribir"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void malformedConfigurationIsNotThisValidatorsProblem() {
        // JSON a medio escribir lo rechaza quien lo parsea de verdad. Un validador que explota aca
        // bloquea el guardado con un error que no explica nada.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("FILE_READ", 1, "{roto"),
                task("DB_WRITE", 2, "stage"))));
    }

    @Test
    void aSingleTaskIsAlwaysFine() {
        validator.validate(List.of(task("FILE_READ", 1, "file-read")));
    }
}
