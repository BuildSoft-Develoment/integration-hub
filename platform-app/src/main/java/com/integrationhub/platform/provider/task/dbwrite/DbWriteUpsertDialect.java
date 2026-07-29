package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;

import java.util.List;

/**
 * Sentencia de upsert por motor para DB_WRITE.
 *
 * <p>Hasta ADR-022 el upsert se emitia siempre como {@code on conflict ... do update set ... excluded.x},
 * sintaxis exclusiva de PostgreSQL: contra Oracle, SQL Server o MySQL la tarea reventaba con error de
 * sintaxis en ejecucion. Cada motor expresa la misma intencion de forma distinta y no hay denominador
 * comun portable, asi que la sentencia se delega a un dialecto igual que en SP y FN.
 *
 * <p><b>Contrato de binding (invariante que sostiene el diseno):</b> la sentencia debe consumir
 * exactamente un parametro por cada columna de {@code valueExpressions} igual a {@code "?"}, en ese
 * mismo orden y una sola vez. Los dialectos MERGE lo cumplen tomando la fila de una sub-consulta
 * {@code using} y refiriendose a ella por alias en las ramas matched/not-matched, en vez de repetir
 * los parametros. Asi el repositorio bindea igual para los cuatro motores.
 */
public interface DbWriteUpsertDialect {

    ConnectionType connectionType();

    /**
     * @param targetTable      tabla destino, ya saneada por el llamante
     * @param insertColumns    columnas a insertar, en orden
     * @param valueExpressions una entrada por columna de {@code insertColumns}: {@code "?"} para un
     *                         valor bindeado, o la expresion SQL literal si la columna se rellena con
     *                         una funcion de base de datos configurada por el usuario
     * @param keyColumns       columnas que identifican el conflicto (nunca vacia)
     * @param updateColumns    columnas a actualizar cuando la fila ya existe; vacia significa
     *                         "insertar si no existe, y si existe no tocar nada"
     */
    String upsertStatement(String targetTable,
                           List<String> insertColumns,
                           List<String> valueExpressions,
                           List<String> keyColumns,
                           List<String> updateColumns);
}
