# Evidencia verificacion de procedencia de remotes (ADR-013) - 2026-06-27

Segundo incremento de [ADR-013](../../fase-3-arquitectura/adr/ADR-013-frontend-module-federation-remote-plugins.md):
endurece el gate del bloque `remote` con verificacion de formato de `integrity`
(SRI) y de firma ligada a un firmante de confianza, sin cargar codigo todavia.

## Alcance

- `integrity` debe ser un hash SRI valido (`sha256|sha384|sha512-<base64>`).
- `signature` debe tener formato `keyId:base64` y su `keyId` debe estar en la
  allowlist de claves de confianza.
- Mismas reglas de formato en el build gate; allowlist de claves solo en runtime.

## Cambios verificados

- `app-plugin-runtime.registry.ts`:
  - `APP_PLUGIN_REMOTE_TRUSTED_KEYS` + `provideAppPluginRemoteTrustedKeys(...)`
    (fail-safe vacio).
  - `assertExternalRemoteIsTrusted(...)` ahora valida, en orden: https, presencia,
    formato SRI de `integrity`, origen allowlisted y `keyId` de la firma confiable.
  - Helpers `isSubresourceIntegrity(...)` y `signatureKeyId(...)`.
- `validate-plugin-catalog.js` (`validatePluginRemote`): valida formato SRI de
  `integrity` y formato `keyId:base64` de `signature`.

## Casos de prueba

Build gate (`validate-plugin-catalog.spec.js`):
- Acepta `remote` con `integrity` SRI y `signature` `keyId:base64`.
- Rechaza `integrity` SRI malformada y `signature` sin `keyId`.

Runtime (`app-plugin-runtime.registry.spec.ts`):
- Acepta un remoto de origen allowlisted firmado por una clave de confianza.
- Cuarentena: origen no allowlisted.
- Cuarentena: falta `signature`.
- Cuarentena: `integrity` no es un hash SRI valido.
- Cuarentena: firmado por una clave no confiable (`keyId` fuera de la allowlist).
- Cuarentena por defecto cuando no hay origenes configurados (fail-safe).

## Validacion de catalogo y tooling

### Comando

```bash
node --test scripts/validate-plugin-catalog.spec.js scripts/manage-plugin-catalog.spec.js
```

### Resultado

- Estado: PASS.
- Tests Node: 27 passed, 0 failed.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 76 passed.
- Tests: 345 passed, 0 failed.

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `1.24 MB`. Estimated transfer initial: `246.70 kB`.

## Riesgo residual

- Se gobierna formato de `integrity` e identidad del firmante (`keyId` confiable),
  pero la verificacion criptografica de los bytes de la firma y del hash contra el
  `remoteEntry` descargado se hace al cargar (asincrona) y queda pendiente.
- No se carga ni monta codigo todavia.
- Pendiente: plugin de build, montaje Module Federation, limite de error y estado
  `degraded` en `diagnostics`.
```
