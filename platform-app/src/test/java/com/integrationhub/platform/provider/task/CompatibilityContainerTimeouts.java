package com.integrationhub.platform.provider.task;

/**
 * Timeout de arranque de los contenedores de compatibilidad multi-BD.
 *
 * <p><b>Por que existe.</b> El default de Testcontainers (120 s) esta por debajo de lo que estas
 * imagenes tardan realmente en esta clase de maquina, asi que el resultado del build dependia de la
 * carga en vez del codigo. Medido el 2026-07-29:</p>
 *
 * <table>
 *   <caption>Tiempos observados</caption>
 *   <tr><th>Contenedor</th><th>Aislado</th><th>En el reactor</th></tr>
 *   <tr><td>MySQL (funciones)</td><td>237 s</td><td><b>fallo</b> a los 383 s</td></tr>
 *   <tr><td>MySQL (procedimientos)</td><td>-</td><td>118 s</td></tr>
 *   <tr><td>Oracle</td><td>-</td><td>288 s / 200 s</td></tr>
 *   <tr><td>SQL Server</td><td>-</td><td>85 s / 67 s</td></tr>
 *   <tr><td>PostgreSQL</td><td>-</td><td>12 s / 8 s</td></tr>
 * </table>
 *
 * <p>El fallo de MySQL <b>no era la imagen</b>: otro contenedor de {@code mysql:8.4} arranco bien en
 * 118 s en la MISMA corrida. Era Testcontainers agotando su presupuesto de reintentos
 * ({@code RetryCountExceededException}) mientras varios contenedores competian por I/O.</p>
 *
 * <p><b>Por que 8 minutos y no otro numero.</b> Es el valor que los tests de Oracle ya usaban
 * (y por eso Oracle pasaba con 288 s mientras MySQL reventaba). Se unifica en vez de inventar uno
 * nuevo: una sola politica para toda la suite multi-BD.</p>
 *
 * <p><b>Por que no se saca la suite a un perfil aparte.</b> Porque esconderia el problema y dejaria
 * la compatibilidad multi-BD fuera del build base: lo contrario de lo que exige una homologacion
 * bancaria. El arreglo es calibrar el timeout, no dejar de medir.</p>
 */
public final class CompatibilityContainerTimeouts {

    /** Segundos que se le conceden a un contenedor de compatibilidad para quedar sano. */
    public static final int STARTUP_SECONDS = 8 * 60;

    private CompatibilityContainerTimeouts() {
    }
}
