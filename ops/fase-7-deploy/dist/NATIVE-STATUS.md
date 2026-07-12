# Estado del build NATIVO: ✅ FUNCIONA (verificado 2026-07-12)

**TL;DR:** la imagen nativa `integration-hub:native` compila y corre verificada: arranque
**1.5s**, **~70 MiB** de RAM, `/q/health/ready` UP (DB + messaging), UI Quinoa embebida
HTTP 200. La imagen JVM (`Dockerfile.jvm`) sigue disponible como alternativa.

## Requisitos para reproducir el build

1. **Quarkus 3.37.2+** (`quarkus.platform.version` en el pom raíz). Con 3.33.x el nativo es
   inviable: su OTel 1.57 choca con la metadata del builder (ver historial abajo).
2. **RAM del builder ≥ 12 GB**: el análisis de GraalVM pica a **9.7 GB**. En Windows/WSL2 se
   fija con `C:\Users\<user>\.wslconfig` → `[wsl2] memory=12GB` + `wsl --shutdown`.
   Con los 8 GB por defecto el build muere con `GC overhead limit exceeded` tras ~27 min.
3. Parar contenedores pesados durante el build (la infra no hace falta para compilar).
4. Comando: `mvn -pl platform-app -am clean package -DskipTests -Pnative -Dquarkus.native.container-build=true`
   (**`-Pnative`**, no `-Dnative`: el perfil del pom raíz no se auto-activa por propiedad).
5. Runtime base **UBI9**: `quay.io/quarkus/ubi9-quarkus-micro-image:2.0` (ya en
   `Dockerfile.native`). La variante UBI8 falla con `GLIBC_2.34 not found` porque el builder
   Mandrel jdk-25 es ubi9.

## Los 5 muros que se tumbaron (historial)

| # | Muro | Sintoma | Fix |
|---|------|---------|-----|
| 1 | OTel | `ClassNotFoundException: ...sdk.common.internal.AndroidFriendlyRandomHolder` | Subir a Quarkus **3.37.2** (pinnea OTel 1.60.1, alineado con la metadata del builder). En 3.33.x no hay fix a nivel app: 1.57 rompe la metadata y forzar 1.60 rompe la substitution de la extension. |
| 2 | log4j | `NoClassDefFoundError: org/apache/log4j/Priority` (via commons-logging de clientes AWS/GCP) | Bridge `org.jboss.logmanager:log4j-jboss-logmanager:1.2.2.Final` (provee `org.apache.log4j.*`). Solo diferir la init NO basta: la clase debe existir. |
| 3 | jsch | `@InjectAccessors ... PortWatcher.anyLocalAddress: found no method named set` | Quitar `com.jcraft.jsch.PortWatcher` de `--initialize-at-run-time` en **`META-INF/native-image/.../native-image.properties`** (ojo: esa fuente manda; limpiarlo solo en application.properties no sirve) + `quarkus-jsch` **3.2.0**. |
| 4 | RAM | `OutOfMemoryError: GC overhead limit exceeded` en fase de analisis | `.wslconfig` con 12 GB (ver arriba). |
| 5 | commons-logging duplicado | `Unresolved method ... LogFactoryImpl.handleThrowable` (GraalVM mezcla el commons-logging real 1.3.2 con el shim jboss) | Exclusiones POM del commons-logging real en **cada fuente** (`commons-jexl3`, `artemis-jakarta-client`→beanutils) + shim `commons-logging-jboss-logging` **explicito**. NO usar `quarkus.class-loading.removed-artifacts`: banea el recurso por nombre y bloquea la clase tambien del shim (rompe la augmentacion de quarkus-amazon-*). |

## Pendiente de validar en nativo

- **SFTP (jsch) en runtime**: el transporte de pagos MT101 (`SftpPaymentTransport`) usa jsch.
  Compila y la feature carga, pero no se ha ejercitado una transferencia SFTP real en nativo.
  Antes de confiar el money-path al binario nativo, homologar contra un endpoint SFTP de prueba.
- Ejercitar POI (lectura XLSX), plugins gRPC remotos y los sources Azure/GCS/S3 en nativo.

## Cambios que soportan el nativo (rama experiment/quarkus-lts-native)

- `pom.xml` raiz: `quarkus.platform.version` 3.33.2 → **3.37.2**.
- `platform-app/pom.xml`: `quarkus-jsch` 3.1.2 → **3.2.0**; + `log4j-jboss-logmanager`;
  + `commons-logging-jboss-logging` explicito; exclusiones de `commons-logging` en
  `commons-jexl3` y `artemis-jakarta-client`.
- `native-image.properties`: sin `PortWatcher` en runtime-init; `--initialize-at-build-time`
  para xmlbeans/POI schemas; grpc-xds/jgroups a runtime; watchdog 120s.
- `application.properties`: `quarkus.native.additional-build-args` vacio (todo vive en
  `native-image.properties`); linea original en comentario como backup.
- `Dockerfile.native`: base **ubi9**-quarkus-micro-image.
