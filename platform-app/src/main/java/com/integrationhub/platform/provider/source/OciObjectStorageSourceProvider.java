package com.integrationhub.platform.provider.source;

// @trace spec 001-catalogo-fuentes RF-006, RF-007, RF-008 (catalogo-fuentes: fuente cloud OCI Object Storage) ADR-006

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.List;

/**
 * Fuente OCI Object Storage (Oracle Cloud), como <b>fachada delgada</b> sobre
 * {@link S3SourceProvider}: OCI expone una API S3-compatible y este provider solo
 * traduce la configuracion amigable de OCI (namespace/region/bucket) al shape S3
 * (endpoint compat + path-style forzado) y delega. Cero SDK de Oracle: reutiliza el
 * cliente AWS ya homologado en nativo (mismo camino que MinIO).
 *
 * <p>Configuracion:</p>
 * <pre>
 * {
 *   "namespace": "axax...",          // tenancy Object Storage namespace
 *   "region": "us-ashburn-1",
 *   "bucket": "mi-bucket",
 *   "accessKeyId": "${secret:oci_customer_key}",      // OCI "Customer Secret Keys"
 *   "secretAccessKey": "${secret:oci_customer_secret}",
 *   "prefix": "in/",                 // + fileNameTemplate/selectionMode/mediaType como en S3
 *   "endpoint": "http://..."         // opcional: override explicito (tests/emulador)
 * }
 * </pre>
 *
 * <p>Notas: la API S3-compat de OCI exige <b>path-style</b> (se fuerza aqui) y autentica
 * con Customer Secret Keys (por eso {@code authMode} por defecto es {@code access-key};
 * los principals nativos de OCI requeririan el SDK de Oracle, fuera de alcance).</p>
 */
@ApplicationScoped
public class OciObjectStorageSourceProvider implements SourceProvider {

    static final String TYPE = "OCI_OBJECT_STORAGE";
    private static final String COMPAT_ENDPOINT_TEMPLATE = "https://%s.compat.objectstorage.%s.oraclecloud.com";

    private final S3SourceProvider delegate;

    @Inject
    public OciObjectStorageSourceProvider(S3SourceProvider delegate) {
        this.delegate = delegate;
    }

    @Override
    public String type() {
        return TYPE;
    }

    /**
     * Schema declarativo del tipo: es el camino documentado en {@link SourceProvider#configSchema()}
     * para que la UI renderice el formulario via {@code ih-schema-form}
     * ({@code GET /api/plugins/config-schema/OCI_OBJECT_STORAGE}) sin formulario hardcoded en el
     * frontend. Cuando exista un {@code oci-object-storage-source.provider.ts} dedicado, este
     * schema queda como contrato de referencia.
     */
    @Override
    public PluginConfigSchema configSchema() {
        return PluginConfigSchema.of(
                PluginConfigField.text("namespace", "sources.oci.namespace", true),
                PluginConfigField.text("region", "sources.oci.region", true),
                PluginConfigField.text("bucket", "sources.oci.bucket", true),
                PluginConfigField.text("accessKeyId", "sources.oci.accessKeyId", true),
                PluginConfigField.secret("secretAccessKey", "sources.oci.secretAccessKey", true),
                PluginConfigField.text("prefix", "sources.oci.prefix", false),
                PluginConfigField.text("fileNameTemplate", "sources.oci.fileNameTemplate", false),
                PluginConfigField.select("selectionMode", "sources.oci.selectionMode", false, List.of(
                        PluginConfigOption.of("latestModified", "latestModified"),
                        PluginConfigOption.of("single", "single"),
                        PluginConfigOption.of("all", "all"))),
                PluginConfigField.text("mediaType", "sources.oci.mediaType", false),
                PluginConfigField.text("endpoint", "sources.oci.endpoint", false));
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        return delegate.selectFiles(toS3Configuration(configuration));
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        return delegate.openFile(selectedFile, toS3Configuration(configuration));
    }

    /**
     * Traduce la config OCI al shape del provider S3: deriva el endpoint S3-compat del
     * par namespace+region (salvo override explicito), fuerza path-style y default de
     * auth por Customer Secret Keys. El resto de claves (bucket, prefix, fileNameTemplate,
     * selectionMode, mediaType, credenciales...) pasan tal cual.
     */
    Map<String, Object> toS3Configuration(Map<String, Object> configuration) {
        var s3 = new LinkedHashMap<String, Object>(configuration);

        var explicitEndpoint = stringValue(configuration.get("endpoint"));
        if (explicitEndpoint == null) {
            var namespace = requireText(configuration, "namespace");
            var region = requireText(configuration, "region");
            s3.put("endpoint", COMPAT_ENDPOINT_TEMPLATE.formatted(
                    namespace.toLowerCase(Locale.ROOT), region.toLowerCase(Locale.ROOT)));
        }
        // La API S3-compat de OCI solo soporta path-style (virtual-host style no resuelve).
        s3.put("pathStyleAccess", true);
        if (stringValue(configuration.get("authMode")) == null) {
            s3.put("authMode", "access-key");
        }
        return s3;
    }

    private static String requireText(Map<String, Object> configuration, String key) {
        var value = stringValue(configuration.get(key));
        if (value == null) {
            throw new IllegalArgumentException(
                    "OCI Object Storage source requires '" + key + "' (or an explicit 'endpoint')");
        }
        return value;
    }

    private static String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        var text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }
}
