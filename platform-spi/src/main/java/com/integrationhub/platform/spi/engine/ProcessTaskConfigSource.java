package com.integrationhub.platform.spi.engine;

import java.util.Map;

/**
 * ADR-021: lectura del {@code configuration_json} de una tarea del proceso.
 *
 * <p>Un vertical necesita esto para reprocesar: reconstruir un lote correctivo exige correr las
 * etapas <b>con exactamente la misma configuracion</b> con la que se construyo la primera vez, y esa
 * configuracion vive en una tabla del motor. El vertical no debe conocer esa tabla.</p>
 *
 * <p>Nacio como dos interfaces del vertical MT101 ({@code Mt101BuildConfigSource} y
 * {@code Mt101CorrectiveTaskConfigSource}) con un adaptador del motor cada una. No tenian nada de
 * MT101: cualquier vertical con reproceso quiere lo mismo. Al subirlas aca, el motor las implementa
 * UNA vez y un vertical nuevo (SBS) las hereda sin escribir adaptador.</p>
 *
 * <h2>Contrato de la busqueda por tipo</h2>
 * <p>Se exige una tarea activa <b>inequivoca</b> de ese tipo en el proceso: cero devuelve
 * {@code null} (el llamante decide si eso es un error), y dos o mas es un error — reprocesar
 * eligiendo "alguna" de dos configuraciones es exactamente el tipo de ambiguedad que en un
 * money-path no se resuelve adivinando.</p>
 */
public interface ProcessTaskConfigSource {

    /**
     * Config de la tarea, con las referencias {@code ${secret:...}} <b>YA RESUELTAS</b>: lista para
     * ejecutar.
     *
     * @throws IllegalArgumentException si la tarea no existe
     */
    Map<String, Object> configOf(long taskDefinitionId);

    /**
     * Config de la tarea activa de tipo {@code taskType} <b>del mismo proceso</b> que
     * {@code taskDefinitionId}, con los secretos YA RESUELTOS.
     *
     * @param taskDefinitionId cualquier tarea del proceso; sirve para ubicar el proceso
     * @return la config, o {@code null} si el proceso no tiene una tarea activa de ese tipo
     * @throws IllegalStateException si hay mas de una activa de ese tipo (ver contrato arriba)
     */
    Map<String, Object> siblingConfigOf(long taskDefinitionId, String taskType);

    /**
     * Igual que {@link #siblingConfigOf} pero con las referencias {@code ${secret:...}}
     * <b>INTACTAS</b>, para congelar un snapshot que se resolvera recien al ejecutar.
     *
     * <p><b>Es abstracto a proposito.</b> La version anterior traia un {@code default} que delegaba
     * en la variante resuelta: quien olvidara sobreescribirlo persistia secretos en claro dentro del
     * snapshot congelado — justo lo que este metodo existe para impedir. Con una sola implementacion
     * eso se aguantaba; con un SPI que cada vertical nuevo puede implementar, no. Ahora el compilador
     * obliga a decidir.</p>
     */
    Map<String, Object> siblingConfigOfUnresolved(long taskDefinitionId, String taskType);
}
