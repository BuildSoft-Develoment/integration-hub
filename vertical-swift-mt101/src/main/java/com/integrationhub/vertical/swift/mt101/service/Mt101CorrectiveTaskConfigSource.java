package com.integrationhub.vertical.swift.mt101.service;

import java.util.Map;

/**
 * B2': provee el config original de una tarea del proceso (MT101_VALIDATE / MT101_ARCHIVE /
 * MT101_PAY) a partir de la tarea de build, para orquestar el ciclo del set correctivo
 * reusando exactamente la misma configuracion del proceso. Abstraido (DIP) para desacoplar
 * el orquestador del acceso a {@code process_task_definition} y poder testearlo con fakes.
 */
public interface Mt101CorrectiveTaskConfigSource {

    /** Config de la tarea {@code taskType} del mismo proceso que {@code buildTaskDefinitionId}, o null. */
    Map<String, Object> taskConfig(long buildTaskDefinitionId, String taskType);

    /**
     * v27 P0.2: config SIN resolver secretos (referencias {@code ${secret:...}} intactas) para congelar un
     * snapshot que no persista secretos resueltos. Por defecto delega en {@link #taskConfig} (fuentes sin
     * pipeline de secretos); las que resuelven secretos lo sobreescriben.
     */
    default Map<String, Object> taskConfigUnresolved(long buildTaskDefinitionId, String taskType) {
        return taskConfig(buildTaskDefinitionId, taskType);
    }

    /** v27 P0.2: resuelve los secretos de un snapshot congelado al momento de ejecutar (Vault fresco). */
    default Map<String, Object> resolveConfig(Map<String, Object> config) {
        return config;
    }
}
