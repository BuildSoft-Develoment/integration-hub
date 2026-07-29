package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

/** {@code INSERT ... ON CONFLICT}, nativo desde PostgreSQL 9.5. */
@ApplicationScoped
class PostgreSqlDbWriteUpsertDialect implements DbWriteUpsertDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.POSTGRESQL;
    }

    @Override
    public String upsertStatement(String targetTable,
                                  List<String> insertColumns,
                                  List<String> valueExpressions,
                                  List<String> keyColumns,
                                  List<String> updateColumns) {
        var updateClause = updateColumns.isEmpty()
                ? " do nothing"
                : " do update set " + String.join(", ", updateColumns.stream()
                        .map(column -> column + " = excluded." + column).toList());
        return "insert into " + targetTable + " (" + String.join(", ", insertColumns) + ") values ("
                + String.join(", ", valueExpressions) + ") on conflict ("
                + String.join(", ", keyColumns) + ")" + updateClause;
    }
}
