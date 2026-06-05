package com.integrationhub.platform.provider.task.http;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;

/**
 * Cubre el authType {@code login-request} (token de dos pasos) y la extraccion por tokenPath.
 * Ver ADR-005.
 */
class HttpRequestSupportLoginTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void extractsTokenFromSimplePath() {
        String token = HttpRequestSupport.extractToken(mapper, "{\"access_token\":\"abc-123\"}", "$.access_token");
        assertEquals("abc-123", token);
    }

    @Test
    void extractsTokenFromNestedPath() {
        String token = HttpRequestSupport.extractToken(mapper, "{\"data\":{\"token\":\"nested-xyz\"}}", "$.data.token");
        assertEquals("nested-xyz", token);
    }

    @Test
    void failsWhenTokenPathMissing() {
        assertThrows(IllegalStateException.class,
                () -> HttpRequestSupport.extractToken(mapper, "{\"other\":\"x\"}", "$.access_token"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void loginRequestFetchesTokenAndInjectsBearer() throws Exception {
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String> loginResponse = mock(HttpResponse.class);
        doReturn(200).when(loginResponse).statusCode();
        doReturn("{\"access_token\":\"tok-from-login\"}").when(loginResponse).body();
        doReturn(loginResponse).when(client).send(any(HttpRequest.class), any());

        Map<String, Object> config = new LinkedHashMap<>();
        config.put("authType", "login-request");
        config.put("loginUrl", "https://auth.example.com/oauth/token");
        config.put("loginMethod", "POST");
        config.put("loginBodyTemplate", "{\"grant_type\":\"client_credentials\"}");
        config.put("tokenPath", "$.access_token");

        HttpRequest request = HttpRequestSupport.build(client, mapper, config, "POST",
                "https://api.example.com/resource", "{\"id\":1}", 20, Map.of());

        assertTrue(request.headers().firstValue("Authorization").isPresent());
        assertEquals("Bearer tok-from-login", request.headers().firstValue("Authorization").get());
    }

    @Test
    void bearerAuthWorksWithoutClient() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("authType", "bearer");
        config.put("token", "static-token");

        HttpRequest request = HttpRequestSupport.build(config, "POST", "https://api.example.com", "{}", 20, Map.of());

        assertEquals("Bearer static-token", request.headers().firstValue("Authorization").orElse(""));
    }
}
