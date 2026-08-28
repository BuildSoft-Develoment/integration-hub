package com.integrationhub.platform.api.response.secret;

import java.util.List;

/**
 * Un secreto que existe: donde esta y como se llaman sus campos. Nunca lo que vale (ADR-031 D5).
 *
 * @param path   ruta en la boveda, p.ej. {@code connections/db/ih-internal}
 * @param fields nombres de sus campos. Vacio si este despliegue puede listar el arbol pero no leer
 *               {@code subkeys}: la ruta sirve igual y el campo se escribe a mano
 */
public record SecretEntryResponse(String path, List<String> fields) {
}
