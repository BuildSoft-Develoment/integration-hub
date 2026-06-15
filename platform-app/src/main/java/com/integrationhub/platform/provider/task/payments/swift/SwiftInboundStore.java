package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.payments.swift.SwiftInboundMessageRepository;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Store inbound MT101 ({@code swift_inbound_message}): equivalente para el flujo
 * de entrada del {@link Mt101FragmentStore} del outbound. {@code MT101_PARSE_FROM_TABLE}
 * escribe aqui (status {@code PARSED}); VALIDATE/ROUTE leen por keyset en paginas y
 * marcan {@code VALIDATED}/{@code REJECTED}/{@code ROUTED} sin cargar el set completo.
 */
@ApplicationScoped
public class SwiftInboundStore {

    public static final String DEFAULT_TABLE = "swift_inbound_message";
    public static final int DEFAULT_PAGE_SIZE = 200;
    public static final List<String> READ_PARSED = List.of("PARSED");
    public static final List<String> READ_VALIDATED = List.of("VALIDATED");

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final ObjectMapper objectMapper;
    private final SwiftInboundMessageRepository repository;

    @Inject
    public SwiftInboundStore(DataSource defaultDataSource,
                             ConnectionPoolManager connectionPoolManager,
                             ObjectMapper objectMapper,
                             SwiftInboundMessageRepository repository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.objectMapper = objectMapper;
        this.repository = repository;
    }

    public Map<String, Object> source(String connectionRef, String inboundSetId, int messageCount) {
        var source = new LinkedHashMap<String, Object>();
        source.put("table", DEFAULT_TABLE);
        source.put("inboundSetId", inboundSetId);
        source.put("messageCount", messageCount);
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        return source;
    }

    public void replaceSet(String connectionRef, String inboundSetId) {
        try {
            repository.deleteSet(resolveDataSource(connectionRef), inboundSetId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reset inbound set " + inboundSetId, error);
        }
    }

    /** Inserta un lote de mensajes parseados (status PARSED) en una conexion + addBatch. */
    public void insertMessages(String connectionRef, List<InboundInsert> messages) {
        if (messages == null || messages.isEmpty()) {
            return;
        }
        try {
            var rows = new ArrayList<SwiftInboundMessageRepository.InboundRow>(messages.size());
            for (var insert : messages) {
                var rawPayload = insert.rawPayload();
                if (rawPayload == null || rawPayload.isBlank()) {
                    throw new IllegalArgumentException("inbound message at row " + insert.rowFrom()
                            + " requires rawPayload");
                }
                var message = insert.message();
                rows.add(new SwiftInboundMessageRepository.InboundRow(
                        insert.inboundSetId(),
                        insert.processExecutionId(),
                        insert.taskDefinitionId(),
                        insert.sourceTable(),
                        insert.rowFrom(),
                        insert.rowTo(),
                        message.sequenceA() == null ? null : message.sequenceA().sendersReference(),
                        sha256Hex(rawPayload),
                        rawPayload,
                        toJson(message)));
            }
            repository.insertMessages(resolveDataSource(connectionRef), rows);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist inbound message batch ("
                    + messages.size() + ") for set " + messages.get(0).inboundSetId(), error);
        }
    }

    public List<Mt101Message> readMessages(Map<String, Object> source) {
        return readMessages(source, READ_PARSED);
    }

    public List<Mt101Message> readMessages(Map<String, Object> source, List<String> defaultStatuses) {
        var result = new ArrayList<Mt101Message>();
        forEachPage(source, defaultStatuses, DEFAULT_PAGE_SIZE, page -> page.forEach(m -> result.add(m.message())));
        return result;
    }

    /**
     * Itera el set en paginas via keyset sobre {@code id} (estable aunque cambie el
     * status de las filas ya visitadas), manteniendo memoria O(pageSize). Cada item
     * lleva el {@code id} para que el consumidor pueda marcar status por lote.
     */
    public void forEachPage(Map<String, Object> source,
                            List<String> defaultStatuses,
                            int pageSize,
                            java.util.function.Consumer<List<InboundMessage>> consumer) {
        var inboundSetId = stringValue(source.get("inboundSetId"));
        if (inboundSetId.isBlank()) {
            throw new IllegalArgumentException("inbound source requires inboundSetId");
        }
        var connectionRef = stringValue(source.get("connectionRef"));
        var statuses = statuses(source.get("statuses"), defaultStatuses);
        var effectivePageSize = Math.max(pageSize, 1);
        var afterId = 0L;
        try {
            while (true) {
                var rows = repository.readPage(resolveDataSource(connectionRef),
                        inboundSetId, statuses, afterId, effectivePageSize);
                var page = new ArrayList<InboundMessage>(rows.size());
                for (var row : rows) {
                    afterId = row.id();
                    page.add(new InboundMessage(row.id(), fromJson(row.messageJson())));
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
            throw new IllegalStateException("Cannot read inbound messages for set " + inboundSetId, error);
        }
    }

    /** Marca un lote de mensajes (por id) con el mismo status y routed_as. */
    public void markStatusBatch(Map<String, Object> source, Collection<Long> ids, String status, String routedAs) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        markStatusBatch(source, repository.nullErrors(ids), status, routedAs);
    }

    /** Marca un lote (por id) con status, routed_as y error individual. */
    public void markStatusBatch(Map<String, Object> source, Map<Long, String> errorById, String status, String routedAs) {
        if (source == null || source.isEmpty() || errorById == null || errorById.isEmpty()) {
            return;
        }
        var connectionRef = stringValue(source.get("connectionRef"));
        try {
            repository.updateStatusBatch(resolveDataSource(connectionRef), errorById, status, routedAs);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot update inbound status batch (" + errorById.size() + ")", error);
        }
    }

    public long countBySetAndStatus(String connectionRef, String inboundSetId, String status) {
        try {
            return repository.countBySetAndStatus(resolveDataSource(connectionRef), inboundSetId, status);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count inbound set " + inboundSetId, error);
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
            throw new IllegalArgumentException("Cannot serialize inbound message", error);
        }
    }

    private Mt101Message fromJson(String json) {
        try {
            return objectMapper.readValue(json, Mt101Message.class);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Cannot deserialize inbound message", error);
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
        return result.isEmpty() ? (defaults == null ? List.of() : defaults) : result;
    }

    private String stringValue(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }

    /** Parametros de insercion de un mensaje inbound parseado. */
    public record InboundInsert(
            String inboundSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long rowFrom,
            long rowTo,
            String rawPayload,
            Mt101Message message
    ) {
    }

    /** Un mensaje leido del store, con su id para marcado por lote. */
    public record InboundMessage(long id, Mt101Message message) {
    }
}
