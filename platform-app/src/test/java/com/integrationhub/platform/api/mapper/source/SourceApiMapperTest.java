package com.integrationhub.platform.api.mapper.source;

import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.source.SourceCredentialPolicy;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 001-catalogo-fuentes RF-001 (representacion de la fuente por tipo, con su estado)
// @covers QA-006 (la API no entrega credenciales en claro de filas guardadas antes del control)
class SourceApiMapperTest {

    private final SourceApiMapper mapper = new SourceApiMapper(
            new SourceCredentialPolicy(new StubRegistry()), new JsonConfigurationMapper());

    @Test
    void toResponseMapsAllFields() {
        var definition = new SourceDefinition();
        definition.id = 3L;
        definition.name = "dropzone-clientes";
        definition.sourceType = "SFTP";
        definition.active = true;
        definition.configurationJson = "{\"path\":\"/in\"}";

        var response = mapper.toResponse(definition);

        assertEquals(3L, response.id());
        assertEquals("dropzone-clientes", response.name());
        assertEquals("SFTP", response.sourceType());
        assertTrue(response.active());
        assertEquals("{\"path\":\"/in\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesTypeAndInactive() {
        var definition = new SourceDefinition();
        definition.id = 10L;
        definition.name = "api-externa";
        definition.sourceType = "REST";
        definition.active = false;
        definition.configurationJson = "{}";

        var response = mapper.toResponse(definition);

        assertEquals("REST", response.sourceType());
        assertEquals(false, response.active());
    }

    @Test
    void enmascaraLaCredencialEnClaroDeUnaFilaHeredada() {
        var definition = new SourceDefinition();
        definition.sourceType = "SFTP";
        definition.configurationJson = "{\"host\":\"sftp.banco\",\"password\":\"hunter2\"}";

        var configuracion = mapper.toResponse(definition).configurationJson();

        assertFalse(configuracion.contains("hunter2"), () -> "el secreto salio por la API: " + configuracion);
        assertTrue(configuracion.contains(SourceCredentialPolicy.MASCARA), () -> configuracion);
        // Lo que NO es credencial sigue visible: enmascarar de mas haria la fuente ilegible.
        assertTrue(configuracion.contains("sftp.banco"), () -> configuracion);
    }

    @Test
    void deja_ver_la_referencia_porque_hay_que_poder_editarla() {
        var definition = new SourceDefinition();
        definition.sourceType = "SFTP";
        definition.configurationJson = "{\"password\":\"${secret:sftp/pass}\"}";

        var configuracion = mapper.toResponse(definition).configurationJson();

        assertTrue(configuracion.contains("${secret:sftp/pass}"), () -> configuracion);
        assertFalse(configuracion.contains(SourceCredentialPolicy.MASCARA), () -> configuracion);
    }

    @Test
    void siLaConfiguracionNoParseaNoSeEntregaEntera() {
        var definition = new SourceDefinition();
        definition.sourceType = "SFTP";
        definition.configurationJson = "{esto no es json, password=hunter2";

        assertEquals("{}", mapper.toResponse(definition).configurationJson());
    }

    /** Registry minimo: solo necesita saber que campos de SFTP son credenciales. */
    private static final class StubRegistry extends SourceProviderRegistry {
        private StubRegistry() {
            super(null);
        }

        @Override
        public SourceProvider resolve(String type) {
            if (!"SFTP".equalsIgnoreCase(type)) {
                throw new IllegalArgumentException("Unsupported source provider: " + type);
            }
            return new SourceProvider() {
                @Override
                public String type() {
                    return "SFTP";
                }

                @Override
                public List<String> credentialKeys() {
                    return List.of("password", "passphrase");
                }

                @Override
                public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
                    throw new UnsupportedOperationException();
                }

                @Override
                public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
                    throw new UnsupportedOperationException();
                }
            };
        }
    }
}
