package com.integrationhub.platform.service.secret;

// @trace ADR-031 D3, D5 (enumerar las rutas de una fuente, jamas sus valores)

import io.quarkus.arc.All;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Que secretos existen en una fuente, para poder ofrecerlos en vez de escribirlos de memoria.
 *
 * <p><b>Que NO hace.</b> No lee valores. No puede: {@link SecretEntry} no tiene donde guardarlos y
 * el cliente los pide por {@code subkeys}, que es la ruta de OpenBao que devuelve los nombres con
 * los valores a {@code null} (ADR-031 D4). Eso no es una precaucion del codigo de hoy, es una
 * propiedad del camino que se eligio.</p>
 *
 * <p><b>Y no opina.</b> Devuelve lo que hay en la fuente que se le pide, en orden de ruta. Quien
 * elige es la persona que edita.</p>
 */
@ApplicationScoped
public class SecretEnumerationService {

    private final List<SecretValueProvider> providers;

    @Inject
    public SecretEnumerationService(@All List<SecretValueProvider> providers) {
        this.providers = List.copyOf(providers);
    }

    /**
     * Los secretos de {@code source}, o vacio si esa fuente no existe, no esta disponible aqui o no
     * sabe enumerarse.
     *
     * <p><b>Los tres casos devuelven lo mismo a proposito.</b> Un 404 para "esa fuente no existe
     * aqui" convertiria este endpoint en un detector de que proveedores tiene montada la maquina,
     * respondiendo distinto a quien pregunta por {@code awssecret} que a quien pregunta por
     * {@code vaultkv}. Y para la pantalla los tres significan lo mismo: no hay nada que ofrecer,
     * degrada a escritura manual (D2).</p>
     */
    public SecretEnumeration enumerar(String source) {
        if (source == null || source.isBlank()) {
            return SecretEnumeration.vacia();
        }
        return providers.stream()
                .filter(SecretValueProvider::disponible)
                .filter(SecretValueProvider::enumerable)
                .filter(provider -> provider.supports(source))
                .findFirst()
                .map(SecretValueProvider::enumerate)
                .orElseGet(SecretEnumeration::vacia);
    }
}
