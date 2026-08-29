package com.integrationhub.platform.service.secret;

// @trace ADR-031 D4, D5 (rutas y nombres de campo; jamas valores)

import java.util.List;

/**
 * Un secreto que existe, dicho sin decir lo que vale.
 *
 * <p><b>Aqui no cabe un valor, y es a proposito.</b> El record tiene exactamente dos componentes y
 * ninguno los admite. ADR-031 D5 exige que el endpoint devuelva rutas y nombres de campo y jamas
 * valores; hacerlo imposible por el tipo es mas fuerte que confiar en que nadie lo anada, porque el
 * refactor de dentro de dos anos no lee el ADR pero si tiene que compilar.</p>
 *
 * @param path   la ruta del secreto en la boveda, p.ej. {@code connections/db/ih-internal}
 * @param fields los nombres de sus campos, p.ej. {@code [username, password]}. Vacio cuando este
 *               despliegue puede listar el arbol pero no leer {@code subkeys} —le faltan las dos
 *               lineas de politica de D4—: la ruta sirve igual, y el campo se escribe a mano
 */
public record SecretEntry(String path, List<String> fields) {

    public SecretEntry {
        fields = fields == null ? List.of() : List.copyOf(fields);
    }

    /** La referencia completa que se escribe en el campo: <code>${source:path/field}</code>. */
    public String referenceFor(String source, String field) {
        return "${" + source + ":" + path + "/" + field + "}";
    }
}
