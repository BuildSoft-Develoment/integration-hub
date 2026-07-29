package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

/**
 * {@code INSERT ... ON DUPLICATE KEY UPDATE} de MySQL.
 *
 * <p><b>Diferencia de semantica que hay que conocer:</b> MySQL no acepta que se le diga sobre que
 * columnas es el conflicto — dispara la rama de actualizacion ante <em>cualquier</em> indice unico o
 * clave primaria de la tabla. Si la tabla destino tiene mas de un indice unico, un choque en uno
 * distinto del declarado tambien actualiza. Los {@code keyColumns} declarados se siguen validando
 * arriba (deben existir entre las asignaciones) y aqui solo se usan para el caso "no actualices
 * nada", pero no acotan el conflicto como si hacen PostgreSQL, Oracle y SQL Server.
 *
 * <p>Se emite {@code values(columna)} en vez de la forma con alias de fila ({@code new.columna}):
 * la primera funciona desde MySQL 5.7 hasta 8.4 — esta marcada como obsoleta desde 8.0.20 pero sigue
 * operativa — mientras que la segunda solo existe a partir de 8.0.19. Como el motor del cliente es
 * una incognita, se prefiere la forma que cubre mas versiones.
 */
@ApplicationScoped
class MySqlDbWriteUpsertDialect implements DbWriteUpsertDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.MYSQL;
    }

    @Override
    public String upsertStatement(String targetTable,
                                  List<String> insertColumns,
                                  List<String> valueExpressions,
                                  List<String> keyColumns,
                                  List<String> updateColumns) {
        // MySQL no tiene equivalente a `do nothing`: se asigna una clave a si misma, que es un no-op
        // aceptado por el motor y deja la fila existente intacta.
        var firstKey = keyColumns.get(0);
        var assignments = updateColumns.isEmpty()
                ? firstKey + " = " + firstKey
                : String.join(", ", updateColumns.stream()
                        .map(column -> column + " = values(" + column + ")").toList());

        return "insert into " + targetTable + " (" + String.join(", ", insertColumns) + ") values ("
                + String.join(", ", valueExpressions) + ") on duplicate key update " + assignments;
    }
}
