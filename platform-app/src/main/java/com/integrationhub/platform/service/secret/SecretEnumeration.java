package com.integrationhub.platform.service.secret;

// @trace ADR-031 D3, D5 (lo que hay, y si es todo lo que hay)

import java.util.List;

/**
 * Lo que una fuente pudo enumerar, y si eso es todo.
 *
 * <p><b>Por que {@code complete} no es opcional.</b> Una lista recortada y una lista completa se ven
 * exactamente igual desde la pantalla: las dos son "estos son los secretos". Si el recorrido topa
 * con su tope y nadie lo dice, la interfaz afirma en silencio que ha ensenado todo cuando no es
 * cierto, y quien no encuentre su secreto en la lista concluira que no existe. Decirlo cuesta un
 * booleano.</p>
 *
 * @param entries  los secretos hallados, sin un solo valor (ADR-031 D5)
 * @param complete {@code false} si el recorrido se corto por sus topes
 */
public record SecretEnumeration(List<SecretEntry> entries, boolean complete) {

    public SecretEnumeration {
        entries = entries == null ? List.of() : List.copyOf(entries);
    }

    /**
     * Nada que ofrecer, y no por haberse cortado.
     *
     * <p>Es lo que devuelve quien no sabe enumerar —la mayoria— y quien sabe pero no esta
     * configurado. En los dos casos la interfaz degrada a escritura manual (ADR-031 D2), que es un
     * resultado valido y no un fallo.</p>
     */
    public static SecretEnumeration vacia() {
        return new SecretEnumeration(List.of(), true);
    }
}
