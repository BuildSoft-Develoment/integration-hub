package com.integrationhub.platform.integration;

// @trace ADR-016 RF-011 (sinks de objeto contra un MinIO real: lo que los mocks no pueden probar)

import com.integrationhub.platform.provider.source.OciObjectStorageSourceProvider;
import com.integrationhub.platform.provider.source.S3SourceProvider;
import com.integrationhub.platform.provider.task.sink.OciObjectStorageSink;
import com.integrationhub.platform.provider.task.sink.S3Sink;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-016 / RF-011: {@code S3Sink} y {@code OciObjectStorageSink} contra un <b>MinIO real</b>.
 *
 * <h2>Por que existe</h2>
 * <p>Los tests unitarios de estos sinks son con mocks: fijan la clave destino, el largo declarado y el
 * aborto, que es lo que se puede equivocar al escribir el codigo. Lo que un mock <b>no</b> puede probar
 * es que el SDK acepte lo que se le pasa y que al otro lado quede el archivo correcto: que el
 * {@code Content-Length} medido en una pasada previa coincida de verdad con lo que viaja —si sobrara
 * un byte, S3 corta el objeto en silencio—, que el {@code ContentStreamProvider} se reabra bien, y que
 * la composicion de clave con prefijo produzca la ruta que alguien va a mirar.</p>
 *
 * <p>MinIO habla el protocolo S3 con <b>path-style</b>, que es exactamente la forma que exige la API
 * S3-compatible de OCI. Por eso el mismo contenedor sirve para los dos sinks: lo unico propio de OCI
 * —derivar el endpoint de namespace+region— ya lo cubre su test unitario, y aqui se ejerce el resto del
 * camino, que es codigo compartido.</p>
 *
 * <h2>Como se corre (cuesta acertar, y el error es silencioso)</h2>
 * <pre>
 * mvn -o -pl platform-app -DskipITs=false -Dit.test=OutputSinkObjectStorageMinioIT \
 *     -Dtest=NingunUnitario -Dsurefire.failIfNoSpecifiedTests=false \
 *     -Dquarkus.quinoa.enabled=false verify
 * </pre>
 *
 * <p>Cada pieza esta por un motivo, aprendido fallando:</p>
 * <ul>
 *   <li>{@code -DskipITs=false}: los ITs estan <b>apagados por defecto</b> (solo el perfil
 *       {@code native} los enciende). Sin esto, {@code verify} termina en BUILD SUCCESS sin haber
 *       ejecutado nada — un verde que no significa lo que parece.</li>
 *   <li><b>No usar {@code -DskipTests=true}</b> para saltarse los unitarios: failsafe tambien lo
 *       obedece y responde "Tests are skipped", otra vez con BUILD SUCCESS.</li>
 *   <li>{@code -Dtest=<algo que no existe>} + {@code -DfailIfNoTests=false}: esa es la forma de callar
 *       surefire. Poner aqui el nombre de ESTE IT hace que surefire lo ejecute tambien —{@code -Dtest}
 *       sobrescribe sus patrones, que normalmente excluyen {@code *IT}— y entonces los "unitarios"
 *       pasan a necesitar Docker.</li>
 *   <li>{@code -Dquarkus.quinoa.enabled=false}: sin esto el build reconstruye el frontend entero y
 *       tarda unos 8 minutos en llegar a la primera assercion.</li>
 * </ul>
 */
class OutputSinkObjectStorageMinioIT {

    private static final String ACCESS_KEY = "minioadmin";
    private static final String SECRET_KEY = "minioadmin";
    private static final String BUCKET = "regulatorio";
    private static final String REGION = "us-east-1";

    @SuppressWarnings("resource")
    private static final GenericContainer<?> MINIO =
            new GenericContainer<>(DockerImageName.parse("minio/minio:RELEASE.2024-01-16T16-07-38Z"))
                    .withEnv("MINIO_ROOT_USER", ACCESS_KEY)
                    .withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
                    .withCommand("server", "/data")
                    .withExposedPorts(9000)
                    .waitingFor(Wait.forHttp("/minio/health/ready").forPort(9000).withStartupTimeout(Duration.ofSeconds(60)));

    private static String endpoint;

    @BeforeAll
    static void startMinioAndBucket() {
        MINIO.start();
        endpoint = "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000);
        try (S3Client s3 = readerClient()) {
            s3.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        }
    }

    @AfterAll
    static void stopMinio() {
        MINIO.stop();
    }

    /** Cliente independiente del sink: se lee con uno distinto del que escribio, a proposito. */
    private static S3Client readerClient() {
        return S3Client.builder()
                .region(Region.of(REGION))
                .httpClient(UrlConnectionHttpClient.create())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    private static Map<String, Object> conexion(String prefix) {
        var config = new LinkedHashMap<String, Object>();
        config.put("bucket", BUCKET);
        config.put("region", REGION);
        config.put("endpoint", endpoint);
        config.put("pathStyleAccess", true);
        config.put("authMode", "access-key");
        config.put("accessKeyId", ACCESS_KEY);
        config.put("secretAccessKey", SECRET_KEY);
        if (prefix != null) {
            config.put("prefix", prefix);
        }
        return config;
    }

    private static S3Sink s3Sink() {
        return new S3Sink(new S3SourceProvider());
    }

    /**
     * El sink de OCI apuntado a MinIO por {@code endpoint} explicito. Es el camino que su propio codigo
     * declara para emuladores, y deja el path-style forzado igual que contra Oracle.
     */
    private static OciObjectStorageSink ociSink() {
        var s3Connections = new S3SourceProvider();
        return new OciObjectStorageSink(new OciObjectStorageSourceProvider(s3Connections), new S3Sink(s3Connections));
    }

    private static byte[] leer(String key) {
        try (S3Client s3 = readerClient();
             var in = s3.getObject(GetObjectRequest.builder().bucket(BUCKET).key(key).build())) {
            return in.readAllBytes();
        } catch (IOException error) {
            throw new AssertionError("no se pudo leer " + key, error);
        }
    }

    // ── S3 ────────────────────────────────────────────────────────────────────────────────────────

    @Test
    void s3_entregaElArtefactoByteAByteEnLaClaveCompuesta() throws Exception {
        var contenido = "0228A01;lima;12345\n0228A01;cusco;67890\n".getBytes(StandardCharsets.UTF_8);

        s3Sink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(contenido), conexion("envios"));

        // Se lee con un cliente distinto: que el sink crea haber escrito no prueba que este.
        assertArrayEquals(contenido, leer("envios/SUCAVE/0228A01.228"));
    }

    @Test
    void s3_unArtefactoMayorQueElBufferDeMedidaLlegaEntero() throws Exception {
        // La medida usa un buffer de 64 KB, asi que un archivo mas grande obliga a varias vueltas EN LAS
        // DOS pasadas —contar y subir—. Si alguna se descoordinara, el objeto llegaria corto: con mocks
        // no se ve, porque nadie cuenta los bytes que el SDK manda de verdad.
        var linea = "0228A11;fila de relleno para pasar de sesenta y cuatro kilobytes;000000\n";
        var grande = linea.repeat(4_000).getBytes(StandardCharsets.UTF_8);
        assertTrue(grande.length > 64 * 1024, "el fixture debe superar el buffer de medida");

        s3Sink().deliver("grande.txt", () -> new ByteArrayInputStream(grande), conexion(null));

        var recuperado = leer("grande.txt");
        assertEquals(grande.length, recuperado.length, "el objeto llego truncado o con relleno");
        assertArrayEquals(grande, recuperado);
    }

    @Test
    void s3_reentregarElMismoNombrePisaLoAnterior() throws Exception {
        // Un reintento tras un fallo de red, o el reproceso de un envio, tiene que poder repetirse. Y el
        // resultado debe ser el nuevo COMPLETO, no una mezcla con los bytes del anterior.
        var primero = "version uno, mas larga que la segunda\n".getBytes(StandardCharsets.UTF_8);
        var segundo = "version dos\n".getBytes(StandardCharsets.UTF_8);
        OutputSink sink = s3Sink();

        sink.deliver("reentrega.txt", () -> new ByteArrayInputStream(primero), conexion(null));
        sink.deliver("reentrega.txt", () -> new ByteArrayInputStream(segundo), conexion(null));

        assertArrayEquals(segundo, leer("reentrega.txt"));
    }

    @Test
    void s3_unBucketQueNoExisteFallaRuidoso() {
        var config = conexion(null);
        config.put("bucket", "bucket-que-no-existe");

        assertThrows(IOException.class, () -> s3Sink().deliver(
                "x.txt", () -> new ByteArrayInputStream("x".getBytes(StandardCharsets.UTF_8)), config));
    }

    // ── OCI (misma API S3-compatible) ─────────────────────────────────────────────────────────────

    @Test
    void oci_entregaPorLaApiS3CompatibleConPathStyle() throws Exception {
        var contenido = "0228A01;via OCI compat\n".getBytes(StandardCharsets.UTF_8);

        ociSink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(contenido), conexion("oci"));

        assertArrayEquals(contenido, leer("oci/SUCAVE/0228A01.228"));
    }

    @Test
    void oci_unPrefijoConPlantillaSeRechazaAntesDeSubirNada() {
        // Heredado de S3Sink: al leer, `{yyyyMM}` se resolveria; al escribir no. Sin este rechazo se
        // crearia una carpeta llamada literalmente "{yyyyMM}" y el archivo desapareceria de la vista.
        var config = conexion("envios/{yyyyMM}");

        assertThrows(IllegalArgumentException.class, () -> ociSink().deliver(
                "x.txt", () -> new ByteArrayInputStream("x".getBytes(StandardCharsets.UTF_8)), config));
    }
}
