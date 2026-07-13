package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 001-catalogo-fuentes (fuente OCI Object Storage via API S3-compat)
 */
class OciObjectStorageSourceProviderTest {

    private final OciObjectStorageSourceProvider provider =
            new OciObjectStorageSourceProvider(new S3SourceProvider());

    @Test
    void exposesOciType() {
        assertEquals("OCI_OBJECT_STORAGE", provider.type());
    }

    @Test
    void derivesCompatEndpointFromNamespaceAndRegion() {
        var s3 = provider.toS3Configuration(Map.of(
                "namespace", "AxAxTenancy",
                "region", "US-ASHBURN-1",
                "bucket", "pagos"));

        assertEquals("https://axaxtenancy.compat.objectstorage.us-ashburn-1.oraclecloud.com",
                s3.get("endpoint"));
        assertEquals(Boolean.TRUE, s3.get("pathStyleAccess"), "OCI S3-compat exige path-style");
        assertEquals("access-key", s3.get("authMode"), "default: OCI Customer Secret Keys");
        assertEquals("pagos", s3.get("bucket"), "el resto de claves pasan tal cual");
    }

    @Test
    void explicitEndpointOverridesDerivationAndKeepsAuthModeIfProvided() {
        var s3 = provider.toS3Configuration(Map.of(
                "endpoint", "http://minio:9000",
                "region", "us-east-1",
                "bucket", "e2e-src",
                "authMode", "default"));

        assertEquals("http://minio:9000", s3.get("endpoint"),
                "con endpoint explicito no se exige namespace (tests/emulador)");
        assertEquals(Boolean.TRUE, s3.get("pathStyleAccess"));
        assertEquals("default", s3.get("authMode"), "un authMode explicito no se pisa");
    }

    @Test
    void failsFastWithoutNamespaceOrEndpoint() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.toS3Configuration(Map.of("region", "us-ashburn-1", "bucket", "b")));
        assertTrue(error.getMessage().contains("namespace"));
    }

    @Test
    void declaresConfigSchemaForDynamicUiRendering() {
        var schema = provider.configSchema();

        var keys = schema.fields().stream().map(f -> f.key()).toList();
        assertEquals(List.of("namespace", "region", "bucket", "accessKeyId", "secretAccessKey",
                "prefix", "fileNameTemplate", "selectionMode", "mediaType", "endpoint"), keys);
        assertTrue(schema.fields().stream()
                        .filter(f -> f.key().equals("secretAccessKey"))
                        .allMatch(f -> "secret".equals(f.type())),
                "la credencial se declara como campo secreto");
    }

    @Test
    void delegatesSelectAndOpenWithTranslatedConfiguration() {
        var seen = new AtomicReference<Map<String, Object>>();
        var marker = new SelectedSourceFile("f.csv", "in/f.csv", "text/csv", null, null);
        var capturing = new S3SourceProvider() {
            @Override
            public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
                seen.set(configuration);
                return List.of(marker);
            }
        };
        var facade = new OciObjectStorageSourceProvider(capturing);

        var files = facade.selectFiles(Map.of("namespace", "ns", "region", "eu-frankfurt-1", "bucket", "b"));

        assertEquals(List.of(marker), files, "delega en el provider S3");
        assertEquals("https://ns.compat.objectstorage.eu-frankfurt-1.oraclecloud.com",
                seen.get().get("endpoint"), "delega con la config ya traducida");
    }
}
