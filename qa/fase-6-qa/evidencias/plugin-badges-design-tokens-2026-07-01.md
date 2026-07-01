# Evidencia badges/controles con design tokens - 2026-07-01

Reemplaza los colores hex hardcodeados de la consola `/plugins` por los design
tokens de estado del sistema (`--ih-status-*`), alineando la UI al tema y, sobre
todo, habilitando el **dark mode** en esta vista.

## Causa raiz (bug latente de theming)

Los estilos usaban tokens inexistentes con fallback hex:
`var(--border, #cbd5e1)`, `var(--surface-1, #fff)`, `var(--surface-2, #fff)`.
Como `--border`/`--surface-1`/`--surface-2` no existen en el sistema (los reales son
`--ih-border-strong`, `--ih-surface-alt`), siempre caian al hex claro -> la vista no
respetaba el tema ni el modo oscuro. Los badges usaban hex fijos (#dcfce7, #fee2e2...).

## Cambios verificados

- `plugin-diagnostics-page.component.ts` (solo `styles`):
  - Badges por `data-status` mapeados a tokens de estado:
    - `active` -> `--ih-status-success` sobre `--ih-status-success-bg`.
    - `degraded` -> `--ih-status-error` sobre `--ih-status-error-bg`.
    - `untrusted` -> `--ih-status-warning` sobre `--ih-status-warning-bg`.
    - `inactive` -> `--ih-status-neutral` sobre `color-mix(... 14%, transparent)`.
  - Botones/inputs: bordes `--ih-border-strong`, superficie `--ih-surface-alt`,
    radios `--ih-radius-sm`/`--ih-radius-pill`, tipografia `--ih-font-size-*`,
    peso `--ih-font-weight-medium`; boton peligro con `--ih-status-error`.
  - Todos los tokens tienen override en `[data-theme='dark']`, por lo que la vista
    ahora se adapta al modo oscuro.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **369 passed**, 0 failed.
  (Cambio solo de estilos; el render de badges por estado ya estaba cubierto.)

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium -g "plugin"
```

### Resultado

- Estado: **PASS** (2 passed, 26.7s):
  - "shows the plugin management console with backend controls".
  - "runs backend plugin actions end-to-end (mocked backend)" (render del descriptor
    con badge de estado + acciones).

## Riesgo residual / siguientes incrementos

- Metricas de canary de solo lectura (requiere GET en el backend primero).
- Unificar las 4 tablas de diagnostico en una vista filtrable.
- Auditoria a11y completa (contraste medido, foco visible, navegacion por teclado).
