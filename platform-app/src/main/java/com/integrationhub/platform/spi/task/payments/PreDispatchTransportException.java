package com.integrationhub.platform.spi.task.payments;

/**
 * v27 P1: error de transporte de pago que ocurre ANTES de iniciar cualquier I/O remota (validacion de
 * configuracion, URL/template invalido, config incompleta). Senala explicitamente que el mensaje NO salio
 * al banco, asi que el orquestador puede clasificarlo como REJECTED seguro (re-solicitable).
 *
 * <p>Regla bancaria (clasificacion por TIPO, no por suposicion): solo esta excepcion tipada implica
 * "no salio al banco". Cualquier otra {@link RuntimeException} inesperada se trata como INCIERTA
 * (no se puede demostrar que no llego al banco), nunca como rechazo reusable.</p>
 *
 * <p>Extiende {@link IllegalArgumentException} por compatibilidad con quien valida config con esa
 * excepcion; el orquestador la distingue por su tipo concreto para clasificar el resultado.</p>
 */
public class PreDispatchTransportException extends IllegalArgumentException {

    public PreDispatchTransportException(String message) {
        super(message);
    }

    public PreDispatchTransportException(String message, Throwable cause) {
        super(message, cause);
    }
}
