package com.integrationhub.platform.api.response.secret;

import java.util.List;

public record SecretSourceCatalogResponse(List<SecretSourceResponse> sources) {
}
