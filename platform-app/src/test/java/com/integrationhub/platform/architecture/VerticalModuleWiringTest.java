package com.integrationhub.platform.architecture;

import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.vertical.swift.mt101.repository.Mt101ConfirmationRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-021 parte 2: el vertical vive en su propio modulo Maven y sus beans se descubren por CDI
 * cross-modulo (indice Jandex). Sin esto los TaskProvider del vertical no se registrarian y el
 * motor quedaria sin sus tipos — un fallo silencioso en arranque, no un error de compilacion.
 *
 * <p>Reemplaza al spike con bean de juguete: ahora verifica codigo real del vertical.</p>
 */
// @covers ADR-021
@QuarkusTest
class VerticalModuleWiringTest {

    @Inject
    Mt101ConfirmationRepository repositoryFromVerticalModule;

    @Inject
    TaskProviderRegistry taskProviders;

    @Test
    void seInyectaUnBeanDelModuloVertical() {
        assertNotNull(repositoryFromVerticalModule,
                "un bean del modulo vertical debe resolverse por CDI cross-modulo");
    }

    @Test
    void losTiposDelVerticalSiguenRegistradosEnElMotor() {
        // El motor no los conoce por codigo: los descubre. Si el indice del modulo fallara, esta
        // lista quedaria sin los MT101_* y el fallo recien se veria al ejecutar un proceso.
        var tipos = taskProviders.availableTaskTypes();
        assertTrue(tipos.contains("MT101_PAY"), "falta MT101_PAY; tipos: " + tipos);
        assertTrue(tipos.contains("MT101_VALIDATE"), "falta MT101_VALIDATE; tipos: " + tipos);
    }
}
