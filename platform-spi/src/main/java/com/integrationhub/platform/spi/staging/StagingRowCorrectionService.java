package com.integrationhub.platform.spi.staging;

import com.integrationhub.platform.spi.engine.ConfigurationMapper;

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
import java.util.Objects;
import java.util.TreeSet;

/**
 * ADR-021 (decision 3): <b>corregir una fila de staging es una capacidad del motor</b>.
 *
 * <p>Vivia entera dentro del vertical SWIFT MT101, que escribia {@code staging_record} —una tabla
 * del nucleo— con su propio SQL, su propia transaccion y su propio lock optimista. Eso era ownership
 * mal ubicado: "aplicar un merge-patch a una fila con If-Match y dejar evidencia, todo o nada" no
 * tiene nada de SWIFT. El proximo vertical (SBS) necesita exactamente esto y no deberia reimplementar
 * un lock optimista sobre el camino del dinero para conseguirlo.
 *
 * <p>Lo que <b>no</b> es del motor viaja por dos puertos que aporta el vertical:
 * <ul>
 *   <li>{@link StagingCorrectionPolicy} — si la fila puede editarse (en MT101, que no este congelada
 *       por un rebuild aprobado).</li>
 *   <li>{@link StagingCorrectionJournal} — donde se archiva la evidencia, que en cada estandar tiene
 *       columnas distintas.</li>
 * </ul>
 * Ambos se invocan <b>dentro</b> de la transaccion. Son parametros y no beans inyectados a proposito:
 * no hay un discriminador de vertical que el motor pueda resolver, y fingir que lo hay terminaria en
 * una ambiguedad de CDI o en un registro por nombre. Quien corrige trae su politica, explicita.
 *
 * <p><b>Invariante que este servicio existe para sostener:</b> la fila corregida y su evidencia se
 * persisten juntas o no se persiste ninguna, y ninguna correccion pisa a otra sin que el operador
 * se entere. Cualquier cambio aca toca el camino del dinero.
 */
public class StagingRowCorrectionService {

    private final StagingRecordCorrectionRepository repository;
    private final ConfigurationMapper jsonConfigurationMapper;

    public StagingRowCorrectionService(ConfigurationMapper jsonConfigurationMapper) {
        this(new StagingRecordCorrectionRepository(), jsonConfigurationMapper);
    }

    public StagingRowCorrectionService(StagingRecordCorrectionRepository repository,
                                       ConfigurationMapper jsonConfigurationMapper) {
        this.repository = Objects.requireNonNull(repository, "repository is required");
        this.jsonConfigurationMapper = Objects.requireNonNull(jsonConfigurationMapper,
                "jsonConfigurationMapper is required");
    }

    /**
     * Aplica el patch a la fila, en una sola transaccion: veto de la politica, lectura del payload,
     * chequeo de If-Match, merge, UPDATE con lock optimista, evidencia y commit.
     *
     * <p>El orden importa. La politica se consulta <b>antes</b> de leer el payload y con la misma
     * conexion: comprobarla fuera dejaria una ventana en la que el estado que la habilitaba cambia
     * entre el chequeo y la escritura.
     *
     * @param dataSource conexion al esquema donde vive {@code staging_record} (puede no ser la del
     *                   motor: el vertical resuelve a que origen pertenece la fila antes de llamar).
     * @throws StaleStagingRowException  si la version no coincide, sea en el If-Match o en el UPDATE.
     * @throws IllegalArgumentException  si la fila no existe.
     * @throws SQLException              error de BD; el llamante decide como envolverlo.
     */
    public StagingCorrectionOutcome correct(DataSource dataSource,
                                            StagingCorrectionCommand command,
                                            StagingCorrectionPolicy policy,
                                            StagingCorrectionJournal journal) throws SQLException {
        Objects.requireNonNull(dataSource, "dataSource is required");
        Objects.requireNonNull(command, "command is required");
        Objects.requireNonNull(policy, "policy is required");
        Objects.requireNonNull(journal, "journal is required");

        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                policy.checkEditable(connection);

                var current = repository.findPayload(connection, command.stagingId());
                if (current == null) {
                    throw new IllegalArgumentException("no staging row " + command.stagingId());
                }
                // Locking optimista: si el cliente trae la version que leyo (If-Match) y ya cambio,
                // abortamos sin pisar la correccion de otro operador.
                if (command.expectedVersion() != null && current.version() != command.expectedVersion()) {
                    throw new StaleStagingRowException(command.stagingId(), command.expectedVersion(),
                            current.version());
                }
                var checkVersion = command.expectedVersion() != null ? command.expectedVersion() : current.version();

                var before = jsonConfigurationMapper.toMap(current.payloadJson());
                var patch = jsonConfigurationMapper.toMap(command.patchJson());
                var after = mergePatch(before, patch);
                var newPayload = jsonConfigurationMapper.toJson(after);
                var changedFields = changedFields(before, after);

                var updated = repository.updatePayload(connection, command.stagingId(), newPayload, checkVersion);
                if (updated == 0) {
                    // Sin If-Match tambien se comprueba: la version pudo moverse entre el select y el
                    // update. Un 0 tratado como exito seria una correccion perdida en silencio.
                    throw new StaleStagingRowException(command.stagingId(), checkVersion, current.version());
                }

                var evidence = new StagingCorrectionEvidence(
                        sha256Hex(current.payloadJson() == null ? "" : current.payloadJson()),
                        sha256Hex(newPayload == null ? "" : newPayload),
                        changedFields,
                        checkVersion,
                        checkVersion + 1);
                journal.record(connection, evidence);

                connection.commit();
                return new StagingCorrectionOutcome(updated, evidence);
            } catch (SQLException | RuntimeException error) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    error.addSuppressed(rollbackError);
                }
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        }
    }

    /**
     * Semantica JSON Merge Patch (RFC 7386): un valor {@code null} <b>borra</b> la clave, dos objetos
     * se funden recursivamente, y cualquier otro valor reemplaza. Se conserva el orden de insercion
     * para que el JSON resultante no se reordene solo entre correcciones.
     */
    private Map<String, Object> mergePatch(Map<String, Object> original, Map<String, Object> patch) {
        var result = new LinkedHashMap<String, Object>(original);
        for (var entry : patch.entrySet()) {
            var key = entry.getKey();
            var patchValue = entry.getValue();
            if (patchValue == null) {
                result.remove(key);
                continue;
            }
            var currentValue = result.get(key);
            if (currentValue instanceof Map<?, ?> currentMap && patchValue instanceof Map<?, ?> patchMap) {
                result.put(key, mergePatch(asStringKeyed(currentMap), asStringKeyed(patchMap)));
            } else {
                result.put(key, patchValue);
            }
        }
        return result;
    }

    private Map<String, Object> asStringKeyed(Map<?, ?> raw) {
        var result = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private List<String> changedFields(Map<String, Object> before, Map<String, Object> after) {
        var keys = new TreeSet<String>();
        keys.addAll(before.keySet());
        keys.addAll(after.keySet());
        var changed = new ArrayList<String>();
        for (var key : keys) {
            if (!Objects.equals(before.get(key), after.get(key))) {
                changed.add(key);
            }
        }
        return changed;
    }

    private String sha256Hex(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }
}
