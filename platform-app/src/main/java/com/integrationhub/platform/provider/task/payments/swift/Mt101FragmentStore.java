package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
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
    private final Mt101FragmentRepository fragmentRepository;

    @Inject
    public Mt101FragmentStore(DataSource defaultDataSource,
                              ConnectionPoolManager connectionPoolManager,
                              ObjectMapper objectMapper,
                              Mt101FragmentRepository fragmentRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.objectMapper = objectMapper;
        this.fragmentRepository = fragmentRepository;
    }

    public Mt101FragmentStore(DataSource defaultDataSource,
                              ConnectionPoolManager connectionPoolManager,
                              ObjectMapper objectMapper) {
        this(defaultDataSource, connectionPoolManager, objectMapper, new Mt101FragmentRepository());
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
        try {
            fragmentRepository.deleteFragmentSet(resolveDataSource(connectionRef), fragmentSetId);
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
        // Conveniencia (tests/flujos simples): rowFrom/rowTo se interpretan como
        // id de staging y como numero de fila a la vez. El flujo masivo usa el
        // constructor completo de FragmentInsert con ambas claves separadas.
        insertFragments(connectionRef, List.of(new FragmentInsert(
                fragmentSetId, processExecutionId, taskDefinitionId, sourceTable,
                rowFrom, rowTo, rowFrom, rowTo, null, Map.of(), Map.of(), fragmentIndex, fragmentTotal, message)));
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
        try {
            var rows = new ArrayList<Mt101FragmentRepository.FragmentRow>(fragments.size());
            for (var fragment : fragments) {
                var message = fragment.message();
                var rawPayload = message.rawPayload();
                if (rawPayload == null || rawPayload.isBlank()) {
                    throw new IllegalArgumentException("MT101 fragment " + fragment.fragmentIndex()
                            + " requires rawPayload");
                }
                rows.add(new Mt101FragmentRepository.FragmentRow(
                        fragment.fragmentSetId(),
                        fragment.processExecutionId(),
                        fragment.taskDefinitionId(),
                        fragment.sourceTable(),
                        fragment.stagingIdFrom(),
                        fragment.stagingIdTo(),
                        fragment.sourceRecordFrom(),
                        fragment.sourceRecordTo(),
                        fragment.sourceFileHash(),
                        sourceRecordsJson(fragment.sourceRecords()),
                        fragment.sourceRecords(),
                        fragment.stagingIdsBySourceRecord(),
                        fragment.fragmentIndex(),
                        fragment.fragmentTotal(),
                        message.sequenceA() == null ? null : message.sequenceA().sendersReference(),
                        sha256Hex(rawPayload),
                        rawPayload,
                        toJson(message)));
            }
            fragmentRepository.insertFragments(resolveDataSource(connectionRef), rows);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist MT101 fragment batch ("
                    + fragments.size() + " fragments) for set " + fragments.get(0).fragmentSetId(), error);
        }
    }

    /**
     * Parametros de insercion de un fragmento (para lotes de fase 2). Separa la
     * clave tecnica ({@code stagingId*}) de la clave de soporte/UI ({@code sourceRecord*},
     * fila 1-based del archivo) + hash del archivo origen.
     */
    public record FragmentInsert(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long stagingIdFrom,
            long stagingIdTo,
            long sourceRecordFrom,
            long sourceRecordTo,
            String sourceFileHash,
            Map<String, Long> sourceRecords,
            Map<Long, Long> stagingIdsBySourceRecord,
            int fragmentIndex,
            int fragmentTotal,
            Mt101Message message
    ) {
    }

    /**
     * Estados que un consumidor generico puede leer por defecto. Excluye
     * {@code REJECTED} y {@code SENT}: los rechazados se reanudan por flujo
     * explicito; los enviados quedan para consulta/conciliacion.
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
        var afterIndex = 0;
        try {
            while (true) {
                var rows = fragmentRepository.readPage(
                        resolveDataSource(connectionRef),
                        fragmentSetId,
                        statuses,
                        afterIndex,
                        effectivePageSize);
                var page = new ArrayList<Mt101Message>(rows.size());
                for (var row : rows) {
                    afterIndex = row.fragmentIndex();
                    page.add(fromJson(row.messageJson()));
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
        try {
            fragmentRepository.updateStatusBatch(resolveDataSource(connectionRef),
                    fragmentSetId, errorBySendersReference, status);
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

    /** Serializa el mapeo {@code :21: -> fila del archivo} como objeto JSON. */
    private String sourceRecordsJson(Map<String, Long> sourceRecords) {
        if (sourceRecords == null || sourceRecords.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(sourceRecords);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Cannot serialize MT101 fragment source records", error);
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

    private String stringValue(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }
}
