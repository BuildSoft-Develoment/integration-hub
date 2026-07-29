package com.integrationhub.platform.spi.staging;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * ADR-021 (decision 3): quien decide <b>si</b> una fila de staging puede editarse.
 *
 * <p>El motor sabe corregir una fila —merge-patch, If-Match, evidencia, todo en una transaccion—
 * pero no sabe cuando esta prohibido hacerlo. Eso depende del estandar: en SWIFT MT101 una fila
 * congelada por un rebuild APPROVED/BUILDING no se toca, porque sus datos ya los aprobo el checker
 * y editarlos romperia la segregacion maker-checker. Otro vertical tendra otras razones, o ninguna.
 *
 * <p><b>Se invoca DENTRO de la transaccion de correccion</b>, con la misma conexion y antes de leer
 * el payload. No es un detalle de estilo: comprobar el veto en otra conexion abriria una ventana
 * TOCTOU sobre el camino del dinero —el rebuild podria aprobarse entre el chequeo y el UPDATE.
 *
 * <p>Vetar es <b>lanzar</b>. La excepcion viaja intacta hasta el llamante (el motor no la traduce ni
 * la traga) y dispara el rollback, asi que cada vertical conserva su vocabulario de error.
 */
@FunctionalInterface
public interface StagingCorrectionPolicy {

    /**
     * @param connection la conexion de la transaccion en curso; usarla para cualquier consulta de
     *                   estado, nunca abrir otra.
     * @throws RuntimeException si la fila no puede editarse.
     */
    void checkEditable(Connection connection) throws SQLException;
}
