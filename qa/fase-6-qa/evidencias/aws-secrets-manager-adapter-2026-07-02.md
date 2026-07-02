# Evidencia: adapter productivo AWS Secrets Manager - 2026-07-02

Segundo adapter corporativo sobre el mismo SPI `SecretValueProvider`, reutilizando el
patrón ya validado con HashiCorp Vault. Demuestra que añadir un secret manager es un
incremento acotado (nuevo provider + scheme + cliente), sin tocar el resto.

## Diseño (aditivo, sin colisión, sin acoplar el arranque)

- Nuevo scheme **`awssecret`** (`${awssecret:area/resource/field}`), independiente de
  `secret`/`vault` (file-vault) y `vaultkv` (HashiCorp) → sin ambigüedad de proveedor.
- `SecretResolver` auto-colecta el nuevo `@ApplicationScoped` provider vía CDI.
- El cliente SDK se inyecta **lazy** (`Instance<SecretsManagerClient>`) y solo se resuelve
  cuando el adapter está habilitado; **deshabilitado por defecto** y con
  `quarkus.secretsmanager.devservices.enabled=false`, de modo que no se crea el cliente ni
  se levanta localstack en el arranque.

## Cambios

- `platform-app/pom.xml`: dependencia `io.quarkiverse.amazonservices:quarkus-amazon-secretsmanager`
  (reusa el `url-connection-client` ya presente).
- `service/secret/AwsSecretClient` (interfaz) + `SdkAwsSecretClient` (`@ApplicationScoped`):
  lee el `SecretString` (JSON) del secreto y devuelve sus campos; fail-safe (deshabilitado,
  cliente no satisfecho, secreto ausente o no-JSON → vacío).
- `service/secret/AwsSecretManagerValueProvider` (`SecretValueProvider`): `supports("awssecret")`,
  parsea `area/resource/field`, resuelve `field` del secreto JSON `area/resource`.
- `JsonConfigurationMapper`: `SECRET_PATTERN` ahora reconoce `awssecret`.
- `application.properties`: `integrationhub.secrets.aws.enabled=false` +
  `quarkus.secretsmanager.devservices.enabled=false`, documentado.

## Pruebas backend

```bash
mvn -pl platform-app test -Dtest=AwsSecretManagerValueProviderTest,SdkAwsSecretClientTest,\
JsonConfigurationMapperTest,VaultSecretValueProviderTest -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS**, **17 tests**:
  - `AwsSecretManagerValueProviderTest` (4): scheme, resolución de campo, ausencias, referencia mal formada.
  - `SdkAwsSecretClientTest` (4): parseo del `SecretString` JSON (mock de `SecretsManagerClient`);
    deshabilitado → vacío sin tocar el cliente; cliente no satisfecho → vacío; secreto no-JSON → vacío.
  - `JsonConfigurationMapperTest` (4, +1): cadena completa `${awssecret:...}` a través del mapper,
    coexistiendo con `vaultkv` y file-vault sin colisión.
- Arranque en vivo: **health 200** con la extensión AWS cargada (features `amazon-sdk-secretsmanager`,
  `aws-secrets-manager-config-source`); sin errores relacionados con secrets.

## Prueba e2e (regresión)

```bash
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

- Suite completa: **8 passed (1.8m)** — la nueva extensión + beans no alteran el comportamiento
  end-to-end.

## Cómo habilitarlo

```properties
integrationhub.secrets.aws.enabled=true
# + configuración estándar AWS (quarkus.secretsmanager.* / región / cadena de credenciales)
```
Referenciar con `${awssecret:payments/acme-bank/apiKey}`.

## Nota (hallazgos preexistentes, ajenos a este cambio)

- Validación de schema Hibernate: `missing column [bodyJson] in plugin_marketplace_catalog_cache`
  (drift entidad/migración V72). No fatal (app en 200). Fuera del alcance de este cambio.
- El SPI ya soporta 3 backends (file-vault local, HashiCorp Vault, AWS Secrets Manager);
  GCP/Azure serían análogos.
