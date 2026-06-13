package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101ArchiveStatusRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Servicio de dominio para avanzar el estado durable en {@code mt101_archive}.
 * Los providers orquestan; el SQL vive en {@link Mt101ArchiveStatusRepository}.
 *
 * <pre>
 *   MT101_ARCHIVE  -> ARCHIVED   (insert directo)
 *   MT101_PAY      -> SENT / REJECTED
 *   MT101_STATUS   -> CONFIRMED / REJECTED
 *   MT101_RECONCILE-> RECONCILED / UNMATCHED
 * </pre>
 *
 * <p>Antes, {@code mt101_archive.status} quedaba en {@code COMPOSED} para
 * siempre aunque el fragmento ya estuviera SENT. El lifecycle de
 * {@code mt101_build_fragment} (flujo masivo) ya estaba sincronizado; este
 * servicio cierra el mismo gap en la tabla de archivo.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-017
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ArchiveStatusUpdater {

    public static final String DEFAULT_TABLE = "mt101_archive";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ArchiveStatusRepository repository;

    @Inject
    public Mt101ArchiveStatusUpdater(DataSource defaultDataSource,
                                     ConnectionPoolManager connectionPoolManager,
                                     Mt101ArchiveStatusRepository repository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
    }

    public Mt101ArchiveStatusUpdater(DataSource defaultDataSource,
                                     ConnectionPoolManager connectionPoolManager) {
        this(defaultDataSource, connectionPoolManager, new Mt101ArchiveStatusRepository());
    }

    /** Constructor de test con datasource directo. */
    public Mt101ArchiveStatusUpdater(DataSource defaultDataSource) {
        this(defaultDataSource, null);
    }

    public void updateStatusTargets(String connectionRef,
                                    String table,
                                    Collection<StatusTarget> targets,
                                    String status) {
        if (targets == null || targets.isEmpty()) {
            return;
        }
        var dataSource = resolveDataSource(connectionRef);
        if (dataSource == null) {
            return;
        }
        try {
            repository.updateStatusTargets(dataSource, tableName(table), repositoryTargets(targets), status);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot sync mt101_archive status to " + status, error);
        }
    }

    public void updateStatusByArchiveIds(String connectionRef,
                                         String table,
                                         Collection<Long> archiveIds,
                                         String status) {
        if (archiveIds == null || archiveIds.isEmpty()) {
            return;
        }
        var dataSource = resolveDataSource(connectionRef);
        if (dataSource == null) {
            return;
        }
        try (Connection connection = dataSource.getConnection()) {
            repository.updateStatusByArchiveIds(connection, tableName(table), archiveIds, status);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot sync mt101_archive status to " + status, error);
        }
    }

    public void updateArchiveStatus(Connection connection,
                                    String table,
                                    Collection<ArchiveStatusUpdate> updates) throws SQLException {
        repository.updateArchiveStatus(connection, tableName(table), repositoryUpdates(updates));
    }

    public void markReconciled(Connection connection,
                               String sentTable,
                               String confirmationTable,
                               List<JoinSpec> matchKeys,
                               LocalDate from,
                               LocalDate to) throws SQLException {
        repository.markReconciled(connection, tableName(sentTable), requiredTable(confirmationTable),
                repositoryJoinSpecs(matchKeys), from, to);
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String tableName(String table) {
        return table == null || table.isBlank() ? DEFAULT_TABLE : table;
    }

    private String requiredTable(String table) {
        if (table == null || table.isBlank()) {
            throw new IllegalArgumentException("Archive table identifier cannot be blank");
        }
        return table;
    }

    private List<Mt101ArchiveStatusRepository.StatusTarget> repositoryTargets(
            Collection<StatusTarget> targets) {
        var result = new ArrayList<Mt101ArchiveStatusRepository.StatusTarget>(targets.size());
        for (var target : targets) {
            if (target == null) {
                continue;
            }
            result.add(new Mt101ArchiveStatusRepository.StatusTarget(
                    target.sendersReference(),
                    target.requestedExecutionDate(),
                    target.senderLt()));
        }
        return result;
    }

    private List<Mt101ArchiveStatusRepository.ArchiveStatusUpdate> repositoryUpdates(
            Collection<ArchiveStatusUpdate> updates) {
        if (updates == null || updates.isEmpty()) {
            return List.of();
        }
        var result = new ArrayList<Mt101ArchiveStatusRepository.ArchiveStatusUpdate>(updates.size());
        for (var update : updates) {
            if (update == null) {
                continue;
            }
            result.add(new Mt101ArchiveStatusRepository.ArchiveStatusUpdate(update.archiveId(), update.status()));
        }
        return result;
    }

    private List<Mt101ArchiveStatusRepository.JoinSpec> repositoryJoinSpecs(List<JoinSpec> matchKeys) {
        if (matchKeys == null || matchKeys.isEmpty()) {
            return List.of();
        }
        var result = new ArrayList<Mt101ArchiveStatusRepository.JoinSpec>(matchKeys.size());
        for (var matchKey : matchKeys) {
            if (matchKey == null) {
                continue;
            }
            result.add(new Mt101ArchiveStatusRepository.JoinSpec(
                    matchKey.leftColumn(),
                    matchKey.rightColumn()));
        }
        return result;
    }

    public record StatusTarget(String sendersReference,
                               LocalDate requestedExecutionDate,
                               String senderLt) {
    }

    public record ArchiveStatusUpdate(Long archiveId, String status) {
    }

    public record JoinSpec(String leftColumn, String rightColumn) {
    }
}
