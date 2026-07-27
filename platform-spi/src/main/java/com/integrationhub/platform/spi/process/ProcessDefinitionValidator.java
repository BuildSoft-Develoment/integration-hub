package com.integrationhub.platform.spi.process;

import java.util.List;

/**
 * ADR-021: validacion de PUBLICACION de un proceso, aportada por un vertical.
 *
 * <p>El motor valida lo suyo (tipos registrados, referencias, orden) y despues delega en los
 * validadores descubiertos por CDI ({@code Instance<ProcessDefinitionValidator>}), igual que hace
 * con {@code TaskProvider}. Un vertical nuevo agrega su regla implementando esta interfaz: el
 * motor no se toca.</p>
 *
 * <p>Antes, el catalogo de procesos inyectaba por nombre concreto los tres validadores del
 * money-path MT101, asi que el alta de CUALQUIER proceso pasaba por clases de un vertical. Era la
 * unica violacion de OCP de diseño del backend.</p>
 *
 * <h2>Contrato</h2>
 * <ul>
 *   <li>Se invoca solo cuando el proceso queda RUNNABLE (un borrador se guarda libre).</li>
 *   <li>Rechaza lanzando {@link IllegalArgumentException} — el recurso la mapea a 400.</li>
 *   <li>Debe ignorar en silencio los procesos que no le incumben (sin tareas de su estandar):
 *       todos los validadores registrados ven todos los procesos.</li>
 *   <li>Es de solo lectura sobre la vista recibida; el orden entre validadores no importa.</li>
 * </ul>
 */
public interface ProcessDefinitionValidator {

    /**
     * Valida el cableado del proceso. No hace nada si el proceso no contiene tareas del estandar
     * que este validador gobierna.
     *
     * @param tasks tareas activas del proceso, en el orden declarado
     * @throws IllegalArgumentException si el cableado es invalido (se mapea a 400)
     */
    void validate(List<ProcessTaskView> tasks);
}
