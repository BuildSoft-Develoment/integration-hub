# Evidencia: adapter productivo de secret manager (HashiCorp Vault / OpenBao KV v2) - 2026-07-02

Cierra el gap revisado: no había adapter productivo contra un secret manager corporativo
(solo el File Vault local de dev). Se añade un adapter a **HashiCorp Vault / OpenBao (KV v2)**
sobre el SPI existente `SecretValueProvider`, sin tocar el resto de la resolución.

## Diseño (aditivo, sin colisión)

- Nuevo scheme **`vaultkv`** (referencia `${vaultkv:area/resource/field}`), independiente del
  File Vault local (`secret`/`vault`) → no hay ambigüedad de proveedor ni cambio de orden.
- `SecretResolver` ya inyecta `Instance<SecretValueProvider>` (auto-colecta beans CDI), así
  que el nuevo `@ApplicationScoped VaultSecretValueProvider` se registra solo.

## Cambios

- `service/secret/VaultSecretClient` (interfaz) + `HttpVaultSecretClient` (`@ApplicationScoped`):
  cliente KV v2 sobre `java.net.http.HttpClient` — `GET {address}/v1/{mount}/data/{path}` con
  header `X-Vault-Token`, parsea `data.data`. **Deshabilitado por defecto**; ante error,
  no-configurado o !=200 devuelve vacío (fail-safe). Doble constructor: CDI con
  `Optional<String>` (evita el sentinel `defaultValue=""` que hace la propiedad *requerida*)
  y directo con `String` para tests.
- `service/secret/VaultSecretValueProvider` (`SecretValueProvider`): `supports("vaultkv")`,
  parsea `area/resource/field`, resuelve `field` del secreto KV en `area/resource`.
- `JsonConfigurationMapper`: `SECRET_PATTERN` ahora reconoce `vaultkv`.
- `application.properties`: config documentada `integrationhub.secrets.vault.*`
  (`enabled=false` por defecto; address/token sin declarar cuando está deshabilitado).

## Pruebas backend

```bash
mvn -pl platform-app test -Dtest=VaultSecretValueProviderTest,HttpVaultSecretClientTest \
  -Dsurefire.failIfNoSpecifiedTests=false
# y regresión de secretos:
mvn -pl platform-app test "-Dtest=*Secret*,JsonConfigurationMapper*,SecretResolver*" ...
```

- Estado: **BUILD SUCCESS**.
  - `VaultSecretValueProviderTest` (5): scheme, resolución de campo, campo ausente, secreto
    ausente, referencia mal formada.
  - `HttpVaultSecretClientTest` (3): **integración real** con `com.sun.net.httpserver.HttpServer`
    como Vault falso — lee KV v2 enviando el `X-Vault-Token` y la ruta correcta; deshabilitado
    → vacío; 404 → vacío.
  - Regresión secretos: **14 passed** (File Vault, resolver, mapper) sin cambios de comportamiento.
- Arranque en vivo: la app recarga **health 200** con los beans Vault (deshabilitados).

## Prueba e2e (regresión, sin superficie UI propia)

La resolución de secretos es interna (no hay pantalla), así que la validación funcional es la
prueba de integración con servidor HTTP falso. Como regresión end-to-end:

```bash
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

- Suite completa: **8 passed (1.8m)** — el nuevo scheme + beans CDI no alteran el
  comportamiento end-to-end de la app.

## Cómo habilitarlo

```properties
integrationhub.secrets.vault.enabled=true
integrationhub.secrets.vault.address=https://vault.corp:8200
integrationhub.secrets.vault.token=<token>
integrationhub.secrets.vault.kv-mount=secret
```
Luego referenciar en configs con `${vaultkv:payments/acme-bank/apiKey}`.

## Siguientes (mismo SPI)

- Adapters análogos para AWS Secrets Manager / GCP Secret Manager / Azure Key Vault: cada uno
  es un nuevo `SecretValueProvider` (+ scheme + cliente SDK), sin tocar el resto.
