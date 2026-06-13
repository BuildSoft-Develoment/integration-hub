package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collection;

/**
 * Avanza el estado de negocio durable en {@code mt101_archive} a lo largo del
 * pipeline, por {@code senders_reference}:
 *
 * <pre>
 *   MT101_ARCHIVE  -> ARCHIVED   (insert directo, no via este updater)
 *   MT101_PAY      -> SENT / REJECTED
 *   MT101_STATUS   -> CONFIRMED / REJECTED
 *   MT101_RECONCILE-> RECONCILED / UNMATCHED
 * </pre>
 *
 * <p>Antes, {@code mt101_archive.status} quedaba en {@code COMPOSED} para
 * siempre aunque el fragmento ya estuviera SENT: la tabla durable de auditoria
 * mentia. El lifecycle de {@code mt101_build_fragment} (flujo masivo) ya estaba
 * sincronizado; este updater cierra el mismo gap en la tabla de archivo.</p>
 *
 * <p>Marcado por lote (un {@code addBatch} por pagina) y tolerante: si la tabla
 * de archivo no esta configurada/accesible para una ejecucion (e.g. flujo
 * sin archivo), no hace nada. La sincronizacion se desactiva con
 * {@code archiveStatusSync=false}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-017
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ArchiveStatusUpdater {

    public static final String DEFAULT_TABLE = "mt101_archive";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;

    @Inject
    public Mt101ArchiveStatusUpdater(DataSource defaultDataSource,
                                     ConnectionPoolManager connectionPoolManager) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
    }

    /** Constructor de test con datasource directo. */
    public Mt101ArchiveStatusUpdater(DataSource defaultDataSource) {
        this(defaultDataSource, null);
    }

    /**
     * Actualiza {@code status} para un lote de referencias. No-op si la lista
     * esta vacia o el datasource no resuelve.
     */
    public void updateStatus(String connectionRef,
                             String table,
                             Collection<String> sendersReferences,
                             String status) {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return;
        }
        var dataSource = resolveDataSource(connectionRef);
        if (dataSource == null) {
            return;
        }
        var safeTable = sanitize(table == null || table.isBlank() ? DEFAULT_TABLE : table);
        var sql = "update " + safeTable
                + " set status = ?, updated_at = current_timestamp where senders_reference = ?";
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var reference : sendersReferences) {
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                statement.setString(1, status);
                statement.setString(2, reference);
                statement.addBatch();
            }
            statement.executeBatch();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot sync mt101_archive status to " + status, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String sanitize(String identifier) {
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe archive table identifier: " + identifier);
        }
        return identifier;
    }
}
