package com.integrationhub.platform.spi.engine;

import javax.sql.DataSource;
import java.util.List;

/**
 * ADR-021 (ola 3): resolucion de conexiones JDBC por referencia logica, expuesta como CONTRATO.
 *
 * <p>Un vertical necesita abrir la BD del cliente (leer staging, escribir su ledger) pero no tiene
 * por que conocer al pool del motor ni como resuelve secretos. Antes inyectaba directamente
 * {@code ConnectionPoolManager} — la dependencia mas usada del vertical hacia el motor (24
 * referencias), y la que obligaba a que el vertical viviera dentro de platform-app.</p>
 *
 * <p>Invertir la dependencia evita mover el motor entero a un modulo propio: el vertical depende
 * de esta abstraccion y el motor la implementa.</p>
 */
public interface JdbcConnectionResolver {

    /**
     * DataSource de la conexion logica indicada. Si {@code connectionRef} es nulo o vacio, el
     * implementador decide el default de la plataforma.
     *
     * @throws IllegalArgumentException si la referencia no resuelve a una conexion JDBC activa
     */
    DataSource resolveJdbcDataSource(String connectionRef);

    /** Referencias de conexiones JDBC activas (para pickers/diagnostico). */
    List<String> activeJdbcConnectionRefs();
}
