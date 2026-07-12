# Despliegue on-premise (K8s en PRO / Compose)

Perfil: `prod,onprem` · Secretos: **file-vault / HashiCorp Vault** · Staging: **MinIO (S3-compat)** · Todo self-hosted.
Coherente con `stacks/stack-operacion-onprem.md` (Compose en DEV, Kubernetes en PRO).

> ✅ **Nativo verificado** (arranque 1.5s, ~70 MiB RAM). Requisitos: Quarkus ≥3.37.2 y builder
> con ≥12 GB RAM — fixes y detalle en [`../NATIVE-STATUS.md`](../NATIVE-STATUS.md).
> Homologar SFTP (pagos MT101) en nativo antes de producción.

## Opción A — Docker Compose (imagen NATIVA, verificada)
```bash
# build DESDE LA RAIZ DEL REPO (requiere Docker con >=12 GB de RAM; ver NATIVE-STATUS.md)
mvn -pl platform-app -am clean package -DskipTests -Pnative -Dquarkus.native.container-build=true
docker build -f ops/fase-7-deploy/dist/common/Dockerfile.native \
  --build-arg RUNNER=$(ls platform-app/target/*-runner) -t integration-hub:native .
# luego, dentro de esta carpeta:
cd ops/fase-7-deploy/dist/onprem
cp .env.example .env   # completa DB_*, OIDC_CLIENT_SECRET
docker compose -f docker-compose.prod.yml --env-file .env up -d
```
Verificado: arranca 1.5s, ~70 MiB RAM, `/q/health/ready` → `UP` (DB + messaging), UI en `/` → 200.

**Alternativa JVM** (build más liviano, ~7s de arranque): `mvn -pl platform-app -am clean package
-DskipTests` + `docker build -f ops/fase-7-deploy/dist/common/Dockerfile.jvm -t integration-hub:jvm-onprem .`
y cambiar `image:` en el compose.

## Opción B — Kubernetes
```bash
# push a tu registry privado, luego:
helm upgrade --install ih ../common/helm/integration-hub -f values-onprem.yaml --set image.tag=<tag>
```

- Edita `values-onprem.yaml`: `<REGISTRY_PRIVADO>`, host de ingress, endpoint MinIO.
- Secretos: inyéctalos al Secret `integration-hub-secrets` (desde el file-vault del
  proyecto o HashiCorp Vault); nunca en claro en el repo.
