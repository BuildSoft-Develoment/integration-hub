package com.integrationhub.platform.api.response.secret;

import java.util.List;

/**
 * Los secretos de una fuente.
 *
 * @param source   el prefijo por el que se pregunto, p.ej. {@code vaultkv}
 * @param entries  lo hallado, ordenado por ruta. Vacio si la fuente no existe aqui, no esta
 *                 disponible o no sabe enumerarse: los tres casos significan lo mismo para la
 *                 pantalla —no hay nada que ofrecer— y responder distinto convertiria esto en un
 *                 detector de que proveedores tiene montados la maquina
 * @param complete {@code false} si el recorrido se corto por sus topes. Una lista recortada y una
 *                 completa se ven igual desde la pantalla; sin esto, la interfaz afirmaria en
 *                 silencio haber ensenado todo
 */
public record SecretEnumerationResponse(String source, List<SecretEntryResponse> entries, boolean complete) {
}
