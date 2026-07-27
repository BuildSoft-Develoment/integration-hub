package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.vertical.swift.mt101.service.Mt101StagingCorrectionService;
import com.integrationhub.vertical.swift.mt101.service.Mt101ReflectionRegistrations;


import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.vertical.swift.mt101.spi.ValidationIssue;
import io.quarkus.runtime.annotations.RegisterForReflection;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-021: guard de las registraciones de reflexion del vertical MT101.
 *
 * <p>Estas entradas solo se manifiestan en runtime NATIVO: en JVM (y por lo tanto en dev y en
 * cualquier test que no sea nativo) son inertes, asi que borrar una no rompe nada visible hasta
 * que el binario nativo falla en produccion con {@code No serializer found}. Cada una costo un
 * incidente (ver los comentarios de {@link Mt101ReflectionRegistrations}).</p>
 *
 * <p>Este test no prueba que GraalVM las use — eso solo lo prueba el build nativo. Prueba que
 * SIGAN DECLARADAS, que es lo que se pierde en un refactor distraido.</p>
 */
// @covers ADR-021
class Mt101ReflectionRegistrationsTest {

    /** Los tipos que Jackson (de)serializa fuera de JAX-RS y que Quarkus no auto-registra. */
    private static final List<Class<?>> REQUIRED_TARGETS = List.of(
            Mt101StagingCorrectionService.StagingRowView.class,
            Mt101StagingCorrectionService.CorrectionResult.class,
            ValidationIssue.class,
            ValidationIssue.Severity.class,
            Mt101Message.class,
            Mt101Message.Envelope.class,
            Mt101Message.SequenceA.class,
            Mt101Message.Transaction.class,
            Mt101Message.Amount.class,
            Mt101Message.Party.class,
            Mt101Message.ControlTotals.class);

    @Test
    void elVerticalRegistraSusTiposParaLaImagenNativa() {
        var annotation = Mt101ReflectionRegistrations.class.getAnnotation(RegisterForReflection.class);
        assertNotNull(annotation, "Mt101ReflectionRegistrations debe declarar @RegisterForReflection");

        Set<Class<?>> declared = Set.of(annotation.targets());
        for (var required : REQUIRED_TARGETS) {
            assertTrue(declared.contains(required),
                    "falta registrar para reflexion: " + required.getName()
                            + " — en nativo Jackson fallara con 'No serializer found'");
        }
    }

    @Test
    void elRegistroCentralDelMotorYaNoNombraAlVertical() {
        // ADR-021: si alguien vuelve a meter un tipo del vertical en el registro del motor, el
        // motor deja de compilar sin el vertical. El trinquete de ArchUnit lo cubre por
        // dependencias; esto lo deja explicito y con el mensaje del porque.
        var central = com.integrationhub.platform.service.NativeReflectionRegistrations.class
                .getAnnotation(RegisterForReflection.class);
        assertNotNull(central);
        var offenders = Arrays.stream(central.targets())
                .filter(target -> target.getName().contains(".payments."))
                .map(Class::getName)
                .toList();
        assertTrue(offenders.isEmpty(),
                "el registro central del motor no debe nombrar tipos de un vertical "
                        + "(van en el registro del propio vertical): " + offenders);
    }
}
