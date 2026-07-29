package com.integrationhub.platform.spi.staging;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * ADR-021 (decision 3): las dos unicas sentencias que necesita el motor para corregir una fila de
 * {@code staging_record}. La tabla es del nucleo; el vertical dejo de escribirla directamente.
 *
 * <p>Deliberadamente minima: proyecta {@code payload_json} y {@code version} y nada mas. Lo que un
 * vertical muestre al operador —linea fisica del archivo, hoja y fila de un Excel— es presentacion
 * suya y lo consulta por su cuenta; meterlo aca ataria el motor a como cada estandar entrega datos.
 */
public class StagingRecordCorrectionRepository {

    /** @return {@code null} si la fila no existe. */
    public StagingRowPayload findPayload(Connection connection, long stagingId) throws SQLException {
        var sql = "select id, payload_json, version from staging_record where id = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, stagingId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new StagingRowPayload(rs.getLong("id"), rs.getString("payload_json"), rs.getLong("version"));
            }
        }
    }

    /**
     * UPDATE condicionado a la version: <b>este {@code where} es el lock optimista</b>. Devolver 0
     * no es "no habia nada que cambiar", es "alguien gano la carrera"; quien llama debe tratarlo como
     * conflicto y jamas como exito silencioso.
     *
     * @return filas afectadas: 1 si se aplico, 0 si la version ya no coincide.
     */
    public int updatePayload(Connection connection, long stagingId, String payloadJson, long expectedVersion)
            throws SQLException {
        var sql = "update staging_record set payload_json = ?, version = version + 1 "
                + "where id = ? and version = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, payloadJson);
            statement.setLong(2, stagingId);
            statement.setLong(3, expectedVersion);
            return statement.executeUpdate();
        }
    }

    /** Proyeccion minima de una fila de staging para el camino de correccion. */
    public record StagingRowPayload(long id, String payloadJson, long version) {
    }
}
