package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;

import java.util.Map;

/**
 * Seam de transporte hacia un plugin out-of-process (ADR-014). Aisla al motor del
 * mecanismo concreto: la implementacion por defecto seria gRPC (o el broker via
 * {@code AsyncTaskEnvelope}); los tests la stubean.
 *
 * <p>Es el analogo backend de {@code REMOTE_MODULE_LOADER} del frontend: el contrato
 * de orquestacion no depende del transporte.</p>
 */
public interface RemotePluginInvoker {

    TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration);
}
