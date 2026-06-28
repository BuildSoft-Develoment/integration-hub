package com.integrationhub.platform.service.execution.async;

/**
 * Decision de despacho de una tarea: ejecutar sincrona (in-process) o asincrona
 * (publicada a un broker). Ver ADR-015.
 *
 * @param mode      SYNC o ASYNC
 * @param transport broker destino cuando es ASYNC ({@code null} en SYNC)
 */
public record TaskDispatch(Mode mode, String transport) {

    public enum Mode {
        SYNC,
        ASYNC
    }

    public static TaskDispatch sync() {
        return new TaskDispatch(Mode.SYNC, null);
    }

    public static TaskDispatch async(String transport) {
        return new TaskDispatch(Mode.ASYNC, transport);
    }

    public boolean isAsync() {
        return mode == Mode.ASYNC;
    }
}
