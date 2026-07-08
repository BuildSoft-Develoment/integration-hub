package com.integrationhub.platform.provider.task.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * P3 — ledger de INTENCIÓN de dispatch para el camino de <b>lista en memoria</b> de {@code MT101_PAY}
 * ({@code MT101_BUILD}/{@code MT101_SPLIT} → PAY), que llama {@code transport.send()} sin el claim durable del camino
 * persistido ({@code mt101_build_fragment}). Le da la misma <b>re-request-safety</b> sin cambiar la topología: se reclama
 * la clave de dispatch (la idempotency key del banco, determinista por-pago) <b>antes</b> de enviar; un re-request del
 * mismo pago encuentra la fila y NO reenvía.
 *
 * <p>Semántica (simétrica con el camino persistido y con la clasificación segura v26/v27):
 * <ul>
 *   <li>fila nueva → se reclama {@code DISPATCHING} y se envía;</li>
 *   <li>{@code REJECTED} (rechazo pre-dispatch: probado que NO salió al banco) → se re-reclama y se permite reintento;</li>
 *   <li>{@code SENT} / {@code UNCERTAIN} / {@code DISPATCHING} → NO se reenvía (ya enviado, ambiguo, o en vuelo).</li>
 * </ul>
 * El {@code DISPATCHING} se commitea ANTES del {@code send()} (durable): un crash entre claim y resultado deja la
 * intención en {@code DISPATCHING} → un re-request no reenvía y exige conciliación. Vive en la DB de la plataforma.</p>
 */
@ApplicationScoped
public class Mt101PayDispatchIntentStore {

    /** Resultado del claim: si se puede enviar, o por qué NO (para reportar sin reenviar). */
    public enum ClaimResult {
        /** Se reclamó (fila nueva o re-reclamo de un REJECTED): proceder a enviar. */
        CLAIMED,
        /** Ya fue enviado (SENT): no reenviar; reportar como aceptado. */
        ALREADY_SENT,
        /** Resultado previo ambiguo (UNCERTAIN): no reenviar; exige conciliación. */
        ALREADY_UNCERTAIN,
        /** Otro intento en vuelo (DISPATCHING): no reenviar; tratar como incierto. */
        IN_FLIGHT
    }

    private final DataSource dataSource;

    @Inject
    public Mt101PayDispatchIntentStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Reclama atómicamente la intención de dispatch. Commitea el {@code DISPATCHING} antes de retornar (durable).
     */
    public ClaimResult claimForDispatch(String dispatchKey, Long processExecutionId, String sendersReference) {
        if (dispatchKey == null || dispatchKey.isBlank()) {
            throw new IllegalArgumentException("MT101 pay dispatch intent requires a non-blank dispatch key");
        }
        var claim = "insert into mt101_pay_dispatch_intent "
                + "(dispatch_key, process_execution_id, senders_reference, status, attempts, created_at, updated_at) "
                + "values (?, ?, ?, 'DISPATCHING', 1, current_timestamp, current_timestamp) "
                + "on conflict (dispatch_key) do update "
                + "set status = 'DISPATCHING', attempts = mt101_pay_dispatch_intent.attempts + 1, "
                + "    updated_at = current_timestamp "
                + "where mt101_pay_dispatch_intent.status = 'REJECTED' "
                + "returning status";
        try (var connection = dataSource.getConnection()) {
            try (var statement = connection.prepareStatement(claim)) {
                statement.setString(1, dispatchKey);
                if (processExecutionId == null) {
                    statement.setNull(2, java.sql.Types.BIGINT);
                } else {
                    statement.setLong(2, processExecutionId);
                }
                statement.setString(3, sendersReference);
                try (var rs = statement.executeQuery()) {
                    if (rs.next()) {
                        return ClaimResult.CLAIMED; // fila nueva o re-reclamo desde REJECTED (autocommit: durable)
                    }
                }
            }
            // Bloqueado: el ON CONFLICT no actualizó (estado no-REJECTED). Se reporta el estado persistido.
            return switch (currentStatus(connection, dispatchKey)) {
                case "SENT" -> ClaimResult.ALREADY_SENT;
                case "UNCERTAIN" -> ClaimResult.ALREADY_UNCERTAIN;
                default -> ClaimResult.IN_FLIGHT; // DISPATCHING (u otro no-terminal): otro intento en vuelo
            };
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot claim MT101 pay dispatch intent for key " + dispatchKey, error);
        }
    }

    /**
     * Registra el resultado terminal del envío en la intención reclamada. Solo transiciona desde {@code DISPATCHING}
     * (la que este intento reclamó); un {@code UNCERTAIN} queda durable (bloquea futuros reenvíos hasta conciliar).
     */
    public void recordResult(String dispatchKey, String status, String gatewayReference, int attempts,
                             String errorMessage) {
        var update = "update mt101_pay_dispatch_intent "
                + "set status = ?, gateway_reference = ?, attempts = ?, error_message = ?, updated_at = current_timestamp "
                + "where dispatch_key = ? and status = 'DISPATCHING'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(update)) {
            statement.setString(1, status);
            statement.setString(2, gatewayReference);
            statement.setInt(3, Math.max(attempts, 0));
            statement.setString(4, errorMessage);
            statement.setString(5, dispatchKey);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot record MT101 pay dispatch intent result for key " + dispatchKey, error);
        }
    }

    private String currentStatus(java.sql.Connection connection, String dispatchKey) throws SQLException {
        try (var statement = connection.prepareStatement(
                "select status from mt101_pay_dispatch_intent where dispatch_key = ?")) {
            statement.setString(1, dispatchKey);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : "";
            }
        }
    }

    // ------------------------------------------------------------------
    // D1 (visibilidad): lectura del ledger para hacer observable el atasco de dispatch de lista. Un UNCERTAIN (o un
    // DISPATCHING que un crash dejo colgado) bloquea futuros reenvios "hasta conciliar", pero hoy es INVISIBLE (sin
    // API/UI). Estos lectores exponen el estado para que el operador lo vea y actue (espejo de item 3 para fragmentos).
    // ------------------------------------------------------------------

    /** Estados que exigen atencion: ambiguo (UNCERTAIN) o colgado en vuelo (DISPATCHING) tras un crash pre-resultado. */
    private static final String STUCK_STATUSES = "('UNCERTAIN','DISPATCHING')";

    /** Conteo por estado de todo el ledger (para el resumen operativo de un vistazo). */
    public List<StatusCount> statusCounts() {
        var sql = "select status, count(*) as total from mt101_pay_dispatch_intent group by status order by status";
        var result = new ArrayList<StatusCount>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql);
             var rs = statement.executeQuery()) {
            while (rs.next()) {
                result.add(new StatusCount(rs.getString("status"), rs.getLong("total")));
            }
            return result;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read MT101 pay dispatch intent status counts", error);
        }
    }

    /**
     * Intenciones atascadas (UNCERTAIN / DISPATCHING) mas antiguas primero: son las que exigen conciliacion manual y
     * bloquean el reenvio del pago. {@code limit} acota la muestra.
     */
    public List<DispatchIntentRow> stuckIntents(int limit) {
        var sql = "select dispatch_key, process_execution_id, senders_reference, status, gateway_reference, "
                + "attempts, error_message, created_at, updated_at from mt101_pay_dispatch_intent "
                + "where status in " + STUCK_STATUSES + " order by updated_at asc limit ?";
        var result = new ArrayList<DispatchIntentRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setInt(1, Math.max(1, limit));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var peId = rs.getLong("process_execution_id");
                    result.add(new DispatchIntentRow(
                            rs.getString("dispatch_key"),
                            rs.wasNull() ? null : peId,
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("gateway_reference"),
                            rs.getInt("attempts"),
                            rs.getString("error_message"),
                            rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant().toString(),
                            rs.getTimestamp("updated_at") == null ? null : rs.getTimestamp("updated_at").toInstant().toString()));
                }
            }
            return result;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read stuck MT101 pay dispatch intents", error);
        }
    }

    /** Conteo de intenciones atascadas (UNCERTAIN / DISPATCHING), para la alerta operativa. */
    public long stuckIntentCount() {
        var sql = "select count(*) from mt101_pay_dispatch_intent where status in " + STUCK_STATUSES;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql);
             var rs = statement.executeQuery()) {
            return rs.next() ? rs.getLong(1) : 0L;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count stuck MT101 pay dispatch intents", error);
        }
    }

    /** Conteo por estado del ledger. */
    public record StatusCount(String status, long count) {
    }

    /** Fila del ledger de intencion de dispatch (camino de lista) expuesta para visibilidad/conciliacion. */
    public record DispatchIntentRow(String dispatchKey,
                                    Long processExecutionId,
                                    String sendersReference,
                                    String status,
                                    String gatewayReference,
                                    int attempts,
                                    String errorMessage,
                                    String createdAt,
                                    String updatedAt) {
    }
}
