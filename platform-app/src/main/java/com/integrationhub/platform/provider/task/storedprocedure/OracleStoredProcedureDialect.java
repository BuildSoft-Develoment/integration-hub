package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.spi.task.support.StoredProcedureRuntimeSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
class OracleStoredProcedureDialect extends AbstractStoredProcedureDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.ORACLE;
    }

    @Override
    public String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return positionalCallStatement(procedureName, parameters);
    }
}
