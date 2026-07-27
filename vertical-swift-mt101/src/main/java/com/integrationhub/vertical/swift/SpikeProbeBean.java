package com.integrationhub.vertical.swift;

import jakarta.enterprise.context.ApplicationScoped;

/** SPIKE ADR-021: prueba que Quarkus descubre un bean CDI desde un modulo dependencia. */
@ApplicationScoped
public class SpikeProbeBean {
    public String marker() {
        return "vertical-module-discovered";
    }
}
