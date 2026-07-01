# Evidencia consola de gestion de plugins (frontend) - 2026-07-01

Cierra la brecha #1 de UI/UX detectada en el analisis de arquitectura: el backend
expone un ciclo de vida completo de plugins por REST (`/api/plugins/...`), pero la
vista `/plugins` era de solo lectura. Este incremento anade gestion sobre ese API.

## Alcance

- Refresh + reload del diagnostico de plugins backend.
- Badges de estado con color (ACTIVE/DEGRADED/UNTRUSTED), color + texto por a11y.
- Acciones por plugin: activar/desactivar, contra el API backend, con refetch.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - `refreshBackend()` -> re-carga `GET /api/plugins`.
  - `reloadBackend()` -> `POST /api/plugins/reload` + refetch.
  - `activate(id)` -> `POST /api/plugins/{id}/activate` + refetch.
  - `deactivate(id)` -> `POST /api/plugins/{id}/deactivate` + refetch.
  - Señal `busy` que deshabilita los botones durante una accion (evita reentradas).
  - Seccion backend: cabecera con botones Refrescar/Recargar; columna de acciones
    con Activar/Desactivar segun estado; `plugin-badge` con estilo por `data-status`.
- i18n en/es: `plugins.col.actions`, `plugins.refresh`, `plugins.reload`,
  `plugins.activate`, `plugins.deactivate`.

## Casos de prueba (plugin-diagnostics-page.component.spec.ts)

- Reload backend: `POST /api/plugins/reload` y luego refetch de `/api/plugins`.
- Desactivar plugin: `POST /api/plugins/acme/deactivate` y luego refetch.
- (Se conservan los casos previos de render de diagnostico front/back.)

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 80 passed.
- Tests: 363 passed, 0 failed (2 casos nuevos de acciones de gestion).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `172.39 kB`. Estimated transfer initial: `26.77 kB`.

## Riesgo residual / siguientes incrementos de UI/UX

- Falta exponer marketplace (preview + install) y el dashboard de canary por
  metricas (`.../versions/{version}/canary/metrics`) en la UI; el API ya existe.
- Confirmacion en dos pasos para desactivar (hoy accion directa); reutilizar el
  gate de confirmacion del shell.
- Unificar las 4 tablas de diagnostico en una vista filtrable por capa/estado.
- Badges con tokens de diseno (hoy colores fijos claros); auditoria WCAG + aria-live.
