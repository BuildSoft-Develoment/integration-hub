package com.integrationhub.platform.service.execution.async;

import io.smallrye.reactive.messaging.annotations.Blocking;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * P0-1 (blindaje de invariante): el consumer del canal {@code tasks-in} DEBE procesar de forma serializada por nodo
 * ({@code @Blocking(ordered = true)}). De esa serialización depende la seguridad del claim {@code same-owner} del
 * {@code task_inbox}: con procesamiento paralelo (ordered=false), dos entregas del mismo {@code idempotency_key} en el
 * mismo nodo matcharían el mismo owner y ejecutarían el efecto externo DOS veces (doble-pago en el money-path).
 *
 * <p>Este test falla si alguien cambia {@code ordered} a false (regresión silenciosa). Subir la concurrencia EXIGE
 * antes volver el claim seguro ante concurrencia (fencing token por-entrega o claim-una-vez fuera del retry).</p>
 */
class AsyncTaskBrokerConsumerOrderingTest {

    @Test
    void consumeMustBeBlockingAndOrdered() throws NoSuchMethodException {
        Method consume = AsyncTaskBrokerConsumer.class.getDeclaredMethod("consume", Message.class);
        Blocking blocking = consume.getAnnotation(Blocking.class);

        assertNotNull(blocking, "AsyncTaskBrokerConsumer.consume debe ser @Blocking (offload del handler bloqueante)");
        assertTrue(blocking.ordered(),
                "INVARIANTE P0-1: ordered debe ser true; ordered=false reabre la ventana de doble-efecto del claim "
                        + "same-owner. Volver el claim seguro ante concurrencia antes de cambiarlo.");
        assertEquals("async-task-worker-pool", blocking.value(),
                "el consumer usa su pool bloqueante dedicado (exclusivo, max-concurrency=1)");
    }

    @Test
    void blockingDefaultIsOrderedTrue() throws NoSuchMethodException {
        // Linchpin del analisis P0-1: el @Blocking("...") original (sin ordered explicito) ya era ordered=true, por lo
        // que el canal SIEMPRE fue serial (nunca hubo doble-efecto). Si este default fuese false, el analisis "no
        // alcanzable" seria erroneo. Se verifica el default real de la anotacion de SmallRye.
        Object def = Blocking.class.getDeclaredMethod("ordered").getDefaultValue();
        assertEquals(Boolean.TRUE, def,
                "el default de @Blocking.ordered() debe ser true (base de la serializacion del canal)");
    }
}
