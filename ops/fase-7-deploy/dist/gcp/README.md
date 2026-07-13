# Despliegue GCP (GKE + Artifact Registry)

Perfil: `prod,gcp` · Secretos: **Secret Manager** (CSI + Workload Identity) · Staging: **GCS** · DB: **Cloud SQL**.

```bash
cd terraform && terraform init && terraform apply -var project_id=mi-proyecto   # -> repository_url
# imagen: CI (cloud=gcp) o `mvn ... -Pnative` + docker build -f ../common/Dockerfile.native ... (ver README raiz)
helm upgrade --install ih ../common/helm/integration-hub -f values-gcp.yaml --set image.tag=<tag>
```

- Edita `values-gcp.yaml`: `<PROJECT_ID>`, `<REGION>`, SA de GCP, dominio.
- Cloud SQL vía Auth Proxy sidecar (`DB_JDBC_URL=127.0.0.1:5432`).
- Secret Manager → `integration-hub-secrets` vía CSI + Workload Identity.
