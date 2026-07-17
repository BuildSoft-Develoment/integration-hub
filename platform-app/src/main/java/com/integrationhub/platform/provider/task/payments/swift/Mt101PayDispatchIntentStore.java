package com.integrationhub.platform.provider.task.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * P3 — ledger de INTENCIÓN de dispatch para el camino de <b>lista en memoria</b> de {@code MT101_PAY}
 * ({@code MT101_SPLIT} → PAY), que llama {@code transport.send()} sin el claim durable del camino
 * persistido ({@code mt101_build_fragment}). Le da la misma <b>re-request-safety</b> sin cambiar la topología: se reclama
 * la clave de dispatch (la idempotency key del banco, determinista por-pago) <b>antes</b> de enviar; un re-request del
 * mismo pago encuentra la fila y NO reenvía.
 *
 * <p>Semántica (simétrica con el camino persistido y con la clasificación segura v26/v27):
 * <ul>
 *   <li>fila nueva → se reclama {@code DISPATCHING} y se envía;</li>
 *   <li>{@code REJECTED} (rechazo de negocio pre-dispatch) / {@code INVALIDATED} (fallo técnico pre-dispatch,
 *       transportFailure): ambos "probado que NO salió al banco" → se re-reclama y se permite reintento;</li>
 *   <li>{@code SENT} / {@code UNCERTAIN} / {@code DISPATCHING} → NO se reenvía (ya enviado, ambiguo, o en vuelo).</li>
 * </ul>
 * El {@code DISPATCHING} se commitea ANTES del {@code send()} (durable): un crash entre claim y resultado deja la
 * intención en {@code DISPATCHING} → un re-request no reenvía y exige conciliación. Vive en la DB de la plataforma.</p>
 */
@ApplicationScoped
public class Mt101PayDispatchIntentStore {

    /** Resultado del claim: si se puede enviar, o por qué NO (para reportar sin reenviar). */
    public enum ClaimResult {
        /** Se reclamó (fila nueva o re-reclamo de un REJECTED/INVALIDATED): proceder a enviar. */
        CLAIMED,
        /** El MISMO pago ya fue enviado (SENT + mismo payload_hash): no reenviar; reportar como aceptado (idempotente). */
        ALREADY_SENT,
        /**
         * R1: la clave ya está SENT pero con un payload DISTINTO (otro pago colisionando con la idempotency key). NO
         * se puede reportar aceptado sin silenciar este pago: se exige conciliación de la colisión (nunca reenvío).
         */
        ALREADY_SENT_CONFLICT,
        /** El MISMO pago quedó ambiguo (UNCERTAIN + mismo payload_hash): no reenviar; exige conciliación. */
        ALREADY_UNCERTAIN,
        /** R1: la clave está UNCERTAIN pero con un payload DISTINTO (colisión con otro pago): conciliar, nunca reenvío. */
        ALREADY_UNCERTAIN_CONFLICT,
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
     *
     * <p>R1: {@code payloadHash} (SHA-256 del payload EXACTO que recibe el banco) es la identidad del pago; se fija al
     * reclamar. En un claim bloqueado (SENT/UNCERTAIN) se compara contra el persistido para DEMOSTRAR —no inferir— que
     * el re-request es el MISMO pago (idempotente) o un pago DISTINTO colisionando con la misma clave (conflicto).</p>
     */
    public ClaimResult claimForDispatch(String dispatchKey, Long processExecutionId, String sendersReference,
                                        String payloadHash) {
        if (dispatchKey == null || dispatchKey.isBlank()) {
            throw new IllegalArgumentException("MT101 pay dispatch intent requires a non-blank dispatch key");
        }
        // R1 (invariante): sin identidad de payload no se puede probar que un ALREADY_SENT sea el MISMO pago. El
        // provider hace fail-loud antes de llegar aquí; el store lo reafirma (nunca una intención sin identidad).
        if (payloadHash == null || payloadHash.isBlank()) {
            throw new IllegalArgumentException("MT101 pay dispatch intent requires a non-blank payload hash");
        }
        var claim = "insert into mt101_pay_dispatch_intent "
                + "(dispatch_key, process_execution_id, senders_reference, status, payload_hash, attempts, "
                + " created_at, updated_at) "
                + "values (?, ?, ?, 'DISPATCHING', ?, 1, current_timestamp, current_timestamp) "
                + "on conflict (dispatch_key) do update "
                + "set status = 'DISPATCHING', payload_hash = excluded.payload_hash, "
                + "    attempts = mt101_pay_dispatch_intent.attempts + 1, updated_at = current_timestamp "
                // D.2: REJECTED e INVALIDATED son ambos "probado que NO salio al banco" -> re-reclamables. INVALIDATED
                // = fallo tecnico pre-despacho (transportFailure); REJECTED = rechazo de negocio pre-despacho.
                + "where mt101_pay_dispatch_intent.status in ('REJECTED', 'INVALIDATED') "
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
                statement.setString(4, payloadHash);
                try (var rs = statement.executeQuery()) {
                    if (rs.next()) {
                        return ClaimResult.CLAIMED; // fila nueva o re-reclamo desde REJECTED (autocommit: durable)
                    }
                }
            }
            // Bloqueado: el ON CONFLICT no actualizó (estado no-REJECTED). Se compara la IDENTIDAD del pago
            // (payload_hash persistido vs el actual): mismo pago -> idempotente; pago DISTINTO bajo la misma clave ->
            // conflicto (no se reporta enviado). Un payload_hash persistido NULL (fila anterior a la identidad) NO se
            // puede probar igual -> conflicto seguro (nunca un accepted silencioso sin prueba).
            var existing = currentIntent(connection, dispatchKey);
            var samePayload = existing.payloadHash() != null && existing.payloadHash().equals(payloadHash);
            return switch (existing.status()) {
                case "SENT" -> samePayload ? ClaimResult.ALREADY_SENT : ClaimResult.ALREADY_SENT_CONFLICT;
                case "UNCERTAIN" -> samePayload ? ClaimResult.ALREADY_UNCERTAIN : ClaimResult.ALREADY_UNCERTAIN_CONFLICT;
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
    public boolean recordResult(String dispatchKey, String status, String gatewayReference, int attempts,
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
            // Devuelve si transicionó realmente desde DISPATCHING. 0 filas = otro flujo ya movió la intención a un
            // terminal (guardado: no se pisa) -> el llamador audita la anomalía (#9-equivalente del camino por lista).
            return statement.executeUpdate() == 1;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot record MT101 pay dispatch intent result for key " + dispatchKey, error);
        }
    }

    /**
     * Refuerzo del #9-equivalente (camino por lista): ESCALA un intent RE-RECLAMABLE ({@code REJECTED}/
     * {@code INVALIDATED}) a {@code UNCERTAIN} (no re-reclamable → BLOQUEA un re-envío a ciegas), cuando un envío que
     * pudo haber llegado al banco (accepted/uncertain) no pudo registrar su resultado porque otro flujo movió la
     * intención. Guardado: <b>solo desde REJECTED/INVALIDATED</b> — NO pisa {@code SENT} (ya bloquea, correcto) ni
     * {@code DISPATCHING} (en vuelo). Cierra la ventana teórica de doble pago; el operador concilia el UNCERTAIN.
     * Devuelve si escaló.
     */
    public boolean escalateToUncertainIfReclaimable(String dispatchKey, String reason) {
        var sql = "update mt101_pay_dispatch_intent set status = 'UNCERTAIN', error_message = ?, "
                + "updated_at = current_timestamp where dispatch_key = ? and status in ('REJECTED', 'INVALIDATED')";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, dispatchKey);
            return statement.executeUpdate() == 1;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot escalate MT101 pay dispatch intent to UNCERTAIN for key "
                    + dispatchKey, error);
        }
    }

    /** Estado + identidad (payload_hash) persistidos de la intención, para clasificar un claim bloqueado. */
    private IntentIdentity currentIntent(java.sql.Connection connection, String dispatchKey) throws SQLException {
        try (var statement = connection.prepareStatement(
                "select status, payload_hash from mt101_pay_dispatch_intent where dispatch_key = ?")) {
            statement.setString(1, dispatchKey);
            try (var rs = statement.executeQuery()) {
                if (rs.next()) {
                    return new IntentIdentity(rs.getString("status"), rs.getString("payload_hash"));
                }
                return new IntentIdentity("", null);
            }
        }
    }

    /** Estado terminal + hash del payload de una intención persistida (R1: para probar mismo-pago vs colisión). */
    private record IntentIdentity(String status, String payloadHash) {
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
                    // wasNull() refleja SIEMPRE la ultima columna leida: hay que capturarlo inmediatamente tras el
                    // getLong, antes de leer cualquier otra columna (si no, reflejaria la ultima y process_execution_id
                    // NULL se reportaria como 0). Igual, los timestamps se leen UNA vez (no dos por columna).
                    var peId = rs.getLong("process_execution_id");
                    var peIdNull = rs.wasNull();
                    var createdAt = rs.getTimestamp("created_at");
                    var updatedAt = rs.getTimestamp("updated_at");
                    result.add(new DispatchIntentRow(
                            rs.getString("dispatch_key"),
                            peIdNull ? null : peId,
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("gateway_reference"),
                            rs.getInt("attempts"),
                            rs.getString("error_message"),
                            createdAt == null ? null : createdAt.toInstant().toString(),
                            updatedAt == null ? null : updatedAt.toInstant().toString()));
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

    // ------------------------------------------------------------------
    // D2 (reconciliacion): cierra el lazo del ledger. En la topologia de lista, MT101_STATUS confirma inline el pago
    // (deja mt101_archive.status en el terminal ya CLASIFICADO por el pipeline, V17: PAY->SENT/REJECTED,
    // STATUS->CONFIRMED/REJECTED) pero NO toca el intent -> queda UNCERTAIN/DISPATCHING bloqueando el reenvio. Este
    // reconcile lee ese terminal autoritativo (join por (senders_reference, process_execution_id), indice V36) y
    // transiciona el intent. Nunca re-despacha ni re-consulta el gateway; sin match/terminal -> no-op (manual).
    // ------------------------------------------------------------------

    // Estados del archive (V17): PAY->SENT/REJECTED, STATUS->CONFIRMED/REJECTED, RECONCILE->RECONCILED/UNMATCHED.
    // SENT/CONFIRMED/RECONCILED = el pago llego al banco (RECONCILED = ademas liquidado). UNMATCHED/ARCHIVED/PENDING no
    // son terminales concluyentes -> no-op (manual).
    /** Estados terminales del archive que cuentan como "enviado" (el pago llego al banco). */
    private static final String ARCHIVE_SENT_STATUSES = "('SENT','CONFIRMED','RECONCILED')";
    private static final String ARCHIVE_REJECTED_STATUS = "REJECTED";

    /** Intencion atascada localizada por su clave, con lo necesario para el join al archive. Null si no esta atascada. */
    public StuckIntentRef findStuckByKey(String dispatchKey) {
        var sql = "select senders_reference, process_execution_id, status from mt101_pay_dispatch_intent "
                + "where dispatch_key = ? and status in " + STUCK_STATUSES;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, dispatchKey);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                var peId = rs.getLong("process_execution_id");
                var peIdNull = rs.wasNull();
                return new StuckIntentRef(rs.getString("senders_reference"),
                        peIdNull ? null : peId, rs.getString("status"));
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read MT101 pay dispatch intent " + dispatchKey, error);
        }
    }

    /**
     * Estado terminal ya clasificado del pago en {@code mt101_archive}, por {@code (senders_reference,
     * process_execution_id)} (indice V36). Devuelve {@code "SENT"} (archive SENT/CONFIRMED), {@code "REJECTED"}
     * (archive REJECTED) o {@code null} si no hay match o el archive aun no esta en un terminal (queda manual). Solo
     * lee el archive por defecto de la plataforma; tablas de archive por conexion no se cubren (no-op -> manual).
     */
    public String archiveTerminalStatus(String sendersReference, long processExecutionId) {
        var sql = "select case when status in " + ARCHIVE_SENT_STATUSES + " then 'SENT' "
                + "when status = '" + ARCHIVE_REJECTED_STATUS + "' then 'REJECTED' end as terminal "
                + "from mt101_archive where senders_reference = ? and process_execution_id = ? "
                + "and (status in " + ARCHIVE_SENT_STATUSES + " or status = '" + ARCHIVE_REJECTED_STATUS
                + "') order by id desc limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, sendersReference);
            statement.setLong(2, processExecutionId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString("terminal") : null;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read archive terminal status for " + sendersReference, error);
        }
    }

    /**
     * Transiciona la intencion atascada al terminal, SOLO desde {@code UNCERTAIN}/{@code DISPATCHING} (espejo de
     * {@link #recordResult}, que solo va desde DISPATCHING). El {@code evidence} (actor + motivo + terminal del
     * archive) queda durable en {@code error_message}. Devuelve las filas afectadas (0 si ya no estaba atascada).
     */
    public int reconcileToTerminal(String dispatchKey, String terminalStatus, String evidence) {
        var sql = "update mt101_pay_dispatch_intent set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where dispatch_key = ? and status in " + STUCK_STATUSES;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, terminalStatus);
            statement.setString(2, evidence);
            statement.setString(3, dispatchKey);
            return statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot reconcile MT101 pay dispatch intent " + dispatchKey, error);
        }
    }

    /** Intencion atascada localizada para el reconcile. */
    public record StuckIntentRef(String sendersReference, Long processExecutionId, String status) {
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
