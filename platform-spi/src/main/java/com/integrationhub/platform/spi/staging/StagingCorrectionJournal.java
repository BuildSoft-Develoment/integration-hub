package com.integrationhub.platform.spi.staging;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * ADR-021 (decision 3): donde deja el vertical la evidencia durable de una correccion.
 *
 * <p>El motor <b>calcula</b> la evidencia (hashes del antes/despues, campos cambiados, versiones)
 * pero no es dueño de la tabla donde se archiva: cada vertical tiene la suya, con las columnas de su
 * estandar —en MT101, el set de fragmentos y la ejecucion que lo produjo—, y ademas con los datos
 * del operador (actor, motivo, ticket) que el motor no necesita conocer para corregir.
 *
 * <p><b>Se invoca DENTRO de la transaccion</b>, despues del UPDATE y antes del commit: la fila
 * corregida y su evidencia se persisten juntas o no se persiste ninguna. Una correccion sin rastro
 * seria un cambio no auditable sobre el camino del dinero.
 */
@FunctionalInterface
public interface StagingCorrectionJournal {

    /**
     * @param connection la conexion de la transaccion en curso; usarla para el INSERT, nunca abrir otra.
     */
    void record(Connection connection, StagingCorrectionEvidence evidence) throws SQLException;
}
