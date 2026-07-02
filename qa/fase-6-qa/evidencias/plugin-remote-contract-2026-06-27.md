# Evidencia contrato remote de plugins (ADR-013) - 2026-06-27

Primer incremento de [ADR-013](../../fase-3-arquitectura/adr/ADR-013-frontend-module-federation-remote-plugins.md)
(Module Federation), de menor riesgo: el contrato `remote` y su validacion como
metadata gobernada, sin cargar codigo todavia.

## Alcance

- Contrato `AppPluginRemote` y campo `remote` en `AppPluginManifest`.
- JSON Schema + build gate para el bloque `remote`.
- Runtime: allowlist de origenes (fail-safe) y cuarentena de remotos no confiables.

## Cambios verificados

- `app-navigation.models.ts`: `AppPluginRemote` (`url`, `exposedModule`,
  `integrity`, `signature`, `sharedDependencies`) y `remote?` en el manifest.
- `catalog.schema.json`: `$defs.pluginRemote` y propiedad `remote` (https
  obligatorio, campos requeridos, `additionalProperties: false`).
- `validate-plugin-catalog.js`: `validatePluginRemote` exige https,
  `exposedModule`, `integrity`, `signature` y valida `sharedDependencies`.
- `app-plugin-runtime.registry.ts`:
  - `APP_PLUGIN_REMOTE_ALLOWED_ORIGINS` + `provideAppPluginRemoteOrigins(...)`.
  - `assertExternalRemoteIsTrusted(...)`: https + procedencia completa + origen
    en allowlist; en caso contrario, cuarentena (no lanza en la via resiliente).
  - Saneo del bloque `remote` en `sanitizeExternalManifest`.

## Casos de prueba

Build gate (`validate-plugin-catalog.spec.js`):
- Acepta un manifest con `remote` bien formado.
- Rechaza `remote` con url no https y/o `integrity` vacio.

Runtime (`app-plugin-runtime.registry.spec.ts`):
- Acepta un remoto de origen allowlisted con procedencia completa.
- Pone en cuarentena un remoto de origen no allowlisted.
- Pone en cuarentena un remoto sin `signature`.
- Por defecto (sin allowlist configurada) rechaza cualquier remoto (fail-safe).

## Validacion de catalogo y tooling

### Comando

```bash
node --test scripts/validate-plugin-catalog.spec.js scripts/manage-plugin-catalog.spec.js
```

### Resultado

- Estado: PASS.
- Tests Node: 26 passed, 0 failed (2 casos nuevos del contrato remote).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 76 passed.
- Tests: 343 passed, 0 failed (4 casos nuevos del runtime remote).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `1.24 MB`. Estimated transfer initial: `246.78 kB`.

## Riesgo residual

- Se exige presencia y formato de `integrity`/`signature`, pero aun NO se verifica
  la firma contra una clave publica ni el hash SRI real: eso llega con la carga del
  `remoteEntry`.
- No se carga ni monta codigo todavia; el descriptor `remote` queda registrado
  como metadata para el loader futuro.
- Pendiente: plugin de build (Native Federation), montaje Module Federation,
  limite de error y estado `degraded` en `diagnostics`.
```
