package com.integrationhub.platform.provider.task.dbwrite;

import java.util.ArrayList;
import java.util.List;

/**
 * Base para los motores que expresan el upsert con {@code MERGE} (Oracle y SQL Server).
 *
 * <p>La fila entrante se materializa una sola vez en la sub-consulta {@code using} y las ramas
 * matched/not-matched la referencian por alias. Eso es lo que mantiene el contrato de binding de
 * {@link DbWriteUpsertDialect}: un parametro por cada {@code "?"}, en orden, sin repeticiones.
 *
 * <p>Las columnas clave nunca aparecen en el {@code update set}: quien construye la peticion ya las
 * excluye, y Oracle ademas prohibe actualizar una columna usada en la clausula {@code ON}.
 */
abstract class AbstractMergeDbWriteUpsertDialect implements DbWriteUpsertDialect {

    /** Oracle exige un origen de filas ({@code from dual}); SQL Server admite un SELECT sin FROM. */
    protected abstract String sourceFromClause();

    /** SQL Server exige terminar la sentencia MERGE en punto y coma; Oracle no lo admite via JDBC. */
    protected abstract String statementTerminator();

    @Override
    public String upsertStatement(String targetTable,
                                  List<String> insertColumns,
                                  List<String> valueExpressions,
                                  List<String> keyColumns,
                                  List<String> updateColumns) {
        var sourceColumns = new ArrayList<String>(insertColumns.size());
        for (var index = 0; index < insertColumns.size(); index++) {
            sourceColumns.add(valueExpressions.get(index) + " " + insertColumns.get(index));
        }
        var onClause = String.join(" and ", keyColumns.stream()
                .map(column -> "tgt." + column + " = src." + column).toList());
        var insertClause = " when not matched then insert (" + String.join(", ", insertColumns)
                + ") values (" + String.join(", ", insertColumns.stream()
                        .map(column -> "src." + column).toList()) + ")";
        var updateClause = updateColumns.isEmpty()
                ? ""
                : " when matched then update set " + String.join(", ", updateColumns.stream()
                        .map(column -> "tgt." + column + " = src." + column).toList());

        return "merge into " + targetTable + " tgt using (select "
                + String.join(", ", sourceColumns) + sourceFromClause() + ") src on ("
                + onClause + ")" + updateClause + insertClause + statementTerminator();
    }
}
