package com.integrationhub.platform.spi.process;

/**
 * ADR-021: vista minima y NEUTRA de una tarea del proceso que se esta publicando, tal como la ve
 * un {@link ProcessDefinitionValidator}.
 *
 * <p>Es deliberadamente pobre: tipo, orden y configuracion cruda. El motor no interpreta el
 * {@code configurationJson} — quien lo entiende es el vertical dueño de ese tipo de tarea. Asi el
 * contrato no crece cada vez que un estandar nuevo necesita mirar un campo propio.</p>
 *
 * <p>Antes este tipo era {@code Mt101PayResolutionValidator.TaskView}: el servicio generico de
 * catalogo de procesos exponia en sus firmas un tipo anidado de un vertical.</p>
 */
public record ProcessTaskView(String taskType, Integer taskOrder, String configurationJson) {
}
