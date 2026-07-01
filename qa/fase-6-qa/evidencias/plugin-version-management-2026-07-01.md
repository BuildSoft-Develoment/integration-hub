# Evidencia gestion de versiones de plugins en la UI + e2e - 2026-07-01

Cierra el ultimo bloque accionable del ciclo de vida de plugins backend en la UI:
activar una version concreta (promover/rollback), consumiendo el API existente.

## Alcance

- Seccion Versiones: lista de versiones por plugin (id, version, canal, estado).
- Badge activa/inactiva.
- Accion "Activar version" para versiones inactivas (promover o rollback a previa).

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - Interfaces `BackendPluginVersion` + `versions` en `BackendPluginDiagnostics`.
  - `backendVersions` (computed sobre el diagnostico).
  - `activateVersion(id, version)` -> `POST /api/plugins/{id}/versions/{version}/activate`
    + refetch (via `runAction`).
  - Seccion Versiones con tabla + badge (`active`/`inactive`) + boton activar.
- i18n en/es: `plugins.versions`, `plugins.empty.versions`, `plugins.col.channel`,
  `plugins.version.active`, `plugins.version.inactive`, `plugins.activateVersion`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 80 passed.
- Tests: 369 passed, 0 failed (2 nuevos: activar version + render de versiones con
  accion para las inactivas).

## Prueba e2e (Playwright, contra el stack real)

### Comando

```bash
# stack levantado con start-platform-stack.cmd (localhost:8080)
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium \
  -g "plugin management console"
```

### Resultado

- Estado: **PASS** (chromium, 1 passed, ~5.5s).
- Verifica en `/#/plugins`: heading Plugins, controles Refrescar/Recargar, seccion
  **Versiones**, seccion **Marketplace** con Previsualizar (autenticado en Keycloak).
- La primera navegacion tras cambiar el frontend dispara el rebuild de Quinoa
  (Quarkus dev live-reload); tras servir el nuevo build, la e2e pasa.

## Estado acumulado de la consola /plugins

- Diagnostico front + back, refresh/reload, badges de estado.
- Activar / desactivar (con confirmacion de dos pasos).
- Marketplace: preview + install desde fuera.
- Versiones: activar/rollback por version.

## Riesgo residual / siguientes incrementos

- Lectura de metricas de canary (hoy solo hay POST de registro; falta un GET para
  un dashboard).
- e2e del flujo de accion (install/activate) con backend mockeado (`page.route`).
- Estabilizar el smoke e2e preexistente; unificar tablas; design tokens; a11y.
