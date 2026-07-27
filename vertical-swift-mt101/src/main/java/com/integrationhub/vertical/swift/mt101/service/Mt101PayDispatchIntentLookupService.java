package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.provider.Mt101PayDispatchIntentStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * D1 (visibilidad del PAY directo por lista): expone el ledger {@code mt101_pay_dispatch_intent} para que el operador
 * vea las intenciones de dispatch atascadas (UNCERTAIN / DISPATCHING), que bloquean el reenvío del pago "hasta
 * conciliar" y hoy eran invisibles (sin API/UI). Espejo de {@code Mt101FragmentLookupService} para el camino de lista.
 *
 * <p>Seam fino (SRP/DIP): valida entradas y delega la lectura en el {@link Mt101PayDispatchIntentStore}, dueño del SQL.
 * No hay ruteo por {@code connectionRef}: el ledger vive en la DB de la plataforma (dedup platform-side, V87).</p>
 */
@ApplicationScoped
public class Mt101PayDispatchIntentLookupService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 1000;

    private final Mt101PayDispatchIntentStore store;

    @Inject
    public Mt101PayDispatchIntentLookupService(Mt101PayDispatchIntentStore store) {
        this.store = store;
    }

    /** Conteo por estado de todo el ledger (para el resumen). */
    public List<Mt101PayDispatchIntentStore.StatusCount> statusCounts() {
        return store.statusCounts();
    }

    /** Conteo de intenciones atascadas (UNCERTAIN / DISPATCHING), para la alerta operativa. */
    public long stuckIntentCount() {
        return store.stuckIntentCount();
    }

    /**
     * Intenciones atascadas, más antiguas primero. {@code limit} se acota a [1, {@value #MAX_LIMIT}] (default
     * {@value #DEFAULT_LIMIT}) para no volcar el ledger completo.
     */
    public List<Mt101PayDispatchIntentStore.DispatchIntentRow> stuckIntents(Integer limit) {
        var effective = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        return store.stuckIntents(effective);
    }
}
