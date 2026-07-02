# Evidencia #3: adapters GCP Secret Manager + Azure Key Vault - 2026-07-02

Tercer y cuarto backend de secretos sobre el mismo SPI `SecretValueProvider`, completando
Vault + AWS + GCP + Azure. Confirma que añadir un secret manager es un incremento acotado.

## Diseño (HTTP + Bearer, sin SDK/dev-services)

- GCP y Azure usan **REST + `Authorization: Bearer <token>`** (patrón del adapter Vault),
  evitando SDKs cloud pesados y dev-services (localstack) que ralentizarían el arranque.
- Schemes aditivos **`gcpsecret`** y **`azuresecret`** (`${gcpsecret:secret/field}`,
  `${azuresecret:secret/field}`), sin colisión con `secret`/`vault`/`vaultkv`/`awssecret`.
- `SecretResolver` auto-colecta los nuevos `@ApplicationScoped` providers vía CDI.
- Deshabilitados por defecto; fail-safe (error/no-config/no-200 → vacío).

## Cambios

- GCP: `GcpSecretClient` + `HttpGcpSecretClient`
  (`GET {base}/v1/projects/{p}/secrets/{id}/versions/latest:access` → base64 `payload.data`
  → JSON) + `GcpSecretManagerValueProvider`.
- Azure: `AzureSecretClient` + `HttpAzureSecretClient`
  (`GET {vault}/secrets/{name}?api-version=7.4` → `value` JSON) + `AzureKeyVaultValueProvider`.
- `JsonConfigurationMapper`: `SECRET_PATTERN` reconoce `gcpsecret` y `azuresecret`.
- `application.properties`: config documentada (`integrationhub.secrets.gcp.*` /
  `integrationhub.secrets.azure.*`, deshabilitados).

## Pruebas backend

```bash
mvn -pl platform-app test "-Dtest=*Secret*,JsonConfigurationMapperTest"
```

- Estado: **BUILD SUCCESS, 33 tests**:
  - GCP/Azure providers (4+4): scheme, resolución de campo, ausencia, referencia mal formada.
  - GCP/Azure clients (2+2): **integración con servidor HTTP falso** — GCP decodifica el
    base64 `payload.data` y parsea JSON enviando el Bearer; Azure parsea el `value` JSON con
    `api-version=7.4` y Bearer; deshabilitado/no-config → vacío.
  - `JsonConfigurationMapperTest` (+1): cadena completa `${gcpsecret:...}`/`${azuresecret:...}`
    a través del mapper.
  - Regresión Vault/AWS/file-vault: verde.
- Arranque en vivo: **health 200** con los 6 beans nuevos cargados.

## Nota sobre tokens (honesta)

Los tokens de GCP (OAuth) y Azure (AAD) son de vida corta; se aportan por config. En
producción deben refrescarse fuera de banda (token-supplier/sidecar) o migrar estos clientes
a los SDKs oficiales para refresco automático de credenciales. El SPI no cambia: solo el
backend que materializa el token.

## Estado del SPI de secretos

- 4 backends: File Vault local (dev), HashiCorp Vault/OpenBao, AWS Secrets Manager,
  GCP Secret Manager, Azure Key Vault — todos sobre `SecretValueProvider`, aditivos y
  deshabilitados por defecto.
