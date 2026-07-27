package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.spi.task.support.StoredProcedureRuntimeSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class OracleDatabaseFunctionDialect extends AbstractDatabaseFunctionDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.ORACLE;
    }

    @Override
    public String selectStatement(String functionName,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                  String resultAlias) {
        return selectScalarFunction(functionName, parameters, "\"" + sanitizeResultAlias(resultAlias) + "\"", " from dual");
    }
}
