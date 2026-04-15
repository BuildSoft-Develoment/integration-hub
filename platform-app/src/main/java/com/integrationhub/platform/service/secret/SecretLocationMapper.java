package com.integrationhub.platform.service.secret;

public interface SecretLocationMapper<T> {

    T map(String reference);
}
