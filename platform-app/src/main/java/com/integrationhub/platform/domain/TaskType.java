package com.integrationhub.platform.domain;

/**
 * Constantes de tipos de tarea para los <b>tipos base del motor</b> (spec 003).
 *
 * <p><b>Cierre de M-1a</b> (T-015 spec 003, ADR-009): este archivo dejo de ser
 * un enum cerrado y ahora es una clase de constantes {@code String}.</p>
 *
 * <p>Las verticales (spec 008 mensajeria de pagos, spec 009 ISO 20022,
 * futuras: HL7, ACH, AML, etc.) registran sus task types via
 * {@code TaskProviderRegistry} sin modificar este archivo. El motor consulta
 * {@link com.integrationhub.platform.service.execution.TaskTypeRegistry} para
 * obtener el catalogo completo de tipos registrados (motor + verticales).</p>
 *
 * <p>El motor ramifica por estos tipos para fast-path (FILE_READ -&gt; sink) y
 * para la serializacion de outputs especificos (DB_*); las demas tipos van por
 * el camino generico de {@code TaskProvider}.</p>
 */
public final class TaskType {

    // --- Tipos base del motor (spec 003) ---
    public static final String FILE_READ = "FILE_READ";
    public static final String DB_WRITE = "DB_WRITE";
    public static final String DB_EXECUTE_SP = "DB_EXECUTE_SP";
    public static final String DB_EXECUTE_FN = "DB_EXECUTE_FN";
    public static final String REST_CALL = "REST_CALL";
    public static final String NOTIFICATION = "NOTIFICATION";

    /**
     * Conjunto inmutable de los tipos base. Se usa por {@code TaskTypeRegistry}
     * para validar que toda tarea reconozca al menos los tipos del motor, y
     * por la UI para distinguirlos visualmente de los aportados por verticales.
     */
    public static final java.util.Set<String> BUILTIN = java.util.Set.of(
            FILE_READ, DB_WRITE, DB_EXECUTE_SP, DB_EXECUTE_FN, REST_CALL, NOTIFICATION
    );

    private TaskType() {
        // namespace de constantes; no instanciable.
    }
}
