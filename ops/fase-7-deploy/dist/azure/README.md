# Despliegue Azure (AKS + ACR)

Perfil: `prod,azure` · Secretos: **Key Vault** (CSI + Workload Identity) · Staging: **Blob** · MQ: **Event Hubs (Kafka)**.

```bash
cd terraform && terraform init && terraform apply -var resource_group=ih-rg   # -> login_server
# imagen: CI (cloud=azure) o `mvn ... -Pnative` + docker build -f ../common/Dockerfile.native ... (ver README raiz)
helm upgrade --install ih ../common/helm/integration-hub -f values-azure.yaml --set image.tag=<tag>
```

- Edita `values-azure.yaml`: `<ACR_NAME>`, `<MANAGED_IDENTITY_CLIENT_ID>`, dominio.
- Key Vault → Secret `integration-hub-secrets` vía Secrets Store CSI (provider azure) +
  Workload Identity en la ServiceAccount.
