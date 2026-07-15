package com.integrationhub.platform.provider.task.payments.swift.transport;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.equalToIgnoreCase;
import static com.github.tomakehurst.wiremock.client.WireMock.equalToJson;
import static com.github.tomakehurst.wiremock.client.WireMock.getAllServeEvents;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.reset;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-004, RF-016, T-009
 *
 * <p>Usa WireMock 3.x via la extension JUnit5 {@code @WireMockTest}. La extension
 * arranca un servidor WireMock en un puerto aleatorio antes de cada test y lo
 * detiene al final, exponiendo el puerto via {@link WireMockRuntimeInfo}.</p>
 */
@WireMockTest
class RestPaymentTransportTest {

    private RestPaymentTransport transport;

    @BeforeEach
    void setUp() {
        transport = new RestPaymentTransport(new ObjectMapper());
        reset();
    }

    @Test
    void postsRawPayloadWithIdempotencyKey(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"accepted\":true,\"gatewayReference\":\"GW-123\"}")));

        var message = sampleMessage("PROC-42", "uetr-1");
        var configuration = restConfiguration(wm.getHttpBaseUrl() + "/v1/swift/mt101", null);
        var result = transport.send(message, configuration);

        assertTrue(result.accepted());
        assertEquals("GW-123", result.gatewayReference());
        assertEquals(1, result.attempts());

        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Content-Type", equalTo("application/json"))
                .withHeader("Idempotency-Key", equalTo("PROC-42"))
                .withRequestBody(equalToJson(message.rawPayload())));
    }

    @Test
    void appliesCustomIdempotencyTemplateAndExtraHeaders(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        var message = sampleMessage("REF-99", "uetr-99");
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("idempotencyKeyTemplate", "X-${sendersReference}-${uetr}");
        configuration.put("rest", Map.of(
                "url", wm.getHttpBaseUrl() + "/v1/swift/mt101",
                "extraHeaders", Map.of("X-Origin", "integration-hub")
        ));
        transport.send(message, configuration);

        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Idempotency-Key", equalTo("X-REF-99-uetr-99"))
                .withHeader("X-Origin", equalTo("integration-hub")));
    }

    @Test
    void sendsBearerAuthorizationHeader(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of(
                "url", wm.getHttpBaseUrl() + "/v1/swift/mt101",
                "authType", "bearer",
                "token", "token-123"
        ));
        configuration.put("retryPolicy", Map.of("maxRetries", 0));

        var result = transport.send(sampleMessage("PROC-BEARER", "u"), configuration);

        assertTrue(result.accepted());
        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Authorization", equalTo("Bearer token-123")));
    }

    @Test
    void readTimeoutYieldsUncertainNotRejected(WireMockRuntimeInfo wm) {
        // El gateway tarda mas que el timeout: la peticion salio pero no hubo respuesta clara.
        stubFor(any(anyUrl()).willReturn(aResponse()
                .withFixedDelay(3000)
                .withStatus(200)
                .withBody("{\"accepted\":true}")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of(
                "url", wm.getHttpBaseUrl() + "/v1/swift/mt101",
                "timeoutSeconds", 1));
        configuration.put("retryPolicy", Map.of("maxRetries", 0));

        var result = transport.send(sampleMessage("PROC-TO", "u"), configuration);

        assertFalse(result.accepted());
        assertTrue(result.uncertain(), "un timeout de lectura es INCIERTO, no un rechazo");
        assertTrue(result.lastError().contains("timeout"));
    }

    @Test
    void aReadTimeoutFollowedByABusinessRejectionStaysUncertain_sticky(WireMockRuntimeInfo wm) {
        // tanda-5 (STICKY, money-safety): intento 1 = read timeout (la peticion salio, el gateway pudo recibirla) ->
        // INCIERTO; intento 2 = HTTP 400 (rechazo de negocio, no se reintenta en 4xx). El agregado NUNCA debe bajar a
        // rejected: reportar rechazo permitiria re-solicitar/reusar un pago que pudo haber llegado (doble pago). Debe
        // quedar INCIERTO. Antes del fix, la salida 4xx inline devolvia rejected ignorando el uncertain previo.
        stubFor(any(anyUrl()).inScenario("sticky-uncertain")
                .whenScenarioStateIs(com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED)
                .willReturn(aResponse().withFixedDelay(3000).withStatus(200).withBody("{\"accepted\":true}"))
                .willSetStateTo("after-timeout"));
        stubFor(any(anyUrl()).inScenario("sticky-uncertain")
                .whenScenarioStateIs("after-timeout")
                .willReturn(aResponse().withStatus(400).withBody("business rejected")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of("url", wm.getHttpBaseUrl() + "/v1/mt101", "timeoutSeconds", 1));
        configuration.put("retryPolicy", Map.of(
                "maxRetries", 1, "backoffStrategy", "constant", "initialBackoffSeconds", 0, "maxBackoffSeconds", 0,
                "retryOn", List.of("TIMEOUT")));

        var result = transport.send(sampleMessage("STICKY-REST", "u"), configuration);

        assertFalse(result.accepted());
        assertTrue(result.uncertain(),
                () -> "un timeout previo (pudo llegar) NO se degrada a rechazo por un 400 posterior: " + result.lastError());
        assertFalse(result.retriable(), "no es re-solicitable: pudo haber llegado al banco (evita doble pago)");
        assertEquals(2, getAllServeEvents().size(), "2 intentos: timeout + 400");
    }

    @Test
    void performsLoginRequestAndUsesReturnedBearerToken(WireMockRuntimeInfo wm) {
        stubFor(any(urlEqualTo("/oauth/token")).willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"data\":{\"token\":\"login-token\"}}")));
        stubFor(any(urlEqualTo("/v1/swift/mt101")).willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"accepted\":true}")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of(
                "url", wm.getHttpBaseUrl() + "/v1/swift/mt101",
                "authType", "login-request",
                "loginUrl", wm.getHttpBaseUrl() + "/oauth/token",
                "loginMethod", "POST",
                "loginHeaders", Map.of("X-Api-Key", "key-123"),
                "loginBodyTemplate", "grant_type=client_credentials",
                "tokenPath", "$.data.token"
        ));
        configuration.put("retryPolicy", Map.of("maxRetries", 0));

        var result = transport.send(sampleMessage("PROC-LOGIN", "u"), configuration);

        assertTrue(result.accepted());
        verify(postRequestedFor(urlEqualTo("/oauth/token"))
                .withHeader("X-Api-Key", equalTo("key-123"))
                .withRequestBody(equalTo("grant_type=client_credentials")));
        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Authorization", equalTo("Bearer login-token")));
    }

    @Test
    void retriesOnFiveXxUntilSuccess(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl())
                .inScenario("retry-5xx")
                .whenScenarioStateIs(com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED)
                .willReturn(aResponse().withStatus(503).withBody("unavailable"))
                .willSetStateTo("second-attempt"));
        stubFor(any(anyUrl())
                .inScenario("retry-5xx")
                .whenScenarioStateIs("second-attempt")
                .willReturn(aResponse().withStatus(503).withBody("still unavailable"))
                .willSetStateTo("third-attempt"));
        stubFor(any(anyUrl())
                .inScenario("retry-5xx")
                .whenScenarioStateIs("third-attempt")
                .willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true,\"gatewayReference\":\"OK\"}")));

        var configuration = restConfiguration(wm.getHttpBaseUrl() + "/v1/svc", Map.of(
                "maxRetries", 5,
                "backoffStrategy", "constant",
                "initialBackoffSeconds", 0,
                "maxBackoffSeconds", 0,
                "retryOn", List.of("5xx")
        ));
        var result = transport.send(sampleMessage("PROC-X", "u"), configuration);

        assertTrue(result.accepted());
        assertEquals(3, result.attempts());
        assertEquals("OK", result.gatewayReference());
        assertEquals(3, getAllServeEvents().size());
    }

    @Test
    void doesNotRetryOnClientError(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(400).withBody("bad request")));

        var configuration = restConfiguration(wm.getHttpBaseUrl() + "/v1/svc", Map.of(
                "maxRetries", 3,
                "initialBackoffSeconds", 0,
                "retryOn", List.of("5xx")
        ));
        var result = transport.send(sampleMessage("PROC-Y", "u"), configuration);

        assertFalse(result.accepted());
        assertEquals(1, result.attempts());
        assertTrue(result.lastError().contains("HTTP 400"));
        assertEquals(1, getAllServeEvents().size(), "no debe reintentar en 4xx");
    }

    @Test
    void treatsExplicitGatewayFalseAsRejected(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"accepted\":false,\"error\":{\"message\":\"DUP\"}}")));

        var configuration = restConfiguration(wm.getHttpBaseUrl() + "/v1/svc", Map.of(
                "maxRetries", 0,
                "retryOn", List.of()
        ));
        var result = transport.send(sampleMessage("PROC-Z", "u"), configuration);

        assertFalse(result.accepted());
        assertNotNull(result.lastError());
        assertTrue(result.lastError().contains("DUP"));
    }

    @Test
    void extractsGatewayReferenceFromConfiguredJsonPath(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"data\":{\"id\":\"INNER-REF\"}}")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("rest", Map.of("url", wm.getHttpBaseUrl() + "/v1/svc"));
        configuration.put("expectedGatewayResponse", Map.of("referenceField", "$.data.id"));
        configuration.put("retryPolicy", Map.of("maxRetries", 0));
        var result = transport.send(sampleMessage("PROC-PATH", "u"), configuration);

        assertTrue(result.accepted());
        assertEquals("INNER-REF", result.gatewayReference());
    }

    @Test
    void omitsIdempotencyHeaderWhenTemplateBlank(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("rest", Map.of("url", wm.getHttpBaseUrl() + "/v1/svc"));
        configuration.put("idempotencyKeyTemplate", "");
        configuration.put("retryPolicy", Map.of("maxRetries", 0));
        transport.send(sampleMessage("PROC-NOIDEM", "u"), configuration);

        var event = getAllServeEvents().get(0);
        assertNull(event.getRequest().getHeader("Idempotency-Key"),
                "header debe omitirse cuando el template esta explicitamente vacio");
    }

    @Test
    void rejectsWhenRestConfigMissing() {
        var configuration = Map.<String, Object>of();
        assertThrows(IllegalArgumentException.class,
                () -> transport.send(sampleMessage("PROC-NO", "u"), configuration));
    }

    @Test
    void rejectsWhenUrlMissing() {
        var configuration = Map.<String, Object>of("rest", Map.of());
        assertThrows(IllegalArgumentException.class,
                () -> transport.send(sampleMessage("PROC-NO", "u"), configuration));
    }

    @Test
    void transportIdIsRest() {
        assertEquals("REST", transport.transport());
    }

    // --- helpers ---

    private Map<String, Object> restConfiguration(String url, Map<String, Object> retryOverride) {
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of("url", url));
        configuration.put("retryPolicy", retryOverride != null ? retryOverride : Map.of("maxRetries", 0));
        return configuration;
    }

    @Test
    void derivesContentTypeFromFinFormatWhenNotConfigured(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        var finMessage = sampleMessage("PROC-FIN", "u-fin")
                .withRawPayload("{1:F01SGOBFRPPAXXX0000000000}{4:\r\n:20:PROC-FIN\r\n-}", "FIN");
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/mt101"));
        transport.send(finMessage, configuration);

        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Content-Type", equalToIgnoreCase("text/plain; charset=utf-8")));
    }

    @Test
    void explicitContentTypeOverridesFormatDerivation(WireMockRuntimeInfo wm) {
        stubFor(any(anyUrl()).willReturn(aResponse().withStatus(200).withBody("{\"accepted\":true}")));

        var finMessage = sampleMessage("PROC-FIN2", "u-fin2")
                .withRawPayload("{1:F01SGOBFRPPAXXX0000000000}{4:\r\n:20:PROC-FIN2\r\n-}", "FIN");
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("transport", "REST");
        configuration.put("rest", Map.of(
                "url", wm.getHttpBaseUrl() + "/v1/swift/mt101",
                "contentType", "application/x-swift-mt"));
        transport.send(finMessage, configuration);

        verify(postRequestedFor(urlEqualTo("/v1/swift/mt101"))
                .withHeader("Content-Type", equalTo("application/x-swift-mt")));
    }

    private Mt101Message sampleMessage(String sendersReference, String uetr) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", uetr, "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null, null, null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + sendersReference + "\"}",
                "JSON");
    }
}
