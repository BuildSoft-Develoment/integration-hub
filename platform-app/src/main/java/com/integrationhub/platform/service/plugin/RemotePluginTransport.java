package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;

import java.util.Map;

/**
 * Transporte concreto para invocar un plugin backend out-of-process.
 *
 * <p>El core selecciona una implementacion por descriptor y la ejecuta detras de
 * {@link ResilientRemotePluginInvoker}. Esto deja el contrato abierto a gRPC,
 * broker u otros transportes sin acoplar {@code TaskProviderRegistry} a ninguno.</p>
 */
public interface RemotePluginTransport {

    boolean supports(RemotePluginDescriptor descriptor);

    TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration);
}
