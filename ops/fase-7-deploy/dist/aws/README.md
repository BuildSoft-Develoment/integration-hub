# Despliegue AWS (EKS + ECR)

Perfil: `prod,aws` · Secretos: **Secrets Manager** (IRSA) · Staging: **S3** · MQ: **MSK**.

```bash
# 1. registry
cd terraform && terraform init && terraform apply -var region=us-east-1   # -> repository_url

# 2. imagen  -- DESDE LA RAIZ DEL REPO  (o via CI: Actions -> Release deploy -> cloud=aws)
mvn -pl platform-app -am clean package -DskipTests -Pnative -Dquarkus.native.container-build=true
docker build -f ops/fase-7-deploy/dist/common/Dockerfile.native \
  --build-arg RUNNER=$(ls platform-app/target/*-runner) -t <ecr_url>:<tag> .
docker push <ecr_url>:<tag>

# 3. deploy
helm upgrade --install ih ops/fase-7-deploy/dist/common/helm/integration-hub \
  -f ops/fase-7-deploy/dist/aws/values-aws.yaml --set image.tag=<tag>
```

- Edita `values-aws.yaml`: `<ACCOUNT_ID>`, `<REGION>`, dominio, ARN del rol IRSA.
- Los secretos (`DB_*`, `OIDC_CLIENT_SECRET`) se montan desde Secrets Manager vía el
  Secrets Store CSI driver hacia el Secret `integration-hub-secrets`.
