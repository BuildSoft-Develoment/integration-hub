package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
class SqlServerStoredProcedureDialect extends AbstractStoredProcedureDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.SQLSERVER;
    }

    @Override
    public String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return positionalCallStatement(procedureName, parameters);
    }
}
