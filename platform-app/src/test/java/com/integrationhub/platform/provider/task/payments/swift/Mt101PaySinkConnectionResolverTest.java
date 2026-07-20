package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.task.sink.SinkDefinitionService;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-017 — money-safety del merge {@code sftp.sinkRef} -> conexion de una fuente OUTPUT/BOTH.
 *
 * <p>Cubre: (1) merge que conserva lo operacional y las credenciales como refs y descarta el {@code sinkRef} y las
 * claves de LECTURA de la fuente; (2) rechazo fail-loud de sink INPUT y de fuente no-SFTP; (3) modo inline intacto
 * (sin consultar la fuente); (4) no-mutacion del input; (5) merge por-ruta en {@code routeTransports}; (6) money-safety
 * vía el compiler: PARIDAD DE HASH entre spec resuelto-por-sinkRef y spec inline equivalente, y que el DESTINO
 * CONGELADO (host literal + credenciales como refs) sobrevive aunque la fuente se edite/borre (materialize no
 * re-resuelve la fuente); (7) el compiler sigue RECHAZANDO una credencial literal proveniente de una fuente mal
 * configurada.</p>
 */
// @covers ADR-017
class Mt101PaySinkConnectionResolverTest {

    // Fuente /sources SFTP bien configurada: credenciales como refs (QA-006), knownHostsPath como ${config:...}.
    // Incluye claves de LECTURA (remotePath/fileNamePattern) que NO deben copiarse al bloque sftp del pago.
    private static final String SFTP_SOURCE_JSON = """
            {"host":"sftp-bank","port":22,"username":"bank",
             "password":"${secret:tasks/sftp/bank/password}",
             "knownHostsPath":"${config:tasks.sftp.bank.known-hosts}",
             "strictHostKeyChecking":true,
             "remotePath":"/outbox","fileNamePattern":"*.ack","selectionMode":"latest"}""";

    // Fuente mal configurada (password LITERAL): QA-006 deberia impedirla, pero si llega, el compiler la rechaza.
    private static final String SFTP_SOURCE_LITERAL_PASSWORD_JSON = """
            {"host":"sftp-bank","port":22,"username":"bank","password":"plaintext-oops",
             "strictHostKeyChecking":true}""";

    private Mt101PaySinkConnectionResolver resolver(String type, String direction, String sourceJson) {
        var sinkService = new SinkDefinitionService(null) {
            @Override
            public SinkDefinition resolve(Long id) {
                return new SinkDefinition(id, "bank-sink", type, sourceJson, direction);
            }
        };
        return new Mt101PaySinkConnectionResolver(sinkService, new JsonConfigurationMapper());
    }

    private Map<String, Object> payConfigWithSinkRef() {
        var sftp = new LinkedHashMap<String, Object>();
        sftp.put("sinkRef", 11);
        sftp.put("dropPathTemplate", "/inbox/${sendersReference}.fin");
        sftp.put("tmpExtension", ".part");
        sftp.put("remoteDuplicatePolicy", "SKIP_IF_SAME_HASH");
        var config = new LinkedHashMap<String, Object>();
        config.put("transport", "SFTP");
        config.put("sftp", sftp);
        return config;
    }

    /** Config inline EQUIVALENTE a resolver el sinkRef contra {@link #SFTP_SOURCE_JSON}. */
    private Map<String, Object> payConfigInlineEquivalent() {
        var sftp = new LinkedHashMap<String, Object>();
        sftp.put("dropPathTemplate", "/inbox/${sendersReference}.fin");
        sftp.put("tmpExtension", ".part");
        sftp.put("remoteDuplicatePolicy", "SKIP_IF_SAME_HASH");
        sftp.put("host", "sftp-bank");
        sftp.put("port", 22);
        sftp.put("username", "bank");
        sftp.put("password", "${secret:tasks/sftp/bank/password}");
        sftp.put("knownHostsPath", "${config:tasks.sftp.bank.known-hosts}");
        sftp.put("strictHostKeyChecking", true);
        var config = new LinkedHashMap<String, Object>();
        config.put("transport", "SFTP");
        config.put("sftp", sftp);
        return config;
    }

    @Test
    @SuppressWarnings("unchecked")
    void mergesConnectionKeepingOperationalAndRefsDroppingSinkRefAndReadKeys() {
        var merged = resolver("SFTP", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(payConfigWithSinkRef());

        var sftp = (Map<String, Object>) merged.get("sftp");
        // conexion mergeada de la fuente
        assertEquals("sftp-bank", sftp.get("host"));
        assertEquals(22, sftp.get("port"));
        assertEquals("bank", sftp.get("username"));
        // credenciales como REFERENCIAS, sin resolver
        assertEquals("${secret:tasks/sftp/bank/password}", sftp.get("password"));
        assertEquals("${config:tasks.sftp.bank.known-hosts}", sftp.get("knownHostsPath"));
        // operacional de la task, preservado
        assertEquals("/inbox/${sendersReference}.fin", sftp.get("dropPathTemplate"));
        assertEquals(".part", sftp.get("tmpExtension"));
        assertEquals("SKIP_IF_SAME_HASH", sftp.get("remoteDuplicatePolicy"));
        // sinkRef consumido (no viaja al spec)
        assertFalse(sftp.containsKey("sinkRef"), "sinkRef no debe quedar en el bloque sftp");
        // claves de LECTURA de la fuente NO se copian
        assertFalse(sftp.containsKey("remotePath"), "remotePath (lectura) no debe copiarse");
        assertFalse(sftp.containsKey("fileNamePattern"), "fileNamePattern (lectura) no debe copiarse");
        assertFalse(sftp.containsKey("selectionMode"), "selectionMode (lectura) no debe copiarse");
    }

    @Test
    void rejectsInputSinkFailLoud() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> resolver("SFTP", "INPUT", SFTP_SOURCE_JSON).withResolvedSink(payConfigWithSinkRef()));
        assertTrue(error.getMessage().contains("OUTPUT"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void rejectsNonSftpSourceFailLoud() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> resolver("S3", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(payConfigWithSinkRef()));
        assertTrue(error.getMessage().contains("SFTP"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    @SuppressWarnings("unchecked")
    void inlineModeIsUntouchedAndDoesNotResolveSource() {
        // resolver cuyo sinkService EXPLOTA si se le consulta: prueba que sin sinkRef no se toca la fuente.
        var throwingSink = new SinkDefinitionService(null) {
            @Override
            public SinkDefinition resolve(Long id) {
                throw new AssertionError("no se debe resolver la fuente en modo inline");
            }
        };
        var resolver = new Mt101PaySinkConnectionResolver(throwingSink, new JsonConfigurationMapper());

        var inline = payConfigInlineEquivalent();
        var result = resolver.withResolvedSink(inline);

        var sftp = (Map<String, Object>) result.get("sftp");
        assertEquals("sftp-bank", sftp.get("host"));
        assertEquals("/inbox/${sendersReference}.fin", sftp.get("dropPathTemplate"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void resolvesSinkRefPerRouteInRouteTransports() {
        var routeSftp = new LinkedHashMap<String, Object>();
        routeSftp.put("sinkRef", 11);
        routeSftp.put("dropPathTemplate", "/inbox/high/${sendersReference}.fin");
        var highRoute = new LinkedHashMap<String, Object>();
        highRoute.put("transport", "SFTP");
        highRoute.put("sftp", routeSftp);
        var routeTransports = new LinkedHashMap<String, Object>();
        routeTransports.put("HIGH", highRoute);
        var config = new LinkedHashMap<String, Object>();
        config.put("routeTransports", routeTransports);

        var merged = resolver("SFTP", "BOTH", SFTP_SOURCE_JSON).withResolvedSink(config);

        var routes = (Map<String, Object>) merged.get("routeTransports");
        var high = (Map<String, Object>) routes.get("HIGH");
        var sftp = (Map<String, Object>) high.get("sftp");
        assertEquals("sftp-bank", sftp.get("host"));
        assertEquals("/inbox/high/${sendersReference}.fin", sftp.get("dropPathTemplate"));
        assertFalse(sftp.containsKey("sinkRef"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void doesNotMutateInputConfig() {
        var input = payConfigWithSinkRef();
        resolver("SFTP", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(input);

        // el mapa original conserva su sinkRef y NO gano las claves de conexion
        var originalSftp = (Map<String, Object>) input.get("sftp");
        assertEquals(11, originalSftp.get("sinkRef"), "el input no debe mutarse");
        assertFalse(originalSftp.containsKey("host"), "el input no debe ganar la conexion mergeada");
    }

    @Test
    void nullConfigReturnsNull() {
        assertNull(resolver("SFTP", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(null));
    }

    // --- money-safety vía el compiler ---

    @Test
    void frozenSpecHashIsIdenticalForSinkRefAndInline() {
        // ADR-017: paridad de hash — resolver el sinkRef y congelar produce el MISMO contrato que el inline
        // equivalente. Garantiza que migrar de inline a sinkRef no cambia el destino aprobado ni su hash.
        var compiler = new Mt101DispatchPlanCompiler(new ObjectMapper());
        var message = sampleMessage("PROC-PARITY");

        var mergedFromSink = resolver("SFTP", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(payConfigWithSinkRef());
        var specFromSink = compiler.compile(mergedFromSink, null, null, message);
        var specFromInline = compiler.compile(payConfigInlineEquivalent(), null, null, message);

        assertEquals(specFromInline.specHash(), specFromSink.specHash(),
                "el spec resuelto-por-sinkRef debe hashear identico al inline equivalente");
        assertEquals(specFromInline.specJson(), specFromSink.specJson(),
                "y el JSON canonico debe ser byte-a-byte identico");
    }

    @Test
    @SuppressWarnings("unchecked")
    void frozenDestinationSurvivesSourceEditOrDeletion() {
        // ADR-017 (invariante anti doble-pago): el correctivo materializa el spec CONGELADO; materialize NO consulta
        // la fuente. Aunque un operador edite/borre la fuente tras el pago, el host resuelto y las credenciales-ref
        // quedan en el contrato persistido -> el correctivo va al MISMO banco aprobado.
        var compiler = new Mt101DispatchPlanCompiler(new ObjectMapper());
        var message = sampleMessage("PROC-FROZEN");

        var merged = resolver("SFTP", "OUTPUT", SFTP_SOURCE_JSON).withResolvedSink(payConfigWithSinkRef());
        var spec = compiler.compile(merged, null, null, message);

        // materialize SIN secretResolver (como el structuralPlan del claim) -> no toca Vault ni la fuente.
        var plan = compiler.materialize(spec.specJson(), null);
        var sftp = (Map<String, Object>) plan.configuration().get("sftp");
        assertEquals("sftp-bank", sftp.get("host"), "host CONGELADO (literal), no re-resuelto de la fuente");
        assertEquals("${secret:tasks/sftp/bank/password}", sftp.get("password"),
                "credencial sigue siendo una referencia en el spec persistido, nunca resuelta");
        assertFalse(sftp.containsKey("sinkRef"), "el spec congela el host, no el sinkRef vivo");
    }

    @Test
    void compilerRejectsLiteralCredentialFromMisconfiguredSource() {
        // Si la fuente trae un password LITERAL (QA-006 deberia bloquearlo en /sources), el merge lo arrastra al
        // bloque sftp y el compiler lo RECHAZA: el spec persistido nunca puede contener secretos resueltos.
        var compiler = new Mt101DispatchPlanCompiler(new ObjectMapper());
        var message = sampleMessage("PROC-BAD");

        var merged = resolver("SFTP", "OUTPUT", SFTP_SOURCE_LITERAL_PASSWORD_JSON)
                .withResolvedSink(payConfigWithSinkRef());

        var error = assertThrows(IllegalStateException.class,
                () -> compiler.compile(merged, null, null, message));
        assertTrue(error.getMessage().toLowerCase().contains("secret")
                        || error.getMessage().toLowerCase().contains("reference"),
                () -> "mensaje: " + error.getMessage());
    }

    // --- helper ---

    private Mt101Message sampleMessage(String sendersReference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null, null, null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + sendersReference + "\",\"transactions\":1}",
                "JSON");
    }
}
