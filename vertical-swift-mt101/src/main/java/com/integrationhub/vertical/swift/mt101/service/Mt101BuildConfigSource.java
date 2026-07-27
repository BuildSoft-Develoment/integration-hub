package com.integrationhub.vertical.swift.mt101.service;

import java.util.Map;

/**
 * Provee el config original de la tarea {@code MT101_BUILD_FROM_TABLE} que genero
 * un set de fragmentos, para reconstruir scoped a las filas corregidas. Abstraido
 * (DIP) para desacoplar el reproceso del acceso a {@code process_task_definition}.
 */
public interface Mt101BuildConfigSource {

    Map<String, Object> buildConfig(long taskDefinitionId);
}
