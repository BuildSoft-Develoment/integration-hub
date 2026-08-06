package com.integrationhub.platform.service.source;

// @trace QA-006 (fuentes: credenciales como referencia vault ${secret:...}, nunca en texto plano)

import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * La regla de QA-006 en un solo sitio: una credencial de fuente solo puede persistirse como
 * referencia {@code ${secret:...}}, nunca en claro.
 *
 * <p><b>Por que existe.</b> Este control vivia ENTERO en Angular
 * ({@code source-catalog-command.service.ts}): bloqueaba el guardado desde el formulario, y un POST
 * directo a {@code /api/source-definitions} lo saltaba por completo. Ademas su lista de campos se
 * habia quedado atras -no incluia GCS ni AZURE_BLOB-, asi que la clave privada de una service
 * account de Google se guardaba literal mientras un password de SFTP si se rechazaba. Un control que
 * solo esta en el cliente no es un control: es una sugerencia.</p>
 *
 * <p><b>Dos usos, una regla.</b> La misma clase decide al ESCRIBIR (rechazar) y al LEER
 * (enmascarar). Separarlos en dos sitios habria permitido que divergieran, que es como empezo todo
 * esto.</p>
 */
@ApplicationScoped
public class SourceCredentialPolicy {

    /**
     * Lo que se devuelve en lugar de una credencial que quedo en claro en la base de datos.
     *
     * <p>NO es una marca de "mantener el valor actual": a proposito no es una referencia valida, asi
     * que si alguien reedita y reenvia esa fila, el guardado la rechaza y le obliga a poner un
     * {@code ${secret:...}} de verdad. Enmascarar sin esa consecuencia solo esconderia el problema.</p>
     */
    public static final String MASCARA = "********";

    private static final Logger LOG = Logger.getLogger(SourceCredentialPolicy.class);

    private final SourceProviderRegistry sourceProviderRegistry;

    @Inject
    public SourceCredentialPolicy(SourceProviderRegistry sourceProviderRegistry) {
        this.sourceProviderRegistry = sourceProviderRegistry;
    }

    /**
     * Campos de credencial de este tipo de fuente que traen texto plano.
     *
     * <p>Un tipo que no resuelve a ningun provider no se puede juzgar: se devuelve vacio y la
     * validacion del tipo la hace quien corresponde ({@code resolve} ya falla ruidosamente al
     * guardar). No se inventa aqui un segundo control de tipos.</p>
     */
    public List<String> plaintextCredentials(String sourceType, Map<String, Object> configuration) {
        if (configuration == null || configuration.isEmpty()) {
            return List.of();
        }
        var enClaro = new ArrayList<String>();
        for (var clave : credentialKeys(sourceType)) {
            var valor = configuration.get(clave);
            if (esTextoPlano(valor)) {
                enClaro.add(clave);
            }
        }
        return List.copyOf(enClaro);
    }

    /** Sustituye por {@link #MASCARA} las credenciales que estan en claro; las referencias se ven. */
    public Map<String, Object> mask(String sourceType, Map<String, Object> configuration) {
        if (configuration == null) {
            return null;
        }
        var enClaro = plaintextCredentials(sourceType, configuration);
        if (enClaro.isEmpty()) {
            return configuration;
        }
        var enmascarado = new LinkedHashMap<>(configuration);
        for (var clave : enClaro) {
            enmascarado.put(clave, MASCARA);
        }
        return enmascarado;
    }

    /**
     * HUECO CONOCIDO, y por eso hace ruido.
     *
     * <p>Si el tipo no resuelve a ningun provider no hay forma de saber que campos suyos son
     * credenciales, y no se puede juzgar. Rechazar seria lo coherente con el resto de esta clase,
     * pero romperia un caso legitimo: la API acepta crear una fuente de un tipo aportado por un
     * plugin que todavia no esta instalado (ver {@code createNormalizesExternalSourceTypeAsString}).
     * Un tipo asi tampoco se puede ejecutar, asi que la ventana es estrecha — pero existe.</p>
     *
     * <p>Se deja pasar y se avisa en WARN con el tipo concreto. Lo que NO se hace es callarse: un
     * hueco invisible es como empezo todo esto.</p>
     */
    private List<String> credentialKeys(String sourceType) {
        try {
            return sourceProviderRegistry.resolve(sourceType).credentialKeys();
        } catch (RuntimeException e) {
            LOG.warnf("QA-006: no se puede comprobar credenciales del tipo '%s' (sin provider registrado); "
                    + "si trae secretos, se persisten sin revisar", sourceType);
            return List.of();
        }
    }

    /**
     * Texto plano = hay algo escrito y no es una referencia resoluble.
     *
     * <p>Vacio y null NO cuentan: un campo que el formulario no serializa en ese modo de
     * autenticacion -REST con bearer no manda {@code password}, S3 con rol IAM no manda
     * {@code secretAccessKey}- no es una credencial expuesta, y rechazarlo seria un falso bloqueo.</p>
     */
    private static boolean esTextoPlano(Object valor) {
        return valor instanceof String texto
                && !texto.trim().isEmpty()
                && !JsonConfigurationMapper.isSecretReference(texto);
    }
}
