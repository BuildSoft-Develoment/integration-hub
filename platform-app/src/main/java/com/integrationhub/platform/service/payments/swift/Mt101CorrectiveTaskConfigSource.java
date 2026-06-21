package com.integrationhub.platform.service.payments.swift;

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
}
