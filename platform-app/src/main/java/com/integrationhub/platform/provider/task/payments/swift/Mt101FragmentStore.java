package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class Mt101FragmentStore {

    public static final String DEFAULT_TABLE = "mt101_build_fragment";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final ObjectMapper objectMapper;

    @Inject
    public Mt101FragmentStore(DataSource defaultDataSource,
                              ConnectionPoolManager connectionPoolManager,
                              ObjectMapper objectMapper) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> source(String connectionRef, String fragmentSetId, int fragmentCount) {
        var source = new LinkedHashMap<String, Object>();
        source.put("table", DEFAULT_TABLE);
        source.put("fragmentSetId", fragmentSetId);
        source.put("fragmentCount", fragmentCount);
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        return source;
    }

    public void replaceFragmentSet(String connectionRef, String fragmentSetId) {
        try (var connection = resolveDataSource(connectionRef).getConnection();
             var statement = connection.prepareStatement(
                     "delete from mt101_build_fragment where fragment_set_id = ?")) {
            statement.setString(1, fragmentSetId);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reset MT101 fragment set " + fragmentSetId, error);
        }
    }

    public void insertFragment(String connectionRef,
                               String fragmentSetId,
                               Long processExecutionId,
                               Long taskDefinitionId,
                               String sourceTable,
                               long rowFrom,
                               long rowTo,
                               int fragmentIndex,
                               int fragmentTotal,
                               Mt101Message message) {
        insertFragments(connectionRef, List.of(new FragmentInsert(
                fragmentSetId, processExecutionId, taskDefinitionId, sourceTable,
                rowFrom, rowTo, fragmentIndex, fragmentTotal, message)));
    }

    /**
     * Inserta un lote de fragmentos con una sola conexion y {@code addBatch}.
     * Para sets de 10k+ fragmentos (1M registros) esto reduce los round-trips a
     * BD ~100x frente a una conexion + INSERT por fragmento.
     */
    public void insertFragments(String connectionRef, List<FragmentInsert> fragments) {
        if (fragments == null || fragments.isEmpty()) {
            return;
        }
        var sql = "insert into mt101_build_fragment "
                + "(fragment_set_id, process_execution_id, task_definition_id, source_table, source_row_from, source_row_to, "
                + " fragment_index, fragment_total, senders_reference, payload_hash, raw_payload, message_json, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = resolveDataSource(connectionRef).getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var fragment : fragments) {
                var message = fragment.message();
                var rawPayload = message.rawPayload();
                if (rawPayload == null || rawPayload.isBlank()) {
                    throw new IllegalArgumentException("MT101 fragment " + fragment.fragmentIndex()
                            + " requires rawPayload");
                }
                statement.setString(1, fragment.fragmentSetId());
                if (fragment.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, fragment.processExecutionId());
                if (fragment.taskDefinitionId() == null) statement.setNull(3, Types.BIGINT);
                else statement.setLong(3, fragment.taskDefinitionId());
                statement.setString(4, fragment.sourceTable());
                statement.setLong(5, fragment.rowFrom());
                statement.setLong(6, fragment.rowTo());
                statement.setInt(7, fragment.fragmentIndex());
                statement.setInt(8, fragment.fragmentTotal());
                statement.setString(9, message.sequenceA() == null ? null : message.sequenceA().sendersReference());
                statement.setString(10, sha256Hex(rawPayload));
                statement.setString(11, rawPayload);
                statement.setString(12, toJson(message));
                statement.setString(13, "BUILT");
                statement.addBatch();
            }
            statement.executeBatch();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist MT101 fragment batch ("
                    + fragments.size() + " fragments) for set " + fragments.get(0).fragmentSetId(), error);
        }
    }

    /** Parametros de insercion de un fragmento (para lotes de fase 2). */
    public record FragmentInsert(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long rowFrom,
            long rowTo,
            int fragmentIndex,
            int fragmentTotal,
            Mt101Message message
    ) {
    }

    /**
     * Estados que un consumidor generico puede leer por defecto. Excluye
     * {@code REJECTED} y {@code SENT}: re-procesar fragmentos rechazados o ya
     * enviados requiere pedirlo explicitamente via {@code fragmentSource.statuses}.
     */
    public static final List<String> READ_DEFAULT_STATUSES = List.of("BUILT", "VALIDATED", "ARCHIVED");
    /** Pagina por defecto al iterar fragmentos sin cargar el set completo. */
    public static final int DEFAULT_PAGE_SIZE = 200;

    public List<Mt101Message> readMessages(Map<String, Object> fragmentSource) {
        return readMessages(fragmentSource, READ_DEFAULT_STATUSES);
    }

    public List<Mt101Message> readMessages(Map<String, Object> fragmentSource, List<String> defaultStatuses) {
        var result = new ArrayList<Mt101Message>();
        forEachPage(fragmentSource, defaultStatuses, DEFAULT_PAGE_SIZE, result::addAll);
        return result;
    }

    /**
     * Itera el set de fragmentos en paginas via keyset pagination sobre
     * {@code fragment_index} (estable aunque los consumidores cambien {@code status}
     * de las filas ya visitadas). Mantiene memoria O(pageSize) en lugar de cargar
     * los N fragmentos (potencialmente decenas de miles para archivos de 1M
     * registros) de una sola vez.
     *
     * @param defaultStatuses estados a leer si {@code fragmentSource.statuses} no
     *                        los fija explicitamente. Cada consumidor declara su gate:
     *                        VALIDATE lee BUILT, ARCHIVE lee BUILT/VALIDATED, PAY lee
     *                        solo ARCHIVED.
     */
    public void forEachPage(Map<String, Object> fragmentSource,
                            List<String> defaultStatuses,
                            int pageSize,
                            java.util.function.Consumer<List<Mt101Message>> consumer) {
        var fragmentSetId = stringValue(fragmentSource.get("fragmentSetId"));
        if (fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("MT101 fragment source requires fragmentSetId");
        }
        var connectionRef = stringValue(fragmentSource.get("connectionRef"));
        var statuses = statuses(fragmentSource.get("statuses"), defaultStatuses);
        var effectivePageSize = Math.max(pageSize, 1);
        var sql = "select fragment_index, message_json from mt101_build_fragment where fragment_set_id = ?"
                + (statuses.isEmpty() ? "" : " and status in (" + placeholders(statuses.size()) + ")")
                + " and fragment_index > ?"
                + " order by fragment_index asc limit ?";
        var afterIndex = 0;
        try (var connection = resolveDataSource(connectionRef).getConnection()) {
            while (true) {
                var page = new ArrayList<Mt101Message>(effectivePageSize);
                try (var statement = connection.prepareStatement(sql)) {
                    var parameter = 1;
                    statement.setString(parameter++, fragmentSetId);
                    for (var status : statuses) {
                        statement.setString(parameter++, status);
                    }
                    statement.setInt(parameter++, afterIndex);
                    statement.setInt(parameter, effectivePageSize);
                    try (var rs = statement.executeQuery()) {
                        while (rs.next()) {
                            afterIndex = rs.getInt(1);
                            page.add(fromJson(rs.getString(2)));
                        }
                    }
                }
                if (page.isEmpty()) {
                    return;
                }
                consumer.accept(page);
                if (page.size() < effectivePageSize) {
                    return;
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read MT101 fragments for set " + fragmentSetId, error);
        }
    }

    public void markStatus(Map<String, Object> fragmentSource,
                           String sendersReference,
                           String status,
                           String errorMessage) {
        if (sendersReference == null || sendersReference.isBlank()) {
            return;
        }
        var errorByRef = new LinkedHashMap<String, String>();
        errorByRef.put(sendersReference, errorMessage);
        markStatusBatch(fragmentSource, errorByRef, status);
    }

    /** Marca un lote de fragmentos con el mismo status, sin mensaje de error. */
    public void markStatusBatch(Map<String, Object> fragmentSource,
                                java.util.Collection<String> sendersReferences,
                                String status) {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return;
        }
        var errorByRef = new LinkedHashMap<String, String>();
        for (var reference : sendersReferences) {
            errorByRef.put(reference, null);
        }
        markStatusBatch(fragmentSource, errorByRef, status);
    }

    /**
     * Marca un lote de fragmentos con el mismo status y error individual por
     * referencia (e.g. REJECTED con el detalle de issues de cada fragmento).
     * Una conexion + {@code addBatch} por lote: con paginas de 200 esto reduce
     * los round-trips de marcado ~200x frente a un UPDATE por fragmento.
     */
    public void markStatusBatch(Map<String, Object> fragmentSource,
                                Map<String, String> errorBySendersReference,
                                String status) {
        if (fragmentSource == null || fragmentSource.isEmpty()
                || errorBySendersReference == null || errorBySendersReference.isEmpty()) {
            return;
        }
        var fragmentSetId = stringValue(fragmentSource.get("fragmentSetId"));
        if (fragmentSetId.isBlank()) {
            return;
        }
        var connectionRef = stringValue(fragmentSource.get("connectionRef"));
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and senders_reference = ?";
        try (var connection = resolveDataSource(connectionRef).getConnection();
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
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot update MT101 fragment status batch ("
                    + errorBySendersReference.size() + " fragments) for set " + fragmentSetId, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String toJson(Mt101Message message) {
        try {
            return objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Cannot serialize MT101 fragment", error);
        }
    }

    private Mt101Message fromJson(String json) {
        try {
            return objectMapper.readValue(json, Mt101Message.class);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Cannot deserialize MT101 fragment", error);
        }
    }

    private String sha256Hex(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    private List<String> statuses(Object raw, List<String> defaults) {
        if (!(raw instanceof List<?> rawList)) {
            return defaults == null ? List.of() : defaults;
        }
        var result = new ArrayList<String>();
        for (var item : rawList) {
            var value = stringValue(item).toUpperCase();
            if (!value.isBlank()) {
                result.add(value);
            }
        }
        return result;
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    private String stringValue(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }
}
