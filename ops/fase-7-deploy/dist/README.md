# Dist de despliegue por entorno (Nivel 3)

Empaqueta **la aplicación** `platform-app` (Quarkus con la **UI Quinoa embebida**) lista para
correr en **AWS, Azure, GCP, Oracle Cloud y on-premise**.

> ✅ **Modo de compilación:** la imagen **nativa** compila y está verificada (arranque 1.5s,
> ~70 MiB RAM, health UP, UI embebida) — requisitos y los 5 fixes que la habilitaron en
> [`NATIVE-STATUS.md`](NATIVE-STATUS.md) (Quarkus ≥3.37.2, builder con ≥12 GB de RAM).
> La imagen **JVM** (`common/Dockerfile.jvm`) sigue disponible como alternativa. El SFTP del
> money-path **ya está homologado en nativo**: ver [`NATIVE-STATUS.md`](NATIVE-STATUS.md), que da por
> validados el handshake de jsch y el pipeline `MT101_PAY` completo, con evidencia en
> `qa/fase-6-qa/evidencias/sftp-native-e2e-20260712.md`.

> No confundir con `releases/` ni con `scripts/package-bundle.mjs`: eso empaqueta el
> *template de la metodología* (ZIP para instanciar proyectos). Esto es el despliegue de
> la app corriendo. Son cosas separadas y no se pisan.

## Principio: un binario, config por perfil

El mismo runner nativo se comporta distinto según el perfil Quarkus activo:

```
QUARKUS_PROFILE=prod,aws      # o azure / gcp / oracle / onprem
```

`config/application-prod.properties` es la base común (todo por variable de entorno);
`config/application-<nube>.properties` añade lo específico de cada nube (staging S3/Blob/GCS,
región, endpoints). **Ningún secreto vive en el repo** — cada nube los inyecta desde su
vault nativo (Secrets Manager / Key Vault / Secret Manager / OCI Vault / file-vault) vía
variables de entorno o CSI driver, apoyándose en el `SecretResolver` ya existente.

## Estructura

| Ruta | Qué es |
|------|--------|
| `common/Dockerfile.native` | Runtime: micro-image + `COPY` del runner ya construido (lo usa CI). |
| `common/helm/integration-hub/` | **Un** chart Helm; se parametriza con `values-<nube>.yaml`. |
| `config/application-*.properties` | Perfiles Quarkus base + por nube. |
| `<nube>/values-<nube>.yaml` | Values Helm (registry, ingress, identidad de carga). |
| `<nube>/.env.example` | Variables no-secretas + qué secretos setear. |
| `<nube>/terraform/` | Solo el **registry** (ECR/ACR/GAR/OCIR) + retención. No provisiona clusters. |
| `onprem/docker-compose.prod.yml` | Alternativa Compose para on-prem. |
| `vm/` | Despliegue completo en **una sola VM** con Compose (no Kubernetes): app, consumidor, Keycloak, OpenBao, Postgres, Kafka y nginx bajo un unico dominio. Runbook propio. |
| `.github/workflows/release-deploy.yml` | CI: build nativo → imagen → push al registry elegido (camino Helm). |
| `.github/workflows/publish-vm-images.yml` | CI: las **dos** imagenes nativas x86-64 del paquete `vm/` → ghcr.io, con tag inmutable. |

## Flujo por nube (ejemplo AWS)

```bash
# 1. (una vez) crear el registry
cd ops/fase-7-deploy/dist/aws/terraform && terraform init && terraform apply -var region=us-east-1

# 2. build + push  (CI: Actions → "Release deploy" → cloud=aws, o tag vX.Y.Z)
#    local equivalente:
mvn -pl platform-app -am clean package -DskipTests -Pnative -Dquarkus.native.container-build=true
docker build -f ops/fase-7-deploy/dist/common/Dockerfile.native \
  --build-arg RUNNER=$(ls platform-app/target/*-runner) -t <repo>:<tag> .
docker push <repo>:<tag>

# 3. deploy (paso humano/aprobado)
helm upgrade --install ih ops/fase-7-deploy/dist/common/helm/integration-hub \
  -f ops/fase-7-deploy/dist/aws/values-aws.yaml --set image.tag=<tag>
```

Reemplaza `aws` por `azure|gcp|oracle|onprem` y su `values-*.yaml`. En on-prem puedes usar
`docker-compose.prod.yml` en vez de Helm.

## Secrets de CI requeridos (por nube)

El workflow usa `secrets.IMAGE_REPO` (URL completa del repo de imágenes) + login por nube:
- **aws**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **azure**: `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`
- **gcp**: `GAR_HOST`, `GCP_SA_KEY`
- **oracle**: `OCIR_REGISTRY`, `OCIR_USERNAME`, `OCIR_TOKEN`
- **onprem**: `ONPREM_REGISTRY`, `ONPREM_REGISTRY_USER`, `ONPREM_REGISTRY_PASSWORD`

## Notas

- El build nativo pide RAM y es lento; en CI corre con `container-build=true` (Mandrel).
- Health: `/q/health/live`, `/q/health/ready`, `/q/health/started` (arranque con Flyway).
- OCI y on-prem reutilizan `quarkus-amazon-s3` (API S3-compatible) — sin dependencias extra.
