package com.integrationhub.platform.spi.staging;

/**
 * Conflicto de locking optimista: la fila de staging cambio desde que el operador la leyo.
 *
 * <p>El motor la lanza en dos puntos distintos y ambos importan: al comparar el If-Match que trajo
 * el cliente, y otra vez si el {@code UPDATE ... where version = ?} no afecta filas (o sea, alguien
 * gano la carrera entre la lectura y la escritura). Sin el segundo chequeo el If-Match seria
 * decorativo.
 *
 * <p>Habla de {@code stagingId} porque es lo unico que el motor conoce de la fila. Un vertical que
 * exponga la correccion por su propia identidad —numero de registro, referencia del mensaje— la
 * traduce a su vocabulario antes de llegar al operador.
 */
public class StaleStagingRowException extends RuntimeException {

    private final long stagingId;
    private final long expectedVersion;
    private final long actualVersion;

    public StaleStagingRowException(long stagingId, long expectedVersion, long actualVersion) {
        super("staging row id " + stagingId + " was modified concurrently (expected version "
                + expectedVersion + " but is " + actualVersion + "); reload and retry");
        this.stagingId = stagingId;
        this.expectedVersion = expectedVersion;
        this.actualVersion = actualVersion;
    }

    public long stagingId() {
        return stagingId;
    }

    public long expectedVersion() {
        return expectedVersion;
    }

    public long actualVersion() {
        return actualVersion;
    }
}
