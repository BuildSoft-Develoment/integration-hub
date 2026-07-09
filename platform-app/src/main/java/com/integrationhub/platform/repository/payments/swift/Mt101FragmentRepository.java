package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Repository JDBC de fragmentos masivos MT101. */
@ApplicationScoped
public class Mt101FragmentRepository {

    public void deleteFragmentSet(DataSource dataSource, String fragmentSetId) throws SQLException {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "delete from mt101_build_fragment where fragment_set_id = ?")) {
            statement.setString(1, fragmentSetId);
            statement.executeUpdate();
        }
    }

    public void insertFragments(DataSource dataSource, List<FragmentRow> fragments) throws SQLException {
        if (fragments == null || fragments.isEmpty()) {
            return;
        }
        // source_row_from/to se mantiene = id de staging por compatibilidad con el
        // indice/lectura historicos; staging_id_* y source_record_* (fila 1-based)
        // son las claves nuevas separadas que usa el lookup por fila del archivo.
        var sql = "insert into mt101_build_fragment "
                + "(fragment_set_id, process_execution_id, task_definition_id, source_table, "
                + " source_row_from, source_row_to, staging_id_from, staging_id_to, "
                + " source_record_from, source_record_to, source_file_hash, source_records_json, "
                + " fragment_index, fragment_total, senders_reference, payload_hash, raw_payload, message_json, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (var fragment : fragments) {
                statement.setString(1, fragment.fragmentSetId());
                if (fragment.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, fragment.processExecutionId());
                if (fragment.taskDefinitionId() == null) statement.setNull(3, Types.BIGINT);
                else statement.setLong(3, fragment.taskDefinitionId());
                statement.setString(4, fragment.sourceTable());
                statement.setLong(5, fragment.stagingIdFrom());
                statement.setLong(6, fragment.stagingIdTo());
                statement.setLong(7, fragment.stagingIdFrom());
                statement.setLong(8, fragment.stagingIdTo());
                statement.setLong(9, fragment.sourceRecordFrom());
                statement.setLong(10, fragment.sourceRecordTo());
                statement.setString(11, fragment.sourceFileHash());
                statement.setString(12, fragment.sourceRecordsJson());
                statement.setInt(13, fragment.fragmentIndex());
                statement.setInt(14, fragment.fragmentTotal());
                statement.setString(15, fragment.sendersReference());
                statement.setString(16, fragment.payloadHash());
                statement.setString(17, fragment.rawPayload());
                statement.setString(18, fragment.messageJson());
                statement.setString(19, "BUILT");
                statement.addBatch();
            }
            statement.executeBatch();
            var fragmentIds = new ArrayList<Long>(fragments.size());
            try (var keys = statement.getGeneratedKeys()) {
                while (keys.next()) {
                    fragmentIds.add(keys.getLong(1));
                }
            }
            if (fragmentIds.size() != fragments.size()) {
                throw new SQLException("Cannot resolve generated ids for MT101 fragment lineage: expected "
                        + fragments.size() + " keys but got " + fragmentIds.size());
            }
            insertFragmentRecords(connection, fragments, fragmentIds);
        }
    }

    private void insertFragmentRecords(java.sql.Connection connection,
                                       List<FragmentRow> fragments,
                                       List<Long> fragmentIds) throws SQLException {
        var hasSourceRecords = false;
        for (var fragment : fragments) {
            if (fragment.sourceRecords() != null && !fragment.sourceRecords().isEmpty()) {
                hasSourceRecords = true;
                break;
            }
        }
        if (!hasSourceRecords) {
            return;
        }
        var sql = "insert into mt101_fragment_record "
                + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, "
                + " original_senders_reference, original_transaction_reference, "
                + " current_senders_reference, current_transaction_reference) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "on conflict do nothing";
        try (var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < fragments.size(); i++) {
                var fragment = fragments.get(i);
                if (fragment.sourceRecords() == null || fragment.sourceRecords().isEmpty()) {
                    continue;
                }
                for (var entry : fragment.sourceRecords().entrySet()) {
                    if (entry.getKey() == null || entry.getKey().isBlank() || entry.getValue() == null) {
                        continue;
                    }
                    statement.setLong(1, fragmentIds.get(i));
                    statement.setString(2, fragment.fragmentSetId());
                    statement.setString(3, fragment.sourceFileHash());
                    statement.setLong(4, entry.getValue());
                    var stagingId = fragment.stagingIdsBySourceRecord() == null
                            ? null
                            : fragment.stagingIdsBySourceRecord().get(entry.getValue());
                    if (stagingId == null) {
                        statement.setNull(5, Types.BIGINT);
                    } else {
                        statement.setLong(5, stagingId);
                    }
                    statement.setString(6, fragment.sendersReference());
                    statement.setString(7, entry.getKey());
                    statement.setString(8, fragment.sendersReference());
                    statement.setString(9, entry.getKey());
                    statement.addBatch();
                }
            }
            statement.executeBatch();
        }
        // B3': rellena el origen (tarea DB_WRITE + nombre de archivo) desde staging por staging_id,
        // para desambiguar dos archivos del mismo hash y distinta ubicacion.
        var fragmentSetId = fragments.isEmpty() ? null : fragments.get(0).fragmentSetId();
        if (fragmentSetId != null) {
            fillSourceIdentity(connection, fragmentSetId);
        }
    }

    private void fillSourceIdentity(java.sql.Connection connection, String fragmentSetId) throws SQLException {
        var sql = "update mt101_fragment_record fr "
                + "set source_task_definition_id = s.task_definition_id, source_name = s.source_name "
                + "from staging_record s "
                + "where fr.staging_id = s.id and fr.fragment_set_id = ? and fr.source_task_definition_id is null";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.executeUpdate();
        }
    }

    public List<MessageJsonRow> readPage(DataSource dataSource,
                                         String fragmentSetId,
                                         List<String> statuses,
                                         int afterIndex,
                                         int pageSize) throws SQLException {
        var sql = "select fragment_index, message_json from mt101_build_fragment where fragment_set_id = ?"
                + (statuses == null || statuses.isEmpty() ? "" : " and status in (" + placeholders(statuses.size()) + ")")
                + " and fragment_index > ?"
                + " order by fragment_index asc limit ?";
        var page = new ArrayList<MessageJsonRow>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            if (statuses != null) {
                for (var status : statuses) {
                    statement.setString(parameter++, status);
                }
            }
            statement.setInt(parameter++, afterIndex);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    page.add(new MessageJsonRow(rs.getInt(1), rs.getString(2)));
                }
            }
        }
        return page;
    }

    /**
     * v52-fix (resolucion del UNCERTAIN normal): lee, de forma DURABLE y paginada por {@code fragment_index}, los
     * fragmentos de un set en un estado no resuelto por PAY ({@code statuses}, normalmente
     * {@code ['UNCERTAIN','DISPATCHING']}), con la forma de registro que consume {@code MT101_STATUS}:
     * {@code sendersReference} (:20: para la plantilla de consulta al gateway) + {@code route} ({@code routed_as}).
     * Es el analogo NORMAL de {@code correctivePayStatusRecords} (que lee el ledger correctivo): da al resolver una
     * FUENTE durable de que consultar al gateway, en vez del hand-off in-memory (solo SENT) del pipeline.
     */
    public List<Map<String, Object>> unresolvedPayStatusRecords(DataSource dataSource,
                                                                String fragmentSetId,
                                                                List<String> statuses,
                                                                int afterIndex,
                                                                int pageSize) throws SQLException {
        var effectiveStatuses = statuses == null || statuses.isEmpty() ? List.of("UNCERTAIN", "DISPATCHING") : statuses;
        // v57-fix: archive_id por SUBCONSULTA ESCALAR (max(a.id)) — NO un join: el indice V36
        // (senders_reference, process_execution_id) NO es unico, y un join podria multiplicar filas de fragmento
        // (=> doble consulta/transicion). La subconsulta devuelve exactamente un valor por fragmento (o null).
        var sql = "select f.fragment_index, f.senders_reference, f.routed_as, "
                + "(select max(a.id) from mt101_archive a where a.senders_reference = f.senders_reference "
                + "and a.process_execution_id = f.process_execution_id) as archive_id "
                + "from mt101_build_fragment f "
                + "where f.fragment_set_id = ? and f.status in (" + placeholders(effectiveStatuses.size()) + ") "
                + "and f.fragment_index > ? order by f.fragment_index asc limit ?";
        var page = new ArrayList<Map<String, Object>>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var status : effectiveStatuses) {
                statement.setString(parameter++, status);
            }
            statement.setInt(parameter++, afterIndex);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var record = new LinkedHashMap<String, Object>();
                    record.put("fragmentIndex", rs.getInt("fragment_index"));
                    record.put("sendersReference", rs.getString("senders_reference"));
                    record.put("route", rs.getString("routed_as"));
                    var archiveId = rs.getLong("archive_id");
                    if (!rs.wasNull()) {
                        record.put("archiveId", archiveId);
                    }
                    page.add(record);
                }
            }
        }
        return page;
    }

    /**
     * v54-fix (cierre de NEEDS_RECONCILIATION): resumen de terminalidad de los fragmentos de una EJECUCION
     * (por {@code process_execution_id}). {@code nonTerminal} = fragmentos que NO alcanzaron un terminal de despacho
     * ({@code SENT/CONFIRMED/RECONCILED/REJECTED/SUPERSEDED}) — incluye ARCHIVED sin enviar, UNCERTAIN/DISPATCHING sin
     * resolver, etc. El cierre solo procede si {@code nonTerminal == 0} (nunca cerrar como completado con pagos
     * pendientes). {@code rejected} decide COMPLETED vs COMPLETED_WITH_ERRORS.
     */
    public ReconciliationSummary reconciliationSummary(DataSource dataSource, Long processExecutionId)
            throws SQLException {
        var sql = "select count(*) as total, "
                + "count(*) filter (where status not in "
                + "('SENT','CONFIRMED','RECONCILED','REJECTED','SUPERSEDED')) as non_terminal, "
                + "count(*) filter (where status = 'REJECTED') as rejected "
                + "from mt101_build_fragment where process_execution_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, processExecutionId);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return new ReconciliationSummary(rs.getLong("total"), rs.getLong("non_terminal"),
                        rs.getLong("rejected"));
            }
        }
    }

    public record ReconciliationSummary(long total, long nonTerminal, long rejected) {
    }

    public List<RoutedMessageJsonRow> readRoutedPage(DataSource dataSource,
                                                     String fragmentSetId,
                                                     List<String> statuses,
                                                     int afterIndex,
                                                     int pageSize) throws SQLException {
        var sql = "select fragment_index, message_json, routed_as, route_error "
                + "from mt101_build_fragment where fragment_set_id = ?"
                + (statuses == null || statuses.isEmpty() ? "" : " and status in (" + placeholders(statuses.size()) + ")")
                + " and fragment_index > ?"
                + " order by fragment_index asc limit ?";
        var page = new ArrayList<RoutedMessageJsonRow>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            if (statuses != null) {
                for (var status : statuses) {
                    statement.setString(parameter++, status);
                }
            }
            statement.setInt(parameter++, afterIndex);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    page.add(new RoutedMessageJsonRow(rs.getInt(1), rs.getString(2),
                            rs.getString(3), rs.getString(4)));
                }
            }
        }
        return page;
    }

    /**
     * v51-fix (PAY normal durable): claim ATOMICO pre-envio de una pagina de fragmentos no-correctivos.
     * Transiciona {@code -> DISPATCHING} SOLO los que sigan en uno de los estados legibles por PAY
     * ({@code fromStatuses}: por defecto {@code ARCHIVED}; o el override {@code fragmentSource.statuses}, p.ej.
     * {@code REJECTED} en un reproceso explicito), en un UPDATE con {@code RETURNING} (una vuelta a BD), y devuelve
     * el conjunto realmente reclamado. Un fragmento que otro worker ya reclamo/envio, o que ya salio de esos
     * estados, NO se reclama -> el provider no lo despacha (sin doble envio). Como PAY solo lee {@code fromStatuses},
     * un fragmento en {@code DISPATCHING} (p.ej. si el worker cae tras enviar y antes de marcar terminal) queda
     * EXCLUIDO de una nueva seleccion: exige conciliacion, nunca reenvio automatico.
     */
    public java.util.Set<String> claimForDispatch(DataSource dataSource,
                                                  String fragmentSetId,
                                                  Collection<String> sendersReferences,
                                                  List<String> fromStatuses) throws SQLException {
        var refs = new ArrayList<String>();
        if (sendersReferences != null) {
            for (var reference : sendersReferences) {
                if (reference != null && !reference.isBlank()) {
                    refs.add(reference);
                }
            }
        }
        if (refs.isEmpty() || fromStatuses == null || fromStatuses.isEmpty()) {
            return java.util.Set.of();
        }
        var sql = "update mt101_build_fragment set status = 'DISPATCHING', updated_at = current_timestamp "
                + "where fragment_set_id = ? and status in (" + placeholders(fromStatuses.size()) + ") "
                + "and senders_reference in (" + placeholders(refs.size()) + ") returning senders_reference";
        var claimed = new java.util.LinkedHashSet<String>(refs.size());
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var status : fromStatuses) {
                statement.setString(parameter++, status);
            }
            for (var reference : refs) {
                statement.setString(parameter++, reference);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    claimed.add(rs.getString(1));
                }
            }
        }
        return claimed;
    }

    /**
     * P0-1 (A, Modelo B): registros de fragmentos en {@code statuses} (p.ej. {@code SENT}) que aún NO están en
     * conflicto ({@code pay_conflict=false}), para re-consultar STATUS y detectar una contradicción terminal tardía
     * (un {@code SENT} que el banco luego rechaza). El filtro {@code pay_conflict=false} lo hace idempotente: un
     * fragmento ya marcado en conflicto no se re-procesa ni re-audita. Misma forma de registro que
     * {@link #unresolvedPayStatusRecords} (para reusar el {@code Mt101StatusQueryExecutor}).
     */
    public List<Map<String, Object>> unconflictedPayStatusRecords(DataSource dataSource,
                                                                  String fragmentSetId,
                                                                  List<String> statuses,
                                                                  int afterIndex,
                                                                  int pageSize) throws SQLException {
        var effectiveStatuses = statuses == null || statuses.isEmpty() ? List.of("SENT") : statuses;
        var sql = "select f.fragment_index, f.senders_reference, f.routed_as, "
                + "(select max(a.id) from mt101_archive a where a.senders_reference = f.senders_reference "
                + "and a.process_execution_id = f.process_execution_id) as archive_id "
                + "from mt101_build_fragment f "
                + "where f.fragment_set_id = ? and f.status in (" + placeholders(effectiveStatuses.size()) + ") "
                + "and coalesce(f.pay_conflict, false) = false "
                + "and f.fragment_index > ? order by f.fragment_index asc limit ?";
        var page = new ArrayList<Map<String, Object>>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var status : effectiveStatuses) {
                statement.setString(parameter++, status);
            }
            statement.setInt(parameter++, afterIndex);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var record = new LinkedHashMap<String, Object>();
                    record.put("fragmentIndex", rs.getInt("fragment_index"));
                    record.put("sendersReference", rs.getString("senders_reference"));
                    record.put("route", rs.getString("routed_as"));
                    var archiveId = rs.getLong("archive_id");
                    if (!rs.wasNull()) {
                        record.put("archiveId", archiveId);
                    }
                    page.add(record);
                }
            }
        }
        return page;
    }

    /**
     * v52-fix (resolucion del UNCERTAIN normal): transiciona CONDICIONALMENTE los fragmentos indicados de
     * CUALQUIERA de {@code fromStatuses} (p.ej. {@code UNCERTAIN}/{@code DISPATCHING}) a {@code toStatus}
     * ({@code SENT}/{@code REJECTED} segun el gateway), en un solo UPDATE por conjunto de refs. Solo cambia lo que
     * sigue en un estado no resuelto: nunca pisa un terminal ni reenvia (STATUS solo consulta, no despacha).
     * Devuelve cuantos cambiaron.
     */
    public int resolvePayStatus(DataSource dataSource,
                                String fragmentSetId,
                                Collection<String> sendersReferences,
                                List<String> fromStatuses,
                                String toStatus,
                                String errorMessage) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return resolvePayStatus(connection, fragmentSetId, sendersReferences, fromStatuses, toStatus, errorMessage);
        }
    }

    /**
     * P1 (atomicidad): variante por {@code Connection} para transicionar el pay_status DENTRO de una transacción
     * compartida con la inserción de la confirmación (misma conexión, un solo commit). Evita el estado inconsistente
     * "fragmento resuelto sin evidencia" si la confirmation fallara tras el update en autocommit separado.
     */
    public int resolvePayStatus(java.sql.Connection connection,
                                String fragmentSetId,
                                Collection<String> sendersReferences,
                                List<String> fromStatuses,
                                String toStatus,
                                String errorMessage) throws SQLException {
        var refs = new ArrayList<String>();
        if (sendersReferences != null) {
            for (var reference : sendersReferences) {
                if (reference != null && !reference.isBlank()) {
                    refs.add(reference);
                }
            }
        }
        if (refs.isEmpty() || fromStatuses == null || fromStatuses.isEmpty()) {
            return 0;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status in (" + placeholders(fromStatuses.size()) + ") "
                + "and senders_reference in (" + placeholders(refs.size()) + ")";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, toStatus);
            statement.setString(parameter++, errorMessage);
            statement.setString(parameter++, fragmentSetId);
            for (var status : fromStatuses) {
                statement.setString(parameter++, status);
            }
            for (var reference : refs) {
                statement.setString(parameter++, reference);
            }
            return statement.executeUpdate();
        }
    }

    /**
     * P0-1 (PAY normal): transición terminal GUARDADA con {@code RETURNING}: como {@link #resolvePayStatus} pero
     * devuelve el conjunto de {@code senders_reference} que REALMENTE transicionó (solo los que estaban en
     * {@code fromStatuses}). Los que faltan quedaron en un terminal contradictorio → conflicto (el caller los
     * marca {@code pay_conflict} y NO los sobrescribe). Evita la sobrescritura silenciosa REJECTED→SENT.
     */
    public java.util.Set<String> resolvePayStatusReturning(DataSource dataSource,
                                                           String fragmentSetId,
                                                           Collection<String> sendersReferences,
                                                           List<String> fromStatuses,
                                                           String toStatus,
                                                           String errorMessage) throws SQLException {
        var refs = new ArrayList<String>();
        if (sendersReferences != null) {
            for (var reference : sendersReferences) {
                if (reference != null && !reference.isBlank()) {
                    refs.add(reference);
                }
            }
        }
        var updated = new java.util.LinkedHashSet<String>();
        if (refs.isEmpty() || fromStatuses == null || fromStatuses.isEmpty()) {
            return updated;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status in (" + placeholders(fromStatuses.size()) + ") "
                + "and senders_reference in (" + placeholders(refs.size()) + ") returning senders_reference";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, toStatus);
            statement.setString(parameter++, errorMessage);
            statement.setString(parameter++, fragmentSetId);
            for (var status : fromStatuses) {
                statement.setString(parameter++, status);
            }
            for (var reference : refs) {
                statement.setString(parameter++, reference);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    updated.add(rs.getString("senders_reference"));
                }
            }
        }
        return updated;
    }

    /**
     * P0-1 (PAY normal, REJECTED con error por ref): transición terminal GUARDADA per-ref (preserva el
     * {@code error_message} de cada fragmento) que devuelve los refs que realmente transicionaron desde
     * {@code fromStatuses}. Los ausentes quedaron en un terminal contradictorio → conflicto.
     */
    public java.util.Set<String> resolvePayStatusReturning(DataSource dataSource,
                                                           String fragmentSetId,
                                                           Map<String, String> errorBySendersReference,
                                                           List<String> fromStatuses,
                                                           String toStatus) throws SQLException {
        var updated = new java.util.LinkedHashSet<String>();
        if (errorBySendersReference == null || errorBySendersReference.isEmpty()
                || fromStatuses == null || fromStatuses.isEmpty()) {
            return updated;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status in (" + placeholders(fromStatuses.size()) + ") "
                + "and senders_reference = ? returning senders_reference";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var entry : errorBySendersReference.entrySet()) {
                if (entry.getKey() == null || entry.getKey().isBlank()) {
                    continue;
                }
                var parameter = 1;
                statement.setString(parameter++, toStatus);
                statement.setString(parameter++, entry.getValue());
                statement.setString(parameter++, fragmentSetId);
                for (var status : fromStatuses) {
                    statement.setString(parameter++, status);
                }
                statement.setString(parameter, entry.getKey());
                try (var rs = statement.executeQuery()) {
                    if (rs.next()) {
                        updated.add(rs.getString("senders_reference"));
                    }
                }
            }
        }
        return updated;
    }

    /**
     * P0-1: marca {@code pay_conflict} (durable, sin tocar el status real) los fragmentos cuyo terminal entrante
     * contradijo el ya resuelto. NO sobrescribe pay_status: un lector operativo ve el conflicto y se resuelve por
     * STATUS/RECONCILE. Espejo de la marca del ledger correctivo (V58) sobre el fragmento normal.
     */
    public void markPayConflict(DataSource dataSource, String fragmentSetId,
                                Collection<String> sendersReferences, String reason) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            markPayConflict(connection, fragmentSetId, sendersReferences, reason);
        }
    }

    /** P1 (atomicidad): variante por {@code Connection} para marcar pay_conflict + confirmación en una sola tx. */
    public void markPayConflict(java.sql.Connection connection, String fragmentSetId,
                                Collection<String> sendersReferences, String reason) throws SQLException {
        var refs = new ArrayList<String>();
        if (sendersReferences != null) {
            for (var reference : sendersReferences) {
                if (reference != null && !reference.isBlank()) {
                    refs.add(reference);
                }
            }
        }
        if (refs.isEmpty()) {
            return;
        }
        var sql = "update mt101_build_fragment set pay_conflict = true, pay_conflict_reason = ?, "
                + "updated_at = current_timestamp where fragment_set_id = ? and senders_reference in ("
                + placeholders(refs.size()) + ")";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, reason);
            statement.setString(parameter++, fragmentSetId);
            for (var reference : refs) {
                statement.setString(parameter++, reference);
            }
            statement.executeUpdate();
        }
    }

    /**
     * P0-1 (simetría terminal): estado {@code status} actual de un conjunto de refs. Se usa para clasificar un
     * resultado terminal que NO transicionó desde {@code DISPATCHING/UNCERTAIN}: si el estado actual coincide con
     * el terminal entrante es idempotente ({@code SAME_TERMINAL}, sin conflicto — evita el falso positivo); si es
     * OTRO terminal es una contradicción real ({@code CONFLICT}) que debe marcar {@code pay_conflict} y auditar.
     */
    public Map<String, String> payStatusesFor(DataSource dataSource, String fragmentSetId,
                                               Collection<String> sendersReferences) throws SQLException {
        var refs = new ArrayList<String>();
        if (sendersReferences != null) {
            for (var reference : sendersReferences) {
                if (reference != null && !reference.isBlank()) {
                    refs.add(reference);
                }
            }
        }
        var statuses = new java.util.LinkedHashMap<String, String>();
        if (refs.isEmpty()) {
            return statuses;
        }
        var sql = "select senders_reference, status from mt101_build_fragment where fragment_set_id = ? "
                + "and senders_reference in (" + placeholders(refs.size()) + ")";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var reference : refs) {
                statement.setString(parameter++, reference);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    statuses.put(rs.getString("senders_reference"), rs.getString("status"));
                }
            }
        }
        return statuses;
    }

    public void updateStatusBatch(DataSource dataSource,
                                  String fragmentSetId,
                                  Map<String, String> errorBySendersReference,
                                  String status) throws SQLException {
        if (errorBySendersReference == null || errorBySendersReference.isEmpty()) {
            return;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and senders_reference = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var entry : errorBySendersReference.entrySet()) {
                if (entry.getKey() == null || entry.getKey().isBlank()) {
                    continue;
                }
                statement.setString(1, status);
                statement.setString(2, entry.getValue());
                statement.setString(3, fragmentSetId);
                statement.setString(4, entry.getKey());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    /**
     * Localiza fragmentos por identidad exacta de fila: hash del archivo + fila 1-based.
     * El contrato operativo usa {@code mt101_fragment_record}; no cae a rangos del
     * fragmento padre porque eso vuelve ambigua la trazabilidad multiarchivo.
     */
    public List<FragmentLookupRow> findBySourceRecord(DataSource dataSource,
                                                      Long recordNumber,
                                                      String sourceFileHash,
                                                      String sourceTable,
                                                      Long processExecutionId,
                                                      String fragmentSetId,
                                                      int limit) throws SQLException {
        var sql = new StringBuilder("""
                select f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.source_file_hash = ?
                   and r.source_record_number = ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(sourceFileHash);
        parameters.add(recordNumber);
        if (sourceTable != null && !sourceTable.isBlank()) {
            sql.append(" and f.source_table = ?");
            parameters.add(sourceTable);
        }
        if (processExecutionId != null) {
            sql.append(" and f.process_execution_id = ?");
            parameters.add(processExecutionId);
        }
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and r.fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by f.created_at desc, f.fragment_index asc limit ?");
        parameters.add(Math.max(limit, 1));

        var result = new ArrayList<FragmentLookupRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setObject(i + 1, parameters.get(i));
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FragmentLookupRow(
                            rs.getString("fragment_set_id"),
                            nullableLong(rs, "process_execution_id"),
                            nullableLong(rs, "task_definition_id"),
                            rs.getString("source_table"),
                            rs.getLong("staging_id_from"),
                            rs.getLong("staging_id_to"),
                            nullableLong(rs, "source_record_from"),
                            nullableLong(rs, "source_record_to"),
                            rs.getString("source_file_hash"),
                            rs.getInt("fragment_index"),
                            rs.getInt("fragment_total"),
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("error_message"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "updated_at")));
                }
            }
        }
        return result;
    }

    /**
     * Fragmentos con al menos una fila exacta dentro de [recordFrom, recordTo] para
     * un archivo concreto. Se apoya en {@code mt101_fragment_record}; no usa rangos
     * del padre como fallback.
     */
    public List<FragmentLookupRow> findBySourceRowRange(DataSource dataSource,
                                                        long recordFrom,
                                                        long recordTo,
                                                        String sourceFileHash,
                                                        String fragmentSetId,
                                                        int limit) throws SQLException {
        var sql = new StringBuilder("""
                select distinct f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.source_file_hash = ?
                   and r.source_record_number >= ?
                   and r.source_record_number <= ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(sourceFileHash);
        parameters.add(recordFrom);
        parameters.add(recordTo);
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and r.fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by f.source_record_from asc, f.fragment_index asc limit ?");
        parameters.add(Math.max(limit, 1));

        var result = new ArrayList<FragmentLookupRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setObject(i + 1, parameters.get(i));
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FragmentLookupRow(
                            rs.getString("fragment_set_id"),
                            nullableLong(rs, "process_execution_id"),
                            nullableLong(rs, "task_definition_id"),
                            rs.getString("source_table"),
                            rs.getLong("staging_id_from"),
                            rs.getLong("staging_id_to"),
                            nullableLong(rs, "source_record_from"),
                            nullableLong(rs, "source_record_to"),
                            rs.getString("source_file_hash"),
                            rs.getInt("fragment_index"),
                            rs.getInt("fragment_total"),
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("error_message"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "updated_at")));
                }
            }
        }
        return result;
    }

    /** Correctivo que reemplaza una fila original exacta dentro de un fragment set. */
    public FragmentLookupRow findCorrectiveByOriginalSourceRecord(DataSource dataSource,
                                                                  String originalFragmentSetId,
                                                                  String sourceFileHash,
                                                                  long sourceRecordNumber,
                                                                  long stagingId) throws SQLException {
        var sql = """
                select f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.original_fragment_set_id = ?
                   and r.source_file_hash = ?
                   and r.source_record_number = ?
                   and r.staging_id = ?
                   and r.rebuild_run_id is not null
                 order by f.created_at desc, f.fragment_index asc
                 limit 1
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            statement.setString(2, sourceFileHash);
            statement.setLong(3, sourceRecordNumber);
            statement.setLong(4, stagingId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new FragmentLookupRow(
                        rs.getString("fragment_set_id"),
                        nullableLong(rs, "process_execution_id"),
                        nullableLong(rs, "task_definition_id"),
                        rs.getString("source_table"),
                        rs.getLong("staging_id_from"),
                        rs.getLong("staging_id_to"),
                        nullableLong(rs, "source_record_from"),
                        nullableLong(rs, "source_record_to"),
                        rs.getString("source_file_hash"),
                        rs.getInt("fragment_index"),
                        rs.getInt("fragment_total"),
                        rs.getString("senders_reference"),
                        rs.getString("status"),
                        rs.getString("error_message"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "updated_at"));
            }
        }
    }

    /**
     * Transiciona en bloque los fragmentos de un set que estan en {@code fromStatus}
     * hacia {@code toStatus} (p.ej. REJECTED -> BUILT para revalidar). Limpia
     * {@code error_message} al resetear. Devuelve cuantos fragmentos cambiaron.
     */
    public int resetStatus(DataSource dataSource,
                           String fragmentSetId,
                           String fromStatus,
                           String toStatus) throws SQLException {
        var sql = "update mt101_build_fragment set status = ?, error_message = null, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setString(2, fragmentSetId);
            statement.setString(3, fromStatus);
            return statement.executeUpdate();
        }
    }

    /**
     * B3: transicion condicional por referencia (cada fragmento solo cambia si su estado
     * actual sigue siendo el esperado). Evita pisar un fragmento que un PAY concurrente
     * llevo a SENT entre la lectura y la escritura. Connection-scoped para auditar atomico.
     *
     * @return cuantos fragmentos cambiaron realmente (debe ser == esperado, si no abortar).
     */
    public int transitionStatusConditional(java.sql.Connection connection,
                                           String fragmentSetId,
                                           Map<String, String> expectedStatusByReference,
                                           String toStatus) throws SQLException {
        if (expectedStatusByReference == null || expectedStatusByReference.isEmpty()) {
            return 0;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = null, updated_at = current_timestamp "
                + "where fragment_set_id = ? and senders_reference = ? and status = ?";
        var updated = 0;
        try (var statement = connection.prepareStatement(sql)) {
            for (var entry : expectedStatusByReference.entrySet()) {
                if (entry.getKey() == null || entry.getKey().isBlank() || entry.getValue() == null) {
                    continue;
                }
                statement.setString(1, toStatus);
                statement.setString(2, fragmentSetId);
                statement.setString(3, entry.getKey());
                statement.setString(4, entry.getValue());
                updated += statement.executeUpdate();
            }
        }
        return updated;
    }

    /** B4: reset condicional (from->to) en una conexion dada, para auditar en la misma transaccion. */
    public int resetStatus(java.sql.Connection connection,
                           String fragmentSetId,
                           String fromStatus,
                           String toStatus) throws SQLException {
        var sql = "update mt101_build_fragment set status = ?, error_message = null, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setString(2, fragmentSetId);
            statement.setString(3, fromStatus);
            return statement.executeUpdate();
        }
    }

    /** Metadata del set (de cualquier fragmento) para re-construir scoped a filas corregidas. */
    public SetMetadata findSetMetadata(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select process_execution_id, task_definition_id, source_table "
                + "from mt101_build_fragment where fragment_set_id = ? limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new SetMetadata(
                        nullableLong(rs, "process_execution_id"),
                        nullableLong(rs, "task_definition_id"),
                        rs.getString("source_table"));
            }
        }
    }

    public record SetMetadata(Long processExecutionId, Long taskDefinitionId, String sourceTable) {
    }

    /**
     * Resuelve la identidad del lote por fragmentSetId o por processExecutionId (lo
     * que el operador conoce tras correr el proceso). Devuelve null si no hay set.
     */
    public LoteRef loteRef(DataSource dataSource, String fragmentSetId, Long processExecutionId) throws SQLException {
        var bySet = fragmentSetId != null && !fragmentSetId.isBlank();
        var sql = "select fragment_set_id, process_execution_id, source_table, source_file_hash "
                + "from mt101_build_fragment where "
                + (bySet ? "fragment_set_id = ?" : "process_execution_id = ?")
                + " order by fragment_index asc limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            if (bySet) {
                statement.setString(1, fragmentSetId.trim());
            } else {
                statement.setLong(1, processExecutionId);
            }
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new LoteRef(rs.getString("fragment_set_id"), nullableLong(rs, "process_execution_id"),
                        rs.getString("source_table"), rs.getString("source_file_hash"));
            }
        }
    }

    public record LoteRef(String fragmentSetId, Long processExecutionId, String sourceTable, String sourceFileHash) {
    }

    /** Conteo de fragmentos por estado de un set (resumen del lote para la UI). */
    public List<StatusCount> statusCountsBySet(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select status, count(*) as total from mt101_build_fragment "
                + "where fragment_set_id = ? group by status order by status";
        var result = new ArrayList<StatusCount>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new StatusCount(rs.getString("status"), rs.getLong("total")));
                }
            }
        }
        return result;
    }

    public record StatusCount(String status, long count) {
    }

    /**
     * Item 3 (visibilidad): fragmentos en conflicto de pago ({@code pay_conflict=true}) de un set, con su motivo y
     * estado real (no sobrescrito). Los expone la API/UI para que un operador vea y concilie las contradicciones
     * terminales (worker↔STATUS) en vez de que queden solo como columna interna.
     */
    public List<PayConflictRow> conflictedFragments(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select senders_reference, status, pay_conflict_reason, updated_at from mt101_build_fragment "
                + "where fragment_set_id = ? and coalesce(pay_conflict, false) = true order by senders_reference";
        var result = new ArrayList<PayConflictRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var updatedAt = rs.getTimestamp("updated_at");
                    result.add(new PayConflictRow(
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("pay_conflict_reason"),
                            updatedAt == null ? null : updatedAt.toInstant().toString()));
                }
            }
        }
        return result;
    }

    /** Item 3: cuántos fragmentos de un set están en conflicto de pago (para el resumen). */
    public long payConflictCount(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select count(*) from mt101_build_fragment "
                + "where fragment_set_id = ? and coalesce(pay_conflict, false) = true";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        }
    }

    /** Fila de conflicto de pago para la API/UI (item 3). */
    public record PayConflictRow(String sendersReference, String status, String reason, String updatedAt) {
    }

    /**
     * Consola de PAY Conflicts: fila de conflicto de pago <b>transversal</b> (across sets/ejecuciones), con el set y la
     * ejecución que la produjeron para poder abrir la vista por-set (quarantine) y el lineage. {@code source} distingue
     * el ledger normal ({@code NORMAL}, {@code mt101_build_fragment}) del correctivo ({@code CORRECTIVE},
     * {@code mt101_corrective_pay_fragment}); para el correctivo {@code fragmentSetId} es el set ORIGINAL (join a
     * {@code mt101_rebuild_run}) para reusar el mismo deep-link, {@code processExecutionId} es null (es maker-checker,
     * no una ejecución) y {@code rebuildRunId} da el contexto del run.
     */
    public record OpenPayConflictRow(String source, String fragmentSetId, Long processExecutionId,
                                     String sendersReference, String status, String reason, String updatedAt,
                                     String rebuildRunId, long id) {
    }

    /**
     * Consola de PAY Conflicts (rama NORMAL): conflictos de pago ABIERTOS de {@code mt101_build_fragment}, más recientes
     * primero. Usa el índice parcial V94 {@code ix_build_fragment_pay_conflict_open} (O(conflictos), sin scan).
     * Paginación <b>keyset</b> por {@code (updated_at, id)}: {@code afterUpdatedAt} nulo trae la primera página; si no,
     * trae estrictamente las "más viejas" que el cursor en el orden {@code (updated_at desc, id desc)}.
     */
    public List<OpenPayConflictRow> openPayConflicts(DataSource dataSource, java.sql.Timestamp afterUpdatedAt,
                                                     Long afterId, int limit) throws SQLException {
        var sql = "select id, fragment_set_id, process_execution_id, senders_reference, status, pay_conflict_reason, "
                + "updated_at from mt101_build_fragment where pay_conflict = true "
                + "and (?::timestamp is null or (updated_at, id) < (?::timestamp, ?::bigint)) "
                + "order by updated_at desc, id desc limit ?";
        var result = new ArrayList<OpenPayConflictRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setTimestamp(1, afterUpdatedAt);
            statement.setTimestamp(2, afterUpdatedAt);
            statement.setObject(3, afterId);
            statement.setInt(4, Math.max(1, limit));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var updatedAt = rs.getTimestamp("updated_at");
                    result.add(new OpenPayConflictRow(
                            "NORMAL",
                            rs.getString("fragment_set_id"),
                            rs.getObject("process_execution_id", Long.class),
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("pay_conflict_reason"),
                            updatedAt == null ? null : updatedAt.toInstant().toString(),
                            null,
                            rs.getLong("id")));
                }
            }
        }
        return result;
    }

    /**
     * Consola de PAY Conflicts (rama CORRECTIVA): conflictos de pago ABIERTOS del ledger correctivo
     * ({@code mt101_corrective_pay_fragment}), más recientes primero. Une con {@code mt101_rebuild_run} para exponer el
     * {@code original_fragment_set_id} como {@code fragmentSetId} → mismo deep-link a quarantine que el normal. El
     * estado es {@code pay_status} y la referencia {@code corrective_senders_reference}. Usa el índice parcial V95
     * {@code ix_corrective_pay_fragment_conflict_open}. Mismo keyset por {@code (updated_at, id)} de la fila correctiva.
     */
    public List<OpenPayConflictRow> openCorrectivePayConflicts(DataSource dataSource, java.sql.Timestamp afterUpdatedAt,
                                                               Long afterId, int limit) throws SQLException {
        var sql = "select cpf.id, rr.original_fragment_set_id as fragment_set_id, "
                + "cpf.corrective_senders_reference as senders_reference, cpf.pay_status as status, "
                + "cpf.pay_conflict_reason, cpf.updated_at, cpf.rebuild_run_id "
                + "from mt101_corrective_pay_fragment cpf "
                + "join mt101_rebuild_run rr on rr.rebuild_run_id = cpf.rebuild_run_id "
                + "where cpf.pay_conflict = true "
                + "and (?::timestamp is null or (cpf.updated_at, cpf.id) < (?::timestamp, ?::bigint)) "
                + "order by cpf.updated_at desc, cpf.id desc limit ?";
        var result = new ArrayList<OpenPayConflictRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setTimestamp(1, afterUpdatedAt);
            statement.setTimestamp(2, afterUpdatedAt);
            statement.setObject(3, afterId);
            statement.setInt(4, Math.max(1, limit));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var updatedAt = rs.getTimestamp("updated_at");
                    result.add(new OpenPayConflictRow(
                            "CORRECTIVE",
                            rs.getString("fragment_set_id"),
                            null,
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("pay_conflict_reason"),
                            updatedAt == null ? null : updatedAt.toInstant().toString(),
                            rs.getString("rebuild_run_id"),
                            rs.getLong("id")));
                }
            }
        }
        return result;
    }

    public Map<TransactionKey, FragmentRecordLineage> fragmentRecordLineageByTransactions(
            DataSource dataSource,
            String fragmentSetId,
            Collection<TransactionKey> transactions) throws SQLException {
        if (transactions == null || transactions.isEmpty()) {
            return Map.of();
        }
        var keys = transactions.stream()
                .filter(key -> key != null
                        && key.sendersReference() != null && !key.sendersReference().isBlank()
                        && key.transactionReference() != null && !key.transactionReference().isBlank())
                .distinct()
                .toList();
        if (keys.isEmpty()) {
            return Map.of();
        }
        var sql = "select current_senders_reference, current_transaction_reference, source_file_hash, "
                + "source_record_number, staging_id, source_task_definition_id, source_name "
                + "from mt101_fragment_record "
                + "where fragment_set_id = ? and (current_senders_reference, current_transaction_reference) in ("
                + String.join(", ", java.util.Collections.nCopies(keys.size(), "(?, ?)")) + ")";
        var result = new LinkedHashMap<TransactionKey, FragmentRecordLineage>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var key : keys) {
                statement.setString(parameter++, key.sendersReference());
                statement.setString(parameter++, key.transactionReference());
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var key = new TransactionKey(
                            rs.getString("current_senders_reference"),
                            rs.getString("current_transaction_reference"));
                    result.put(key, new FragmentRecordLineage(
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            nullableLong(rs, "staging_id"),
                            nullableLong(rs, "source_task_definition_id"),
                            rs.getString("source_name")));
                }
            }
        }
        return result;
    }

    /** Lookup estricto por identidad de fila de origen: sin rango ni fallback por hash+fila. */
    public FragmentLookupRow findBySourceIdentity(DataSource dataSource,
                                                  String fragmentSetId,
                                                  String sourceFileHash,
                                                  long sourceRecordNumber,
                                                  long stagingId,
                                                  String sendersReference) throws SQLException {
        var sql = """
                select f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.fragment_set_id = ?
                   and r.source_file_hash = ?
                   and r.source_record_number = ?
                   and r.staging_id = ?
                   and (? is null or r.current_senders_reference = ?)
                 order by f.created_at desc, f.fragment_index asc
                 limit 1
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, sourceFileHash);
            statement.setLong(3, sourceRecordNumber);
            statement.setLong(4, stagingId);
            statement.setString(5, sendersReference);
            statement.setString(6, sendersReference);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new FragmentLookupRow(
                        rs.getString("fragment_set_id"),
                        nullableLong(rs, "process_execution_id"),
                        nullableLong(rs, "task_definition_id"),
                        rs.getString("source_table"),
                        rs.getLong("staging_id_from"),
                        rs.getLong("staging_id_to"),
                        nullableLong(rs, "source_record_from"),
                        nullableLong(rs, "source_record_to"),
                        rs.getString("source_file_hash"),
                        rs.getInt("fragment_index"),
                        rs.getInt("fragment_total"),
                        rs.getString("senders_reference"),
                        rs.getString("status"),
                        rs.getString("error_message"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "updated_at"));
            }
        }
    }

    public void updateRouteBatch(DataSource dataSource,
                                 String fragmentSetId,
                                 Map<String, String> routeBySendersReference,
                                 Map<String, String> errorBySendersReference) throws SQLException {
        if ((routeBySendersReference == null || routeBySendersReference.isEmpty())
                && (errorBySendersReference == null || errorBySendersReference.isEmpty())) {
            return;
        }
        var sql = "update mt101_build_fragment set routed_as = ?, route_error = ?, "
                + "routed_at = current_timestamp, updated_at = current_timestamp "
                + "where fragment_set_id = ? and senders_reference = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            if (routeBySendersReference != null) {
                for (var entry : routeBySendersReference.entrySet()) {
                    if (entry.getKey() == null || entry.getKey().isBlank()) {
                        continue;
                    }
                    statement.setString(1, entry.getValue());
                    statement.setString(2, null);
                    statement.setString(3, fragmentSetId);
                    statement.setString(4, entry.getKey());
                    statement.addBatch();
                }
            }
            if (errorBySendersReference != null) {
                for (var entry : errorBySendersReference.entrySet()) {
                    if (entry.getKey() == null || entry.getKey().isBlank()) {
                        continue;
                    }
                    statement.setString(1, null);
                    statement.setString(2, entry.getValue());
                    statement.setString(3, fragmentSetId);
                    statement.setString(4, entry.getKey());
                    statement.addBatch();
                }
            }
            statement.executeBatch();
        }
    }

    public record TransactionKey(String sendersReference, String transactionReference) {
    }

    public record FragmentRecordLineage(String sourceFileHash, Long sourceRecordNumber, Long stagingId,
                                        Long sourceTaskDefinitionId, String sourceName) {
    }

    /** Estado actual por {@code :20:} dentro de un set, usado antes de mutaciones correctivas. */
    public Map<String, String> statusesByReferences(DataSource dataSource,
                                                    String fragmentSetId,
                                                    Collection<String> sendersReferences) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return Map.of();
        }
        var sql = "select senders_reference, status from mt101_build_fragment "
                + "where fragment_set_id = ? and senders_reference in (" + placeholders(sendersReferences.size()) + ")";
        var result = new LinkedHashMap<String, String>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var reference : sendersReferences) {
                statement.setString(parameter++, reference);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.put(rs.getString("senders_reference"), rs.getString("status"));
                }
            }
        }
        return result;
    }

    /**
     * Marca como SUPERSEDED los fragmentos del set indicados por {@code :20:},
     * apuntando al set correctivo que los reemplaza. Devuelve cuantos cambiaron.
     */
    public int markSupersededByReferences(DataSource dataSource,
                                          String fragmentSetId,
                                          java.util.Collection<String> sendersReferences,
                                          String correctiveSetId,
                                          String requiredStatus) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return 0;
        }
        var sql = "update mt101_build_fragment set status = 'SUPERSEDED', superseded_by = ?, "
                + "updated_at = current_timestamp where fragment_set_id = ? and senders_reference = ? and status = ?";
        var updated = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var reference : sendersReferences) {
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                statement.setString(1, correctiveSetId);
                statement.setString(2, fragmentSetId);
                statement.setString(3, reference);
                statement.setString(4, requiredStatus);
                updated += statement.executeUpdate();
            }
        }
        return updated;
    }

    /**
     * Borra los fragmentos de un set (cascade a {@code mt101_fragment_record}). Se usa
     * para limpiar fragmentos correctivos huerfanos tras un rebuild fallido.
     */
    public int deleteByFragmentSet(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "delete from mt101_build_fragment where fragment_set_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            return statement.executeUpdate();
        }
    }

    /**
     * Revierte a {@code REJECTED} los fragmentos del set original que un run correctivo
     * dejo {@code SUPERSEDED} (rollback de un supersede parcial tras fallo del rebuild).
     */
    public int revertSupersededBy(DataSource dataSource, String fragmentSetId, String correctiveSetId) throws SQLException {
        var sql = "update mt101_build_fragment set status = 'REJECTED', superseded_by = null, "
                + "updated_at = current_timestamp where fragment_set_id = ? and superseded_by = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, correctiveSetId);
            return statement.executeUpdate();
        }
    }

    public Map<String, String> nullErrors(Collection<String> sendersReferences) {
        var result = new LinkedHashMap<String, String>();
        if (sendersReferences == null) {
            return result;
        }
        for (var reference : sendersReferences) {
            result.put(reference, null);
        }
        return result;
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    public record FragmentRow(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long stagingIdFrom,
            long stagingIdTo,
            long sourceRecordFrom,
            long sourceRecordTo,
            String sourceFileHash,
            String sourceRecordsJson,
            Map<String, Long> sourceRecords,
            Map<Long, Long> stagingIdsBySourceRecord,
            int fragmentIndex,
            int fragmentTotal,
            String sendersReference,
            String payloadHash,
            String rawPayload,
            String messageJson
    ) {
    }

    public record MessageJsonRow(int fragmentIndex, String messageJson) {
    }

    public record RoutedMessageJsonRow(int fragmentIndex, String messageJson, String routedAs, String routeError) {
    }

    public record FragmentLookupRow(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long stagingIdFrom,
            long stagingIdTo,
            Long sourceRecordFrom,
            Long sourceRecordTo,
            String sourceFileHash,
            int fragmentIndex,
            int fragmentTotal,
            String sendersReference,
            String status,
            String errorMessage,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    private Long nullableLong(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private LocalDateTime timestamp(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
