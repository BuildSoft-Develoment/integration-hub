package com.integrationhub.platform.spi.task;

/**
 * Capacidad de un {@link TaskProvider} para ejecutarse <b>offloadado a un broker</b> (ADR-015).
 *
 * <p>El consumer async ejecuta la tarea con un {@link TaskContext} <b>reconstruido</b> desde el
 * envelope: solo lleva {@code processExecutionId}/{@code taskDefinitionId}, la {@code configuration}
 * y —en scatter— los {@code records} del slice. <b>No</b> propaga el contexto en vivo que el motor
 * síncrono inyecta ({@code sourcePayload}, {@code readResult}, {@code taskOutputs},
 * {@code executionVariables}). Por eso un provider solo es offloadable si su trabajo está capturado
 * por lo que sí viaja.</p>
 *
 * <p>Es el provider —única autoridad sobre lo que lee del contexto— quien declara su capacidad. El
 * motor la respeta y <b>lanza</b> (sin degradar a síncrono en silencio) si se pide async sobre un
 * provider que no la soporta. La UI la consume (vía el catálogo de tipos) para ofrecer el toggle
 * async solo donde es correcto.</p>
 */
public enum AsyncOffloadSupport {

    /** Trabajo 100% en {@code configuration}: offloadable en cualquier {@code executionMode}. */
    SUPPORTED,

    /**
     * Necesita los {@code records} (que solo viajan como slices): offloadable únicamente como
     * <b>scatter</b> ({@code executionMode} {@code batch}/{@code per-record}), no en {@code once}.
     */
    SLICE_ONLY,

    /**
     * Depende de contexto en vivo no propagable ({@code sourcePayload} —stream no serializable—,
     * {@code taskOutputs}, {@code executionVariables}) o suspende esperando un evento externo
     * ({@link SuspendableTaskProvider}). No offloadable hoy. <b>Default</b> conservador.
     */
    UNSUPPORTED
}
