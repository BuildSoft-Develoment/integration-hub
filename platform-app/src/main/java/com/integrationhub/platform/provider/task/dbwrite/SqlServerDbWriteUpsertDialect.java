package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * {@code MERGE} de SQL Server: admite un SELECT sin FROM como origen, pero exige que la sentencia
 * termine en punto y coma — sin el, el motor responde con un error de sintaxis.
 */
@ApplicationScoped
class SqlServerDbWriteUpsertDialect extends AbstractMergeDbWriteUpsertDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.SQLSERVER;
    }

    @Override
    protected String sourceFromClause() {
        return "";
    }

    @Override
    protected String statementTerminator() {
        return ";";
    }
}
