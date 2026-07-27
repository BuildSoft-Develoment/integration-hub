package com.integrationhub.platform.spi.engine;

import com.integrationhub.platform.audit.AuditEnvelope;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collection;

/**
 * ADR-021: escribe tramas de auditoria en el spool <b>dentro de una conexion JDBC que aporta quien
 * llama</b>.
 *
 * <p>Es distinto de {@link RecordAuditEmitter}, que emite por registro y decide por su cuenta como y
 * cuando persistir. Aca la conexion es del llamante a proposito: el caso de uso es atomicidad — la
 * trama tiene que confirmarse (o perderse) en la MISMA transaccion que el cambio de negocio que
 * describe. Un money-path que reconoce un conflicto no puede quedar reconocido sin su trama, ni
 * dejar trama de algo que no se aplico.</p>
 *
 * <p>Por eso el metodo NO abre ni cierra la conexion, ni hace commit: solo escribe.</p>
 */
public interface AuditSpoolGateway {

    /**
     * Escribe el lote en el spool usando la conexion dada, sin commit.
     *
     * @param connection conexion viva del llamante, dentro de su transaccion
     * @param envelopes tramas a spoolear (vacio = no-op)
     */
    void writeBatch(Connection connection, Collection<AuditEnvelope> envelopes) throws SQLException;
}
