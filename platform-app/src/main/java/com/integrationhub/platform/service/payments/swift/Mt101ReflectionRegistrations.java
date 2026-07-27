package com.integrationhub.platform.service.payments.swift;


import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.vertical.swift.mt101.spi.ValidationIssue;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * ADR-021: registro de reflexion para la imagen NATIVA de los tipos del vertical SWIFT MT101.
 *
 * <p>Vive en el vertical, no en el registro central del motor: era el ultimo punto donde una
 * clase generica ({@code NativeReflectionRegistrations}) importaba clases de un vertical, y con
 * eso el motor no compilaba sin el. Cada vertical registra lo suyo.</p>
 *
 * <p>Los comentarios de cada entrada documentan el incidente que la hizo necesaria: son tipos que
 * Jackson (de)serializa <b>fuera</b> de la capa REST, que Quarkus no auto-registra, y cuya falta
 * solo se manifiesta en runtime nativo (nunca en JVM). No borrar sin evidencia.</p>
 */
@RegisterForReflection(targets = {
        // Cuarentena MT101: Mt101QuarantineResource#stagingRow devuelve jakarta.ws.rs.core.Response
        // (untyped) -> Quarkus NO auto-registra el DTO y en nativo el GET da 500
        // ("No serializer found for StagingRowView") => el operador no puede ni LEER la fila para
        // corregirla. Mismo patron que BrandingResponse. Cazado en el e2e de cuarentena 2026-07-14.
        com.integrationhub.platform.service.payments.swift.Mt101StagingCorrectionService.StagingRowView.class,
        com.integrationhub.platform.service.payments.swift.Mt101StagingCorrectionService.CorrectionResult.class,
        // MT101_VALIDATE mete las issues en outputs["errors"] y el motor serializa los outputs
        // de la tarea con Jackson. Sin registrar, en nativo falla "No serializer found for
        // ValidationIssue" -> la tarea revienta. OJO: solo se manifiesta cuando HAY errores de
        // validacion (con datos limpios la lista va vacia) -> cazado en el e2e de 10k con 100
        // filas malas (2026-07-14). El enum anidado Severity tambien va.
        ValidationIssue.class,
        ValidationIssue.Severity.class,
        // Money-path MT101: Mt101RouteTaskProvider convierte el mensaje a Map via Jackson
        Mt101Message.class,
        Mt101Message.Envelope.class,
        Mt101Message.SequenceA.class,
        Mt101Message.Transaction.class,
        Mt101Message.Amount.class,
        Mt101Message.Party.class,
        Mt101Message.ControlTotals.class,
})
public final class Mt101ReflectionRegistrations {

    private Mt101ReflectionRegistrations() {
    }
}
