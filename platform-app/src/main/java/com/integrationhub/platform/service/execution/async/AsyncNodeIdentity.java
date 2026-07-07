package com.integrationhub.platform.service.execution.async;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

/**
 * Identidad del nodo consumidor async (ADR-015 §5). Fuente ÚNICA del {@code owner} del claim distribuido: el
 * {@link AsyncTaskConsumer} reclama con este id y el {@link JpaTaskInboxStore}/{@code SliceGatherService}
 * <b>finalizan</b> el claim exigiendo el MISMO owner (fencing). Al ser {@code @ApplicationScoped}, todos los
 * colaboradores de una misma JVM comparten el id; un nodo con el lease vencido y re-reclamado por otro NO puede
 * finalizar la fila ajena (su owner ya no coincide).
 *
 * <p>Un id por proceso (JVM). No se persiste: sobrevive lo que dure el nodo, que es justo el alcance de un lease.</p>
 */
@ApplicationScoped
public class AsyncNodeIdentity {

    private final String id = "inbox-" + UUID.randomUUID();

    /** Identificador estable del nodo para el owner del claim/finalize. */
    public String id() {
        return id;
    }
}
