package com.integrationhub.platform.service.execution.async;

import java.util.List;
import java.util.Map;

public record QueuedProcessExecutionPayload(
        Map<String, String> executionVariables,
        List<String> selectedFiles
) {
}
