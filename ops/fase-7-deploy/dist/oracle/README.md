# Despliegue Oracle Cloud (OKE + OCIR)

Perfil: `prod,oracle` · Secretos: **OCI Vault** (CSI) · Staging: **Object Storage (S3-compat)** · MQ: **OCI Streaming (Kafka)**.

```bash
cd terraform && terraform init && terraform apply -var compartment_ocid=ocid1.compartment...
# imagen: CI (cloud=oracle) o `mvn ... -Pnative` + docker build -f ../common/Dockerfile.native ... (ver README raiz)
helm upgrade --install ih ../common/helm/integration-hub -f values-oracle.yaml --set image.tag=<tag>
```

- Edita `values-oracle.yaml`: `<REGION_KEY>`, `<TENANCY_NAMESPACE>`, endpoint S3, dominio.
- Object Storage se usa vía la API **S3-compatible** de OCI (reutiliza `quarkus-amazon-s3`,
  `path-style-access=true`).
- En el **catálogo de fuentes** existe el tipo dedicado `OCI_OBJECT_STORAGE` (fachada sobre el
  provider S3): config amigable `namespace` + `region` + `bucket` + Customer Secret Keys, con el
  endpoint compat derivado automáticamente (y `endpoint` explícito opcional para tests/emulador).
- Crear el `ocir-secret` (docker-registry) con el auth token de OCIR para `imagePullSecrets`.
