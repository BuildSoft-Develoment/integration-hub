package com.integrationhub.platform.spi.staging;

import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ADR-021 (decision 3): el <b>protocolo transaccional</b> de la correccion de staging, ahora que es
 * una capacidad del motor.
 *
 * <p>Estas pruebas usan dobles de JDBC a proposito. El SQL contra Postgres real ya lo cubre la suite
 * del vertical; lo que no se puede afirmar contra una BD real es el <i>orden</i> de las llamadas y
 * que el rollback ocurra ante cada modo de fallo. Y ese orden es justamente el invariante que este
 * servicio existe para sostener: politica dentro de la transaccion, evidencia antes del commit,
 * rollback ante cualquier error, y autocommit restaurado pase lo que pase.
 *
 * <p>Si alguien mueve el chequeo de la politica fuera de la transaccion, o commitea antes de
 * archivar la evidencia, aca se rompe. Con una BD real, no.
 */
class StagingRowCorrectionServiceTest {

    private static final long STAGING_ID = 4242L;

    private DataSource dataSource;
    private Connection connection;
    private StagingRecordCorrectionRepository repository;
    private StagingRowCorrectionService service;

    /** Registro de eventos para afirmar el orden entre puertos del vertical y la transaccion. */
    private final List<String> trace = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        trace.clear();
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        repository = mock(StagingRecordCorrectionRepository.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getAutoCommit()).thenReturn(true);
        service = new StagingRowCorrectionService(repository, new PassthroughMapper());
    }

    @Test
    void appliesPatchInsideOneTransactionAndRecordsEvidenceBeforeCommit() throws Exception {
        givenRow("{\"cargos\":\"BAD\"}", 3L);
        when(repository.updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 3L)).thenReturn(1);

        var outcome = service.correct(dataSource,
                new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", 3L),
                tx -> trace.add("policy"),
                (tx, evidence) -> trace.add("journal"));

        assertEquals(1, outcome.updated());
        assertEquals(3L, outcome.evidence().oldVersion());
        assertEquals(4L, outcome.evidence().newVersion(), "la version se incrementa al corregir");
        assertEquals(List.of("cargos"), outcome.evidence().changedFields());

        assertEquals(List.of("policy", "journal"), trace,
                "la politica se consulta antes de leer/escribir; la evidencia se archiva al final");

        InOrder order = inOrder(connection, repository);
        order.verify(connection).setAutoCommit(false);
        order.verify(repository).findPayload(connection, STAGING_ID);
        order.verify(repository).updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 3L);
        order.verify(connection).commit();
        verify(connection).setAutoCommit(true);
        verify(connection, never()).rollback();
    }

    @Test
    void vetoFromTheVerticalRollsBackAndNeverTouchesTheRow() throws Exception {
        givenRow("{\"cargos\":\"BAD\"}", 0L);

        var veto = assertThrows(IllegalStateException.class,
                () -> service.correct(dataSource,
                        new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", 0L),
                        tx -> {
                            throw new IllegalStateException("congelada por un rebuild aprobado");
                        },
                        (tx, evidence) -> trace.add("journal")));

        assertTrue(veto.getMessage().contains("rebuild aprobado"),
                "el motor no traduce ni traga la excepcion del vertical");
        verify(repository, never()).updatePayload(connection, STAGING_ID, null, 0L);
        verify(connection).rollback();
        verify(connection, never()).commit();
        verify(connection).setAutoCommit(true);
        assertEquals(List.of(), trace, "sin evidencia: no hubo correccion que auditar");
    }

    @Test
    void ifMatchMismatchAbortsBeforeWriting() throws Exception {
        givenRow("{\"cargos\":\"BAD\"}", 7L);

        // El operador leyo la version 5 pero la fila ya va por la 7: otro gano la carrera.
        var conflict = assertThrows(StaleStagingRowException.class,
                () -> service.correct(dataSource,
                        new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", 5L),
                        tx -> trace.add("policy"),
                        (tx, evidence) -> trace.add("journal")));

        assertEquals(5L, conflict.expectedVersion());
        assertEquals(7L, conflict.actualVersion());
        verify(repository, never()).updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 5L);
        verify(connection).rollback();
        verify(connection, never()).commit();
    }

    @Test
    void lostRaceOnTheUpdateIsAConflictAndNotASilentNoop() throws Exception {
        givenRow("{\"cargos\":\"BAD\"}", 2L);
        // Sin If-Match, pero la version cambia entre el select y el update: 0 filas afectadas.
        when(repository.updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 2L)).thenReturn(0);

        assertThrows(StaleStagingRowException.class,
                () -> service.correct(dataSource,
                        new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", null),
                        tx -> trace.add("policy"),
                        (tx, evidence) -> trace.add("journal")));

        assertEquals(List.of("policy"), trace, "un update de 0 filas no deja evidencia de nada");
        verify(connection).rollback();
        verify(connection, never()).commit();
    }

    @Test
    void journalFailureRollsBackTheAlreadyAppliedUpdate() throws Exception {
        givenRow("{\"cargos\":\"BAD\"}", 1L);
        when(repository.updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 1L)).thenReturn(1);

        // Invariante del camino del dinero: una correccion sin rastro no se persiste.
        assertThrows(SQLException.class,
                () -> service.correct(dataSource,
                        new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", 1L),
                        tx -> trace.add("policy"),
                        (tx, evidence) -> {
                            throw new SQLException("journal caido");
                        }));

        verify(connection).rollback();
        verify(connection, never()).commit();
        verify(connection).setAutoCommit(true);
    }

    @Test
    void missingRowFailsWithoutWriting() throws Exception {
        when(repository.findPayload(connection, STAGING_ID)).thenReturn(null);

        assertThrows(IllegalArgumentException.class,
                () -> service.correct(dataSource,
                        new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", null),
                        tx -> trace.add("policy"),
                        (tx, evidence) -> trace.add("journal")));

        verify(connection).rollback();
        verify(connection).setAutoCommit(true);
    }

    @Test
    void mergePatchDeletesKeysWithNullAndMergesNestedObjects() throws Exception {
        givenRow("{\"a\":\"1\",\"b\":\"2\",\"n\":{\"x\":\"1\",\"y\":\"2\"}}", 0L);
        when(repository.updatePayload(org.mockito.ArgumentMatchers.eq(connection),
                org.mockito.ArgumentMatchers.eq(STAGING_ID),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(0L))).thenReturn(1);

        var outcome = service.correct(dataSource,
                // RFC 7386: null borra la clave, el objeto anidado se funde (no reemplaza).
                new StagingCorrectionCommand(STAGING_ID, "{\"b\":null,\"n\":{\"y\":\"9\"}}", 0L),
                tx -> { },
                (tx, evidence) -> { });

        assertEquals(List.of("b", "n"), outcome.evidence().changedFields());
    }

    @Test
    void autoCommitIsRestoredEvenWhenTheConnectionCameWithItDisabled() throws Exception {
        when(connection.getAutoCommit()).thenReturn(false);
        givenRow("{\"cargos\":\"BAD\"}", 0L);
        when(repository.updatePayload(connection, STAGING_ID, "{\"cargos\":\"OUR\"}", 0L)).thenReturn(1);

        service.correct(dataSource, new StagingCorrectionCommand(STAGING_ID, "{\"cargos\":\"OUR\"}", 0L),
                tx -> { }, (tx, evidence) -> { });

        // Dos veces con false: al abrir la transaccion y al restaurar el estado previo. Lo que no
        // puede pasar nunca es devolverle al pool una conexion en autocommit que no lo tenia.
        verify(connection, times(2)).setAutoCommit(false);
        verify(connection, never()).setAutoCommit(true);
    }

    @Test
    void rejectsAnEmptyPatchBeforeOpeningAnyConnection() {
        assertThrows(IllegalArgumentException.class,
                () -> new StagingCorrectionCommand(STAGING_ID, "  ", null));
        assertThrows(IllegalArgumentException.class,
                () -> new StagingCorrectionCommand(0L, "{}", null));
    }

    private void givenRow(String payloadJson, long version) throws SQLException {
        when(repository.findPayload(connection, STAGING_ID))
                .thenReturn(new StagingRecordCorrectionRepository.StagingRowPayload(STAGING_ID, payloadJson, version));
    }

    /**
     * Mapper minimo de JSON plano: alcanza para ejercitar el merge y el calculo de campos cambiados
     * sin arrastrar la implementacion del motor (que resuelve secretos) a este modulo.
     */
    private static final class PassthroughMapper implements ConfigurationMapper {

        @Override
        public Map<String, Object> toMap(String json) {
            var result = new LinkedHashMap<String, Object>();
            if (json == null || json.isBlank()) {
                return result;
            }
            parseInto(json.trim(), result);
            return result;
        }

        @Override
        public Map<String, Object> toMapUnresolved(String json) {
            return toMap(json);
        }

        @Override
        public String toJson(Object value) {
            if (!(value instanceof Map<?, ?> map)) {
                return String.valueOf(value);
            }
            var parts = new ArrayList<String>();
            map.forEach((key, raw) -> parts.add("\"" + key + "\":" + render(raw)));
            return "{" + String.join(",", parts) + "}";
        }

        @Override
        public Map<String, Object> resolveSecretsIn(Map<String, Object> raw) {
            return raw;
        }

        private String render(Object raw) {
            if (raw == null) {
                return "null";
            }
            if (raw instanceof Map<?, ?>) {
                return toJson(raw);
            }
            return "\"" + raw + "\"";
        }

        /** Parser de juguete: objetos de un nivel de anidamiento, valores string o null. */
        private void parseInto(String json, Map<String, Object> target) {
            var body = json.substring(1, json.length() - 1);
            var depth = 0;
            var start = 0;
            for (var i = 0; i <= body.length(); i++) {
                if (i == body.length() || (body.charAt(i) == ',' && depth == 0)) {
                    var entry = body.substring(start, i).trim();
                    if (!entry.isEmpty()) {
                        var colon = entry.indexOf(':', entry.indexOf('"', 1) + 1);
                        var key = entry.substring(0, colon).trim().replace("\"", "");
                        var value = entry.substring(colon + 1).trim();
                        if ("null".equals(value)) {
                            target.put(key, null);
                        } else if (value.startsWith("{")) {
                            var nested = new LinkedHashMap<String, Object>();
                            parseInto(value, nested);
                            target.put(key, nested);
                        } else {
                            target.put(key, value.replace("\"", ""));
                        }
                    }
                    start = i + 1;
                } else if (i < body.length() && body.charAt(i) == '{') {
                    depth++;
                } else if (i < body.length() && body.charAt(i) == '}') {
                    depth--;
                }
            }
        }
    }
}
