# Evidencia auditoria a11y de la consola /plugins - 2026-07-01

Cierra la auditoria de accesibilidad de la consola de plugins: foco visible por
teclado, operabilidad por teclado de los controles, y anuncio de estados a lectores
de pantalla.

## Alcance

- **Foco visible**: anillo `:focus-visible` (2px, `--ih-accent`, offset 2px) en chips
  de filtro, botones y inputs. Antes se dependia del outline por defecto del navegador
  (a menudo suprimido por resets de estilo).
- **Operabilidad por teclado**: los chips y acciones son `<button>` nativos, por lo que
  Tab/Enter/Espacio funcionan sin handlers extra; se verifica en e2e.
- **Anuncios a lectores de pantalla**:
  - `aria-busy` en la vista raiz mientras una accion (activar/desactivar/instalar/
    recargar) esta en curso.
  - `role="status" aria-live="polite"` en el resultado de previsualizacion de
    marketplace, para anunciar el descriptor previsualizado.
  - (Ya existentes) `role="status"` en carga backend y `role="alert"` en errores.
- **Contraste**: los badges y chips usan los tokens de estado del sistema
  (`--ih-status-*`, `--ih-accent`), disenados para contraste AA en claro y oscuro.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - `[attr.aria-busy]="busy()"` en `section.plugin-diagnostics-page`.
  - `role="status" aria-live="polite"` en la tabla de preview de marketplace.
  - Regla `:focus-visible` para `.plugins-chip`/`.plugins-btn`/`.plugins-input`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **371 passed** (+1 nuevo:
  "exposes aria-busy on the view while an action is in progress").

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **3 passed (1.8m)**.
- El test "shows the plugin management console" ahora verifica a11y por teclado:
  enfoca el chip "Instalados/Installed", pulsa **Enter** -> `aria-pressed="true"`, y
  comprueba que el foco muestra outline visible (`outlineWidth > 0`).

## Estado acumulado de la consola /plugins

- Diagnostico front (vista unificada filtrable) + backend, refresh/reload.
- Activar/desactivar (confirmacion de dos pasos), versiones (activar/rollback),
  marketplace (preview + install desde fuera).
- Badges/controles con design tokens (dark mode) + foco visible + aria-busy/live.

## Riesgo residual / siguientes incrementos

- Metricas de canary de solo lectura: **bloqueado** hasta exponer un GET en el backend
  (hoy solo hay POST de registro de promocion). Es el unico pendiente que requiere
  trabajo de backend.
