package com.integrationhub.platform.provider.task;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.Collections;
import java.util.List;

@ApplicationScoped
class GenericStoredProcedureDialect implements StoredProcedureDialect {

    @Override
    public boolean supports(String databaseProductName) {
        return true;
    }

    @Override
    public String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        var placeholders = parameters.isEmpty() ? "" : String.join(", ", Collections.nCopies(parameters.size(), "?"));
        return "{ call " + procedureName + "(" + placeholders + ") }";
    }
}