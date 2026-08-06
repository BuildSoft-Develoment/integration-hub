package com.integrationhub.platform.api.mapper.source;

// @trace QA-006 (fuentes: credenciales como referencia vault ${secret:...}, nunca en texto plano)

import com.integrationhub.platform.api.response.source.SourceDefinitionResponse;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.source.SourceCredentialPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SourceApiMapper {

    private final SourceCredentialPolicy credentialPolicy;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    @Inject
    public SourceApiMapper(SourceCredentialPolicy credentialPolicy,
                           JsonConfigurationMapper jsonConfigurationMapper) {
        this.credentialPolicy = credentialPolicy;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    public SourceDefinitionResponse toResponse(SourceDefinition definition) {
        return new SourceDefinitionResponse(
                definition.id,
                definition.name,
                definition.sourceType,
                definition.active,
                configuracionPublicable(definition),
                definition.direction,
                definition.moneyCritical
        );
    }

    /**
     * QA-006: la configuracion salia CRUDA por la API, y {@code GET /api/source-definitions} lo lee
     * tambien el rol AUDITOR. Mientras toda credencial fuera una referencia {@code ${secret:...}} eso
     * era inocuo -una referencia no es un secreto-, pero las filas guardadas antes de que el servidor
     * lo exigiera pueden traer el secreto literal, y ahi se estaba entregando de verdad.
     *
     * <p>Se enmascara SOLO lo que esta en claro. Las referencias se devuelven tal cual, porque hay que
     * verlas para poder editar la fuente: enmascararlo todo obligaria a reescribir la credencial en
     * cada edicion, y eso acaba en operadores pegando el secreto en claro otra vez.</p>
     *
     * <p>Si la configuracion no parsea, se devuelve vacia. Es lo unico honesto: no se puede afirmar
     * que no contenga un secreto, y entregarla entera "porque no se pudo comprobar" es justo el
     * fail-open que este trabajo viene a quitar.</p>
     */
    private String configuracionPublicable(SourceDefinition definition) {
        var json = definition.configurationJson;
        if (json == null || json.isBlank()) {
            return json;
        }
        try {
            var configuracion = jsonConfigurationMapper.toMapUnresolved(json);
            var enmascarada = credentialPolicy.mask(definition.sourceType, configuracion);
            return enmascarada == configuracion ? json : jsonConfigurationMapper.toJson(enmascarada);
        } catch (RuntimeException e) {
            return "{}";
        }
    }
}
