package com.integrationhub.platform.service.secret;

import java.util.Optional;

public interface SecretValueProvider {

    boolean supports(String source);

    Optional<String> resolve(String reference);
}
