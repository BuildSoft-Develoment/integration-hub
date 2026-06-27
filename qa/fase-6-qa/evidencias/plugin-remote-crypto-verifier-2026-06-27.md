# Evidencia verificacion criptografica de remotes (ADR-013) - 2026-06-27

Tercer incremento de [ADR-013](../../fase-3-arquitectura/adr/ADR-013-frontend-module-federation-remote-plugins.md):
verificacion criptografica real de los bytes en el momento de carga, complementaria
al gate sincrono de metadata.

## Alcance

- Descarga del `remoteEntry.json` y comparacion del hash SRI real contra
  `integrity`.
- Verificacion de la firma (ECDSA P-256 / SHA-256) sobre el payload canonico
  `id@version:integrity` contra la clave publica JWK del `keyId`.
- `fetch` y `crypto` inyectables para pruebas offline y SSR.

## Cambios verificados

- Nuevo `AppPluginRemoteVerifier` (`app-plugin-remote.verifier.ts`):
  - `APP_PLUGIN_REMOTE_KEYS` + `provideAppPluginRemoteKeys(...)`: registro de
    claves publicas JWK por `keyId`.
  - `APP_PLUGIN_REMOTE_FETCH` y `APP_PLUGIN_CRYPTO`: seams de inyeccion.
  - `canonicalRemotePayload(...)`: payload canonico `id@version:integrity` que
    liga la firma a una identidad y contenido concretos (evita reuso de firma).
  - `verify(...)` devuelve `{ ok, reason }` con motivos `fetch-failed`,
    `integrity-mismatch`, `untrusted-key`, `invalid-signature`, `malformed`.
- Exportado desde el barrel de `shared/ui`.

## Casos de prueba (app-plugin-remote.verifier.spec.ts)

Generan un par ECDSA P-256 real, firman el payload canonico y verifican via el
servicio (offline, con `fetch`/`crypto` inyectados):

- Verifica un remoto con `integrity` coincidente y firma de clave confiable.
- Falla con `integrity-mismatch` cuando el contenido descargado no coincide.
- Falla con `untrusted-key` cuando el `keyId` no esta en el registro de claves.
- Falla con `invalid-signature` cuando la firma es valida pero ligada a otra
  version (payload canonico distinto).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 77 passed.
- Tests: 349 passed, 0 failed (4 casos nuevos del verificador criptografico).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `1.24 MB`. Estimated transfer initial: `247.29 kB`.

## Riesgo residual

- El verificador esta listo pero aun no se invoca desde un loader: se ejecutara
  justo antes de montar el modulo via Native Federation (`loadRemoteModule`).
- Pendiente: cableado de Native Federation (`withNativeFederation`, `shareAll`),
  montaje del remoto, limite de error y estado `degraded` en `diagnostics`.
- La rotacion de claves y su distribucion (provider `APP_PLUGIN_REMOTE_KEYS`)
  queda como tarea operativa.
```
