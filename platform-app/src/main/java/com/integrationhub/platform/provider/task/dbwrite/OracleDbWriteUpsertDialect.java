package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import jakarta.enterprise.context.ApplicationScoped;

/** {@code MERGE} de Oracle: el origen necesita {@code from dual} y la sentencia no lleva punto y coma. */
@ApplicationScoped
class OracleDbWriteUpsertDialect extends AbstractMergeDbWriteUpsertDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.ORACLE;
    }

    @Override
    protected String sourceFromClause() {
        return " from dual";
    }

    @Override
    protected String statementTerminator() {
        return "";
    }
}
