package com.integrationhub.platform.api.request.process;

import java.util.List;
import java.util.Map;

public record ProcessExecutionRequest(
        Map<String, String> executionVariables,
        List<String> selectedFiles,
        Long sourceExecutionId
) {
}
