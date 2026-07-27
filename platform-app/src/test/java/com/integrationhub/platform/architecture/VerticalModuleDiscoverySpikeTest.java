package com.integrationhub.platform.architecture;

import com.integrationhub.vertical.swift.SpikeProbeBean;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * SPIKE ADR-021 parte 2: verifica que Quarkus descubre beans CDI de un MODULO DEPENDENCIA
 * (via indice Jandex). Es el prerequisito de mover el vertical a su propio modulo: sin esto,
 * los TaskProvider del vertical no se registrarian y el motor quedaria sin sus tipos.
 */
// @covers ADR-021
@QuarkusTest
class VerticalModuleDiscoverySpikeTest {

    @Inject
    SpikeProbeBean probe;

    @Test
    void quarkusDescubreBeansDelModuloVertical() {
        assertNotNull(probe, "el bean del modulo dependencia debe inyectarse");
        assertEquals("vertical-module-discovered", probe.marker());
    }
}
